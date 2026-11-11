"use client";

import React from "react";
import { Zap, Compass, RefreshCw } from "lucide-react";

export interface AssetTurnaround {
  id: string;
  project_id: string;
  view_type: string;
  immutable_original_url: string;
  current_image_url: string;
  width: number;
  height: number;
}

interface TurnaroundBarProps {
  assets: AssetTurnaround[];
  activeAssetId: string;
  onSelectView: (asset: AssetTurnaround) => void;
  onSyncTurnaround: () => void;
  isProcessing: boolean;
}

const VIEW_LABELS: Record<string, string> = {
  front: "Front View (0°)",
  three_quarter: "3/4 Angle (45°)",
  side: "Profile (90°)",
  back: "Rear View (180°)",
};

export default function TurnaroundBar({
  assets,
  activeAssetId,
  onSelectView,
  onSyncTurnaround,
  isProcessing,
}: TurnaroundBarProps) {
  return (
    <div className="h-20 border-t border-[#222738] bg-[#0c0e17] px-6 flex items-center justify-between shrink-0 shadow-lg z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
          <Compass className="w-4 h-4 text-brandCyan" />
          <span>Turnaround Angles:</span>
        </div>

        <div className="flex items-center gap-2.5">
          {assets.map((asset) => {
            const isActive = asset.id === activeAssetId;
            const label = VIEW_LABELS[asset.view_type] || asset.view_type.replace("_", " ");

            return (
              <button
                key={asset.id}
                onClick={() => onSelectView(asset)}
                className={`h-14 px-3 rounded-lg border flex items-center gap-2.5 transition-all ${
                  isActive
                    ? "border-brandCyan bg-brandCyan/10 text-white font-bold shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                    : "border-[#1e2334] bg-[#121520] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                }`}
              >
                <img
                  src={asset.current_image_url}
                  alt={label}
                  className="w-10 h-10 rounded-md object-cover border border-[#252a3b] bg-black"
                />
                <div className="text-left font-mono">
                  <div className="text-xs leading-none capitalize text-slate-200">
                    {asset.view_type.replace("_", " ")}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1">
                    {label.split(" ")[1] || ""}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onSyncTurnaround}
        disabled={isProcessing}
        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50"
      >
        {isProcessing ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Zap className="w-3.5 h-3.5 text-white" />
        )}
        <span>Propagate Edit to All 4 Views</span>
      </button>
    </div>
  );
}
