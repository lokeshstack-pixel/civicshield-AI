"""
End-to-End Pipeline and Integration Tests for CIVICSHIELD AI.
"""

import json
from pathlib import Path
import pytest

from ai.pipeline import analyze_incident

FIXTURES_DIR = Path(__file__).resolve().parent.parent.parent / "sample_images"


def test_pipeline_success_pothole():
    """Verify complete pipeline execution for pothole image."""
    img_path = FIXTURES_DIR / "sample_pothole.png"
    result = analyze_incident(
        image_path=img_path,
        traffic_exposure=8,
        pedestrian_exposure=6,
        weather_risk=3,
        infrastructure_type="arterial",
        location_sensitivity="school_zone",
    )

    # Status check
    assert result["status"] == "success"

    # Verify all required keys exist
    expected_keys = [
        "issue_type",
        "confidence",
        "damage_description",
        "severity",
        "severity_level",
        "risk_score",
        "risk_level",
        "priority_score",
        "priority_level",
        "department",
        "risk_reason",
        "priority_reason",
    ]
    for k in expected_keys:
        assert k in result, f"Missing required key: {k}"

    # Semantic consistency
    assert result["issue_type"] == "pothole"
    assert result["department"] == "Roads & Infrastructure"
    assert result["severity"] >= 5
    assert result["risk_score"] >= 50
    assert result["priority_level"] in ["HIGH", "CRITICAL"]

    # Verify 100% JSON-serializable (vital for Member 2 FastAPI)
    serialized = json.dumps(result)
    assert isinstance(serialized, str)
    deserialized = json.loads(serialized)
    assert deserialized["issue_type"] == "pothole"


def test_pipeline_different_inputs_produce_different_outputs():
    """Verify system is NOT hardcoding results."""
    pothole_res = analyze_incident(
        image_path=FIXTURES_DIR / "sample_pothole.png",
        traffic_exposure=2,
        location_sensitivity="residential",
    )
    flooding_res = analyze_incident(
        image_path=FIXTURES_DIR / "sample_flooding.png",
        traffic_exposure=9,
        location_sensitivity="hospital",
    )

    assert pothole_res["issue_type"] != flooding_res["issue_type"]
    assert pothole_res["department"] != flooding_res["department"]
    assert pothole_res["risk_score"] != flooding_res["risk_score"]


def test_pipeline_blank_image_safe_fallback():
    """Verify blank image handles unknown classification safely."""
    res = analyze_incident(image_path=FIXTURES_DIR / "sample_blank.png")
    assert res["status"] == "success"
    assert res["issue_type"] == "unknown"
    assert res["department"] == "General Civic Services"
    assert res["priority_level"] in ["LOW", "MEDIUM"]


def test_pipeline_error_handling_nonexistent_file():
    """Verify non-existent file produces clean error dictionary without crashing."""
    res = analyze_incident("sample_images/nonexistent_file_xyz.jpg", raise_errors=False)
    assert res["status"] == "error"
    assert res["error_type"] == "FileNotFoundError"
    assert res["department"] == "General Civic Services"
    # Ensure JSON serializable
    assert json.dumps(res)


def test_pipeline_error_handling_corrupted_file():
    """Verify corrupted file produces clean error dictionary."""
    res = analyze_incident(FIXTURES_DIR / "sample_corrupted.png", raise_errors=False)
    assert res["status"] == "error"
    assert res["error_type"] == "ValueError"
    assert "corrupted" in res["message"].lower() or "unreadable" in res["message"].lower()


def test_pipeline_raise_errors_flag():
    """Verify pipeline raises exception when raise_errors=True."""
    with pytest.raises(FileNotFoundError):
        analyze_incident("sample_images/nonexistent_file_xyz.jpg", raise_errors=True)
