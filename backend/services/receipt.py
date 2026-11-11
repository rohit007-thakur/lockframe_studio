import hashlib
import numpy as np
from PIL import Image
from typing import Dict, Any, Tuple, Union

def generate_turbo_colormap(normalized_values: np.ndarray) -> np.ndarray:
    """
    Pure NumPy implementation of a vibrant high-contrast thermal colormap 
    (Black -> Blue -> Cyan -> Green -> Yellow -> Red) for the diff heatmap.
    normalized_values: 2D float array in [0.0, 1.0].
    Returns: 3D uint8 array (H, W, 3).
    """
    x = np.clip(normalized_values, 0.0, 1.0)
    
    # Thermal gradient polynomials / approximations
    r = np.clip(1.5 * x - 0.5, 0.0, 1.0)
    g = np.clip(1.0 - 2.0 * np.abs(x - 0.5), 0.0, 1.0)
    b = np.clip(1.5 * (1.0 - x) - 0.5, 0.0, 1.0)
    
    # Emphasize highlights in high-delta zones
    r = np.where(x > 0.6, 1.0, r * 1.2)
    b = np.where(x < 0.2, x * 4.0, b)
    
    # Where difference is zero, keep completely pitch black
    zero_mask = (x == 0.0)
    r[zero_mask] = 0.0
    g[zero_mask] = 0.0
    b[zero_mask] = 0.0
    
    rgb = np.stack([r, g, b], axis=-1) * 255.0
    return rgb.astype(np.uint8)

def compute_lock_receipt(
    original_img: Union[Image.Image, np.ndarray],
    final_img: Union[Image.Image, np.ndarray],
    mask_boundary: Union[Image.Image, np.ndarray]
) -> Tuple[Dict[str, Any], Image.Image]:
    """
    Mathematically verifies that pixels outside the approved mask were preserved.
    Generates the Lock Receipt metrics and visual difference heatmap.

    Returns:
        receipt_data (dict): Verification metrics, drift percentages, and audit hash.
        heatmap_image (PIL.Image.Image): Difference heatmap visualization.
    """
    # 1. Normalize inputs to numpy arrays
    if isinstance(original_img, Image.Image):
        orig_arr = np.array(original_img.convert("RGB"), dtype=np.float32)
    else:
        orig_arr = original_img.astype(np.float32)

    if isinstance(final_img, Image.Image):
        final_arr = np.array(final_img.convert("RGB"), dtype=np.float32)
    else:
        final_arr = final_img.astype(np.float32)

    if isinstance(mask_boundary, Image.Image):
        mask_arr = np.array(mask_boundary.convert("L")) > 0
    else:
        mask_arr = mask_boundary > 0

    height, width, _ = orig_arr.shape
    total_pixels = height * width

    # 2. Pixel difference calculation
    # Absolute difference across color channels
    abs_diff = np.abs(final_arr - orig_arr) # Shape: (H, W, 3)
    max_channel_diff = np.max(abs_diff, axis=2) # Shape: (H, W)

    # 3. Partition into Inside vs Outside Mask
    outside_mask = ~mask_arr
    inside_mask = mask_arr

    total_outside_pixels = int(np.count_nonzero(outside_mask))
    total_inside_pixels = int(np.count_nonzero(inside_mask))

    outside_diffs = max_channel_diff[outside_mask]
    inside_diffs = max_channel_diff[inside_mask]

    # Outside mask changes (must be 0 for verified status)
    # Tolerance threshold > 0 to account for byte-exact equality
    outside_changed_pixels = int(np.count_nonzero(outside_diffs > 0))
    outside_drift_percentage = float(
        (outside_changed_pixels / max(1, total_outside_pixels)) * 100.0
    )

    inside_changed_pixels = int(np.count_nonzero(inside_diffs > 0))
    inside_change_percentage = float(
        (inside_changed_pixels / max(1, total_inside_pixels)) * 100.0
    )

    is_verified = (outside_changed_pixels == 0)

    # 4. Generate Diff Heatmap Image
    # Strictly mask outside differences to 0 to ensure heatmap outside is pitch black
    clamped_diff = np.copy(max_channel_diff)
    clamped_diff[outside_mask] = 0.0

    max_val = np.max(clamped_diff) if np.max(clamped_diff) > 0 else 1.0
    normalized_heatmap = clamped_diff / max_val

    heatmap_rgb = generate_turbo_colormap(normalized_heatmap)
    heatmap_image = Image.fromarray(heatmap_rgb, mode="RGB")

    # 5. Cryptographic Audit Hash of Outside Pixels
    outside_orig_bytes = orig_arr[outside_mask].astype(np.uint8).tobytes()
    outside_final_bytes = final_arr[outside_mask].astype(np.uint8).tobytes()

    sha_orig = hashlib.sha256(outside_orig_bytes).hexdigest()
    sha_final = hashlib.sha256(outside_final_bytes).hexdigest()
    hashes_match = (sha_orig == sha_final)

    receipt_data = {
        "outside_changed_pixels": outside_changed_pixels,
        "outside_drift_percentage": round(outside_drift_percentage, 5),
        "total_outside_pixels": total_outside_pixels,
        "inside_changed_pixels": inside_changed_pixels,
        "total_inside_pixels": total_inside_pixels,
        "inside_change_percentage": round(inside_change_percentage, 2),
        "is_verified": is_verified and hashes_match,
        "audit_hashes": {
            "original_outside_sha256": sha_orig,
            "final_outside_sha256": sha_final,
            "integrity_verified": hashes_match
        },
        "resolution": {
            "width": width,
            "height": height,
            "total_pixels": total_pixels
        }
    }

    return receipt_data, heatmap_image
