"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui";
import type { PathNode, ProgressStatus } from "@/types/path";
import { CATEGORY_STYLES } from "@/lib/constants";
import { apiClient } from "@/services/api-client";

interface ConnectionNode {
  id: string;
  name: string;
  status: string;
}

interface NodeDetailPanelProps {
  node: PathNode;
  pathId: string;
  onClose: () => void;
  onProgressChange?: (nodeId: string, status: ProgressStatus) => void;
  connections?: {
    prerequisites: ConnectionNode[];
    unlocks: ConnectionNode[];
  };
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

export function NodeDetailPanel({ node, pathId, onClose, onProgressChange, connections }: NodeDetailPanelProps) {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState(node.explanation);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const categoryStyle = CATEGORY_STYLES[node.category] || { color: "#888", icon: "circle" };

  useEffect(() => {
    setExplanation(node.explanation);
  }, [node.id, node.explanation]);

  // Lazy load explanation if empty
  useEffect(() => {
    const hasExplanation = explanation?.why_needed && explanation.why_needed.length > 0;
    if (hasExplanation || !pathId) return;

    setExplanationLoading(true);
    apiClient
      .get(`/paths/${pathId}/explain/${node.id}`)
      .then((res: any) => {
        setExplanation(res.explanation || {});
      })
      .catch(() => {
        // silently fail — explanation is optional
      })
      .finally(() => setExplanationLoading(false));
  }, [node.id, pathId, explanation]);

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
              <div className="text-lg font-semibold text-white">{Math.round((node.market_demand ?? 0) * 100)}%</div>
              <div className="text-[10px] text-white/30">시장 수요</div>
            </div>
          </div>

          {/* Progress tracking */}
          {onProgressChange && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white/60 mb-2">학습 상태</h3>
              <div className="flex gap-2">
                {node.status === "not_started" || node.status === "recommended_next" ? (
                  <button
                    onClick={() => onProgressChange(node.id, "in_progress")}
                    className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                      bg-blue-500/20 text-blue-400 border border-blue-500/30
                      hover:bg-blue-500/30 hover:border-blue-500/50"
                  >
                    학습 시작
                  </button>
                ) : node.status === "in_progress" ? (
                  <>
                    <button
                      onClick={() => onProgressChange(node.id, "completed")}
                      className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                        bg-emerald-500/20 text-emerald-400 border border-emerald-500/30
                        hover:bg-emerald-500/30 hover:border-emerald-500/50"
                    >
                      학습 완료
                    </button>
                    <button
                      onClick={() => onProgressChange(node.id, "not_started")}
                      className="py-2 px-3 rounded-lg text-sm font-medium transition-all
                        bg-white/5 text-white/40 border border-white/10
                        hover:bg-white/10 hover:text-white/60"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-emerald-400">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-xs text-white">
                        ✓
                      </span>
                      학습 완료
                    </span>
                    <button
                      onClick={() => onProgressChange(node.id, "in_progress")}
                      className="text-xs text-white/30 hover:text-white/50 transition-colors"
                    >
                      되돌리기
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Connections: Prerequisites & Unlocks */}
          {connections && (connections.prerequisites.length > 0 || connections.unlocks.length > 0) && (
            <div className="mb-6 space-y-3">
              {connections.prerequisites.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-white/40 mb-2 flex items-center gap-1">
                    <span className="text-amber-400">←</span> 선행 조건
                  </h3>
                  <div className="space-y-1.5">
                    {connections.prerequisites.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5"
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          n.status === "completed" ? "bg-emerald-500" :
                          n.status === "in_progress" ? "bg-blue-400" : "bg-white/20"
                        }`} />
                        <span className="text-sm text-white/70 truncate">{n.name}</span>
                        <span className={`text-[10px] ml-auto flex-shrink-0 ${
                          n.status === "completed" ? "text-emerald-400" :
                          n.status === "in_progress" ? "text-blue-400" : "text-white/30"
                        }`}>
                          {n.status === "completed" ? "완료" : n.status === "in_progress" ? "학습중" : "미시작"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {connections.unlocks.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-white/40 mb-2 flex items-center gap-1">
                    <span className="text-[#00d4ff]">→</span> 이걸 배우면
                  </h3>
                  <div className="space-y-1.5">
                    {connections.unlocks.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5"
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          n.status === "completed" ? "bg-emerald-500" :
                          n.status === "in_progress" ? "bg-blue-400" : "bg-white/20"
                        }`} />
                        <span className="text-sm text-white/70 truncate">{n.name}</span>
                        <span className={`text-[10px] ml-auto flex-shrink-0 ${
                          n.status === "completed" ? "text-emerald-400" :
                          n.status === "in_progress" ? "text-blue-400" : "text-white/30"
                        }`}>
                          {n.status === "completed" ? "완료" : n.status === "in_progress" ? "학습중" : "잠금"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Explanation */}
          {explanationLoading ? (
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-semibold text-[#00d4ff]">AI 추천 이유</h3>
              <div className="space-y-2">
                <div className="h-4 bg-white/5 rounded animate-pulse" />
                <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-white/5 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ) : explanation?.why_needed ? (
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-semibold text-[#00d4ff]">AI 추천 이유</h3>
              <div className="space-y-2 text-sm text-white/60">
                <div>
                  <span className="text-white/40 text-xs">왜 필요한가</span>
                  <p>{explanation.why_needed}</p>
                </div>
                {explanation.job_relevance && (
                  <div>
                    <span className="text-white/40 text-xs">실무 활용</span>
                    <p>{explanation.job_relevance}</p>
                  </div>
                )}
                {explanation.connection_to_next && (
                  <div>
                    <span className="text-white/40 text-xs">다음 단계 연결</span>
                    <p>{explanation.connection_to_next}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Background node hint */}
          {node.order === -1 && !node.explanation?.why_needed && (
            <div className="mb-6 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-white/40">
                이 스킬은 현재 경로에 포함되지 않지만, 관련된 기술입니다. 학습을 시작하면 진행 상태가 기록됩니다.
              </p>
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
