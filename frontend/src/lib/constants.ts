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
  cat_security: { color: "#E74C3C", icon: "shield" },
  cat_cloud: { color: "#3498DB", icon: "cloud" },
  cat_data_eng: { color: "#E67E22", icon: "database" },
  cat_testing: { color: "#2ECC71", icon: "check-circle" },
};

export const GRAPH_CONFIG = {
  nodeWidth: 200,
  nodeHeight: 90,
  rankSep: 140,
  nodeSep: 60,
};

// d3-force layout configuration for skill map
export const FORCE_LAYOUT_CONFIG = {
  simulationTicks: 150,
  alphaDecay: 0.018,
  velocityDecay: 0.3,
  chargeStrength: -500,
  pathNodeCharge: -650,
  linkDistance: 260,
  linkStrength: 0.25,
  collisionRadius: 180,
  clusterStrength: 0.12,
  clusterRadius: 500,
  depthStrength: 0.7,
  depthSpacing: 280,
  pathCenterStrength: 0.1,
  // Anchor strengths for start/goal position fixing
  startAnchorStrength: 0.9,
  goalAnchorStrength: 0.9,
};

// Category cluster angles (radians) — related categories placed adjacent
// Arranged clockwise: CS→Programming→Web→Frontend→Backend→DevOps→Cloud→System→Security→Data→DataEng→AI→Mobile→Testing
export const CATEGORY_CLUSTER_ANGLES: Record<string, number> = {
  cat_cs: 0,                          // 0°
  cat_programming: Math.PI * 0.15,    // 27°
  cat_web: Math.PI * 0.3,             // 54°
  cat_frontend: Math.PI * 0.45,       // 81°
  cat_backend: Math.PI * 0.65,        // 117°
  cat_devops: Math.PI * 0.8,          // 144°
  cat_cloud: Math.PI * 0.95,          // 171°
  cat_system: Math.PI * 1.1,          // 198°
  cat_security: Math.PI * 1.25,       // 225°
  cat_data: Math.PI * 1.4,            // 252°
  cat_data_eng: Math.PI * 1.55,       // 279°
  cat_ai: Math.PI * 1.7,              // 306°
  cat_mobile: Math.PI * 1.82,         // 328°
  cat_testing: Math.PI * 1.94,        // 349°
};
