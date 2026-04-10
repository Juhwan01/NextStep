"use client";

import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

function PathEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const onRecommendedPath = data?.on_recommended_path as boolean;
  const isUnlockEdge = data?.isUnlockEdge as boolean;
  const isCompletedEdge = data?.isCompletedEdge as boolean;
  const pathColor = (data?.pathColor as string) || "#00d4ff";
  const glowColor = (data?.glowColor as string) || "rgba(0,212,255,0.3)";

  // Only progress-driven edges glow:
  // - isUnlockEdge: completed → recommended_next (blue animated)
  // - isCompletedEdge: completed → completed (green)
  // - onRecommendedPath: future path, shown as subtle dashed line (not glowing)
  const isActive = isUnlockEdge;
  const strokeWidth = isUnlockEdge
    ? 2.5
    : isCompletedEdge
      ? 1.8
      : onRecommendedPath
        ? 1.0
        : 0.6;
  const glowWidth = isUnlockEdge ? 10 : 6;

  const edgeColor = isCompletedEdge
    ? "#10b981"
    : isUnlockEdge
      ? pathColor
      : onRecommendedPath
        ? "rgba(255,255,255,0.12)"
        : "rgba(255,255,255,0.06)";

  const markerId = `arrow-${id}`;

  return (
    <>
      {/* Arrow marker definition */}
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth={isActive || isCompletedEdge ? 5 : 4}
          markerHeight={isActive || isCompletedEdge ? 5 : 4}
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill={edgeColor}
          />
        </marker>
      </defs>

      {/* Glow effect layer — only for progress-driven edges */}
      {(isUnlockEdge || isCompletedEdge) && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            stroke: isCompletedEdge ? "rgba(16,185,129,0.3)" : glowColor,
            strokeWidth: glowWidth,
            filter: isUnlockEdge ? "blur(6px)" : "blur(4px)",
          }}
        />
      )}

      {/* Main edge with arrow */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth,
          strokeDasharray: isUnlockEdge || isCompletedEdge ? "none" : "6 4",
          markerEnd: `url(#${markerId})`,
          transition: "stroke 0.5s ease, stroke-width 0.5s ease",
          ...style,
        }}
      />

      {/* Animated flow dot — only on unlock edges (progress-driven) */}
      {isUnlockEdge && (
        <>
          <circle r="3" fill={pathColor} opacity={0.9}>
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="2" fill="white" opacity={0.5}>
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} begin="0.3s" />
          </circle>
        </>
      )}

      {/* Completed edge checkmark at midpoint */}
      {isCompletedEdge && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2 - 8}
          textAnchor="middle"
          fontSize="10"
          fill="#10b981"
          opacity={0.6}
        >
          ✓
        </text>
      )}
    </>
  );
}

export const PathEdge = memo(PathEdgeComponent);
