"""
Severity Engine for CIVICSHIELD AI.
Calculates structural hazard severity (0-10) and severity level based on
issue category, visual indicators, and confidence metrics.
"""

from typing import Any, Dict, List, Tuple


# Severity Level Thresholds
SEVERITY_LEVEL_LOW = "LOW"            # 1 - 3
SEVERITY_LEVEL_MODERATE = "MODERATE"  # 4 - 6
SEVERITY_LEVEL_HIGH = "HIGH"          # 7 - 8
SEVERITY_LEVEL_CRITICAL = "CRITICAL"  # 9 - 10

# Base intrinsic hazard severity per civic issue type (scale 1 - 10)
BASE_SEVERITY_MAP: Dict[str, int] = {
    "flooding": 7,      # High acute danger to life, vehicle stalling, structural foundation
    "pothole": 5,       # Direct accident risk for two-wheelers, vehicle suspension damage
    "road_damage": 4,   # Pavement degradation, traffic slowdown, potential pothole evolution
    "drainage": 5,      # Wastewater overflow, structural waterlogging, vector contamination
    "garbage": 3,       # Public health, bio-hazard, sanitation, pest breeding
    "streetlight": 4,   # Pedestrian security, nighttime vehicular blindspots
    "unknown": 2,       # Unclassified civic anomaly, conservative base rating
}


def get_severity_level(severity: int) -> str:
    """
    Map an integer severity score (0-10) to its descriptive level.
    """
    if severity >= 9:
        return SEVERITY_LEVEL_CRITICAL
    if severity >= 7:
        return SEVERITY_LEVEL_HIGH
    if severity >= 4:
        return SEVERITY_LEVEL_MODERATE
    if severity >= 1:
        return SEVERITY_LEVEL_LOW
    return "NONE"


def calculate_severity(analysis_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute damage severity based on image analysis output.

    Args:
        analysis_result: Dictionary produced by analyze_image(), containing
                         'issue_type', 'confidence', 'damage_description',
                         and optional 'visual_metadata'.

    Returns:
        Dictionary with:
            - severity: Integer from 0 to 10
            - severity_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
            - severity_factors: List of human-readable factor descriptions
    """
    if not isinstance(analysis_result, dict):
        raise ValueError("analysis_result must be a dictionary.")

    issue_type = str(analysis_result.get("issue_type", "unknown")).lower().strip()
    confidence = float(analysis_result.get("confidence", 0.5))
    metadata = analysis_result.get("visual_metadata", {})

    base_severity = BASE_SEVERITY_MAP.get(issue_type, BASE_SEVERITY_MAP["unknown"])
    modifiers: List[Tuple[int, str]] = []

    # 1. Evaluate visual damage indicators from empirical metadata
    if issue_type == "pothole":
        dep_index = float(metadata.get("depression_index", 0.0))
        if dep_index >= 0.45:
            modifiers.append((2, "Deep crater cavity observed (>45% depression index)"))
        elif dep_index >= 0.25:
            modifiers.append((1, "Notable depression cavity detected"))

    elif issue_type == "flooding":
        refl_ratio = float(metadata.get("high_reflection_ratio", 0.0))
        if refl_ratio >= 0.15:
            modifiers.append((2, "Extensive standing water sheet reflection detected"))
        elif refl_ratio >= 0.06:
            modifiers.append((1, "Surface water pooling detected"))

    elif issue_type == "garbage":
        entropy = float(metadata.get("color_entropy", 0.0))
        if entropy >= 105.0:
            modifiers.append((2, "Massive solid waste accumulation with high clutter density"))
        elif entropy >= 85.0:
            modifiers.append((1, "Scattered multi-item debris detected"))

    elif issue_type == "road_damage":
        edge_energy = float(metadata.get("edge_energy", 0.0))
        if edge_energy >= 20.0:
            modifiers.append((2, "Severe widespread longitudinal cracking/fractures"))
        elif edge_energy >= 14.0:
            modifiers.append((1, "Moderate pavement surface distress"))

    elif issue_type == "drainage":
        dep_index = float(metadata.get("depression_index", 0.0))
        if dep_index >= 0.35:
            modifiers.append((2, "Severely clogged or collapsed stormwater inlet"))
        elif dep_index >= 0.20:
            modifiers.append((1, "Visible drainage intake blockage"))

    elif issue_type == "streetlight":
        is_night = bool(metadata.get("is_nighttime_profile", False))
        if is_night:
            modifiers.append((2, "Critical nighttime visibility hazard in active zone"))
        else:
            modifiers.append((1, "Luminaire component failure or physical tilt"))

    # 2. Confidence scaling modifier
    if confidence >= 0.90:
        modifiers.append((1, "High confidence visual confirmation"))
    elif confidence < 0.40 and issue_type != "unknown":
        modifiers.append((-1, "Low confidence prediction - dampened severity"))

    # Calculate final clamped score
    net_modifier = sum(mod[0] for mod in modifiers)
    raw_severity = base_severity + net_modifier
    clamped_severity = max(0, min(10, int(round(raw_severity))))
    level = get_severity_level(clamped_severity)

    factors = [f"Base {issue_type} baseline hazard: {base_severity}/10"]
    for val, reason in modifiers:
        factors.append(f"{'+' if val >= 0 else ''}{val}: {reason}")

    return {
        "severity": clamped_severity,
        "severity_level": level,
        "severity_factors": factors,
    }
