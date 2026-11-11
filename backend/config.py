import os
from pathlib import Path
from dotenv import load_dotenv

# Base Paths
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from /backend/.env
load_dotenv(BASE_DIR / ".env")

# Local Storage Directories
STORAGE_DIR = BASE_DIR / "storage"
ORIGINALS_DIR = STORAGE_DIR / "originals"
MASKS_DIR = STORAGE_DIR / "masks"
REVISIONS_DIR = STORAGE_DIR / "revisions"
HEATMAPS_DIR = STORAGE_DIR / "heatmaps"
EXPORTS_DIR = STORAGE_DIR / "exports"

for d in [STORAGE_DIR, ORIGINALS_DIR, MASKS_DIR, REVISIONS_DIR, HEATMAPS_DIR, EXPORTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# 1. Database (Supabase PostgreSQL with fallback to SQLite)
raw_db_url = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'lockframe.db'}")
# Ensure proper SQLAlchemy PostgreSQL driver prefix
if raw_db_url.startswith("postgres://"):
    DATABASE_URL = raw_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif raw_db_url.startswith("postgresql://"):
    DATABASE_URL = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
else:
    DATABASE_URL = raw_db_url

# 2. AI Model Credentials
FAL_KEY = os.getenv("FAL_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# 3. Supabase Cloud Storage
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "lockframe-assets")

# 4. Server Host & Port
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
