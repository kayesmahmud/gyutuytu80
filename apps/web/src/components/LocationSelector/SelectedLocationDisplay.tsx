'use client';

import type { Location } from './types';
import { getLocationTypeLabel } from './types';
import { useLocalizedName } from '@/hooks/useLocalizedName';

interface SelectedLocationDisplayProps {
  location: Location;
  onClear: () => void;
}

export function SelectedLocationDisplay({ location, onClear }: SelectedLocationDisplayProps) {
  const localizedName = useLocalizedName();
  return (
    <div style={{
      padding: '0.75rem',
      backgroundColor: '#ede9fe',
      borderRadius: '6px',
      marginBottom: '0.75rem',
      fontSize: '0.875rem',
      color: '#7c3aed',
      fontWeight: '600',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span>{localizedName(location.name, location.nameNe)} ({getLocationTypeLabel(location.type)})</span>
      <button
        type="button"
        onClick={onClear}
        style={{
          background: 'none',
          border: 'none',
          color: '#7c3aed',
          cursor: 'pointer',
          fontSize: '0.875rem',
          textDecoration: 'underline'
        }}
      >
        Clear
      </button>
    </div>
  );
}
