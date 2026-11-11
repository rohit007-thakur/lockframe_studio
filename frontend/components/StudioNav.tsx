"use client";

import React from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Download,
  Lightbulb,
  SunMedium,
  Palette,
  Maximize2
} from "lucide-react";

interface StudioNavProps {
  studioMode: "2d" | "multiview";
  setStudioMode: (mode: "2d" | "multiview") => void;
  showOriginal: boolean;
  setShowOriginal: (show: boolean) => void;
  isRelightActive: boolean;
  setIsRelightActive: (active: boolean | ((prev: boolean) => boolean)) => void;
  lightColor: string;
  setLightColor: (color: string) => void;
  lightIntensity: number;
  setLightIntensity: (val: number) => void;
  exportUrl?: string;
  driftPercentage?: number;
}

const LIGHT_PRESETS = [
  { name: "Cyan Core", color: "#00f0ff" },
  { name: "Amber Sun", color: "#ffb703" },
  { name: "Neon Magenta", color: "#ff007f" },
  { name: "Studio Key", color: "#f8fafc" },
];

export default function StudioNav({
  studioMode,
  setStudioMode,
  showOriginal,
  setShowOriginal,
  isRelightActive,
  setIsRelightActive,
  lightColor,
  setLightColor,
  lightIntensity,
  setLightIntensity,
  exportUrl,
  driftPercentage = 0.0,
}: StudioNavProps) {
  return (
    <header className="h-14 border-b border-[#222738] bg-[#12141e]/95 backdrop-blur-md px-5 flex items-center justify-between shrink-0 shadow-lg z-30">
      {/* Brand & Mode */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brandCyan via-cyan-400 to-brandMagenta flex items-center justify-center font-black text-black text-sm tracking-wider shadow-[0_0_12px_rgba(0,240,255,0.4)]">
            LF
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-widest text-white leading-none">
              LOCKFRAME <span className="text-brandCyan text-xs font-semibold">STUDIO</span>
            </div>
            <div className="text-[9px] text-slate-400 tracking-wider uppercase font-mono mt-0.5">
              Zero-Drift Inpainting & 3D Relight
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Mode Selector */}
        <div className="flex bg-[#0a0c13] rounded-lg p-0.5 border border-[#262c3e]">
          <button
            onClick={() => setStudioMode("2d")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              studioMode === "2d"
                ? "bg-brandCyan text-black font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            2D Canvas
          </button>
          <button
            onClick={() => setStudioMode("multiview")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              studioMode === "multiview"
                ? "bg-brandCyan text-black font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            3D Turnaround (4-Angle)
          </button>
        </div>

        {/* Verification Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>OUTSIDE DRIFT: {driftPercentage.toFixed(3)}%</span>
        </div>
      </div>

      {/* Right Controls: 3D Relight, Before/After, Export */}
      <div className="flex items-center gap-3">
        {/* 3D Relight Shader Controls */}
        <div className="flex items-center bg-[#0a0c13] border border-[#262c3e] rounded-lg p-1 gap-2">
          <button
            onClick={() => setIsRelightActive((prev) => !prev)}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              isRelightActive
                ? "bg-brandCyan/20 text-brandCyan border border-brandCyan/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
            title="Interactive 3D WebGL Normal-Map Relighting"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3D Relight</span>
            <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isRelightActive ? "bg-brandCyan text-black font-bold" : "bg-slate-800 text-slate-400"}`}>
              {isRelightActive ? "ON" : "OFF"}
            </span>
          </button>

          {isRelightActive && (
            <>
              {/* Color Presets */}
              <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                {LIGHT_PRESETS.map((p) => (
                  <button
                    key={p.color}
                    onClick={() => setLightColor(p.color)}
                    style={{ backgroundColor: p.color }}
                    title={p.name}
                    className={`w-3.5 h-3.5 rounded-full transition-transform ${
                      lightColor === p.color ? "scale-125 ring-2 ring-white" : "opacity-60 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>

              {/* Intensity Slider */}
              <div className="hidden md:flex items-center gap-1 pl-1.5 border-l border-slate-800 pr-1">
                <SunMedium className="w-3 h-3 text-slate-400" />
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={lightIntensity}
                  onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                  className="w-14 h-1 accent-brandCyan cursor-pointer"
                  title={`Light Intensity: ${lightIntensity}x`}
                />
              </div>
            </>
          )}
        </div>

        {/* Before / After Toggle */}
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className={`px-3 py-1.5 text-xs rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
            showOriginal
              ? "bg-brandYellow text-black border-brandYellow font-bold shadow-md"
              : "bg-[#1b1f2d] text-slate-300 border-[#2b3244] hover:bg-[#24293c]"
          }`}
        >
          {showOriginal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{showOriginal ? "Original" : "Before/After"}</span>
        </button>

        {/* Export Rig & Assets */}
        <a
          href={exportUrl || "#"}
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-1.5 text-xs rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-md transition-all hover:shadow-[0_0_15px_rgba(79,70,229,0.4)]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Assets</span>
        </a>
      </div>
    </header>
  );
}
