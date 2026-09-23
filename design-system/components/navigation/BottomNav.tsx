'use client';

import { Icon } from '../core/Icon';

export type BottomNavItem = { value: string; label: string; icon: string; badge?: boolean };

export type BottomNavProps = {
  items: BottomNavItem[];
  value: string;
  onChange?: (value: string) => void;
  /** Desenha no fluxo da página em vez de fixo no rodapé (para amostras). */
  static?: boolean;
};

/**
 * Barra flutuante do celular. Só o item aceso mostra o nome; os outros ficam
 * só no ícone, com o nome no `aria-label`.
 */
export function BottomNav({ items = [], value, onChange, static: estatica }: BottomNavProps) {
  return (
    <nav className={'av-bottomnav' + (estatica ? ' av-bottomnav--static' : '')}>
      {items.map((it) => {
        const aceso = it.value === value;
        return (
          <button key={it.value} aria-label={it.label} className={'av-bottomnav__item' + (aceso ? ' av-bottomnav__item--on' : '')} onClick={() => onChange?.(it.value)}>
            <Icon name={it.icon} size={20} />
            {aceso && <span>{it.label}</span>}
            {it.badge && !aceso && <span className="av-bottomnav__badge" />}
          </button>
        );
      })}
    </nav>
  );
}
