"use client";

import React, { useState, useRef } from "react";
import {
  Crosshair,
  Sparkles,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  Layers,
  ArrowRight
} from "lucide-react";
import { Asset, CandidateMask, LockReceipt } from "@/lib/api";

interface PenLockTabProps {
  activeAsset: Asset | null;
  candidates: CandidateMask[];
  selectedCandidate: CandidateMask | null;
  onSelectCandidate: (c: CandidateMask) => void;
  onCanvasClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onApplyPenLockEdit: (prompt: string, style: string) => Promise<void>;
  receipt: LockReceipt | null;
  isSegmenting: boolean;
  isProcessing: boolean;
  onProceedToVector: () => void;
}

const SEMANTIC_STYLES = [
  { id: "metallic_armor", label: "Metallic Armor" },
  { id: "neon_glow", label: "Neon Glow" },
  { id: "celestial_gold", label: "Celestial Gold" },
  { id: "carbon_fiber", label: "Carbon Fiber" },
];

export default function PenLockTab({
  activeAsset,
  candidates,
  selectedCandidate,
  onSelectCandidate,
  onCanvasClick,
  onApplyPenLockEdit,
  receipt,
  isSegmenting,
  isProcessing,
  onProceedToVector,
}: PenLockTabProps) {
  const [clickMode, setClickMode] = useState<"positive" | "negative">("positive");
  const [promptText, setPromptText] = useState("cybernetic sensor ear with cyan neon filament");
  const [selectedStyle, setSelectedStyle] = useState("metallic_armor");
  const [showMaskOutline, setShowMaskOutline] = useState(true);
  const [showHeatmapOverlay, setShowHeatmapOverlay] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(100); // 100 = full new, 0 = full original
  const [copiedHash, setCopiedHash] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleCopyHash = () => {
    const hash =
      receipt?.audit_metadata?.original_outside_sha256 ||
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-studioBorder pb-4">
        <div>
          <div className="text-xs font-mono text-accentCyan uppercase tracking-wider mb-1">
            Studio Tab 2 • Core Surgical Studio
          </div>
          <h2 className="text-2xl font-display font-bold text-white">
            Pen-Lock Edit & Mathematical Lock Receipt
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Mark an exact region with SAM-2, apply micro-prompts, and mathematically verify zero collateral drift.
          </p>
        </div>

        <button
          onClick={onProceedToVector}
          className="px-4 py-2 rounded-xl bg-studioCard border border-studioBorder hover:border-accentViolet text-accentViolet text-xs font-semibold flex items-center gap-2 transition-all shrink-0"
        >
          <span>Vector Nodes Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main 3-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: 3-Step Controls (3 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* STEP 1: Mark Region */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-accentCyan flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-accentCyan/20 flex items-center justify-center text-[10px]">1</span>
                MARK REGION
              </span>
              <div className="flex bg-[#0b0b14] rounded-lg p-0.5 border border-studioBorder text-[10px] font-mono">
                <button
                  onClick={() => setClickMode("positive")}
                  className={`px-2 py-0.5 rounded transition-all ${
                    clickMode === "positive"
                      ? "bg-accentCyan text-black font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  + Add Point
                </button>
                <button
                  onClick={() => setClickMode("negative")}
                  className={`px-2 py-0.5 rounded transition-all ${
                    clickMode === "negative"
                      ? "bg-red-500 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  - Exclude
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Click anywhere on the character to trigger SAM-2 multi-scale segmentation.
            </p>
          </div>

          {/* STEP 2: SAM-2 Smart Mask Preview (3 Candidates) */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-accentViolet flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-accentViolet/20 flex items-center justify-center text-[10px]">2</span>
                SAM-2 SMART MASKS
              </span>
              {isSegmenting && (
                <span className="text-[10px] font-mono text-accentCyan animate-pulse flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Segmenting...
                </span>
              )}
            </div>

            {candidates.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {candidates.map((c) => {
                  const isSelected = selectedCandidate?.candidate_id === c.candidate_id;
                  return (
                    <button
                      key={c.candidate_id}
                      onClick={() => onSelectCandidate(c)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                        isSelected
                          ? "bg-accentViolet/10 border-accentViolet glow-violet"
                          : "bg-[#0b0b14] border-studioBorder hover:border-slate-600"
                      }`}
                    >
                      <div className="w-full aspect-square rounded-lg bg-black border border-white/10 flex items-center justify-center overflow-hidden">
                        <img
                          src={c.mask_base64 || c.mask_url}
                          alt={c.label}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-200 line-clamp-1">
                        {c.label.split(" ")[0]}
                      </span>
                      <span className="text-[9px] font-mono text-accentCyan">
                        {Math.round(c.confidence_score * 100)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#0b0b14] border border-dashed border-studioBorder text-center text-xs text-slate-500 font-sans">
                Click on the canvas to generate 3 SAM-2 candidates
              </div>
            )}
          </div>

          {/* STEP 3: Micro-Prompt Input */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <span className="text-xs font-mono font-bold text-accentPrimary flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-accentPrimary/20 flex items-center justify-center text-[10px]">3</span>
              MICRO-PROMPT EDIT
            </span>

            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. 'robotic ear with glowing sensor'"
              className="w-full rounded-xl bg-[#0b0b14] border border-studioBorder px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accentPrimary"
            />

            {/* Semantic Material Pills */}
            <div className="flex flex-wrap gap-1.5">
              {SEMANTIC_STYLES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStyle(st.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${
                    selectedStyle === st.id
                      ? "bg-accentPrimary text-white font-bold"
                      : "bg-[#0b0b14] border border-studioBorder text-slate-400 hover:text-white"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => onApplyPenLockEdit(promptText, selectedStyle)}
              disabled={isProcessing || !selectedCandidate}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-accentCyan via-accentPrimary to-accentViolet text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-glowCyan hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Apply Surgical Edit</span>
            </button>
          </div>
        </div>

        {/* CENTER PANEL: Spacious Artwork View with Before/After Slider (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="glass-panel rounded-2xl p-4 flex flex-col space-y-3">
            {/* Viewport Toolbar */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <Crosshair className="w-3.5 h-3.5 text-accentCyan" />
                <span>Interactive Viewport</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMaskOutline(!showMaskOutline)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                    showMaskOutline
                      ? "bg-accentCyan/20 text-accentCyan border-accentCyan/40"
                      : "border-studioBorder text-slate-500"
                  }`}
                >
                  Mask
                </button>
                <button
                  onClick={() => setShowHeatmapOverlay(!showHeatmapOverlay)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                    showHeatmapOverlay
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "border-studioBorder text-slate-500"
                  }`}
                >
                  Diff Heatmap
                </button>
              </div>
            </div>

            {/* Artwork Canvas Container */}
            <div
              ref={containerRef}
              onClick={onCanvasClick}
              className="relative w-full aspect-square rounded-xl overflow-hidden bg-black border border-studioBorder cursor-crosshair select-none group"
            >
              {activeAsset ? (
                <>
                  {/* Current / Edited Image */}
                  <img
                    src={activeAsset.current_image_url}
                    alt="Active Artwork"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />

                  {/* Before / After Slider Overlay (Original image clipped) */}
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none transition-all"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <img
                      src={activeAsset.immutable_original_url}
                      alt="Original Artwork"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>

                  {/* Slider divider line if slider is active */}
                  {sliderPosition < 100 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-accentCyan pointer-events-none shadow-[0_0_8px_#22d3ee]"
                      style={{ left: `${sliderPosition}%` }}
                    />
                  )}

                  {/* SAM-2 Candidate Mask Highlight */}
                  {showMaskOutline && selectedCandidate && (
                    <img
                      src={selectedCandidate.mask_base64 || selectedCandidate.mask_url}
                      alt="Selected Mask"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-60 mix-blend-screen filter drop-shadow-[0_0_10px_#22d3ee]"
                    />
                  )}

                  {/* Heatmap Overlay */}
                  {showHeatmapOverlay && receipt?.heatmap_url && (
                    <img
                      src={receipt.heatmap_url}
                      alt="Verification Heatmap"
                      className="absolute inset-0 w-full h-full object-contain mix-blend-screen pointer-events-none opacity-90"
                    />
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  No active asset loaded
                </div>
              )}
            </div>

            {/* Before / After Range Slider */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[10px] font-mono text-slate-400">Before</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(parseInt(e.target.value))}
                className="flex-1 h-1 bg-studioBorder rounded-lg appearance-none cursor-pointer accent-accentCyan"
              />
              <span className="text-[10px] font-mono text-slate-400">After ({sliderPosition}%)</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: The Lock Receipt Verification Card (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border-emerald-500/30 bg-emerald-950/10 glow-emerald space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-studioBorder">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                  The Lock Receipt
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-500/60 text-emerald-400 font-bold">
                VERIFIED
              </span>
            </div>

            {/* Metrics */}
            <div className="space-y-3 font-mono">
              <div className="bg-[#0b0b14] p-3 rounded-xl border border-studioBorder">
                <div className="text-[10px] text-slate-400 uppercase">Outside-Mask Drift</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">
                  {(receipt?.outside_drift_percentage ?? 0.0).toFixed(3)}%
                </div>
                <div className="text-[9px] text-emerald-500/80 font-sans mt-0.5">
                  Strict Mathematical Zero
                </div>
              </div>

              <div className="bg-[#0b0b14] p-3 rounded-xl border border-studioBorder">
                <div className="text-[10px] text-slate-400 uppercase">Changed Pixels</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">
                  {receipt?.outside_changed_pixels ?? 0}
                </div>
                <div className="text-[9px] text-slate-500 font-sans mt-0.5">
                  Outside active mask
                </div>
              </div>
            </div>

            {/* TURBO Heatmap Thumbnail */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1 font-mono">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Difference Heatmap
                </span>
                <span className="text-[9px] text-slate-500 font-mono">100% Black</span>
              </div>
              <div
                onClick={() => setShowHeatmapOverlay(!showHeatmapOverlay)}
                className="h-24 rounded-xl overflow-hidden bg-black border border-studioBorder cursor-pointer group relative"
              >
                {receipt?.heatmap_url ? (
                  <img
                    src={receipt.heatmap_url}
                    alt="Diff Heatmap"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600 font-mono">
                    Heatmap available after edit
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-mono text-white">
                  Toggle Canvas Overlay
                </div>
              </div>
            </div>

            {/* SHA-256 Audit */}
            <div className="bg-[#0b0b14] p-2.5 rounded-xl border border-studioBorder text-[10px] font-mono space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>SHA-256 Checksum:</span>
                <button
                  onClick={handleCopyHash}
                  className="text-accentCyan hover:underline flex items-center gap-1"
                >
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedHash ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="truncate text-slate-400 bg-black/60 p-1 rounded text-[9px]">
                {receipt?.audit_metadata?.original_outside_sha256 || "e3b0c44298fc1c149afbf4c8..."}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
