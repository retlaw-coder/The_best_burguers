import React, { useState, useEffect } from 'react';
import { formatThousands } from '../constants/menu';

interface PriceInputProps {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  step?: number;
}

/**
 * A text input that auto-formats numbers with dot-thousands separators
 * (e.g. 17000 → "17.000") while the user is typing.
 * Internally stores a raw numeric value.
 */
export function PriceInput({ value, onChange, className, style, placeholder, step }: PriceInputProps) {
  const [display, setDisplay] = useState(value > 0 ? formatThousands(value) : '');

  // Sync when the parent resets / re-hydrates the value
  useEffect(() => {
    setDisplay(value > 0 ? formatThousands(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip existing dots and any non-digit characters
    const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    setDisplay(raw === '' ? '' : formatThousands(num));
    onChange(num);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      className={className}
      style={style}
      placeholder={placeholder ?? '0'}
    />
  );
}
