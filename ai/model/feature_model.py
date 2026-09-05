"""
Feature-based computer vision model adapter for CIVICSHIELD AI.
Extracts empirical visual metrics (luminance, color variance, edge density,
localized depressions, water reflectance, and entropy) using PIL and NumPy.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from PIL import Image, UnidentifiedImageError

from ai.model.base import BaseVisionModel, VisionPrediction


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


class FeatureVisionModel(BaseVisionModel):
    """
    Lightweight, deterministic feature-extraction vision model.
    Analyzes actual image pixel data without requiring gigabytes of deep learning weights.
    Provides honest confidence scores and safely classifies ambiguous images as 'unknown'.
    """

    CONFIDENCE_THRESHOLD = 0.45

    def predict(self, image_path: Union[str, Path]) -> VisionPrediction:
        """
        Analyze an image and classify the civic hazard based on pixel-level features.
        """
        path = self._validate_path(image_path)
        img_rgb, raw_size, img_format = self._load_and_verify_image(path)

        # Extract real visual features from image pixels
        features = self._extract_features(img_rgb)
        features["original_dimensions"] = f"{raw_size[0]}x{raw_size[1]}"
        features["format"] = img_format

        # Classify based on extracted visual profile
        prediction = self._classify_from_features(features)
        return prediction

    def _validate_path(self, image_path: Union[str, Path]) -> Path:
        """Validate that the image path is non-empty and exists."""
        if not image_path:
            raise ValueError("Image path cannot be empty.")

        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Image file not found: {path}")

        if not path.is_file():
            raise ValueError(f"Path is not a regular file: {path}")

        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Unsupported image format '{path.suffix}'. "
                f"Supported formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            )

        return path

    def _load_and_verify_image(self, path: Path) -> Tuple[np.ndarray, Tuple[int, int], str]:
        """Verify image integrity and load normalized RGB array."""
        try:
            with Image.open(path) as img:
                img.verify()
        except (UnidentifiedImageError, IOError, SyntaxError) as e:
            raise ValueError(f"Corrupted or unreadable image file: {path.name}") from e

        try:
            with Image.open(path) as img:
                raw_size = img.size
                img_format = img.format or path.suffix.replace(".", "").upper()
                # Work with standardized resolution for feature stability
                resized = img.convert("RGB").resize((256, 256), Image.Resampling.BILINEAR)
                rgb_array = np.array(resized, dtype=np.float32)
                return rgb_array, raw_size, img_format
        except Exception as e:
            raise ValueError(f"Failed to process image {path.name}: {str(e)}") from e

    def _extract_features(self, rgb: np.ndarray) -> Dict[str, Any]:
        """Extract empirical statistical features from pixel arrays."""
        r = rgb[:, :, 0]
        g = rgb[:, :, 1]
        b = rgb[:, :, 2]

        # Perceived luminance (standard ITU-R BT.601)
        gray = 0.299 * r + 0.587 * g + 0.114 * b
        mean_brightness = float(np.mean(gray))
        contrast_std = float(np.std(gray))

        # Color channels and ratios
        mean_r, mean_g, mean_b = float(np.mean(r)), float(np.mean(g)), float(np.mean(b))
        blue_ratio = float(mean_b / (mean_r + mean_g + 1e-5))

        # Saturation: (max - min) / max
        max_c = np.maximum(np.maximum(r, g), b)
        min_c = np.minimum(np.minimum(r, g), b)
        saturation = np.where(max_c > 0, (max_c - min_c) / (max_c + 1e-5), 0.0)
        mean_saturation = float(np.mean(saturation))
        saturation_variance = float(np.var(saturation))

        # Spatial gradients (edge density / texture roughness)
        grad_x = np.abs(np.diff(gray, axis=1))
        grad_y = np.abs(np.diff(gray, axis=0))
        edge_energy = float(np.mean(grad_x) + np.mean(grad_y))

        # Localized dark depressions (characteristic of potholes)
        # Ratio of low 10th percentile brightness to overall mean in central quadrant
        h, w = gray.shape
        center_crop = gray[h // 4 : 3 * h // 4, w // 4 : 3 * w // 4]
        center_mean = float(np.mean(center_crop))
        center_p15 = float(np.percentile(center_crop, 15))
        depression_index = float((center_mean - center_p15) / (center_mean + 1e-5))

        # Water specular highlights / high reflectivity (characteristic of standing water / flooding)
        high_reflection_ratio = float(np.sum(gray > 220) / gray.size)

        # Streetlight luminaire contrast (isolated intense light in dark frame)
        luminaire_contrast = float(np.max(gray) - np.percentile(gray, 25))
        is_nighttime_profile = mean_brightness < 80.0 and luminaire_contrast > 120.0

        # High clutter / color entropy (characteristic of garbage / waste dumps)
        color_entropy = float(np.std(r) + np.std(g) + np.std(b))

        return {
            "mean_brightness": round(mean_brightness, 2),
            "contrast_std": round(contrast_std, 2),
            "mean_saturation": round(mean_saturation, 3),
            "saturation_variance": round(saturation_variance, 4),
            "edge_energy": round(edge_energy, 2),
            "blue_ratio": round(blue_ratio, 3),
            "depression_index": round(depression_index, 3),
            "high_reflection_ratio": round(high_reflection_ratio, 3),
            "is_nighttime_profile": is_nighttime_profile,
            "luminaire_contrast": round(luminaire_contrast, 2),
            "color_entropy": round(color_entropy, 2),
        }

    def _classify_from_features(self, f: Dict[str, Any]) -> VisionPrediction:
        """
        Evaluate extracted visual features against civic issue profiles.
        """
        scores: Dict[str, float] = {
            "pothole": 0.0,
            "road_damage": 0.0,
            "flooding": 0.0,
            "drainage": 0.0,
            "garbage": 0.0,
            "streetlight": 0.0,
        }

        # Check for blank / solid color / non-civic input
        if f["contrast_std"] < 6.0 and f["edge_energy"] < 2.0:
            return VisionPrediction(
                issue_type="unknown",
                confidence=0.15,
                damage_description="Image lacks distinct infrastructure features (blank or uniform image)",
                visual_metadata=f,
            )

        # 1. Pothole profile: Dark localized crater/depression on asphalt/road surface
        # Asphalt is typically low-saturation gray with notable localized depressions
        if f["depression_index"] > 0.30 and f["mean_saturation"] < 0.35:
            scores["pothole"] += 0.55 + min(0.35, f["depression_index"] * 0.5)
        elif f["depression_index"] > 0.20 and f["mean_saturation"] < 0.40:
            scores["pothole"] += 0.40

        # 2. Road damage / cracking: High edge roughness on low saturation gray surface
        if f["mean_saturation"] < 0.35 and f["edge_energy"] > 14.0:
            scores["road_damage"] += 0.50 + min(0.35, (f["edge_energy"] - 14.0) * 0.02)
        elif f["mean_saturation"] < 0.40 and f["edge_energy"] > 9.0:
            scores["road_damage"] += 0.35

        # 3. Flooding: High blue ratio OR high specular reflection over large surface with low edge variance
        if f["blue_ratio"] > 0.38 or (f["high_reflection_ratio"] > 0.08 and f["edge_energy"] < 12.0):
            scores["flooding"] += 0.55 + min(0.35, f["blue_ratio"] * 0.6)
        elif f["high_reflection_ratio"] > 0.05 and f["blue_ratio"] > 0.34:
            scores["flooding"] += 0.42

        # 4. Drainage: Moderate depression + high linear edges or grate patterns
        if f["depression_index"] > 0.25 and 8.0 <= f["edge_energy"] <= 20.0 and f["mean_saturation"] < 0.45:
            scores["drainage"] += 0.48

        # 5. Garbage: High color entropy + high saturation variance + high edge density (clutter)
        if f["color_entropy"] > 85.0 and f["saturation_variance"] > 0.03:
            scores["garbage"] += 0.55 + min(0.35, (f["color_entropy"] - 85.0) * 0.005)
        elif f["color_entropy"] > 70.0 and f["saturation_variance"] > 0.02:
            scores["garbage"] += 0.42

        # 6. Streetlight: Nighttime profile OR isolated high luminaire contrast
        if f["is_nighttime_profile"] or (f["luminaire_contrast"] > 160.0 and f["mean_brightness"] < 100.0):
            scores["streetlight"] += 0.60 + min(0.30, (f["luminaire_contrast"] / 255.0) * 0.3)
        elif f["luminaire_contrast"] > 140.0:
            scores["streetlight"] += 0.38

        # Find best candidate
        best_issue, best_score = max(scores.items(), key=lambda item: item[1])

        # If highest score doesn't reach confidence threshold, mark as unknown
        if best_score < self.CONFIDENCE_THRESHOLD:
            return VisionPrediction(
                issue_type="unknown",
                confidence=round(max(0.20, best_score), 2),
                damage_description="Unrecognized or ambiguous civic issue pattern",
                visual_metadata={**f, "candidate_scores": {k: round(v, 2) for k, v in scores.items()}},
            )

        # Generate accurate damage descriptions
        descriptions = {
            "pothole": "Depressed cavity and localized road crater detected",
            "road_damage": "Surface fracturing and structural pavement wear detected",
            "flooding": "Severe standing water pooling and surface submersion detected",
            "drainage": "Stormwater drainage blockage or culvert obstruction detected",
            "garbage": "High-density solid waste and refuse accumulation detected",
            "streetlight": "Public illumination fixture anomaly or failure detected",
        }

        # Clamp confidence to realistic 0.50 - 0.96 range
        confidence = float(np.clip(best_score, 0.50, 0.96))

        return VisionPrediction(
            issue_type=best_issue,
            confidence=round(confidence, 2),
            damage_description=descriptions.get(best_issue, "Infrastructure damage detected"),
            visual_metadata={**f, "candidate_scores": {k: round(v, 2) for k, v in scores.items()}},
        )
