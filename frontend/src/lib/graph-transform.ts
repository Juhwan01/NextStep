import type { Node, Edge } from "@xyflow/react";
import type { GeneratedPath, DualPath, ProgressMap, SkillNode } from "@/types/path";
import { computeForceLayout } from "./graph-layout";
import { STATUS_COLORS, PATH_COLORS, CATEGORY_STYLES } from "./constants";

/** Compute which handle pair to use based on relative position of source → target */
function computeHandlePair(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number }
): { sourceHandle: string; targetHandle: string } {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;

  let sourceDir: string;
  if (Math.abs(dx) > Math.abs(dy)) {
    sourceDir = dx > 0 ? "right" : "left";
  } else {
    sourceDir = dy > 0 ? "bottom" : "top";
  }

  const opposites: Record<string, string> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  };

  return {
    sourceHandle: `${sourceDir}-source`,
    targetHandle: `${opposites[sourceDir]}-target`,
  };
}

export function transformToReactFlow(
  path: GeneratedPath,
  pathType: "fast_track" | "fundamentals" = "fast_track",
  progressMap: ProgressMap = {},
  sharedGraph?: DualPath["shared_graph"],
  existingNodes?: Node[]
): { nodes: Node[]; edges: Edge[] } {
  const colors = PATH_COLORS[pathType];

  // Build a set of path node IDs for quick lookup
  const pathNodeIds = new Set(path.nodes.map((n) => n.id));

  // Merge nodes: shared_graph background + path foreground
  const allPathNodes = [...path.nodes];
  const backgroundNodes: SkillNode[] = [];

  if (sharedGraph) {
    for (const sn of sharedGraph.nodes) {
      if (!pathNodeIds.has(sn.id)) {
        backgroundNodes.push(sn);
      }
    }
  }

  // Create PathNode-compatible entries for background nodes
  const bgAsPathNodes = backgroundNodes.map((sn) => ({
    ...sn,
    status: "not_started" as const,
    order: -1,
    explanation: { why_needed: "", job_relevance: "", connection_to_next: "" },
  }));

  const mergedNodes = [...allPathNodes, ...bgAsPathNodes];

  // Merge edges: path edges + shared background edges
  const pathEdgeKeys = new Set(
    path.edges.map((e) => `${e.source}->${e.target}`)
  );

  const bgEdges = sharedGraph
    ? sharedGraph.edges.filter(
        (e) => !pathEdgeKeys.has(`${e.source}->${e.target}`)
      )
    : [];

  const mergedEdges = [
    ...path.edges,
    ...bgEdges.map((e) => ({ ...e, on_recommended_path: false })),
  ];

  // Only include edges where both source and target exist in mergedNodes
  const mergedNodeIds = new Set(mergedNodes.map((n) => n.id));
  const validEdges = mergedEdges.filter(
    (e) => mergedNodeIds.has(e.source) && mergedNodeIds.has(e.target)
  );

  // Pre-compute start/goal node IDs for position anchoring
  const startNodeIdForLayout = path.nodes.find((n) => n.order === 0)?.id;
  const maxOrderForLayout = Math.max(...path.nodes.map((n) => n.order), 0);
  const sourceIdsForLayout = new Set(
    path.edges.filter((e) => e.type === "PREREQUISITE_OF").map((e) => e.source)
  );
  const goalNodeIdForLayout = path.nodes.find(
    (n) => !sourceIdsForLayout.has(n.id) && n.order >= maxOrderForLayout * 0.7
  )?.id;

  // Layout: reuse existing positions if available (progress-only update), else compute fresh
  let layoutNodes: import("./graph-layout").LayoutNode[];
  let layoutEdges: import("./graph-layout").LayoutEdge[];

  if (existingNodes && existingNodes.length > 0) {
    // Reuse positions from previous layout — no d3-force re-run
    const existingPositionMap = new Map(existingNodes.map((n) => [n.id, n.position]));
    layoutNodes = mergedNodes.map((mn) => ({
      id: mn.id,
      position: existingPositionMap.get(mn.id) || { x: 0, y: 0 },
      data: mn,
    }));
    layoutEdges = validEdges
      .filter((e) => existingPositionMap.has(e.source) && existingPositionMap.has(e.target))
      .map((edge, i) => ({
        id: `edge-${edge.source}-${edge.target}-${i}`,
        source: edge.source,
        target: edge.target,
        data: edge,
      }));
  } else {
    const result = computeForceLayout(
      mergedNodes,
      validEdges,
      {
        concurrentGroups: path.metadata.concurrent_groups,
        pathNodeIds,
        centerNodeId: startNodeIdForLayout,
        startNodeId: startNodeIdForLayout,
        goalNodeId: goalNodeIdForLayout,
      }
    );
    layoutNodes = result.nodes;
    layoutEdges = result.edges;
  }

  // Build position lookup for handle routing
  const positionMap = new Map(
    layoutNodes.map((ln) => [ln.id, ln.position])
  );

  // Determine start and target from path nodes + backend metadata
  const startNodeIds = new Set(
    path.nodes.filter((n) => n.order === 0).map((n) => n.id)
  );

  // Use backend-provided goal_node_id if available, fallback to heuristic
  const targetNodeIds = new Set<string>();
  if (path.metadata.goal_node_id) {
    targetNodeIds.add(path.metadata.goal_node_id);
  } else {
    const maxOrder = Math.max(...path.nodes.map((n) => n.order), 0);
    const sourceIds = new Set(
      path.edges.filter((e) => e.type === "PREREQUISITE_OF").map((e) => e.source)
    );
    path.nodes
      .filter((n) => !sourceIds.has(n.id) && n.order >= maxOrder * 0.7)
      .forEach((n) => targetNodeIds.add(n.id));
  }

  // --- Progressive unlock: ORDER-BASED sequence ---
  // Unlock is based on learning order, not graph prerequisites.
  // A node is "recommended_next" when ALL nodes at the previous order are completed.
  const completedNodeIds = new Set<string>();
  for (const n of path.nodes) {
    if (progressMap[n.id] === "completed") completedNodeIds.add(n.id);
  }

  // Group path nodes by order
  const orderToNodeIds = new Map<number, string[]>();
  for (const n of path.nodes) {
    if (!orderToNodeIds.has(n.order)) orderToNodeIds.set(n.order, []);
    orderToNodeIds.get(n.order)!.push(n.id);
  }
  const sortedOrders = [...orderToNodeIds.keys()].sort((a, b) => a - b);

  // Find the highest fully-completed order level
  let highestCompletedOrder = -1;
  for (const order of sortedOrders) {
    const ids = orderToNodeIds.get(order)!;
    if (ids.every((id) => completedNodeIds.has(id))) {
      highestCompletedOrder = order;
    } else {
      break;
    }
  }

  // Unlocked nodes: next order after highest completed, or order 0 if nothing completed
  const unlockedNodeIds = new Set<string>();
  const nextOrder = highestCompletedOrder + 1;
  const nextOrderIndex = sortedOrders.indexOf(nextOrder);
  if (nextOrderIndex === -1) {
    // nextOrder doesn't exist exactly, find the first incomplete order
    for (const order of sortedOrders) {
      const ids = orderToNodeIds.get(order)!;
      if (!ids.every((id) => completedNodeIds.has(id))) {
        for (const id of ids) {
          if (!completedNodeIds.has(id) && progressMap[id] !== "in_progress") {
            unlockedNodeIds.add(id);
          }
        }
        break;
      }
    }
  } else {
    for (const id of orderToNodeIds.get(nextOrder) || []) {
      if (!completedNodeIds.has(id) && progressMap[id] !== "in_progress") {
        unlockedNodeIds.add(id);
      }
    }
  }

  // Active edges: ONLY from nodes at highestCompletedOrder → unlocked nodes
  // This prevents ALL completed nodes from pointing to the next recommendation.
  // Only the immediately preceding completed order should show the unlock arrow.
  const highestCompletedOrderNodeIds = new Set(
    orderToNodeIds.get(highestCompletedOrder) || []
  );
  const activeEdgeKeys = new Set<string>();
  const completedEdgeKeys = new Set<string>();
  for (const e of path.edges) {
    if (e.type === "PREREQUISITE_OF" || e.type === "LEARNING_SEQUENCE") {
      const key = `${e.source}->${e.target}`;
      if (
        highestCompletedOrderNodeIds.has(e.source) &&
        completedNodeIds.has(e.source) &&
        unlockedNodeIds.has(e.target)
      ) {
        activeEdgeKeys.add(key);
      }
      if (completedNodeIds.has(e.source) && completedNodeIds.has(e.target)) {
        completedEdgeKeys.add(key);
      }
    }
  }

  const rfNodes: Node[] = layoutNodes.map((ln) => {
    const isOnPath = pathNodeIds.has(ln.id);
    const savedStatus = progressMap[ln.id];
    // Progressive unlock: override status to recommended_next for unlocked nodes
    // Use explicit check — "not_started" is truthy but should NOT block recommended_next
    const effectiveStatus = (savedStatus && savedStatus !== "not_started")
      ? savedStatus
      : (isOnPath && unlockedNodeIds.has(ln.id) ? "recommended_next" : (savedStatus || ln.data.status));

    return {
      id: ln.id,
      type: "skillNode",
      position: ln.position,
      data: {
        ...ln.data,
        status: isOnPath ? effectiveStatus : "not_started",
        pathColor: colors.primary,
        categoryStyle: CATEGORY_STYLES[ln.data.category] || { color: "#888", icon: "circle" },
        statusColor: isOnPath
          ? (STATUS_COLORS[effectiveStatus] || STATUS_COLORS[ln.data.status])
          : STATUS_COLORS["not_started"],
        nodeRole: isOnPath
          ? startNodeIds.has(ln.id)
            ? "start"
            : targetNodeIds.has(ln.id)
              ? "target"
              : "intermediate"
          : "background",
        totalNodes: path.nodes.length,
        isOnPath,
      },
    };
  });

  const rfEdges: Edge[] = layoutEdges.map((le) => {
    const sourcePos = positionMap.get(le.source);
    const targetPos = positionMap.get(le.target);

    // Compute handle routing based on relative node positions
    const handles = sourcePos && targetPos
      ? computeHandlePair(sourcePos, targetPos)
      : { sourceHandle: "bottom-source", targetHandle: "top-target" };

    const edgeKey = `${le.source}->${le.target}`;
    const isUnlockEdge = activeEdgeKeys.has(edgeKey);
    const isCompletedEdge = completedEdgeKeys.has(edgeKey);

    return {
      id: le.id,
      source: le.source,
      target: le.target,
      type: "pathEdge",
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
      data: {
        ...le.data,
        pathColor: colors.primary,
        glowColor: colors.glow,
        isUnlockEdge,
        isCompletedEdge,
      },
      animated: isUnlockEdge || (le.data.on_recommended_path && le.data.type === "LEARNING_SEQUENCE"),
    };
  });

  return { nodes: rfNodes, edges: rfEdges };
}
