'use client';

import type { ReactNode } from 'react';
import { Icon } from '../core/Icon';
import { Logo } from './Logo';

export type NavItem = { value: string; label: string; icon?: string; badge?: boolean };

export type TopNavProps = {
  items: NavItem[];
  value: string;
  onChange?: (value: string) => void;
  /** Etiqueta pequena em caixa alta depois do logo: "Loja", "Admin". */
  role?: string;
  /** Controles da direita: troca de tema, IconButtons, Avatar. */
  end?: ReactNode;
  onBrand?: () => void;
};

/** Barra superior fixa e translúcida. Abaixo de 1100px os links somem e a navegação passa para o BottomNav. */
export function TopNav({ items = [], value, onChange, role, end, onBrand }: TopNavProps) {
  return (
    <nav className="av-topnav">
      <div className="av-topnav__brand" onClick={onBrand}>
        <Logo height={22} />
        {role && <span className="av-topnav__role">{role}</span>}
      </div>
      {items.length > 0 && (
        <div className="av-topnav__links">
          {items.map((it) => (
            <button key={it.value} className={'av-topnav__link' + (it.value === value ? ' av-topnav__link--on' : '')} onClick={() => onChange?.(it.value)}>
              {it.icon && <Icon name={it.icon} size={15} />}
              {it.label}
            </button>
          ))}
        </div>
      )}
      <div className="av-topnav__spacer" />
      <div className="av-topnav__end">{end}</div>
    </nav>
  );
}
