'use client';

import { useEffect, type ReactNode } from 'react';
import { IconButton } from '../core/IconButton';

export type DialogProps = {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
};

/**
 * Janela modal. Fecha no Esc e no clique fora. No celular, abaixo de 720px,
 * vira folha presa ao rodapé.
 *
 * Não usa portal: o diálogo precisa ficar dentro do elemento com `.avle-ds`
 * para herdar os tokens. Montado no <body>, fora do escopo, ele perderia as
 * cores e apareceria transparente.
 */
export function Dialog({ open, title, description, children, footer, onClose }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="av-scrim" onClick={onClose}>
      <div className="av-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="av-dialog__head">
          <div style={{ flex: 1 }}>
            <h2 className="av-dialog__title">{title}</h2>
            {description && <p className="av-dialog__desc">{description}</p>}
          </div>
          {onClose && <IconButton icon="x" size="sm" label="Fechar" onClick={onClose} />}
        </div>
        {children}
        {footer && <div className="av-dialog__foot">{footer}</div>}
      </div>
    </div>
  );
}
