import type { ReactNode } from 'react';
import { Delta, Money } from './Money';

export type StatProps = {
  label?: string;
  value: number | string;
  /** Formata como dinheiro pelo Money. Padrão: sim. */
  money?: boolean;
  currency?: string;
  size?: number;
  delta?: number;
  deltaLabel?: string;
  foot?: ReactNode;
};

export function Stat({ label, value, money = true, currency, size = 32, delta, deltaLabel, foot }: StatProps) {
  return (
    <div className="av-stat">
      {label && <div className="av-stat__label">{label}</div>}
      {money && typeof value === 'number'
        ? <Money value={value} currency={currency} size={size} />
        : <span className="av-money" style={{ fontSize: size }}>{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</span>}
      {(delta != null || foot) && (
        <div className="av-stat__foot">
          {delta != null && <Delta value={delta} label={deltaLabel} />}
          {foot}
        </div>
      )}
    </div>
  );
}
