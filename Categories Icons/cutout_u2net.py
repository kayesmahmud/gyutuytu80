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

HERE = Path(__file__).resolve().parent
MODEL = HERE / "models" / "u2net.onnx"
OUT_SIZE = 512
MEAN = (0.485, 0.456, 0.406)
STD = (0.229, 0.224, 0.225)


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


def cutout(session, path: Path) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    mask = predict_mask(session, img)
    # firm up edges a touch so the product reads crisp, but keep soft anti-aliasing
    mask = np.clip((mask - 0.5) * 1.25 + 0.5, 0, 1)
    out = np.array(img).astype(np.float32)
    out[:, :, 3] = out[:, :, 3] * mask
    out = Image.fromarray(out.astype(np.uint8)).resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--set", default="realistic")
    ap.add_argument("--only", default=None, help="comma list of slugs to process")
    ap.add_argument("--preview", default=None, help="hex color to composite a preview over")
    args = ap.parse_args()

    src = HERE / args.set
    dst = HERE / f"{args.set}_processed"
    dst.mkdir(exist_ok=True)
    session = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])

    only = set(args.only.split(",")) if args.only else None
    files = sorted(f for f in src.glob("*.png") if (only is None or f.stem in only))
    for i, f in enumerate(files, 1):
        img = cutout(session, f)
        img.save(dst / f.name, "PNG", optimize=True)
        print(f"[{i:>2}/{len(files)}] {f.name:30s} -> {(dst / f.name).stat().st_size // 1024} KB")
        if args.preview:
            bg = Image.new("RGBA", img.size, args.preview)
            Image.alpha_composite(bg, img).convert("RGB").save(dst / f"{f.stem}_preview.jpg", quality=85)
    print(f"\nDone -> {dst}")


if __name__ == "__main__":
    main()
