import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import type { PathNode, PathEdge } from "@/types/path";
import { FORCE_LAYOUT_CONFIG, CATEGORY_CLUSTER_ANGLES, GRAPH_CONFIG } from "./constants";

export interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  data: PathNode;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  data: PathEdge;
}

interface ForceLayoutOptions {
  concurrentGroups?: string[][];
  pathNodeIds?: Set<string>;
  centerNodeId?: string;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  data: PathNode;
  depth: number;
  isOnPath: boolean;
}

/** Deterministic hash from node ID for consistent jitter */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/** Seeded pseudo-random from hash (deterministic per node ID) */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export function computeForceLayout(
  nodes: PathNode[],
  edges: PathEdge[],
  options: ForceLayoutOptions = {}
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const { concurrentGroups = [], pathNodeIds = new Set(), centerNodeId } = options;
  const config = FORCE_LAYOUT_CONFIG;

  // Step 1: Build depth map from concurrent_groups
  const depthMap = new Map<string, number>();
  concurrentGroups.forEach((group, depth) => {
    group.forEach((nodeId) => depthMap.set(nodeId, depth));
  });

  // For nodes not in concurrent_groups, estimate depth from edges
  const maxGroupDepth = concurrentGroups.length;
  const nodeIdSet = new Set(nodes.map((n) => n.id));
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const edge of edges) {
    if (edge.type === "PREREQUISITE_OF" && nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)) {
      if (!adj.has(edge.source)) adj.set(edge.source, []);
      adj.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  }

  // Assign depth to ungrouped nodes via BFS from roots
  for (const node of nodes) {
    if (!depthMap.has(node.id)) {
      const deg = inDegree.get(node.id) || 0;
      if (deg === 0) {
        depthMap.set(node.id, 0);
      }
    }
  }

  // BFS to propagate depth
  const queue = [...depthMap.entries()].map(([id, d]) => ({ id, depth: d }));
  const visited = new Set(queue.map((q) => q.id));
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    const neighbors = adj.get(id) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const newDepth = depth + 1;
        depthMap.set(neighbor, newDepth);
        visited.add(neighbor);
        queue.push({ id: neighbor, depth: newDepth });
      }
    }
  }

  // Remaining nodes without depth get middle depth
  const midDepth = Math.max(maxGroupDepth, 3) / 2;
  for (const node of nodes) {
    if (!depthMap.has(node.id)) {
      depthMap.set(node.id, Math.round(midDepth));
    }
  }

  // Step 2: Category centroids on a circle
  const getCategoryCentroid = (category: string) => {
    const angle = CATEGORY_CLUSTER_ANGLES[category] ?? 0;
    return {
      x: Math.cos(angle) * config.clusterRadius,
      y: Math.sin(angle) * config.clusterRadius,
    };
  };

  // Step 3: Create simulation nodes with seeded initial positions
  const simNodes: SimNode[] = nodes.map((node) => {
    const depth = depthMap.get(node.id) || 0;
    const centroid = getCategoryCentroid(node.category);
    const hash = hashCode(node.id);
    const jitterX = (seededRandom(hash) - 0.5) * 120;
    const jitterY = (seededRandom(hash + 1) - 0.5) * 80;
    const isOnPath = pathNodeIds.has(node.id);

    return {
      id: node.id,
      data: node,
      depth,
      isOnPath,
      x: centroid.x + jitterX + (isOnPath ? -centroid.x * 0.5 : 0),
      y: depth * config.depthSpacing + jitterY,
    };
  });

  const nodeIndexMap = new Map(simNodes.map((n, i) => [n.id, i]));

  // Step 4: Create simulation links
  const simLinks: SimulationLinkDatum<SimNode>[] = edges
    .filter((e) => nodeIndexMap.has(e.source) && nodeIndexMap.has(e.target))
    .map((e) => ({
      source: nodeIndexMap.get(e.source)!,
      target: nodeIndexMap.get(e.target)!,
    }));

  // Step 5: Build d3-force simulation
  const simulation = forceSimulation<SimNode>(simNodes)
    .force(
      "link",
      forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks)
        .distance(config.linkDistance)
        .strength(config.linkStrength)
    )
    .force(
      "charge",
      forceManyBody<SimNode>().strength((d) =>
        d.isOnPath ? config.pathNodeCharge : config.chargeStrength
      )
    )
    .force("collide", forceCollide<SimNode>(config.collisionRadius))
    .force(
      "depthY",
      forceY<SimNode>((d) => d.depth * config.depthSpacing).strength(config.depthStrength)
    )
    .force(
      "clusterX",
      forceX<SimNode>((d) => getCategoryCentroid(d.data.category).x).strength(config.clusterStrength)
    )
    .force(
      "pathCenter",
      forceX<SimNode>(0).strength((d) =>
        d.isOnPath ? config.pathCenterStrength : 0
      )
    )
    .alphaDecay(config.alphaDecay)
    .velocityDecay(config.velocityDecay)
    .stop();

  // Step 6: Run synchronously
  for (let i = 0; i < config.simulationTicks; i++) {
    simulation.tick();
  }

  // Extract positions
  const layoutNodes: LayoutNode[] = simNodes.map((sn) => ({
    id: sn.id,
    position: {
      x: (sn.x ?? 0) - GRAPH_CONFIG.nodeWidth / 2,
      y: (sn.y ?? 0) - GRAPH_CONFIG.nodeHeight / 2,
    },
    data: sn.data,
  }));

  const layoutEdges: LayoutEdge[] = edges
    .filter((e) => nodeIndexMap.has(e.source) && nodeIndexMap.has(e.target))
    .map((edge, i) => ({
      id: `edge-${edge.source}-${edge.target}-${i}`,
      source: edge.source,
      target: edge.target,
      data: edge,
    }));

  return { nodes: layoutNodes, edges: layoutEdges };
}

/** @deprecated Use computeForceLayout instead */
export function computeLayout(
  nodes: PathNode[],
  edges: PathEdge[],
  direction: "TB" | "LR" = "TB"
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  return computeForceLayout(nodes, edges);
}
