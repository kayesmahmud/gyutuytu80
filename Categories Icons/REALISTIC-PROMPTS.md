# Thulobazaar — Realistic Category Icons (bikroy.com style)

A third icon set for the 16 home-page categories, in the **photorealistic product-render**
style of bikroy.com's category icons (reference images live in
`/Users/elw/Documents/Web/thulobazaar/Ref icon`).

---

## Style analysis of the reference (bikroy.com)

Looking at the 13 reference icons, the style is consistent:

| Trait | What they do |
|-------|--------------|
| **Rendering** | Photorealistic 3D product renders / catalog product photography — NOT cartoon, flat, or outlined |
| **Materials** | Real, true-to-life textures: leather grain, brushed metal, glossy car paint, fabric, fur, slate roof, glass |
| **Colors** | **Natural, true-to-life colors** (brown leather, white house, blue car, red dress) — NOT a forced brand palette |
| **Lighting** | Soft, even studio lighting; gentle highlights and reflections |
| **Shadow** | Subtle soft contact shadow under the object |
| **Angle** | Single object, slight three-quarter angle, centered |
| **Background** | Clean / transparent (the PNGs have real alpha), no scene, no props, no text |
| **Detail** | High detail, sharp focus, premium e-commerce look |

> **Important (your feedback):** unlike the flat/glossy sets, we do **NOT** force the brand red
> here. Realism comes first — each object uses its natural colors. A brand-red object is fine
> only where it's natural (e.g. a red dress), never forced across the set.

---

## How to use

**Best results — give Nano Banana Pro a reference image** so it matches bikroy's realism, then
let it swap the subject. Two ways:

1. With the project pipeline (recommended):
   ```bash
   # generate.py now supports the realistic set + an external style reference
   python generate.py --set realistic --ref "/Users/elw/Documents/Web/thulobazaar/Ref icon/jobs-x3.png"
   ```
   The `--ref` image is sent as a style anchor for every icon (realism, lighting, finish),
   while each prompt supplies the subject.

2. Or paste a prompt below into Nano Banana Pro manually, attaching one bikroy reference image
   and saying *"match this art style and lighting."*

**Output:** 1:1, 2K, transparent PNG, named by category slug (list below). Then we process +
sync exactly like before (`process_icons.py` → `npm run sync:category-icons realistic`).

---

## Master style (prepended to every subject)

```text
Photorealistic 3D product render of <SUBJECT>. Studio product-photography lighting: soft, even
illumination from the top-left, realistic materials, textures and true-to-life natural colors,
subtle reflections, and a soft realistic contact shadow directly beneath the object. Shown at a
slight three-quarter angle, sharp focus, ultra-detailed, premium e-commerce catalog quality. The
single object is centered and fills about 80% of the square frame with clean even margins. Fully
transparent background (alpha) — no scene, no floor texture, no extra props beyond the subject,
no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution,
photorealistic (NOT cartoon, NOT flat, NOT illustrated, NO outlines).
```

**Negative prompt:** `cartoon, illustration, flat design, 2d, vector, drawing, sketch, outline,
low detail, blurry, text, letters, numbers, words, watermark, logo, extra objects, busy
background, scene, floor`

---

## The 16 subjects (our database slugs → filenames)

| # | filename | category | `subject` |
|---|----------|----------|-----------|
| 1 | `mobiles.png` | Mobiles | a modern flagship smartphone standing at a slight three-quarter angle, glossy glass back and a screen powered on with a colorful abstract wallpaper, realistic metal frame |
| 2 | `electronics.png` | Electronics | a modern slim laptop open at about 110 degrees at a three-quarter angle, brushed aluminium body, screen glowing softly |
| 3 | `vehicles.png` | Vehicles | a modern compact car with glossy paint at a three-quarter front angle, realistic reflections on the body and windows |
| 4 | `home-living.png` | Home & Living | a cozy upholstered fabric armchair with soft cushions and wooden legs, slight three-quarter angle |
| 5 | `property.png` | Property | a modern two-storey family house with a pitched roof, large windows and a small porch, three-quarter architectural render |
| 6 | `pets-animals.png` | Pets & Animals | an adorable golden retriever puppy sitting and facing forward, soft realistic fur, friendly expression |
| 7 | `mens-fashion-grooming.png` | Men's Fashion & Grooming | a neatly folded crisp men's dress shirt with a rolled necktie and a classic wristwatch resting on top, realistic fabric and leather |
| 8 | `womens-fashion-beauty.png` | Women's Fashion & Beauty | an elegant dress on a wooden hanger beside a lipstick and a small perfume bottle, realistic fabric and glass |
| 9 | `hobbies-sports-kids.png` | Hobbies, Sports & Kids | a realistic soccer ball next to a small stack of colorful wooden kids building blocks |
| 10 | `business-industry.png` | Business & Industry | a realistic industrial manufacturing machine with metal gears and pipes, brushed steel |
| 11 | `education.png` | Education | a neat stack of hardcover books with a black graduation mortarboard cap and golden tassel resting on top |
| 12 | `essentials.png` | Essentials | a brown paper grocery bag filled with fresh groceries — leafy vegetables, a baguette and a milk carton |
| 13 | `jobs.png` | Jobs | a premium brown leather briefcase with metal clasps and visible stitching, slight three-quarter angle |
| 14 | `services.png` | Services | a realistic cordless power drill and a chrome adjustable wrench resting together |
| 15 | `agriculture.png` | Agriculture | a young green seedling plant with fresh leaves growing from rich dark soil in a small terracotta pot |
| 16 | `overseas-jobs.png` | Overseas Jobs | a realistic passport with a boarding pass and a small model airplane resting on top, suggesting working abroad |

Filenames must match these exact slugs (lowercase, kebab-case) — that's how the sync script and
both apps map a category to its icon.

The fully-assembled, ready-to-send prompts are in **`prompts-realistic.jsonl`** (one per line).

---

## Ready-to-paste prompts (Vertex AI · Nano Banana Pro)

In **Vertex AI → Media Studio**, pick model **Nano Banana Pro** (`gemini-3-pro-image-preview`),
set **Aspect ratio 1:1** and **Resolution 2K**. For the closest bikroy match, **upload one bikroy
reference image** (e.g. `Ref icon/jobs-x3.png`) and add: *"Match this art style, rendering,
lighting and realism."* Then paste each prompt below and save the output as the given filename.

**1 — save as `mobiles.png`**
> Photorealistic 3D product render of a modern flagship smartphone standing at a slight three-quarter angle, glossy glass back and a screen powered on with a colorful abstract wallpaper, realistic metal frame. Studio product-photography lighting: soft even illumination from the top-left, realistic materials, textures and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the object. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The single object is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no extra props, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**2 — save as `electronics.png`**
> Photorealistic 3D product render of a modern slim laptop open at about 110 degrees, viewed at a three-quarter angle, brushed aluminium body, screen glowing softly. Studio product-photography lighting: soft even illumination from the top-left, realistic materials, textures and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the object. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The single object is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no extra props, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**3 — save as `vehicles.png`**
> Photorealistic 3D product render of a modern compact car with glossy paint, viewed from a three-quarter front angle, realistic reflections on the body and windows. Studio product-photography lighting: soft even illumination from the top-left, realistic materials, textures and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the object. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The single object is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no extra props, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**4 — save as `home-living.png`**
> Photorealistic 3D product render of a cozy upholstered fabric armchair with soft cushions and wooden legs, slight three-quarter angle. Studio product-photography lighting: soft even illumination from the top-left, realistic materials, textures and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the object. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The single object is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no extra props, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**5 — save as `property.png`**
> Photorealistic 3D architectural render of a modern two-storey family house with a pitched roof, large windows and a small porch, viewed at a three-quarter angle. Studio product-photography lighting: soft even illumination from the top-left, realistic materials, textures and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the object. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The single building is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no ground texture, no extra props, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**6 — save as `pets-animals.png`**
> Photorealistic 3D render of an adorable golden retriever puppy sitting and facing forward, soft realistic fur, friendly expression, lifelike eyes. Studio product-photography lighting: soft even illumination from the top-left, realistic materials, textures and true-to-life natural colors, and a soft realistic contact shadow directly beneath the puppy. Sharp focus, ultra-detailed, premium catalog quality. The single subject is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no extra props, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**7 — save as `mens-fashion-grooming.png`**
> Photorealistic 3D product render of a neatly folded crisp men's dress shirt with a rolled necktie and a classic wristwatch resting on top, realistic fabric weave and leather strap. Studio product-photography lighting: soft even illumination from the top-left, realistic materials, textures and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the objects. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The arrangement is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**8 — save as `womens-fashion-beauty.png`**
> Photorealistic 3D product render of an elegant dress on a wooden hanger beside a lipstick and a small perfume bottle, realistic fabric drape and glass. Studio product-photography lighting: soft even illumination from the top-left, realistic materials, textures and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the objects. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The arrangement is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**9 — save as `hobbies-sports-kids.png`**
> Photorealistic 3D product render of a realistic soccer ball next to a small stack of colorful wooden kids building blocks. Studio product-photography lighting: soft even illumination from the top-left, realistic materials, textures and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the objects. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The arrangement is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**10 — save as `business-industry.png`**
> Photorealistic 3D product render of a realistic industrial manufacturing machine with metal gears and pipes, brushed steel and painted metal panels. Studio product-photography lighting: soft even illumination from the top-left, realistic materials, textures and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the object. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The single object is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no extra props, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**11 — save as `education.png`**
> Photorealistic 3D product render of a neat stack of hardcover books with a black graduation mortarboard cap and a golden tassel resting on top, realistic paper, cloth and matte board textures. Studio product-photography lighting: soft even illumination from the top-left, realistic materials and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the books. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The arrangement is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**12 — save as `essentials.png`**
> Photorealistic 3D product render of a brown paper grocery bag filled with fresh groceries including leafy green vegetables, a baguette and a milk carton, realistic produce and packaging textures. Studio product-photography lighting: soft even illumination from the top-left, realistic materials and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the bag. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The arrangement is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**13 — save as `jobs.png`**
> Photorealistic 3D product render of a premium brown leather briefcase with metal clasps and visible stitching, viewed at a slight three-quarter angle, realistic leather grain. Studio product-photography lighting: soft even illumination from the top-left, realistic materials, textures and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the object. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The single object is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no extra props, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**14 — save as `services.png`**
> Photorealistic 3D product render of a realistic cordless power drill and a chrome adjustable wrench resting together, realistic plastic, rubber grip and polished metal. Studio product-photography lighting: soft even illumination from the top-left, realistic materials, textures and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the tools. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The arrangement is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**15 — save as `agriculture.png`**
> Photorealistic 3D product render of a young green seedling plant with fresh leaves growing from rich dark soil in a small terracotta pot, realistic leaves, soil and clay textures. Studio product-photography lighting: soft even illumination from the top-left, realistic materials and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the pot. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The single subject is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

**16 — save as `overseas-jobs.png`**
> Photorealistic 3D product render of a realistic passport with a boarding pass tucked inside and a small model airplane resting on top, suggesting working abroad, realistic paper, cover and metal textures. Studio product-photography lighting: soft even illumination from the top-left, realistic materials and true-to-life natural colors, subtle reflections, and a soft realistic contact shadow directly beneath the objects. Sharp focus, ultra-detailed, premium e-commerce catalog quality. The arrangement is centered and fills about 80% of the square frame with clean even margins. Fully transparent background (alpha), no scene, no floor texture, no readable text, no letters, no numbers, no logos, no watermark. Square 1:1, 2K, high resolution, photorealistic, NOT cartoon, NOT flat, NOT illustrated, no outlines.

---

## After you generate
Drop the 16 PNGs in `Categories Icons/realistic/`, then I'll:
1. `python process_icons.py --set realistic` (cut any baked checkerboard → transparent, downscale 512)
2. `npm run sync:category-icons realistic` (copy into web + mobile)
3. Quick QA on teal + white, commit, push, deploy.

We may also switch the tile background to **white** for this set (product-photo look sits better
on white than gray) — we'll decide once we see them.
