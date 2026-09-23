import type { ReactNode } from 'react';
import { cx } from '../cx';

export type BadgeProps = {
  tone?: 'neutral' | 'positive' | 'negative' | 'warning' | 'info' | 'solid';
  dot?: boolean;
  children?: ReactNode;
  className?: string;
};

export function Badge({ tone = 'neutral', dot, children, className }: BadgeProps) {
  return (
    <span className={cx('av-badge', 'av-badge--' + tone, className)}>
      {dot && <span className="av-badge__dot" />}
      {children}
    </span>
  );
}
