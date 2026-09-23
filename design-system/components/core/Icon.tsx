import type { CSSProperties } from 'react';

/**
 * Ícone Lucide desenhado como máscara CSS, para herdar `currentColor` sem
 * precisar de um SVG por cor.
 *
 * O desenho vem do CDN do unpkg, fixado na versão que o design system foi
 * aprovado. Isso evita trazer o pacote inteiro do Lucide como dependência —
 * o projeto mantém poucas de propósito — mas tem um custo: sem rede para o
 * unpkg, o ícone some e sobra o espaço vazio. O trilho dos painéis continua
 * com os ícones próprios em `app/dashboard/components/Casca.tsx`.
 */
const ICON_BASE = 'https://unpkg.com/lucide-static@0.460.0/icons/';

export type IconProps = {
  /** Nome do ícone Lucide em kebab-case: "house", "shopping-bag", "arrow-up-right". */
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Rótulo acessível. Sem ele o ícone é tratado como decorativo. */
  label?: string;
};

export function Icon({ name, size = 18, className, style, label }: IconProps) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={'av-icon' + (className ? ' ' + className : '')}
      style={{ width: size, height: size, '--av-icon': `url(${ICON_BASE}${name}.svg)`, ...style } as CSSProperties}
    />
  );
}
