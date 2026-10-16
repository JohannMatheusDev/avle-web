import React from 'react';
import {cor, sombraDoCartao} from '../marca';
import {raio} from '../tema';

/**
 * O cartão branco arredondado do DESIGN.md (28 px, sombra longa e rasa tingida
 * de verde). Todas as cenas usam este, para o vídeo ter a cara dos painéis.
 */
export const Cartao: React.FC<{
	style?: React.CSSProperties;
	children: React.ReactNode;
}> = ({style, children}) => (
	<div
		style={{
			backgroundColor: cor.cartao,
			borderRadius: raio.cartao,
			boxShadow: sombraDoCartao,
			...style,
		}}
	>
		{children}
	</div>
);
