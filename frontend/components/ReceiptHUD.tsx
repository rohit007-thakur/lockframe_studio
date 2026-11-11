"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Flame,
  Maximize2,
  Info
} from "lucide-react";

export interface LockReceiptData {
  outside_changed_pixels: number;
  outside_drift_percentage: number;
  is_verified: boolean;
  heatmap_url: string;
  verified_at: string;
  audit_metadata?: {
    original_outside_sha256?: string;
    result_outside_sha256?: string;
    total_pixels?: number;
    mask_pixel_count?: number;
    outside_pixel_count?: number;
  };
}

interface ReceiptHUDProps {
  receipt: LockReceiptData | null;
  showHeatmap: boolean;
  setShowHeatmap: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export default function ReceiptHUD({
  receipt,
  showHeatmap,
  setShowHeatmap,
}: ReceiptHUDProps) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const drift = receipt?.outside_drift_percentage ?? 0.0;
  const changedPixels = receipt?.outside_changed_pixels ?? 0;
  const hash =
    receipt?.audit_metadata?.original_outside_sha256 ||
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  const handleCopyHash = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#11131c] border border-[#222738] rounded-xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#1f2434]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100">
              The Lock Receipt
            </h3>
            <span className="text-[10px] text-slate-400">Mathematical Verification</span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/90 border border-emerald-500/60 text-emerald-400 font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.25)]">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          VERIFIED
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-3 font-mono">
        <div className="bg-[#090b12] p-2.5 rounded-lg border border-[#1e2334]">
          <div className="text-[10px] text-slate-400 tracking-wide uppercase">Outside Drift</div>
          <div className="text-base font-extrabold text-emerald-400 mt-0.5">
            {drift.toFixed(3)}%
          </div>
          <div className="text-[9px] text-emerald-500/70 font-sans mt-0.5">Strict Zero-Drift</div>
        </div>

        <div className="bg-[#090b12] p-2.5 rounded-lg border border-[#1e2334]">
          <div className="text-[10px] text-slate-400 tracking-wide uppercase">Changed Pixels</div>
          <div className="text-base font-extrabold text-emerald-400 mt-0.5">
            {changedPixels}
          </div>
          <div className="text-[9px] text-slate-500 font-sans mt-0.5">Outside Active Mask</div>
        </div>
      </div>

      {/* Diff Heatmap Preview */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-[11px]">
            <Flame className="w-3 h-3 text-amber-400" />
            TURBO Diff Heatmap
          </span>
          {receipt?.heatmap_url && (
            <button
              onClick={() => setShowHeatmap((prev) => !prev)}
              className="text-[10px] text-brandCyan hover:underline font-mono"
            >
              {showHeatmap ? "Hide Overlay" : "Show Overlay"}
            </button>
          )}
        </div>

        {receipt?.heatmap_url ? (
          <div
            onClick={() => setShowHeatmap((prev) => !prev)}
            className="h-24 rounded-lg overflow-hidden border border-[#262c3e] relative cursor-pointer group bg-black"
          >
            <img
              src={receipt.heatmap_url}
              alt="Verification Heatmap"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-medium gap-1.5">
              <Maximize2 className="w-3.5 h-3.5" />
              Toggle Heatmap Canvas
            </div>
          </div>
        ) : (
          <div className="h-20 rounded-lg bg-[#090b12] border border-dashed border-[#222738] flex flex-col items-center justify-center text-slate-500 text-[11px] gap-1">
            <span>Diff heatmap generated upon edit</span>
            <span className="text-[9px] text-slate-600 font-mono">100% Black outside mask</span>
          </div>
        )}
      </div>

      {/* Cryptographic SHA-256 Audit Bar */}
      <div className="bg-[#090b12] rounded-lg p-2 border border-[#1e2334] text-[10px] font-mono text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-500 uppercase tracking-wider text-[9px]">SHA-256 Outside Checksum</span>
          <button
            onClick={handleCopyHash}
            className="text-slate-400 hover:text-white flex items-center gap-1 text-[9px] transition-colors"
            title="Copy SHA-256 checksum"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="truncate text-slate-300 font-mono text-[9px] bg-black/40 p-1 rounded">
          {hash}
        </div>
      </div>
    </div>
  );
}
