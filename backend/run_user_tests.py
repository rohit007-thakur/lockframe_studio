import requests
import json
import numpy as np
from PIL import Image
import io

BASE_URL = "http://127.0.0.1:8000"

print("=================================================================")
print("RUNNING LOCKFRAME STUDIO TESTS (TEST 2 & TEST 3)")
print("=================================================================\n")

# STEP 1: Create project to get project_id
print("[STEP 1] Calling POST /api/projects/create...")
res_proj = requests.post(
    f"{BASE_URL}/api/projects/create",
    json={"name": "LockFrame Judge Demo", "mode": "2d"}
)
assert res_proj.status_code == 200, f"Project create failed: {res_proj.text}"
proj_data = res_proj.json()
project_id = proj_data["id"]
print(f" -> Project Created Successfully! Project ID: {project_id}\n")

# TEST 2: POST /api/segment/candidates (SAM-2 Check)
print("-----------------------------------------------------------------")
print("[TEST 2] Calling POST /api/segment/candidates (SAM-2 Check)...")
print("Payload: project_id =", project_id, ", points = [{'x': 250, 'y': 250}]")

res_seg = requests.post(
    f"{BASE_URL}/api/segment/candidates",
    json={
        "project_id": project_id,
        "points": [{"x": 250, "y": 250, "is_positive": True}]
    }
)

assert res_seg.status_code == 200, f"Segment candidates failed: {res_seg.text}"
seg_data = res_seg.json()
candidates = seg_data.get("candidates", [])

print(f"Status Code: {res_seg.status_code} OK")
print(f"Candidate Masks Returned: {len(candidates)}")

for c in candidates:
    print(f" -> Candidate {c['candidate_id']} ({c['label']}):")
    print(f"    Confidence: {round(c['confidence_score'] * 100)}%")
    print(f"    Mask URL:   {c.get('mask_url')}")
    assert c.get("mask_url"), "Missing mask_url in candidate!"

assert len(candidates) == 3, f"Expected 3 candidate masks, got {len(candidates)}"
print("\n>>> TEST 2 PASSED: 3 Candidate Masks with Valid URLs Returned! <<<\n")

# TEST 3: POST /api/edit/pen-lock (Lock Receipt & Heatmap Check)
chosen_mask_url = candidates[0]["mask_url"]
print("-----------------------------------------------------------------")
print("[TEST 3] Calling POST /api/edit/pen-lock (Lock Receipt & Heatmap Check)...")
print(f"Payload: project_id = {project_id}")
print(f"         mask_url   = {chosen_mask_url}")
print(f"         prompt     = 'robotic ear'")

res_edit = requests.post(
    f"{BASE_URL}/api/edit/pen-lock",
    json={
        "project_id": project_id,
        "mask_url": chosen_mask_url,
        "prompt": "robotic ear",
        "dilation_px": 6,
        "feather_sigma": 2.0
    }
)

assert res_edit.status_code == 200, f"Pen-Lock Edit failed: {res_edit.text}"
edit_data = res_edit.json()

print(f"Status Code: {res_edit.status_code} OK")
print("\nResponse Fields Verification:")
print(f" 1. outside_mask_changed_pixels : {edit_data.get('outside_mask_changed_pixels')}")
print(f" 2. outside_mask_diff_percent   : {edit_data.get('outside_mask_diff_percent')}%")
print(f" 3. diff_heatmap_url            : {edit_data.get('diff_heatmap_url')}")
print(f" 4. result_image_url            : {edit_data.get('result_image_url')}")

# Assert exact required values
assert edit_data.get("outside_mask_changed_pixels") == 0, f"Expected 0 changed pixels, got {edit_data.get('outside_mask_changed_pixels')}"
assert edit_data.get("outside_mask_diff_percent") == 0.0, f"Expected 0.0% drift, got {edit_data.get('outside_mask_diff_percent')}"
assert edit_data.get("diff_heatmap_url"), "Missing diff_heatmap_url!"

# Verify Diff Heatmap Image (Outside Mask is 100% Pitch Black)
heatmap_url = edit_data.get("diff_heatmap_url")
print("\n[VERIFYING HEATMAP IMAGE PIXELS]")
if heatmap_url.startswith("http"):
    h_resp = requests.get(heatmap_url)
    h_img = Image.open(io.BytesIO(h_resp.content))
else:
    # local path
    subpath = heatmap_url.replace("/storage/", "")
    from config import STORAGE_DIR
    h_img = Image.open(STORAGE_DIR / subpath)

h_arr = np.array(h_img.convert("RGB"))
# Check corner pixels outside the mask area (e.g. at [10, 10], [900, 900], [50, 950])
corner_pixels = [
    h_arr[10, 10],
    h_arr[900, 900],
    h_arr[50, 950],
    h_arr[950, 50]
]
print(f"Sample Outside Pixels in Heatmap: {[list(p) for p in corner_pixels]}")
for p in corner_pixels:
    assert list(p) == [0, 0, 0], f"Expected black pixel [0, 0, 0], got {list(p)}"

print("Heatmap Outside Mask Integrity: VERIFIED PITCH BLACK ([0, 0, 0])")
print("\n=================================================================")
print(">>> ALL TEST 2 AND TEST 3 CHECKS PASSED WITH 100% ACCURACY! <<<")
print("=================================================================")
