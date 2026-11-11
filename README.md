# LockFrame Studio 🛡️🎨
> **"Artists decide what changes. AI performs the edit. LockFrame verifies what stayed untouched."**

LockFrame Studio is an AI-powered controllable 2D/3D visual production environment where artists generate artwork via prompts or sketches, mark a specific surgical part to edit, and mathematically verify with cryptographic receipts that **0.000% of pixels outside the mask were altered**.

---

## 🚀 Key Innovations & Architecture

1. **Mathematical Zero-Drift Pixel Compositor**
   - Traditional AI inpainting often introduces subtle floating-point drift and color shifts to unmasked regions.
   - LockFrame composites in raw pixel space (`np.where`), byte-for-byte preserving all untouched pixels with a **clamped dilation boundary** and soft feathering.

2. **The Lock Receipt™ & TURBO Diff Heatmap**
   - Automatically computes a verification receipt after every single edit:
     - `Outside-Mask Changed Pixels: 0`
     - `Outside-Mask Difference: 0.000%`
   - Generates a TURBO thermal difference heatmap (100% pitch-black outside the mask) and SHA-256 cryptographic audit checksums.

3. **SAM-2 Multi-Scale Candidate Preview**
   - Clicking any point on the canvas invokes SAM-2, returning 3 selectable candidate masks in real time:
     - Candidate 1: Surgical sub-part (e.g. sensor ear, visor)
     - Candidate 2: Component / Object (e.g. helmet, armor piece)
     - Candidate 3: Segment / Full figure

4. **Vector-as-ControlNet Studio**
   - Extracts 8–20 simplified cubic Bezier anchor nodes from raster mask contours.
   - Artists physically click and drag nodes to stretch, lengthen, or curve anatomy without prompt wrestling.
   - Re-renders via ControlNet edge guides and issues an updated Lock Receipt.

5. **Multi-View Turnaround (0°, 45°, 90°, 180°)**
   - 4-camera turnaround carousel (`Front`, `3/4`, `Side Profile`, `Rear View`).
   - 1-click **Cross-View Edit Propagation** using Grounded-SAM + IP-Adapter.
   - 2D DWPose skeletal puppet rig keypoint adjustment.

6. **Interactive 3D WebGL Normal-Map Relighting**
   - Three.js WebGL shader dynamically estimating surface normals via a 4-point Sobel gradient.
   - Moving the mouse cursor casts real-time Blinn-Phong directional light, diffuse relief, and specular glints across the 2D illustration.

7. **"Git for Art" Non-Destructive Revision Stack**
   - Every edit is committed as an isolated layer with rollback and visual comparison toggles.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Three.js, `@react-three/fiber`, Framer Motion, Lucide Icons.
- **Backend**: Python 3.11, FastAPI, Uvicorn, SQLAlchemy, Pillow, NumPy, SciPy.
- **AI & Vision Engines**: SAM-2 (Segment Anything 2), Fal.ai (Flux-Fill Inpainting & ControlNet), Google Gemini (Style Sheet extraction & micro-prompt enrichment), DWPose (2D skeleton rig).
- **Database & Storage**: Dual-engine Supabase PostgreSQL + Supabase Cloud Storage (with automatic local SQLite and `/storage` disk fallback).

---

## ⚡ Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials (or run with SQLite fallback)

uvicorn main:app --reload --port 8000
```
- Interactive API Docs: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Open Studio: `http://localhost:3000`

### 3. Running Verification Tests
```bash
cd backend
python test_user_scenarios.py
```
- Tests SAM-2 candidate generation (`POST /api/segment/candidates`).
- Tests Pen-Lock zero-drift inpainting (`POST /api/edit/pen-lock`), verifying:
  - `outside_mask_changed_pixels == 0`
  - `outside_mask_diff_percent == 0.0`
  - Difference heatmap outside mask is 100% pitch-black `[0, 0, 0]`.

---

## 📁 Repository Structure

```
lockframe-studio/
├── backend/
│   ├── main.py                  # FastAPI server & route handlers
│   ├── config.py                # Environment configuration loader
│   ├── database.py              # Supabase PostgreSQL / SQLite connection pool
│   ├── models.py                # SQLAlchemy ORM models
│   ├── schemas.py               # Pydantic validation schemas
│   ├── test_user_scenarios.py   # Test suite for SAM-2 & zero-drift compositor
│   └── services/
│       ├── compositor.py        # Zero-drift pixel-space composite engine
│       ├── receipt.py           # TURBO diff heatmap & SHA-256 generator
│       ├── vector.py            # RDP Bezier node extraction & rasterizer
│       ├── ai_service.py        # SAM-2, Gemini prompt & DWPose rig generator
│       └── storage.py           # Supabase Cloud Storage & disk sync
├── frontend/
│   ├── app/
│   │   ├── layout.tsx           # Dark atelier studio layout & fonts
│   │   ├── globals.css          # Tailwind utilities & custom glassmorphism
│   │   └── page.tsx             # Studio orchestrator (Landing + 5 tabs)
│   ├── components/
│   │   ├── layout/TopNavbar.tsx # Brand logo, view switch, export action
│   │   ├── landing/             # 3D Hero, comparison, & workflow sections
│   │   ├── studio/tabs/         # 5 dedicated, uncluttered studio tabs
│   │   └── three/               # Three.js 3D WebGL scenes & relighting
│   └── lib/api.ts               # Unified API client with offline demo fallback
├── .gitignore                   # Security & build exclusions
└── README.md                    # Project documentation
```

---

## 📜 License
MIT License. Built for hackathon showcase.
