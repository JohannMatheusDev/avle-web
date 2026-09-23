'use client';

import type { ReactNode } from 'react';

export type RadioProps = {
  label?: ReactNode;
  checked?: boolean;
  /** Recebe o `value` desta opção, e não o evento. */
  onChange?: (value: string) => void;
  name?: string;
  value: string;
  disabled?: boolean;
};

export function Radio({ label, checked, onChange, name, value, disabled }: RadioProps) {
  return (
    <label className="av-check">
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange?.(value)} disabled={disabled} />
      <span className="av-check__box av-check__box--radio"><span className="av-check__radiodot" /></span>
      {label}
    </label>
  );
}
