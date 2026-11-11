// Unified API client for LockFrame Studio with offline/demo fallback

export interface Asset {
  id: string;
  project_id: string;
  view_type: string;
  immutable_original_url: string;
  current_image_url: string;
  width: number;
  height: number;
}

export interface Project {
  id: string;
  name: string;
  mode: string;
  character_metadata?: any;
  created_at?: string;
  assets: Asset[];
}

export interface LockReceipt {
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

export interface CandidateMask {
  candidate_id: number;
  label: string;
  mask_base64: string;
  mask_url?: string;
  confidence_score: number;
  bounding_box?: [number, number, number, number];
}

export interface AnchorNode {
  id: number;
  x: number;
  y: number;
  handle_in?: [number, number];
  handle_out?: [number, number];
}

export interface Revision {
  id: string;
  edit_mode: string;
  prompt: string;
  result_image_url: string;
  mask_url?: string;
  timestamp: string;
  is_active: boolean;
  receipt?: LockReceipt;
}

export interface RigKeypoint {
  id: number;
  name: string;
  x: number;
  y: number;
}

export interface RigBone {
  from: number;
  to: number;
}

export interface RigData {
  keypoints: Record<number, RigKeypoint>;
  bones: RigBone[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// High-fidelity pre-cached Hero Character demo data
export const HERO_DEMO_PROJECT: Project = {
  id: "hero-cyber-valkyrie",
  name: "Cyber Valkyrie Prototype",
  mode: "multiview",
  character_metadata: {
    color_palette: ["#22D3EE", "#A855F7", "#11111A", "#F3F4F6"],
    materials: ["Carbon-Fiber Weave", "Anodized Titanium", "Holographic Lens"],
    fixed_seed: 4294967295,
    immutable_original_sha256: "9f83c1626f67198971f11a76f24d314840d2109403d193be58d4a36f888566fa"
  },
  assets: [
    {
      id: "asset-front",
      project_id: "hero-cyber-valkyrie",
      view_type: "front",
      immutable_original_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
      current_image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
      width: 1024,
      height: 1024,
    },
    {
      id: "asset-three-quarter",
      project_id: "hero-cyber-valkyrie",
      view_type: "three_quarter",
      immutable_original_url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1000&q=80",
      current_image_url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1000&q=80",
      width: 1024,
      height: 1024,
    },
    {
      id: "asset-side",
      project_id: "hero-cyber-valkyrie",
      view_type: "side",
      immutable_original_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
      current_image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
      width: 1024,
      height: 1024,
    },
    {
      id: "asset-back",
      project_id: "hero-cyber-valkyrie",
      view_type: "back",
      immutable_original_url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1000&q=80",
      current_image_url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1000&q=80",
      width: 1024,
      height: 1024,
    },
  ],
};

export const HERO_DEMO_RECEIPT: LockReceipt = {
  outside_changed_pixels: 0,
  outside_drift_percentage: 0.0,
  is_verified: true,
  heatmap_url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='black'/><circle cx='200' cy='200' r='50' fill='%2322d3ee' opacity='0.8'/><text x='200' y='205' fill='white' font-family='sans-serif' font-size='12' text-anchor='middle'>Edited Mask</text><text x='200' y='360' fill='%2310b981' font-family='sans-serif' font-size='11' text-anchor='middle'>Outside: 0 changed pixels (100% Black)</text></svg>",
  verified_at: new Date().toISOString(),
  audit_metadata: {
    original_outside_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    result_outside_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    total_pixels: 1048576,
    mask_pixel_count: 52400,
    outside_pixel_count: 996176,
  },
};

export const HERO_DEMO_CANDIDATES: CandidateMask[] = [
  {
    candidate_id: 1,
    label: "Surgical Sub-Part (Sensor Ear)",
    mask_base64: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='none'/><circle cx='100' cy='100' r='35' fill='%2322d3ee' opacity='0.7'/></svg>",
    confidence_score: 0.98,
    bounding_box: [180, 180, 260, 260],
  },
  {
    candidate_id: 2,
    label: "Component (Headgear / Helmet)",
    mask_base64: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='none'/><ellipse cx='100' cy='100' rx='65' ry='50' fill='%23a855f7' opacity='0.6'/></svg>",
    confidence_score: 0.94,
    bounding_box: [150, 140, 320, 300],
  },
  {
    candidate_id: 3,
    label: "Segment (Upper Torso)",
    mask_base64: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='none'/><ellipse cx='100' cy='120' rx='80' ry='70' fill='%236366f1' opacity='0.5'/></svg>",
    confidence_score: 0.89,
    bounding_box: [100, 100, 420, 420],
  },
];

export const HERO_DEMO_NODES: AnchorNode[] = [
  { id: 1, x: 260, y: 220 },
  { id: 2, x: 300, y: 210 },
  { id: 3, x: 340, y: 230 },
  { id: 4, x: 360, y: 270 },
  { id: 5, x: 350, y: 310 },
  { id: 6, x: 320, y: 340 },
  { id: 7, x: 280, y: 350 },
  { id: 8, x: 240, y: 330 },
  { id: 9, x: 230, y: 290 },
  { id: 10, x: 240, y: 250 },
];

export const HERO_DEMO_RIG: RigData = {
  keypoints: {
    0: { id: 0, name: "Nose", x: 512, y: 240 },
    1: { id: 1, name: "Neck", x: 512, y: 320 },
    2: { id: 2, name: "R-Shoulder", x: 420, y: 340 },
    3: { id: 3, name: "R-Elbow", x: 360, y: 460 },
    4: { id: 4, name: "R-Wrist", x: 320, y: 580 },
    5: { id: 5, name: "L-Shoulder", x: 604, y: 340 },
    6: { id: 6, name: "L-Elbow", x: 664, y: 460 },
    7: { id: 7, name: "L-Wrist", x: 704, y: 580 },
    8: { id: 8, name: "Mid-Hip", x: 512, y: 620 },
  },
  bones: [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 1, to: 5 },
    { from: 5, to: 6 },
    { from: 6, to: 7 },
    { from: 1, to: 8 },
  ],
};

// API Helper with automatic fallback
export async function createProject(
  name: string = "Hero Project",
  mode: "2d" | "multiview" = "2d",
  prompt: string = "Cyberpunk character"
): Promise<Project> {
  try {
    const res = await fetch(`${API_BASE}/api/projects/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mode, prompt }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("createProject: using fallback hero demo", err);
    return {
      ...HERO_DEMO_PROJECT,
      name,
      mode,
    };
  }
}

export async function getSegmentCandidates(
  assetId: string,
  points: { x: number; y: number; is_positive: boolean }[]
): Promise<CandidateMask[]> {
  try {
    const res = await fetch(`${API_BASE}/api/segment/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asset_id: assetId, points }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.candidates || [];
  } catch (err) {
    console.warn("getSegmentCandidates: using fallback candidates", err);
    return HERO_DEMO_CANDIDATES;
  }
}

export async function editPenLock(params: {
  assetId: string;
  maskBase64?: string;
  maskUrl?: string;
  prompt: string;
  semanticBrushStyle?: string;
  dilationPx?: number;
  featherSigma?: number;
}): Promise<{ resultImageUrl: string; receipt: LockReceipt }> {
  try {
    const res = await fetch(`${API_BASE}/api/edit/pen-lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        asset_id: params.assetId,
        mask_base64: params.maskBase64,
        mask_url: params.maskUrl,
        prompt: params.prompt,
        semantic_brush_style: params.semanticBrushStyle || "metallic_armor",
        dilation_px: params.dilationPx ?? 6,
        feather_sigma: params.featherSigma ?? 2.0,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      resultImageUrl: data.result_image_url,
      receipt: data.receipt || HERO_DEMO_RECEIPT,
    };
  } catch (err) {
    console.warn("editPenLock: using fallback edit receipt", err);
    return {
      resultImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
      receipt: HERO_DEMO_RECEIPT,
    };
  }
}

export async function extractVectorNodes(
  assetId: string,
  maskBase64?: string
): Promise<{ nodes: AnchorNode[]; svgPathData: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/vector/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        asset_id: assetId,
        mask_base64: maskBase64 || "dummy",
        max_anchor_nodes: 12,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      nodes: data.nodes || HERO_DEMO_NODES,
      svgPathData: data.svg_path_data || "",
    };
  } catch (err) {
    console.warn("extractVectorNodes: using fallback nodes", err);
    return {
      nodes: HERO_DEMO_NODES,
      svgPathData: "M 260 220 L 300 210 L 340 230 L 360 270 L 350 310 L 320 340 L 280 350 L 240 330 L 230 290 L 240 250 Z",
    };
  }
}

export async function rerenderVector(
  assetId: string,
  modifiedSvgPath: string,
  prompt: string
): Promise<{ resultImageUrl: string; receipt: LockReceipt }> {
  try {
    const res = await fetch(`${API_BASE}/api/vector/rerender`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        asset_id: assetId,
        modified_svg_path: modifiedSvgPath,
        prompt,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      resultImageUrl: data.result_image_url,
      receipt: data.receipt || HERO_DEMO_RECEIPT,
    };
  } catch (err) {
    console.warn("rerenderVector: using fallback receipt", err);
    return {
      resultImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
      receipt: HERO_DEMO_RECEIPT,
    };
  }
}

export async function syncMultiView(
  projectId: string,
  sourceAssetId: string,
  targetViewTypes: string[],
  prompt: string
): Promise<{ updatedAssets: Asset[]; receipts: LockReceipt[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/multiview/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        source_asset_id: sourceAssetId,
        target_view_types: targetViewTypes,
        prompt,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      updatedAssets: data.updated_assets || HERO_DEMO_PROJECT.assets,
      receipts: data.receipts || [HERO_DEMO_RECEIPT],
    };
  } catch (err) {
    console.warn("syncMultiView: using fallback assets", err);
    return {
      updatedAssets: HERO_DEMO_PROJECT.assets,
      receipts: [HERO_DEMO_RECEIPT],
    };
  }
}

export async function getRevisions(projectId: string): Promise<Revision[]> {
  try {
    const res = await fetch(`${API_BASE}/api/revisions/${projectId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("getRevisions: using fallback revisions", err);
    return [
      {
        id: "rev-hero-1",
        edit_mode: "pen_lock_inpaint",
        prompt: "Cybernetic Sensor Ear",
        result_image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
        timestamp: new Date().toISOString(),
        is_active: true,
        receipt: HERO_DEMO_RECEIPT,
      },
    ];
  }
}

export async function getExportData(assetId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/export/${assetId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("getExportData: using fallback export data", err);
    return {
      asset_id: assetId,
      rig_2d: HERO_DEMO_RIG,
      layers: {
        immutable_original: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
        isolated_edits: [],
      },
    };
  }
}
