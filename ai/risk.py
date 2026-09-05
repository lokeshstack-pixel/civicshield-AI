"""
Risk Intelligence Engine for CIVICSHIELD AI.
Computes comprehensive contextual risk score (0-100) based on damage severity,
traffic exposure, pedestrian density, weather hazards, infrastructure type,
and location sensitivity.
"""

from typing import Any, Dict, Union


# Risk Level Categorization
RISK_LEVEL_LOW = "LOW"            # 0 - 39
RISK_LEVEL_MODERATE = "MODERATE"  # 40 - 69
RISK_LEVEL_HIGH = "HIGH"          # 70 - 84
RISK_LEVEL_CRITICAL = "CRITICAL"  # 85 - 100

# Infrastructure Risk Multipliers
INFRASTRUCTURE_MULTIPLIERS: Dict[str, float] = {
    "bridge": 1.30,          # High collapse hazard, bottleneck risk
    "flyover": 1.30,
    "highway": 1.25,         # High speed collision and multi-car pileup risk
    "expressway": 1.25,
    "arterial": 1.15,        # High-volume transit corridors
    "main_road": 1.15,
    "local_road": 1.00,      # Standard urban/suburban roadway
    "street": 1.00,
    "service_road": 0.85,    # Low-speed accessway
    "alley": 0.80,
}

# Location Sensitivity Multipliers
LOCATION_MULTIPLIERS: Dict[str, float] = {
    "school_zone": 1.25,      # Vulnerable children, high morning/afternoon congestion
    "hospital": 1.25,         # Emergency ambulance access routes, elderly patients
    "transit_hub": 1.15,      # Metro/bus terminals with dense commuter footfall
    "commercial": 1.15,       # Markets and retail zones
    "residential": 1.00,      # Standard residential neighborhood
    "normal": 1.00,
    "industrial": 0.85,       # Lower public exposure
    "rural": 0.80,
}

# Textual scale mapper for string inputs
SCALE_MAP: Dict[str, int] = {
    "none": 0,
    "minimal": 1,
    "low": 3,
    "moderate": 5,
    "medium": 5,
    "high": 8,
    "severe": 9,
    "extreme": 10,
    "critical": 10,
    # Weather-specific
    "clear": 1,
    "cloudy": 3,
    "rain": 6,
    "storm": 8,
    "monsoon": 9,
    "flood_alert": 10,
}


def _normalize_score(val: Union[int, float, str], default: int = 5) -> float:
    """Normalize numeric or qualitative string inputs to a 0.0 - 10.0 scale."""
    if val is None:
        return float(default)

    if isinstance(val, (int, float)):
        return max(0.0, min(10.0, float(val)))

    if isinstance(val, str):
        normalized_str = val.strip().lower()
        if normalized_str in SCALE_MAP:
            return float(SCALE_MAP[normalized_str])
        try:
            parsed = float(normalized_str)
            return max(0.0, min(10.0, parsed))
        except ValueError:
            return float(default)

    return float(default)


def get_risk_level(risk_score: int) -> str:
    """Map a 0-100 risk score to its corresponding risk tier."""
    if risk_score >= 85:
        return RISK_LEVEL_CRITICAL
    if risk_score >= 70:
        return RISK_LEVEL_HIGH
    if risk_score >= 40:
        return RISK_LEVEL_MODERATE
    return RISK_LEVEL_LOW


def calculate_risk(
    severity: Union[int, float, str] = 5,
    traffic_exposure: Union[int, float, str] = 5,
    pedestrian_exposure: Union[int, float, str] = 5,
    weather_risk: Union[int, float, str] = 1,
    infrastructure_type: str = "local_road",
    location_sensitivity: str = "normal",
) -> Dict[str, Any]:
    """
    Calculate public safety risk score using a transparent weighted composite formula.

    FORMULA:
        Base_Risk = 0.35 * (severity * 10)
                  + 0.25 * (traffic * 10)
                  + 0.25 * (pedestrian * 10)
                  + 0.15 * (weather * 10)

        Risk_Score = clamp(round(Base_Risk * M_infra * M_loc), 0, 100)

    Args:
        severity: Damage severity rating (0-10)
        traffic_exposure: Vehicular traffic density (0-10 or 'low', 'medium', 'high')
        pedestrian_exposure: Foot traffic density (0-10 or 'low', 'medium', 'high')
        weather_risk: Adverse weather condition (0-10 or 'clear', 'rain', 'storm')
        infrastructure_type: Road classification ('highway', 'arterial', 'local_road', etc.)
        location_sensitivity: Zone vulnerability ('school_zone', 'hospital', 'commercial', etc.)

    Returns:
        Dictionary containing:
            - risk_score: Integer (0 - 100)
            - risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
            - risk_reason: Explanation of principal risk contributors
            - risk_breakdown: Factor weights and multipliers
    """
    s_val = _normalize_score(severity, default=5)
    t_val = _normalize_score(traffic_exposure, default=5)
    p_val = _normalize_score(pedestrian_exposure, default=5)
    w_val = _normalize_score(weather_risk, default=1)

    # Base weighted linear combination (0.0 to 100.0)
    w_sev = 0.35
    w_traf = 0.25
    w_ped = 0.25
    w_weath = 0.15

    base_risk = (
        (w_sev * (s_val * 10.0))
        + (w_traf * (t_val * 10.0))
        + (w_ped * (p_val * 10.0))
        + (w_weath * (w_val * 10.0))
    )

    # Environmental multipliers
    clean_infra = str(infrastructure_type).lower().strip().replace(" ", "_")
    clean_loc = str(location_sensitivity).lower().strip().replace(" ", "_")

    m_infra = INFRASTRUCTURE_MULTIPLIERS.get(clean_infra, 1.00)
    m_loc = LOCATION_MULTIPLIERS.get(clean_loc, 1.00)

    total_risk = base_risk * m_infra * m_loc
    clamped_risk = max(0, min(100, int(round(total_risk))))
    risk_tier = get_risk_level(clamped_risk)

    # Generate transparent risk explanation
    reasons = []
    if s_val >= 7.0:
        reasons.append("high structural severity")
    if t_val >= 7.0:
        reasons.append("heavy vehicular traffic")
    if p_val >= 7.0:
        reasons.append("dense pedestrian activity")
    if w_val >= 6.0:
        reasons.append("adverse weather conditions")
    if m_loc > 1.0:
        reasons.append(f"sensitive zone ({clean_loc})")
    if m_infra > 1.0:
        reasons.append(f"critical infrastructure ({clean_infra})")

    if not reasons:
        risk_reason = "Standard baseline exposure under normal operating conditions."
    else:
        risk_reason = "Elevated risk driven by " + ", ".join(reasons) + "."

    return {
        "risk_score": clamped_risk,
        "risk_level": risk_tier,
        "risk_reason": risk_reason,
        "risk_breakdown": {
            "severity_contrib": round(w_sev * s_val * 10, 1),
            "traffic_contrib": round(w_traf * t_val * 10, 1),
            "pedestrian_contrib": round(w_ped * p_val * 10, 1),
            "weather_contrib": round(w_weath * w_val * 10, 1),
            "infrastructure_multiplier": m_infra,
            "location_multiplier": m_loc,
            "base_risk": round(base_risk, 1),
        },
    }
