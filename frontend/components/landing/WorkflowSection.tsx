"use client";

import React from "react";
import { Sparkles, Crosshair, Spline, RefreshCw, ArrowRight } from "lucide-react";

interface WorkflowSectionProps {
  onStepClick: (stepIndex: number) => void;
}

const STEPS = [
  {
    step: "01",
    title: "AI Prompt / Sketch Base",
    desc: "Generate your character via Gemini/Flux prompts or rough brush sketch with artist intent memory locking.",
    icon: Sparkles,
    color: "from-accentPrimary to-indigo-600",
  },
  {
    step: "02",
    title: "Pen-Lock Surgical Edit",
    desc: "Click any sub-part with SAM-2 3-candidate selection, apply a micro-prompt, and verify 0.000% collateral drift.",
    icon: Crosshair,
    color: "from-accentCyan to-blue-600",
  },
  {
    step: "03",
    title: "Vector-as-ControlNet",
    desc: "Drag 8–20 Bezier anchor nodes to reshape physical anatomy directly, then re-render textures with ControlNet.",
    icon: Spline,
    color: "from-accentViolet to-pink-600",
  },
  {
    step: "04",
    title: "Multi-View Sync & Export",
    desc: "Propagate changes across 4 turnaround camera angles (0°, 45°, 90°, 180°) and export 2D skeletal rigs.",
    icon: RefreshCw,
    color: "from-emerald-500 to-teal-600",
  },
];

export default function WorkflowSection({ onStepClick }: WorkflowSectionProps) {
  return (
    <section className="py-20 px-6 lg:px-16 border-t border-studioBorder bg-studioBg">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-mono text-accentCyan uppercase tracking-widest">
            Production Pipeline
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            The 4-Step Verifiable Workflow
          </h2>
          <p className="text-sm text-slate-400 font-sans">
            How LockFrame Studio gives digital illustrators mathematical precision and total creative control.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                onClick={() => onStepClick(idx)}
                className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between space-y-6 cursor-pointer transition-all transform hover:-translate-y-1 group relative overflow-hidden"
              >
                {/* Step badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-accentCyan transition-colors">
                    STEP {s.step}
                  </span>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${s.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-display font-bold text-base text-white group-hover:text-accentCyan transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {s.desc}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-accentViolet font-semibold pt-2 border-t border-studioBorder group-hover:text-accentCyan transition-colors">
                  <span>Open in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
