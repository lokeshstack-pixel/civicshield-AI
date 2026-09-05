"""
Tests for ai/routing.py.
"""

from ai.routing import route_department


def test_routing_required_categories():
    """Verify all mandatory hackathon department routes."""
    assert route_department("pothole")["department"] == "Roads & Infrastructure"
    assert route_department("road_damage")["department"] == "Roads & Infrastructure"
    assert route_department("drainage")["department"] == "Public Works"
    assert route_department("flooding")["department"] == "Drainage / Disaster Management"
    assert route_department("streetlight")["department"] == "Electrical"
    assert route_department("garbage")["department"] == "Sanitation"


def test_routing_case_and_whitespace_insensitivity():
    """Verify formatting tolerance."""
    assert route_department("  POTHOLE  ")["department"] == "Roads & Infrastructure"
    assert route_department("Road-Damage")["department"] == "Roads & Infrastructure"
    assert route_department("FLOODING")["department"] == "Drainage / Disaster Management"
    assert route_department("Street_Light")["department"] == "Electrical"


def test_routing_aliases():
    """Verify common synonyms route correctly."""
    assert route_department("trash")["department"] == "Sanitation"
    assert route_department("waste")["department"] == "Sanitation"
    assert route_department("culvert")["department"] == "Public Works"
    assert route_department("pavement")["department"] == "Roads & Infrastructure"


def test_routing_unknown_and_none_fallbacks():
    """Verify unmapped or missing categories safely route to General Civic Services without crashing."""
    assert route_department("unknown")["department"] == "General Civic Services"
    assert route_department("flying_saucer")["department"] == "General Civic Services"
    assert route_department(None)["department"] == "General Civic Services"
    assert route_department("")["department"] == "General Civic Services"
