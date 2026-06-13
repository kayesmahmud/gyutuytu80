#!/usr/bin/env python3
"""
Post-process raw Nano Banana icons:
  1. Cut out the baked-in 'transparency checkerboard' (it's opaque pixels) to REAL alpha.
  2. Downscale 2048 -> 512 and optimize.

Strategy: the checkerboard is light + near-grayscale and is connected to the image
border. The subject has dark outlines, so a border-connected flood fill over
'light & low-saturation' pixels removes the background without touching the subject's
interior light areas (phone screen, windshield highlight, etc.).

Usage:
    python process_icons.py --set flat                 # -> ./flat_processed/*.png
    python process_icons.py --set flat --preview teal  # also writes *_preview over a solid color
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
OUT_SIZE = 512
BRIGHT = 170      # bg pixels are at least this bright (mean RGB)
SAT = 40          # ...and this close to gray (max-min channel)

try:
    from scipy import ndimage
    HAVE_SCIPY = True
except Exception:
    HAVE_SCIPY = False


def border_connected(mask: np.ndarray) -> np.ndarray:
    """Return the subset of True pixels in `mask` that are connected to the border."""
    if HAVE_SCIPY:
        lbl, n = ndimage.label(mask)
        border_labels = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
        border_labels.discard(0)
        return np.isin(lbl, list(border_labels))
    # numpy fallback: morphological reconstruction from the border
    reach = np.zeros_like(mask)
    reach[0, :] = mask[0, :]; reach[-1, :] = mask[-1, :]
    reach[:, 0] = mask[:, 0]; reach[:, -1] = mask[:, -1]
    while True:
        nxt = reach.copy()
        nxt[1:, :] |= reach[:-1, :]
        nxt[:-1, :] |= reach[1:, :]
        nxt[:, 1:] |= reach[:, :-1]
        nxt[:, :-1] |= reach[:, 1:]
        nxt &= mask
        if np.array_equal(nxt, reach):
            return reach
        reach = nxt


def process(path: Path) -> Image.Image:
    im = Image.open(path).convert("RGBA").resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)
    arr = np.asarray(im).astype(np.int16)
    rgb = arr[:, :, :3]
    mean = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    bg_candidate = (mean >= BRIGHT) & (sat <= SAT)
    bg = border_connected(bg_candidate)

    out = arr.copy().astype(np.uint8)
    out[bg, 3] = 0  # make background fully transparent
    return Image.fromarray(out, "RGBA")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--set", required=True)
    ap.add_argument("--preview", default=None, help="solid color name/hex to composite a preview over")
    args = ap.parse_args()

    src = HERE / args.set
    dst = HERE / f"{args.set}_processed"
    dst.mkdir(exist_ok=True)

    files = sorted(src.glob("*.png"))
    for i, f in enumerate(files, 1):
        img = process(f)
        outp = dst / f.name
        img.save(outp, "PNG", optimize=True)
        print(f"[{i:>2}/{len(files)}] {f.name:32s} -> {outp.stat().st_size // 1024} KB")
        if args.preview:
            bg = Image.new("RGBA", img.size, args.preview)
            Image.alpha_composite(bg, img).convert("RGB").save(dst / f"{f.stem}_preview.jpg", quality=85)

    print(f"\nDone -> {dst}")


if __name__ == "__main__":
    main()
