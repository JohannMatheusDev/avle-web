import React from 'react';
import {cor} from '../marca';

/**
 * Celular genérico desenhado em verde-tinta, sem marca de aparelho.
 *
 * `deslocamentoDaTela` move o conteúdo da tela em relação ao aparelho: é uma
 * das camadas do parallax. A cena move o aparelho numa velocidade e a tela
 * noutra, e o celular ganha profundidade sem nenhum efeito 3D.
 */
export const MockupCelular: React.FC<{
	largura: number;
	altura: number;
	fundoDaTela?: string;
	deslocamentoDaTela?: number;
	/**
	 * Sobre fundo escuro o corpo verde-tinta some; o contorno claro de 2 px
	 * desenha a silhueta do aparelho sem brilho nem sombra colorida.
	 */
	contornoClaro?: boolean;
	style?: React.CSSProperties;
	children: React.ReactNode;
}> = ({largura, altura, fundoDaTela = cor.papel, deslocamentoDaTela = 0, contornoClaro = false, style, children}) => {
	const borda = Math.round(largura * 0.03);
	const raioExterno = Math.round(largura * 0.14);
	const raioDaTela = raioExterno - borda;
	const larguraDaIlha = largura * 0.24;
	return (
		<div
			style={{
				width: largura,
				height: altura,
				borderRadius: raioExterno,
				backgroundColor: cor.fundoForte,
				padding: borda,
				boxSizing: 'border-box',
				boxShadow: contornoClaro
					? '0 0 0 2px rgba(247,244,235,.22)'
					: '0 50px 90px -40px rgba(11,30,20,.6)',
				...style,
			}}
		>
			<div
				style={{
					position: 'relative',
					width: largura - borda * 2,
					height: altura - borda * 2,
					borderRadius: raioDaTela,
					backgroundColor: fundoDaTela,
					overflow: 'hidden',
				}}
			>
				<div style={{position: 'absolute', inset: 0, transform: `translateY(${deslocamentoDaTela}px)`}}>
					{children}
				</div>
				<div
					style={{
						position: 'absolute',
						top: borda * 1.2,
						left: (largura - borda * 2 - larguraDaIlha) / 2,
						width: larguraDaIlha,
						height: larguraDaIlha * 0.28,
						borderRadius: 999,
						backgroundColor: cor.fundoForte,
					}}
				/>
			</div>
		</div>
	);
};

/** Tamanho da tela de um celular de largura/altura dadas. */
export const telaDe = (largura: number, altura: number) => {
	const borda = Math.round(largura * 0.03);
	return {largura: largura - borda * 2, altura: altura - borda * 2};
};
