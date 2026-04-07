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
  sharedGraph?: DualPath["shared_graph"]
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

  // Layout all nodes with d3-force
  const { nodes: layoutNodes, edges: layoutEdges } = computeForceLayout(
    mergedNodes,
    validEdges,
    {
      concurrentGroups: path.metadata.concurrent_groups,
      pathNodeIds,
      centerNodeId: path.nodes.find((n) => n.order === 0)?.id,
    }
  );

  // Build position lookup for handle routing
  const positionMap = new Map(
    layoutNodes.map((ln) => [ln.id, ln.position])
  );

  // Determine start and target from path nodes only
  const maxOrder = Math.max(...path.nodes.map((n) => n.order), 0);
  const startNodeIds = new Set(
    path.nodes.filter((n) => n.order === 0).map((n) => n.id)
  );
  const sourceIds = new Set(
    path.edges.filter((e) => e.type === "PREREQUISITE_OF").map((e) => e.source)
  );
  const targetNodeIds = new Set(
    path.nodes
      .filter((n) => !sourceIds.has(n.id) && n.order >= maxOrder * 0.7)
      .map((n) => n.id)
  );

  const rfNodes: Node[] = layoutNodes.map((ln) => {
    const isOnPath = pathNodeIds.has(ln.id);
    const savedStatus = progressMap[ln.id];
    const effectiveStatus = savedStatus || ln.data.status;

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
      },
      animated: le.data.on_recommended_path,
    };
  });

  return { nodes: rfNodes, edges: rfEdges };
}
