"""
CIVICSHIELD AI - Model Adapter Subsystem
Provides model abstraction interfaces and adapters for civic damage vision models.
"""

from ai.model.base import BaseVisionModel, VisionPrediction
from ai.model.factory import get_vision_model

__all__ = ["BaseVisionModel", "VisionPrediction", "get_vision_model"]
