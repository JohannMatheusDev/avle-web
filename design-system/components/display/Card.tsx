import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../cx';
import { IconButton } from '../core/IconButton';

export type CardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Controles à direita do título: Select, Segmented, IconButton. */
  actions?: ReactNode;
  /** Mostra o botão redondo ↗, a marca registrada do cartão. */
  expand?: boolean;
  onExpand?: () => void;
  variant?: 'default' | 'raised' | 'accent';
  flush?: boolean;
  interactive?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
};

export function Card({ title, subtitle, actions, expand, onExpand, variant = 'default', flush, interactive, children, className, style, onClick }: CardProps) {
  const temCabecalho = title || actions || expand;
  return (
    <section className={cx('av-card', variant !== 'default' && 'av-card--' + variant, flush && 'av-card--flush', interactive && 'av-card--interactive', className)} style={style} onClick={onClick}>
      {temCabecalho && (
        <header className="av-card__head">
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && <h3 className="av-card__title">{title}</h3>}
            {subtitle && <div className="av-card__sub">{subtitle}</div>}
          </div>
          {(actions || expand) && (
            <div className="av-card__actions">
              {actions}
              {expand && <IconButton icon="arrow-up-right" label="Abrir" onClick={onExpand} />}
            </div>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
