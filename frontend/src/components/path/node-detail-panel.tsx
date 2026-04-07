"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui";
import type { PathNode } from "@/types/path";
import { CATEGORY_STYLES } from "@/lib/constants";
import { apiClient } from "@/services/api-client";

interface NodeDetailPanelProps {
  node: PathNode;
  pathId: string;
  onClose: () => void;
}

interface ContentItem {
  id: string;
  title: string;
  url: string;
  content_type: string;
  provider: string;
  estimated_minutes: number | null;
  is_free: boolean;
}

export function NodeDetailPanel({ node, pathId: _pathId, onClose }: NodeDetailPanelProps) {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const categoryStyle = CATEGORY_STYLES[node.category] || { color: "#888", icon: "circle" };

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await apiClient.get(`/content/by-skill/${node.id}`);
        setContents((res as any).contents || []);
      } catch {
        setContents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, [node.id]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 w-[380px] h-full z-30 p-4 overflow-y-auto"
      >
        <GlassCard variant="elevated" padding="lg" className="h-full relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/40 hover:text-white text-lg"
          >
            ✕
          </button>

          {/* Category badge */}
          <div
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{ backgroundColor: `${categoryStyle.color}20`, color: categoryStyle.color }}
          >
            {node.category.replace("cat_", "")}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-1">{node.name}</h2>
          <p className="text-sm text-white/40 mb-4">{node.name_ko}</p>

          {/* Description */}
          <p className="text-sm text-white/60 mb-6">{node.description}</p>

          {/* Meta stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-lg font-semibold text-white">{node.estimated_hours}h</div>
              <div className="text-[10px] text-white/30">예상 시간</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-lg font-semibold text-white">{Math.round(node.difficulty * 5)}/5</div>
              <div className="text-[10px] text-white/30">난이도</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-lg font-semibold text-white">{Math.round(node.market_demand * 100)}%</div>
              <div className="text-[10px] text-white/30">시장 수요</div>
            </div>
          </div>

          {/* AI Explanation */}
          {node.explanation.why_needed && (
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-semibold text-[#00d4ff]">AI 추천 이유</h3>
              <div className="space-y-2 text-sm text-white/60">
                <div>
                  <span className="text-white/40 text-xs">왜 필요한가</span>
                  <p>{node.explanation.why_needed}</p>
                </div>
                <div>
                  <span className="text-white/40 text-xs">실무 활용</span>
                  <p>{node.explanation.job_relevance}</p>
                </div>
                {node.explanation.connection_to_next && (
                  <div>
                    <span className="text-white/40 text-xs">다음 단계 연결</span>
                    <p>{node.explanation.connection_to_next}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Learning Content */}
          <div>
            <h3 className="text-sm font-semibold text-[#00ffd5] mb-3">학습 콘텐츠</h3>
            {loading ? (
              <div className="text-sm text-white/30 animate-pulse">로딩 중...</div>
            ) : contents.length > 0 ? (
              <div className="space-y-2">
                {contents.map((c) => (
                  <a
                    key={c.id}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-medium">{c.title}</span>
                      {c.is_free && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">FREE</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-white/30">
                      <span>{c.content_type}</span>
                      {c.provider && <span>· {c.provider}</span>}
                      {c.estimated_minutes && <span>· {c.estimated_minutes}분</span>}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/30">아직 등록된 콘텐츠가 없습니다.</p>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
}
