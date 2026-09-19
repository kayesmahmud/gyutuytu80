import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@thulobazaar/database', () => ({
  prisma: {
    site_settings: { findUnique: vi.fn() },
    individual_verification_requests: { findUnique: vi.fn(), updateMany: vi.fn() },
    business_verification_requests: { findUnique: vi.fn(), updateMany: vi.fn() },
  },
}));

vi.mock('../../services/notification.service.js', () => ({
  notifyEditors: vi.fn().mockResolvedValue(undefined),
  sendNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/ai/images.js', () => ({
  imagesToDataUrls: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { prisma } from '@thulobazaar/database';
import { notifyEditors, sendNotification } from '../../services/notification.service.js';
import { imagesToDataUrls } from '../../lib/ai/images.js';
import {
  parseScreenVerdict,
  precheckIndividual,
  buildScreenText,
  screenVerificationRequest,
  NEEDS_CHANGES_MIN_CONFIDENCE,
  LOOKS_GOOD_MIN_CONFIDENCE,
} from '../../services/verificationScreen.service.js';

function deepseekReply(content: string) {
  return { ok: true, json: async () => ({ choices: [{ message: { content } }] }) };
}

function mockSettings(map: Record<string, string>) {
  vi.mocked(prisma.site_settings.findUnique).mockImplementation((async (args: any) => {
    const key = args?.where?.setting_key;
    return key in map ? { setting_value: map[key] } : null;
  }) as any);
}

const pendingIndividual = {
  user_id: 7,
  status: 'pending',
  full_name: 'Ram Bahadur Thapa',
  id_document_type: 'citizenship',
  id_document_number: '12-34-56',
  id_document_front: 'front.avif',
  id_document_back: 'back.avif',
  selfie_with_id: 'selfie.avif',
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DEEPSEEK_API_KEY = 'test-key';
  mockSettings({ ai_verification_screen_enabled: 'true' });
  vi.mocked(prisma.individual_verification_requests.updateMany).mockResolvedValue({ count: 1 } as any);
  vi.mocked(prisma.business_verification_requests.updateMany).mockResolvedValue({ count: 1 } as any);
  // Each slot converts to one data URL (the service converts slots one at a time).
  vi.mocked(imagesToDataUrls).mockImplementation(async (paths) => paths.map((p) => `data:${p}`));
});

describe('parseScreenVerdict', () => {
  it('accepts a confident needs_changes with a whitelisted code', () => {
    const r = parseScreenVerdict(
      JSON.stringify({ verdict: 'needs_changes', reason_code: 'missing_selfie', reason: 'No card in hand', name_on_document: 'RAM BAHADUR THAPA', confidence: 0.92 })
    );
    expect(r).toMatchObject({ verdict: 'needs_changes', reasonCode: 'missing_selfie', nameOnDocument: 'RAM BAHADUR THAPA' });
  });

  it('downgrades a hesitant needs_changes to unsure — a wrong one messages the applicant', () => {
    const r = parseScreenVerdict(
      JSON.stringify({ verdict: 'needs_changes', reason_code: 'unreadable', reason: 'maybe blurry', confidence: NEEDS_CHANGES_MIN_CONFIDENCE - 0.01 })
    );
    expect(r.verdict).toBe('unsure');
    expect(r.reasonCode).toBeNull();
  });

  it('downgrades needs_changes with an unknown or missing code to unsure', () => {
    expect(parseScreenVerdict(JSON.stringify({ verdict: 'needs_changes', reason_code: 'looks_fake_to_me', confidence: 0.99 })).verdict).toBe('unsure');
    expect(parseScreenVerdict(JSON.stringify({ verdict: 'needs_changes', confidence: 0.99 })).verdict).toBe('unsure');
  });

  it('requires an even higher bar for looks_good', () => {
    expect(parseScreenVerdict(JSON.stringify({ verdict: 'looks_good', confidence: LOOKS_GOOD_MIN_CONFIDENCE })).verdict).toBe('looks_good');
    expect(parseScreenVerdict(JSON.stringify({ verdict: 'looks_good', confidence: LOOKS_GOOD_MIN_CONFIDENCE - 0.01 })).verdict).toBe('unsure');
  });

  it('collapses garbage, wrong shapes and unknown verdicts to unsure', () => {
    expect(parseScreenVerdict('not json').verdict).toBe('unsure');
    expect(parseScreenVerdict('[1,2]').verdict).toBe('unsure');
    expect(parseScreenVerdict(JSON.stringify({ verdict: 'approve', confidence: 1 })).verdict).toBe('unsure');
    // out-of-range confidence is out-of-schema, not clamped
    expect(parseScreenVerdict(JSON.stringify({ verdict: 'looks_good', confidence: 1.5 })).verdict).toBe('unsure');
  });

  it('keeps name_on_document even on an unsure verdict, so staff can still use it', () => {
    const r = parseScreenVerdict(JSON.stringify({ verdict: 'unsure', name_on_document: 'Sita Devi', confidence: 0.3 }));
    expect(r.nameOnDocument).toBe('Sita Devi');
  });
});

describe('precheckIndividual', () => {
  it('flags a missing selfie without spending a model call', () => {
    expect(precheckIndividual({ ...pendingIndividual, selfie_with_id: null })).toMatchObject({
      verdict: 'needs_changes',
      reasonCode: 'missing_selfie',
      confidence: 1,
    });
  });

  it('requires the back side for citizenship and driving licence only', () => {
    expect(precheckIndividual({ ...pendingIndividual, id_document_back: null })?.reasonCode).toBe('missing_back');
    expect(precheckIndividual({ ...pendingIndividual, id_document_type: 'driving_license', id_document_back: null })?.reasonCode).toBe('missing_back');
    expect(precheckIndividual({ ...pendingIndividual, id_document_type: 'passport', id_document_back: null })).toBeNull();
    expect(precheckIndividual({ ...pendingIndividual, id_document_type: 'pan', id_document_back: null })).toBeNull();
  });

  it('passes a complete submission on to the model', () => {
    expect(precheckIndividual(pendingIndividual)).toBeNull();
  });
});

describe('buildScreenText', () => {
  it('labels the photos in order and marks the fields untrusted', () => {
    const text = buildScreenText(
      'individual',
      { name: 'Ram Thapa', documentType: 'citizenship', documentNumber: '12-34' },
      ['ID front', 'ID back', 'selfie holding the ID']
    );
    expect(text).toContain('untrusted user data');
    expect(text).toContain('Declared document type: citizenship certificate');
    expect(text).toContain('Declared name: Ram Thapa');
    expect(text).toContain('[1] ID front, [2] ID back, [3] selfie holding the ID');
  });

  it('uses business wording for business submissions', () => {
    const text = buildScreenText('business', { name: 'Thapa Traders', documentType: 'pan_card', documentNumber: null }, ['business document']);
    expect(text).toContain('Declared business name: Thapa Traders');
    expect(text).toContain('Declared document type: business PAN card');
    expect(text).toContain('Declared document number: not specified');
  });
});

describe('screenVerificationRequest', () => {
  it('does nothing when the switch is off', async () => {
    mockSettings({ ai_verification_screen_enabled: 'false' });
    vi.mocked(prisma.individual_verification_requests.findUnique).mockResolvedValue(pendingIndividual as any);
    await screenVerificationRequest('individual', 1);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(prisma.individual_verification_requests.updateMany).not.toHaveBeenCalled();
  });

  it('stamps needs_changes, notifies the applicant, and never touches status', async () => {
    vi.mocked(prisma.individual_verification_requests.findUnique).mockResolvedValue(pendingIndividual as any);
    mockFetch.mockResolvedValueOnce(
      deepseekReply(JSON.stringify({ verdict: 'needs_changes', reason_code: 'name_mismatch', reason: 'Card says Shyam Thapa', name_on_document: 'Shyam Thapa', confidence: 0.95 }))
    );

    await screenVerificationRequest('individual', 1);

    const data = vi.mocked(prisma.individual_verification_requests.updateMany).mock.calls[0][0].data as Record<string, unknown>;
    expect(data).toMatchObject({ ai_verdict: 'needs_changes', ai_reason_code: 'name_mismatch', ai_name_on_document: 'Shyam Thapa' });
    expect(data).not.toHaveProperty('status');
    expect(vi.mocked(sendNotification).mock.calls[0][0]).toMatchObject({
      recipientUserIds: [7],
      type: 'verification_needs_changes',
      data: { route: '/verification', verificationType: 'individual', reasonCode: 'name_mismatch' },
    });
    expect(vi.mocked(sendNotification).mock.calls[0][0].body).toContain('name does not match');
    expect(notifyEditors).not.toHaveBeenCalled();
  });

  it('sends the three labelled photos plus the declared fields to the model', async () => {
    vi.mocked(prisma.individual_verification_requests.findUnique).mockResolvedValue(pendingIndividual as any);
    mockFetch.mockResolvedValueOnce(deepseekReply(JSON.stringify({ verdict: 'looks_good', confidence: 0.97 })));

    await screenVerificationRequest('individual', 1);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const content = body.messages[1].content;
    expect(content.filter((c: any) => c.type === 'image_url')).toHaveLength(3);
    expect(content[3].text).toContain('[1] ID front, [2] ID back, [3] selfie holding the ID');
    expect(content[3].text).toContain('Declared name: Ram Bahadur Thapa');
    expect(body.messages[0].content).toContain('NEVER approve or reject');
  });

  it('looks_good is recorded quietly — no applicant message', async () => {
    vi.mocked(prisma.individual_verification_requests.findUnique).mockResolvedValue(pendingIndividual as any);
    mockFetch.mockResolvedValueOnce(deepseekReply(JSON.stringify({ verdict: 'looks_good', reason: 'All good', name_on_document: 'Ram Bahadur Thapa', confidence: 0.97 })));

    await screenVerificationRequest('individual', 1);

    const data = vi.mocked(prisma.individual_verification_requests.updateMany).mock.calls[0][0].data as Record<string, unknown>;
    expect(data.ai_verdict).toBe('looks_good');
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('uses the deterministic precheck for a missing selfie (no model call)', async () => {
    vi.mocked(prisma.individual_verification_requests.findUnique).mockResolvedValue({ ...pendingIndividual, selfie_with_id: null } as any);

    await screenVerificationRequest('individual', 1);

    expect(mockFetch).not.toHaveBeenCalled();
    const data = vi.mocked(prisma.individual_verification_requests.updateMany).mock.calls[0][0].data as Record<string, unknown>;
    expect(data).toMatchObject({ ai_verdict: 'needs_changes', ai_reason_code: 'missing_selfie' });
    expect(vi.mocked(sendNotification).mock.calls[0][0].body).toContain('selfie');
  });

  it('a suspected fake also alerts editors', async () => {
    vi.mocked(prisma.individual_verification_requests.findUnique).mockResolvedValue(pendingIndividual as any);
    mockFetch.mockResolvedValueOnce(
      deepseekReply(JSON.stringify({ verdict: 'needs_changes', reason_code: 'suspected_fake', reason: 'Screenshot of a card from a website', confidence: 0.9 }))
    );

    await screenVerificationRequest('individual', 1, { edited: true });

    expect(vi.mocked(notifyEditors).mock.calls[0][0]).toMatchObject({ type: 'verification_requested', referenceId: 1 });
    expect(vi.mocked(notifyEditors).mock.calls[0][0].title).toContain('Possible fake');
    expect(vi.mocked(notifyEditors).mock.calls[0][0].body).toContain('after an edit');
  });

  it('leaves the row untouched when the AI is unavailable', async () => {
    vi.mocked(prisma.individual_verification_requests.findUnique).mockResolvedValue(pendingIndividual as any);
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'boom' });

    await screenVerificationRequest('individual', 1);

    expect(prisma.individual_verification_requests.updateMany).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('skips a request that is no longer pending', async () => {
    vi.mocked(prisma.individual_verification_requests.findUnique).mockResolvedValue({ ...pendingIndividual, status: 'approved' } as any);
    await screenVerificationRequest('individual', 1);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('business: a PDF document is stamped skipped, not screened', async () => {
    vi.mocked(prisma.business_verification_requests.findUnique).mockResolvedValue({
      user_id: 9, status: 'pending', business_name: 'Thapa Traders', business_license_document: 'reg.pdf', document_type: 'business_license', document_number: null,
    } as any);
    vi.mocked(imagesToDataUrls).mockResolvedValue([]);

    await screenVerificationRequest('business', 3);

    expect(mockFetch).not.toHaveBeenCalled();
    const data = vi.mocked(prisma.business_verification_requests.updateMany).mock.calls[0][0].data as Record<string, unknown>;
    expect(data.ai_verdict).toBe('skipped');
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('business: name mismatch notifies with business wording', async () => {
    vi.mocked(prisma.business_verification_requests.findUnique).mockResolvedValue({
      user_id: 9, status: 'pending', business_name: 'Thapa Traders', business_license_document: 'reg.avif', document_type: 'pan_card', document_number: '600123',
    } as any);
    mockFetch.mockResolvedValueOnce(
      deepseekReply(JSON.stringify({ verdict: 'needs_changes', reason_code: 'name_mismatch', reason: 'PAN is in a person\'s name', name_on_document: 'Ram Thapa', confidence: 0.9 }))
    );

    await screenVerificationRequest('business', 3);

    const data = vi.mocked(prisma.business_verification_requests.updateMany).mock.calls[0][0].data as Record<string, unknown>;
    expect(data).toMatchObject({ ai_verdict: 'needs_changes', ai_reason_code: 'name_mismatch', ai_name_on_document: 'Ram Thapa' });
    expect(vi.mocked(sendNotification).mock.calls[0][0].body).toContain('Your business verification');
  });

  it('never throws — a DB failure is logged and swallowed', async () => {
    vi.mocked(prisma.individual_verification_requests.findUnique).mockRejectedValue(new Error('db down'));
    await expect(screenVerificationRequest('individual', 1)).resolves.toBeUndefined();
  });
});
