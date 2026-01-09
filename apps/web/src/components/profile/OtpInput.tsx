'use client';

import { useRef, useEffect, useState } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  status?: 'idle' | 'success' | 'error';
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  status = 'idle',
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (status !== 'error') return;
    setShake(true);
    const timer = setTimeout(() => setShake(false), 500);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const digits = value.split('').concat(Array(length - value.length).fill(''));

  const handleChange = (index: number, newValue: string) => {
    const digit = newValue.replace(/\D/g, '').slice(-1);
    if (digit) {
      const newDigits = [...digits];
      newDigits[index] = digit;
      onChange(newDigits.join('').slice(0, length));
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...digits];
      if (digits[index]) {
        newDigits[index] = '';
        onChange(newDigits.join(''));
      } else if (index > 0) {
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const getBoxStyles = (hasValue: boolean) => {
    const baseStyles = 'w-12 h-14 text-center text-2xl font-semibold rounded-lg border-2 transition-all duration-200 focus:outline-none';
    if (status === 'success') {
      return `${baseStyles} border-green-500 bg-green-50 text-green-700 focus:border-green-600 focus:ring-2 focus:ring-green-200`;
    }
    if (status === 'error') {
      return `${baseStyles} border-red-500 bg-red-50 text-red-700 focus:border-red-600 focus:ring-2 focus:ring-red-200`;
    }
    return `${baseStyles} ${hasValue ? 'border-primary bg-primary/5 text-gray-900' : 'border-gray-300 bg-white text-gray-900'} focus:border-primary focus:ring-2 focus:ring-primary/20`;
  };

  return (
    <div
      className={`flex gap-2 justify-center ${shake ? 'animate-shake' : ''}`}
      style={shake ? { animation: 'shake 0.5s ease-in-out' } : undefined}
    >
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={getBoxStyles(!!digit)}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}

