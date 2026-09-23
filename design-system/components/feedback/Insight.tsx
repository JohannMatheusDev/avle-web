import type { ReactNode } from 'react';
import { Icon } from '../core/Icon';

export type InsightProps = {
  title: ReactNode;
  children?: ReactNode;
  icon?: string;
  /** Superfície neutra no lugar do preenchimento de acento. */
  muted?: boolean;
  onClick?: () => void;
};

/**
 * Faixa de destaque: um fato concreto e uma consequência. No máximo uma com
 * acento por tela — duas disputam o mesmo olhar e nenhuma ganha.
 */
export function Insight({ title, children, icon = 'sparkles', muted, onClick }: InsightProps) {
  return (
    <div className={'av-insight' + (muted ? ' av-insight--muted' : '')} onClick={onClick} role={onClick ? 'button' : undefined}>
      <span className="av-insight__icon"><Icon name={icon} size={18} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="av-insight__title">{title}</div>
        {children && <div className="av-insight__body">{children}</div>}
      </div>
      {onClick && <Icon name="chevron-right" size={18} />}
    </div>
  );
}
