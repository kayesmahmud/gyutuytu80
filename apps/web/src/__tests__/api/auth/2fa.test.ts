import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import { POST as setupPOST } from '@/app/api/auth/2fa/setup/route';
import { POST as verifySetupPOST } from '@/app/api/auth/2fa/verify-setup/route';
import { POST as disablePOST } from '@/app/api/auth/2fa/disable/route';

const mockedGetServerSession = vi.mocked(getServerSession);

function jsonRequest(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function backendJson(payload: Record<string, unknown>, status = 200) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

const authedSession = { user: { id: '1' }, backendToken: 'backend-token' } as never;

describe('2FA proxy routes', () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('setup returns 401 without a session', async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const res = await setupPOST();
    expect(res.status).toBe(401);
  });

  it('setup forwards to the backend with the bearer token', async () => {
    mockedGetServerSession.mockResolvedValue(authedSession);
    const fetchMock = backendJson({ success: true, data: { qrCode: 'q', secret: 's' } });
    vi.stubGlobal('fetch', fetchMock);

    const res = await setupPOST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.secret).toBe('s');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/2fa/setup'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer backend-token' }),
      })
    );
  });

  it('verify-setup forwards the code and returns backup codes', async () => {
    mockedGetServerSession.mockResolvedValue(authedSession);
    const fetchMock = backendJson({ success: true, data: { backupCodes: ['aaa', 'bbb'] } });
    vi.stubGlobal('fetch', fetchMock);

    const res = await verifySetupPOST(
      jsonRequest('http://localhost:3333/api/auth/2fa/verify-setup', { code: '123456' })
    );
    const data = await res.json();

    expect(data.data.backupCodes).toEqual(['aaa', 'bbb']);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/2fa/verify-setup'),
      expect.objectContaining({ body: JSON.stringify({ code: '123456' }) })
    );
  });

  it('disable forwards password + code', async () => {
    mockedGetServerSession.mockResolvedValue(authedSession);
    const fetchMock = backendJson({ success: true });
    vi.stubGlobal('fetch', fetchMock);

    const res = await disablePOST(
      jsonRequest('http://localhost:3333/api/auth/2fa/disable', {
        password: 'pw',
        code: '654321',
      })
    );
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/2fa/disable'),
      expect.objectContaining({ body: JSON.stringify({ password: 'pw', code: '654321' }) })
    );
  });

  it('disable returns 401 without a backend token', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: '1' } } as never);
    const res = await disablePOST(
      jsonRequest('http://localhost:3333/api/auth/2fa/disable', { password: 'pw', code: '654321' })
    );
    expect(res.status).toBe(401);
  });
});
