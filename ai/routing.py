"""
Department Routing Engine for CIVICSHIELD AI.
Routes civic incidents to appropriate municipal departments based on issue type.
"""

from typing import Any, Dict, Optional


# Canonical Municipal Department Mappings
DEPARTMENT_MAPPING: Dict[str, str] = {
    # Roads & Infrastructure
    "pothole": "Roads & Infrastructure",
    "potholes": "Roads & Infrastructure",
    "road_damage": "Roads & Infrastructure",
    "road damage": "Roads & Infrastructure",
    "crack": "Roads & Infrastructure",
    "asphalt": "Roads & Infrastructure",
    "pavement": "Roads & Infrastructure",

    # Drainage / Disaster Management
    "flooding": "Drainage / Disaster Management",
    "flood": "Drainage / Disaster Management",
    "waterlogging": "Drainage / Disaster Management",
    "water_logging": "Drainage / Disaster Management",

    # Public Works
    "drainage": "Public Works",
    "storm_drain": "Public Works",
    "culvert": "Public Works",
    "sewer": "Public Works",
    "manhole": "Public Works",

    # Electrical
    "streetlight": "Electrical",
    "street_light": "Electrical",
    "lamp": "Electrical",
    "traffic_light": "Electrical",
    "wire": "Electrical",

    # Sanitation
    "garbage": "Sanitation",
    "trash": "Sanitation",
    "waste": "Sanitation",
    "dump": "Sanitation",
    "debris": "Sanitation",
}

DEFAULT_DEPARTMENT = "General Civic Services"


def route_department(issue_type: Optional[str]) -> Dict[str, str]:
    """
    Determine the municipal department responsible for resolving a complaint.

    Args:
        issue_type: Detected or reported issue category string.

    Returns:
        Dictionary containing:
            - department: Canonical department name
            - routing_notes: Explanation or routing metadata
    """
    if not issue_type:
        return {
            "department": DEFAULT_DEPARTMENT,
            "routing_notes": "No issue type provided; routed to triage desk.",
        }

    normalized_key = str(issue_type).strip().lower().replace("-", "_")

    if normalized_key in DEPARTMENT_MAPPING:
        dept = DEPARTMENT_MAPPING[normalized_key]
        return {
            "department": dept,
            "routing_notes": f"Direct dispatch to {dept} based on '{normalized_key}'.",
        }

    # Fallback to General Civic Services for unrecognized categories
    return {
        "department": DEFAULT_DEPARTMENT,
        "routing_notes": f"Unrecognized category '{issue_type}'; routed to General Civic Services for manual review.",
    }
