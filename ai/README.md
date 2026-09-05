# CIVICSHIELD AI — Member 1: AI & Risk Intelligence

## 1. Overview (Member 1 Responsibilities)
As **Member 1 (AI + Risk Intelligence)**, this module is the complete analytical brain of **CIVICSHIELD AI**. It takes raw civic incident images submitted by citizens along with contextual metadata (traffic, pedestrian density, weather, location sensitivity), extracts real visual damage indicators, computes hazard severity, calculates municipal public risk, derives dispatch priority, and routes the complaint to the appropriate government department.

```
Citizen Uploads Image & Metadata
               │
               ▼
   [ 1. Image Analysis ]  --> Detects issue type (pothole, flooding, garbage, etc.) & confidence
               │
               ▼
   [ 2. Severity Engine ] --> Calculates physical damage magnitude (0-10)
               │
               ▼
   [ 3. Risk Engine ]     --> Fuses severity with traffic, pedestrians, weather & infrastructure (0-100)
               │
               ▼
   [ 4. Priority Engine ] --> Derives operational dispatch tier (CRITICAL, HIGH, MEDIUM, LOW)
               │
               ▼
   [ 5. Routing Engine ]  --> Routes to responsible municipal department
               │
               ▼
   Clean JSON-Serializable Output for Member 2 (FastAPI / Supabase)
```

---

## 2. Folder Structure
```
CIVICSHIELD/
├── .venv/                      # Python 3.14.3 virtual environment
├── sample_images/              # Test fixtures and real civic complaint photos
│   ├── README.md               # Instructions for adding sample images
│   ├── generate_test_fixtures.py # Automated test image generator
│   ├── sample_pothole.png
│   ├── sample_flooding.png
│   ├── sample_garbage.png
│   ├── sample_streetlight.png
│   ├── sample_road_damage.png
│   └── sample_drainage.png
└── ai/
    ├── __init__.py             # Top-level exports and lazy loaders
    ├── image_analysis.py       # Visual analysis entry point
    ├── severity.py             # Physical severity calculation engine (0-10)
    ├── risk.py                 # Multi-factor risk calculation engine (0-100)
    ├── priority.py             # Dispatch priority engine (0-100 & tiers)
    ├── routing.py              # Department routing logic
    ├── pipeline.py             # Master pipeline & CLI interface
    ├── requirements.txt        # Verified Python 3.14 dependencies
    ├── README.md               # Technical documentation
    │
    ├── model/                  # Model Adapter Subsystem
    │   ├── __init__.py
    │   ├── base.py             # BaseVisionModel ABC & VisionPrediction dataclass
    │   ├── feature_model.py    # Local empirical vision model (PIL + NumPy)
    │   └── factory.py          # Adapter factory (pluggable backend loader)
    │
    └── tests/                  # Pytest automated test suite
        ├── __init__.py
        ├── test_image_analysis.py
        ├── test_severity.py
        ├── test_risk.py
        ├── test_priority.py
        ├── test_routing.py
        └── test_pipeline.py
```

---

## 3. Installation & Environment Setup
The project runs on **Python 3.14.3** with lightweight, verified dependencies:

```powershell
# Activate the existing virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Install required dependencies
pip install -r ai/requirements.txt
```

### Dependencies:
- `pillow>=10.0.0`: Fast, robust image I/O, format verification, and spatial resizing.
- `numpy>=1.26.0`: Numerical array processing, edge gradient computation, luminance extraction, and color space statistics.
- `pytest>=8.0.0`: Automated unit and integration testing.

---

## 4. How the AI Model Works (Adapter Architecture)
The module utilizes a **Model Adapter Architecture**:
- `BaseVisionModel`: Defines an abstract interface (`predict(image_path) -> VisionPrediction`).
- `FeatureVisionModel` (Default): Operates completely offline without requiring gigabytes of deep learning weights. It performs empirical pixel-level feature extraction on the actual image:
  - **Luminance & Contrast**: ITU-R BT.601 luminance channel to detect darkness distributions and standard deviation.
  - **Asphalt Depression Index**: Detects localized dark cavities and craters bounded by pavement textures (distinguishing potholes from uniform shadows).
  - **Water Reflectance & Blue Hue Index**: Measures specular highlights and blue-to-yellow chromatic ratios characteristic of standing water / flooding.
  - **Color Entropy & Saturation Variance**: Measures multi-spectral clutter and chaotic edge distributions characteristic of garbage dumps.
  - **Luminaire Contrast & Night Profile**: Identifies nighttime scenes and isolated high-contrast illumination fixtures for streetlights.
  - **Unknown / Non-Civic Safe Fallback**: If an image is blank, corrupted, or does not match civic hazard profiles, it returns `issue_type: "unknown"` with low confidence ($< 0.40$), preventing false alarms.
- **Pluggability**: If a fine-tuned YOLO or cloud vision API (e.g. Gemini Vision API) is introduced, it can be plugged into `ai/model/` as a new adapter without altering the pipeline or backend.

---

## 5. How Severity Works (`ai/severity.py`)
Severity represents the **intrinsic physical magnitude** of the infrastructure defect on a scale from **0 to 10**:

- `1 – 3`: **LOW** (Minor wear, superficial debris, single flickering lamp)
- `4 – 6`: **MODERATE** (Standard pothole, blocked drain inlet, moderate cracks)
- `7 – 8`: **HIGH** (Deep crater, extensive flooding, open manhole)
- `9 – 10`: **CRITICAL** (Severe bridge/road structural collapse, major highway submersion)

### Severity Baseline & Modifiers:
$$\text{Raw Severity} = \text{Base}_{\text{category}} + \sum \text{Modifiers}_{\text{visual}} + \text{Modifier}_{\text{confidence}}$$
$$\text{Severity} = \text{clamp}(\text{round}(\text{Raw Severity}), 0, 10)$$

- **Base Baselines**: Flooding ($7$), Pothole ($5$), Drainage ($5$), Road Damage ($4$), Streetlight ($4$), Garbage ($3$), Unknown ($2$).
- **Visual Modifiers**:
  - Pothole with deep cavity ($>45\%$ depression index): $+2$
  - Flooding with extensive standing water sheets: $+2$
  - Garbage with high color entropy ($>105$): $+2$
  - Nighttime streetlight hazard: $+2$
  - High confidence visual confirmation ($\ge 0.90$): $+1$
  - Low confidence prediction ($< 0.40$): $-1$ (dampening)

---

## 6. How Risk Works (`ai/risk.py`)
Risk measures **public safety exposure** and hazard potential on a scale from **0 to 100**:

- `0 – 39`: **LOW**
- `40 – 69`: **MODERATE**
- `70 – 84`: **HIGH**
- `85 – 100`: **CRITICAL**

### Mathematical Risk Formula:
$$\text{Base Risk} = 0.35 \cdot (\text{Severity} \times 10) + 0.25 \cdot (\text{Traffic} \times 10) + 0.25 \cdot (\text{Pedestrian} \times 10) + 0.15 \cdot (\text{Weather} \times 10)$$
$$\text{Risk Score} = \text{clamp}\left(\text{round}\left(\text{Base Risk} \times M_{\text{infra}} \times M_{\text{loc}}\right), 0, 100\right)$$

### Context Multipliers:
- **Infrastructure Multipliers ($M_{\text{infra}}$)**:
  - `bridge` / `flyover`: $1.30$
  - `highway` / `expressway`: $1.25$
  - `arterial` / `main_road`: $1.15$
  - `local_road` / `street`: $1.00$
  - `service_road` / `alley`: $0.85$
- **Location Sensitivity Multipliers ($M_{\text{loc}}$)**:
  - `school_zone` / `hospital`: $1.25$
  - `transit_hub` / `commercial`: $1.15$
  - `residential` / `normal`: $1.00$
  - `industrial` / `rural`: $0.85$

---

## 7. How Priority Works (`ai/priority.py`)
Priority determines **operational municipal response urgency** on a scale from **0 to 100** and maps to actionable dispatch tiers:

- $\ge 80$: **CRITICAL** (Emergency dispatch within 2–4 hours)
- $60 – 79$: **HIGH** (Inspection and repair deployment within 24 hours)
- $40 – 59$: **MEDIUM** (Standard maintenance queue within 3–5 days)
- $0 – 39$: **LOW** (Routine scheduled maintenance cycle)

### Operational Priority Formula:
$$\text{Base Priority} = 0.65 \cdot \text{Risk Score} + 0.35 \cdot (\text{Severity} \times 10)$$

- **Acute Hazard Overrides**:
  - If $\text{Severity} \ge 9$ and $\text{Risk Score} \ge 70$: $+8$ boost (acute physical defect in active public area).
  - If $\text{Risk Score} \ge 85$: $+5$ boost (urgent environmental danger).
$$\text{Priority Score} = \text{clamp}(\text{round}(\text{Base Priority} + \text{Boost}), 0, 100)$$

---

## 8. Department Routing (`ai/routing.py`)
Incidents are routed to canonical municipal authorities based on normalized category mappings:

| Issue Category | Routed Department |
| :--- | :--- |
| **Pothole** / Pavement / Asphalt | `Roads & Infrastructure` |
| **Road Damage** / Cracking | `Roads & Infrastructure` |
| **Flooding** / Waterlogging | `Drainage / Disaster Management` |
| **Drainage** / Storm Drain / Culvert / Sewer | `Public Works` |
| **Streetlight** / Lamp / Traffic Light | `Electrical` |
| **Garbage** / Trash / Refuse / Dump | `Sanitation` |
| **Unknown** / Unmapped | `General Civic Services` (Manual Triage) |

Routing is case-insensitive, ignores surrounding whitespace, handles hyphens/underscores, and falls back gracefully to `General Civic Services` without crashing.

---

## 9. Running Tests
Run the automated pytest test suite using the activated `.venv`:

```powershell
# Run all 37 unit and integration tests
.venv\Scripts\pytest.exe ai/tests -v
```

All tests execute in $< 0.5$ seconds and validate:
- Image loading, format verification, and corruption detection.
- Individual civic category detections (pothole, flooding, garbage, streetlight).
- Safe fallback for blank and unknown images.
- Exact boundary conditions for severity, risk, and priority.
- Robust department routing.
- Complete end-to-end pipeline execution and JSON-serializability.

---

## 10. Member 2 Integration Guide (FastAPI / Supabase)
Member 2 can import and run the entire intelligence suite with **one clean function call**:

### Example Integration Code:
```python
from ai.pipeline import analyze_incident

# Call the pipeline from FastAPI endpoint
result = analyze_incident(
    image_path=uploaded_image_file_path,
    traffic_exposure=complaint.traffic_level,      # int (0-10) or str ('low', 'high')
    pedestrian_exposure=complaint.pedestrian_level, # int (0-10) or str ('medium')
    weather_risk=complaint.weather_level,          # int (0-10) or str ('clear', 'rain')
    infrastructure_type=complaint.road_type,       # 'highway', 'arterial', 'local_road', etc.
    location_sensitivity=complaint.zone_type,      # 'school_zone', 'hospital', 'commercial', etc.
    raise_errors=False                             # Safe mode (returns error dict instead of raising)
)

# result is 100% JSON-serializable and ready for Supabase storage
print(result["issue_type"])       # "pothole"
print(result["severity"])         # 7
print(result["risk_score"])       # 87
print(result["priority_score"])   # 93
print(result["priority_level"])   # "CRITICAL"
print(result["department"])       # "Roads & Infrastructure"
```

### JSON Output Schema:
```json
{
  "status": "success",
  "issue_type": "pothole",
  "confidence": 0.88,
  "damage_description": "Depressed cavity and localized road crater detected",
  "severity": 7,
  "severity_level": "HIGH",
  "risk_score": 87,
  "risk_level": "CRITICAL",
  "priority_score": 93,
  "priority_level": "CRITICAL",
  "department": "Roads & Infrastructure",
  "risk_reason": "Elevated risk driven by high structural severity, heavy vehicular traffic, sensitive zone (school_zone).",
  "priority_reason": "Urgent critical hazard for pothole: extreme public safety risk (87/100) and severe physical defect (7/10) require emergency response within 2-4 hours.",
  "routing_notes": "Direct dispatch to Roads & Infrastructure based on 'pothole'.",
  "severity_factors": [
    "Base pothole baseline hazard: 5/10",
    "+2: Deep crater cavity observed (>45% depression index)"
  ],
  "risk_breakdown": {
    "severity_contrib": 24.5,
    "traffic_contrib": 20.0,
    "pedestrian_contrib": 15.0,
    "weather_contrib": 4.5,
    "infrastructure_multiplier": 1.15,
    "location_multiplier": 1.25,
    "base_risk": 64.0
  }
}
```

---

## 11. Command Line Interface (CLI)
You can evaluate any image directly from the command line:

```powershell
# Basic execution
.venv\Scripts\python.exe -m ai.pipeline sample_images/sample_pothole.png

# Execution with custom environmental parameters
.venv\Scripts\python.exe -m ai.pipeline sample_images/sample_pothole.png --traffic 8 --pedestrian 7 --weather 3 --infra arterial --loc school_zone
```

---

## 12. Known Limitations & Future Improvements
### Limitations:
- **Heuristic Pixel Analysis**: The default vision model relies on empirical visual characteristics (luminance, contrast, edge energy, color distributions, depression indices). While reliable, fast, and offline, complex overlapping scenarios (e.g. a small pothole filled with rainwater next to garbage) benefit from deep learning object detection.
- **Contextual Input Dependency**: If traffic/pedestrian densities are omitted, default baseline values ($5/10$) are used.

### Future Improvements for Post-Hackathon / 2.0:
1. **Fine-Tuned YOLOv8 / YOLOv11 Adapter**: Drop in a PyTorch/ONNX YOLO model trained on municipal dataset (e.g., RDD2022 - Road Damage Dataset) via `BaseVisionModel`.
2. **Cloud Multimodal Vision Adapter**: Connect Google Gemini 1.5 Pro / Flash Vision API via API key to provide natural language damage explanations and multi-defect segmentation.
3. **Automated Weather API**: Automatically fetch live rainfall and storm alerts from OpenWeatherMap using GPS coordinates.
