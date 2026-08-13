/**
 * Shrink-to-fit text measurement.
 *
 * A signboard is printed once and bolted to a wall, so text must never overflow
 * its slot and must never be truncated with an ellipsis — a shop's name has to
 * appear in full. The only safe lever is font size, so we binary-search the
 * largest size whose wrapped lines fit the box on both axes.
 */

export interface TextFitRequest {
  text: string;
  maxWidth: number;
  maxHeight: number;
  weight: number;
  fontFamily: string;
  maxFontSize: number;
  maxLines: number;
  /** Baseline-to-baseline distance as a multiple of font size. */
  lineHeight: number;
}

export interface TextFit {
  fontSize: number;
  lines: string[];
  /** Widest line's real ink width. */
  width: number;
  /** Ink above the first baseline and below the last — real metrics, not the
   *  font's em box, so blocks can be centred on what the eye actually sees. */
  ascent: number;
  descent: number;
  lineStep: number;
  inkHeight: number;
}

/** Bisection depth. 24 halvings of a <1000px range settles well below a pixel. */
const SEARCH_STEPS = 24;

export function fontString(weight: number, fontSize: number, fontFamily: string): string {
  return `${weight} ${fontSize}px ${fontFamily}`;
}

/**
 * Greedy word wrap. Returns null when the text needs more than `maxLines`, or
 * when a single unbreakable word is wider than the box — both mean "too big",
 * which tells the search to keep shrinking.
 */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (ctx.measureText(word).width > maxWidth) return null;

    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length > maxLines) return null;
  }
  lines.push(current);

  return lines.length <= maxLines ? lines : null;
}

function measure(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  fontSize: number,
  lineHeight: number
): Omit<TextFit, 'fontSize' | 'lines'> {
  let width = 0;
  for (const line of lines) {
    width = Math.max(width, ctx.measureText(line).width);
  }

  const first = ctx.measureText(lines[0] ?? '');
  const last = ctx.measureText(lines[lines.length - 1] ?? '');
  const ascent = first.actualBoundingBoxAscent;
  const descent = last.actualBoundingBoxDescent;
  const lineStep = fontSize * lineHeight;

  return {
    width,
    ascent,
    descent,
    lineStep,
    inkHeight: (lines.length - 1) * lineStep + ascent + descent,
  };
}

export function fitText(ctx: CanvasRenderingContext2D, req: TextFitRequest): TextFit {
  const { text, maxWidth, maxHeight, weight, fontFamily, maxLines, lineHeight } = req;

  const attempt = (fontSize: number): TextFit | null => {
    ctx.font = fontString(weight, fontSize, fontFamily);
    const lines = wrapLines(ctx, text, maxWidth, maxLines);
    if (!lines) return null;

    const metrics = measure(ctx, lines, fontSize, lineHeight);
    if (metrics.inkHeight > maxHeight) return null;
    return { fontSize, lines, ...metrics };
  };

  // The whole box is a valid answer surprisingly often (short names, tall slots),
  // so try it before paying for the search.
  const full = attempt(req.maxFontSize);
  if (full) return full;

  let low = 0;
  let high = req.maxFontSize;
  let best: TextFit | null = null;

  for (let step = 0; step < SEARCH_STEPS; step += 1) {
    const mid = (low + high) / 2;
    const fit = attempt(mid);
    if (fit) {
      best = fit;
      low = mid;
    } else {
      high = mid;
    }
  }

  // Nothing fit at any size — only reachable with a degenerate box. Render the
  // text at the floor rather than throwing, so the preview still shows what is
  // wrong instead of going blank.
  if (!best) {
    ctx.font = fontString(weight, 1, fontFamily);
    const lines = [text];
    return { fontSize: 1, lines, ...measure(ctx, lines, 1, lineHeight) };
  }

  return best;
}
