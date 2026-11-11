import sys
import os
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from config import FAL_KEY, GEMINI_API_KEY, DATABASE_URL, SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET
from database import engine

print("=== 1. Checking .env Loading ===")
print("FAL_KEY present:", bool(FAL_KEY and len(FAL_KEY) > 5))
print("GEMINI_API_KEY present:", bool(GEMINI_API_KEY and len(GEMINI_API_KEY) > 5))
print("DATABASE_URL present:", bool(DATABASE_URL and len(DATABASE_URL) > 5))
dialect = DATABASE_URL.split("://")[0] if "://" in DATABASE_URL else "unknown"
print("Database dialect:", dialect)
print("SUPABASE_URL present:", bool(SUPABASE_URL and len(SUPABASE_URL) > 5))
print("SUPABASE_KEY present:", bool(SUPABASE_KEY and len(SUPABASE_KEY) > 5))

print("\n=== 2. Testing Database Connection ===")
try:
    with engine.connect() as conn:
        from sqlalchemy import text
        res = conn.execute(text("SELECT 1")).scalar()
        print("Database Status: LIVE & ACTIVE (SELECT 1 returned", res, ")")
except Exception as e:
    print("Database Error:", str(e)[:200])

print("\n=== 3. Testing Google Gemini API ===")
if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Discover accessible models
        found_model = None
        for m in genai.list_models():
            if "generateContent" in m.supported_generation_methods:
                if "flash" in m.name or "gemini" in m.name:
                    found_model = m.name
                    break
        
        model_name = found_model or "gemini-1.5-flash"
        print("Discovered Gemini Model:", model_name)
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Reply with the single word: READY")
        print("Gemini Status: LIVE & ACTIVE (Response:", response.text.strip(), ")")
    except Exception as e:
        print("Gemini Error:", str(e)[:200])
else:
    print("Gemini: Key not found in .env (Using procedural fallback)")

print("\n=== 4. Testing Supabase Cloud Storage ===")
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        buckets = sb.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        print("Supabase Storage: LIVE & CONNECTED")
        print("Available Buckets:", bucket_names)
        if SUPABASE_BUCKET in bucket_names:
            print(f"Bucket '{SUPABASE_BUCKET}': READY")
        else:
            print(f"Creating bucket '{SUPABASE_BUCKET}'...")
            sb.storage.create_bucket(SUPABASE_BUCKET, options={"public": True})
            print(f"Bucket '{SUPABASE_BUCKET}' created successfully!")
    except Exception as e:
        print("Supabase Storage Error:", str(e)[:200])
else:
    print("Supabase Storage: Not configured (Using local /storage fallback)")

print("\n=== 5. Testing Fal.ai Key ===")
if FAL_KEY:
    os.environ["FAL_KEY"] = FAL_KEY
    try:
        import fal_client
        print("Fal.ai Status: CONFIGURED (Key is loaded in environment)")
    except Exception as e:
        print("Fal.ai Error:", str(e)[:200])
else:
    print("Fal.ai: Key not found in .env (Using local synthesis engine)")
