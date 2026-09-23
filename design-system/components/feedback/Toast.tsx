import type { ReactNode } from 'react';
import { Icon } from '../core/Icon';

export type ToastProps = {
  tone?: 'positive' | 'negative';
  children?: ReactNode;
  action?: string;
  onAction?: () => void;
};

export function Toast({ tone = 'positive', children, action, onAction }: ToastProps) {
  return (
    <div className="av-toast" role="status">
      <span className={'av-toast__icon' + (tone === 'negative' ? ' av-toast__icon--negative' : '')}>
        <Icon name={tone === 'negative' ? 'x' : 'check'} size={16} />
      </span>
      <span className="av-toast__msg">{children}</span>
      {action && <button className="av-btn av-btn--sm av-btn--ghost" style={{ color: 'inherit' }} onClick={onAction}>{action}</button>}
    </div>
  );
}

/** Pilha fixa no rodapé da tela. Sobe acima do BottomNav quando ele aparece. */
export function ToastStack({ children }: { children?: ReactNode }) {
  return <div className="av-toast-stack">{children}</div>;
}
