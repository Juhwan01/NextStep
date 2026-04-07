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

  return (
    <>
      {/* Glow effect layer */}
      {isHighlighted && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            stroke: glowColor,
            strokeWidth: 8,
            filter: "blur(4px)",
          }}
        />
      )}
      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isHighlighted ? pathColor : "rgba(255,255,255,0.08)",
          strokeWidth: isHighlighted ? 2.5 : 1,
          ...style,
        }}
      />
      {/* Animated flow indicator */}
      {isHighlighted && (
        <circle r="3" fill={pathColor}>
          <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}

export const PathEdge = memo(PathEdgeComponent);
