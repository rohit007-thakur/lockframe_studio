"use client";

import React from "react";
import {
  Layers,
  GitCommit,
  Clock,
  Sparkles,
  Spline,
  RotateCcw,
  ShieldCheck
} from "lucide-react";
import ReceiptHUD, { LockReceiptData } from "./ReceiptHUD";

export interface RevisionItem {
  id: string;
  edit_mode: string;
  prompt: string;
  result_image_url: string;
  mask_url?: string;
  timestamp: string;
  is_active: boolean;
  receipt?: LockReceiptData;
}

interface RevisionSidebarProps {
  receipt: LockReceiptData | null;
  revisions: RevisionItem[];
  showHeatmap: boolean;
  setShowHeatmap: (val: boolean | ((prev: boolean) => boolean)) => void;
  onSelectRevision: (rev: RevisionItem) => void;
  activeRevisionId?: string;
}

export default function RevisionSidebar({
  receipt,
  revisions,
  showHeatmap,
  setShowHeatmap,
  onSelectRevision,
  activeRevisionId,
}: RevisionSidebarProps) {
  return (
    <aside className="w-80 border-l border-[#222738] bg-[#12141e] flex flex-col shrink-0 overflow-hidden shadow-2xl">
      {/* 1. THE LOCK RECEIPT CARD */}
      <div className="p-3.5 border-b border-[#222738] shrink-0">
        <ReceiptHUD
          receipt={receipt}
          showHeatmap={showHeatmap}
          setShowHeatmap={setShowHeatmap}
        />
      </div>

      {/* 2. "GIT FOR ART" REVISION STACK */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1d2232] flex items-center justify-between shrink-0 bg-[#0e1019]">
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-brandCyan" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Git for Art
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-[#161924] px-2 py-0.5 rounded border border-[#252a3b]">
            {revisions.length} Commits
          </span>
        </div>

        {/* Revisions Feed */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {revisions.length > 0 ? (
            revisions.map((rev, index) => {
              const isActive = activeRevisionId ? rev.id === activeRevisionId : index === 0;
              const isVector = rev.edit_mode === "vector";
              const drift = rev.receipt?.outside_drift_percentage ?? 0.0;

              return (
                <div
                  key={rev.id}
                  onClick={() => onSelectRevision(rev)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer relative group ${
                    isActive
                      ? "bg-[#181c2b] border-brandCyan/60 shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                      : "bg-[#0b0d14] border-[#1e2334] hover:border-slate-600 hover:bg-[#121520]"
                  }`}
                >
                  {/* Active Indicator Strip */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-brandCyan rounded-r" />
                  )}

                  <div className="flex items-start justify-between gap-2 pl-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {isVector ? (
                        <Spline className="w-3.5 h-3.5 text-brandMagenta shrink-0" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-brandCyan shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-slate-200 truncate max-w-[150px]">
                        {rev.prompt || (isVector ? "Vector Bezier Edit" : "Pen-Lock Inpaint")}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-emerald-400 shrink-0 font-bold">
                      {drift.toFixed(3)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 pl-1">
                    <img
                      src={rev.result_image_url}
                      alt="Commit Visual"
                      className="w-11 h-11 rounded-md object-cover border border-[#262c3e] shrink-0 bg-black"
                    />

                    <div className="flex-1 min-w-0 text-[10px] text-slate-400 space-y-0.5 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-mono capitalize">
                          {rev.edit_mode.replace("_", " ")}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          #{revisions.length - index}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-slate-500">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{new Date(rev.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 px-4 text-center text-xs text-slate-500 space-y-1">
              <Layers className="w-8 h-8 mx-auto text-slate-600 opacity-50 mb-2" />
              <div className="font-semibold text-slate-400">No revisions yet</div>
              <div className="text-[11px] text-slate-600">
                Click any part of the canvas to create your first zero-drift edit.
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
