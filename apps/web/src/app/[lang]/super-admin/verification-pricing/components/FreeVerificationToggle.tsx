'use client';

import { useState } from 'react';
import type { FreeVerificationSettings } from '../types';

interface FreeVerificationToggleProps {
  settings: FreeVerificationSettings;
  saving: boolean;
  onSave: (next: FreeVerificationSettings) => Promise<void>;
}

export function FreeVerificationToggle({ settings, saving, onSave }: FreeVerificationToggleProps) {
  const [draft, setDraft] = useState<FreeVerificationSettings>(settings);
  const dirty =
    draft.enabled !== settings.enabled ||
    draft.durationDays !== settings.durationDays ||
    draft.types.sort().join(',') !== settings.types.sort().join(',');

  const toggleType = (type: 'individual' | 'business') => {
    setDraft((d) => {
      const has = d.types.includes(type);
      const next = has ? d.types.filter((t) => t !== type) : [...d.types, type];
      return { ...d, types: next };
    });
  };

  const handleSave = async () => {
    await onSave(draft);
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-8">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">🎁</div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Free Verification Promotion</h2>
            <p className="text-sm text-gray-600 mt-1">
              Bypass payment gateway for first-time users. Useful for launch periods when you want to give new
              users free verification without paying minimum gateway charges.
            </p>
          </div>
        </div>
        <ToggleSwitch
          checked={draft.enabled}
          onChange={(checked) => setDraft((d) => ({ ...d, enabled: checked }))}
        />
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${draft.enabled ? '' : 'opacity-50 pointer-events-none'}`}>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Free duration (days)</label>
          <input
            type="number"
            min={1}
            max={365}
            value={draft.durationDays}
            onChange={(e) => setDraft((d) => ({ ...d, durationDays: parseInt(e.target.value) || 30 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">Common values: 30 (1 month), 90 (3 months), 180 (6 months)</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Apply to verification types</label>
          <div className="space-y-2">
            <CheckboxRow
              label="Individual verification"
              checked={draft.types.includes('individual')}
              onChange={() => toggleType('individual')}
            />
            <CheckboxRow
              label="Business verification"
              checked={draft.types.includes('business')}
              onChange={() => toggleType('business')}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-green-200 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Only first-time users (never verified before) qualify. Returning users always pay.
        </p>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
