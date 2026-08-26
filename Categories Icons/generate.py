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

MODEL = "gemini-3-pro-image"  # Nano Banana Pro (GA; the -preview id was retired)
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
    parser.add_argument(
        "--set",
        required=True,
        help="Prompt set name; reads prompts-<set>.jsonl (flat, glossy, realistic, subcategories)",
    )
    parser.add_argument(
        "--prompts",
        default=None,
        help="Override the prompt file while keeping --set's output folder. Lets a second "
        "worker chew the same set from the other end; both skip files the other finished.",
    )
    parser.add_argument(
        "--anchor",
        action="store_true",
        help="Use the first generated icon as a style reference for the rest",
    )
    parser.add_argument(
        "--ref",
        default=None,
        help="External style-reference image applied to EVERY icon (e.g. a bikroy reference) "
        "so the whole set matches its style/realism. Overrides --anchor.",
    )
    args = parser.parse_args()
    ref_bytes = Path(args.ref).read_bytes() if args.ref else None

    # 2K Nano Banana Pro renders regularly exceed 60s; 90s was tight enough to 504.
    client = genai.Client(vertexai=True, http_options=types.HttpOptions(timeout=240000))

    out_dir = HERE / args.set
    out_dir.mkdir(exist_ok=True)
    if args.prompts:
        path = Path(args.prompts) if Path(args.prompts).is_absolute() else HERE / args.prompts
        prompts = [json.loads(line) for line in path.read_text().splitlines() if line.strip()]
    else:
        prompts = load_prompts(args.set)

    anchor_bytes: bytes | None = None

    for i, item in enumerate(prompts):
        out_path = out_dir / item["filename"]

        if out_path.exists():
            print(f"[{i + 1:>2}/{len(prompts)}] skipping {item['slug']} (already done)")
            if args.anchor and anchor_bytes is None:
                anchor_bytes = out_path.read_bytes()
            continue

        # Build the request. A style reference (external --ref, else the first generated
        # icon when --anchor is on) is prepended so the set stays cohesive.
        style_ref = ref_bytes if ref_bytes is not None else (anchor_bytes if args.anchor else None)
        contents: list = []
        if style_ref is not None:
            contents.append(types.Part.from_bytes(data=style_ref, mime_type="image/png"))
            contents.append(
                "Match the exact art style, rendering, lighting, materials and level of "
                "realism/detail of the reference image, but depict the subject described here. "
                + item["prompt"]
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
        for attempt in range(1, 6):
            try:
                response = client.models.generate_content(model=MODEL, contents=contents, config=config)
                break
            except Exception as e:
                print(f"           attempt {attempt} failed: {e}", flush=True)
                if attempt == 5:
                    print(f"           !! giving up on {item['slug']} after 5 attempts")
                    response = None
                    break
                wait = 30 * attempt
                print(f"           retrying in {wait}s ...", flush=True)
                time.sleep(wait)

        if response and save_image(response, out_path):
            print(f"           saved -> {out_path}")
            if args.anchor and anchor_bytes is None:
                anchor_bytes = out_path.read_bytes()  # lock style to the first icon
        elif response:
            print(f"           !! no image returned for {item['slug']} (re-run this one)")

        time.sleep(30)  # be gentle with rate limits

    print(f"\nDone. Icons are in: {out_dir}")


if __name__ == "__main__":
    main()
