"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, Flame, Sliders } from "lucide-react";

export default function ComparisonSection() {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <section className="py-20 px-6 lg:px-16 border-t border-studioBorder bg-studioBg/50 relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-studioCard border border-studioBorder text-accentViolet text-xs font-mono">
            <Sliders className="w-3.5 h-3.5" />
            <span>The Collateral Drift Problem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            Standard AI Re-Prompting vs. LockFrame
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-sans">
            Prompting an image model to edit one feature typically regenerates the whole canvas, losing your character’s likeness. LockFrame mathematically guarantees zero drift.
          </p>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Typical AI Generation */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between space-y-5 border-red-500/20 bg-red-950/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400 font-display font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span>Typical AI Re-Prompting</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-red-950 border border-red-500/40 text-red-400 font-semibold">
                18.4% COLLATERAL DRIFT
              </span>
            </div>

            {/* Visual simulation */}
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black/60 border border-red-500/20 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80"
                alt="Typical AI drift"
                className="w-full h-full object-cover opacity-70 filter blur-[0.6px]"
              />
              <div className="absolute inset-0 bg-red-500/10 backdrop-contrast-125" />
              <div className="absolute top-3 left-3 bg-red-950/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-red-300 border border-red-500/30">
                Face mutated • Background shifted • Outfit changed
              </div>
            </div>

            <ul className="text-xs text-slate-400 space-y-2 font-mono">
              <li className="flex items-center gap-2">
                <span className="text-red-400">✕</span> Uncontrollable micro-drift across entire canvas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✕</span> Character style & color palette contaminated
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✕</span> Zero cryptographic guarantee for clients/studios
              </li>
            </ul>
          </div>

          {/* Card 2: LockFrame Studio Pen-Lock */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between space-y-5 border-emerald-500/30 bg-emerald-950/10 glow-emerald">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-display font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>LockFrame Pen-Lock Studio</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold">
                0.000% OUTSIDE DRIFT
              </span>
            </div>

            {/* Visual simulation */}
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black/60 border border-emerald-500/30 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
                alt="LockFrame surgical edit"
                className="w-full h-full object-cover"
              />
              {/* Target edit circle */}
              <div className="absolute top-1/3 right-1/3 w-16 h-16 rounded-full border-2 border-accentCyan bg-accentCyan/20 animate-pulse flex items-center justify-center text-[10px] font-mono text-white font-bold">
                Pen-Lock
              </div>
              <div className="absolute top-3 left-3 bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Byte-for-byte outside mask identity</span>
              </div>
            </div>

            <ul className="text-xs text-slate-300 space-y-2 font-mono">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Exactly 0 outside pixels altered (100% Black diff heatmap)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Vector-as-ControlNet Bezier node geometry adjustments
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Cryptographic SHA-256 Lock Receipt audit trail
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
