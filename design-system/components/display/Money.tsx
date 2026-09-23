import type { CSSProperties } from 'react';

export type MoneyProps = {
  value: number;
  /** Prefixo de moeda, desenhado menor e apagado. Padrão "R$". */
  currency?: string;
  /** Tamanho da fonte em px. */
  size?: number;
  decimals?: number;
  locale?: string;
  style?: CSSProperties;
};

/**
 * Valor em dinheiro no desenho da marca: prefixo e centavos apagados, para o
 * olho cair direto na parte inteira.
 */
export function Money({ value = 0, currency = 'R$', size = 32, decimals = 2, locale = 'pt-BR', style }: MoneyProps) {
  const texto = Math.abs(value).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const separador = (1.1).toLocaleString(locale).charAt(1);
  const [inteiro, decimal] = decimals
    ? [texto.slice(0, texto.lastIndexOf(separador)), texto.slice(texto.lastIndexOf(separador))]
    : [texto, ''];
  return (
    <span className="av-money" style={{ fontSize: size, ...style }}>
      {value < 0 && '−'}
      {currency && <span className="av-money__cur">{currency}</span>}
      {inteiro}
      {decimal && <span className="av-money__dec">{decimal}</span>}
    </span>
  );
}

export type DeltaProps = { value: number; suffix?: string; label?: string };

/** Variação com seta: "↗ 12,4% vs semana anterior". */
export function Delta({ value, suffix = '%', label }: DeltaProps) {
  const subiu = value >= 0;
  return (
    <span className={'av-delta ' + (subiu ? 'av-delta--up' : 'av-delta--down')}>
      {subiu ? '↗' : '↘'} {Math.abs(value).toLocaleString('pt-BR')}{suffix}
      {label && <span style={{ color: 'var(--text-tertiary)', fontWeight: 'var(--weight-regular)', marginLeft: 'var(--space-1)' }}>{label}</span>}
    </span>
  );
}
