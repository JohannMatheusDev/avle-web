import React from 'react';
import {cor} from '../marca';

/**
 * Ícones em traço, no desenho do Lucide que o DESIGN.md adota (traço 2 de
 * 24, pontas redondas). Desenhados aqui em SVG porque o vídeo não pode
 * depender do CDN do unpkg na hora do render, e PNG de ícone é proibido.
 */
type PropsDoIcone = {tamanho: number; corDoTraco?: string; espessura?: number; style?: React.CSSProperties};

const Svg: React.FC<PropsDoIcone & {children: React.ReactNode}> = ({
	tamanho,
	corDoTraco = cor.texto,
	espessura = 2,
	style,
	children,
}) => (
	<svg
		width={tamanho}
		height={tamanho}
		viewBox="0 0 24 24"
		fill="none"
		stroke={corDoTraco}
		strokeWidth={espessura}
		strokeLinecap="round"
		strokeLinejoin="round"
		style={style}
	>
		{children}
	</svg>
);

/** O "pointer" do Lucide: o dedo que toca o botão. */
export const Dedo: React.FC<PropsDoIcone> = (props) => (
	<Svg {...props}>
		<path d="M22 14a8 8 0 0 1-8 8" />
		<path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
		<path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1" />
		<path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" />
		<path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
	</Svg>
);

export const Sacola: React.FC<PropsDoIcone> = (props) => (
	<Svg {...props}>
		<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
		<path d="M3 6h18" />
		<path d="M16 10a4 4 0 0 1-8 0" />
	</Svg>
);

export const Loja: React.FC<PropsDoIcone> = (props) => (
	<Svg {...props}>
		<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
		<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
		<path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
		<path d="M2 7h20" />
		<path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-2-1a2.7 2.7 0 0 1-4 0a2.7 2.7 0 0 1-4 0a2.7 2.7 0 0 1-4 0a2.7 2.7 0 0 1-2 1a2 2 0 0 1-2-2V7" />
	</Svg>
);

/** Check desenhado conforme `progresso` vai de 0 a 1. */
export const Check: React.FC<{progresso: number; tamanho: number; fundo?: string; traco?: string}> = ({
	progresso,
	tamanho,
	fundo = cor.positivo,
	traco = '#FFFFFF',
}) => {
	const comprimento = 30;
	return (
		<svg width={tamanho} height={tamanho} viewBox="0 0 48 48">
			<circle cx={24} cy={24} r={24} style={{fill: fundo}} />
			<path
				d="M14 25 L21 32 L34 17"
				fill="none"
				stroke={traco}
				strokeWidth={5}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeDasharray={comprimento}
				strokeDashoffset={comprimento * (1 - progresso)}
			/>
		</svg>
	);
};

/** O ✓✓ de mensagem entregue; azul quando lida. */
export const CheckDuplo: React.FC<{tamanho: number; corDoTraco: string}> = ({tamanho, corDoTraco}) => (
	<svg width={tamanho * 1.4} height={tamanho} viewBox="0 0 34 24" fill="none" stroke={corDoTraco} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
		<path d="M2 13 L8 19 L19 6" />
		<path d="M14 18 L15 19 L26 6" />
	</svg>
);
