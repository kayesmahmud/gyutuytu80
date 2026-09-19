'use client';

import { ChangeEvent, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { PaymentMethodSelector } from '@/components/payment';
import { useVerificationForm } from '@/hooks/useVerificationForm';
import {
  VerificationModal,
  FormAlert,
  PlanSummary,
  FormTips,
  OrderSummary,
} from '@/components/verification';
import DocumentFileInput from './DocumentFileInput';

interface FormData {
  fullName: string;
  idType: 'citizenship' | 'passport' | 'driving_license' | 'pan';
  idNumber: string;
  idFrontFile: File | null;
  idBackFile: File | null;
  selfieFile: File | null;
}

interface IndividualVerificationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  durationDays: number;
  price: number;
  isFreeVerification: boolean;
  isResubmission?: boolean;
  /** Present when correcting a PENDING request: fields prefill, photos are optional. */
  editRequest?: { fullName?: string | null; idDocumentType?: string | null; idDocumentNumber?: string | null } | null;
}

const initialFormData: FormData = {
  fullName: '',
  idType: 'citizenship',
  idNumber: '',
  idFrontFile: null,
  idBackFile: null,
  selfieFile: null,
};

export default function IndividualVerificationForm({
  onSuccess,
  onCancel,
  durationDays,
  price,
  isFreeVerification,
  isResubmission = false,
  editRequest = null,
}: IndividualVerificationFormProps) {
  const t = useTranslations('verification');
  const isEdit = !!editRequest;
  const {
    formData,
    setFormData,
    loading,
    error,
    step,
    selectedPaymentMethod,
    setError,
    setSelectedPaymentMethod,
    handleProceedToPayment,
    handleBackToForm,
    submitFreeVerification,
    submitEdit,
    submitPaidVerification,
  } = useVerificationForm<FormData>(
    editRequest
      ? {
          ...initialFormData,
          fullName: editRequest.fullName ?? '',
          idType: (editRequest.idDocumentType as FormData['idType']) || 'citizenship',
          idNumber: editRequest.idDocumentNumber ?? '',
        }
      : initialFormData,
    {
    type: 'individual',
    durationDays,
    price,
    isFreeVerification,
    isResubmission,
    onSuccess,
  });

  // Handle text input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Handle file input changes
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      setError(null);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!formData.idNumber.trim()) {
      setError('Please enter your ID document number');
      return false;
    }
    if (isEdit) return true; // keep the photos that were not re-uploaded
    if (!formData.idFrontFile) {
      setError('Please upload front image of your ID document');
      return false;
    }
    if (!formData.selfieFile) {
      setError('Please upload a selfie holding your ID document');
      return false;
    }
    return true;
  };

  // Build FormData for submission
  const buildSubmitData = (): FormData => {
    const submitData = new window.FormData();
    submitData.append('full_name', formData.fullName.trim());
    submitData.append('id_document_type', formData.idType);
    submitData.append('id_document_number', formData.idNumber.trim());
    if (formData.idFrontFile) {
      submitData.append('id_document_front', formData.idFrontFile);
    }
    if (formData.idBackFile) {
      submitData.append('id_document_back', formData.idBackFile);
    }
    if (formData.selfieFile) {
      submitData.append('selfie_with_id', formData.selfieFile);
    }
    return submitData as unknown as FormData;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (isEdit) {
      await submitEdit(buildSubmitData() as unknown as globalThis.FormData, '/api/verification/individual');
    } else if (isFreeVerification || isResubmission) {
      const submitData = buildSubmitData() as unknown as globalThis.FormData;
      await submitFreeVerification(submitData, '/api/verification/individual');
    } else {
      handleProceedToPayment(validateForm);
    }
  };

  // Handle paid submission
  const handlePaidSubmit = async () => {
    if (!validateForm()) return;

    const submitData = buildSubmitData() as unknown as globalThis.FormData;
    await submitPaidVerification(
      submitData,
      '/api/verification/individual',
      'individual_verification',
      `Individual Verification - ${durationDays} days`,
      { fullName: formData.fullName.trim() }
    );
  };

  const isDevelopment =
    process.env.NODE_ENV === 'development' ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  return (
    <VerificationModal
      type="individual"
      durationDays={durationDays}
      step={step}
      isFreeVerification={isFreeVerification}
      title={isEdit ? t('editSubmission') : undefined}
      onClose={onCancel}
    >
      {/* Error Alert */}
      {error && <FormAlert message={error} type="error" />}

      {step === 'form' ? (
        <form onSubmit={handleSubmit}>
          {/* Plan Summary — an edit keeps the original plan, so show the hint instead */}
          {isEdit ? (
            <FormAlert message={t('editSubmissionHint')} type="info" />
          ) : (
            <PlanSummary
              type="individual"
              durationDays={durationDays}
              price={price}
              isFreeVerification={isFreeVerification}
              isResubmission={isResubmission}
            />
          )}

          {/* Full Name */}
          <div className="mb-5">
            <label htmlFor="fullName" className="block mb-2 font-semibold text-gray-900 text-sm sm:text-base">
              Full Name (as on ID document) *
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter your full name exactly as shown on ID"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              This name will be verified and displayed with your blue badge
            </p>
          </div>

          {/* ID Document Type */}
          <div className="mb-5">
            <label htmlFor="idType" className="block mb-2 font-semibold text-gray-900 text-sm sm:text-base">
              ID Document Type *
            </label>
            <select
              id="idType"
              name="idType"
              value={formData.idType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="citizenship">Citizenship</option>
              <option value="passport">Passport</option>
              <option value="driving_license">Driving License</option>
              <option value="pan">PAN Card (individual)</option>
            </select>
          </div>

          {/* ID Document Number */}
          <div className="mb-5">
            <label htmlFor="idNumber" className="block mb-2 font-semibold text-gray-900 text-sm sm:text-base">
              ID Document Number *
            </label>
            <input
              type="text"
              id="idNumber"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleInputChange}
              placeholder="Enter your ID number"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* File Upload Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <DocumentFileInput
              id="idFrontFile"
              name="idFrontFile"
              label={`ID Front Image ${isEdit ? '' : '*'}`}
              accept="image/*,.pdf"
              required={!isEdit}
              fileName={formData.idFrontFile?.name}
              hint={isEdit ? t('keepCurrentPhoto') : 'Max 5MB'}
              onChange={handleFileChange}
            />
            <DocumentFileInput
              id="idBackFile"
              name="idBackFile"
              label={`ID Back Image ${!isEdit && formData.idType !== 'passport' && formData.idType !== 'pan' ? '*' : ''}`}
              accept="image/*,.pdf"
              required={!isEdit && formData.idType !== 'passport' && formData.idType !== 'pan'}
              fileName={formData.idBackFile?.name}
              hint={isEdit ? t('keepCurrentPhoto') : formData.idType === 'passport' || formData.idType === 'pan' ? 'Optional' : 'Max 5MB'}
              onChange={handleFileChange}
            />
          </div>

          {/* Selfie with ID */}
          <div className="mb-5">
            <DocumentFileInput
              id="selfieFile"
              name="selfieFile"
              label={`Selfie with ID Document ${isEdit ? '' : '*'}`}
              accept="image/*"
              capture="user"
              required={!isEdit}
              fileName={formData.selfieFile?.name}
              hint={isEdit ? t('keepCurrentPhoto') : 'Clear selfie holding your ID next to your face'}
              onChange={handleFileChange}
            />
          </div>

          {/* Tips */}
          <FormTips type="individual" />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
              className="flex-1 py-3 sm:py-4"
            >
              {loading
                ? 'Submitting...'
                : isEdit
                  ? t('saveChanges')
                  : isFreeVerification || isResubmission
                    ? 'Submit for Verification'
                    : 'Proceed to Payment'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 sm:flex-initial sm:px-8 py-3 sm:py-4"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          {/* Payment Step */}
          <div className="mb-6">
            <OrderSummary
              type="individual"
              durationDays={durationDays}
              price={price}
              displayName={formData.fullName}
            />

            <PaymentMethodSelector
              selectedMethod={selectedPaymentMethod}
              onSelect={setSelectedPaymentMethod}
              amount={price}
              disabled={loading}
              showTestInfo={isDevelopment}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handlePaidSubmit}
              variant="primary"
              loading={loading}
              disabled={loading || !selectedPaymentMethod}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 py-3 sm:py-4"
            >
              {loading ? 'Processing...' : `Pay NPR ${price.toLocaleString()}`}
            </Button>
            <Button
              onClick={handleBackToForm}
              variant="secondary"
              disabled={loading}
              className="flex-1 sm:flex-initial sm:px-8 py-3 sm:py-4"
            >
              Back
            </Button>
          </div>

          {/* Security Note */}
          <p className="text-center text-xs text-gray-400 mt-4">
            You will be redirected to{' '}
            {selectedPaymentMethod === 'khalti'
              ? 'Khalti'
              : selectedPaymentMethod === 'esewa'
                ? 'eSewa'
                : 'payment gateway'}{' '}
            to complete your payment securely.
          </p>
        </>
      )}
    </VerificationModal>
  );
}
