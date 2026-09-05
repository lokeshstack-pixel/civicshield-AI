"""
Model factory for CIVICSHIELD AI vision adapters.
Selects and instantiates the appropriate vision model based on configuration.
"""

import os
from typing import Optional

from ai.model.base import BaseVisionModel
from ai.model.feature_model import FeatureVisionModel


def get_vision_model(model_backend: Optional[str] = None) -> BaseVisionModel:
    """
    Factory function to retrieve a vision model instance.

    Args:
        model_backend: Explicit backend name ('feature', 'heuristic', 'default').
                       Defaults to environment variable CIVICSHIELD_VISION_BACKEND
                       or 'feature'.

    Returns:
        Instance of BaseVisionModel.
    """
    backend = (model_backend or os.getenv("CIVICSHIELD_VISION_BACKEND", "feature")).lower()

    if backend in {"feature", "heuristic", "default"}:
        return FeatureVisionModel()

    # Extensible for future adapters (e.g. 'yolo', 'vit', 'gemini')
    raise ValueError(
        f"Unknown vision model backend: '{backend}'. "
        f"Available backends: 'feature'"
    )
