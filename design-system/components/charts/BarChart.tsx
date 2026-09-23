'use client';

import { useState } from 'react';

export type BarDatum = { label: string; value: number; highlight?: boolean };

export type BarChartProps = {
  data: BarDatum[];
  height?: number;
  /** Índice selecionado, para uso controlado. */
  value?: number;
  onChange?: (index: number) => void;
  format?: (v: number) => string | number;
};

/**
 * Barras em cápsula com a selecionada acesa no acento e o valor numa
 * etiqueta em cima. Sem `value`, começa na barra marcada com `highlight`.
 */
export function BarChart({ data = [], height = 180, value, onChange, format = (v) => v }: BarChartProps) {
  const [selecionada, setSelecionada] = useState(value ?? data.findIndex((d) => d.highlight));
  const atual = value ?? selecionada;
  const maximo = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="av-bars" style={{ height }}>
      {data.map((d, i) => {
        const altura = Math.max(8, (d.value / maximo) * (height - 56));
        const acesa = i === atual;
        return (
          <div key={i} className={'av-bars__col' + (acesa ? ' av-bars__col--on' : '')} onClick={() => { setSelecionada(i); onChange?.(i); }}>
            {acesa && <span className="av-tip av-tip--accent av-bars__tip" style={{ bottom: altura + 34 }}>{format(d.value)}</span>}
            <div className="av-bars__bar" style={{ height: altura }} />
            <span className="av-bars__label">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
