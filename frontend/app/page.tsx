"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Crosshair,
  Spline,
  Compass,
  Lightbulb,
  ArrowRight
} from "lucide-react";

import TopNavbar from "@/components/layout/TopNavbar";
import LandingHero from "@/components/landing/LandingHero";
import ComparisonSection from "@/components/landing/ComparisonSection";
import WorkflowSection from "@/components/landing/WorkflowSection";

import CreateBaseTab from "@/components/studio/tabs/CreateBaseTab";
import PenLockTab from "@/components/studio/tabs/PenLockTab";
import VectorNodesTab from "@/components/studio/tabs/VectorNodesTab";
import MultiViewTab from "@/components/studio/tabs/MultiViewTab";
import RelightExportTab from "@/components/studio/tabs/RelightExportTab";

import {
  Project,
  Asset,
  CandidateMask,
  AnchorNode,
  Revision,
  RigData,
  LockReceipt,
  HERO_DEMO_PROJECT,
  HERO_DEMO_RECEIPT,
  HERO_DEMO_CANDIDATES,
  HERO_DEMO_NODES,
  HERO_DEMO_RIG,
  createProject,
  getSegmentCandidates,
  editPenLock,
  extractVectorNodes,
  rerenderVector,
  syncMultiView,
  getRevisions,
  getExportData,
} from "@/lib/api";

type ViewMode = "landing" | "studio";
type StudioTab = 1 | 2 | 3 | 4 | 5;

const STUDIO_TABS = [
  { id: 1 as StudioTab, label: "1. Create Base", icon: Sparkles },
  { id: 2 as StudioTab, label: "2. Pen-Lock Edit", icon: Crosshair },
  { id: 3 as StudioTab, label: "3. Vector Nodes", icon: Spline },
  { id: 4 as StudioTab, label: "4. Multi-View & Rig", icon: Compass },
  { id: 5 as StudioTab, label: "5. Relight & Export", icon: Lightbulb },
];

export default function LockFrameApp() {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewMode>("landing");
  const [activeTab, setActiveTab] = useState<StudioTab>(1);

  // Studio Data State
  const [project, setProject] = useState<Project | null>(null);
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [candidates, setCandidates] = useState<CandidateMask[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateMask | null>(null);
  const [nodes, setNodes] = useState<AnchorNode[]>(HERO_DEMO_NODES);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [receipt, setReceipt] = useState<LockReceipt | null>(HERO_DEMO_RECEIPT);
  const [rigData, setRigData] = useState<RigData | null>(HERO_DEMO_RIG);

  // Loading States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSegmenting, setIsSegmenting] = useState(false);

  // Initialize or fetch project on load
  useEffect(() => {
    initDefaultProject();
  }, []);

  const initDefaultProject = async () => {
    try {
      setIsProcessing(true);
      const proj = await createProject("Cyberpunk Hero Concept", "multiview", "High-tier mecha hero character");
      setProject(proj);
      if (proj.assets && proj.assets.length > 0) {
        setActiveAsset(proj.assets[0]);
        loadRevisions(proj.id);
        loadRig(proj.assets[0].id);
      }
    } catch (e) {
      console.warn("Init fallback", e);
      loadHeroDemoData();
    } finally {
      setIsProcessing(false);
    }
  };

  const loadRevisions = async (projectId: string) => {
    const revs = await getRevisions(projectId);
    setRevisions(revs);
    if (revs.length > 0 && revs[0].receipt) {
      setReceipt(revs[0].receipt);
    }
  };

  const loadRig = async (assetId: string) => {
    const exportData = await getExportData(assetId);
    if (exportData.rig_2d) {
      setRigData(exportData.rig_2d);
    }
  };

  const loadHeroDemoData = () => {
    setProject(HERO_DEMO_PROJECT);
    setActiveAsset(HERO_DEMO_PROJECT.assets[0]);
    setReceipt(HERO_DEMO_RECEIPT);
    setCandidates(HERO_DEMO_CANDIDATES);
    setSelectedCandidate(HERO_DEMO_CANDIDATES[0]);
    setNodes(HERO_DEMO_NODES);
    setRigData(HERO_DEMO_RIG);
    setRevisions([
      {
        id: "rev-hero-demo",
        edit_mode: "pen_lock_inpaint",
        prompt: "Cybernetic Sensor Ear",
        result_image_url: HERO_DEMO_PROJECT.assets[0].current_image_url,
        timestamp: new Date().toISOString(),
        is_active: true,
        receipt: HERO_DEMO_RECEIPT,
      },
    ]);
  };

  // Handlers for Tab 1: Generate Base
  const handleGenerateBase = async (prompt: string, mode: "2d" | "multiview") => {
    setIsProcessing(true);
    try {
      const proj = await createProject("Generated Character Base", mode, prompt);
      setProject(proj);
      if (proj.assets && proj.assets.length > 0) {
        setActiveAsset(proj.assets[0]);
        loadRevisions(proj.id);
        loadRig(proj.assets[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handlers for Tab 2: Canvas Click & Pen-Lock Edit
  const handleCanvasClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeAsset || isProcessing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.round(((e.clientX - rect.left) / rect.width) * activeAsset.width);
    const clickY = Math.round(((e.clientY - rect.top) / rect.height) * activeAsset.height);

    setIsSegmenting(true);
    try {
      const candidateList = await getSegmentCandidates(activeAsset.id, [
        { x: clickX, y: clickY, is_positive: true },
      ]);
      setCandidates(candidateList);
      if (candidateList.length > 0) {
        setSelectedCandidate(candidateList[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSegmenting(false);
    }
  };

  const handleApplyPenLockEdit = async (prompt: string, style: string) => {
    if (!activeAsset || !selectedCandidate) return;
    setIsProcessing(true);
    try {
      const result = await editPenLock({
        assetId: activeAsset.id,
        maskBase64: selectedCandidate.mask_base64,
        maskUrl: selectedCandidate.mask_url,
        prompt,
        semanticBrushStyle: style,
      });

      setReceipt(result.receipt);
      const updatedUrl = `${result.resultImageUrl}?t=${Date.now()}`;
      setActiveAsset({ ...activeAsset, current_image_url: updatedUrl });

      // Add revision
      const newRev: Revision = {
        id: `rev-${Date.now()}`,
        edit_mode: "pen_lock_inpaint",
        prompt,
        result_image_url: updatedUrl,
        timestamp: new Date().toISOString(),
        is_active: true,
        receipt: result.receipt,
      };
      setRevisions((prev) => [newRev, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handlers for Tab 3: Vector Nodes
  const handleExtractNodes = async () => {
    if (!activeAsset) return;
    setIsProcessing(true);
    try {
      const res = await extractVectorNodes(activeAsset.id, selectedCandidate?.mask_base64);
      setNodes(res.nodes);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRerenderVector = async (prompt: string) => {
    if (!activeAsset || nodes.length === 0) return;
    setIsProcessing(true);
    try {
      let pathStr = `M ${nodes[0].x} ${nodes[0].y}`;
      for (let i = 1; i < nodes.length; i++) {
        pathStr += ` L ${nodes[i].x} ${nodes[i].y}`;
      }
      pathStr += " Z";

      const result = await rerenderVector(activeAsset.id, pathStr, prompt);
      setReceipt(result.receipt);
      const updatedUrl = `${result.resultImageUrl}?t=${Date.now()}`;
      setActiveAsset({ ...activeAsset, current_image_url: updatedUrl });

      const newRev: Revision = {
        id: `rev-vector-${Date.now()}`,
        edit_mode: "vector",
        prompt: `Vector Geometry: ${prompt}`,
        result_image_url: updatedUrl,
        timestamp: new Date().toISOString(),
        is_active: true,
        receipt: result.receipt,
      };
      setRevisions((prev) => [newRev, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handlers for Tab 4: Multi-View Sync
  const handleSyncTurnaround = async (prompt: string) => {
    if (!project || !activeAsset) return;
    setIsProcessing(true);
    try {
      const res = await syncMultiView(
        project.id,
        activeAsset.id,
        ["three_quarter", "side", "back"],
        prompt
      );
      if (res.updatedAssets && project) {
        setProject({ ...project, assets: res.updatedAssets });
      }
      if (res.receipts && res.receipts.length > 0) {
        setReceipt(res.receipts[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handlers for Tab 5: Restore Revision
  const handleRestoreRevision = (rev: Revision) => {
    if (activeAsset) {
      setActiveAsset({ ...activeAsset, current_image_url: rev.result_image_url });
    }
    if (rev.receipt) {
      setReceipt(rev.receipt);
    }
  };

  return (
    <div className="min-h-screen w-full bg-studioBg text-slate-100 flex flex-col font-sans">
      {/* 1. Sleek Top Navigation Bar */}
      <TopNavbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        projectName={project?.name}
        isVerified={receipt?.is_verified ?? true}
        onExportClick={() => {
          setCurrentView("studio");
          setActiveTab(5);
        }}
      />

      {/* 2. Main Body: View A (Landing) vs View B (Studio) */}
      {currentView === "landing" ? (
        <main className="flex-1">
          <LandingHero
            onLaunchStudio={() => {
              setCurrentView("studio");
              setActiveTab(1);
            }}
            onLoadHeroDemo={() => {
              loadHeroDemoData();
              setCurrentView("studio");
              setActiveTab(2);
            }}
          />
          <ComparisonSection />
          <WorkflowSection
            onStepClick={(stepIdx) => {
              setCurrentView("studio");
              setActiveTab((stepIdx + 1) as StudioTab);
            }}
          />
        </main>
      ) : (
        <main className="flex-1 flex flex-col">
          {/* STEP-BY-STEP TOP TAB BAR (ANTI-CONGESTION) */}
          <div className="border-b border-studioBorder bg-studioBg/90 backdrop-blur-md px-6 py-2 sticky top-16 z-40">
            <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-2 no-scrollbar">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {STUDIO_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                        isActive
                          ? "bg-accentPrimary/20 text-white border border-accentPrimary/50 shadow-glowViolet"
                          : "text-slate-400 hover:text-slate-200 hover:bg-studioCard"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-accentCyan" : "text-slate-400"}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-slate-400 shrink-0">
                <span>View:</span>
                <span className="text-white font-bold uppercase">{activeAsset?.view_type || "Front"}</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold">
                  {(receipt?.outside_drift_percentage ?? 0.0).toFixed(3)}% Drift Verified
                </span>
              </div>
            </div>
          </div>

          {/* TAB CONTENT AREA WITH SMOOTH MOTION */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="w-full"
              >
                {activeTab === 1 && (
                  <CreateBaseTab
                    project={project}
                    activeAsset={activeAsset}
                    onGenerateBase={handleGenerateBase}
                    onLoadHeroDemo={loadHeroDemoData}
                    onProceedToEdit={() => setActiveTab(2)}
                    isProcessing={isProcessing}
                  />
                )}

                {activeTab === 2 && (
                  <PenLockTab
                    activeAsset={activeAsset}
                    candidates={candidates}
                    selectedCandidate={selectedCandidate}
                    onSelectCandidate={setSelectedCandidate}
                    onCanvasClick={handleCanvasClick}
                    onApplyPenLockEdit={handleApplyPenLockEdit}
                    receipt={receipt}
                    isSegmenting={isSegmenting}
                    isProcessing={isProcessing}
                    onProceedToVector={() => setActiveTab(3)}
                  />
                )}

                {activeTab === 3 && (
                  <VectorNodesTab
                    activeAsset={activeAsset}
                    nodes={nodes}
                    setNodes={setNodes}
                    onExtractNodes={handleExtractNodes}
                    onRerenderVector={handleRerenderVector}
                    receipt={receipt}
                    isProcessing={isProcessing}
                    onProceedToMultiView={() => setActiveTab(4)}
                  />
                )}

                {activeTab === 4 && (
                  <MultiViewTab
                    assets={project?.assets || []}
                    activeAssetId={activeAsset?.id || ""}
                    onSelectAsset={setActiveAsset}
                    onSyncTurnaround={handleSyncTurnaround}
                    rigData={rigData}
                    receipt={receipt}
                    isProcessing={isProcessing}
                    onProceedToRelight={() => setActiveTab(5)}
                  />
                )}

                {activeTab === 5 && (
                  <RelightExportTab
                    activeAsset={activeAsset}
                    revisions={revisions}
                    receipt={receipt}
                    onRestoreRevision={handleRestoreRevision}
                    exportUrl={activeAsset ? `/api/export/${activeAsset.id}` : undefined}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      )}
    </div>
  );
}
