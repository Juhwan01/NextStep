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

  const isHighlighted = data?.on_recommended_path;
  const pathColor = (data?.pathColor as string) || "#00d4ff";
  const glowColor = (data?.glowColor as string) || "rgba(0,212,255,0.3)";
  const strength = (data?.strength as number) ?? 0.5;

  const strokeWidth = isHighlighted ? 1.5 + strength * 1.5 : 0.8;
  const glowWidth = 4 + strength * 4;

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
          markerWidth={isHighlighted ? 5 : 4}
          markerHeight={isHighlighted ? 5 : 4}
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill={isHighlighted ? pathColor : "rgba(255,255,255,0.15)"}
          />
        </marker>
      </defs>

      {/* Glow effect layer */}
      {isHighlighted && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            stroke: glowColor,
            strokeWidth: glowWidth,
            filter: "blur(4px)",
          }}
        />
      )}

      {/* Main edge with arrow */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isHighlighted ? pathColor : "rgba(255,255,255,0.06)",
          strokeWidth,
          markerEnd: `url(#${markerId})`,
          ...style,
        }}
      />

      {/* Animated flow dot */}
      {isHighlighted && (
        <circle r="2.5" fill={pathColor} opacity={0.8}>
          <animateMotion dur="4s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}

export const PathEdge = memo(PathEdgeComponent);
