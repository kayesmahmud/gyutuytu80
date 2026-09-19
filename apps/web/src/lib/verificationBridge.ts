/**
 * Next.js → Express verification bridge.
 *
 * The Next.js verification routes create the request rows directly, but the
 * AI document screening lives in Express (lib/ai core). After saving, they ask
 * Express (/api/internal/verification-screen) to screen the row — the same
 * fire-and-forget shape as supportBridge: the user's request never fails
 * because the side effect did, and a 403 is logged loudly rather than lost.
 */
import { createToken } from '@/lib/auth';

const backendUrl = () =>
  process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function requestVerificationScreen(
  kind: 'individual' | 'business',
  requestId: number,
  edited = false
): void {
  fetch(`${backendUrl()}/api/internal/verification-screen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.INTERNAL_API_SECRET, kind, requestId, edited }),
  })
    .then((res) => {
      if (!res.ok) {
        console.error(
          `Verification screen bridge rejected: ${res.status} for ${kind} #${requestId}` +
            (res.status === 403 ? ' — check INTERNAL_API_SECRET in the web container' : '')
        );
      }
    })
    .catch((err) => console.error('Verification screen bridge failed (non-critical):', err.message));
}

/**
 * Owner edit of a PENDING request. Uploads any re-taken files through the
 * Express upload endpoints, then applies the edit via Express PUT (which
 * marks the row edited and re-screens it) — one implementation for web + app.
 */
export async function forwardVerificationEdit(
  kind: 'individual' | 'business',
  userId: number,
  formData: FormData,
  incomingToken: string | undefined
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const token = incomingToken || (await createToken({ userId, email: '', role: 'user' }));
  const headers = { Authorization: `Bearer ${token}` };
  const api = backendUrl();

  const text = (key: string): string | undefined => {
    const v = formData.get(key);
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
  };
  const file = (key: string): File | null => {
    const v = formData.get(key);
    return v instanceof File && v.size > 0 ? v : null;
  };

  if (kind === 'individual') {
    const slots = ['id_document_front', 'id_document_back', 'selfie_with_id'] as const;
    const upload = new FormData();
    let hasFiles = false;
    for (const slot of slots) {
      const f = file(slot);
      if (f) {
        upload.append(slot, f);
        hasFiles = true;
      }
    }
    let documentUrls: Record<string, unknown> = {};
    if (hasFiles) {
      const res = await fetch(`${api}/api/verification/individual/upload`, { method: 'POST', headers, body: upload });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, status: res.status, body };
      documentUrls = body.data ?? {};
    }
    const res = await fetch(`${api}/api/verification/individual`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentUrls,
        fullName: text('full_name'),
        idDocumentType: text('id_document_type'),
        idDocumentNumber: formData.get('id_document_number')?.toString(),
      }),
    });
    return { ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) };
  }

  let licenseDocument: string | undefined;
  const doc = file('business_license_document');
  if (doc) {
    const upload = new FormData();
    upload.append('business_license_document', doc);
    const res = await fetch(`${api}/api/verification/business/upload`, { method: 'POST', headers, body: upload });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, body };
    licenseDocument = body.data?.filename;
  }
  const res = await fetch(`${api}/api/verification/business`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      licenseDocument,
      businessName: text('business_name'),
      documentType: text('document_type'),
      documentNumber: formData.get('document_number')?.toString(),
    }),
  });
  return { ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) };
}
