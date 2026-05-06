'use client';

import { useState } from 'react';
import type { VerificationPricing, VerificationType } from './types';

interface OfferCardsProps {
  selectedType: VerificationType;
  pricing: VerificationPricing;
  onSelectFree: () => void;
  onSelectPaid: () => void;
  onClear: () => void;
}

export function OfferCards({ selectedType, pricing, onSelectFree, onSelectPaid, onClear }: OfferCardsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const freeDays = pricing.freeVerification.durationDays;
  const freeMonths = Math.max(1, Math.round(freeDays / 30));
  const typeLabel = selectedType === 'individual' ? 'Individual' : 'Business';

  const handleFreeClick = () => setShowConfirm(true);
  const handleConfirmFree = () => {
    setShowConfirm(false);
    onSelectFree();
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl mb-8 sm:mb-12">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
          Choose your {typeLabel.toLowerCase()} verification plan
        </h2>
        <button
          onClick={onClear}
          aria-label="Close"
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <FreeCard freeMonths={freeMonths} onClick={handleFreeClick} />
        <PaidCard onClick={onSelectPaid} />
      </div>

      {showConfirm && (
        <FreeConfirmModal
          freeMonths={freeMonths}
          onConfirm={handleConfirmFree}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

function FreeCard({ freeMonths, onClick }: { freeMonths: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative text-left bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-300 hover:border-green-400 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-lg flex flex-col"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="text-3xl sm:text-4xl">🎁</div>
        <div>
          <div className="text-lg sm:text-xl font-bold text-green-900">
            FREE — {freeMonths === 1 ? '1 Month' : `${freeMonths} Months`}
          </div>
          <div className="text-sm text-green-700 font-medium">Welcome to Thulo Bazaar!</div>
        </div>
      </div>

      <ul className="space-y-2 mb-4 flex-1">
        <li className="flex items-start gap-2 text-sm text-gray-700">
          <span className="text-green-600 mt-0.5">✓</span>
          <span>New here? Get {freeMonths * 30} days verification on us — no payment needed</span>
        </li>
        <li className="flex items-start gap-2 text-sm text-gray-700">
          <span className="text-green-600 mt-0.5">✓</span>
          <span>Just submit your ID</span>
        </li>
      </ul>

      <div className="bg-green-100/60 border border-green-200 rounded-lg p-3 mb-4 text-xs text-green-900">
        <span className="font-semibold">ⓘ One-time welcome gift.</span> You'll need to subscribe later to keep your verified status.
      </div>

      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-4 rounded-xl text-center group-hover:from-green-600 group-hover:to-emerald-700 transition-colors">
        Get My Free Verification →
      </div>
    </button>
  );
}

function PaidCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative text-left bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-300 hover:border-indigo-400 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-lg flex flex-col"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="text-3xl sm:text-4xl">💎</div>
        <div>
          <div className="text-lg sm:text-xl font-bold text-indigo-900">PAID — Choose duration</div>
          <div className="text-sm text-indigo-700 font-medium">Pay for longer coverage</div>
        </div>
      </div>

      <ul className="space-y-2 mb-4 flex-1">
        <li className="flex items-start gap-2 text-sm text-gray-700">
          <span className="text-indigo-600 mt-0.5">✓</span>
          <span>1 month / 3 months / 6 months / 1 year</span>
        </li>
        <li className="flex items-start gap-2 text-sm text-gray-700">
          <span className="text-indigo-600 mt-0.5">✓</span>
          <span>Campaign discounts apply automatically</span>
        </li>
        <li className="flex items-start gap-2 text-sm text-gray-700">
          <span className="text-indigo-600 mt-0.5">✓</span>
          <span>Pay via eSewa / Khalti</span>
        </li>
      </ul>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-4 rounded-xl text-center group-hover:from-indigo-600 group-hover:to-purple-700 transition-colors">
        Choose Paid Plan →
      </div>
    </button>
  );
}

function FreeConfirmModal({
  freeMonths,
  onConfirm,
  onCancel,
}: {
  freeMonths: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-4">
          <div className="text-3xl">🎁</div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Confirm Free Verification</h3>
        </div>
        <p className="text-sm sm:text-base text-gray-700 mb-6 leading-relaxed">
          You're claiming your one-time free {freeMonths === 1 ? '1-month' : `${freeMonths}-month`} verification.
          This is a launch offer for new users — once used, you'll need to subscribe to renew or extend your
          verification.
        </p>
        <p className="text-sm font-semibold text-gray-900 mb-6">Ready to continue?</p>
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-600 hover:to-emerald-700 transition-colors shadow-md"
          >
            Yes, Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
