"""
Abstract base classes and data definitions for CIVICSHIELD AI vision models.
"""

from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, Union


@dataclass
class VisionPrediction:
    """Standardized output structure for civic issue vision predictions."""
    issue_type: str
    confidence: float
    damage_description: str
    visual_metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert the prediction to a JSON-serializable dictionary."""
        return asdict(self)


class BaseVisionModel(ABC):
    """
    Abstract Vision Model interface.
    Enables swapping between lightweight local feature models,
    deep learning models (YOLO/PyTorch), and cloud vision APIs.
    """

    @abstractmethod
    def predict(self, image_path: Union[str, Path]) -> VisionPrediction:
        """
        Analyze an image file and return a VisionPrediction.

        Args:
            image_path: Path to the image file to analyze.

        Returns:
            VisionPrediction containing issue_type, confidence,
            damage_description, and visual_metadata.

        Raises:
            FileNotFoundError: If the image path does not exist.
            ValueError: If the file is invalid or corrupted.
        """
        pass
