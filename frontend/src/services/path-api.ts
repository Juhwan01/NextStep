import { apiClient } from "./api-client";

export interface PathGenerateRequest {
  job_input: string;
  current_state: string;
}

export const pathApi = {
  generate: (data: PathGenerateRequest) =>
    apiClient.post("/paths/generate", data),

  getById: (id: string) =>
    apiClient.get(`/paths/${id}`),

  getMine: () =>
    apiClient.get("/paths/mine"),

  updateProgress: (pathId: string, nodeId: string, status: string) =>
    apiClient.patch(`/paths/${pathId}/progress`, { skill_node_id: nodeId, status }),
};
