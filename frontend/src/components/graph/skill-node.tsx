"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";

interface SkillNodeData {
  name: string;
  name_ko: string;
  category: string;
  difficulty: number;
  estimated_hours: number;
  status: "not_started" | "in_progress" | "completed" | "recommended_next";
  order: number;
  pathColor: string;
  categoryStyle: { color: string; icon: string };
  statusColor: { bg: string; border: string; text: string };
  nodeRole: "start" | "target" | "intermediate" | "background";
  totalNodes: number;
}

function SkillNodeComponent({ data, selected }: NodeProps) {
  const d = data as unknown as SkillNodeData;
  const isBackground = d.nodeRole === "background";
  const isActive = !isBackground && (d.status === "in_progress" || d.status === "recommended_next");
  const isRecommendedNext = !isBackground && d.status === "recommended_next";
  const isCompleted = !isBackground && d.status === "completed";
  const isDimmed = isBackground || d.status === "not_started";
  const isStart = d.nodeRole === "start";
  const isTarget = d.nodeRole === "target";

  // Start/Target nodes are significantly wider for visual emphasis
  const width = isStart ? "w-[250px]" : isTarget ? "w-[260px]" : "w-[200px]";

  return (
    <>
      {/* Multi-directional handles for force layout */}
      <Handle type="target" position={Position.Top} id="top-target" className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Top} id="top-source" className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Right} id="right-target" className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} id="right-source" className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Left} id="left-source" className="!bg-transparent !border-0 !w-2 !h-2" />

      {/* Start node: double pulsing ring + strong glow */}
      {isStart && (
        <>
          <motion.div
            className="absolute -inset-4 rounded-2xl pointer-events-none"
            animate={{
              boxShadow: [
                `0 0 0 0px ${d.pathColor}50`,
                `0 0 0 14px ${d.pathColor}00`,
              ],
            }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
          />
          <motion.div
            className="absolute -inset-4 rounded-2xl pointer-events-none"
            animate={{
              boxShadow: [
                `0 0 0 0px ${d.pathColor}30`,
                `0 0 0 22px ${d.pathColor}00`,
              ],
            }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut", delay: 0.4 }}
          />
          <div
            className="absolute -inset-3 rounded-2xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${d.pathColor}20 0%, transparent 70%)`,
              filter: "blur(12px)",
            }}
          />
        </>
      )}

      {/* Recommended next node: pulsing glow to draw attention */}
      {isRecommendedNext && !isStart && !isTarget && (
        <>
          <motion.div
            className="absolute -inset-3 rounded-2xl pointer-events-none"
            animate={{
              boxShadow: [
                `0 0 0 0px ${d.pathColor}40`,
                `0 0 0 10px ${d.pathColor}00`,
              ],
            }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
          />
          <div
            className="absolute -inset-2 rounded-xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${d.pathColor}15 0%, transparent 70%)`,
              filter: "blur(8px)",
            }}
          />
        </>
      )}

      {/* Target node: strong glow aura + pulsing outer ring */}
      {isTarget && (
        <>
          <div
            className="absolute -inset-6 rounded-2xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${d.pathColor}30 0%, ${d.pathColor}10 40%, transparent 70%)`,
              filter: "blur(12px)",
            }}
          />
          <motion.div
            className="absolute -inset-5 rounded-2xl pointer-events-none border-2"
            style={{ borderColor: `${d.pathColor}40` }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          />
        </>
      )}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: isBackground ? Math.random() * 0.3 : d.order * 0.12 + 0.3, duration: 0.4, ease: "easeOut" }}
        className={`
          relative ${width} rounded-xl border p-3 transition-all duration-300
          ${isBackground
            ? "bg-white/[0.01] border-white/[0.04] opacity-30 cursor-pointer hover:opacity-50 hover:border-white/10"
            : isDimmed && !isTarget
              ? "bg-white/[0.02] border-white/[0.06] opacity-40 cursor-pointer"
              : "bg-white/[0.05] backdrop-blur-[12px] border-white/10 cursor-pointer"}
          ${isActive ? "border-[var(--path-color)] shadow-[0_0_28px_var(--glow-color)] bg-white/[0.06]" : ""}
          ${isCompleted ? "border-emerald-500/50 bg-emerald-500/10" : ""}
          ${isStart ? "border-2 border-[var(--path-color)] shadow-[0_0_40px_var(--glow-color)] bg-[var(--glow-color)]" : ""}
          ${isTarget ? "border-2 border-[var(--path-color)] shadow-[0_0_36px_var(--glow-color)]" : ""}
          ${selected ? "ring-2 ring-white/30" : ""}
          ${!isBackground ? "hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[0_0_16px_rgba(255,255,255,0.05)]" : ""}
        `}
        style={{
          "--path-color": d.pathColor,
          "--glow-color": `${d.pathColor}30`,
        } as React.CSSProperties}
      >
        {/* Role badge: START / GOAL — larger with icons */}
        {isStart && (
          <div
            className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider flex items-center gap-1 shadow-lg"
            style={{ backgroundColor: d.pathColor, color: "#0a0a0f", boxShadow: `0 0 16px ${d.pathColor}60` }}
          >
            <span>▶</span> START
          </div>
        )}
        {isTarget && (
          <div
            className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider flex items-center gap-1 shadow-lg"
            style={{ backgroundColor: d.pathColor, color: "#0a0a0f", boxShadow: `0 0 16px ${d.pathColor}60` }}
          >
            <span>★</span> GOAL
          </div>
        )}

        {/* Status indicator (hidden for background nodes) */}
        {!isBackground && <div className="absolute -top-2 -right-2">
          {isCompleted && (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-xs text-white">
              ✓
            </div>
          )}
          {d.status === "in_progress" && (
            <div className="w-5 h-5 rounded-full border-2 border-blue-400 animate-pulse" />
          )}
          {d.status === "recommended_next" && !isStart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.3, 1], opacity: 1 }}
              transition={{ scale: { repeat: Infinity, duration: 1.5 }, opacity: { duration: 0.5 } }}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: d.pathColor, boxShadow: `0 0 12px ${d.pathColor}` }}
            >
              <span className="text-[9px] text-black font-bold">!</span>
            </motion.div>
          )}
          {isDimmed && !isTarget && !isBackground && (
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/30">
              🔒
            </div>
          )}
        </div>}

        {/* Order badge */}
        {!isTarget && (
          <div
            className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold font-mono border ${
              isCompleted
                ? "bg-emerald-500/30 border-emerald-500/50 text-emerald-300"
                : isActive || isStart
                  ? "border-[var(--path-color)] text-white"
                  : "bg-white/5 border-white/15 text-white/40"
            }`}
            style={
              isActive || isStart
                ? { backgroundColor: `${d.pathColor}30`, borderColor: `${d.pathColor}60` }
                : undefined
            }
          >
            {d.order + 1}
          </div>
        )}

        {/* Category badge */}
        <div
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mb-2"
          style={{
            backgroundColor: `${d.categoryStyle.color}20`,
            color: d.categoryStyle.color,
          }}
        >
          {d.category.replace("cat_", "")}
        </div>

        {/* Skill name */}
        <div className={`text-sm font-semibold truncate ${isTarget ? "text-white" : isDimmed ? "text-white/50" : "text-white"}`}>
          {d.name}
        </div>
        <div className={`text-xs truncate ${isDimmed ? "text-white/20" : "text-white/40"}`}>
          {d.name_ko}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 mt-2 text-[10px] text-white/30">
          <span>{d.estimated_hours}h</span>
          <span>·</span>
          <span>Lv.{Math.round(d.difficulty * 5)}</span>
        </div>
      </motion.div>

      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!bg-transparent !border-0 !w-2 !h-2" />
    </>
  );
}

export const SkillNode = memo(SkillNodeComponent);
