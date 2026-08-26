#!/usr/bin/env python3
"""
Background cutout for the REALISTIC icon set using U^2-Net (via onnxruntime).

The realistic renders come back on a fake checkerboard with several light/low-saturation
subjects (white house, silver laptop, white shirt). Color/texture keying can't separate
white-subject from light-background, so we use salient-object segmentation instead.

Usage:
    python cutout_u2net.py --set realistic                       # -> realistic_processed/*.png (512, alpha)
    python cutout_u2net.py --set realistic --only property,electronics --preview "#0EA5A4"
"""
import argparse
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image
from scipy import ndimage
from scipy.ndimage import uniform_filter

HERE = Path(__file__).resolve().parent
MODEL = HERE / "models" / "u2net.onnx"
OUT_SIZE = 512
MEAN = (0.485, 0.456, 0.406)
STD = (0.229, 0.224, 0.225)

# U^2-Net returns the whole salient silhouette, so fake-checkerboard trapped INSIDE the
# subject (a cable loop, a bike frame triangle, scissor handles) survives as opaque pixels.
#
# Tone thresholds CANNOT separate those pockets from the subject: shadow slides the
# checker's tones down into the range of a shaded white object, and both are grayscale.
# Tuning bands either leaves pockets behind or erases white subjects outright (a white AC
# unit and white earbuds were deleted whole while tuning this).
#
# So match on STRUCTURE instead. The checker is one rigid grid across the whole canvas, so
# its period and phase can be measured off the border (always background) and the grid
# rebuilt everywhere. A pocket then correlates almost perfectly with that reconstruction,
# while a shaded white surface correlates ~0 -- and shadow only scales tone, which Pearson
# correlation is invariant to.
CHECKER_MAX_SAT = 14
MIN_GRID_CORRELATION = 0.55  # |pearson| between region tone and the rebuilt checker grid
MIN_POCKET_PX = 40

# Subjects whose own surface is SEMI-TRANSPARENT, so the checker legitimately shows through
# it. De-pocketing those eats the subject (tinted sunglass lenses end up with chunks bitten
# out). Leaving the checker in reads as a faint dark texture and is the lesser evil -- it is
# invisible at icon size. Re-check if the render for one of these is ever regenerated.
NO_DEPOCKET_SLUGS = {"optical-sunglasses"}


def predict_mask(session: ort.InferenceSession, img: Image.Image) -> np.ndarray:
    """Return a float mask in [0,1] at the image's resolution (rembg-style U^2-Net)."""
    im = img.convert("RGB").resize((320, 320), Image.LANCZOS)
    ary = np.array(im).astype(np.float32)
    ary = ary / max(ary.max(), 1e-6)
    tmp = np.zeros((320, 320, 3), dtype=np.float32)
    for c in range(3):
        tmp[:, :, c] = (ary[:, :, c] - MEAN[c]) / STD[c]
    tensor = np.expand_dims(tmp.transpose(2, 0, 1), 0).astype(np.float32)
    name = session.get_inputs()[0].name
    pred = session.run(None, {name: tensor})[0][0, 0, :, :]
    pred = (pred - pred.min()) / (pred.max() - pred.min() + 1e-8)
    mask = Image.fromarray((pred * 255).astype(np.uint8)).resize(img.size, Image.LANCZOS)
    return np.asarray(mask).astype(np.float32) / 255.0


def _checker_period(signal: np.ndarray) -> tuple[int, int] | None:
    """Square size and phase of a checker row/column, from its light/dark run lengths."""
    binary = signal > signal.mean()
    edges = np.flatnonzero(np.diff(binary.astype(np.int8)) != 0) + 1
    if len(edges) < 3:
        return None
    runs = np.diff(edges)
    size = int(np.median(runs))
    if size < 4:
        return None
    return size, int(edges[0] % size)


def rebuild_checker_grid(tone: np.ndarray) -> tuple[np.ndarray, int] | None:
    """Reconstruct the canvas-wide checker parity grid, measured off the image border."""
    rows = _checker_period(tone[2, :])
    cols = _checker_period(tone[:, 2])
    if rows is None or cols is None:
        return None
    size_c, phase_c = rows
    size_r, phase_r = cols
    r = ((np.arange(tone.shape[0]) - phase_r) // size_r)[:, None]
    c = ((np.arange(tone.shape[1]) - phase_c) // size_c)[None, :]
    return ((r + c) % 2).astype(np.float32), max(size_r, size_c)


def strip_checker_pockets(rgba: np.ndarray) -> int:
    """Zero the alpha of checkerboard trapped inside the silhouette. Returns pixels cut."""
    rgb = rgba[:, :, :3].astype(np.float32)
    tone = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)

    built = rebuild_checker_grid(tone)
    if built is None:
        return 0
    grid, square = built
    opaque_gray = (sat <= CHECKER_MAX_SAT) & (rgba[:, :, 3] > 0)
    if not opaque_gray.any():
        return 0

    # Correlate in a sliding window, not per connected blob: a pocket usually touches the
    # white subject that encloses it (earbuds + case + cable + pocket are one gray blob),
    # and a blob-wide correlation gets diluted to nothing. The window must span at least
    # two checker squares or it sits inside one flat square and sees no variation.
    win = max(9, 2 * square + 1)
    mean_t = uniform_filter(tone, size=win)
    mean_g = uniform_filter(grid, size=win)
    cov = uniform_filter(tone * grid, size=win) - mean_t * mean_g
    var_t = np.clip(uniform_filter(tone * tone, size=win) - mean_t**2, 0, None)
    var_g = np.clip(uniform_filter(grid * grid, size=win) - mean_g**2, 0, None)
    corr = np.abs(cov) / np.sqrt(var_t * var_g + 1e-9)

    hit = opaque_gray & (corr >= MIN_GRID_CORRELATION)
    # Drop specks so a chance correlation on a subject edge can't punch pinholes.
    labels, n = ndimage.label(hit)
    if n:
        sizes = np.bincount(labels.ravel(), minlength=n + 1)
        too_small = sizes < MIN_POCKET_PX
        too_small[0] = True
        hit &= ~too_small[labels]

    rgba[hit, 3] = 0
    return int(hit.sum())


def cutout(session, path: Path, depocket: bool = True, out_size: int = OUT_SIZE) -> tuple[Image.Image, int]:
    img = Image.open(path).convert("RGBA")
    mask = predict_mask(session, img)
    # firm up edges a touch so the product reads crisp, but keep soft anti-aliasing
    mask = np.clip((mask - 0.5) * 1.25 + 0.5, 0, 1)
    arr = np.array(img).astype(np.float32)
    arr[:, :, 3] = arr[:, :, 3] * mask
    arr = arr.astype(np.uint8)
    # De-pocket at full resolution: the RGB border still holds the untouched checker to
    # measure the grid from, and the downscale then antialiases the cut edges.
    cut = strip_checker_pockets(arr) if depocket else 0
    out = Image.fromarray(arr).resize((out_size, out_size), Image.LANCZOS)
    return out, cut


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--set", default="realistic")
    ap.add_argument("--only", default=None, help="comma list of slugs to process")
    ap.add_argument("--preview", default=None, help="hex color to composite a preview over")
    ap.add_argument("--no-depocket", action="store_true", help="keep checkerboard trapped inside the subject")
    ap.add_argument(
        "--size",
        type=int,
        default=OUT_SIZE,
        help=f"output px (default {OUT_SIZE}). Subcategory icons render at 24-64px in chips and "
        "list rows, so 256 is plenty and keeps the Flutter bundle small.",
    )
    args = ap.parse_args()

    src = HERE / args.set
    dst = HERE / f"{args.set}_processed"
    dst.mkdir(exist_ok=True)
    session = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])

    only = set(args.only.split(",")) if args.only else None
    files = sorted(f for f in src.glob("*.png") if (only is None or f.stem in only))
    for i, f in enumerate(files, 1):
        depocket = not args.no_depocket and f.stem not in NO_DEPOCKET_SLUGS
        img, cut = cutout(session, f, depocket=depocket, out_size=args.size)
        img.save(dst / f.name, "PNG", optimize=True)
        note = f"  (de-pocketed {cut}px)" if cut else ""
        print(f"[{i:>2}/{len(files)}] {f.name:30s} -> {(dst / f.name).stat().st_size // 1024} KB{note}")
        if args.preview:
            bg = Image.new("RGBA", img.size, args.preview)
            Image.alpha_composite(bg, img).convert("RGB").save(dst / f"{f.stem}_preview.jpg", quality=85)
    print(f"\nDone -> {dst}")


if __name__ == "__main__":
    main()
