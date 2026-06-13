#!/usr/bin/env python3
"""
Generate the 16 Thulobazaar category icons with Nano Banana Pro
(Gemini 3 Pro Image) on Vertex AI.

Reads prompts-<set>.jsonl and writes one PNG per icon, named by category slug,
into ./<set>/  (e.g. ./flat/mobiles.png, ./glossy/vehicles.png).

------------------------------------------------------------------------------
Setup
------------------------------------------------------------------------------
    pip install --upgrade google-genai pillow

    # Vertex AI auth (Application Default Credentials):
    gcloud auth application-default login
    export GOOGLE_CLOUD_PROJECT=your-gcp-project-id
    export GOOGLE_CLOUD_LOCATION=global      # or us-central1, etc.

------------------------------------------------------------------------------
Usage
------------------------------------------------------------------------------
    python generate.py --set flat
    python generate.py --set glossy

    # Style-lock the whole set to the FIRST icon (mobiles) by passing it back
    # as a reference image for the other 15 -- gives the most cohesive set:
    python generate.py --set flat --anchor

------------------------------------------------------------------------------
Notes
------------------------------------------------------------------------------
* MODEL is the Nano Banana Pro id. If Vertex reports it unavailable in your
  region, try "global" as the location, or update MODEL below.
* image_size "2K" gives downscaling headroom; "1K" is faster/cheaper.
* Transparency is requested in the prompt; Nano Banana Pro usually honors it.
  If a file comes back with a solid background, re-run that one, or run the
  background-removal step in the sync script later.
"""

import argparse
import json
import time
from pathlib import Path

from google import genai
from google.genai import types

MODEL = "gemini-3-pro-image-preview"  # Nano Banana Pro
HERE = Path(__file__).resolve().parent


def load_prompts(set_name: str) -> list[dict]:
    path = HERE / f"prompts-{set_name}.jsonl"
    if not path.exists():
        raise SystemExit(f"Prompt file not found: {path}")
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def save_image(response, out_path: Path) -> bool:
    """Write the first image part of a response to disk. Returns True on success."""
    for part in response.parts:
        if part.inline_data and part.inline_data.data:
            out_path.write_bytes(part.inline_data.data)
            return True
    return False


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Thulobazaar category icons")
    parser.add_argument("--set", required=True, choices=["flat", "glossy"])
    parser.add_argument(
        "--anchor",
        action="store_true",
        help="Use the first generated icon as a style reference for the rest",
    )
    args = parser.parse_args()

    client = genai.Client(vertexai=True)  # reads GOOGLE_CLOUD_PROJECT / _LOCATION

    out_dir = HERE / args.set
    out_dir.mkdir(exist_ok=True)
    prompts = load_prompts(args.set)

    anchor_bytes: bytes | None = None

    for i, item in enumerate(prompts):
        out_path = out_dir / item["filename"]

        if out_path.exists():
            print(f"[{i + 1:>2}/{len(prompts)}] skipping {item['slug']} (already done)")
            if args.anchor and anchor_bytes is None:
                anchor_bytes = out_path.read_bytes()
            continue

        # Build the request. When --anchor is on and we already have the first
        # icon, prepend it as a style reference so the rest match it.
        contents: list = []
        if args.anchor and anchor_bytes is not None:
            contents.append(types.Part.from_bytes(data=anchor_bytes, mime_type="image/png"))
            contents.append(
                "Match the exact art style, color palette, lighting, line weight and "
                "level of detail of the reference image. " + item["prompt"]
            )
        else:
            contents.append(item["prompt"])

        config = types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(
                aspect_ratio=item.get("aspect_ratio", "1:1"),
                image_size=item.get("image_size", "2K"),
            ),
        )

        print(f"[{i + 1:>2}/{len(prompts)}] generating {item['slug']} ...", flush=True)
        response = client.models.generate_content(model=MODEL, contents=contents, config=config)

        if save_image(response, out_path):
            print(f"           saved -> {out_path}")
            if args.anchor and anchor_bytes is None:
                anchor_bytes = out_path.read_bytes()  # lock style to the first icon
        else:
            print(f"           !! no image returned for {item['slug']} (re-run this one)")

        time.sleep(30)  # be gentle with rate limits

    print(f"\nDone. Icons are in: {out_dir}")


if __name__ == "__main__":
    main()
