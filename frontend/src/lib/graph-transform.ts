import type { Node, Edge } from "@xyflow/react";
import type { GeneratedPath } from "@/types/path";
import { computeLayout } from "./graph-layout";
import { STATUS_COLORS, PATH_COLORS, CATEGORY_STYLES } from "./constants";

export function transformToReactFlow(
  path: GeneratedPath,
  pathType: "fast_track" | "fundamentals" = "fast_track"
): { nodes: Node[]; edges: Edge[] } {
  const { nodes: layoutNodes, edges: layoutEdges } = computeLayout(
    path.nodes,
    path.edges
  );

  const colors = PATH_COLORS[pathType];

  const rfNodes: Node[] = layoutNodes.map((ln) => ({
    id: ln.id,
    type: "skillNode",
    position: ln.position,
    data: {
      ...ln.data,
      pathColor: colors.primary,
      categoryStyle: CATEGORY_STYLES[ln.data.category] || { color: "#888", icon: "circle" },
      statusColor: STATUS_COLORS[ln.data.status],
    },
  }));

  const rfEdges: Edge[] = layoutEdges.map((le) => ({
    id: le.id,
    source: le.source,
    target: le.target,
    type: "pathEdge",
    data: {
      ...le.data,
      pathColor: colors.primary,
      glowColor: colors.glow,
    },
    animated: le.data.on_recommended_path,
  }));

  return { nodes: rfNodes, edges: rfEdges };
}
