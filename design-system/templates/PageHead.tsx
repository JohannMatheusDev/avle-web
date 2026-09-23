import type { ReactNode } from 'react';
import { IconButton } from '../components/core/IconButton';

export type PageHeadProps = {
  title: ReactNode;
  /** Linha de situação embaixo do título: "Você tem 1 pedido a caminho". */
  sub?: ReactNode;
  back?: boolean;
  onBack?: () => void;
  /** Ferramentas à direita: filtros, período, ação principal. */
  children?: ReactNode;
};

/** Cabeçalho de página: saudação ou título grande, linha de situação e ferramentas. */
export function PageHead({ title, sub, back, onBack, children }: PageHeadProps) {
  return (
    <div className="kit-head">
      {back && <IconButton icon="arrow-left" label="Voltar" onClick={onBack} />}
      <h1>{title}{sub && <small>{sub}</small>}</h1>
      <div className="kit-tools">{children}</div>
    </div>
  );
}
