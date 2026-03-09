'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { PaymentMethodSelector } from '@/components/payment';
import type { PaymentGateway } from '@/lib/paymentGateways/types';
import { usePromotionPricing, type PromotionType, type Duration } from './hooks/usePromotionPricing';
import { PromotionTypeSelector } from './PromotionTypeSelector';
import { DurationSelector } from './DurationSelector';
import { PriceSummary } from './PriceSummary';
import { CampaignBanner } from './CampaignBanner';
import { AccountTypeBadge } from './AccountTypeBadge';

// ============================================================================
// Types
// ============================================================================

interface PromoteAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: {
    id: number;
    title: string;
    isFeatured?: boolean;
    isUrgent?: boolean;
    isSticky?: boolean;
  };
  onPromote?: () => void;
}

type Step = 'select' | 'payment';

// ============================================================================
// Tier Labels
// ============================================================================

const tierLabels: Record<string, string> = {
  default: 'Standard',
  electronics: 'Electronics',
  vehicles: 'Vehicles',
  property: 'Property',
};

// ============================================================================
// Component
// ============================================================================

interface ActivePromotion {
  promotion_type: string;
  expires_at: string;
  days_remaining: number;
}

export default function PromoteAdModal({ isOpen, onClose, ad, onPromote }: PromoteAdModalProps) {
  // Selection state
  const [selectedType, setSelectedType] = useState<PromotionType>('featured');
  const [selectedDuration, setSelectedDuration] = useState<Duration>(7);
  const [step, setStep] = useState<Step>('select');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentGateway | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePromotion, setActivePromotion] = useState<ActivePromotion | null>(null);

  // Pricing hook
  const {
    pricingTier,
    userAccountType,
    activeCampaign,
    fetchPricing,
    checkUserAccountType,
    fetchActiveCampaigns,
    calculatePrice,
    getAccountDiscount,
    getPriceAfterAccountDiscount,
    setActiveCampaign,
  } = usePromotionPricing({ adId: ad.id });

  // Fetch data on open
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedPaymentMethod(null);
      setActiveCampaign(null);
      setActivePromotion(null);
      setError(null);

      Promise.all([
        fetchPricing().catch((err) => setError(err.message)),
        checkUserAccountType(),
        fetchActiveCampaigns(),
        fetch(`/api/promotions/ad/${ad.id}`)
          .then((r) => r.json())
          .then((res) => {
            if (res.success && res.data) {
              setActivePromotion(res.data);
            }
          })
          .catch(() => {}),
      ]);
    }
  }, [isOpen, ad.id, fetchPricing, checkUserAccountType, fetchActiveCampaigns, setActiveCampaign]);

  // Calculate prices
  const { currentPrice, originalPrice, totalDiscount, savings } = calculatePrice(selectedType, selectedDuration);
  const accountDiscount = getAccountDiscount();
  const priceAfterAccountDiscount = getPriceAfterAccountDiscount(originalPrice);

  // Handlers
  const handleProceedToPayment = () => {
    setStep('payment');
    setError(null);
  };

  const handleBackToSelection = () => {
    setStep('select');
    setSelectedPaymentMethod(null);
    setError(null);
  };

  const handlePromote = async () => {
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gateway: selectedPaymentMethod,
          amount: currentPrice,
          paymentType: 'ad_promotion',
          relatedId: ad.id,
          orderName: `Promote Ad: ${ad.title}`,
          metadata: {
            adId: ad.id,
            promotionType: selectedType,
            durationDays: selectedDuration,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl;
      } else {
        throw new Error(data.message || 'Payment initiation failed');
      }
    } catch (err: any) {
      console.error('Promotion error:', err);
      setError(err.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isDevelopment = process.env.NODE_ENV === 'development' ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <ModalHeader
          step={step}
          adTitle={ad.title}
          onClose={onClose}
        />

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Error Alert */}
          {error && <ErrorAlert message={error} />}

          {step === 'select' ? (
            <SelectionStep
              pricingTier={pricingTier}
              tierLabels={tierLabels}
              activeCampaign={activeCampaign}
              userAccountType={userAccountType}
              selectedType={selectedType}
              onSelectType={setSelectedType}
              selectedDuration={selectedDuration}
              onSelectDuration={setSelectedDuration}
              currentPrice={currentPrice}
              originalPrice={originalPrice}
              totalDiscount={totalDiscount}
              savings={savings}
              accountDiscount={accountDiscount}
              priceAfterAccountDiscount={priceAfterAccountDiscount}
              onProceed={handleProceedToPayment}
              onClose={onClose}
              activePromotion={activePromotion}
            />
          ) : (
            <PaymentStep
              selectedType={selectedType}
              selectedDuration={selectedDuration}
              currentPrice={currentPrice}
              selectedPaymentMethod={selectedPaymentMethod}
              onSelectPaymentMethod={setSelectedPaymentMethod}
              loading={loading}
              isDevelopment={isDevelopment}
              onPay={handlePromote}
              onBack={handleBackToSelection}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ModalHeader({ step, adTitle, onClose }: { step: Step; adTitle: string; onClose: () => void }) {
  return (
    <div className="sticky top-0 bg-gradient-to-r from-primary to-purple-600 text-white p-4 sm:p-6 rounded-t-2xl z-10">
      <div className="flex justify-between items-center">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold">
            {step === 'select' ? 'Promote Your Ad' : 'Complete Payment'}
          </h2>
          <p className="text-sm opacity-90 mt-1 truncate">{adTitle}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors ml-2 flex-shrink-0"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mt-4">
        <StepIndicator number={1} label="Select Plan" isActive={step === 'select'} />
        <div className="w-8 h-0.5 bg-white/30" />
        <StepIndicator number={2} label="Payment" isActive={step === 'payment'} />
      </div>
    </div>
  );
}

function StepIndicator({ number, label, isActive }: { number: number; label: string; isActive: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
        isActive ? 'bg-white text-purple-600' : 'bg-white/30 text-white'
      }`}>
        {number}
      </span>
      <span className="text-sm hidden sm:inline">{label}</span>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800 flex items-start gap-2">
      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

function SelectionStep({
  pricingTier,
  tierLabels,
  activeCampaign,
  userAccountType,
  selectedType,
  onSelectType,
  selectedDuration,
  onSelectDuration,
  currentPrice,
  originalPrice,
  totalDiscount,
  savings,
  accountDiscount,
  priceAfterAccountDiscount,
  onProceed,
  onClose,
  activePromotion,
}: {
  pricingTier: string;
  tierLabels: Record<string, string>;
  activeCampaign: any;
  userAccountType: any;
  selectedType: PromotionType;
  onSelectType: (type: PromotionType) => void;
  selectedDuration: Duration;
  onSelectDuration: (duration: Duration) => void;
  currentPrice: number;
  originalPrice: number;
  totalDiscount: number;
  savings: number;
  accountDiscount: number;
  priceAfterAccountDiscount: number;
  onProceed: () => void;
  onClose: () => void;
  activePromotion: ActivePromotion | null;
}) {
  return (
    <>
      {/* Active Promotion Banner */}
      {activePromotion && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900">
                Active {activePromotion.promotion_type.charAt(0).toUpperCase() + activePromotion.promotion_type.slice(1)} Promotion
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                This ad already has an active promotion.{' '}
                {activePromotion.days_remaining > 0
                  ? `Expires in ${activePromotion.days_remaining} day${activePromotion.days_remaining !== 1 ? 's' : ''}`
                  : 'Expires today'}{' '}
                ({new Date(activePromotion.expires_at).toLocaleDateString()}).
              </p>
              <p className="text-sm text-blue-600 mt-1">
                You can purchase a new promotion after the current one expires.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Tier Badge */}
      {pricingTier !== 'default' && (
        <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-amber-800">
              <strong>{tierLabels[pricingTier] || pricingTier}</strong> category pricing applies to this ad
            </span>
          </div>
        </div>
      )}

      {/* Active Campaign Banner */}
      {activeCampaign && <CampaignBanner campaign={activeCampaign} />}

      {/* Account Type Badge */}
      <AccountTypeBadge accountType={userAccountType} />

      {/* Promotion Type Selection */}
      <PromotionTypeSelector selectedType={selectedType} onSelect={onSelectType} />

      {/* Duration Selection */}
      <DurationSelector selectedDuration={selectedDuration} onSelect={onSelectDuration} />

      {/* Price Summary */}
      <PriceSummary
        currentPrice={currentPrice}
        originalPrice={originalPrice}
        totalDiscount={totalDiscount}
        savings={savings}
        accountDiscount={accountDiscount}
        priceAfterAccountDiscount={priceAfterAccountDiscount}
        userAccountType={userAccountType}
        activeCampaign={activeCampaign}
      />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button
          onClick={onProceed}
          variant="primary"
          disabled={!!activePromotion}
          className="flex-1 bg-gradient-to-r from-primary to-purple-600 py-3 sm:py-4 text-base sm:text-lg order-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {activePromotion ? 'Promotion Already Active' : 'Proceed to Payment'}
        </Button>
        <Button
          onClick={onClose}
          variant="secondary"
          className="px-6 sm:px-8 py-3 sm:py-4 order-2"
        >
          Cancel
        </Button>
      </div>
    </>
  );
}

function PaymentStep({
  selectedType,
  selectedDuration,
  currentPrice,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  loading,
  isDevelopment,
  onPay,
  onBack,
}: {
  selectedType: PromotionType;
  selectedDuration: Duration;
  currentPrice: number;
  selectedPaymentMethod: PaymentGateway | null;
  onSelectPaymentMethod: (method: PaymentGateway) => void;
  loading: boolean;
  isDevelopment: boolean;
  onPay: () => void;
  onBack: () => void;
}) {
  return (
    <>
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Order Summary
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Promotion Type:</span>
            <span className="font-medium capitalize">{selectedType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">{selectedDuration} days</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-800 font-semibold">Total Amount:</span>
            <span className="text-lg font-bold text-rose-600">NPR {currentPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment Method Selector */}
      <PaymentMethodSelector
        selectedMethod={selectedPaymentMethod}
        onSelect={onSelectPaymentMethod}
        amount={currentPrice}
        disabled={loading}
        showTestInfo={isDevelopment}
      />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
        <Button
          onClick={onPay}
          variant="primary"
          loading={loading}
          disabled={loading || !selectedPaymentMethod}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 py-3 sm:py-4 text-base sm:text-lg order-1"
        >
          {loading ? 'Processing...' : `Pay NPR ${currentPrice.toLocaleString()}`}
        </Button>
        <Button
          onClick={onBack}
          variant="secondary"
          disabled={loading}
          className="px-6 sm:px-8 py-3 sm:py-4 order-2"
        >
          Back
        </Button>
      </div>

      {/* Security Note */}
      <p className="text-center text-xs text-gray-400 mt-4">
        You will be redirected to {selectedPaymentMethod === 'khalti' ? 'Khalti' : selectedPaymentMethod === 'esewa' ? 'eSewa' : 'payment gateway'} to complete your payment securely.
      </p>
    </>
  );
}
