"""
Tests for ai/image_analysis.py and vision model adapters.
"""

from pathlib import Path
import pytest

from ai.image_analysis import analyze_image

FIXTURES_DIR = Path(__file__).resolve().parent.parent.parent / "sample_images"


def test_analyze_pothole_image():
    """Verify pothole fixture is analyzed and classified correctly."""
    img_path = FIXTURES_DIR / "sample_pothole.png"
    result = analyze_image(img_path)

    assert result["issue_type"] == "pothole"
    assert 0.0 < result["confidence"] <= 1.0
    assert "pothole" in result["damage_description"].lower() or "cavity" in result["damage_description"].lower()
    assert "visual_metadata" in result


def test_analyze_flooding_image():
    """Verify flooding fixture is detected from water reflectance and color profile."""
    img_path = FIXTURES_DIR / "sample_flooding.png"
    result = analyze_image(img_path)

    assert result["issue_type"] == "flooding"
    assert result["confidence"] >= 0.5
    assert "water" in result["damage_description"].lower() or "flood" in result["damage_description"].lower()


def test_analyze_streetlight_image():
    """Verify streetlight fixture is detected from luminaire contrast profile."""
    img_path = FIXTURES_DIR / "sample_streetlight.png"
    result = analyze_image(img_path)

    assert result["issue_type"] == "streetlight"
    assert result["confidence"] >= 0.5


def test_analyze_garbage_image():
    """Verify garbage fixture is detected from color entropy and clutter."""
    img_path = FIXTURES_DIR / "sample_garbage.png"
    result = analyze_image(img_path)

    assert result["issue_type"] == "garbage"
    assert result["confidence"] >= 0.5


def test_analyze_blank_image_returns_unknown():
    """Verify non-civic or blank images safely fall back to 'unknown'."""
    img_path = FIXTURES_DIR / "sample_blank.png"
    result = analyze_image(img_path)

    assert result["issue_type"] == "unknown"
    assert result["confidence"] < 0.45


def test_empty_image_path_raises_value_error():
    """Verify empty path raises ValueError."""
    with pytest.raises(ValueError, match="cannot be empty"):
        analyze_image("")


def test_nonexistent_image_raises_filenotfound():
    """Verify missing file raises FileNotFoundError."""
    with pytest.raises(FileNotFoundError):
        analyze_image("sample_images/definitely_does_not_exist_12345.jpg")


def test_unsupported_extension_raises_value_error(tmp_path):
    """Verify unsupported file extension raises ValueError."""
    invalid_file = tmp_path / "document.pdf"
    invalid_file.write_text("dummy")
    with pytest.raises(ValueError, match="Unsupported image format"):
        analyze_image(invalid_file)


def test_corrupted_image_raises_value_error():
    """Verify corrupted image raises ValueError."""
    img_path = FIXTURES_DIR / "sample_corrupted.png"
    with pytest.raises(ValueError, match="Corrupted or unreadable"):
        analyze_image(img_path)
