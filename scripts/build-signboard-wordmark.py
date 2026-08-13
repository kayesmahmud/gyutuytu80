#!/usr/bin/env python3
"""Prepare the horizontal THULO-BAZAAR wordmark used by the signboard generator.

The supplied artwork is white-on-transparent EXCEPT for the cart's wheel ring,
which is baked in as an opaque dull red (#C52434) rather than left transparent.
Against the real brand red (#DC143C) that prints as a visibly darker donut inside
the cart, so this script converts the ring back to transparency: the signboard's
own background then shows through and matches exactly, on any background.

It also trims the artwork's horizontal padding so the renderer's slot maths can
treat the image bounds as the wordmark's true ink bounds.

    python3 scripts/build-signboard-wordmark.py [source.png]
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = Path("/Users/elw/Documents/App_Design/Thulo Doc/signboard logo .png")
TARGET = ROOT / "apps/web/public/assets/signboard/wordmark-horizontal-white.png"

ALPHA_THRESHOLD = 16
# Green separates the two inks cleanly: the ring sits near 36, white ink at 255.
# Red does not (197 vs 255), so it would misclassify the antialiased edges.
GREEN_CHANNEL = 1


def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    img = Image.open(source).convert("RGBA")
    px = np.array(img)
    rgb = px[:, :, :3].astype(np.float32)
    alpha = px[:, :, 3].astype(np.float32)

    # The darkest opaque pixel is the ring's solid fill; use its green as the
    # backdrop the artwork was flattened against instead of hard-coding a value.
    opaque = alpha > 200
    ink_green = rgb[:, :, GREEN_CHANNEL]
    backdrop_green = float(ink_green[opaque].min()) if opaque.any() else 0.0

    # Treat the artwork as white ink flattened over that backdrop, and recover the
    # coverage it must have had. Multiplying by the existing alpha keeps already
    # transparent areas transparent and preserves the outer antialiased edges.
    whiteness = np.clip(
        (ink_green - backdrop_green) / (255.0 - backdrop_green), 0.0, 1.0
    )
    recovered = np.rint(alpha * whiteness).astype(np.uint8)

    # Force pure white so no red fringe survives in the antialiased pixels.
    white = np.full(recovered.shape + (3,), 255, dtype=np.uint8)
    out = Image.fromarray(np.dstack([white, recovered]), "RGBA")

    ys, xs = np.where(recovered > ALPHA_THRESHOLD)
    out = out.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    out.save(TARGET, optimize=True)

    leftover = int(((np.array(out)[:, :, 3] > 200)).sum())
    print(f"source            {source.name}  {img.width}x{img.height}")
    print(f"backdrop green    {backdrop_green:.0f}  (ring fill treated as transparent)")
    print(f"wrote             {TARGET.relative_to(ROOT)}  {out.width}x{out.height}")
    print(f"  aspect ratio    {out.width / out.height:.5f}")
    print(f"  opaque px       {leftover}")


if __name__ == "__main__":
    main()
