"use client";

import React from "react";
import { ArrowRight, Sparkles, ShieldCheck, Cpu, Zap, Play } from "lucide-react";
import Hero3DScene from "../three/Hero3DScene";

interface LandingHeroProps {
  onLaunchStudio: () => void;
  onLoadHeroDemo: () => void;
}

export default function LandingHero({ onLaunchStudio, onLoadHeroDemo }: LandingHeroProps) {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-6 lg:px-16 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accentPrimary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accentViolet/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Column: Headlines & Action CTAs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-studioCard border border-studioBorder text-accentCyan text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-accentCyan" />
            <span>Mathematical Pixel-Space Guarantee</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-[1.1]">
            Edit one thing. <br />
            <span className="bg-gradient-to-r from-accentCyan via-accentPrimary to-accentViolet bg-clip-text text-transparent">
              Change nothing else.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-xl font-sans leading-relaxed">
            The AI art studio with a verifiable lock. Mark a surgical region with Pen-Lock, reshape geometry with Bezier vectors, and mathematically verify zero collateral change outside your selection.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onLaunchStudio}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-accentPrimary via-accentViolet to-accentCyan text-white font-semibold text-sm flex items-center gap-2.5 shadow-glowViolet hover:opacity-95 transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-accentCyan" />
              <span>Launch Studio Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onLoadHeroDemo}
              className="px-5 py-3.5 rounded-xl bg-studioCard border border-studioBorder hover:border-studioBorderBright text-slate-200 hover:text-white font-medium text-sm flex items-center gap-2 transition-all"
            >
              <Play className="w-4 h-4 text-accentViolet fill-accentViolet/20" />
              <span>Load Hero Demo Character</span>
            </button>
          </div>

          {/* Metrics Pill Grid */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-studioBorder max-w-lg">
            <div>
              <div className="text-2xl font-display font-bold text-accentCyan font-mono">0.000%</div>
              <div className="text-xs text-slate-400 mt-0.5">Outside-Mask Drift</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-accentViolet font-mono">SAM-2</div>
              <div className="text-xs text-slate-400 mt-0.5">Surgical Hierarchy</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-white font-mono">SHA-256</div>
              <div className="text-xs text-slate-400 mt-0.5">Cryptographic Audit</div>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Interactive WebGL Bust with PointLight */}
        <div className="lg:col-span-5 relative flex items-center justify-center">
          <div className="w-full aspect-square max-w-[480px] rounded-3xl bg-studioCard/60 border border-studioBorder p-4 shadow-studio backdrop-blur-xl relative overflow-hidden group">
            {/* Top Indicator */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-studioBg/80 backdrop-blur-md border border-studioBorder text-[11px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-accentCyan animate-ping" />
              <span>3D PointLight: Move Cursor to Relight</span>
            </div>

            {/* 3D Scene */}
            <Hero3DScene />

            {/* Bottom Status bar */}
            <div className="absolute bottom-4 inset-x-4 z-10 flex items-center justify-between px-4 py-2 rounded-xl bg-studioBg/80 backdrop-blur-md border border-studioBorder text-[11px] text-slate-400 font-mono">
              <span>Artifact: Valkyrie Core</span>
              <span className="text-accentCyan font-semibold">60 FPS WebGL</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
