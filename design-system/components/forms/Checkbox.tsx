'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../core/Icon';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  label?: ReactNode;
  checked?: boolean;
  /** Recebe o novo estado, e não o evento. */
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
};

export function Checkbox({ label, checked, onChange, disabled, ...rest }: CheckboxProps) {
  return (
    <label className="av-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange?.(e.target.checked)} disabled={disabled} {...rest} />
      <span className="av-check__box">{checked && <Icon name="check" size={14} />}</span>
      {label}
    </label>
  );
}
