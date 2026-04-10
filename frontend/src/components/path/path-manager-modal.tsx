"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pathApi } from "@/services/path-api";

interface PathItem {
  id: string;
  job_input: string;
  created_at: string;
}

interface PathManagerModalProps {
  open: boolean;
  onClose: () => void;
}

export function PathManagerModal({ open, onClose }: PathManagerModalProps) {
  const [paths, setPaths] = useState<PathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    pathApi
      .getMine()
      .then((res: any) => setPaths(res.paths || []))
      .catch(() => setPaths([]))
      .finally(() => setLoading(false));
  }, [open]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await pathApi.deletePath(id);
      setPaths((prev) => prev.filter((p) => p.id !== id));
      // If on the deleted path's page, redirect to home
      if (typeof window !== "undefined" && window.location.pathname === `/path/${id}`) {
        window.location.href = "/";
      }
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="relative w-full max-w-md bg-[#151520]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_16px_64px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00d4ff]">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                  <line x1="9" y1="3" x2="9" y2="18" />
                  <line x1="15" y1="6" x2="15" y2="21" />
                </svg>
                내 경로
              </h2>
              <div className="flex items-center gap-2">
                <a
                  href="/?new=true"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                    bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20
                    hover:bg-[#00d4ff]/20 hover:border-[#00d4ff]/40 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  새 경로
                </a>
                <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : paths.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-3 opacity-30">🗺️</div>
                  <p className="text-sm text-white/30">아직 생성한 경로가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paths.map((p) => (
                    <div
                      key={p.id}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all"
                    >
                      {/* Path info — clickable */}
                      <a
                        href={`/path/${p.id}`}
                        className="flex-1 min-w-0"
                        onClick={onClose}
                      >
                        <div className="text-sm font-medium text-white truncate">
                          {p.job_input}
                        </div>
                        <div className="text-[11px] text-white/30 mt-0.5">
                          {formatDate(p.created_at)}
                        </div>
                      </a>

                      {/* Delete area */}
                      {confirmingId === p.id ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50"
                          >
                            {deletingId === p.id ? "삭제중..." : "확인"}
                          </button>
                          <button
                            onClick={() => setConfirmingId(null)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 transition-all"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingId(p.id)}
                          className="flex-shrink-0 p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                          title="경로 삭제"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!loading && paths.length > 0 && (
              <div className="px-5 py-3 border-t border-white/5">
                <p className="text-[11px] text-white/20 text-center">
                  총 {paths.length}개의 경로
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
