"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { SkillNode } from "./skill-node";
import { PathEdge } from "./path-edge";
import { NodeDetailPanel } from "../path/node-detail-panel";
import { PathHeader } from "../path/path-header";
import type { DualPath, PathNode as PathNodeType, ProgressMap, ProgressStatus } from "@/types/path";
import { transformToReactFlow } from "@/lib/graph-transform";
import { pathApi } from "@/services/path-api";
import { useAuthStore } from "@/stores/auth-store";

const nodeTypes = { skillNode: SkillNode };
const edgeTypes = { pathEdge: PathEdge };

interface SkillGraphProps {
  dualPath: DualPath;
  pathId: string;
  initialProgress?: ProgressMap;
}

/** Wrapper that provides ReactFlowProvider context */
export function SkillGraph(props: SkillGraphProps) {
  return (
    <ReactFlowProvider>
      <SkillGraphInner {...props} />
    </ReactFlowProvider>
  );
}

function SkillGraphInner({ dualPath, pathId, initialProgress = {} }: SkillGraphProps) {
  const [pathType, setPathType] = useState<"fast_track" | "fundamentals">("fast_track");
  const [selectedNode, setSelectedNode] = useState<PathNodeType | null>(null);
  const [progress, setProgress] = useState<ProgressMap>(initialProgress);
  const prevProgressRef = useRef<ProgressMap>(initialProgress);
  const { fitView, setCenter, getNode } = useReactFlow();

  const currentPath = pathType === "fast_track" ? dualPath.fast_track : dualPath.fundamentals;

  // Stable layout: compute force layout ONCE per path type, reuse positions for progress updates
  const layoutRef = useRef<{ nodes: import("@xyflow/react").Node[]; edges: import("@xyflow/react").Edge[] } | null>(null);
  const prevPathTypeRef = useRef(pathType);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const result = transformToReactFlow(currentPath, pathType, progress, dualPath.shared_graph);
    layoutRef.current = result;
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when path type or progress changes
  useEffect(() => {
    const pathTypeChanged = prevPathTypeRef.current !== pathType;
    prevPathTypeRef.current = pathType;

    if (pathTypeChanged || !layoutRef.current) {
      // Full re-layout on path type change
      const result = transformToReactFlow(currentPath, pathType, progress, dualPath.shared_graph);
      layoutRef.current = result;
      setNodes(result.nodes);
      setEdges(result.edges);
    } else {
      // Progress-only change: reuse existing positions, only update data/status/edges
      const result = transformToReactFlow(currentPath, pathType, progress, dualPath.shared_graph, layoutRef.current.nodes);
      layoutRef.current = result;
      setNodes(result.nodes);
      setEdges(result.edges);
    }
  }, [pathType, currentPath, progress, dualPath.shared_graph, setNodes, setEdges]);

  // --- Auto-zoom to newly unlocked nodes when progress changes ---
  useEffect(() => {
    const prev = prevProgressRef.current;
    prevProgressRef.current = progress;

    // Find nodes that were just completed (not in prev, completed in current)
    const newlyCompleted: string[] = [];
    for (const [id, status] of Object.entries(progress)) {
      if (status === "completed" && prev[id] !== "completed") {
        newlyCompleted.push(id);
      }
    }
    if (newlyCompleted.length === 0) return;

    // Find next unlocked nodes by ORDER (not by graph edges)
    // Get the highest completed order, then zoom to order+1 nodes
    const completedOrders = newlyCompleted
      .map((id) => currentPath.nodes.find((n) => n.id === id)?.order ?? -1)
      .filter((o) => o >= 0);
    const maxCompletedOrder = Math.max(...completedOrders);

    const unlockedTargetIds = new Set<string>();
    for (const node of currentPath.nodes) {
      if (node.order === maxCompletedOrder + 1 && progress[node.id] !== "completed") {
        unlockedTargetIds.add(node.id);
      }
    }

    if (unlockedTargetIds.size === 0) return;

    // Zoom to the unlocked nodes after React Flow processes new nodes
    // Use requestAnimationFrame + timeout to ensure layout is committed
    const targetIds = [...unlockedTargetIds];
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (targetIds.length === 1) {
          // Single target: zoom into it
          const rfNode = getNode(targetIds[0]);
          if (rfNode) {
            setCenter(rfNode.position.x + 100, rfNode.position.y + 40, {
              zoom: 1.2,
              duration: 800,
            });
          }
        } else {
          // Multiple targets: fit view to show all of them
          fitView({
            nodes: targetIds.map((id) => ({ id })),
            padding: 0.5,
            duration: 800,
            maxZoom: 1.2,
          });
        }
      }, 100);
    });
  }, [progress, currentPath.edges, getNode, setCenter, fitView]);

  /** Smoothly zoom to a specific node by ID */
  const zoomToNode = useCallback((nodeId: string) => {
    const rfNode = getNode(nodeId);
    if (rfNode) {
      setCenter(rfNode.position.x + 100, rfNode.position.y + 40, {
        zoom: 1.2,
        duration: 600,
      });
    }
  }, [getNode, setCenter]);

  const handleProgressChange = useCallback(async (nodeId: string, newStatus: ProgressStatus) => {
    // Auth gate: require login to track progress
    const { token, openAuthModal } = useAuthStore.getState();
    if (!token) {
      openAuthModal("login", "학습 진도를 저장하려면 로그인이 필요해요", () => {
        handleProgressChange(nodeId, newStatus);
      });
      return;
    }

    // Capture previous status for rollback on failure
    const previousStatus = progress[nodeId];

    // Optimistic update — delete key for "not_started" so recommended_next logic works
    if (newStatus === "not_started") {
      setProgress((prev) => {
        const updated = { ...prev };
        delete updated[nodeId];
        return updated;
      });
    } else {
      setProgress((prev) => ({ ...prev, [nodeId]: newStatus }));
    }

    // Update selected node status locally
    setSelectedNode((prev) =>
      prev && prev.id === nodeId ? { ...prev, status: newStatus } : prev
    );

    // Auto-transition: completed → zoom to next node → switch panel
    if (newStatus === "completed") {
      const completedNode = currentPath.nodes.find((n) => n.id === nodeId);
      if (completedNode) {
        const completedOrder = completedNode.order;
        // Find next incomplete node by order (same or higher order)
        const sorted = [...currentPath.nodes].sort((a, b) => a.order - b.order);
        const nextNode = sorted.find(
          (n) => n.order > completedOrder && n.id !== nodeId && progress[n.id] !== "completed"
        );

        if (nextNode) {
          // Delay to show "✓ 완료" briefly, then transition
          setTimeout(() => {
            zoomToNode(nextNode.id);
            // Switch panel after zoom animation settles
            setTimeout(() => {
              setSelectedNode({ ...nextNode, status: "recommended_next" });
            }, 400);
          }, 300);
        } else {
          // Last node completed — close panel after brief celebration
          setTimeout(() => {
            setSelectedNode(null);
          }, 800);
        }
      }
    }

    try {
      await pathApi.updateProgress(pathId, nodeId, newStatus);
    } catch {
      // Revert to previous status on failure
      setProgress((prev) => {
        const reverted = { ...prev };
        if (previousStatus) {
          reverted[nodeId] = previousStatus;
        } else {
          delete reverted[nodeId];
        }
        return reverted;
      });
      // Revert selected node status
      setSelectedNode((prev) =>
        prev && prev.id === nodeId ? { ...prev, status: previousStatus || "not_started" } : prev
      );
    }
  }, [pathId, currentPath.nodes, progress, zoomToNode]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const pathNode = currentPath.nodes.find((n) => n.id === node.id);
    if (pathNode) {
      const effectiveStatus = progress[pathNode.id] || pathNode.status;
      setSelectedNode({ ...pathNode, status: effectiveStatus });
    } else {
      // Background node — show basic info from node data
      const nodeData = node.data as any;
      setSelectedNode({
        id: node.id,
        name: nodeData?.name || node.id,
        name_ko: nodeData?.name_ko || "",
        category: nodeData?.category || "",
        difficulty: nodeData?.difficulty || 0,
        estimated_hours: nodeData?.estimated_hours || 0,
        status: "not_started",
        order: -1,
        why_included: nodeData?.why_included || "Related skill in the ecosystem",
      } as any);
    }
  }, [currentPath, progress]);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Count completed nodes for header
  const completedCount = currentPath.nodes.filter(
    (n) => progress[n.id] === "completed"
  ).length;

  // Find recommended next node for CTA guidance
  const nextRecommended = useMemo(() => {
    // Build prerequisite map for unlock logic
    const prerequisiteMap = new Map<string, Set<string>>();
    for (const e of currentPath.edges) {
      if (e.type === "PREREQUISITE_OF") {
        if (!prerequisiteMap.has(e.target)) prerequisiteMap.set(e.target, new Set());
        prerequisiteMap.get(e.target)!.add(e.source);
      }
    }

    const completedIds = new Set(
      currentPath.nodes.filter((n) => progress[n.id] === "completed").map((n) => n.id)
    );

    // Find unlocked nodes: all prereqs completed, not yet completed/in_progress
    const unlocked: PathNodeType[] = [];
    for (const n of currentPath.nodes) {
      if (progress[n.id] === "completed" || progress[n.id] === "in_progress") continue;
      const prereqs = prerequisiteMap.get(n.id);
      if (!prereqs || prereqs.size === 0) {
        // No prereqs — start node, always available
        if (n.order === 0) unlocked.push(n);
      } else if ([...prereqs].every((pid) => completedIds.has(pid))) {
        unlocked.push(n);
      }
    }

    // Return the first unlocked by order
    if (unlocked.length > 0) {
      return unlocked.sort((a, b) => a.order - b.order)[0];
    }

    // Fallback: first not-completed node in order
    const sorted = [...currentPath.nodes].sort((a, b) => a.order - b.order);
    return sorted.find((n) => progress[n.id] !== "completed") || null;
  }, [currentPath.nodes, currentPath.edges, progress]);

  return (
    <div className="w-full h-screen bg-[#0a0a0f] relative">
      {/* Gradient background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-[#00d4ff]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-[#00ffd5]/5 rounded-full blur-[100px]" />
      </div>

      {/* Header with path toggle */}
      <PathHeader
        pathType={pathType}
        onPathTypeChange={setPathType}
        metadata={currentPath.metadata}
        completedCount={completedCount}
      />

      {/* React Flow */}
      <div className="absolute inset-0 pt-16 z-10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{
            padding: 0.3,
            nodes: nodes.filter((n) => (n.data as Record<string, unknown>)?.isOnPath),
          }}
          minZoom={0.15}
          maxZoom={2}
          panOnDrag
          panOnScroll
          zoomOnScroll
          zoomOnPinch
          selectNodesOnDrag={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(255,255,255,0.03)" gap={20} />
          <Controls
            className="!bg-white/5 !border-white/10 !rounded-lg [&>button]:!bg-white/5 [&>button]:!border-white/10 [&>button]:!text-white/50 [&>button:hover]:!bg-white/10"
          />
          <MiniMap
            className="!bg-white/5 !border-white/10 !rounded-lg"
            nodeColor={(node) => {
              const status = (node.data as any)?.status;
              if (status === "completed") return "#10b981";
              if (status === "in_progress" || status === "recommended_next") return "#00d4ff";
              return "rgba(255,255,255,0.1)";
            }}
            maskColor="rgba(0,0,0,0.8)"
          />
        </ReactFlow>
      </div>

      {/* Next step CTA banner — now zooms to node on click */}
      {nextRecommended && !selectedNode && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={() => {
              // Zoom to the node first, then open detail panel
              zoomToNode(nextRecommended.id);
              setTimeout(() => {
                const effectiveStatus = progress[nextRecommended.id] || nextRecommended.status;
                setSelectedNode({ ...nextRecommended, status: effectiveStatus });
              }, 400);
            }}
            className="flex items-center gap-3 px-5 py-3 rounded-xl border transition-all
              bg-[#0a0a0f]/90 backdrop-blur-lg border-white/10
              hover:border-white/20 hover:bg-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: `${pathType === "fast_track" ? "#00d4ff" : "#00ffd5"}20`,
                color: pathType === "fast_track" ? "#00d4ff" : "#00ffd5",
              }}
            >
              {completedCount === 0 ? "▶" : (nextRecommended.order + 1)}
            </div>
            <div className="text-left">
              <div className="text-xs text-white/40">
                {completedCount === 0 ? "여기서 시작하세요" : "다음 추천"}
              </div>
              <div className="text-sm font-medium text-white">{nextRecommended.name}</div>
            </div>
            <div className="text-white/20 text-lg ml-2">→</div>
          </button>
        </div>
      )}

      {/* Node detail panel */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          pathId={pathId}
          onClose={() => setSelectedNode(null)}
          onProgressChange={handleProgressChange}
          connections={(() => {
            const prerequisites: { id: string; name: string; status: string }[] = [];
            const unlocks: { id: string; name: string; status: string }[] = [];
            const pathNodeMap = new Map(currentPath.nodes.map((n) => [n.id, n]));
            const bgNodeMap = new Map((dualPath.shared_graph?.nodes || []).map((n) => [n.id, n]));
            const allEdges = [...currentPath.edges, ...(dualPath.shared_graph?.edges || [])];
            for (const edge of allEdges) {
              if (edge.type === "PREREQUISITE_OF") {
                if (edge.target === selectedNode.id) {
                  const pn = pathNodeMap.get(edge.source);
                  const bn = bgNodeMap.get(edge.source);
                  const name = pn?.name || bn?.name;
                  if (name) {
                    const status = progress[edge.source] || (pn ? pn.status : "not_started");
                    prerequisites.push({ id: edge.source, name, status });
                  }
                }
                if (edge.source === selectedNode.id) {
                  const pn = pathNodeMap.get(edge.target);
                  const bn = bgNodeMap.get(edge.target);
                  const name = pn?.name || bn?.name;
                  if (name) {
                    const status = progress[edge.target] || (pn ? pn.status : "not_started");
                    unlocks.push({ id: edge.target, name, status });
                  }
                }
              }
            }
            return { prerequisites, unlocks };
          })()}
        />
      )}
    </div>
  );
}
