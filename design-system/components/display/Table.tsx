import type { ReactNode } from 'react';
import { cx } from '../cx';

export type TableColumn<Linha> = {
  key: string;
  label: string;
  align?: 'left' | 'right';
  /** Esconde a célula quando a tabela vira cartão no celular. */
  hideOnMobile?: boolean;
  render?: (row: Linha) => ReactNode;
};

export type TableProps<Linha> = {
  columns: TableColumn<Linha>[];
  rows: Linha[];
  onRowClick?: (row: Linha) => void;
  /** Abaixo de 720px, cada linha vira um cartão de duas colunas. Padrão: sim. */
  stack?: boolean;
  hover?: boolean;
};

/**
 * Tabela que vira lista de cartões no celular. O tipo da linha é genérico —
 * o original usava `any`, o que deixava passar coluna com nome errado sem
 * aviso nenhum.
 */
export function Table<Linha extends { id?: string | number }>({ columns = [], rows = [], onRowClick, stack = true, hover = true }: TableProps<Linha>) {
  return (
    <div className="av-table-wrap">
      <table className={cx('av-table', stack && 'av-table--stack', hover && 'av-table--hover')}>
        <thead>
          <tr>{columns.map((c) => <th key={c.key} className={c.align === 'right' ? 'av-table__num' : undefined}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((linha, i) => (
            <tr key={linha.id ?? i} onClick={onRowClick ? () => onRowClick(linha) : undefined} style={onRowClick ? { cursor: 'pointer' } : undefined}>
              {columns.map((c) => (
                <td key={c.key} className={c.align === 'right' ? 'av-table__num' : undefined} data-hide-m={c.hideOnMobile ? '' : undefined}>
                  {c.render ? c.render(linha) : (linha as Record<string, ReactNode>)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
