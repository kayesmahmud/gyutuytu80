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
# Defaults tuned for the flat set (no cast shadow). The glossy set has a soft contact
# shadow drawn over the checkerboard, so pass a LOWER --bright to cut the gray shadow
# too (the dark navy outlines are ~42 mean and stay protected). See --bright/--sat.
DEFAULT_BRIGHT = 170   # bg pixels are at least this bright (mean RGB)
DEFAULT_SAT = 40       # ...and this close to gray (max-min channel)

from scipy import ndimage
from scipy.ndimage import uniform_filter

# Enclosed-pocket (e.g. a handle loop) checkerboard detection.
# Tone-agnostic: a checkerboard alternates two tones -> high local contrast, whereas a
# smooth glossy highlight is low-contrast. This works for both the light checker most
# icons get and the occasional DARK checker (e.g. glossy vehicles / womens-fashion).
MIN_CHECKER_TEXTURE = 6.0  # mean local std-dev; smooth highlights sit well below this
SPECK_MAX_PX = 400  # detached opaque blobs smaller than this...
SPECK_MAX_SAT = 25  # ...that are grayish are shadow remnants -> drop


def process(path: Path, bright: int, sat_thresh: int) -> Image.Image:
    im = Image.open(path).convert("RGBA").resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)
    arr = np.asarray(im).astype(np.int16)
    rgb = arr[:, :, :3]
    mean = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    bg_candidate = (mean >= bright) & (sat <= sat_thresh)

    # Local contrast — high on the checkerboard's hard edges, ~0 on smooth gradients.
    m = mean.astype(np.float32)
    lv = uniform_filter(m, size=5)
    local_std = np.sqrt(np.clip(uniform_filter(m * m, size=5) - lv * lv, 0, None))

    lbl, n = ndimage.label(bg_candidate)
    flat = lbl.ravel()
    counts = np.bincount(flat, minlength=n + 1).astype(float)
    counts[counts == 0] = 1.0
    mean_tex = np.bincount(flat, weights=local_std.ravel(), minlength=n + 1) / counts

    border = np.unique(np.concatenate([lbl[0, :], lbl[-1, :], lbl[:, 0], lbl[:, -1]]))
    remove_label = np.zeros(n + 1, dtype=bool)
    remove_label[border] = True  # outer background (border-connected)
    # enclosed checkerboard pockets (handle loops etc.): high local contrast = two-tone
    remove_label |= mean_tex >= MIN_CHECKER_TEXTURE
    remove_label[0] = False  # label 0 = the subject, never remove

    out = arr.astype(np.uint8).copy()
    out[remove_label[lbl], 3] = 0

    # Despeckle: drop tiny detached grayish opaque blobs (soft-shadow remnants),
    # while keeping small saturated detail (e.g. the dotted flight path dots).
    olbl, on = ndimage.label(out[:, :, 3] > 0)
    if on > 0:
        oflat = olbl.ravel()
        osizes = np.bincount(oflat, minlength=on + 1)
        osat = np.bincount(oflat, weights=sat.ravel(), minlength=on + 1) / np.maximum(osizes, 1)
        speck = (osizes < SPECK_MAX_PX) & (osat < SPECK_MAX_SAT)
        speck[0] = False
        out[speck[olbl], 3] = 0

    return Image.fromarray(out)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--set", required=True)
    ap.add_argument("--preview", default=None, help="solid color name/hex to composite a preview over")
    ap.add_argument("--bright", type=int, default=DEFAULT_BRIGHT)
    ap.add_argument("--sat", type=int, default=DEFAULT_SAT)
    args = ap.parse_args()

    src = HERE / args.set
    dst = HERE / f"{args.set}_processed"
    dst.mkdir(exist_ok=True)

    files = sorted(src.glob("*.png"))
    for i, f in enumerate(files, 1):
        img = process(f, args.bright, args.sat)
        outp = dst / f.name
        img.save(outp, "PNG", optimize=True)
        print(f"[{i:>2}/{len(files)}] {f.name:32s} -> {outp.stat().st_size // 1024} KB")
        if args.preview:
            bg = Image.new("RGBA", img.size, args.preview)
            Image.alpha_composite(bg, img).convert("RGB").save(dst / f"{f.stem}_preview.jpg", quality=85)

    print(f"\nDone -> {dst}")


if __name__ == "__main__":
    main()
