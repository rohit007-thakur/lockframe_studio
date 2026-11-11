"use client";

import React from "react";
import {
  ShieldCheck,
  Download,
  Sparkles,
  Layers,
  ArrowRight,
  ChevronRight
} from "lucide-react";

interface TopNavbarProps {
  currentView: "landing" | "studio";
  setCurrentView: (view: "landing" | "studio") => void;
  projectName?: string;
  isVerified?: boolean;
  onExportClick?: () => void;
}

export default function TopNavbar({
  currentView,
  setCurrentView,
  projectName = "Cyber Valkyrie Prototype",
  isVerified = true,
  onExportClick,
}: TopNavbarProps) {
  return (
    <header className="h-16 border-b border-studioBorder bg-studioBg/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      {/* 1. Brand Logo */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => setCurrentView("landing")}
          className="cursor-pointer flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accentPrimary via-accentViolet to-accentCyan flex items-center justify-center font-black text-black text-xs font-display tracking-wider shadow-glowCyan group-hover:scale-105 transition-transform">
            LF
          </div>
          <div>
            <div className="font-display font-bold text-base tracking-wider text-white flex items-center gap-1.5 leading-none">
              LOCKFRAME <span className="text-accentCyan font-medium text-xs">STUDIO</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">
              Verifiable AI Production
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-studioBorder mx-2 hidden sm:block" />

        {/* View Switcher Tabs */}
        <nav className="flex items-center bg-studioCard rounded-xl p-1 border border-studioBorder">
          <button
            onClick={() => setCurrentView("landing")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              currentView === "landing"
                ? "bg-accentPrimary text-white font-semibold shadow-md"
                : "text-slate-400 hover:text-white hover:bg-studioCardHover"
            }`}
          >
            Overview & 3D Showcase
          </button>
          <button
            onClick={() => setCurrentView("studio")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              currentView === "studio"
                ? "bg-gradient-to-r from-accentPrimary to-accentViolet text-white font-semibold shadow-glowViolet"
                : "text-slate-400 hover:text-white hover:bg-studioCardHover"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-accentCyan" />
            Studio Workspace (App)
          </button>
        </nav>
      </div>

      {/* 2. Project Status & CTA */}
      <div className="flex items-center gap-3">
        {currentView === "studio" && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-semibold">0.000% DRIFT</span>
            <span className="text-emerald-500/60">• VERIFIED</span>
          </div>
        )}

        {currentView === "landing" ? (
          <button
            onClick={() => setCurrentView("studio")}
            className="px-4 py-2 text-xs rounded-xl bg-gradient-to-r from-accentPrimary via-accentViolet to-accentCyan text-white font-semibold flex items-center gap-2 hover:opacity-95 shadow-glowViolet transition-all"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={onExportClick}
            className="px-3.5 py-1.5 text-xs rounded-xl bg-studioCard border border-studioBorder hover:border-studioBorderBright text-slate-200 hover:text-white font-medium flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-accentCyan" />
            <span>Export Assets</span>
          </button>
        )}
      </div>
    </header>
  );
}
