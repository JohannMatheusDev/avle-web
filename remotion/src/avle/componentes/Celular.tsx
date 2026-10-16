import React from 'react';
import {cor} from '../marca';

export const CELULAR = {
	largura: 540,
	altura: 860,
	borda: 16,
	raio: 74,
} as const;

export const TELA = {
	largura: CELULAR.largura - CELULAR.borda * 2,
	altura: CELULAR.altura - CELULAR.borda * 2,
	raio: CELULAR.raio - CELULAR.borda,
} as const;

/**
 * Um celular genérico, desenhado em verde-tinta e não fotografado: nada de
 * mockup 3D de banco de imagem. Sem marca de aparelho, para não datar o vídeo.
 */
export const Celular: React.FC<{
	style?: React.CSSProperties;
	children: React.ReactNode;
}> = ({style, children}) => (
	<div
		style={{
			width: CELULAR.largura,
			height: CELULAR.altura,
			borderRadius: CELULAR.raio,
			backgroundColor: cor.fundoForte,
			padding: CELULAR.borda,
			boxSizing: 'border-box',
			boxShadow: '0 40px 80px -40px rgba(11,30,20,.55)',
			...style,
		}}
	>
		<div
			style={{
				position: 'relative',
				width: TELA.largura,
				height: TELA.altura,
				borderRadius: TELA.raio,
				backgroundColor: cor.papel,
				overflow: 'hidden',
			}}
		>
			{children}
			<div
				style={{
					position: 'absolute',
					top: 18,
					left: (TELA.largura - 120) / 2,
					width: 120,
					height: 34,
					borderRadius: 999,
					backgroundColor: cor.fundoForte,
				}}
			/>
		</div>
	</div>
);
