import { useId } from 'react';

export type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  area?: boolean;
  dot?: boolean;
};

/**
 * Linha suave com área em degradê e um ponto no último valor.
 *
 * O id do degradê era sorteado com `Math.random()` a cada renderização. No
 * Next isso quebra a hidratação: o servidor sorteia um id, o navegador outro,
 * e o React acusa diferença no HTML. `useId` dá o mesmo id dos dois lados.
 */
export function Sparkline({ data = [], width = 240, height = 80, color = 'var(--text-primary)', area = true, dot = true }: SparklineProps) {
  const idDoDegrade = 'sp' + useId().replace(/:/g, '');
  if (data.length < 2) return null;
  const minimo = Math.min(...data);
  const maximo = Math.max(...data);
  const margem = 6;
  const pontos = data.map((v, i) => [
    margem + (i * (width - 2 * margem)) / (data.length - 1),
    margem + (1 - (v - minimo) / (maximo - minimo || 1)) * (height - 2 * margem),
  ]);
  let caminho = 'M' + pontos[0].join(',');
  for (let i = 1; i < pontos.length; i++) {
    const [x0, y0] = pontos[i - 1];
    const [x1, y1] = pontos[i];
    const meio = (x0 + x1) / 2;
    caminho += ` C${meio},${y0} ${meio},${y1} ${x1},${y1}`;
  }
  const ultimo = pontos[pontos.length - 1];
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={idDoDegrade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity=".25" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={caminho + ` L${ultimo[0]},${height} L${pontos[0][0]},${height} Z`} fill={`url(#${idDoDegrade})`} />}
      <path d={caminho} fill="none" stroke={color} strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
      {dot && <circle cx={ultimo[0]} cy={ultimo[1]} r="4" fill="var(--accent)" />}
    </svg>
  );
}
