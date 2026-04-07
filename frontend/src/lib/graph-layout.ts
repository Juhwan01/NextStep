import dagre from "dagre";
import type { PathNode, PathEdge } from "@/types/path";
import { GRAPH_CONFIG } from "./constants";

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

export function computeLayout(
  nodes: PathNode[],
  edges: PathEdge[],
  direction: "TB" | "LR" = "TB"
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: GRAPH_CONFIG.rankSep,
    nodesep: GRAPH_CONFIG.nodeSep,
    marginx: 40,
    marginy: 40,
  });

  // Add nodes
  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: GRAPH_CONFIG.nodeWidth,
      height: GRAPH_CONFIG.nodeHeight,
    });
  });

  // Add edges
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutNodes: LayoutNode[] = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      id: node.id,
      position: {
        x: pos.x - GRAPH_CONFIG.nodeWidth / 2,
        y: pos.y - GRAPH_CONFIG.nodeHeight / 2,
      },
      data: node,
    };
  });

  const layoutEdges: LayoutEdge[] = edges.map((edge, i) => ({
    id: `edge-${edge.source}-${edge.target}-${i}`,
    source: edge.source,
    target: edge.target,
    data: edge,
  }));

  return { nodes: layoutNodes, edges: layoutEdges };
}
