"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SkillGraph } from "@/components/graph/skill-graph";
import { LoadingSpinner } from "@/components/ui";
import { useAuthStore } from "@/stores/auth-store";
import { pathApi } from "@/services/path-api";
import type { DualPath, ProgressMap } from "@/types/path";

export default function PathPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { token, isInitialized } = useAuthStore();

  // Auth guard: redirect to home if not logged in
  useEffect(() => {
    if (isInitialized && !token) {
      router.replace("/");
    }
  }, [isInitialized, token, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["path", id],
    queryFn: () => pathApi.getById(id),
    enabled: !!token,
  });

  // Show loading while auth is initializing or redirecting
  if (!isInitialized || !token) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <LoadingSpinner size="lg" text="인증 확인 중..." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <LoadingSpinner size="lg" text="학습 경로를 불러오는 중..." />
      </div>
    );
  }

  if (error || !data) {
    const status = (error as any)?.response?.status;
    const title = status === 403
      ? "이 경로에 접근할 수 없습니다"
      : status === 404
        ? "경로를 찾을 수 없습니다"
        : "오류가 발생했습니다";
    const desc = status === 403
      ? "이 학습 경로에 대한 접근 권한이 없습니다."
      : status === 404
        ? "잘못된 링크이거나 경로가 삭제되었습니다."
        : "서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.";

    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl text-white">{title}</h2>
          <p className="text-white/40">{desc}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 text-sm rounded-lg bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all"
            >
              홈으로
            </button>
            {status !== 403 && status !== 404 && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm rounded-lg bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 transition-all"
              >
                다시 시도
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const pathData = data as unknown as { paths: DualPath; progress?: ProgressMap };
  const dualPath: DualPath = pathData.paths;
  const progress: ProgressMap = pathData.progress ?? {};

  return <SkillGraph dualPath={dualPath} pathId={id} initialProgress={progress} />;
}
