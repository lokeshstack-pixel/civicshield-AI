# CIVICSHIELD AI — Backend API Integration Guide

This document is the official API integration guide for **Member 3 (Citizen React UI)** and **Member 4 (Authority Dashboard + GIS + Analytics)** to connect frontend components with the CIVICSHIELD AI FastAPI backend.

---

## 1. Backend Overview

CIVICSHIELD AI provides an end-to-end intelligent pipeline connecting citizens, automated computer-vision analysis, risk assessment, and municipal response workflows:

```
[Citizen UI]
     │
     ▼ (Complaint Submission + Image)
[FastAPI Backend] ───► [Member 1 AI Pipeline]
     │                       │ (Damage severity, multi-factor risk,
     │                       │  dispatch priority & department routing)
     ▼                       ▼
[Supabase PostgreSQL & Storage]
     ▲
     │ (Analytics, GIS Map & Workflow Operations)
[Authority Dashboard]
```

* **Citizen UI**: Citizens report civic infrastructure defects (potholes, flooding, garbage, broken streetlights) with location and photos.
* **FastAPI Backend**: Serves as the central API gateway handling data validation, storage uploads, business rules, and duplicate detection.
* **AI Pipeline**: Automatically classifies defect type, evaluates physical severity (0–10), computes public risk (0–100), derives dispatch priority (0–100), and suggests department routing.
* **Supabase**: Cloud PostgreSQL database for incident rows and Supabase Storage for complaint and repair verification images.
* **Authority Dashboard**: Operational control center displaying GIS incident maps, priority queues, department assignment, dynamic risk recalculation, and repair verification.

---

## 2. Base URL & Environment Configuration

During local development, the FastAPI server runs at:

```
http://127.0.0.1:8000
```

### Frontend Environment Setup

Define the base URL in your frontend `.env` (or `.env.local`) file:

```env
VITE_API_URL=http://127.0.0.1:8000
```

> **Important**: Never hardcode `http://127.0.0.1:8000` inside your React components or Axios/Fetch calls. Always use `import.meta.env.VITE_API_URL` (or your framework's equivalent) so production URLs can be swapped seamlessly.

---

## 3. Complete API Reference

| Method | Endpoint | Purpose | Request Body | Response | Used By |
|---|---|---|---|---|---|
| `GET` | `/` | API status probe | None | Service message | Health monitoring |
| `GET` | `/health` | Health check probe | None | `{"status": "healthy"}` | Health monitoring |
| `GET` | `/supabase-test` | Verify Supabase connectivity | None | Connection status & sample row | Debugging |
| `POST` | `/incidents` | Create new citizen complaint | JSON (`IncidentCreate`) | Created incident record | Citizen UI |
| `POST` | `/incidents/{id}/image` | Upload complaint photo & run AI analysis | `multipart/form-data` (`file`) | Upload confirmation + AI analysis result | Citizen UI |
| `GET` | `/incidents` | Retrieve all incidents (supports filtering) | Query params (`status`, `department`, `issue_type`) | Array of incident objects (sorted by `created_at` desc) | Citizen UI, Authority Dashboard, GIS Map |
| `GET` | `/incidents/{id}` | Get single incident by ID | None | Single incident object | Citizen UI, Authority Dashboard |
| `PATCH` | `/incidents/{id}/status` | Update incident lifecycle status | JSON (`{"status": "..."}`) | Updated incident object | Authority Dashboard |
| `GET` | `/incidents/{id}/duplicates` | Find nearby duplicate complaints | None | Duplicate list with distance & reason | Authority Dashboard |
| `PATCH` | `/incidents/{id}/assign` | Assign incident to department (sets status `ASSIGNED`) | JSON (`{"department": "..."}`) | Updated incident object | Authority Dashboard |
| `POST` | `/incidents/{id}/verify-repair` | Upload after-repair image & verify fix | `multipart/form-data` (`file`) | Verification result + after image URL + updated status | Authority Dashboard / Crew Mobile |
| `POST` | `/incidents/{id}/recalculate-risk` | Dynamically recalculate risk/priority under changing weather & traffic | JSON (`weather_factor`, `traffic_factor`) | Updated scores, levels & comparison | Authority Dashboard |
| `GET` | `/dashboard/summary` | City-wide metrics, counters, breakdowns & top priority queue | None | Comprehensive dashboard summary object | Authority Dashboard |

---

## 4. Citizen Application Flow

```
Citizen opens app & fills report form (issue type, description, GPS lat/long)
  │
  ▼
POST /incidents
  │
  ▼
Backend creates incident with status = "REPORTED" and returns incident `id`
  │
  ▼
POST /incidents/{id}/image (Upload citizen's photo)
  │
  ▼
Backend uploads photo to Supabase Storage → Runs AI Pipeline
  │ (Extracts visual damage → Calculates Severity → Computes Risk → Derives Priority → Suggests Department)
  │ Updates incident in database
  ▼
GET /incidents/{id}
  │
  ▼
Citizen views submitted complaint with AI-confirmed details, risk tier & tracking ID
```

---

## 5. Authority Dashboard Flow

```
Authority loads dashboard
  │
  ▼
GET /dashboard/summary  AND  GET /incidents
  │
  ▼
Display metric cards (Total, Open, Critical, High Priority, Avg Risk)
Display status, department, and issue-type breakdown charts
Plot incidents on interactive GIS Map
Show Top Priority Queue
  │
  ▼
Authority clicks on an urgent incident (opens Incident Detail View)
  │
  ├───► GET /incidents/{id}/duplicates (Identify and review nearby citizen reports)
  │
  ├───► PATCH /incidents/{id}/assign (Assign to responsible department → Status: "ASSIGNED")
  │
  ├───► PATCH /incidents/{id}/status (Update status to "IN PROGRESS")
  │
  ├───► POST /incidents/{id}/recalculate-risk (Simulate monsoon / high-traffic event → scores update live)
  │
  ├───► POST /incidents/{id}/verify-repair (Crew uploads after-repair image → status: "VERIFIED")
  │
  └───► PATCH /incidents/{id}/status (Final signoff → Status: "CLOSED")
```

---

## 6. Example Requests & Copy-Paste JSON

### 1. Create Incident
`POST /incidents`

```json
{
  "issue_type": "pothole",
  "description": "Large road crater near bus stop posing accident hazard to two-wheelers",
  "latitude": 12.9716,
  "longitude": 79.1592
}
```

### 2. Assign Incident to Department
`PATCH /incidents/3/assign`

```json
{
  "department": "Roads & Infrastructure"
}
```
*(Automatically updates `department` and transitions `status` to `"ASSIGNED"`)*

### 3. Update Status
`PATCH /incidents/3/status`

```json
{
  "status": "IN PROGRESS"
}
```

### 4. Recalculate Risk (Weather & Traffic Changes)
`POST /incidents/3/recalculate-risk`

```json
{
  "weather_factor": 1.4,
  "traffic_factor": 1.2
}
```
*(Values between `0.5` and `2.0`. Normal baseline is `1.0`)*

---

## 7. Image Upload Instructions

Both the complaint image upload and repair verification endpoints accept `multipart/form-data`.

### Form Field Specifications
* **Form key**: `file`
* **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
* **Size recommendation**: Up to 10MB

### JavaScript (Fetch / Axios) Example

```javascript
const formData = new FormData();
formData.append('file', imageFile); // imageFile from <input type="file">

// 1. Complaint Image Upload:
const response = await fetch(`${VITE_API_URL}/incidents/${incidentId}/image`, {
  method: 'POST',
  body: formData,
});
const data = await response.json();
console.log('Public image URL:', data.image_url);
console.log('AI Analysis:', data.ai_analysis);

// 2. After-Repair Verification Upload:
const verifyResponse = await fetch(`${VITE_API_URL}/incidents/${incidentId}/verify-repair`, {
  method: 'POST',
  body: formData,
});
const verifyData = await verifyResponse.json();
console.log('Verified:', verifyData.verification.verified);
console.log('After Image URL:', verifyData.after_image_url);
```

> **Important**:
> * Complaint images are stored in `incidents/{id}/{uuid}.ext`.
> * Verification images are stored in `incidents/{id}/verification/{uuid}.ext`.
> * The verification upload **never overwrites** the original complaint photo. The original image remains available via `image_url`.

---

## 8. Incident Object Schema

When querying `GET /incidents` or `GET /incidents/{id}`, the backend returns records with this structure:

```json
{
  "id": 3,
  "created_at": "2026-09-05T17:03:16.326493+00:00",
  "issue_type": "flooding",
  "description": "Severe standing water pooling over roadway",
  "latitude": 12.9716,
  "longitude": 79.1592,
  "severity": 7,
  "risk_score": 51,
  "priority_score": 58,
  "status": "ASSIGNED",
  "image_url": "https://qpowiaykkxgyqwuugnzg.supabase.co/storage/v1/object/public/incident-images/incidents/3/5c227503-3ea0-4172-8b2f-fcda40f04627.jpg",
  "department": "Drainage / Disaster Management"
}
```

---

## 9. Understanding Severity, Risk & Priority

All metric scores are deterministic and bounded:

| Metric | Range | Defined By | Meaning |
|---|---|---|---|
| `severity` | `0 – 10` | Computer Vision AI | Physical magnitude of structural damage (e.g. crater depth, water depth, debris volume). |
| `risk_score` | `0 – 100` | Risk Engine | Public safety hazard exposure combining damage severity, vehicular traffic, pedestrian density, and weather risk. |
| `priority_score` | `0 – 100` | Priority Engine | Operational dispatch urgency combining risk score (65%) and physical severity (35%) with acute hazard overrides. |

### Classification Tiers

#### Risk Levels
* `0 – 39`: **LOW** (Routine monitoring)
* `40 – 69`: **MODERATE** (Standard municipal schedule)
* `70 – 84`: **HIGH** (Priority inspection within 24 hours)
* `85 – 100`: **CRITICAL** (Emergency public safety dispatch)

#### Priority Levels
* `0 – 39`: **LOW** (Routine queue)
* `40 – 59`: **MEDIUM** (Scheduled 3–5 day maintenance)
* `60 – 79`: **HIGH** (24-hour crew deployment)
* `>= 80`: **CRITICAL** (Immediate 2–4 hour emergency resolution)

---

## 10. Incident Lifecycle Status Workflow

```
[REPORTED]
    │
    ▼ (Complaint image uploaded & AI analysis runs)
[AI ANALYZED]
    │
    ▼ (Risk & Priority evaluated)
[PRIORITIZED]
    │
    ▼ (Dispatched to municipal department via PATCH /assign)
[ASSIGNED]
    │
    ▼ (Work crew deployed via PATCH /status)
[IN PROGRESS]
    │
    ▼ (Physical work finished)
[REPAIR COMPLETED]
    │
    ▼ (After-repair image verified via POST /verify-repair)
[VERIFIED]
    │
    ▼ (Final administrative signoff via PATCH /status)
[CLOSED]
```

### Supported Status Strings (Exact Enum)
* `REPORTED`
* `AI ANALYZED`
* `PRIORITIZED`
* `ASSIGNED`
* `IN PROGRESS`
* `REPAIR COMPLETED`
* `VERIFIED`
* `CLOSED`

---

## 11. Frontend Error Handling Guidelines

All error responses from FastAPI conform to the standard structure:

```json
{
  "detail": "Error description message"
}
```

| HTTP Status | Cause | Recommended Frontend Handling |
|---|---|---|
| `400 Bad Request` | Invalid contextual factor, empty department string, or unsupported image format. | Display toast or form field alert: `detail` message directly informs user what parameter was invalid. |
| `404 Not Found` | Requested incident ID does not exist. | Display a "Record not found" empty state or redirect back to incident directory. |
| `422 Unprocessable` | Missing mandatory JSON fields or wrong data types. | Validate form inputs on client side before submission. |
| `500 Server Error` | Database query failure or storage connectivity issue. | Display a generic user-friendly banner: *"Service temporarily unavailable. Please retry in a few moments."* |

---

## 12. Frontend Integration Rules

1. **Never Call Supabase Directly**: All reads and writes must pass through the FastAPI backend (`VITE_API_URL`). Never import the Supabase JavaScript client into frontend code for incident mutations.
2. **Never Expose Secret Keys**: The frontend does not need and must never possess `SUPABASE_KEY` (especially service role secret keys).
3. **Handle Null Values Defensively**:
   * `image_url` is `null` until an image is uploaded. Render a clean placeholder image/icon.
   * `department` is `null` until assigned or AI-routed. Display `"Unassigned"`.
   * `severity`, `risk_score`, and `priority_score` default to `0` initially until AI analysis completes.
4. **Always Refresh on Mutation**: After executing `PATCH /assign`, `PATCH /status`, `POST /recalculate-risk`, or `POST /verify-repair`, re-fetch or optimistically update your local component state with the response returned by the backend.
5. **GIS Coordinates**: `latitude` and `longitude` are standard WGS-84 floats (e.g. `12.9716`, `79.1592`). Suitable for Leaflet, Mapbox, or Google Maps.

---

## 13. Team Ownership & Architecture Roles

* **Member 1 (AI + Risk Intelligence)**: Computer vision model, severity engine, multi-factor risk engine, operational priority calculator, and department routing.
* **Member 2 (Backend + Database + Storage + Integration)**: FastAPI endpoints, Supabase PostgreSQL queries, Supabase Storage management, dynamic risk recalculation API, duplicate detection, and repair verification.
* **Member 3 (Citizen UI)**: Citizen-facing mobile-first React web application, incident reporting form, geolocation capture, image upload, and complaint status tracker.
* **Member 4 (Authority Dashboard + GIS + Analytics)**: Municipal administration portal, GIS hazard map, dispatch priority queue, department assignment interface, and repair verification dashboard.

---

## 14. Demo Walkthrough Scenario (For Presentation & Judging)

To demonstrate the full CIVICSHIELD AI platform flow to judges:

1. **Citizen Reports Pothole**: Citizen uses Member 3's UI to submit a complaint at `POST /incidents` (`latitude: 12.9716, longitude: 79.1592`).
2. **AI Image Analysis**: Citizen uploads photo to `POST /incidents/{id}/image`. AI detects `pothole`, sets `severity = 7`, computes `risk_score = 51`, sets `priority_score = 58`, routes to `"Roads & Infrastructure"`.
3. **Authority Reviews Dashboard**: Member 4's dashboard displays the incident in the GIS view and top priority queue via `GET /dashboard/summary`.
4. **Duplicate Detection**: Authority opens duplicate tab (`GET /incidents/{id}/duplicates`), viewing nearby reports within 100 meters to prevent duplicate crew dispatches.
5. **Department Assignment**: Authority clicks Assign (`PATCH /incidents/{id}/assign`), setting department to `"Roads & Infrastructure"` and status to `"ASSIGNED"`.
6. **Dynamic Environmental Recalculation**: Authority simulates monsoon rain & heavy traffic conditions (`POST /incidents/{id}/recalculate-risk` with `weather_factor: 1.4, traffic_factor: 1.2`). The dashboard immediately updates:
   * **Risk**: `51 (MODERATE) → 86 (CRITICAL)`
   * **Priority**: `58 (MEDIUM) → 85 (CRITICAL)`
7. **Crew Completes Repair & Submits Verification**: Work crew uploads post-repair photo via `POST /incidents/{id}/verify-repair`. Automatic visual comparison confirms defect resolution (`verified: true, confidence: 0.87`) and incident moves to `"VERIFIED"`.
8. **Resolution & Signoff**: Authority closes the incident (`PATCH /incidents/{id}/status` with `status: "CLOSED"`). Dashboard metrics reflect updated city resolution counts.

