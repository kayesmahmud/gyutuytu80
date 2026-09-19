'use client';

/**
 * Editor-side AI screening panel for a verification request.
 *
 * Shows the advisory verdict (the AI never approves/rejects), the staff-facing
 * reason, the name the AI read off the document, and — on pending requests —
 * an editable "name to verify" field so editors can fix a typo or
 * capitalisation and approve in one go instead of bouncing the applicant.
 */

export interface VerificationAiFields {
  aiVerdict?: string | null;
  aiReasonCode?: string | null;
  aiReason?: string | null;
  aiNameOnDocument?: string | null;
  editedAt?: string | null;
}

const REASON_LABELS: Record<string, string> = {
  wrong_document_type: 'Wrong document type',
  missing_back: 'Back side missing',
  missing_selfie: 'Selfie with ID missing',
  selfie_mismatch: 'Selfie does not match ID',
  unreadable: 'Document not readable',
  name_mismatch: 'Name does not match document',
  suspected_fake: 'Suspected fake / tampered',
  other: 'Needs changes',
};

export function VerificationAiBadge({ fields }: { fields: VerificationAiFields }) {
  const v = fields.aiVerdict;
  if (!v) return null;
  const styles: Record<string, string> = {
    looks_good: 'bg-green-100 text-green-800 border-green-200',
    needs_changes: 'bg-amber-100 text-amber-800 border-amber-200',
    unsure: 'bg-gray-100 text-gray-700 border-gray-200',
    skipped: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const label =
    v === 'looks_good'
      ? 'AI: looks good'
      : v === 'needs_changes'
        ? `AI: ${REASON_LABELS[fields.aiReasonCode ?? 'other'] ?? 'Needs changes'}`
        : v === 'unsure'
          ? 'AI: unsure'
          : 'AI: not screened';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[v] ?? styles.unsure}`}>
      ✨ {label}
    </span>
  );
}

export function VerificationAiPanel({
  fields,
  nameLabel,
  name,
  onNameChange,
  editable,
}: {
  fields: VerificationAiFields;
  /** e.g. "Name to be verified" / "Business name to be verified" */
  nameLabel: string;
  name: string;
  onNameChange: (value: string) => void;
  /** Only pending requests can have their name corrected. */
  editable: boolean;
}) {
  const docName = fields.aiNameOnDocument?.trim() || null;
  const differs = docName !== null && docName.toLowerCase() !== name.trim().toLowerCase();

  return (
    <div className="mb-4 space-y-3">
      {editable && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            {nameLabel} <span className="normal-case font-normal text-gray-400">— edit if the spelling or capitalisation is wrong</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full sm:max-w-md px-3 py-2 border border-gray-300 rounded-lg text-base font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {docName && (
            <div className="mt-1 text-xs text-gray-600 flex flex-wrap items-center gap-2">
              <span>
                On the document: <span className="font-medium text-gray-900">{docName}</span>
              </span>
              {differs && (
                <button
                  type="button"
                  onClick={() => onNameChange(docName)}
                  className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-medium"
                >
                  Use this name
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {(fields.aiVerdict || fields.editedAt) && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            fields.aiVerdict === 'needs_changes'
              ? 'bg-amber-50 border-amber-200'
              : fields.aiVerdict === 'looks_good'
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <VerificationAiBadge fields={fields} />
            {fields.editedAt && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                ✏️ Edited by applicant{' '}
                {new Date(fields.editedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {fields.aiVerdict === 'needs_changes' && (
              <span className="text-xs text-amber-800">applicant was asked to fix this</span>
            )}
          </div>
          {fields.aiReason && <div className="text-gray-700">{fields.aiReason}</div>}
          {!editable && docName && (
            <div className="text-xs text-gray-600 mt-1">
              On the document: <span className="font-medium text-gray-900">{docName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
