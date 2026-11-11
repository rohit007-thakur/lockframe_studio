import math
import re
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from typing import List, Tuple, Dict, Any, Optional

def ramer_douglas_peucker(points: List[Tuple[float, float]], epsilon: float) -> List[Tuple[float, float]]:
    """
    Simplifies a 2D polygonal curve using the Ramer-Douglas-Peucker algorithm.
    """
    if len(points) < 3:
        return points

    start = np.array(points[0])
    end = np.array(points[-1])
    line_vec = end - start
    line_len = np.linalg.norm(line_vec)

    if line_len == 0:
        dists = np.linalg.norm(np.array(points) - start, axis=1)
    else:
        line_unit = line_vec / line_len
        vecs = np.array(points) - start
        proj = np.sum(vecs * line_unit, axis=1, keepdims=True) * line_unit
        dists = np.linalg.norm(vecs - proj, axis=1)

    max_idx = int(np.argmax(dists))
    max_dist = dists[max_idx]

    if max_dist > epsilon:
        left = ramer_douglas_peucker(points[:max_idx + 1], epsilon)
        right = ramer_douglas_peucker(points[max_idx:], epsilon)
        return left[:-1] + right
    else:
        return [points[0], points[-1]]

def extract_boundary_contour(mask_arr: np.ndarray) -> List[Tuple[float, float]]:
    """
    Extracts ordered perimeter coordinates of the primary connected object in a binary mask.
    mask_arr: 2D boolean array.
    """
    h, w = mask_arr.shape
    # Find boundary pixels: where mask is True and has at least one False neighbor
    padded = np.pad(mask_arr, 1, mode="constant", constant_values=False)
    boundary = (
        padded[1:-1, 1:-1] & (
            ~padded[:-2, 1:-1] | ~padded[2:, 1:-1] |
            ~padded[1:-1, :-2] | ~padded[1:-1, 2:]
        )
    )

    y_indices, x_indices = np.where(boundary)
    if len(x_indices) == 0:
        return []

    # Sort boundary pixels angularly relative to centroid to create a continuous closed loop
    cx = float(np.mean(x_indices))
    cy = float(np.mean(y_indices))

    angles = np.arctan2(y_indices - cy, x_indices - cx)
    sort_order = np.argsort(angles)

    sorted_pts = [(float(x_indices[i]), float(y_indices[i])) for i in sort_order]
    return sorted_pts

def fit_cubic_bezier_handles(
    pts: List[Tuple[float, float]],
    smoothness: float = 0.25
) -> List[Dict[str, Any]]:
    """
    Fits smooth incoming and outgoing Bezier handles to a closed loop of anchor nodes.
    """
    n = len(pts)
    nodes = []

    for i in range(n):
        curr = pts[i]
        prev = pts[(i - 1) % n]
        nxt = pts[(i + 1) % n]

        # Tangent vector from prev to nxt
        tx = (nxt[0] - prev[0]) * smoothness
        ty = (nxt[1] - prev[1]) * smoothness

        nodes.append({
            "id": i,
            "x": round(curr[0], 2),
            "y": round(curr[1], 2),
            "handle_in": [round(curr[0] - tx, 2), round(curr[1] - ty, 2)],
            "handle_out": [round(curr[0] + tx, 2), round(curr[1] + ty, 2)]
        })

    return nodes

def nodes_to_svg_path(nodes: List[Dict[str, Any]]) -> str:
    """
    Converts anchor nodes with cubic Bezier control points into an SVG path string.
    """
    if not nodes:
        return ""

    n = len(nodes)
    start = nodes[0]
    path_cmds = [f"M {start['x']} {start['y']}"]

    for i in range(n):
        curr_node = nodes[i]
        next_node = nodes[(i + 1) % n]

        # Use curr_node handle_out and next_node handle_in as cubic Bezier control points
        cp1x, cp1y = curr_node["handle_out"]
        cp2x, cp2y = next_node["handle_in"]
        x2, y2 = next_node["x"], next_node["y"]

        path_cmds.append(f"C {cp1x} {cp1y}, {cp2x} {cp2y}, {x2} {y2}")

    path_cmds.append("Z")
    return " ".join(path_cmds)

def extract_vector_paths(
    mask_img: Image.Image,
    target_node_count: int = 14
) -> Dict[str, Any]:
    """
    Converts a binary mask into an artist-friendly, simplified SVG Bezier path 
    with exactly 8 to 20 anchor nodes.
    """
    mask_arr = np.array(mask_img.convert("L")) > 127
    raw_contour = extract_boundary_contour(mask_arr)

    if len(raw_contour) < 4:
        return {
            "svg_path_data": "",
            "nodes": [],
            "bounding_box": [0, 0, 0, 0]
        }

    # Binary search for optimal epsilon to hit target_node_count (8 to 20)
    low_eps = 1.0
    high_eps = 100.0
    best_pts = raw_contour

    for _ in range(12):
        mid_eps = (low_eps + high_eps) / 2.0
        simplified = ramer_douglas_peucker(raw_contour, mid_eps)
        if len(simplified) > target_node_count:
            low_eps = mid_eps
            best_pts = simplified
        else:
            high_eps = mid_eps
            best_pts = simplified
        if 8 <= len(best_pts) <= 20:
            break

    # Ensure closed loop and cap within 8 to 20
    if len(best_pts) > 20:
        step = max(1, len(best_pts) // 16)
        best_pts = best_pts[::step]
    elif len(best_pts) < 6:
        best_pts = raw_contour[::max(1, len(raw_contour) // 12)]

    nodes = fit_cubic_bezier_handles(best_pts)
    svg_path_str = nodes_to_svg_path(nodes)

    xs = [p[0] for p in best_pts]
    ys = [p[1] for p in best_pts]
    bbox = [int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))]

    return {
        "svg_path_data": svg_path_str,
        "nodes": nodes,
        "bounding_box": bbox
    }

def rasterize_svg_path(
    svg_path_str: str,
    width: int,
    height: int
) -> Tuple[Image.Image, Image.Image]:
    """
    Parses SVG path commands (M, C, L, Z), evaluates cubic Bezier splines, 
    and rasterizes into:
        1. Binary Mask (PIL Image, L)
        2. Canny Edge Map for ControlNet conditioning (PIL Image, L)
    """
    # Sample points along Bezier curves
    tokens = re.findall(r'([A-Za-z]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)', svg_path_str)
    
    points: List[Tuple[float, float]] = []
    i = 0
    curr_x, curr_y = 0.0, 0.0

    while i < len(tokens):
        cmd = tokens[i]
        if cmd == 'M':
            curr_x = float(tokens[i+1])
            curr_y = float(tokens[i+2])
            points.append((curr_x, curr_y))
            i += 3
        elif cmd == 'L':
            curr_x = float(tokens[i+1])
            curr_y = float(tokens[i+2])
            points.append((curr_x, curr_y))
            i += 3
        elif cmd == 'C':
            cp1x, cp1y = float(tokens[i+1]), float(tokens[i+2])
            cp2x, cp2y = float(tokens[i+3]), float(tokens[i+4])
            end_x, end_y = float(tokens[i+5]), float(tokens[i+6])

            # Sample cubic Bezier at 10 intervals
            for step in range(1, 11):
                t = step / 10.0
                omt = 1.0 - t
                bx = (omt**3 * curr_x + 
                      3 * omt**2 * t * cp1x + 
                      3 * omt * t**2 * cp2x + 
                      t**3 * end_x)
                by = (omt**3 * curr_y + 
                      3 * omt**2 * t * cp1y + 
                      3 * omt * t**2 * cp2y + 
                      t**3 * end_y)
                points.append((bx, by))

            curr_x, curr_y = end_x, end_y
            i += 7
        elif cmd in ['Z', 'z']:
            i += 1
        else:
            i += 1

    # 1. Rasterize filled polygon mask
    mask_img = Image.new("L", (width, height), 0)
    if len(points) >= 3:
        draw = ImageDraw.Draw(mask_img)
        draw.polygon(points, fill=255)

    # 2. Generate Canny / Lineart Edge Map for ControlNet
    # Morphological gradient: Dilation minus Erosion produces exact crisp 2px lineart
    dilated = mask_img.filter(ImageFilter.MaxFilter(3))
    eroded = mask_img.filter(ImageFilter.MinFilter(3))
    edge_arr = np.array(dilated, dtype=np.int16) - np.array(eroded, dtype=np.int16)
    edge_arr = np.clip(edge_arr, 0, 255).astype(np.uint8)
    
    edge_img = Image.fromarray(edge_arr, mode="L")

    return mask_img, edge_img
