import React from 'react';

interface RadioOptionProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  /** Optional leading visual (e.g. a category icon), rendered before the label. */
  icon?: React.ReactNode;
}

/**
 * Reusable radio option component for filters
 * Used for category and condition selections
 */
export default function RadioOption({ label, checked, onChange, icon }: RadioOptionProps) {
  return (
    <label
      className={`flex items-center gap-2 cursor-pointer p-2 rounded-md transition-colors ${
        checked ? 'bg-rose-500-light' : 'hover:bg-gray-50'
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="cursor-pointer"
      />
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className={`text-sm ${checked ? 'text-rose-500 font-semibold' : 'text-gray-700'}`}>
        {label}
      </span>
    </label>
  );
}
