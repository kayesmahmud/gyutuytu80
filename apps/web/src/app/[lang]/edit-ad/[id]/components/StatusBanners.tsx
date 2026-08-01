'use client';

interface RejectionBannerProps {
  rejectionReason: string;
}

export function RejectionBanner({ rejectionReason }: RejectionBannerProps) {
  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 border-l-[6px] border-l-red-600 rounded-xl p-6 mb-8 shadow">
      <div className="flex gap-4 items-start">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-bold text-red-900">Your Ad Was Rejected</h3>
            <span className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
              Action Required
            </span>
          </div>
          <p className="text-sm font-semibold text-red-800 mb-2">Reason from editor:</p>
          <p className="text-sm text-red-700 bg-white/70 p-3 rounded-lg border border-red-200 mb-4">
            {rejectionReason}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2 items-start">
              <span className="text-xl flex-shrink-0">ℹ️</span>
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">What to do next:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Fix the issues mentioned in the rejection reason above</li>
                  <li>Update your ad details in the form below</li>
                  <li>Click &quot;Update Ad&quot; - your ad will automatically be resubmitted for review</li>
                  <li>You&apos;ll receive a notification once the editor reviews it again</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditsRemainingLine({ editsRemaining, editLimit }: { editsRemaining?: number; editLimit?: number }) {
  if (editsRemaining === undefined || editLimit === undefined) return null;
  return (
    <p className="text-sm font-semibold mt-2 text-gray-700">
      {editsRemaining > 0
        ? `You can edit this ad ${editsRemaining} more time${editsRemaining === 1 ? '' : 's'} this month (limit: ${editLimit}/month).`
        : `You have used all ${editLimit} edits for this ad this month — saving is blocked until next month.`}
    </p>
  );
}

/** Live ad, normal/individual-verified user: editing sends it back to review. */
export function LiveEditReviewBanner({ editsRemaining, editLimit }: { editsRemaining?: number; editLimit?: number }) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 border-l-[6px] border-l-amber-600 rounded-xl p-6 mb-8 shadow">
      <div className="flex gap-4 items-start">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-900 mb-3">This ad is live — editing sends it back to review</h3>
          <p className="text-sm text-amber-800 mb-2">
            If you save changes, this ad will go <strong>offline</strong> and move back to the
            Pending tab. Our editors will review your changes and it will go live again once
            approved.
          </p>
          <p className="text-sm text-amber-700">
            Only edit if you really need to fix something (typo, wrong category, price, photos…).
          </p>
          <EditsRemainingLine editsRemaining={editsRemaining} editLimit={editLimit} />
        </div>
      </div>
    </div>
  );
}

/** Live ad, trusted business user: edits publish instantly. */
export function LiveEditDirectBanner({ editsRemaining, editLimit }: { editsRemaining?: number; editLimit?: number }) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 border-l-[6px] border-l-blue-600 rounded-xl p-6 mb-8 shadow">
      <div className="flex gap-4 items-start">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">⚡</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Your edits go live instantly</h3>
          <p className="text-sm text-blue-800 mb-2">
            As a verified business, your changes publish immediately without editor review.
            Please double-check everything is accurate before saving.
          </p>
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> repeated misleading edits can remove this privilege — your
            future edits would then need editor review like everyone else.
          </p>
          <EditsRemainingLine editsRemaining={editsRemaining} editLimit={editLimit} />
        </div>
      </div>
    </div>
  );
}
