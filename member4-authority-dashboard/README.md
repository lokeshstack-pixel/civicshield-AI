# CIVICSHIELD AI — Member 4: GIS + Municipal Authority Command Dashboard 🗺️

AI-Powered Predictive Urban Infrastructure Risk & Response Platform  
**Owner:** Member 4 (GIS + Authority Dashboard)

---

## 🌟 What Was Built

This is the central command center for municipal engineers and authorities to triage, visualize, and resolve city infrastructure risks.

1. **🗺️ Interactive GIS Map (`GISMap.jsx`)**
   - Built with **Leaflet** & **OpenStreetMap** with custom theme toggle (Command Dark & Satellite/Streets).
   - High-visibility animated pulse markers color-coded by urgency:
     - 🔴 **Critical** ($\text{Priority} \ge 85$)
     - 🟠 **High** ($70 - 84$)
     - 🟡 **Medium** ($40 - 69$)
     - 🟢 **Low** ($< 40$)
   - Interactive popups with incident thumbnail, severity meter, risk scores, department routing, and one-click "Inspect" trigger.
   - Map tools: "Focus Critical", "Center All", and visual priority scale legend.

2. **⚡ Priority Dispatch Queue (`DispatchQueue.jsx`)**
   - Automatically ranked by `priority_score` (Descending).
   - Columns: Incident ID, Issue & Location, Severity ($/10$), Risk Score ($/100$), Priority Level, Routed Department, Status, and Action.
   - Critical incidents highlighted with pulsing alerts.

3. **📊 Executive Stat Cards (`StatsCards.jsx`)**
   - **Total Incidents**
   - **Critical Dispatch** (Interactive filter trigger)
   - **High Risk Potential** (Interactive filter trigger)
   - **Pending Dispatch** (Interactive filter trigger)
   - **Verified / Resolved**
   - **Average City Risk Index** (Live progress meter $/100$)

4. **🔍 Deep-Dive Incident Dossier & Repair Verification (`IncidentModal.jsx`)**
   - Complete workflow progression stepper (`REPORTED` $\to$ `AI ANALYZED` $\to$ `PRIORITIZED` $\to$ `ASSIGNED` $\to$ `IN PROGRESS` $\to$ `VERIFIED` $\to$ `CLOSED`).
   - **AI Explainability ("WHY THIS MATTERS")**: Breaks down damage diagnosis, traffic exposure, dynamic weather hazards, and justification.
   - Recommended Municipal SLA (e.g. "Immediate $< 4\text{ Hours}$").
   - **Municipal Crew Assignment**: Select crew and dispatch.
   - **Before / After Computer Vision Repair Verification**: Uploads repair photo and simulates AI contour verification to mark incident `VERIFIED`.

5. **📈 Municipal Analytics & SDG Alignment (`AnalyticsView.jsx`)**
   - Key KPIs: Resolution Efficiency, City Risk Index, AI Triaging Accuracy, Citizen Dispatch SLA.
   - Bar breakdowns: Incidents by Issue Type, Department Workload Routing, Structural Severity Spectrum.
   - **UN SDG Alignment Cards**: SDG 9 (Resilient Infrastructure), SDG 11 (Sustainable Cities), SDG 13 (Climate Action).
   - **B2G SaaS Model**: Market viability and municipal subscription architecture.

6. **🔌 Seamless Hybrid Backend / Offline Architecture (`src/services/api.js`)**
   - Connects to FastAPI backend (`http://localhost:8000/incidents`) if active.
   - Auto-falls back to pre-seeded realistic urban municipal dataset (potholes, flood underpass, stormwater drain blockage, live wire light pole) with coordinates and images.

---

## 🚀 How to Run

### Step 1: Install & Start Dev Server
In PowerShell:
```powershell
cd D:\CIVICSHIELD-AI\member4-authority-dashboard
npm run dev
```

The dashboard will be live at:
👉 **`http://localhost:5173`**

### Step 2: Build for Production
```powershell
npm run build
```

---

## 🏆 3-Minute Hackathon Demo Script for Member 4

1. **Open the Dashboard (`http://localhost:5173`)**:
   - Point out the dark municipal command aesthetic, live digital clock, and top 6 Executive KPI cards.
2. **Show the GIS Map**:
   - Point to the red pulsing marker on the GIS map.
   - Click **"Focus Critical"** or click on **CS-1042** marker to reveal the popup with severity $8/10$, risk $87$, priority $93$.
3. **Show the Priority Dispatch Queue**:
   - Explain that complaints are not queued first-come-first-served, but **automatically ranked by AI Priority Score descending**.
4. **Open the Incident Dossier**:
   - Click **"Inspect &rarr;"** on `CS-1042`.
   - Show the **"WHY THIS MATTERS"** risk explainability section (heavy traffic corridor + rain forecast = high escalation).
5. **Simulate Dispatch & Repair Verification (The Winning Differentiator!)**:
   - Assign the incident to "Asphalt Patch Team Alpha".
   - Switch to the **"Before/After Repair Verification"** tab.
   - Click **"Simulate Crew Photo Upload"** $\to$ Click **"Run AI Repair Verification"**.
   - Show how the AI confirms the repair and transitions the status to **`VERIFIED`**!
6. **Switch to Analytics & SDGs**:
   - Click the **"Analytics & SDGs"** tab on top to showcase United Nations SDG 9, 11, and 13 alignment and the municipal B2G SaaS potential to the judges.

---

## 🔗 Integration with Teammates

- **Member 2 (FastAPI Backend)**: Member 2 can run `uvicorn main:app --reload --port 8000`. The dashboard will automatically fetch from `GET http://localhost:8000/incidents` and send status updates to `PATCH /incidents/:id/status`.
- **Member 3 (Citizen UI)**: When a citizen submits a complaint via Member 3's form to the backend, it will appear directly at the top of this Authority Dashboard!
