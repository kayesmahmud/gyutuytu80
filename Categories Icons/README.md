# Thulobazaar — Category Icons (16)

Generation prompts + tooling for the **16 home-page category icons**, designed to be a
**single source of truth** that looks **identical** across the desktop website, mobile web,
iOS, and Android.

> **Why we're doing this:** today each surface shows OS emoji (🔧 / 🚗 / …). An emoji is just
> a code point — Apple, Google, Microsoft and Samsung each draw it differently — so emoji can
> *never* look the same across iOS / Android / web. Shipping our own image bytes is the only
> way to get a pixel-identical look everywhere.

---

## What's in this folder

| File | Purpose |
|------|---------|
| `prompts-flat.jsonl`   | 16 ready-to-send prompts — **Flat & colorful** set (one JSON object per line) |
| `prompts-glossy.jsonl` | 16 ready-to-send prompts — **Soft 3D / glossy** set |
| `prompts.json`         | Structured style prefixes + the 16 subjects (for recombining / scripting) |
| `generate.py`          | Vertex AI script that reads a `.jsonl` and writes the PNGs |
| `README.md`            | This file |

Generated images land in subfolders: `./flat/` and `./glossy/` (created on first run).

---

## Model

**Nano Banana Pro** = `gemini-3-pro-image-preview` on **Vertex AI**.

- Aspect ratio: **1:1**
- Size: **2K** (`image_size`; downscaled later for the apps — 1K is also fine)
- Output: **PNG with transparent background** (requested in every prompt)

---

## How to generate

```bash
pip install --upgrade google-genai pillow
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT=your-gcp-project-id
export GOOGLE_CLOUD_LOCATION=global

python generate.py --set flat            # -> ./flat/*.png
python generate.py --set glossy          # -> ./glossy/*.png
```

### Cohesion tip — `--anchor`
A 16-icon set only looks professional if every icon shares the same lighting, palette and
weight. The strongest lever for that is a **reference image**: generate the first icon, then
feed it back as a style anchor for the other 15.

```bash
python generate.py --set flat --anchor
```

(You can also just review the set and re-run any icon that drifts — each line in the `.jsonl`
is independent.)

---

## The 16 categories

Filenames are keyed to the **database slug** (the real single source of truth). The two sets
use the **same filenames** — only the look differs.

| # | Icon (filename) | Category | Subject |
|---|-----------------|----------|---------|
| 1 | `mobiles.png` | Mobiles | smartphone, front-on |
| 2 | `electronics.png` | Electronics | open laptop, 3/4 angle |
| 3 | `vehicles.png` | Vehicles | compact car, 3/4 front |
| 4 | `home-living.png` | Home & Living | two-seat sofa |
| 5 | `property.png` | Property | apartment building + key |
| 6 | `pets-animals.png` | Pets & Animals | happy sitting dog |
| 7 | `mens-fashion-grooming.png` | Men's Fashion & Grooming | shirt + necktie on hanger |
| 8 | `womens-fashion-beauty.png` | Women's Fashion & Beauty | dress on hanger + lipstick |
| 9 | `hobbies-sports-kids.png` | Hobbies, Sports & Kids | soccer ball + toy blocks |
| 10 | `business-industry.png` | Business & Industry | factory + gear |
| 11 | `education.png` | Education | grad cap on books |
| 12 | `essentials.png` | Essentials | shopping basket of groceries |
| 13 | `jobs.png` | Jobs | briefcase |
| 14 | `services.png` | Services | crossed wrench + screwdriver |
| 15 | `agriculture.png` | Agriculture | green seedling sprout |
| 16 | `overseas-jobs.png` | Overseas Jobs | airplane orbiting a globe |

> ⚠️ **Filenames must match these slugs exactly** (lowercase, kebab-case). That naming is the
> glue the implementation relies on to map a category → its icon on every platform.

---

## Shared design spec (baked into every prompt)

- **Palette (locked):** rose-red `#F43F5E` (primary accent), slate `#1F2937`, amber `#FBBF24`,
  emerald `#10B981`, sky blue `#3B82F6`, off-white `#F8FAFC`.
- **Transparent background**, single centered object, even padding (~80% fill flat / ~75% glossy).
- **No text, letters, numbers, logos, or watermark.**
- **Flat set:** flat vector, no gradients/shadows. **Glossy set:** soft 3D, gentle top-left
  light, subtle gradients, soft contact shadow — but no background tile.

---

## After the icons are ready

Tell me the folder + which set you picked, and I'll wire up the **single source of truth**:

1. **Sync script** (`npm run sync:category-icons`) — copies the chosen master folder into
   `apps/web/public/category-icons/` and `apps/mobile/assets/category-icons/`.
2. **Web** — render a slug-keyed `<Image>` instead of `{category.icon}`, emoji as fallback.
3. **Mobile (Flutter)** — register the asset dir, swap `Text(emoji)` for
   `Image.asset('assets/category-icons/<slug>.png')`, and fix the mock-data override so it
   keys off the API slug (so mobile finally matches web).
4. **Unify order & slugs** so all four surfaces show the same 16, same sequence.
5. Keep the DB emoji as the universal fallback so nothing ever renders blank.
