'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui';
import type { VerificationStatus, VerificationPricing, PricingOption, VerificationType } from './types';

export function useVerificationPage(lang: string) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [pricing, setPricing] = useState<VerificationPricing | null>(null);

  // Phone verification state
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  // Selection state
  const [selectedType, setSelectedType] = useState<VerificationType | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<PricingOption | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isResubmission, setIsResubmission] = useState(false);
  const [resubmissionDuration, setResubmissionDuration] = useState<number | null>(null);
  // 'free' | 'paid' | null. When eligible for free, user picks. Otherwise auto-set to 'paid'.
  const [selectedOffer, setSelectedOffer] = useState<'free' | 'paid' | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/auth/signin`);
      return;
    }

    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router, lang]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Auth token: NextAuth users have it on the session, legacy phone-login users
      // have it in localStorage. Fall back across both so eligibility resolves correctly.
      const sessionToken = (session as { backendToken?: string } | null)?.backendToken;
      const lsToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const authToken = sessionToken || lsToken || '';

      const [verificationResponse, pricingResponse, profileResponse] = await Promise.all([
        apiClient.getVerificationStatus().catch(() => ({ success: false, data: null })),
        fetch('/api/verification/pricing', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }).then(res => res.json()).catch(() => ({ success: false, data: null })),
        fetch('/api/profile', { credentials: 'include' })
          .then(res => res.json())
          .catch(() => ({ success: false, data: null })),
      ]);

      if (verificationResponse.success && verificationResponse.data) {
        // Transform API response to match frontend types
        // API returns: { businessVerification, individualVerification }
        // Frontend expects: { business, individual }
        const apiData = verificationResponse.data as any;
        const transformed: VerificationStatus = {
          business: apiData.businessVerification ? {
            status: apiData.businessVerification.status || 'unverified',
            rejectionReason: apiData.businessVerification.request?.rejectionReason,
            expiresAt: apiData.businessVerification.expiresAt,
            daysRemaining: apiData.businessVerification.daysRemaining,
            isExpiringSoon: apiData.businessVerification.isExpiringSoon,
            request: apiData.businessVerification.request,
          } : undefined,
          individual: apiData.individualVerification ? {
            status: apiData.individualVerification.status || 'unverified',
            rejectionReason: apiData.individualVerification.request?.rejectionReason,
            expiresAt: apiData.individualVerification.expiresAt,
            daysRemaining: apiData.individualVerification.daysRemaining,
            isExpiringSoon: apiData.individualVerification.isExpiringSoon,
            request: apiData.individualVerification.request,
          } : undefined,
        };
        setVerificationStatus(transformed);
      }

      if (pricingResponse.success && pricingResponse.data) {
        setPricing(pricingResponse.data);
      }

      if (profileResponse.success && profileResponse.data) {
        setPhoneVerified(profileResponse.data.phoneVerified || false);
        setUserPhone(profileResponse.data.phone || null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type: VerificationType) => {
    if (!phoneVerified) {
      showError('Please verify your phone number first before applying for verification.');
      return;
    }

    // Block if this type is already verified or pending
    const thisData = type === 'business' ? verificationStatus?.business : verificationStatus?.individual;
    if (thisData?.status === 'verified' || thisData?.status === 'pending') return;

    // Block if the OTHER verification type is active or pending
    const otherData = type === 'business' ? verificationStatus?.individual : verificationStatus?.business;
    const otherLabel = type === 'business' ? 'individual' : 'business';
    if (otherData?.status === 'verified') {
      showError(`You already have an active ${otherLabel} verification. Wait for it to expire before applying.`);
      return;
    }
    if (otherData?.status === 'pending') {
      showError(`You already have a pending ${otherLabel} verification request.`);
      return;
    }

    setSelectedType(type);
    setSelectedDuration(null);
    setShowForm(false);
    setIsResubmission(false);
    setResubmissionDuration(null);
    setSelectedOffer(null);

    const verificationData = type === 'business'
      ? verificationStatus?.business
      : verificationStatus?.individual;

    // Check if this is a free resubmission (rejected with already paid)
    // canResubmitFree is true when status is 'rejected' and payment_status is 'paid' or 'free'
    const canResubmitFree = verificationData?.request?.canResubmitFree ||
      (verificationData?.status === 'rejected' &&
        verificationData?.request?.paymentStatus &&
        ['paid', 'free'].includes(verificationData.request.paymentStatus));

    if (canResubmitFree && verificationData?.request?.durationDays) {
      setIsResubmission(true);
      setResubmissionDuration(verificationData.request.durationDays);
      setShowForm(true);
      return;
    }

    // If user is NOT eligible for the free offer, skip the OfferCards step entirely
    // and go straight to the paid duration selector (existing behavior).
    const eligibleForFree =
      pricing?.freeVerification.enabled &&
      pricing?.freeVerification.isEligible &&
      pricing?.freeVerification.types.includes(type);
    if (!eligibleForFree) {
      setSelectedOffer('paid');
    }
  };

  // Eligible user picked the FREE card → auto-pick the free-duration tier and open form.
  const handleSelectFreeOffer = () => {
    if (!selectedType || !pricing) return;
    const options = selectedType === 'individual' ? pricing.individual : pricing.business;
    const freeOption = options.find((o) => o.durationDays === pricing.freeVerification.durationDays);
    if (!freeOption) {
      showError('Free verification pricing tier is not configured. Contact support.');
      return;
    }
    setSelectedOffer('free');
    setSelectedDuration(freeOption);
    setShowForm(true);
  };

  // Eligible user picked the PAID card → fall through to existing duration selector.
  const handleSelectPaidOffer = () => {
    setSelectedOffer('paid');
  };

  const handleDurationSelect = (option: PricingOption) => {
    setSelectedDuration(option);
  };

  const handleProceedToForm = () => {
    if (selectedType && selectedDuration) {
      setShowForm(true);
    }
  };

  const handleFormSuccess = async () => {
    success(`${selectedType === 'individual' ? 'Individual' : 'Business'} verification submitted successfully! We will review it shortly.`);
    setShowForm(false);
    setSelectedType(null);
    setSelectedDuration(null);
    setSelectedOffer(null);
    await loadData();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    // If they came from the free offer and cancel, drop back to OfferCards
    if (selectedOffer === 'free') {
      setSelectedOffer(null);
      setSelectedDuration(null);
    }
  };

  const handleClearSelection = () => {
    setSelectedType(null);
    setSelectedDuration(null);
    setSelectedOffer(null);
  };

  // True only when user explicitly picked the FREE offer (or it's a free resubmission).
  const isFreeVerification = selectedOffer === 'free';

  // True when eligible user hasn't yet picked free vs paid → render OfferCards.
  const showOfferCards =
    !!selectedType &&
    !showForm &&
    selectedOffer === null &&
    !!pricing?.freeVerification.enabled &&
    !!pricing?.freeVerification.isEligible &&
    !!pricing?.freeVerification.types.includes(selectedType);

  return {
    status,
    loading,
    verificationStatus,
    pricing,
    phoneVerified,
    userPhone,
    selectedType,
    selectedDuration,
    showForm,
    isResubmission,
    resubmissionDuration,
    isFreeVerification,
    selectedOffer,
    showOfferCards,
    handleTypeSelect,
    handleDurationSelect,
    handleProceedToForm,
    handleFormSuccess,
    handleFormCancel,
    handleClearSelection,
    handleSelectFreeOffer,
    handleSelectPaidOffer,
  };
}
