// Color coding for path types
export const PATH_COLORS = {
  fast_track: {
    primary: "#00d4ff",
    glow: "rgba(0, 212, 255, 0.3)",
    bg: "rgba(0, 212, 255, 0.1)",
  },
  fundamentals: {
    primary: "#00ffd5",
    glow: "rgba(0, 255, 213, 0.3)",
    bg: "rgba(0, 255, 213, 0.1)",
  },
} as const;

// Node status colors
export const STATUS_COLORS = {
  completed: { bg: "#10b981", border: "#34d399", text: "#ffffff" },
  in_progress: { bg: "#3b82f6", border: "#60a5fa", text: "#ffffff" },
  not_started: { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.4)" },
  recommended_next: { bg: "rgba(0,212,255,0.1)", border: "#00d4ff", text: "#ffffff" },
} as const;

// Category icons and colors
export const CATEGORY_STYLES: Record<string, { color: string; icon: string }> = {
  cat_programming: { color: "#FF6B6B", icon: "code" },
  cat_web: { color: "#4ECDC4", icon: "globe" },
  cat_frontend: { color: "#45B7D1", icon: "layout" },
  cat_backend: { color: "#96CEB4", icon: "server" },
  cat_devops: { color: "#FFEAA7", icon: "cloud" },
  cat_data: { color: "#DDA0DD", icon: "bar-chart" },
  cat_mobile: { color: "#98D8C8", icon: "smartphone" },
  cat_ai: { color: "#F7DC6F", icon: "cpu" },
  cat_system: { color: "#BB8FCE", icon: "layers" },
  cat_cs: { color: "#85C1E9", icon: "book" },
};

export const GRAPH_CONFIG = {
  nodeWidth: 200,
  nodeHeight: 80,
  rankSep: 80,
  nodeSep: 40,
};
