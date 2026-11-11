from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Projects
class ProjectCreateRequest(BaseModel):
    name: str = "Cyberpunk Hero"
    mode: str = Field("2d", description="'2d' or 'multiview'")
    base_image_base64: Optional[str] = None
    sketch_base64: Optional[str] = None
    prompt: Optional[str] = None
    character_metadata: Optional[Dict[str, Any]] = None

class AssetSchema(BaseModel):
    id: str
    project_id: str
    view_type: str
    immutable_original_url: str
    current_image_url: str
    width: int
    height: int

class ProjectResponse(BaseModel):
    id: str
    name: str
    mode: str
    character_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    assets: List[AssetSchema] = []

# Segmentation
class ClickPoint(BaseModel):
    x: int
    y: int
    is_positive: bool = True

class SegmentCandidatesRequest(BaseModel):
    asset_id: Optional[str] = None
    project_id: Optional[str] = None
    points: List[ClickPoint] = []
    brush_stroke_base64: Optional[str] = None # Optional drawn mask or lasso stroke

class CandidateMask(BaseModel):
    candidate_id: int
    label: str # "Sub-part", "Object Component", "Full Region"
    mask_base64: str
    mask_url: Optional[str] = None
    bounding_box: List[int] # [x_min, y_min, x_max, y_max]
    confidence_score: float

class SegmentCandidatesResponse(BaseModel):
    asset_id: Optional[str] = None
    project_id: Optional[str] = None
    candidates: List[CandidateMask]

# Pen-Lock Edit
class PenLockEditRequest(BaseModel):
    asset_id: Optional[str] = None
    project_id: Optional[str] = None
    mask_base64: Optional[str] = None
    mask_url: Optional[str] = None
    prompt: str = "robotic ear"
    semantic_brush_style: Optional[str] = None # e.g. "metallic_armor", "neon_glow"
    dilation_px: int = 6
    feather_sigma: float = 2.0
    seed: Optional[int] = 42

class LockReceiptSchema(BaseModel):
    id: str
    revision_id: str
    asset_id: str
    outside_changed_pixels: int
    outside_drift_percentage: float
    outside_mask_changed_pixels: Optional[int] = 0
    outside_mask_diff_percent: Optional[float] = 0.0
    diff_heatmap_url: Optional[str] = None
    is_verified: bool
    heatmap_url: str
    verified_at: datetime
    audit_metadata: Optional[Dict[str, Any]] = None

class PenLockEditResponse(BaseModel):
    revision_id: str
    asset_id: str
    result_image_url: str
    outside_mask_changed_pixels: int = 0
    outside_mask_diff_percent: float = 0.0
    diff_heatmap_url: str
    receipt: LockReceiptSchema
    parent_revision_id: Optional[str] = None

# Vector-as-ControlNet
class VectorExtractRequest(BaseModel):
    asset_id: str
    mask_base64: str
    max_anchor_nodes: int = 16

class BezierAnchorNode(BaseModel):
    id: int
    x: float
    y: float
    handle_in: Optional[List[float]] = None
    handle_out: Optional[List[float]] = None

class VectorExtractResponse(BaseModel):
    svg_path_data: str # standard SVG 'd' string
    nodes: List[BezierAnchorNode]
    bounding_box: List[int]

class VectorRerenderRequest(BaseModel):
    asset_id: str
    modified_svg_path: str
    prompt: Optional[str] = None
    seed: Optional[int] = 42

class VectorRerenderResponse(BaseModel):
    revision_id: str
    asset_id: str
    result_image_url: str
    receipt: LockReceiptSchema

# Multi-View Sync
class MultiViewSyncRequest(BaseModel):
    project_id: str
    source_asset_id: str # Front view asset
    target_view_types: List[str] = ["three_quarter", "side", "back"]
    feature_text_label: str = "ear" # Grounded-SAM prompt
    prompt: str = "futuristic cybernetic sensor ear"
    seed: Optional[int] = 42

class MultiViewSyncResponse(BaseModel):
    project_id: str
    updated_assets: List[AssetSchema]
    receipts: List[LockReceiptSchema]

# Revision History ("Git for Art")
class RevisionSchema(BaseModel):
    id: str
    project_id: str
    asset_id: str
    parent_revision_id: Optional[str]
    edit_mode: str
    prompt: Optional[str]
    result_image_url: str
    mask_url: Optional[str]
    timestamp: datetime
    is_active: bool
    receipt: Optional[LockReceiptSchema] = None
