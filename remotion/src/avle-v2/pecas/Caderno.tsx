import React from 'react';
import {cor} from '../marca';
import {tipo} from '../tema';

export const PAGINA = {largura: 430, altura: 600} as const;
export const CADERNO_LARGURA = PAGINA.largura * 2;

/** Uma linha de pauta por nome: o texto senta na linha, como escrito à mão. */
const PAUTA = 96;
const PRIMEIRA_LINHA = 150;

/**
 * Uma página do caderno de fiado: papel pautado, margem em terracota e os
 * nomes escritos. `riscos` diz, para cada linha, quanto do traço que risca o
 * nome já foi desenhado (0 a 1). Nomes são inventados (ver `roteiro.ts`).
 */
export const Pagina: React.FC<{
	linhas: readonly string[];
	riscos?: readonly number[];
	titulo?: string;
	lado: 'esquerda' | 'direita';
	style?: React.CSSProperties;
}> = ({linhas, riscos = [], titulo, lado, style}) => (
	<div
		style={{
			position: 'absolute',
			width: PAGINA.largura,
			height: PAGINA.altura,
			backgroundColor: cor.bege,
			backgroundImage: `repeating-linear-gradient(180deg, transparent 0 ${PAUTA - 2}px, rgba(11,30,20,.12) ${PAUTA - 2}px ${PAUTA}px)`,
			backgroundPosition: `0 ${PRIMEIRA_LINHA - 38}px`,
			borderRadius: lado === 'esquerda' ? '14px 2px 2px 14px' : '2px 14px 14px 2px',
			boxShadow:
				lado === 'esquerda'
					? 'inset -18px 0 24px -18px rgba(11,30,20,.35)'
					: 'inset 18px 0 24px -18px rgba(11,30,20,.35)',
			overflow: 'hidden',
			...style,
		}}
	>
		<div
			style={{
				position: 'absolute',
				left: 64,
				top: 0,
				bottom: 0,
				width: 2,
				backgroundColor: 'rgba(189,107,66,.45)',
			}}
		/>
		{titulo ? (
			<div style={{...tipo.titulo, fontSize: 56, position: 'absolute', left: 84, top: 50, color: cor.texto}}>
				{titulo}
			</div>
		) : null}
		{linhas.map((linha, i) => {
			const topo = PRIMEIRA_LINHA + i * PAUTA;
			const risco = riscos[i] ?? 0;
			return (
				<div key={linha} style={{position: 'absolute', left: 84, top: topo, height: 48}}>
					<span style={{...tipo.cartao, fontSize: 36, fontWeight: 300, color: cor.texto, whiteSpace: 'nowrap'}}>
						{linha}
					</span>
					{risco > 0 ? (
						<div
							style={{
								position: 'absolute',
								left: -8,
								top: 24,
								height: 6,
								width: `calc(${risco * 100}% + 16px)`,
								borderRadius: 3,
								backgroundColor: cor.negativo,
								transform: 'rotate(-2deg)',
							}}
						/>
					) : null}
				</div>
			);
		})}
	</div>
);
