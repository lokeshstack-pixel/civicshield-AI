import os
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import dotenv_values


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
config = dotenv_values(ENV_FILE)

SUPABASE_URL = config.get("SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = config.get("SUPABASE_KEY") or os.getenv("SUPABASE_KEY")


# ============================================================
# CHECK ENVIRONMENT VARIABLES
# ============================================================

if not SUPABASE_URL:
    raise RuntimeError(
        f"SUPABASE_URL not found. Expected .env at: {ENV_FILE}"
    )

if not SUPABASE_KEY:
    raise RuntimeError(
        f"SUPABASE_KEY not found. Expected .env at: {ENV_FILE}"
    )


# ============================================================
# SUPABASE
# ============================================================

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="CIVICSHIELD API",
    description="AI-powered Civic Incident Intelligence Platform",
    version="0.1.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# MODELS
# ============================================================

class IncidentCreate(BaseModel):
    issue_type: Optional[str] = None
    description: str
    latitude: float
    longitude: float


# ============================================================
# ROUTES
# ============================================================

@app.get("/")
def root():
    return {
        "project": "CIVICSHIELD",
        "status": "running",
        "message": "Civic Incident Intelligence API is working"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/supabase-test")
def supabase_test():
    try:
        response = (
            supabase
            .table("incidents")
            .select("*")
            .limit(1)
            .execute()
        )

        return {
            "status": "success",
            "message": "Supabase connection is working!",
            "data": response.data
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/incidents")
def create_incident(incident: IncidentCreate):
    try:
        response = (
            supabase
            .table("incidents")
            .insert({
                "issue_type": incident.issue_type,
                "description": incident.description,
                "latitude": incident.latitude,
                "longitude": incident.longitude,
                "severity": 0,
                "risk_score": 0,
                "priority_score": 0,
                "status": "REPORTED"
            })
            .execute()
        )
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to create incident")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

@app.post("/incidents/{incident_id}/image")
async def upload_incident_image(incident_id: int, file: UploadFile = File(...)):
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed types: jpg, jpeg, png, webp"
        )

    # Verify incident exists
    try:
        incident_check = (
            supabase
            .table("incidents")
            .select("id")
            .eq("id", incident_id)
            .execute()
        )
        if not incident_check.data:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking incident: {str(e)}")

    # Read file contents
    file_bytes = await file.read()

    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    storage_path = f"incidents/{incident_id}/{unique_filename}"

    # Upload to Supabase Storage
    try:
        supabase.storage.from_("incident-images").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    # Generate public URL
    image_url = supabase.storage.from_("incident-images").get_public_url(storage_path)

    # Update incident row with image URL
    try:
        supabase.table("incidents").update(
            {"image_url": image_url}
        ).eq("id", incident_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update incident: {str(e)}")

    return {
        "incident_id": incident_id,
        "filename": file.filename,
        "image_url": image_url,
        "message": "Image uploaded successfully"
    }