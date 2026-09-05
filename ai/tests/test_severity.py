"""
Tests for ai/severity.py.
"""

import pytest
from ai.severity import (
    SEVERITY_LEVEL_CRITICAL,
    SEVERITY_LEVEL_HIGH,
    SEVERITY_LEVEL_LOW,
    SEVERITY_LEVEL_MODERATE,
    calculate_severity,
    get_severity_level,
)


def test_severity_level_mapping():
    """Verify standard severity level tiers."""
    assert get_severity_level(10) == SEVERITY_LEVEL_CRITICAL
    assert get_severity_level(9) == SEVERITY_LEVEL_CRITICAL
    assert get_severity_level(8) == SEVERITY_LEVEL_HIGH
    assert get_severity_level(7) == SEVERITY_LEVEL_HIGH
    assert get_severity_level(6) == SEVERITY_LEVEL_MODERATE
    assert get_severity_level(4) == SEVERITY_LEVEL_MODERATE
    assert get_severity_level(3) == SEVERITY_LEVEL_LOW
    assert get_severity_level(1) == SEVERITY_LEVEL_LOW
    assert get_severity_level(0) == "NONE"


def test_severity_pothole_baseline_and_modifiers():
    """Verify pothole severity calculation with visual depression modifier."""
    # Standard pothole
    base_res = calculate_severity({"issue_type": "pothole", "confidence": 0.7})
    assert 4 <= base_res["severity"] <= 6

    # Severe pothole with deep crater
    severe_res = calculate_severity({
        "issue_type": "pothole",
        "confidence": 0.95,
        "visual_metadata": {"depression_index": 0.55},
    })
    assert severe_res["severity"] >= 7
    assert severe_res["severity_level"] in [SEVERITY_LEVEL_HIGH, SEVERITY_LEVEL_CRITICAL]
    assert any("Deep crater" in f for f in severe_res["severity_factors"])


def test_severity_flooding():
    """Verify flooding starts with high baseline and reflects surface water pooling."""
    res = calculate_severity({
        "issue_type": "flooding",
        "confidence": 0.92,
        "visual_metadata": {"high_reflection_ratio": 0.18},
    })
    assert res["severity"] >= 8
    assert res["severity_level"] in [SEVERITY_LEVEL_HIGH, SEVERITY_LEVEL_CRITICAL]


def test_severity_garbage():
    """Verify sanitation/garbage severity ranges."""
    res = calculate_severity({
        "issue_type": "garbage",
        "confidence": 0.8,
        "visual_metadata": {"color_entropy": 75.0},
    })
    assert 2 <= res["severity"] <= 5
    assert res["severity_level"] in [SEVERITY_LEVEL_LOW, SEVERITY_LEVEL_MODERATE]


def test_severity_streetlight():
    """Verify nighttime streetlight failure receives emergency visibility boost."""
    day_res = calculate_severity({
        "issue_type": "streetlight",
        "confidence": 0.8,
        "visual_metadata": {"is_nighttime_profile": False},
    })
    night_res = calculate_severity({
        "issue_type": "streetlight",
        "confidence": 0.8,
        "visual_metadata": {"is_nighttime_profile": True},
    })
    assert night_res["severity"] > day_res["severity"]


def test_severity_unknown_issue():
    """Verify unknown category receives safe conservative baseline."""
    res = calculate_severity({"issue_type": "unknown", "confidence": 0.25})
    assert res["severity"] <= 3
    assert res["severity_level"] == SEVERITY_LEVEL_LOW


def test_severity_clamping():
    """Verify severity is strictly clamped between 0 and 10."""
    # Hypothetical extreme modifiers
    res = calculate_severity({
        "issue_type": "flooding",
        "confidence": 0.99,
        "visual_metadata": {"high_reflection_ratio": 0.99},
    })
    assert 0 <= res["severity"] <= 10


def test_invalid_input_raises():
    """Verify passing non-dict raises ValueError."""
    with pytest.raises(ValueError):
        calculate_severity("not_a_dict")  # type: ignore
