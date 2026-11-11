import base64
import io
import uuid
from pathlib import Path
from PIL import Image
from typing import Union, Optional, Tuple
from config import (
    STORAGE_DIR, ORIGINALS_DIR, MASKS_DIR, REVISIONS_DIR, 
    HEATMAPS_DIR, EXPORTS_DIR, SUPABASE_BUCKET
)
from database import supabase_client
import logging

logger = logging.getLogger(__name__)

def decode_base64_to_image(b64_str: str) -> Image.Image:
    """Decodes a base64 string (with or without data URI header) to a PIL Image."""
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]
    image_bytes = base64.b64decode(b64_str)
    return Image.open(io.BytesIO(image_bytes))

def encode_image_to_base64(img: Image.Image, format: str = "PNG") -> str:
    """Encodes a PIL Image to a base64 PNG data URI string."""
    buffered = io.BytesIO()
    img.save(buffered, format=format)
    encoded = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/{format.lower()};base64,{encoded}"

def save_image_file(
    img: Image.Image,
    category: str = "revisions",
    filename: Optional[str] = None
) -> Tuple[str, Path]:
    """
    Saves an image to local storage, and optionally syncs to Supabase bucket.
    Returns:
        relative_storage_path (str): e.g. "revisions/uuid.png"
        full_local_path (Path): absolute path on disk
    """
    category_map = {
        "originals": ORIGINALS_DIR,
        "masks": MASKS_DIR,
        "revisions": REVISIONS_DIR,
        "heatmaps": HEATMAPS_DIR,
        "exports": EXPORTS_DIR
    }
    target_dir = category_map.get(category, REVISIONS_DIR)
    
    if not filename:
        filename = f"{uuid.uuid4().hex}.png"
    
    full_path = target_dir / filename
    img.save(full_path, format="PNG")
    
    rel_path = f"{category}/{filename}"
    
    # Optional Cloud Upload to Supabase Storage if connected
    if supabase_client:
        try:
            with open(full_path, "rb") as f:
                supabase_client.storage.from_(SUPABASE_BUCKET).upload(
                    file=f.read(),
                    path=rel_path,
                    file_options={"content-type": "image/png", "upsert": "true"}
                )
        except Exception as e:
            logger.warning(f"Supabase upload failed for {rel_path}: {e}")

    return rel_path, full_path

def get_image_url(rel_path: str) -> str:
    """Constructs a frontend-accessible URL for a stored asset."""
    # If Supabase is active, return public URL
    if supabase_client:
        try:
            return supabase_client.storage.from_(SUPABASE_BUCKET).get_public_url(rel_path)
        except Exception:
            pass
    # Otherwise return local API mount URL
    clean_path = rel_path.replace("\\", "/")
    return f"/storage/{clean_path}"
