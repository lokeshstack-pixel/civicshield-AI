import asyncio
from datetime import datetime
from io import BytesIO
import math
import os
import sys
import tempfile
import uuid
from pathlib import Path

import httpx
import numpy as np
from PIL import Image

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
from ai.risk import calculate_risk, get_risk_level
from ai.priority import calculate_priority, get_priority_level


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


class RiskRecalculateRequest(BaseModel):
    weather_factor: Optional[float] = 1.0
    traffic_factor: Optional[float] = 1.0


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


# ============================================================
# DASHBOARD SUMMARY API (Read-only aggregation for Authority Dashboard)
# ============================================================

OPEN_INCIDENT_STATUSES = {
    "REPORTED",
    "AI ANALYZED",
    "PRIORITIZED",
    "ASSIGNED",
    "IN PROGRESS",
    "REPAIR COMPLETED",
}


@app.get("/dashboard/summary")
def get_dashboard_summary():
    """
    Read-only aggregation API for Member 4's Authority Dashboard.
    Provides city/incident metrics, breakdown counters, and top priority dispatch queue.
    """
    try:
        response = supabase.table("incidents").select("*").execute()
        incidents = response.data or []
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve dashboard summary data"
        )

    if not incidents:
        return {
            "total_incidents": 0,
            "open_incidents": 0,
            "critical_incidents": 0,
            "high_priority_incidents": 0,
            "assigned_incidents": 0,
            "in_progress_incidents": 0,
            "repair_completed_incidents": 0,
            "verified_incidents": 0,
            "closed_incidents": 0,
            "average_risk_score": 0.0,
            "status_breakdown": {},
            "department_breakdown": {},
            "issue_type_breakdown": {},
            "top_priority_incidents": [],
        }

    total_incidents = len(incidents)
    open_incidents = sum(1 for inc in incidents if inc.get("status") in OPEN_INCIDENT_STATUSES)
    critical_incidents = sum(1 for inc in incidents if (inc.get("risk_score") or 0) >= 75)
    high_priority_incidents = sum(1 for inc in incidents if (inc.get("priority_score") or 0) >= 50)
    assigned_incidents = sum(1 for inc in incidents if inc.get("status") == "ASSIGNED")
    in_progress_incidents = sum(1 for inc in incidents if inc.get("status") == "IN PROGRESS")
    repair_completed_incidents = sum(1 for inc in incidents if inc.get("status") == "REPAIR COMPLETED")
    verified_incidents = sum(1 for inc in incidents if inc.get("status") == "VERIFIED")
    closed_incidents = sum(1 for inc in incidents if inc.get("status") == "CLOSED")

    valid_risks = [inc.get("risk_score") for inc in incidents if inc.get("risk_score") is not None]
    average_risk_score = round(sum(valid_risks) / len(valid_risks), 2) if valid_risks else 0.0

    # Status breakdown (all allowed statuses initialized to 0)
    status_breakdown = {s: 0 for s in [
        "REPORTED",
        "AI ANALYZED",
        "PRIORITIZED",
        "ASSIGNED",
        "IN PROGRESS",
        "REPAIR COMPLETED",
        "VERIFIED",
        "CLOSED",
    ]}
    for inc in incidents:
        st = inc.get("status")
        if st:
            status_breakdown[st] = status_breakdown.get(st, 0) + 1

    # Department breakdown
    department_breakdown = {}
    for inc in incidents:
        dept = inc.get("department")
        dept_key = dept.strip() if dept and str(dept).strip() else "Unassigned"
        department_breakdown[dept_key] = department_breakdown.get(dept_key, 0) + 1

    # Issue type breakdown (standardized to title-case)
    issue_type_breakdown = {}
    for inc in incidents:
        raw_issue = inc.get("issue_type")
        if raw_issue and str(raw_issue).strip():
            issue_key = str(raw_issue).strip().title()
        else:
            issue_key = "Unknown"
        issue_type_breakdown[issue_key] = issue_type_breakdown.get(issue_key, 0) + 1

    # Top priority incidents (up to 5 ordered by priority_score descending)
    sorted_incidents = sorted(
        incidents,
        key=lambda inc: inc.get("priority_score") or 0,
        reverse=True
    )
    top_priority_incidents = []
    for inc in sorted_incidents[:5]:
        top_priority_incidents.append({
            "id": inc.get("id"),
            "issue_type": inc.get("issue_type"),
            "severity": inc.get("severity", 0),
            "risk_score": inc.get("risk_score", 0),
            "priority_score": inc.get("priority_score", 0),
            "status": inc.get("status"),
            "department": inc.get("department"),
            "latitude": inc.get("latitude"),
            "longitude": inc.get("longitude"),
        })

    return {
        "total_incidents": total_incidents,
        "open_incidents": open_incidents,
        "critical_incidents": critical_incidents,
        "high_priority_incidents": high_priority_incidents,
        "assigned_incidents": assigned_incidents,
        "in_progress_incidents": in_progress_incidents,
        "repair_completed_incidents": repair_completed_incidents,
        "verified_incidents": verified_incidents,
        "closed_incidents": closed_incidents,
        "average_risk_score": average_risk_score,
        "status_breakdown": status_breakdown,
        "department_breakdown": department_breakdown,
        "issue_type_breakdown": issue_type_breakdown,
        "top_priority_incidents": top_priority_incidents,
    }


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


@app.post("/incidents/{incident_id}/verify-repair")
async def verify_incident_repair(incident_id: int, file: UploadFile = File(...)):
    # 1. Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed types: jpg, jpeg, png, webp"
        )

    # 2. Verify incident exists
    try:
        incident_check = (
            supabase
            .table("incidents")
            .select("*")
            .eq("id", incident_id)
            .execute()
        )
        if not incident_check.data:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
        incident = incident_check.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking incident: {str(e)}")

    # 3. Read uploaded file contents
    file_bytes = await file.read()
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    verification_storage_path = f"incidents/{incident_id}/verification/{unique_filename}"

    # 4. Upload AFTER image to Supabase Storage under verification path
    try:
        supabase.storage.from_("incident-images").upload(
            path=verification_storage_path,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    # 5. Generate public URL for the after-repair image
    after_image_url = supabase.storage.from_("incident-images").get_public_url(verification_storage_path)

    # 6. Verification logic
    temp_path = None
    verified = False
    confidence = None
    message = "After-repair image uploaded successfully, but automatic comparison could not be completed."
    new_status = "REPAIR COMPLETED"

    try:
        # Save after-repair image temporarily
        with tempfile.NamedTemporaryFile(
            suffix=file_ext, delete=False, dir=tempfile.gettempdir()
        ) as tmp:
            tmp.write(file_bytes)
            temp_path = tmp.name

        original_image_url = incident.get("image_url")
        original_img = None

        if original_image_url:
            try:
                resp = httpx.get(original_image_url, timeout=5.0)
                if resp.status_code == 200:
                    original_img = Image.open(BytesIO(resp.content)).convert("RGB")
            except Exception:
                original_img = None

        # If original image is available for comparison
        if original_img is not None:
            # Check structural/pixel similarity to catch duplicate identical uploads
            is_identical = False
            try:
                after_img = Image.open(temp_path).convert("RGB")
                orig_resized = original_img.resize((128, 128))
                after_resized = after_img.resize((128, 128))
                diff = float(np.mean(np.abs(np.array(orig_resized, dtype=np.float32) - np.array(after_resized, dtype=np.float32))))
                if diff < 3.0:  # virtually identical image
                    is_identical = True
            except Exception:
                pass

            # Run hazard analysis on the after-repair image
            ai_result = await asyncio.to_thread(
                analyze_incident,
                image_path=temp_path,
                raise_errors=False,
            )

            after_severity = ai_result.get("severity", 0) if ai_result else 0
            after_issue = ai_result.get("issue_type", "unknown") if ai_result else "unknown"

            if is_identical:
                verified = False
                confidence = 0.95
                message = "Uploaded image is identical to the original incident photo. Repair cannot be verified."
                new_status = "REPAIR COMPLETED"
            elif after_severity <= 3 or after_issue == "unknown":
                verified = True
                confidence = round(max(0.70, min(0.95, 1.0 - (after_severity / 15.0))), 2)
                message = "Repair appears successful based on the available image comparison."
                new_status = "VERIFIED"
            else:
                verified = False
                confidence = round(max(0.30, min(0.60, 1.0 - (after_severity / 10.0))), 2)
                message = f"Repair unverified: post-repair image still exhibits infrastructure defect ({after_issue}, severity {after_severity}/10)."
                new_status = "REPAIR COMPLETED"
        else:
            verified = False
            confidence = None
            message = "After-repair image uploaded successfully, but automatic comparison could not be completed."
            new_status = "REPAIR COMPLETED"

    except Exception as exc:
        verified = False
        confidence = None
        message = f"After-repair image uploaded successfully, but verification analysis encountered an error: {str(exc)}"
        new_status = "REPAIR COMPLETED"

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception:
                pass

    # 7. Update status in Supabase (preserve original image_url)
    try:
        supabase.table("incidents").update(
            {"status": new_status}
        ).eq("id", incident_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update incident status: {str(e)}")

    # 8. Return structured response
    verification_data = {
        "verified": verified,
        "message": message,
    }
    if confidence is not None:
        verification_data["confidence"] = confidence

    return {
        "incident_id": incident_id,
        "verification": verification_data,
        "after_image_url": after_image_url,
        "status": new_status,
    }


@app.post("/incidents/{incident_id}/recalculate-risk")
def recalculate_incident_risk(incident_id: int, request: RiskRecalculateRequest = RiskRecalculateRequest()):
    weather_factor = request.weather_factor if request.weather_factor is not None else 1.0
    traffic_factor = request.traffic_factor if request.traffic_factor is not None else 1.0

    # 1. Validation: 0.5 <= factor <= 2.0
    if not (0.5 <= weather_factor <= 2.0):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid weather_factor: {weather_factor}. Value must be between 0.5 and 2.0."
        )

    if not (0.5 <= traffic_factor <= 2.0):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid traffic_factor: {traffic_factor}. Value must be between 0.5 and 2.0."
        )

    # 2. Verify incident exists
    try:
        incident_check = (
            supabase
            .table("incidents")
            .select("*")
            .eq("id", incident_id)
            .execute()
        )
        if not incident_check.data:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
        incident = incident_check.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking incident: {str(e)}")

    # 3. Recalculate risk and priority
    previous_risk_score = incident.get("risk_score", 0)
    previous_priority_score = incident.get("priority_score", 0)
    severity = incident.get("severity", 0)

    # Determine baseline risk from damage severity using Member 1's risk engine,
    # preventing runaway score inflation upon repeated recalculations.
    if severity > 0:
        base_risk = calculate_risk(severity=severity)["risk_score"]
    else:
        base_risk = previous_risk_score if previous_risk_score > 0 else 50

    context_multiplier = weather_factor * traffic_factor
    new_risk = max(0, min(100, int(round(base_risk * context_multiplier))))

    # Recalculate priority using Member 1's priority engine
    priority_res = calculate_priority(
        risk_score=new_risk,
        severity=severity,
        issue_type=incident.get("issue_type")
    )
    new_priority = priority_res.get("priority_score", 0)
    priority_level = priority_res.get("priority_level", get_priority_level(new_priority))
    risk_level = get_risk_level(new_risk)

    # 4. Update ONLY risk_score and priority_score in Supabase
    try:
        supabase.table("incidents").update({
            "risk_score": new_risk,
            "priority_score": new_priority
        }).eq("id", incident_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update incident risk and priority: {str(e)}")

    # 5. Return structured response
    return {
        "incident_id": incident_id,
        "previous_risk_score": previous_risk_score,
        "new_risk_score": new_risk,
        "previous_priority_score": previous_priority_score,
        "new_priority_score": new_priority,
        "risk_level": risk_level,
        "priority_level": priority_level,
        "factors": {
            "weather_factor": weather_factor,
            "traffic_factor": traffic_factor,
        },
        "message": "Risk and priority recalculated using updated environmental factors.",
    }