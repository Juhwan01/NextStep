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
}

function SkillNodeComponent({ data, selected }: NodeProps) {
  const d = data as unknown as SkillNodeData;
  const isActive = d.status === "in_progress" || d.status === "recommended_next";
  const isCompleted = d.status === "completed";
  const isDimmed = d.status === "not_started";

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-3 !h-3" />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: d.order * 0.05, duration: 0.3 }}
        className={`
          relative w-[200px] rounded-xl border p-3 cursor-pointer transition-all duration-300
          ${isDimmed ? "bg-white/[0.02] border-white/[0.06] opacity-50" : "bg-white/[0.05] backdrop-blur-[12px] border-white/10"}
          ${isActive ? "border-[var(--path-color)] shadow-[0_0_20px_var(--glow-color)]" : ""}
          ${isCompleted ? "border-emerald-500/50 bg-emerald-500/10" : ""}
          ${selected ? "ring-2 ring-white/30" : ""}
          hover:bg-white/[0.08] hover:border-white/20
        `}
        style={{
          "--path-color": d.pathColor,
          "--glow-color": `${d.pathColor}40`,
        } as React.CSSProperties}
      >
        {/* Status indicator */}
        <div className="absolute -top-2 -right-2">
          {isCompleted && (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-xs">
              ✓
            </div>
          )}
          {d.status === "in_progress" && (
            <div className="w-5 h-5 rounded-full border-2 border-blue-400 animate-pulse" />
          )}
          {d.status === "recommended_next" && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-5 h-5 rounded-full"
              style={{ backgroundColor: d.pathColor }}
            />
          )}
          {isDimmed && (
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/30">
              🔒
            </div>
          )}
        </div>

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
        <div className="text-sm font-semibold text-white truncate">{d.name}</div>
        <div className="text-xs text-white/40 truncate">{d.name_ko}</div>

        {/* Meta info */}
        <div className="flex items-center gap-2 mt-2 text-[10px] text-white/30">
          <span>{d.estimated_hours}h</span>
          <span>•</span>
          <span>난이도 {Math.round(d.difficulty * 5)}/5</span>
        </div>
      </motion.div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-3 !h-3" />
    </>
  );
}

export const SkillNode = memo(SkillNodeComponent);
