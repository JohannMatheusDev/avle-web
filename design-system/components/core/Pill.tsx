import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import { Icon } from './Icon';

export type PillProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  accent?: boolean;
  /** Bolinha de acento, no estilo de rótulo de seção ("● Pedidos"). */
  dot?: boolean;
  icon?: string;
  size?: 'sm' | 'md';
  children?: ReactNode;
};

export function Pill({ active, accent, dot, icon, size = 'md', children, className, ...rest }: PillProps) {
  return (
    <button className={cx('av-pill', active && 'av-pill--active', accent && 'av-pill--accent', size === 'sm' && 'av-pill--sm', className)} {...rest}>
      {dot && <span className="av-pill__dot" />}
      {icon && <Icon name={icon} size={size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  );
}
