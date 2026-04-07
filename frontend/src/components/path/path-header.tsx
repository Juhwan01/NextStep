"use client";

import type { PathMetadata } from "@/types/path";

interface PathHeaderProps {
  pathType: "fast_track" | "fundamentals";
  onPathTypeChange: (type: "fast_track" | "fundamentals") => void;
  metadata: PathMetadata;
}

export function PathHeader({ pathType, onPathTypeChange, metadata }: PathHeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div>
          <h1 className="text-lg font-semibold text-white">
            {metadata.job_title || "학습 경로"}
          </h1>
          <p className="text-xs text-white/40">
            {metadata.total_nodes}개 스킬 · 약 {metadata.total_hours}시간 예상
          </p>
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
