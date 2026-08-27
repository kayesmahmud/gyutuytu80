import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@thulobazaar/database', () => ({
  prisma: {
    site_settings: { findUnique: vi.fn() },
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { prisma } from '@thulobazaar/database';
import { parsePrecheck, precheckAd, shouldPrecheck } from '../../services/precheck.service.js';

function deepseekReply(content: string) {
  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  };
}

function mockSettings(map: Record<string, string>) {
  vi.mocked(prisma.site_settings.findUnique).mockImplementation((async (args: any) => {
    const key = args?.where?.setting_key;
    return key in map ? { setting_value: map[key] } : null;
  }) as any);
}

const input = {
  title: 'Iphon 13 Pro',
  description: 'Lightly used',
  categoryName: 'Vehicles',
  price: 95000,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
  process.env.DEEPSEEK_API_KEY = 'test-key';
});

afterEach(() => {
  delete process.env.DEEPSEEK_API_KEY;
});

describe('parsePrecheck', () => {
  it('warns only on explicit boolean false (advisory checks stay silent when unsure)', () => {
    expect(
      parsePrecheck(
        JSON.stringify({ category_match: false, suggested_category: 'Mobiles', spelling_ok: false, corrected_title: 'iPhone 13 Pro' })
      )
    ).toEqual([
      { code: 'category_mismatch', suggestedCategory: 'Mobiles' },
      { code: 'spelling', correctedTitle: 'iPhone 13 Pro' },
    ]);
    // true / missing / drifted values all mean NO warning
    expect(parsePrecheck(JSON.stringify({ category_match: true, spelling_ok: true }))).toEqual([]);
    expect(parsePrecheck(JSON.stringify({}))).toEqual([]);
    expect(parsePrecheck(JSON.stringify({ category_match: 'false', spelling_ok: 0 }))).toEqual([]);
  });

  it('collapses garbage to zero warnings and null out non-string suggestions', () => {
    expect(parsePrecheck('not json')).toEqual([]);
    expect(parsePrecheck('[1,2]')).toEqual([]);
    expect(
      parsePrecheck(JSON.stringify({ category_match: false, suggested_category: 42, spelling_ok: false, corrected_title: '' }))
    ).toEqual([
      { code: 'category_mismatch', suggestedCategory: null },
      { code: 'spelling', correctedTitle: null },
    ]);
  });

  it('caps runaway suggestion strings at 80 chars', () => {
    const [w] = parsePrecheck(
      JSON.stringify({ category_match: false, suggested_category: 'x'.repeat(500), spelling_ok: true })
    );
    expect((w as { suggestedCategory: string }).suggestedCategory).toHaveLength(80);
  });
});

describe('shouldPrecheck', () => {
  it('is false without a key or with the switch off/missing, true when on', async () => {
    delete process.env.DEEPSEEK_API_KEY;
    expect(await shouldPrecheck()).toBe(false);

    process.env.DEEPSEEK_API_KEY = 'test-key';
    mockSettings({});
    expect(await shouldPrecheck()).toBe(false);

    mockSettings({ ai_precheck_enabled: 'true' });
    expect(await shouldPrecheck()).toBe(true);
  });
});

describe('precheckAd', () => {
  it('sends the draft as untrusted data and returns parsed warnings', async () => {
    mockFetch.mockResolvedValueOnce(
      deepseekReply(JSON.stringify({ category_match: false, suggested_category: 'Mobiles', spelling_ok: true }))
    );

    const warnings = await precheckAd(input);

    expect(warnings).toEqual([{ code: 'category_mismatch', suggestedCategory: 'Mobiles' }]);
    const body = JSON.parse(vi.mocked(mockFetch).mock.calls[0][1]!.body as string);
    const userMsg = body.messages.find((m: any) => m.role === 'user');
    const text = userMsg.content.find((c: any) => c.type === 'text').text;
    expect(text).toContain('untrusted user data');
    expect(text).toContain('Iphon 13 Pro');
    expect(text).toContain('Vehicles');
  });

  it('fails open to zero warnings on API failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    expect(await precheckAd(input)).toEqual([]);
  });
});
