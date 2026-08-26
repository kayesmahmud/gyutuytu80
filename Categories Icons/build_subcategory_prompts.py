#!/usr/bin/env python3
"""
Build prompts-subcategories.jsonl from subcategory-subjects.json.

Each subject clause is wrapped in the SAME realistic master style used for the
16 parent icons (see REALISTIC-PROMPTS.md), so the subcategory set renders in
the identical bikroy-style photoreal look.

    python build_subcategory_prompts.py                 # 2K, matches parent pipeline
    python build_subcategory_prompts.py --image-size 1K # cheaper/faster

Then generate them style-anchored to a parent icon so the sets can't drift:

    python generate.py --set subcategories --ref realistic_processed/mobiles.png
"""

import argparse
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

MASTER_STYLE = (
    "Photorealistic 3D product render of {subject}. "
    "Studio product-photography lighting: soft even illumination from the top-left, realistic "
    "materials, textures and true-to-life natural colors, subtle reflections, and a soft realistic "
    "contact shadow directly beneath the object. Sharp focus, ultra-detailed, premium e-commerce "
    "catalog quality. The subject is centered and fills about 80% of the square frame with clean "
    "even margins. Fully transparent background (alpha), no scene, no floor texture, no extra props "
    "beyond those described, no text, no letters, no numbers, no logos, no watermark. "
    "Square 1:1, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines."
)

NEGATIVE_PROMPT = (
    "cartoon, illustration, flat design, 2d, vector, drawing, sketch, outline, low detail, blurry, "
    "text, letters, numbers, words, watermark, logo, extra objects, busy background, scene, floor"
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the subcategory prompt file")
    parser.add_argument("--image-size", default="2K", choices=["1K", "2K"])
    parser.add_argument("--out", default="prompts-subcategories.jsonl")
    args = parser.parse_args()

    subjects = json.loads((HERE / "subcategory-subjects.json").read_text())
    subjects.pop("_comment", None)

    lines = []
    for slug, subject in subjects.items():
        lines.append(
            json.dumps(
                {
                    "slug": slug,
                    "filename": f"{slug}.png",
                    "set": "subcategories",
                    "aspect_ratio": "1:1",
                    "image_size": args.image_size,
                    "negative_prompt": NEGATIVE_PROMPT,
                    "prompt": MASTER_STYLE.format(subject=subject),
                }
            )
        )

    out_path = HERE / args.out
    out_path.write_text("\n".join(lines) + "\n")
    print(f"✓ {len(lines)} prompts ({args.image_size}) -> {out_path.name}")


if __name__ == "__main__":
    main()
