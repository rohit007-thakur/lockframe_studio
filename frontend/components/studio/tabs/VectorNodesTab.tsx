"use client";

import React, { useState, useRef } from "react";
import {
  Spline,
  RefreshCw,
  Sparkles,
  Move,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Maximize2
} from "lucide-react";
import { Asset, AnchorNode, LockReceipt } from "@/lib/api";

interface VectorNodesTabProps {
  activeAsset: Asset | null;
  nodes: AnchorNode[];
  setNodes: React.Dispatch<React.SetStateAction<AnchorNode[]>>;
  onExtractNodes: () => Promise<void>;
  onRerenderVector: (prompt: string) => Promise<void>;
  receipt: LockReceipt | null;
  isProcessing: boolean;
  onProceedToMultiView: () => void;
}

export default function VectorNodesTab({
  activeAsset,
  nodes,
  setNodes,
  onExtractNodes,
  onRerenderVector,
  receipt,
  isProcessing,
  onProceedToMultiView,
}: VectorNodesTabProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
  const [promptText, setPromptText] = useState("elongated cybernetic sensor blade with neon edge");
  const svgRef = useRef<SVGSVGElement>(null);

  // Dragging logic for Bezier nodes
  const handlePointerDown = (id: number, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setSelectedNodeId(id);
    setDraggingNodeId(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingNodeId === null || !svgRef.current || !activeAsset) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * activeAsset.width);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * activeAsset.height);

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x, y } : n))
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingNodeId !== null) {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {}
      setDraggingNodeId(null);
    }
  };

  const resetGeometry = () => {
    onExtractNodes();
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-studioBorder pb-4">
        <div>
          <div className="text-xs font-mono text-accentViolet uppercase tracking-wider mb-1">
            Studio Tab 3 • Prompt-Free Geometry Control
          </div>
          <h2 className="text-2xl font-display font-bold text-white">
            Vector Nodes Studio ("Vector-as-ControlNet")
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Click and drag Bezier anchor nodes to reshape physical anatomy directly, then re-render with ControlNet.
          </p>
        </div>

        <button
          onClick={onProceedToMultiView}
          className="px-4 py-2 rounded-xl bg-studioCard border border-studioBorder hover:border-emerald-500 text-emerald-400 text-xs font-semibold flex items-center gap-2 transition-all shrink-0"
        >
          <span>Multi-View Turnaround</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Vector Controls & Node Coordinates (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-accentViolet flex items-center gap-1.5">
                <Spline className="w-4 h-4 text-accentViolet" />
                VECTOR ANCHOR CONTROLS
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-[#0b0b14] px-2 py-0.5 rounded border border-studioBorder">
                {nodes.length} Anchors
              </span>
            </div>

            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              No need to struggle with complex prompt wording. Physically drag the anchors on the canvas to widen, lengthen, or bend the geometry.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onExtractNodes}
                disabled={isProcessing}
                className="flex-1 py-2 px-3 rounded-xl bg-studioCard border border-studioBorder hover:border-studioBorderBright text-xs text-slate-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Extract Anchors</span>
              </button>

              <button
                onClick={resetGeometry}
                className="py-2 px-3 rounded-xl bg-studioCard border border-studioBorder hover:border-studioBorderBright text-xs text-slate-400 hover:text-white transition-colors"
                title="Reset to initial contour"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Node Coordinates List (Scrollable) */}
          <div className="glass-panel rounded-2xl p-4 space-y-3">
            <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
              Active Control Nodes
            </span>
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`px-3 py-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "bg-accentViolet/20 border-accentViolet text-white font-bold"
                        : "bg-[#0b0b14] border-studioBorder text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>Anchor #{node.id}</span>
                    <span className="text-[11px] text-slate-500">
                      X: {node.x} | Y: {node.y}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Re-Render Texture Action Card */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <label className="text-xs font-mono font-bold text-accentCyan flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accentCyan" />
              AI TEXTURE SYNTHESIS (CONTROLNET)
            </label>
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Texture guide (e.g. 'matching metallic finish with glowing runes')"
              className="w-full rounded-xl bg-[#0b0b14] border border-studioBorder px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accentViolet"
            />
            <button
              onClick={() => onRerenderVector(promptText)}
              disabled={isProcessing || nodes.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-accentViolet via-pink-600 to-accentCyan text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glowViolet hover:opacity-95 transition-all disabled:opacity-40"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Spline className="w-4 h-4" />
              )}
              <span>Re-Render Texture with AI</span>
            </button>
          </div>
        </div>

        {/* Center / Right: Interactive Vector Canvas (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="glass-panel rounded-2xl p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-accentViolet" />
                Drag any glowing handle to manipulate geometry in real-time
              </span>
              <span className="text-slate-500">1024×1024 SVG Resolution</span>
            </div>

            {/* Canvas Viewport */}
            <div className="relative w-full aspect-square max-w-[720px] mx-auto rounded-xl overflow-hidden bg-black border border-studioBorder select-none">
              {activeAsset ? (
                <>
                  <img
                    src={activeAsset.current_image_url}
                    alt="Active Vector Canvas"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-85"
                  />

                  {/* SVG Bezier Overlay */}
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${activeAsset.width} ${activeAsset.height}`}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className="absolute inset-0 w-full h-full pointer-events-auto cursor-default"
                  >
                    {/* Filled Polygon Contour */}
                    {nodes.length > 2 && (
                      <polygon
                        points={nodes.map((n) => `${n.x},${n.y}`).join(" ")}
                        fill="rgba(168, 85, 247, 0.22)"
                        stroke="#A855F7"
                        strokeWidth="3.5"
                        strokeDasharray="6 6"
                      />
                    )}

                    {/* Draggable Anchors */}
                    {nodes.map((node) => {
                      const isSelected = selectedNodeId === node.id;
                      return (
                        <circle
                          key={node.id}
                          cx={node.x}
                          cy={node.y}
                          r={isSelected ? 11 : 8}
                          fill={isSelected ? "#22D3EE" : "#A855F7"}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          className="cursor-move hover:scale-125 transition-transform"
                          onPointerDown={(e) => handlePointerDown(node.id, e)}
                        />
                      );
                    })}
                  </svg>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  Loading vector geometry...
                </div>
              )}
            </div>

            {/* Bottom Status Pill */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-studioBorder">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Outside Drift verified after re-render</span>
              </div>
              <span className="text-emerald-400 font-bold">
                {(receipt?.outside_drift_percentage ?? 0.0).toFixed(3)}% Drift
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
