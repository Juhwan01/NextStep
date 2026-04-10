import { create } from "zustand";
import { pathApi, type PathGenerateRequest } from "@/services/path-api";

interface PathGenerationState {
  isGenerating: boolean;
  generatedPathId: string | null;
  error: string | null;
}

interface PathGenerationActions {
  generate: (data: PathGenerateRequest) => Promise<void>;
  reset: () => void;
}

export const usePathGenerationStore = create<PathGenerationState & PathGenerationActions>(
  (set, get) => ({
    isGenerating: false,
    generatedPathId: null,
    error: null,

    generate: async (data) => {
      if (get().isGenerating) return;

      set({ isGenerating: true, generatedPathId: null, error: null });

      try {
        const result = await pathApi.generate(data);
        set({ isGenerating: false, generatedPathId: (result as any).id });
      } catch (err) {
        const isTimeout = (err as any)?.code === "ECONNABORTED" || (err as any)?.message?.includes("timeout");
        const serverMessage = (err as any)?.response?.data?.detail;
        const message = isTimeout
          ? "서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."
          : serverMessage || "경로 생성에 실패했습니다. 다시 시도해주세요.";
        set({ isGenerating: false, error: message });
      }
    },

    reset: () => {
      set({ isGenerating: false, generatedPathId: null, error: null });
    },
  })
);
