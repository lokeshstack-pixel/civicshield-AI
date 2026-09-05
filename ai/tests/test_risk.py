"""
Tests for ai/risk.py.
"""

from ai.risk import (
    RISK_LEVEL_CRITICAL,
    RISK_LEVEL_HIGH,
    RISK_LEVEL_LOW,
    RISK_LEVEL_MODERATE,
    calculate_risk,
    get_risk_level,
)


def test_risk_level_mapping():
    """Verify tier mappings for 0-100 risk score."""
    assert get_risk_level(95) == RISK_LEVEL_CRITICAL
    assert get_risk_level(85) == RISK_LEVEL_CRITICAL
    assert get_risk_level(80) == RISK_LEVEL_HIGH
    assert get_risk_level(70) == RISK_LEVEL_HIGH
    assert get_risk_level(50) == RISK_LEVEL_MODERATE
    assert get_risk_level(40) == RISK_LEVEL_MODERATE
    assert get_risk_level(30) == RISK_LEVEL_LOW
    assert get_risk_level(0) == RISK_LEVEL_LOW


def test_baseline_risk_calculation():
    """Verify mathematical calculation with standard default inputs."""
    # severity=5, traffic=5, pedestrian=5, weather=1
    # base = 0.35*(50) + 0.25*(50) + 0.25*(50) + 0.15*(10) = 17.5 + 12.5 + 12.5 + 1.5 = 44.0
    res = calculate_risk(
        severity=5,
        traffic_exposure=5,
        pedestrian_exposure=5,
        weather_risk=1,
        infrastructure_type="local_road",
        location_sensitivity="normal",
    )
    assert res["risk_score"] == 44
    assert res["risk_level"] == RISK_LEVEL_MODERATE
    assert "risk_breakdown" in res


def test_high_exposure_and_sensitivity_amplification():
    """Verify multipliers for arterial roads in school zones during storms."""
    res = calculate_risk(
        severity=8,
        traffic_exposure=8,
        pedestrian_exposure=8,
        weather_risk=8,
        infrastructure_type="arterial",
        location_sensitivity="school_zone",
    )
    # base = 0.35*80 + 0.25*80 + 0.25*80 + 0.15*80 = 80.0
    # total = 80.0 * 1.15 * 1.25 = 115.0 -> clamped to 100
    assert res["risk_score"] == 100
    assert res["risk_level"] == RISK_LEVEL_CRITICAL
    assert "school_zone" in res["risk_reason"].lower()


def test_qualitative_string_inputs():
    """Verify string inputs like 'high', 'low', 'rain' are correctly parsed."""
    res = calculate_risk(
        severity=7,
        traffic_exposure="high",       # -> 8
        pedestrian_exposure="medium",   # -> 5
        weather_risk="rain",           # -> 6
        infrastructure_type="highway", # -> 1.25
    )
    assert 60 <= res["risk_score"] <= 100
    assert res["risk_level"] in [RISK_LEVEL_HIGH, RISK_LEVEL_CRITICAL]


def test_risk_score_clamping():
    """Verify risk scores never exceed 100 or fall below 0."""
    high_res = calculate_risk(
        severity=10,
        traffic_exposure=10,
        pedestrian_exposure=10,
        weather_risk=10,
        infrastructure_type="bridge",
        location_sensitivity="hospital",
    )
    assert high_res["risk_score"] == 100

    low_res = calculate_risk(
        severity=0,
        traffic_exposure=0,
        pedestrian_exposure=0,
        weather_risk=0,
    )
    assert low_res["risk_score"] == 0
    assert low_res["risk_level"] == RISK_LEVEL_LOW
