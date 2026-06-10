'use client';

import { PhoneVerificationSection } from './PhoneVerificationSection';
import { ChangePasswordSection } from './ChangePasswordSection';
import { TwoFactorSection } from './TwoFactorSection';
import { DangerZone } from './DangerZone';
import { SecurityTips } from './SecurityTips';

interface SecurityTabProps {
  isPhoneVerified: boolean;
  currentPhone: string | null;
  canChangePassword: boolean;
  isTwoFactorEnabled: boolean;
  onPhoneVerified: () => void;
}

export function SecurityTab({
  isPhoneVerified,
  currentPhone,
  canChangePassword,
  isTwoFactorEnabled,
  onPhoneVerified,
}: SecurityTabProps) {
  return (
    <div className="space-y-6">
      <PhoneVerificationSection
        isPhoneVerified={isPhoneVerified}
        currentPhone={currentPhone}
        onPhoneVerified={onPhoneVerified}
      />

      <div className="border-t border-gray-200 pt-6 mt-6">
        <ChangePasswordSection canChangePassword={canChangePassword} />
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <TwoFactorSection initialEnabled={isTwoFactorEnabled} canManage={canChangePassword} />
      </div>

      <SecurityTips />

      {isPhoneVerified && <DangerZone />}
    </div>
  );
}
