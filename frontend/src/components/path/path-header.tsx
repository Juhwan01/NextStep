"use client";

import type { PathMetadata } from "@/types/path";

interface PathHeaderProps {
  pathType: "fast_track" | "fundamentals";
  onPathTypeChange: (type: "fast_track" | "fundamentals") => void;
  metadata: PathMetadata;
  completedCount?: number;
}

export function PathHeader({ pathType, onPathTypeChange, metadata, completedCount = 0 }: PathHeaderProps) {
  const skippedSkills = metadata.skipped_skills ?? [];
  const concurrentGroups = metadata.concurrent_groups ?? [];
  const parallelCount = concurrentGroups.filter((g) => g.length > 1).length;

  return (
    <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div>
          <h1 className="text-lg font-semibold text-white">
            {metadata.job_title || "학습 경로"}
          </h1>
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span>{metadata.total_nodes}개 스킬</span>
            <span>·</span>
            <span>약 {metadata.total_hours}시간</span>
            {metadata.skipped_count > 0 && (
              <>
                <span>·</span>
                <span className="text-emerald-400/70">
                  {metadata.skipped_count}개 스킵
                </span>
              </>
            )}
            {completedCount > 0 && (
              <>
                <span>·</span>
                <span className="text-emerald-400/70">
                  {completedCount}/{metadata.total_nodes} 완료
                </span>
              </>
            )}
            {parallelCount > 0 && (
              <>
                <span>·</span>
                <span className="text-purple-400/70">
                  {parallelCount}개 병렬 구간
                </span>
              </>
            )}
          </div>

          {/* Skipped skills chips */}
          {skippedSkills.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[10px] text-white/30">이미 아는 기술:</span>
              {skippedSkills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400/60 border border-emerald-500/20"
                >
                  {skill}
                </span>
              ))}
              {skippedSkills.length > 6 && (
                <span className="text-[10px] text-white/30">
                  +{skippedSkills.length - 6}개
                </span>
              )}
            </div>
          )}
        </div>

        {/* Path type toggle */}
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
          <button
            onClick={() => onPathTypeChange("fast_track")}
            className={`px-4 py-1.5 text-sm rounded-md transition-all ${
              pathType === "fast_track"
                ? "bg-[#00d4ff]/20 text-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.2)]"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            빠른 취업
          </button>
          <button
            onClick={() => onPathTypeChange("fundamentals")}
            className={`px-4 py-1.5 text-sm rounded-md transition-all ${
              pathType === "fundamentals"
                ? "bg-[#00ffd5]/20 text-[#00ffd5] shadow-[0_0_10px_rgba(0,255,213,0.2)]"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            기본기
          </button>
        </div>
      </div>
    </div>
  );
}
