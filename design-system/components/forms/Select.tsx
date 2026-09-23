import type { SelectHTMLAttributes } from 'react';
import { cx } from '../cx';
import { Icon } from '../core/Icon';

export type SelectOption = { value: string; label: string };

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  label?: string;
  hint?: string;
  options: (string | SelectOption)[];
  size?: 'sm' | 'md';
};

export function Select({ label, hint, options = [], size = 'md', className, style, ...rest }: SelectProps) {
  return (
    <label className={cx('av-field', className)} style={style}>
      {label && <span className="av-field__label">{label}</span>}
      <span className={cx('av-input', size === 'sm' && 'av-input--sm')}>
        <select {...rest}>
          {options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
        <Icon name="chevron-down" size={16} className="av-input__icon" style={{ pointerEvents: 'none' }} />
      </span>
      {hint && <span className="av-field__hint">{hint}</span>}
    </label>
  );
}
