'use client';

import type { SystemSettings } from './types';
import { ToggleRow } from './ToggleSwitch';

interface UserSettingsTabProps {
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
}

export function UserSettingsTab({ settings, updateSettings }: UserSettingsTabProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">User Settings</h2>

      <div className="space-y-4">
        <ToggleRow
          title="Allow User Registration"
          description="Enable or disable new user registrations"
          checked={settings.allowRegistration}
          onChange={(checked) => updateSettings({ allowRegistration: checked })}
        />

        <ToggleRow
          title="Require Phone Verification"
          description="Users must verify their phone number before posting ads"
          checked={settings.requirePhoneVerification}
          onChange={(checked) => updateSettings({ requirePhoneVerification: checked })}
        />
      </div>
    </div>
  );
}
