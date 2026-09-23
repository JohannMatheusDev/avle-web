'use client';

import { cx } from '../cx';
import { Icon } from '../core/Icon';

export type SegmentedOption = { value: string; label: string; icon?: string };

export type SegmentedProps = {
  options: (string | SegmentedOption)[];
  value: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md';
  block?: boolean;
  className?: string;
};

export function Segmented({ options = [], value, onChange, size = 'md', block, className }: SegmentedProps) {
  return (
    <div role="tablist" className={cx('av-seg', size === 'sm' && 'av-seg--sm', block && 'av-seg--block', className)}>
      {options.map((o) => {
        const opcao = typeof o === 'string' ? { value: o, label: o } : o;
        return (
          <button key={opcao.value} role="tab" aria-selected={opcao.value === value} className={cx('av-seg__opt', opcao.value === value && 'av-seg__opt--on')} onClick={() => onChange?.(opcao.value)}>
            {opcao.icon && <Icon name={opcao.icon} size={14} />}
            {opcao.label}
          </button>
        );
      })}
    </div>
  );
}
