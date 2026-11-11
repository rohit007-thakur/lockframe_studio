"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Layers,
  Compass,
  PenTool,
  Lock,
  ArrowRight,
  RefreshCw,
  Palette,
  CheckCircle2,
  Play
} from "lucide-react";
import { Project, Asset } from "@/lib/api";

interface CreateBaseTabProps {
  project: Project | null;
  activeAsset: Asset | null;
  onGenerateBase: (prompt: string, mode: "2d" | "multiview") => Promise<void>;
  onLoadHeroDemo: () => void;
  onProceedToEdit: () => void;
  isProcessing: boolean;
}

const STYLE_TAGS = [
  "Anime Mecha",
  "Concept Art",
  "Cel-Shaded",
  "Stylized 3D",
  "Cyberpunk",
  "Dark Fantasy",
];

export default function CreateBaseTab({
  project,
  activeAsset,
  onGenerateBase,
  onLoadHeroDemo,
  onProceedToEdit,
  isProcessing,
}: CreateBaseTabProps) {
  const [mode, setMode] = useState<"2d" | "multiview">("multiview");
  const [prompt, setPrompt] = useState(
    "Futuristic anime warrior with a glowing katana and cybernetic armor"
  );
  const [showSketchPad, setShowSketchPad] = useState(false);

  const characterMeta = project?.character_metadata;

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4">
      {/* 1. Header & Step Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-studioBorder pb-4">
        <div>
          <div className="text-xs font-mono text-accentCyan uppercase tracking-wider mb-1">
            Studio Tab 1 • Create Base
          </div>
          <h2 className="text-2xl font-display font-bold text-white">
            AI Prompt & Sketch Studio
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Establish your base character with artist intent memory and immutable seed locking.
          </p>
        </div>

        <button
          onClick={onLoadHeroDemo}
          className="px-4 py-2 rounded-xl bg-studioCard border border-studioBorder hover:border-studioBorderBright text-accentViolet text-xs font-semibold flex items-center gap-2 transition-all shadow-sm shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-accentViolet/30" />
          <span>Load Pre-Cached Hero</span>
        </button>
      </div>

      {/* 2. Mode Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => setMode("2d")}
          className={`glass-panel p-5 rounded-2xl cursor-pointer transition-all border ${
            mode === "2d"
              ? "border-accentCyan bg-accentCyan/5 glow-cyan"
              : "border-studioBorder hover:border-studioBorderBright"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accentCyan/20 text-accentCyan flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-base text-white">2D Illustration Mode</h3>
            </div>
            {mode === "2d" && <CheckCircle2 className="w-5 h-5 text-accentCyan" />}
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            High-fidelity single canvas illustration with surgical inpainting, normal-map relighting, and vector geometry reshaping.
          </p>
        </div>

        <div
          onClick={() => setMode("multiview")}
          className={`glass-panel p-5 rounded-2xl cursor-pointer transition-all border ${
            mode === "multiview"
              ? "border-accentViolet bg-accentViolet/5 glow-violet"
              : "border-studioBorder hover:border-studioBorderBright"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accentViolet/20 text-accentViolet flex items-center justify-center font-bold">
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-base text-white">
                Multi-View Turnaround Mode
              </h3>
            </div>
            {mode === "multiview" && <CheckCircle2 className="w-5 h-5 text-accentViolet" />}
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Synchronized 4-camera turnaround (Front 0°, 3/4 45°, Profile 90°, Rear 180°) with automated cross-view edit propagation.
          </p>
        </div>
      </div>

      {/* 3. Prompt & Sketch Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Optional Rough Sketch Pad Toggle */}
        {showSketchPad && (
          <div className="lg:col-span-4 glass-panel rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5 font-mono">
                <PenTool className="w-3.5 h-3.5 text-accentCyan" />
                Rough Sketch Guide
              </span>
              <button
                onClick={() => setShowSketchPad(false)}
                className="text-slate-500 hover:text-slate-300 text-[10px]"
              >
                Hide
              </button>
            </div>
            <div className="aspect-square w-full rounded-xl bg-black border border-studioBorder relative flex items-center justify-center cursor-crosshair">
              <span className="text-[11px] text-slate-500 font-mono">
                Canvas Guide Ready (ControlNet Scribble)
              </span>
            </div>
          </div>
        )}

        {/* Center / Main Prompt Box */}
        <div className={`${showSketchPad ? "lg:col-span-8" : "lg:col-span-12"} space-y-4`}>
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accentPrimary" />
                AI Prompt (Gemini + Flux Base Generator)
              </label>

              <button
                onClick={() => setShowSketchPad(!showSketchPad)}
                className="text-xs text-accentCyan hover:underline font-mono flex items-center gap-1"
              >
                <PenTool className="w-3 h-3" />
                {showSketchPad ? "Hide Sketch Pad" : "Add Rough Sketch Guide"}
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe your character in detail (e.g. 'Futuristic cybernetic hero with glowing visor...')"
              className="w-full rounded-xl bg-[#0b0b14] border border-studioBorder p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accentPrimary focus:ring-1 focus:ring-accentPrimary transition-all font-sans"
            />

            {/* Quick Style Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-500 font-mono">Style Tags:</span>
              {STYLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setPrompt((prev) => `${prev}, ${tag}`)}
                  className="px-2.5 py-1 rounded-lg bg-studioBg border border-studioBorder text-[11px] text-slate-300 hover:text-white hover:border-accentPrimary transition-colors"
                >
                  +{tag}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-500 font-mono">
                Engine: Gemini 1.5 + Flux-Fill Pipeline
              </div>

              <button
                onClick={() => onGenerateBase(prompt, mode)}
                disabled={isProcessing}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-accentPrimary via-accentViolet to-accentCyan text-white font-semibold text-xs flex items-center gap-2 shadow-glowViolet hover:opacity-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Sparkles className="w-4 h-4 text-accentCyan" />
                )}
                <span>Generate Base Artwork</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Artist Intent Memory Card (Character Style Sheet) */}
      {activeAsset && (
        <div className="glass-panel rounded-2xl p-6 border-studioBorder space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-studioBorder">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-white">
                  Artist Intent Memory: Character Style Sheet
                </h4>
                <div className="text-[11px] text-slate-400 font-mono">
                  Immutable Original Locked • SHA-256 Verified
                </div>
              </div>
            </div>

            <button
              onClick={onProceedToEdit}
              className="px-5 py-2.5 rounded-xl bg-accentCyan text-black font-extrabold text-xs flex items-center gap-2 shadow-glowCyan hover:bg-cyan-300 transition-all shrink-0"
            >
              <span>Proceed to Pen-Lock Edit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 font-mono text-xs">
            {/* Color Palette */}
            <div className="bg-[#0b0b14] p-3 rounded-xl border border-studioBorder space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Color Palette
              </span>
              <div className="flex items-center gap-1.5">
                {(characterMeta?.color_palette || ["#22D3EE", "#A855F7", "#11111A", "#F3F4F6"]).map(
                  (c: string) => (
                    <div
                      key={c}
                      style={{ backgroundColor: c }}
                      className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                      title={c}
                    />
                  )
                )}
              </div>
            </div>

            {/* Materials */}
            <div className="bg-[#0b0b14] p-3 rounded-xl border border-studioBorder space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Locked Materials
              </span>
              <div className="text-slate-300 text-[11px] truncate">
                {characterMeta?.materials?.join(", ") || "Carbon-Fiber, Titanium, Lens"}
              </div>
            </div>

            {/* Fixed Seed */}
            <div className="bg-[#0b0b14] p-3 rounded-xl border border-studioBorder space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Deterministic Seed
              </span>
              <div className="text-accentCyan font-bold text-[11px]">
                {characterMeta?.fixed_seed || "4294967295"}
              </div>
            </div>

            {/* Preview Image Thumbnail */}
            <div className="bg-[#0b0b14] p-2 rounded-xl border border-studioBorder flex items-center gap-3">
              <img
                src={activeAsset.current_image_url}
                alt="Base Artwork"
                className="w-10 h-10 rounded-lg object-cover border border-studioBorder"
              />
              <div className="text-[10px] text-slate-400 font-sans">
                <div className="text-white font-semibold">{activeAsset.width}×{activeAsset.height}</div>
                <div>{project?.name || "Active Project"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
