"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { PathManagerModal } from "@/components/path/path-manager-modal";
import type { PathMetadata } from "@/types/path";

interface PathHeaderProps {
  pathType: "fast_track" | "fundamentals";
  onPathTypeChange: (type: "fast_track" | "fundamentals") => void;
  metadata: PathMetadata;
  completedCount?: number;
}

export function PathHeader({ pathType, onPathTypeChange, metadata, completedCount = 0 }: PathHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);
  const skippedSkills = metadata.skipped_skills ?? [];
  const concurrentGroups = metadata.concurrent_groups ?? [];
  const parallelCount = concurrentGroups.filter((g) => g.length > 1).length;

  return (
    <div className="absolute top-0 left-0 right-0 z-20 px-6 py-3 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent">
      <div className="flex items-center justify-between">
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

        {/* Progress bar + Path toggle */}
        <div className="flex items-center gap-4">
          {/* Progress indicator */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-white">
                {completedCount}/{metadata.total_nodes}
              </div>
              <div className="text-[10px] text-white/30">완료</div>
            </div>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${metadata.total_nodes > 0 ? (completedCount / metadata.total_nodes) * 100 : 0}%`,
                  background: completedCount === metadata.total_nodes
                    ? "linear-gradient(90deg, #10b981, #34d399)"
                    : pathType === "fast_track"
                      ? "linear-gradient(90deg, #00d4ff, #0099cc)"
                      : "linear-gradient(90deg, #00ffd5, #00cc99)",
                }}
              />
            </div>
            <div className="text-xs text-white/40">
              {metadata.total_nodes > 0
                ? Math.round((completedCount / metadata.total_nodes) * 100)
                : 0}%
            </div>
          </div>

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

          {/* User indicator with dropdown */}
          {user ? (
            <div className="relative pl-3 border-l border-white/10" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 py-1 rounded-md hover:bg-white/5 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#00ffd5] flex items-center justify-center text-[10px] font-bold text-[#0a0a0f]">
                  {user.display_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-white/40 hidden sm:block">
                  {user.display_name || user.email.split("@")[0]}
                </span>
                <svg
                  className={`w-3 h-3 text-white/25 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden bg-[#151520]/95 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-[10px] text-white/30 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { router.push("/"); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      홈으로
                    </button>
                    <button
                      onClick={() => { setPathModalOpen(true); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                        <line x1="9" y1="3" x2="9" y2="18" />
                        <line x1="15" y1="6" x2="15" y2="21" />
                      </svg>
                      내 경로
                    </button>
                  </div>
                  <div className="border-t border-white/5 py-1">
                    <button
                      onClick={() => { logout(); router.push("/"); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-all"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal("login")}
              className="text-xs text-white/40 hover:text-[#00d4ff] transition-colors pl-3 border-l border-white/10"
            >
              로그인
            </button>
          )}
        </div>
      </div>

      {/* Path manager modal */}
      <PathManagerModal open={pathModalOpen} onClose={() => setPathModalOpen(false)} />
    </div>
  );
}
