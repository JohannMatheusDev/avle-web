import { useId, type ReactNode } from 'react';

export type DonutSegment = {
  value: number;
  color?: string;
  label?: string;
  /** Preenchimento hachurado, para a fatia de "outros". */
  hatch?: boolean;
};

export type DonutProps = {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  center?: ReactNode;
};

/**
 * Rosca de fatias arredondadas.
 *
 * O id do padrão hachurado era fixo ("av-hatch"). Com duas roscas na mesma
 * página, as duas apontavam para o mesmo <pattern>, e esconder a primeira
 * apagava a hachura da segunda. Agora cada rosca tem o seu.
 */
export function Donut({ segments = [], size = 200, thickness = 22, center }: DonutProps) {
  const idDaHachura = 'av-hatch' + useId().replace(/:/g, '');
  const raio = (size - thickness) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const total = segments.reduce((soma, s) => soma + s.value, 0) || 1;
  // Onde cada fatia começa: a soma das anteriores. Calculado antes do JSX
  // porque somar dentro do `map` é mutação durante a renderização, que o
  // React Compiler recusa.
  const comprimentos = segments.map((s) => (s.value / total) * circunferencia);
  const inicios = comprimentos.map((_, i) => comprimentos.slice(0, i).reduce((soma, c) => soma + c, 0));
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <pattern id={idDaHachura} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2" height="6" fill="var(--text-tertiary)" />
          </pattern>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={raio} fill="none" stroke="var(--surface-raised)" strokeWidth={thickness} />
        {segments.map((s, i) => (
          <circle key={i} cx={size / 2} cy={size / 2} r={raio} fill="none" stroke={s.hatch ? `url(#${idDaHachura})` : s.color} strokeWidth={thickness}
            strokeDasharray={`${Math.max(0, comprimentos[i] - 4)} ${circunferencia}`} strokeDashoffset={-inicios[i]} strokeLinecap="round" />
        ))}
      </svg>
      {center && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{center}</div>}
    </div>
  );
}
