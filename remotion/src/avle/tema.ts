import type React from 'react';
import {cor} from './marca';
import {ALTURA, LARGURA} from './timing';

export const FONTE = 'Urbanist, system-ui, sans-serif';

/**
 * Área segura do vertical. Reels, TikTok e Shorts cobrem os 250 px de cima
 * (nome do perfil, abas) e os 350 px de baixo (legenda do post, botões).
 * Nada que precise ser lido sai deste retângulo.
 */
export const areaSegura = {
	topo: 250,
	base: ALTURA - 350,
	esquerda: 90,
	direita: LARGURA - 90,
} as const;

export const larguraUtil = areaSegura.direita - areaSegura.esquerda;

/**
 * Faixa das legendas, no pé da área segura. Nas cenas que têm legenda, o
 * conteúdo fica acima de `conteudoBase` para a legenda nunca cair em cima dele.
 */
export const faixaDaLegenda = {
	base: areaSegura.base - 30,
	alturaMaxima: 160,
} as const;

export const conteudoBase = faixaDaLegenda.base - faixaDaLegenda.alturaMaxima - 30;

/**
 * Escala do vídeo. O DESIGN.md pede título leve ou regular, com a hierarquia no
 * tamanho; o peso semibold fica para número e legenda, que precisam ser lidos
 * no celular com o som desligado.
 */
export const tipo = {
	gigante: {
		fontFamily: FONTE,
		fontSize: 148,
		fontWeight: 400,
		lineHeight: 1,
		letterSpacing: '-0.035em',
	},
	titulo: {
		fontFamily: FONTE,
		fontSize: 104,
		fontWeight: 400,
		lineHeight: 1.04,
		letterSpacing: '-0.03em',
	},
	cartao: {
		fontFamily: FONTE,
		fontSize: 58,
		fontWeight: 400,
		lineHeight: 1.1,
		letterSpacing: '-0.02em',
		color: cor.texto,
	},
	rotulo: {
		fontFamily: FONTE,
		fontSize: 34,
		fontWeight: 500,
		lineHeight: 1.2,
		letterSpacing: '0.01em',
	},
	legenda: {
		fontFamily: FONTE,
		fontSize: 60,
		fontWeight: 600,
		lineHeight: 1.12,
		letterSpacing: '-0.015em',
	},
	numero: {
		fontFamily: FONTE,
		fontWeight: 600,
		lineHeight: 1,
		letterSpacing: '-0.03em',
		fontVariantNumeric: 'tabular-nums',
	},
} satisfies Record<string, React.CSSProperties>;

export const raio = {
	tile: 20,
	cartao: 28,
	cartaoGrande: 36,
	pilula: 999,
} as const;
