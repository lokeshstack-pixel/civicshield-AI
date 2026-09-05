// CIVICSHIELD AI - Municipal Data & API Service
// Connects to FastAPI (http://localhost:8000) with automatic fallback to high-fidelity seed data

const API_BASE_URL = 'http://localhost:8000';

// High-fidelity initial seed data covering all required hackathon demo scenarios
export const INITIAL_INCIDENTS = [
  {
    id: "CS-1042",
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    issue_type: "Road Pothole",
    description: "Deep pothole across right lane causing vehicles to swerve into oncoming traffic.",
    latitude: 13.0827,
    longitude: 80.2707,
    location_name: "Anna Salai, Near Mount Road Junction",
    severity: 8,
    risk_score: 87,
    priority_score: 93,
    priority_level: "CRITICAL",
    department: "Roads & Infrastructure",
    status: "REPORTED",
    image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    ai_confidence: 0.94,
    weather_risk: "High - Rain Forecast in 2h",
    risk_reason: "High physical road depression + Heavy vehicle traffic corridor + Rain forecast increases accident escalation.",
    priority_reason: "Critical safety hazard; high probability of two-wheeler crashes and severe traffic disruption.",
    traffic_exposure: "Heavy Transit (3,400 vehicles/hr)",
    pedestrian_exposure: "High (Near Bus Terminal)",
    assigned_team: null,
    repair_image_url: null,
    repair_verified: false,
    estimated_response_time: "Immediate (< 4 Hours)"
  },
  {
    id: "CS-1047",
    created_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    issue_type: "Stormwater Drainage Block",
    description: "Main culvert completely obstructed with urban debris and plastic waste; water beginning to pool.",
    latitude: 13.0878,
    longitude: 80.2785,
    location_name: "Poonamallee High Rd, Kilpauk Sector",
    severity: 9,
    risk_score: 91,
    priority_score: 96,
    priority_level: "CRITICAL",
    department: "Drainage / Public Works",
    status: "ASSIGNED",
    image_url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
    ai_confidence: 0.96,
    weather_risk: "Severe - Flood Watch Active",
    risk_reason: "Total drain blockage + Low-lying elevation + High precipitation advisory.",
    priority_reason: "Rapid inundation hazard for adjacent hospital access road and commercial buildings.",
    traffic_exposure: "Medium Transit",
    pedestrian_exposure: "Very High (Hospital Zone)",
    assigned_team: "Drainage Rapid Response Alpha",
    repair_image_url: null,
    repair_verified: false,
    estimated_response_time: "Immediate (< 2 Hours)"
  },
  {
    id: "CS-1051",
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    issue_type: "Damaged Streetlight & Exposed Cable",
    description: "Light pole tilted at 30 degrees with damaged base cover exposing live wiring after vehicle collision.",
    latitude: 13.0732,
    longitude: 80.2609,
    location_name: "Dr. Radhakrishnan Salai, Sector 4",
    severity: 7,
    risk_score: 79,
    priority_score: 84,
    priority_level: "HIGH",
    department: "Electrical / Utilities",
    status: "IN PROGRESS",
    image_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    ai_confidence: 0.91,
    weather_risk: "Moderate - Damp Conditions",
    risk_reason: "Exposed electrical conduits + Structural tilt + Pedestrian sidewalk proximity.",
    priority_reason: "Electrocution hazard during wet weather; potential pole collapse onto roadway.",
    traffic_exposure: "Moderate",
    pedestrian_exposure: "High (School Zone)",
    assigned_team: "Electrical Crew Beta-3",
    repair_image_url: null,
    repair_verified: false,
    estimated_response_time: "Standard (< 12 Hours)"
  },
  {
    id: "CS-1055",
    created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    issue_type: "Uncontrolled Garbage Accumulation",
    description: "Large overflow of municipal waste blocking pedestrian walkway and drainage inlet.",
    latitude: 13.0645,
    longitude: 80.2821,
    location_name: "Triplicane High Road, Market Corner",
    severity: 6,
    risk_score: 64,
    priority_score: 68,
    priority_level: "MEDIUM",
    department: "Sanitation",
    status: "ASSIGNED",
    image_url: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80",
    ai_confidence: 0.93,
    weather_risk: "Low - Dry",
    risk_reason: "Biohazard potential + Drainage inlet obstruction if precipitation begins.",
    priority_reason: "Public health hazard and pedestrian obstruction in market zone.",
    traffic_exposure: "Low Traffic",
    pedestrian_exposure: "High (Market)",
    assigned_team: "Zone 5 Sanitation Crew",
    repair_image_url: null,
    repair_verified: false,
    estimated_response_time: "Routine (< 24 Hours)"
  },
  {
    id: "CS-1058",
    created_at: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    issue_type: "Urban Flash Flooding",
    description: "Waterlogging 1.5 feet deep across underpass, making it impassable for compact cars.",
    latitude: 13.0912,
    longitude: 80.2615,
    location_name: "Perambur Railway Underpass",
    severity: 9,
    risk_score: 95,
    priority_score: 98,
    priority_level: "CRITICAL",
    department: "Disaster Management",
    status: "IN PROGRESS",
    image_url: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80",
    ai_confidence: 0.97,
    weather_risk: "Critical - Active Downpour",
    risk_reason: "Severe underpass submersion + Stranded vehicle risk + Hydroplaning danger.",
    priority_reason: "Immediate threat to motorists; arterial route blocked during commute hours.",
    traffic_exposure: "Severe Arterial Gridlock",
    pedestrian_exposure: "Moderate",
    assigned_team: "Emergency Pumping Taskforce 1",
    repair_image_url: null,
    repair_verified: false,
    estimated_response_time: "Immediate (< 1 Hour)"
  },
  {
    id: "CS-1060",
    created_at: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    issue_type: "Asphalt Rutting & Road Cracking",
    description: "Extended longitudinal cracks and surface depression along bus lane.",
    latitude: 13.0521,
    longitude: 80.2511,
    location_name: "T. Nagar Venkatanarayana Road",
    severity: 4,
    risk_score: 45,
    priority_score: 48,
    priority_level: "LOW",
    department: "Roads & Infrastructure",
    status: "REPORTED",
    image_url: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80",
    ai_confidence: 0.88,
    weather_risk: "Low - Clear Skies",
    risk_reason: "Sub-surface wear without active structural collapse; non-immediate hazard.",
    priority_reason: "Requires scheduled resurfacing during preventive maintenance cycle.",
    traffic_exposure: "Moderate",
    pedestrian_exposure: "Low",
    assigned_team: null,
    repair_image_url: null,
    repair_verified: false,
    estimated_response_time: "Preventive (< 72 Hours)"
  },
  {
    id: "CS-1038",
    created_at: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
    issue_type: "Road Pothole",
    description: "Large 12-inch crater filled with gravel after water pipe replacement.",
    latitude: 13.0789,
    longitude: 80.2452,
    location_name: "Nungambakkam High Road",
    severity: 8,
    risk_score: 82,
    priority_score: 89,
    priority_level: "HIGH",
    department: "Roads & Infrastructure",
    status: "VERIFIED",
    image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    ai_confidence: 0.95,
    weather_risk: "Low - Resolved",
    risk_reason: "Deep road crater in high-speed corridor.",
    priority_reason: "Rapid asphalt patching completed; inspected and verified.",
    traffic_exposure: "High",
    pedestrian_exposure: "Medium",
    assigned_team: "Road Maintenance Crew 7",
    repair_image_url: "https://images.unsplash.com/photo-1584463699039-b9d997d8c520?auto=format&fit=crop&w=800&q=80",
    repair_verified: true,
    estimated_response_time: "Completed"
  }
];

// Local storage key for persistent in-browser state during demo
const STORAGE_KEY = 'civicshield_incidents_cache';

export const getCachedIncidents = () => {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INCIDENTS));
  return INITIAL_INCIDENTS;
};

export const saveCachedIncidents = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Fetch incidents from FastAPI backend or fallback to cache
export const fetchIncidentsAPI = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
    const res = await fetch(`${API_BASE_URL}/incidents`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveCachedIncidents(data);
        return { data, source: 'backend' };
      }
    }
  } catch {
    // Backend offline or not ready yet - perfectly normal during parallel hackathon development
  }
  return { data: getCachedIncidents(), source: 'cache' };
};

// Update incident status
export const updateIncidentStatusAPI = async (id, status, assigned_team = null) => {
  try {
    const res = await fetch(`${API_BASE_URL}/incidents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, assigned_team })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  // Local update fallback
  const list = getCachedIncidents();
  const index = list.findIndex(item => item.id === id);
  if (index !== -1) {
    list[index].status = status;
    if (assigned_team) list[index].assigned_team = assigned_team;
    if (status === 'VERIFIED') list[index].repair_verified = true;
    saveCachedIncidents(list);
    return list[index];
  }
  return null;
};

// Submit repair verification
export const verifyRepairAPI = async (id, repairImageUrl) => {
  try {
    const res = await fetch(`${API_BASE_URL}/incidents/${id}/repair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repair_image_url: repairImageUrl })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  // Local fallback
  const list = getCachedIncidents();
  const index = list.findIndex(item => item.id === id);
  if (index !== -1) {
    list[index].repair_image_url = repairImageUrl || "https://images.unsplash.com/photo-1584463699039-b9d997d8c520?auto=format&fit=crop&w=800&q=80";
    list[index].repair_verified = true;
    list[index].status = "VERIFIED";
    saveCachedIncidents(list);
    return list[index];
  }
  return null;
};

