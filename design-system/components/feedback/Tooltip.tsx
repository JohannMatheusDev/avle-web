import type { ReactNode } from 'react';

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  accent?: boolean;
};

/** Dica que aparece no hover e no foco. Só CSS, sem estado. */
export function Tooltip({ content, children, accent }: TooltipProps) {
  return (
    <span className="av-tipwrap" tabIndex={0}>
      {children}
      <span className="av-tipwrap__pop"><span className={'av-tip' + (accent ? ' av-tip--accent' : '')}>{content}</span></span>
    </span>
  );
}

/** Etiqueta fixa de valor, como as dos gráficos ("R$ 16.021"). */
export function Tag({ children, accent }: { children?: ReactNode; accent?: boolean }) {
  return <span className={'av-tip' + (accent ? ' av-tip--accent' : '')}>{children}</span>;
}
