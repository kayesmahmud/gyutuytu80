/**
 * Centralized DeepSeek client — the single place ALL AI features call.
 *
 * Current consumers: ad moderation (Phase 1).
 * Planned: autofill-from-photos (Phase 2), AI support chat, and future features —
 * add a new service that builds messages and calls chatCompletion(); never
 * duplicate fetch/key/timeout handling per feature.
 *
 * Fail-open by design: the API key is optional. When it is missing or the API
 * is down, callers get { ok: false } and must degrade gracefully — AI being
 * down must never block a core flow like posting an ad.
 */

// Overridable for local testing against a stub (and future proxy/regional endpoints)
const DEEPSEEK_API_URL =
  process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';

/** Vision-capable model; images are billed at <=384 tokens each at V4-Flash rates. */
export const DEEPSEEK_VISION_MODEL = 'deepseek-v4-flash-vision-exp';

const DEFAULT_TIMEOUT_MS = 15_000;
// V4 models spend HIDDEN reasoning tokens that count against max_tokens
// (usage.completion_tokens_details.reasoning_tokens). A tight cap makes the
// visible answer come back truncated or empty whenever the model thinks long
// (e.g. price estimation), so give generous headroom — typical calls still
// use well under 1k output tokens.
const DEFAULT_MAX_TOKENS = 3000;

/** OpenAI-compatible multimodal content block. Images go in user messages only. */
export type AiContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

// Plain shape (not a discriminated union): apps/api compiles with strict:false,
// where union narrowing on a boolean discriminant doesn't work reliably.
export type AiChatResult = {
  ok: boolean;
  /** Model reply text — present when ok */
  content?: string;
  /** Failure description — present when !ok */
  error?: string;
};

export function isAiConfigured(): boolean {
  return !!process.env.DEEPSEEK_API_KEY;
}

export async function chatCompletion(params: {
  system: string;
  user: string | AiContentBlock[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  /** Ask for response_format json_object. The prompt must still say "JSON". */
  jsonMode?: boolean;
  timeoutMs?: number;
}): Promise<AiChatResult> {
  // The experimental vision endpoint intermittently returns 200 with empty
  // content — one retry recovers most of those without meaningfully delaying
  // the fail-open path.
  const first = await chatCompletionOnce(params);
  if (first.ok || first.error !== 'DeepSeek returned no content') return first;
  return chatCompletionOnce(params);
}

async function chatCompletionOnce(params: {
  system: string;
  user: string | AiContentBlock[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
}): Promise<AiChatResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return { ok: false, error: 'DEEPSEEK_API_KEY not configured' };

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model || DEEPSEEK_VISION_MODEL,
        messages: [
          { role: 'system', content: params.system },
          { role: 'user', content: params.user },
        ],
        ...(params.jsonMode ? { response_format: { type: 'json_object' } } : {}),
        max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: params.temperature ?? 0,
      }),
      signal: AbortSignal.timeout(params.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return { ok: false, error: `DeepSeek HTTP ${response.status}: ${body.slice(0, 300)}` };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content) {
      return { ok: false, error: 'DeepSeek returned no content' };
    }
    return { ok: true, content };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
