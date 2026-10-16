import React from 'react';
import {cor} from '../marca';
import {raio, tipo} from '../tema';

export const NOTIFICACAO_ALTURA = 132;

/**
 * Notificação de celular, genérica: o ícone é um quadrado terracota com
 * "R$", e não o logo de nenhum banco ou app. Um logo de terceiro aqui faria
 * o vídeo parecer anúncio desse terceiro.
 */
export const Notificacao: React.FC<{
	titulo: string;
	texto: string;
	hora?: string;
	largura: number;
	style?: React.CSSProperties;
}> = ({titulo, texto, hora = 'agora', largura, style}) => (
	<div
		style={{
			width: largura,
			height: NOTIFICACAO_ALTURA,
			boxSizing: 'border-box',
			display: 'flex',
			alignItems: 'center',
			gap: 22,
			padding: '0 26px',
			borderRadius: raio.cartao,
			backgroundColor: 'rgba(255,255,255,.96)',
			boxShadow: '0 12px 30px -18px rgba(11,30,20,.6)',
			...style,
		}}
	>
		<div
			style={{
				...tipo.numero,
				width: 72,
				height: 72,
				flexShrink: 0,
				borderRadius: 18,
				backgroundColor: cor.destaque,
				color: cor.cartao,
				fontSize: 28,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			R$
		</div>
		<div style={{flex: 1, minWidth: 0}}>
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
				<span style={{...tipo.rotulo, fontSize: 32, fontWeight: 600, color: cor.texto}}>{titulo}</span>
				<span style={{...tipo.rotulo, fontSize: 24, color: cor.textoSecundario}}>{hora}</span>
			</div>
			<div
				style={{
					...tipo.rotulo,
					fontSize: 29,
					fontWeight: 400,
					color: cor.texto,
					marginTop: 6,
					whiteSpace: 'nowrap',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
				}}
			>
				{texto}
			</div>
		</div>
	</div>
);
