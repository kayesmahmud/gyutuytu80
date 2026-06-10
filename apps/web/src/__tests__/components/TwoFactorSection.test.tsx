import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TwoFactorSection } from '@/components/profile/TwoFactorSection';

describe('TwoFactorSection', () => {
  it('shows an Enable action when 2FA is off and the account has a password', () => {
    render(<TwoFactorSection initialEnabled={false} canManage={true} />);
    expect(screen.getByText('Not enabled')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enable' })).toBeInTheDocument();
  });

  it('shows a Disable action when 2FA is already enabled', () => {
    render(<TwoFactorSection initialEnabled={true} canManage={true} />);
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disable' })).toBeInTheDocument();
  });

  it('blocks management for social-login accounts without a password', () => {
    render(<TwoFactorSection initialEnabled={false} canManage={false} />);
    expect(
      screen.getByText(/not available for social login accounts/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enable' })).not.toBeInTheDocument();
  });
});
