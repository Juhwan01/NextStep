export interface SkillNode {
  id: string;
  name: string;
  name_ko: string;
  category: string;
  difficulty: number;
  market_demand: number;
  estimated_hours: number;
  description: string;
  source: string;
}

export interface PathNode extends SkillNode {
  status: "not_started" | "in_progress" | "completed" | "recommended_next";
  order: number;
  explanation: {
    why_needed: string;
    job_relevance: string;
    connection_to_next: string;
  };
}

export interface PathEdge {
  source: string;
  target: string;
  type: string;
  on_recommended_path: boolean;
  strength: number;
}

export interface PathMetadata {
  total_hours: number;
  total_nodes: number;
  skipped_count: number;
  path_type: "fast_track" | "fundamentals";
  job_title: string;
}

export interface GeneratedPath {
  nodes: PathNode[];
  edges: PathEdge[];
  metadata: PathMetadata;
}

export interface DualPath {
  fast_track: GeneratedPath;
  fundamentals: GeneratedPath;
  shared_graph: {
    nodes: SkillNode[];
    edges: PathEdge[];
  };
}

export interface PathResponse {
  id: string;
  job_input: string;
  user_state_input: string;
  paths: DualPath;
  created_at: string;
}
