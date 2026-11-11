import numpy as np
from PIL import Image, ImageFilter
from typing import Tuple, Union

MAX_IMAGE_DIM = 8192

def dilate_and_feather_mask(
    mask: Image.Image,
    dilation_px: int = 6,
    feather_sigma: float = 2.0
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Dilates a binary mask to encompass edge transitions and feathers it with Gaussian blur.
    Clamps kernel size within Pillow's MaxFilter limits and avoids hard truncation.
    """
    dilation_px = max(0, int(dilation_px))
    feather_sigma = max(0.0, float(feather_sigma))

    mask_gray = mask.convert("L")
    
    # 1. Dilation using morphological MaxFilter (clamped <= 251 to avoid Pillow overflow)
    if dilation_px > 0:
        kernel_size = min(max(3, int(dilation_px * 2 + 1)), 251)
        if kernel_size % 2 == 0:
            kernel_size += 1
        dilated_img = mask_gray.filter(ImageFilter.MaxFilter(kernel_size))
    else:
        dilated_img = mask_gray

    # 2. Gaussian Feathering for seamless border blending
    if feather_sigma > 0:
        feathered_img = dilated_img.filter(ImageFilter.GaussianBlur(radius=feather_sigma))
        feathered_alpha = np.array(feathered_img, dtype=np.float32) / 255.0
    else:
        feathered_alpha = (np.array(dilated_img) > 127).astype(np.float32)

    # Soft dilated boundary includes all non-zero feathered alpha regions
    dilated_binary = feathered_alpha > 0.001

    return dilated_binary, feathered_alpha

def pixel_space_composite(
    original_img: Union[Image.Image, np.ndarray],
    generated_img: Union[Image.Image, np.ndarray],
    mask_img: Union[Image.Image, np.ndarray],
    dilation_px: int = 6,
    feather_sigma: float = 2.0
) -> Tuple[Image.Image, np.ndarray]:
    """
    Executes surgical Pixel-Space Compositing:
    Generated pixels are blended ONLY inside the approved feathered mask boundary.
    Pixels strictly outside the dilated mask boundary are preserved identically
    from the original image with ZERO floating point or compression drift.
    """
    if isinstance(original_img, np.ndarray):
        original_pil = Image.fromarray(original_img.astype(np.uint8)).convert("RGB")
    else:
        original_pil = original_img.convert("RGB")

    if isinstance(generated_img, np.ndarray):
        generated_pil = Image.fromarray(generated_img.astype(np.uint8)).convert("RGB")
    else:
        generated_pil = generated_img.convert("RGB")

    if isinstance(mask_img, np.ndarray):
        mask_pil = Image.fromarray(mask_img.astype(np.uint8)).convert("L")
    else:
        mask_pil = mask_img.convert("L")

    # Defense against massive memory exhaustion / DoS
    orig_w, orig_h = original_pil.size
    if orig_w > MAX_IMAGE_DIM or orig_h > MAX_IMAGE_DIM:
        raise ValueError(f"Image dimensions ({orig_w}x{orig_h}) exceed maximum supported dimension ({MAX_IMAGE_DIM}).")

    if generated_pil.size != (orig_w, orig_h):
        generated_pil = generated_pil.resize((orig_w, orig_h), Image.Resampling.LANCZOS)
    if mask_pil.size != (orig_w, orig_h):
        mask_pil = mask_pil.resize((orig_w, orig_h), Image.Resampling.NEAREST)

    # Calculate dilated boundary and feathered alpha
    dilated_binary, alpha = dilate_and_feather_mask(
        mask_pil,
        dilation_px=dilation_px,
        feather_sigma=feather_sigma
    )

    orig_arr = np.array(original_pil, dtype=np.float32)
    gen_arr = np.array(generated_pil, dtype=np.float32)
    alpha_3d = np.expand_dims(alpha, axis=2)

    # Smooth alpha-composite inside the feathered boundary
    composited_float = (1.0 - alpha_3d) * orig_arr + alpha_3d * gen_arr

    # Vectorized byte-for-byte outside preservation
    # Pixels where dilated_binary is False are guaranteed 100% byte-identical to orig_arr
    final_float = np.where(dilated_binary[:, :, np.newaxis], composited_float, orig_arr)

    final_arr = np.clip(final_float, 0, 255).astype(np.uint8)
    final_image = Image.fromarray(final_arr, mode="RGB")

    return final_image, alpha
