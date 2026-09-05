# CIVICSHIELD AI - Sample Images

This directory is designated for sample and evaluation images for the CIVICSHIELD AI pipeline.

## Adding Real Incident Photos
You can place real-world photos of civic complaints directly into this directory:
- `sample_images/pothole.jpg`
- `sample_images/flooding.jpg`
- `sample_images/garbage.jpg`
- `sample_images/streetlight.jpg`
- `sample_images/road_damage.jpg`
- `sample_images/drainage.jpg`

## Testing the AI with any image
Run the pipeline directly from the root of the repository:

```bash
# Basic run
python -m ai.pipeline sample_images/pothole.jpg

# Run with contextual municipal parameters
python -m ai.pipeline sample_images/pothole.jpg --traffic 8 --pedestrian 7 --infra arterial --loc school_zone
```
