"""
Complete Civic Incident Intelligence Pipeline for CIVICSHIELD AI.
Integrates image analysis, severity calculation, risk scoring, priority derivation,
and department routing into a unified, JSON-serializable pipeline.
"""

import argparse
import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional, Union

from ai.image_analysis import analyze_image
from ai.priority import calculate_priority
from ai.risk import calculate_risk
from ai.routing import route_department
from ai.severity import calculate_severity

logger = logging.getLogger(__name__)


def analyze_incident(
    image_path: Union[str, Path],
    traffic_exposure: Union[int, float, str] = 5,
    pedestrian_exposure: Union[int, float, str] = 5,
    weather_risk: Union[int, float, str] = 1,
    infrastructure_type: str = "local_road",
    location_sensitivity: str = "normal",
    model_backend: Optional[str] = None,
    raise_errors: bool = False,
) -> Dict[str, Any]:
    """
    Run end-to-end civic complaint intelligence analysis.

    Execution Flow:
        Image Input
            ↓
        Vision Analysis (Issue Type, Confidence, Visual Features)
            ↓
        Severity Engine (0-10 Score, Level)
            ↓
        Risk Engine (0-100 Score, Level, Justification)
            ↓
        Priority Engine (0-100 Score, Operational Tier)
            ↓
        Department Routing (Responsible Municipal Authority)
            ↓
        JSON-Serializable Output

    Args:
        image_path: Path to the civic incident photograph.
        traffic_exposure: Vehicular density (0-10 or 'low', 'medium', 'high').
        pedestrian_exposure: Foot traffic density (0-10 or 'low', 'medium', 'high').
        weather_risk: Weather severity (0-10 or 'clear', 'rain', 'storm').
        infrastructure_type: Type of infrastructure ('highway', 'arterial', 'local_road', etc.).
        location_sensitivity: Zone vulnerability ('school_zone', 'hospital', 'commercial', etc.).
        model_backend: Optional specific vision model backend name.
        raise_errors: If True, raises exceptions directly; if False, returns
                      a structured error dictionary safely.

    Returns:
        JSON-serializable dictionary with:
            - issue_type (str)
            - confidence (float)
            - damage_description (str)
            - severity (int: 0-10)
            - severity_level (str)
            - risk_score (int: 0-100)
            - risk_level (str)
            - priority_score (int: 0-100)
            - priority_level (str)
            - department (str)
            - risk_reason (str)
            - priority_reason (str)
            - routing_notes (str)
            - visual_metadata (dict)
    """
    try:
        # Step 1: Image Analysis
        vision_result = analyze_image(image_path=image_path, model_backend=model_backend)
        issue_type = vision_result.get("issue_type", "unknown")
        confidence = float(vision_result.get("confidence", 0.0))
        damage_desc = vision_result.get("damage_description", "No description available")
        visual_metadata = vision_result.get("visual_metadata", {})

        # Step 2: Severity Calculation
        severity_result = calculate_severity(vision_result)
        severity = int(severity_result["severity"])
        severity_level = severity_result["severity_level"]
        severity_factors = severity_result.get("severity_factors", [])

        # Step 3: Risk Intelligence Scoring
        risk_result = calculate_risk(
            severity=severity,
            traffic_exposure=traffic_exposure,
            pedestrian_exposure=pedestrian_exposure,
            weather_risk=weather_risk,
            infrastructure_type=infrastructure_type,
            location_sensitivity=location_sensitivity,
        )
        risk_score = int(risk_result["risk_score"])
        risk_level = risk_result["risk_level"]
        risk_reason = risk_result["risk_reason"]
        risk_breakdown = risk_result.get("risk_breakdown", {})

        # Step 4: Dispatch Priority Engine
        priority_result = calculate_priority(
            risk_score=risk_score,
            severity=severity,
            issue_type=issue_type,
        )
        priority_score = int(priority_result["priority_score"])
        priority_level = priority_result["priority_level"]
        priority_reason = priority_result["priority_reason"]

        # Step 5: Department Routing
        routing_result = route_department(issue_type)
        department = routing_result["department"]
        routing_notes = routing_result.get("routing_notes", "")

        return {
            "status": "success",
            "issue_type": issue_type,
            "confidence": round(confidence, 2),
            "damage_description": damage_desc,
            "severity": severity,
            "severity_level": severity_level,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "priority_score": priority_score,
            "priority_level": priority_level,
            "department": department,
            "risk_reason": risk_reason,
            "priority_reason": priority_reason,
            "routing_notes": routing_notes,
            "severity_factors": severity_factors,
            "risk_breakdown": risk_breakdown,
            "visual_metadata": visual_metadata,
        }

    except Exception as exc:
        if raise_errors:
            raise exc

        logger.warning("Civic incident pipeline caught handled error: %s", str(exc))
        return {
            "status": "error",
            "error_type": exc.__class__.__name__,
            "message": str(exc),
            "issue_type": "unknown",
            "confidence": 0.0,
            "damage_description": "Incident analysis could not be completed due to an input or processing error.",
            "severity": 0,
            "severity_level": "NONE",
            "risk_score": 0,
            "risk_level": "LOW",
            "priority_score": 0,
            "priority_level": "LOW",
            "department": "General Civic Services",
            "risk_reason": "Analysis halted due to input error.",
            "priority_reason": "Pending valid incident submission.",
            "routing_notes": "Routed to General Civic Services triage.",
            "severity_factors": [],
            "risk_breakdown": {},
            "visual_metadata": {},
        }


def main():
    """Command Line Interface for running and testing the pipeline."""
    parser = argparse.ArgumentParser(
        description="CIVICSHIELD AI - Civic Complaint Intelligence Engine"
    )
    parser.add_argument("image_path", help="Path to complaint image file")
    parser.add_argument("--traffic", default=5, help="Traffic exposure (0-10 or 'low'/'high')")
    parser.add_argument("--pedestrian", default=5, help="Pedestrian density (0-10 or 'low'/'high')")
    parser.add_argument("--weather", default=1, help="Weather severity (0-10 or 'clear'/'rain')")
    parser.add_argument("--infra", default="local_road", help="Infrastructure type (highway, arterial, local_road, bridge)")
    parser.add_argument("--loc", default="normal", help="Location sensitivity (school_zone, hospital, commercial, residential)")
    parser.add_argument("--backend", default=None, help="Vision backend adapter (e.g. 'feature')")

    args = parser.parse_args()

    result = analyze_incident(
        image_path=args.image_path,
        traffic_exposure=args.traffic,
        pedestrian_exposure=args.pedestrian,
        weather_risk=args.weather,
        infrastructure_type=args.infra,
        location_sensitivity=args.loc,
        model_backend=args.backend,
        raise_errors=False,
    )

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
