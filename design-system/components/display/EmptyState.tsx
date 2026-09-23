import type { ReactNode } from 'react';
import { Icon } from '../core/Icon';

export type EmptyStateProps = {
  icon?: string;
  title?: string;
  body?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ icon = 'inbox', title, body, action }: EmptyStateProps) {
  return (
    <div className="av-empty">
      <span className="av-empty__icon"><Icon name={icon} size={24} /></span>
      {title && <div className="av-empty__title">{title}</div>}
      {body && <div style={{ maxWidth: 320 }}>{body}</div>}
      {action}
    </div>
  );
}
