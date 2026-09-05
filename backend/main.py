import asyncio
from datetime import datetime
import math
import os
import sys
import tempfile
import uuid
from pathlib import Path

# Ensure the project root is on sys.path so "ai" package is importable
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import dotenv_values
from ai.pipeline import analyze_incident


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


class IncidentStatusUpdate(BaseModel):
    status: str


class IncidentAssign(BaseModel):
    department: str


ALLOWED_STATUSES = {
    "REPORTED",
    "AI ANALYZED",
    "PRIORITIZED",
    "ASSIGNED",
    "IN PROGRESS",
    "REPAIR COMPLETED",
    "VERIFIED",
    "CLOSED",
}


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


@app.get("/incidents")
def get_incidents(
    status: Optional[str] = None,
    department: Optional[str] = None,
    issue_type: Optional[str] = None,
):
    try:
        query = supabase.table("incidents").select("*")
        
        if status:
            query = query.eq("status", status)
        if department:
            query = query.eq("department", department)
        if issue_type:
            query = query.eq("issue_type", issue_type)
            
        response = query.order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/incidents/{incident_id}")
def get_incident(incident_id: int):
    try:
        response = (
            supabase
            .table("incidents")
            .select("*")
            .eq("id", incident_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/incidents/{incident_id}/status")
def update_incident_status(incident_id: int, update: IncidentStatusUpdate):
    # 1. Validate status value
    if update.status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status: '{update.status}'. Supported statuses: {', '.join(sorted(ALLOWED_STATUSES))}"
        )

    # 2. Verify that incident exists
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

    # 3. Update only the status field
    try:
        response = (
            supabase
            .table("incidents")
            .update({"status": update.status})
            .eq("id", incident_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update incident status: {str(e)}")


@app.patch("/incidents/{incident_id}/assign")
def assign_incident(incident_id: int, assignment: IncidentAssign):
    # 1. Validate department is provided and non-empty
    cleaned_dept = assignment.department.strip()
    if not cleaned_dept:
        raise HTTPException(
            status_code=400,
            detail="Department cannot be empty"
        )

    # 2. Verify whether the incident exists
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

    # 3. Update department and automatically set status = ASSIGNED
    try:
        response = (
            supabase
            .table("incidents")
            .update({
                "department": cleaned_dept,
                "status": "ASSIGNED"
            })
            .eq("id", incident_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign incident: {str(e)}")


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two geographic points in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


DUPLICATE_DISTANCE_THRESHOLD_METERS = 100.0


@app.get("/incidents/{incident_id}/duplicates")
def get_incident_duplicates(incident_id: int):
    # 1. Verify that the requested incident exists
    try:
        target_res = (
            supabase
            .table("incidents")
            .select("*")
            .eq("id", incident_id)
            .execute()
        )
        if not target_res.data:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
        target = target_res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error checking incident: {str(e)}")

    target_lat = target.get("latitude")
    target_lon = target.get("longitude")
    if target_lat is None or target_lon is None:
        return {
            "incident_id": incident_id,
            "duplicate_count": 0,
            "possible_duplicates": [],
        }

    # 2. Retrieve other incidents from the existing incidents table (excluding itself)
    try:
        candidates_res = (
            supabase
            .table("incidents")
            .select("*")
            .neq("id", incident_id)
            .execute()
        )
        candidates = candidates_res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error retrieving incidents: {str(e)}")

    target_type = (target.get("issue_type") or "").strip().lower()
    target_desc = (target.get("description") or "").strip().lower()
    target_created_str = target.get("created_at")
    target_time = None
    if target_created_str:
        try:
            target_time = datetime.fromisoformat(target_created_str.replace("Z", "+00:00"))
        except Exception:
            target_time = None

    possible_duplicates = []

    for cand in candidates:
        cand_lat = cand.get("latitude")
        cand_lon = cand.get("longitude")
        if cand_lat is None or cand_lon is None:
            continue

        # 3. Geographic duplicate rule: Haversine distance <= 100 meters
        try:
            dist = haversine_distance(float(target_lat), float(target_lon), float(cand_lat), float(cand_lon))
        except (ValueError, TypeError):
            continue

        if dist > DUPLICATE_DISTANCE_THRESHOLD_METERS:
            continue

        # 5. Recent time window: within 24 hours if created_at exists
        cand_created_str = cand.get("created_at")
        if target_time and cand_created_str:
            try:
                cand_time = datetime.fromisoformat(cand_created_str.replace("Z", "+00:00"))
                if abs((cand_time - target_time).total_seconds()) > 24 * 3600:
                    continue
            except Exception:
                pass

        # 4. Issue-type matching (prefer candidates with same issue_type, case-insensitive)
        cand_type = (cand.get("issue_type") or "").strip().lower()
        cand_desc = (cand.get("description") or "").strip().lower()

        is_same_issue = False
        if target_type and cand_type and target_type == cand_type:
            is_same_issue = True
        elif target_type and target_type in cand_desc:
            is_same_issue = True
        elif cand_type and cand_type in target_desc:
            is_same_issue = True

        if is_same_issue:
            duplicate_reason = "Same issue type and within 100 meters"
        else:
            duplicate_reason = "Nearby location within 100 meters"

        possible_duplicates.append({
            "incident_id": cand.get("id"),
            "issue_type": cand.get("issue_type"),
            "description": cand.get("description"),
            "latitude": cand.get("latitude"),
            "longitude": cand.get("longitude"),
            "distance_meters": round(dist, 1),
            "created_at": cand.get("created_at"),
            "status": cand.get("status"),
            "priority_score": cand.get("priority_score", 0),
            "duplicate_reason": duplicate_reason,
        })

    # Sort so same issue type comes first, then ordered by distance
    possible_duplicates.sort(
        key=lambda d: (0 if "Same issue type" in d["duplicate_reason"] else 1, d["distance_meters"])
    )

    return {
        "incident_id": incident_id,
        "duplicate_count": len(possible_duplicates),
        "possible_duplicates": possible_duplicates,
    }


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

    # ── AI ANALYSIS ──────────────────────────────────────────
    ai_result = None
    ai_error = None
    temp_path = None

    try:
        # Save image bytes to a temporary local file for AI processing
        with tempfile.NamedTemporaryFile(
            suffix=file_ext, delete=False, dir=tempfile.gettempdir()
        ) as tmp:
            tmp.write(file_bytes)
            temp_path = tmp.name

        # Run synchronous AI pipeline in a thread to avoid blocking
        ai_result = await asyncio.to_thread(
            analyze_incident,
            image_path=temp_path,
            raise_errors=False,
        )

        # Extract AI scores (pipeline always returns these keys)
        if ai_result and ai_result.get("status") == "success":
            ai_update = {
                "issue_type": ai_result.get("issue_type"),
                "severity": ai_result.get("severity", 0),
                "risk_score": ai_result.get("risk_score", 0),
                "priority_score": ai_result.get("priority_score", 0),
                "department": ai_result.get("department"),
            }
            supabase.table("incidents").update(
                ai_update
            ).eq("id", incident_id).execute()
        else:
            ai_error = ai_result.get("message", "AI analysis returned non-success status") if ai_result else "No result from AI"

    except Exception as exc:
        ai_error = f"AI analysis failed: {str(exc)}"

    finally:
        # Always clean up the temporary file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

    # ── RESPONSE ─────────────────────────────────────────────
    response = {
        "incident_id": incident_id,
        "filename": file.filename,
        "image_url": image_url,
        "message": "Image uploaded successfully",
    }

    if ai_result and ai_result.get("status") == "success":
        response["ai_analysis"] = {
            "issue_type": ai_result.get("issue_type"),
            "severity": ai_result.get("severity"),
            "severity_level": ai_result.get("severity_level"),
            "risk_score": ai_result.get("risk_score"),
            "risk_level": ai_result.get("risk_level"),
            "priority_score": ai_result.get("priority_score"),
            "priority_level": ai_result.get("priority_level"),
            "department": ai_result.get("department"),
            "confidence": ai_result.get("confidence"),
            "damage_description": ai_result.get("damage_description"),
        }
        response["message"] = "Image uploaded and AI analysis completed successfully"
    elif ai_error:
        response["ai_warning"] = ai_error

    return response