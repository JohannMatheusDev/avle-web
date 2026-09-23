'use client';

import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '../core/Icon';

export type SideNavItem = { value: string; label: string; icon: string; count?: number };
export type SideNavGroup = { label?: string; items: SideNavItem[] };

export type SideNavProps = {
  groups: SideNavGroup[];
  value: string;
  onChange?: (value: string) => void;
  header?: ReactNode;
  footer?: ReactNode;
  style?: CSSProperties;
};

/** Navegação lateral agrupada, a alternativa ao TopNav para telas de administração. */
export function SideNav({ groups = [], value, onChange, header, footer, style }: SideNavProps) {
  return (
    <aside className="av-sidenav" style={style}>
      {header}
      {groups.map((grupo, i) => (
        <Fragment key={i}>
          {grupo.label && <div className="av-sidenav__group">{grupo.label}</div>}
          {grupo.items.map((it) => (
            <button key={it.value} className={'av-sidenav__item' + (it.value === value ? ' av-sidenav__item--on' : '')} onClick={() => onChange?.(it.value)}>
              <Icon name={it.icon} size={18} />
              {it.label}
              {it.count != null && <span className="av-sidenav__count">{it.count}</span>}
            </button>
          ))}
        </Fragment>
      ))}
      <div style={{ flex: 1 }} />
      {footer}
    </aside>
  );
}
