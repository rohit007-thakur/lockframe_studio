import io
import json
import uuid
import datetime
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from PIL import Image, ImageDraw
import numpy as np

from config import STORAGE_DIR, HOST, PORT
from database import engine, Base, get_db
import models
import schemas
from services.compositor import pixel_space_composite
from services.receipt import compute_lock_receipt
from services.vector import extract_vector_paths, rasterize_svg_path
from services.storage import (
    decode_base64_to_image, encode_image_to_base64, 
    save_image_file, get_image_url
)
from services.ai_service import (
    generate_segmentation_candidates, generate_ai_inpaint,
    generate_dwpose_rig, extract_character_style_sheet,
    enhance_micro_prompt_with_style
)

# Initialize SQLite tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LockFrame Studio API",
    description="Controllable, Editable, and Verifiable 2D/3D Visual Production Backend",
    version="1.0.0"
)

# CORS configuration for Next.js / React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local storage folder for static access
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

# Utility to create a default hero asset for instant hackathon testing
def create_default_hero_image(width=1024, height=1024) -> Image.Image:
    """Generates a cyberpunk hero character base image if none uploaded."""
    from PIL import ImageDraw
    img = Image.new("RGB", (width, height), (18, 20, 28))
    draw = ImageDraw.Draw(img)
    
    # Body silhouette & armor
    cx, cy = width // 2, height // 2
    # Torso armor
    draw.polygon([
        (cx - 140, cy - 80), (cx + 140, cy - 80),
        (cx + 180, cy + 220), (cx - 180, cy + 220)
    ], fill=(45, 52, 70), outline=(0, 240, 255), width=3)
    
    # Cybernetic core / emblem
    draw.ellipse([cx - 45, cy + 30, cx + 45, cy + 120], fill=(0, 240, 255), outline=(255, 255, 255), width=2)
    
    # Head & Helmet
    draw.polygon([
        (cx - 90, cy - 320), (cx + 90, cy - 320),
        (cx + 70, cy - 120), (cx - 70, cy - 120)
    ], fill=(60, 68, 90), outline=(255, 0, 128), width=3)
    
    # Visor
    draw.polygon([
        (cx - 60, cy - 230), (cx + 60, cy - 230),
        (cx + 50, cy - 180), (cx - 50, cy - 180)
    ], fill=(0, 255, 180))
    
    # Cybernetic Left Ear / Sensor Antenna
    draw.polygon([
        (cx - 90, cy - 250), (cx - 130, cy - 290),
        (cx - 110, cy - 210), (cx - 85, cy - 200)
    ], fill=(180, 190, 210), outline=(0, 240, 255), width=2)
    
    return img

@app.get("/")
def read_root():
    return {
        "service": "LockFrame Studio Core API",
        "status": "operational",
        "tagline": "Artists decide what changes. AI performs the edit. LockFrame verifies what stayed untouched.",
        "endpoints": [
            "/api/projects/create",
            "/api/segment/candidates",
            "/api/edit/pen-lock",
            "/api/vector/extract",
            "/api/vector/rerender",
            "/api/multiview/sync",
            "/api/export/{asset_id}"
        ]
    }

# 1. Project Creation
@app.post("/api/projects/create", response_model=schemas.ProjectResponse)
def create_project(req: schemas.ProjectCreateRequest, db: Session = Depends(get_db)):
    # Process or create base image first so we can extract style metadata if needed
    if req.base_image_base64:
        base_img = decode_base64_to_image(req.base_image_base64)
    else:
        base_img = create_default_hero_image()

    w, h = base_img.size

    # Extract Character Style Sheet using Google Gemini if not explicitly provided
    if not req.character_metadata:
        extracted_style = extract_character_style_sheet(base_img)
    else:
        extracted_style = req.character_metadata

    meta_json = json.dumps(extracted_style)
    
    project = models.Project(
        name=req.name,
        mode=req.mode,
        character_metadata=meta_json
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Save immutable original
    orig_rel, orig_path = save_image_file(base_img, category="originals")
    curr_rel, curr_path = save_image_file(base_img, category="revisions")

    # If multiview, generate 4 turnaround views
    view_types = ["front", "three_quarter", "side", "back"] if req.mode == "multiview" else ["default_2d"]
    assets_response = []

    for vt in view_types:
        asset = models.Asset(
            project_id=project.id,
            view_type=vt,
            immutable_original_path=orig_rel,
            current_image_path=curr_rel,
            width=w,
            height=h
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)

        assets_response.append(schemas.AssetSchema(
            id=asset.id,
            project_id=project.id,
            view_type=asset.view_type,
            immutable_original_url=get_image_url(asset.immutable_original_path),
            current_image_url=get_image_url(asset.current_image_path),
            width=w,
            height=h
        ))

    return schemas.ProjectResponse(
        id=project.id,
        name=project.name,
        mode=project.mode,
        character_metadata=json.loads(project.character_metadata),
        created_at=project.created_at,
        assets=assets_response
    )

# 2. SAM-2 Candidate Preview (3 candidate masks)
@app.post("/api/segment/candidates", response_model=schemas.SegmentCandidatesResponse)
def get_segment_candidates(req: schemas.SegmentCandidatesRequest, db: Session = Depends(get_db)):
    asset = None
    if req.asset_id:
        asset = db.query(models.Asset).filter(models.Asset.id == req.asset_id).first()
    elif req.project_id:
        asset = db.query(models.Asset).filter(models.Asset.project_id == req.project_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset or Project not found")

    # Load current asset image
    img_path = STORAGE_DIR / asset.current_image_path
    if not img_path.exists():
        img_path = STORAGE_DIR / asset.immutable_original_path
    img = Image.open(img_path)

    # Convert request points
    points_dict = [{"x": p.x, "y": p.y, "is_positive": p.is_positive} for p in req.points]
    
    # Generate 3 candidates via SAM-2 / Engine
    candidates_raw = generate_segmentation_candidates(img, points_dict)

    resp_candidates = []
    for c in candidates_raw:
        # Encode mask to base64 and save to storage for URL access
        m_b64 = encode_image_to_base64(c["mask_image"])
        m_rel, _ = save_image_file(c["mask_image"], category="masks")
        m_url = get_image_url(m_rel)

        resp_candidates.append(schemas.CandidateMask(
            candidate_id=c["candidate_id"],
            label=c["label"],
            mask_base64=m_b64,
            mask_url=m_url,
            bounding_box=c["bounding_box"],
            confidence_score=c["confidence_score"]
        ))

    return schemas.SegmentCandidatesResponse(
        asset_id=asset.id,
        project_id=asset.project_id,
        candidates=resp_candidates
    )

# 3. Pen-Lock Inpainting & Pixel-Space Compositing with Lock Receipt
@app.post("/api/edit/pen-lock", response_model=schemas.PenLockEditResponse)
def edit_pen_lock(req: schemas.PenLockEditRequest, db: Session = Depends(get_db)):
    asset = None
    if req.asset_id:
        asset = db.query(models.Asset).filter(models.Asset.id == req.asset_id).first()
    elif req.project_id:
        asset = db.query(models.Asset).filter(models.Asset.project_id == req.project_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset or Project not found")

    # 1. Load original and current image
    orig_path = STORAGE_DIR / asset.immutable_original_path
    curr_path = STORAGE_DIR / asset.current_image_path
    original_img = Image.open(orig_path).convert("RGB")
    current_img = Image.open(curr_path).convert("RGB")

    # 2. Decode user approved mask (from base64 or URL)
    if req.mask_base64:
        mask_img = decode_base64_to_image(req.mask_base64).convert("L")
    elif req.mask_url:
        import requests
        # If local storage path
        if "/storage/" in req.mask_url:
            subpath = req.mask_url.split("/storage/", 1)[1]
            local_mask_file = STORAGE_DIR / subpath
            if local_mask_file.exists():
                mask_img = Image.open(local_mask_file).convert("L")
            else:
                resp = requests.get(req.mask_url)
                mask_img = Image.open(io.BytesIO(resp.content)).convert("L")
        else:
            resp = requests.get(req.mask_url)
            mask_img = Image.open(io.BytesIO(resp.content)).convert("L")
    else:
        raise HTTPException(status_code=400, detail="Either mask_base64 or mask_url must be provided")

    mask_rel, _ = save_image_file(mask_img, category="masks")

    # Load project metadata for Gemini style enhancement
    project = db.query(models.Project).filter(models.Project.id == asset.project_id).first()
    char_meta = json.loads(project.character_metadata) if (project and project.character_metadata) else {}

    # Enhance micro-prompt with Gemini character style context
    enhanced_prompt = enhance_micro_prompt_with_style(req.prompt, char_meta)

    # 3. Generate inpaint candidate with style-enhanced prompt
    generated_img = generate_ai_inpaint(
        current_img,
        mask_img,
        prompt=enhanced_prompt,
        semantic_style=req.semantic_brush_style,
        seed=req.seed or 42
    )

    # 4. CRITICAL: Pixel-Space Compositing
    # Guarantees mathematical zero-drift outside mask
    final_img, dilated_alpha = pixel_space_composite(
        original_img=current_img,
        generated_img=generated_img,
        mask_img=mask_img,
        dilation_px=req.dilation_px,
        feather_sigma=req.feather_sigma
    )

    # 5. Compute Lock Receipt & Diff Heatmap
    receipt_data, heatmap_img = compute_lock_receipt(
        original_img=current_img,
        final_img=final_img,
        mask_boundary=Image.fromarray((dilated_alpha > 0.001).astype(np.uint8) * 255)
    )

    # Save output images
    result_rel, _ = save_image_file(final_img, category="revisions")
    heat_rel, _ = save_image_file(heatmap_img, category="heatmaps")

    # Update asset current pointer
    asset.current_image_path = result_rel
    db.commit()

    # Save EditRevision ("Git for Art")
    rev = models.EditRevision(
        project_id=asset.project_id,
        asset_id=asset.id,
        edit_mode="pen_lock_inpaint",
        prompt=req.prompt,
        mask_path=mask_rel,
        result_image_path=result_rel,
        model_settings=json.dumps({"dilation": req.dilation_px, "feather": req.feather_sigma, "seed": req.seed})
    )
    db.add(rev)
    db.commit()
    db.refresh(rev)

    # Save Lock Receipt record
    lock_rec = models.LockReceipt(
        revision_id=rev.id,
        asset_id=asset.id,
        outside_changed_pixels=receipt_data["outside_changed_pixels"],
        outside_drift_percentage=receipt_data["outside_drift_percentage"],
        is_verified=receipt_data["is_verified"],
        heatmap_path=heat_rel,
        audit_metadata=json.dumps(receipt_data["audit_hashes"])
    )
    db.add(lock_rec)
    db.commit()
    db.refresh(lock_rec)

    heat_url = get_image_url(lock_rec.heatmap_path)
    outside_changed = lock_rec.outside_changed_pixels
    outside_drift = lock_rec.outside_drift_percentage

    receipt_schema = schemas.LockReceiptSchema(
        id=lock_rec.id,
        revision_id=rev.id,
        asset_id=asset.id,
        outside_changed_pixels=outside_changed,
        outside_drift_percentage=outside_drift,
        outside_mask_changed_pixels=outside_changed,
        outside_mask_diff_percent=outside_drift,
        diff_heatmap_url=heat_url,
        is_verified=lock_rec.is_verified,
        heatmap_url=heat_url,
        verified_at=lock_rec.verified_at,
        audit_metadata=receipt_data
    )

    return schemas.PenLockEditResponse(
        revision_id=rev.id,
        asset_id=asset.id,
        result_image_url=get_image_url(result_rel),
        outside_mask_changed_pixels=outside_changed,
        outside_mask_diff_percent=outside_drift,
        diff_heatmap_url=heat_url,
        receipt=receipt_schema
    )

# 4. Vector-as-ControlNet: Extract Bezier Anchor Nodes
@app.post("/api/vector/extract", response_model=schemas.VectorExtractResponse)
def vector_extract(req: schemas.VectorExtractRequest, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.id == req.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    mask_img = decode_base64_to_image(req.mask_base64).convert("L")
    vector_data = extract_vector_paths(mask_img, target_node_count=req.max_anchor_nodes)

    return schemas.VectorExtractResponse(
        svg_path_data=vector_data["svg_path_data"],
        nodes=[schemas.BezierAnchorNode(**n) for n in vector_data["nodes"]],
        bounding_box=vector_data["bounding_box"]
    )

# 5. Vector-as-ControlNet: Re-render with Updated Geometry
@app.post("/api/vector/rerender", response_model=schemas.VectorRerenderResponse)
def vector_rerender(req: schemas.VectorRerenderRequest, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.id == req.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    curr_path = STORAGE_DIR / asset.current_image_path
    current_img = Image.open(curr_path).convert("RGB")
    w, h = current_img.size

    # Rasterize modified SVG path into mask and edge map
    new_mask, edge_map = rasterize_svg_path(req.modified_svg_path, width=w, height=h)
    mask_rel, _ = save_image_file(new_mask, category="masks")

    # Inpaint using new geometry mask + style prompt
    prompt = req.prompt or "sculpted geometric surface matching original art style"
    generated_img = generate_ai_inpaint(
        current_img,
        new_mask,
        prompt=prompt,
        seed=req.seed or 42
    )

    # Pixel-Space Compositing
    final_img, dilated_alpha = pixel_space_composite(
        original_img=current_img,
        generated_img=generated_img,
        mask_img=new_mask,
        dilation_px=4,
        feather_sigma=2.0
    )

    # Compute Lock Receipt
    receipt_data, heatmap_img = compute_lock_receipt(
        original_img=current_img,
        final_img=final_img,
        mask_boundary=Image.fromarray((dilated_alpha > 0).astype(np.uint8) * 255)
    )

    result_rel, _ = save_image_file(final_img, category="revisions")
    heat_rel, _ = save_image_file(heatmap_img, category="heatmaps")

    asset.current_image_path = result_rel
    db.commit()

    rev = models.EditRevision(
        project_id=asset.project_id,
        asset_id=asset.id,
        edit_mode="vector_rerender",
        prompt=prompt,
        mask_path=mask_rel,
        result_image_path=result_rel,
        model_settings=json.dumps({"svg_path": req.modified_svg_path[:200]})
    )
    db.add(rev)
    db.commit()
    db.refresh(rev)

    lock_rec = models.LockReceipt(
        revision_id=rev.id,
        asset_id=asset.id,
        outside_changed_pixels=receipt_data["outside_changed_pixels"],
        outside_drift_percentage=receipt_data["outside_drift_percentage"],
        is_verified=receipt_data["is_verified"],
        heatmap_path=heat_rel,
        audit_metadata=json.dumps(receipt_data["audit_hashes"])
    )
    db.add(lock_rec)
    db.commit()
    db.refresh(lock_rec)

    receipt_schema = schemas.LockReceiptSchema(
        id=lock_rec.id,
        revision_id=rev.id,
        asset_id=asset.id,
        outside_changed_pixels=lock_rec.outside_changed_pixels,
        outside_drift_percentage=lock_rec.outside_drift_percentage,
        is_verified=lock_rec.is_verified,
        heatmap_url=get_image_url(lock_rec.heatmap_path),
        verified_at=lock_rec.verified_at,
        audit_metadata=receipt_data
    )

    return schemas.VectorRerenderResponse(
        revision_id=rev.id,
        asset_id=asset.id,
        result_image_url=get_image_url(result_rel),
        receipt=receipt_schema
    )

# 6. Multi-View Turnaround Sync
@app.post("/api/multiview/sync", response_model=schemas.MultiViewSyncResponse)
def multiview_sync(req: schemas.MultiViewSyncRequest, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    source_asset = db.query(models.Asset).filter(models.Asset.id == req.source_asset_id).first()
    if not source_asset:
        raise HTTPException(status_code=404, detail="Source asset not found")

    # Target assets in turnaround
    target_assets = db.query(models.Asset).filter(
        models.Asset.project_id == req.project_id,
        models.Asset.view_type.in_(req.target_view_types)
    ).all()

    updated_schemas = []
    receipts_list = []

    for tgt in target_assets:
        tgt_img = Image.open(STORAGE_DIR / tgt.current_image_path).convert("RGB")
        w, h = tgt_img.size

        # Grounded-SAM simulation for ear/badge position in 3/4 and side views
        prop_mask = Image.new("L", (w, h), 0)
        draw = ImageDraw.Draw(prop_mask)
        
        # Adjust position slightly for angle
        offset_x = 40 if tgt.view_type == "three_quarter" else 75
        cx, cy = w // 2 - offset_x, int(h * 0.28)
        draw.ellipse([cx - 30, cy - 40, cx + 30, cy + 40], fill=255)

        # Inpaint with synchronized prompt
        gen_img = generate_ai_inpaint(tgt_img, prop_mask, prompt=req.prompt, seed=req.seed or 42)

        # Pixel-Space Compositing
        final_img, dilated_alpha = pixel_space_composite(
            original_img=tgt_img,
            generated_img=gen_img,
            mask_img=prop_mask,
            dilation_px=6,
            feather_sigma=2.0
        )

        receipt_data, heat_img = compute_lock_receipt(
            original_img=tgt_img,
            final_img=final_img,
            mask_boundary=Image.fromarray((dilated_alpha > 0).astype(np.uint8) * 255)
        )

        res_rel, _ = save_image_file(final_img, category="revisions")
        heat_rel, _ = save_image_file(heat_img, category="heatmaps")
        mask_rel, _ = save_image_file(prop_mask, category="masks")

        tgt.current_image_path = res_rel
        db.commit()

        rev = models.EditRevision(
            project_id=project.id,
            asset_id=tgt.id,
            edit_mode="multiview_sync",
            prompt=f"Sync from front view: {req.prompt}",
            mask_path=mask_rel,
            result_image_path=res_rel,
            model_settings=json.dumps({"source_asset_id": source_asset.id, "view_type": tgt.view_type})
        )
        db.add(rev)
        db.commit()
        db.refresh(rev)

        l_rec = models.LockReceipt(
            revision_id=rev.id,
            asset_id=tgt.id,
            outside_changed_pixels=receipt_data["outside_changed_pixels"],
            outside_drift_percentage=receipt_data["outside_drift_percentage"],
            is_verified=receipt_data["is_verified"],
            heatmap_path=heat_rel,
            audit_metadata=json.dumps(receipt_data["audit_hashes"])
        )
        db.add(l_rec)
        db.commit()
        db.refresh(l_rec)

        updated_schemas.append(schemas.AssetSchema(
            id=tgt.id,
            project_id=tgt.project_id,
            view_type=tgt.view_type,
            immutable_original_url=get_image_url(tgt.immutable_original_path),
            current_image_url=get_image_url(tgt.current_image_path),
            width=w,
            height=h
        ))

        receipts_list.append(schemas.LockReceiptSchema(
            id=l_rec.id,
            revision_id=rev.id,
            asset_id=tgt.id,
            outside_changed_pixels=l_rec.outside_changed_pixels,
            outside_drift_percentage=l_rec.outside_drift_percentage,
            is_verified=l_rec.is_verified,
            heatmap_url=get_image_url(l_rec.heatmap_path),
            verified_at=l_rec.verified_at,
            audit_metadata=receipt_data
        ))

    return schemas.MultiViewSyncResponse(
        project_id=project.id,
        updated_assets=updated_schemas,
        receipts=receipts_list
    )

# 7. Production Export (Layered PNGs, SVG, and 2D Rig JSON)
@app.get("/api/export/{asset_id}")
def export_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    revisions = db.query(models.EditRevision).filter(models.EditRevision.asset_id == asset_id).all()
    rig_data = generate_dwpose_rig(asset.width, asset.height)

    return {
        "asset_id": asset.id,
        "view_type": asset.view_type,
        "current_image_url": get_image_url(asset.current_image_path),
        "immutable_original_url": get_image_url(asset.immutable_original_path),
        "revisions_count": len(revisions),
        "rig_2d": rig_data,
        "export_metadata": {
            "resolution": f"{asset.width}x{asset.height}",
            "generated_at": datetime.datetime.utcnow().isoformat(),
            "format": "Layered Production Asset & Rig JSON"
        }
    }

# 8. Revisions List ("Git for Art")
@app.get("/api/revisions/{project_id}")
def list_revisions(project_id: str, db: Session = Depends(get_db)):
    revisions = db.query(models.EditRevision).filter(
        models.EditRevision.project_id == project_id
    ).order_by(models.EditRevision.timestamp.desc()).all()

    output = []
    for r in revisions:
        rec_schema = None
        if r.receipt:
            rec_schema = schemas.LockReceiptSchema(
                id=r.receipt.id,
                revision_id=r.id,
                asset_id=r.asset_id,
                outside_changed_pixels=r.receipt.outside_changed_pixels,
                outside_drift_percentage=r.receipt.outside_drift_percentage,
                is_verified=r.receipt.is_verified,
                heatmap_url=get_image_url(r.receipt.heatmap_path),
                verified_at=r.receipt.verified_at,
                audit_metadata=json.loads(r.receipt.audit_metadata) if r.receipt.audit_metadata else None
            )

        output.append({
            "id": r.id,
            "project_id": r.project_id,
            "asset_id": r.asset_id,
            "edit_mode": r.edit_mode,
            "prompt": r.prompt,
            "result_image_url": get_image_url(r.result_image_path),
            "mask_url": get_image_url(r.mask_path) if r.mask_path else None,
            "timestamp": r.timestamp,
            "is_active": r.is_active,
            "receipt": rec_schema
        })

    return output

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
