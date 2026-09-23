'use client';

import type { ReactNode } from 'react';

export type SwitchProps = {
  label?: ReactNode;
  checked?: boolean;
  /** Recebe o novo estado, e não o evento. */
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
};

export function Switch({ label, checked, onChange, disabled }: SwitchProps) {
  return (
    <label className="av-switch">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange?.(e.target.checked)} disabled={disabled} />
      <span className="av-switch__track"><span className="av-switch__thumb" /></span>
      {label}
    </label>
  );
}
