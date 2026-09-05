"""
Tests for ai/priority.py.
"""

from ai.priority import (
    PRIORITY_TIER_CRITICAL,
    PRIORITY_TIER_HIGH,
    PRIORITY_TIER_LOW,
    PRIORITY_TIER_MEDIUM,
    calculate_priority,
    get_priority_level,
)


def test_priority_tier_mapping():
    """Verify tier assignment across score boundaries."""
    assert get_priority_level(95) == PRIORITY_TIER_CRITICAL
    assert get_priority_level(80) == PRIORITY_TIER_CRITICAL
    assert get_priority_level(75) == PRIORITY_TIER_HIGH
    assert get_priority_level(60) == PRIORITY_TIER_HIGH
    assert get_priority_level(55) == PRIORITY_TIER_MEDIUM
    assert get_priority_level(40) == PRIORITY_TIER_MEDIUM
    assert get_priority_level(35) == PRIORITY_TIER_LOW
    assert get_priority_level(0) == PRIORITY_TIER_LOW


def test_example_scenario_from_specification():
    """
    Test user example:
    risk_score = 87, severity = 8
    0.65*87 + 0.35*80 = 56.55 + 28.0 = 84.55 (+5 acute risk boost) -> 90 or 93 CRITICAL
    """
    res = calculate_priority(risk_score=87, severity=8, issue_type="pothole")
    assert res["priority_score"] >= 85
    assert res["priority_level"] == PRIORITY_TIER_CRITICAL
    assert "pothole" in res["priority_reason"].lower()


def test_acute_structural_hazard_boost():
    """Verify severity 9+ with high risk receives urgency boost."""
    res = calculate_priority(risk_score=75, severity=9, issue_type="flooding")
    # Base: 0.65*75 + 0.35*90 = 48.75 + 31.5 = 80.25 + 8 boost = 88
    assert res["priority_score"] >= 85
    assert res["priority_level"] == PRIORITY_TIER_CRITICAL


def test_low_priority_minor_hazard():
    """Verify small defect in quiet area gets LOW tier."""
    res = calculate_priority(risk_score=20, severity=2, issue_type="road_damage")
    # 0.65*20 + 0.35*20 = 20
    assert res["priority_score"] <= 30
    assert res["priority_level"] == PRIORITY_TIER_LOW


def test_priority_score_clamping():
    """Verify bounds between 0 and 100."""
    high = calculate_priority(risk_score=100, severity=10)
    assert high["priority_score"] == 100

    low = calculate_priority(risk_score=0, severity=0)
    assert low["priority_score"] == 0
