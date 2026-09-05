"""
Utility script to generate realistic visual test fixtures for CIVICSHIELD AI.
Used for offline unit testing, pipeline verification, and benchmark validation.
"""

from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw


def generate_fixtures(output_dir: Path):
    """Generate deterministic test images for all civic categories and edge cases."""
    output_dir.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(42)

    # 1. Pothole fixture: Asphalt gray background with a deep central dark depression
    base_asphalt = rng.normal(120, 15, (256, 256)).clip(70, 160).astype(np.uint8)
    pothole_rgb = np.stack([base_asphalt, base_asphalt, base_asphalt], axis=-1)
    # Carve dark crater in center
    y, x = np.ogrid[:256, :256]
    mask = ((x - 128) ** 2 + (y - 128) ** 2) < (45 ** 2)
    pothole_rgb[mask] = (pothole_rgb[mask] * 0.25).astype(np.uint8)
    Image.fromarray(pothole_rgb).save(output_dir / "sample_pothole.png")

    # 2. Flooding fixture: High blue ratio and specular highlights
    water_img = np.zeros((256, 256, 3), dtype=np.uint8)
    water_img[:, :, 0] = rng.integers(40, 80, (256, 256), dtype=np.uint8)   # R
    water_img[:, :, 1] = rng.integers(100, 150, (256, 256), dtype=np.uint8) # G
    water_img[:, :, 2] = rng.integers(180, 240, (256, 256), dtype=np.uint8) # B (High Blue)
    # Add specular water glare reflections
    glare_mask = rng.random((256, 256)) > 0.88
    water_img[glare_mask] = 250
    Image.fromarray(water_img).save(output_dir / "sample_flooding.png")

    # 3. Garbage fixture: High color entropy, colorful clutter patches
    garbage_img = np.zeros((256, 256, 3), dtype=np.uint8)
    # Mix varied distinct color blocks
    for _ in range(30):
        x1, y1 = rng.integers(0, 200, 2)
        w, h = rng.integers(20, 70, 2)
        color = tuple(rng.integers(0, 255, 3).tolist())
        patch = Image.new("RGB", (w, h), color)
        # paste patch into image
        pil_g = Image.fromarray(garbage_img)
        pil_g.paste(patch, (x1, y1))
        garbage_img = np.array(pil_g)
    Image.fromarray(garbage_img).save(output_dir / "sample_garbage.png")

    # 4. Streetlight fixture: Dark night scene with high luminaire contrast
    night_img = rng.normal(25, 8, (256, 256)).clip(0, 60).astype(np.uint8)
    night_rgb = np.stack([night_img, night_img, night_img], axis=-1)
    # Bright street lamp spot
    lamp_mask = ((x - 128) ** 2 + (y - 70) ** 2) < (18 ** 2)
    night_rgb[lamp_mask] = [255, 255, 230]
    Image.fromarray(night_rgb).save(output_dir / "sample_streetlight.png")

    # 5. Road damage fixture: Gray pavement with high edge roughness / fissures
    pave = rng.normal(130, 12, (256, 256)).clip(90, 170).astype(np.uint8)
    pave_rgb = np.stack([pave, pave, pave], axis=-1)
    pil_pave = Image.fromarray(pave_rgb)
    draw = ImageDraw.Draw(pil_pave)
    # Draw longitudinal cracks
    for y_offset in [50, 100, 160, 210]:
        points = [(x_coord, y_offset + rng.integers(-8, 8)) for x_coord in range(0, 256, 12)]
        draw.line(points, fill=(20, 20, 20), width=3)
    pil_pave.save(output_dir / "sample_road_damage.png")

    # 6. Drainage fixture: Grate / culvert pattern
    drain_img = rng.normal(110, 10, (256, 256)).clip(80, 150).astype(np.uint8)
    drain_rgb = np.stack([drain_img, drain_img, drain_img], axis=-1)
    pil_drain = Image.fromarray(drain_rgb)
    draw_drain = ImageDraw.Draw(pil_drain)
    for x_bar in range(60, 200, 16):
        draw_drain.rectangle([x_bar, 80, x_bar + 6, 180], fill=(15, 15, 15))
    pil_drain.save(output_dir / "sample_drainage.png")

    # 7. Blank fixture: Solid uniform color (should be classified as unknown)
    blank_img = np.full((256, 256, 3), 128, dtype=np.uint8)
    Image.fromarray(blank_img).save(output_dir / "sample_blank.png")

    # 8. Corrupted fixture: Malformed file content
    with open(output_dir / "sample_corrupted.png", "wb") as f:
        f.write(b"NOT_A_REAL_PNG_HEADER_CORRUPTED_FILE")

    print(f"Successfully generated 8 test fixtures in {output_dir}")


if __name__ == "__main__":
    fixtures_path = Path(__file__).parent
    generate_fixtures(fixtures_path)
