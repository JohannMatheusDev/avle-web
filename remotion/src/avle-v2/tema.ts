import type React from 'react';
import {ALTURA, LARGURA} from './timing';

export const FONTE = 'Urbanist, system-ui, sans-serif';

/**
 * Área segura do vertical: Reels, TikTok e Shorts cobrem os 250 px de cima e
 * os 350 px de baixo com a interface deles.
 */
export const areaSegura = {
	topo: 250,
	base: ALTURA - 350,
	esquerda: 90,
	direita: LARGURA - 90,
} as const;

export const larguraUtil = areaSegura.direita - areaSegura.esquerda;

/** Faixa das legendas, no pé da área segura. O conteúdo fica acima dela. */
export const faixaDaLegenda = {
	base: areaSegura.base - 30,
	alturaMaxima: 160,
} as const;

export const conteudoBase = faixaDaLegenda.base - faixaDaLegenda.alturaMaxima - 30;

/**
 * Escala da V2. Título em peso regular, como pede o DESIGN.md; o semibold
 * fica para número, legenda e as palavras de quebra de padrão ("CHEGA."),
 * que precisam ler em um piscar.
 */
export const tipo = {
	gigante: {fontFamily: FONTE, fontSize: 260, fontWeight: 600, lineHeight: 0.95, letterSpacing: '-0.04em'},
	titulo: {fontFamily: FONTE, fontSize: 104, fontWeight: 400, lineHeight: 1.04, letterSpacing: '-0.03em'},
	cartao: {fontFamily: FONTE, fontSize: 44, fontWeight: 400, lineHeight: 1.2, letterSpacing: '-0.015em'},
	rotulo: {fontFamily: FONTE, fontSize: 32, fontWeight: 500, lineHeight: 1.2, letterSpacing: '0.005em'},
	legenda: {fontFamily: FONTE, fontSize: 58, fontWeight: 600, lineHeight: 1.18, letterSpacing: '-0.015em'},
	numero: {
		fontFamily: FONTE,
		fontWeight: 600,
		lineHeight: 1,
		letterSpacing: '-0.03em',
		fontVariantNumeric: 'tabular-nums',
	},
} satisfies Record<string, React.CSSProperties>;

export const raio = {tile: 20, cartao: 28, cartaoGrande: 36, pilula: 999} as const;
