import type { ReactNode } from 'react';
import { Icon } from '../core/Icon';

export type ListRowProps = {
  /** Ícone Lucide dentro do círculo da esquerda. */
  icon?: string;
  /** Nó próprio para a esquerda (um Avatar, por exemplo). Ganha do `icon`. */
  lead?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Coluna do meio, como a data. */
  meta?: ReactNode;
  trailing?: ReactNode;
  trailingSub?: ReactNode;
  trailingTone?: 'positive' | 'negative';
  onClick?: () => void;
};

export function ListRow({ icon, lead, title, subtitle, meta, trailing, trailingSub, trailingTone, onClick }: ListRowProps) {
  const cor = trailingTone === 'positive' ? 'var(--positive)' : trailingTone === 'negative' ? 'var(--negative)' : undefined;
  return (
    <div className={'av-row' + (onClick ? ' av-row--interactive' : '')} onClick={onClick}>
      {lead || (icon && <span className="av-row__lead"><Icon name={icon} size={18} /></span>)}
      <div className="av-row__main">
        <div className="av-row__title">{title}</div>
        {subtitle && <div className="av-row__sub">{subtitle}</div>}
      </div>
      {meta && <div className="av-row__meta">{meta}</div>}
      {(trailing || trailingSub) && (
        <div className="av-row__trail" style={{ color: cor }}>
          {trailing}
          {trailingSub && <div className="av-row__sub" style={{ fontWeight: 'var(--weight-regular)' }}>{trailingSub}</div>}
        </div>
      )}
    </div>
  );
}
