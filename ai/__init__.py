"""
CIVICSHIELD AI - Member 1 (AI + Risk Intelligence)

Comprehensive AI, severity calculation, risk intelligence, priority scoring,
and municipal routing layer for civic infrastructure complaints.
"""

from typing import Any

__version__ = "1.0.0"

__all__ = [
    "analyze_incident",
    "analyze_image",
    "calculate_severity",
    "calculate_risk",
    "calculate_priority",
    "route_department",
    "get_severity_level",
    "get_risk_level",
    "get_priority_level",
]


def __getattr__(name: str) -> Any:
    """Lazy-load module attributes to prevent circular imports with python -m."""
    if name == "analyze_incident":
        from ai.pipeline import analyze_incident
        return analyze_incident
    if name == "analyze_image":
        from ai.image_analysis import analyze_image
        return analyze_image
    if name in {"calculate_severity", "get_severity_level"}:
        import ai.severity as sev
        return getattr(sev, name)
    if name in {"calculate_risk", "get_risk_level"}:
        import ai.risk as rsk
        return getattr(rsk, name)
    if name in {"calculate_priority", "get_priority_level"}:
        import ai.priority as pri
        return getattr(pri, name)
    if name == "route_department":
        from ai.routing import route_department
        return route_department
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
