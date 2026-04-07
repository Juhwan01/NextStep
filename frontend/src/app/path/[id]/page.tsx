"use client";

import { useQuery } from "@tanstack/react-query";
import { SkillGraph } from "@/components/graph/skill-graph";
import { LoadingSpinner } from "@/components/ui";
import { pathApi } from "@/services/path-api";
import type { DualPath, ProgressMap } from "@/types/path";

export default function PathPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const { data, isLoading, error } = useQuery({
    queryKey: ["path", id],
    queryFn: () => pathApi.getById(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <LoadingSpinner size="lg" text="학습 경로를 불러오는 중..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-white mb-2">경로를 찾을 수 없습니다</h2>
          <p className="text-white/40">잘못된 링크이거나 경로가 삭제되었습니다.</p>
        </div>
      </div>
    );
  }

  const pathData = data as unknown as { paths: DualPath; progress?: ProgressMap };
  const dualPath: DualPath = pathData.paths;
  const progress: ProgressMap = pathData.progress ?? {};

  return <SkillGraph dualPath={dualPath} pathId={id} initialProgress={progress} />;
}
