"use client";

import React, { useState } from "react";
import {
  Compass,
  Zap,
  RefreshCw,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Asset, RigData, LockReceipt } from "@/lib/api";

interface MultiViewTabProps {
  assets: Asset[];
  activeAssetId: string;
  onSelectAsset: (asset: Asset) => void;
  onSyncTurnaround: (prompt: string) => Promise<void>;
  rigData: RigData | null;
  receipt: LockReceipt | null;
  isProcessing: boolean;
  onProceedToRelight: () => void;
}

const VIEW_TITLES: Record<string, { name: string; angle: string }> = {
  front: { name: "Front Camera", angle: "0° Facing" },
  three_quarter: { name: "Three-Quarter", angle: "45° Isometric" },
  side: { name: "Side Profile", angle: "90° Orthographic" },
  back: { name: "Rear View", angle: "180° Back" },
};

export default function MultiViewTab({
  assets,
  activeAssetId,
  onSelectAsset,
  onSyncTurnaround,
  rigData,
  receipt,
  isProcessing,
  onProceedToRelight,
}: MultiViewTabProps) {
  const [showRig, setShowRig] = useState(false);
  const [syncPrompt, setSyncPrompt] = useState("cybernetic sensor ear");
  const [isSyncingPulse, setIsSyncingPulse] = useState(false);
  const [localRig, setLocalRig] = useState<RigData | null>(rigData);
  const [draggingJointId, setDraggingJointId] = useState<number | null>(null);

  const activeAsset = assets.find((a) => a.id === activeAssetId) || assets[0];

  const handleSyncClick = async () => {
    setIsSyncingPulse(true);
    await onSyncTurnaround(syncPrompt);
    setTimeout(() => setIsSyncingPulse(false), 1500);
  };

  // Drag joint logic for 2D Rig Puppet-then-Polish
  const handleJointPointerDown = (id: number, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingJointId(id);
  };

  const handleJointPointerMove = (e: React.PointerEvent, svgEl: SVGSVGElement | null) => {
    if (draggingJointId === null || !svgEl || !activeAsset) return;
    const rect = svgEl.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * activeAsset.width);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * activeAsset.height);

    setLocalRig((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        keypoints: {
          ...prev.keypoints,
          [draggingJointId]: {
            ...prev.keypoints[draggingJointId],
            x,
            y,
          },
        },
      };
    });
  };

  const handleJointPointerUp = (e: React.PointerEvent) => {
    if (draggingJointId !== null) {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {}
      setDraggingJointId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-studioBorder pb-4">
        <div>
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            Studio Tab 4 • Multi-Angle Consistency
          </div>
          <h2 className="text-2xl font-display font-bold text-white">
            Multi-View Turnaround & 2D Rig
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Synchronize surgical edits across 4 viewpoints and adjust 2D skeletal puppet joints with zero collateral drift.
          </p>
        </div>

        <button
          onClick={onProceedToRelight}
          className="px-4 py-2 rounded-xl bg-studioCard border border-studioBorder hover:border-accentCyan text-accentCyan text-xs font-semibold flex items-center gap-2 transition-all shrink-0"
        >
          <span>Relighting & Export</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sync Action Control Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-display font-bold text-white block">
              Cross-View Auto-Propagate (Grounded-SAM + IP-Adapter)
            </span>
            <span className="text-[11px] text-slate-400 font-sans">
              Edit made in Front View will locate and update the same feature in 3/4, Side, and Rear views.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowRig(!showRig)}
            className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-1.5 border transition-all ${
              showRig
                ? "bg-accentCyan/20 text-accentCyan border-accentCyan/50"
                : "bg-studioCard text-slate-400 border-studioBorder hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>2D Rig Overlay {showRig ? "[ON]" : "[OFF]"}</span>
          </button>

          <button
            onClick={handleSyncClick}
            disabled={isProcessing}
            className={`px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-40 shrink-0 ${
              isSyncingPulse ? "ring-4 ring-emerald-400/50 animate-pulse" : ""
            }`}
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>Sync Edit Across All Views</span>
          </button>
        </div>
      </div>

      {/* 4-View Turnaround Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {assets.map((asset) => {
          const isSelected = asset.id === activeAsset?.id;
          const meta = VIEW_TITLES[asset.view_type] || {
            name: asset.view_type.toUpperCase(),
            angle: "Angle",
          };

          return (
            <div
              key={asset.id}
              onClick={() => onSelectAsset(asset)}
              className={`glass-panel rounded-2xl p-4 flex flex-col space-y-3 cursor-pointer transition-all border ${
                isSelected
                  ? "border-accentCyan bg-accentCyan/5 glow-cyan"
                  : "border-studioBorder hover:border-slate-600"
              } ${isSyncingPulse ? "ring-2 ring-emerald-400/40" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm text-white">{meta.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{meta.angle}</span>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-accentCyan shadow-[0_0_8px_#22d3ee]" />
                )}
              </div>

              {/* View Canvas with optional Rig Overlay */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black border border-studioBorder">
                <img
                  src={asset.current_image_url}
                  alt={meta.name}
                  className="w-full h-full object-cover"
                />

                {/* 2D Skeletal Joint Rig Overlay (DWPose) */}
                {showRig && (localRig || rigData) && (
                  <svg
                    viewBox={`0 0 ${asset.width} ${asset.height}`}
                    className="absolute inset-0 w-full h-full pointer-events-auto"
                    onPointerMove={(e) => handleJointPointerMove(e, e.currentTarget)}
                    onPointerUp={handleJointPointerUp}
                  >
                    {(localRig || rigData)?.bones.map((b, idx) => {
                      const p1 = (localRig || rigData)?.keypoints[b.from];
                      const p2 = (localRig || rigData)?.keypoints[b.to];
                      if (!p1 || !p2) return null;
                      return (
                        <line
                          key={idx}
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke="#00ff9d"
                          strokeWidth="4"
                          strokeLinecap="round"
                          opacity="0.8"
                        />
                      );
                    })}
                    {Object.values((localRig || rigData)?.keypoints || {}).map((kp) => (
                      <circle
                        key={kp.id}
                        cx={kp.x}
                        cy={kp.y}
                        r="8"
                        fill="#ffd600"
                        stroke="#000000"
                        strokeWidth="2.5"
                        className="cursor-move hover:scale-125 transition-transform"
                        onPointerDown={(e) => handleJointPointerDown(kp.id, e)}
                      />
                    ))}
                  </svg>
                )}

                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-slate-300 border border-white/10">
                  {asset.width}×{asset.height}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  Synced
                </span>
                <span>0.000% Drift</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
