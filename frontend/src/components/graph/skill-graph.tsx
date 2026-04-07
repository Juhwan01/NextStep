"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
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

const nodeTypes = { skillNode: SkillNode };
const edgeTypes = { pathEdge: PathEdge };

interface SkillGraphProps {
  dualPath: DualPath;
  pathId: string;
  initialProgress?: ProgressMap;
}

export function SkillGraph({ dualPath, pathId, initialProgress = {} }: SkillGraphProps) {
  const [pathType, setPathType] = useState<"fast_track" | "fundamentals">("fast_track");
  const [selectedNode, setSelectedNode] = useState<PathNodeType | null>(null);
  const [progress, setProgress] = useState<ProgressMap>(initialProgress);

  const currentPath = pathType === "fast_track" ? dualPath.fast_track : dualPath.fundamentals;

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => transformToReactFlow(currentPath, pathType, progress, dualPath.shared_graph),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when path type or progress changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = transformToReactFlow(currentPath, pathType, progress, dualPath.shared_graph);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [pathType, currentPath, progress, dualPath.shared_graph, setNodes, setEdges]);

  const handleProgressChange = useCallback(async (nodeId: string, newStatus: ProgressStatus) => {
    // Optimistic update
    setProgress((prev) => ({ ...prev, [nodeId]: newStatus }));

    // Update selected node status locally
    setSelectedNode((prev) =>
      prev && prev.id === nodeId ? { ...prev, status: newStatus } : prev
    );

    try {
      await pathApi.updateProgress(pathId, nodeId, newStatus);
    } catch {
      // Revert on failure
      setProgress((prev) => {
        const reverted = { ...prev };
        delete reverted[nodeId];
        return reverted;
      });
    }
  }, [pathId]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    // Ignore background (non-path) nodes
    if ((node.data as any)?.nodeRole === "background") return;

    const pathNode = currentPath.nodes.find((n) => n.id === node.id);
    if (pathNode) {
      const effectiveStatus = progress[pathNode.id] || pathNode.status;
      setSelectedNode({ ...pathNode, status: effectiveStatus });
    }
  }, [currentPath, progress]);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Count completed nodes for header
  const completedCount = currentPath.nodes.filter(
    (n) => progress[n.id] === "completed"
  ).length;

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
          minZoom={0.3}
          maxZoom={1.5}
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

      {/* Node detail panel */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          pathId={pathId}
          onClose={() => setSelectedNode(null)}
          onProgressChange={handleProgressChange}
        />
      )}
    </div>
  );
}
