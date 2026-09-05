"""
Image Analysis Module for CIVICSHIELD AI.
Provides high-level entry points for civic issue visual inspection and classification.
"""

from pathlib import Path
from typing import Any, Dict, Optional, Union

from ai.model.base import VisionPrediction
from ai.model.factory import get_vision_model


def analyze_image(
    image_path: Union[str, Path],
    model_backend: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Analyze an infrastructure incident image to detect civic issues.

    Args:
        image_path: Path to the image file (jpg, jpeg, png, webp, bmp).
        model_backend: Optional name of the model backend ('feature').

    Returns:
        Dictionary containing:
            - issue_type: Detected category ('pothole', 'road_damage', 'flooding',
                          'drainage', 'garbage', 'streetlight', or 'unknown')
            - confidence: Prediction confidence score (0.0 to 1.0)
            - damage_description: Human-readable damage observation
            - visual_metadata: Detailed visual metrics extracted from the image

    Raises:
        ValueError: If path is empty, format is unsupported, or image is corrupted.
        FileNotFoundError: If the image file does not exist.
    """
    if not image_path:
        raise ValueError("Image path cannot be empty.")

    model = get_vision_model(model_backend)
    prediction: VisionPrediction = model.predict(image_path)
    return prediction.to_dict()


if __name__ == "__main__":
    import sys
    test_path = sys.argv[1] if len(sys.argv) > 1 else "sample.jpg"
    try:
        res = analyze_image(test_path)
        print("Analysis Result:")
        for k, v in res.items():
            print(f"  {k}: {v}")
    except Exception as err:
        print(f"Error analyzing image: {err}")