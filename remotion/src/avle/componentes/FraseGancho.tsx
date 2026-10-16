import React from 'react';
import {interpolate} from 'remotion';
import {cor} from '../marca';
import {clamp, misturar, mola, molas} from '../movimento';
import {gancho, type PalavraDoGancho} from '../roteiro';
import {areaSegura, tipo} from '../tema';

const TAMANHO_DO_DESTAQUE = 250;
const SUBIDA = 46;
const ENTRADA = 9;
/** O "ANTES" entra maior e assenta: um soco curto, não um quique. */
const ESCALA_DO_SOCO = 1.32;
const DURACAO_DO_SOCO = 20;

/**
 * A pergunta do gancho em letra gigante, palavra por palavra.
 *
 * Fica num componente à parte porque a capa usa a mesma frase: com `frame`
 * nulo, todas as palavras aparecem prontas, e as duas não divergem.
 */
export const FraseGancho: React.FC<{frame: number | null}> = ({frame}) => (
	<div
		style={{
			position: 'absolute',
			left: areaSegura.esquerda,
			top: areaSegura.topo,
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			height: areaSegura.base - areaSegura.topo,
		}}
	>
		{gancho.map((linha, indice) => {
			const ehDestaque = linha.some((palavra) => palavra.destaque);
			return (
				<div
					key={indice}
					style={{
						...tipo.gigante,
						color: cor.bege,
						whiteSpace: 'pre',
						...(ehDestaque
							? {fontSize: TAMANHO_DO_DESTAQUE, lineHeight: 0.92, letterSpacing: '-0.02em'}
							: null),
					}}
				>
					{linha.map((palavra, posicao) => (
						<Palavra
							key={posicao}
							palavra={palavra}
							frame={frame}
							ultima={posicao === linha.length - 1}
						/>
					))}
				</div>
			);
		})}
	</div>
);

const Palavra: React.FC<{
	palavra: PalavraDoGancho;
	frame: number | null;
	ultima: boolean;
}> = ({palavra, frame, ultima}) => {
	const pronta = frame === null || palavra.em === 0;
	const t = pronta ? 1 : mola(frame, palavra.em, ENTRADA, molas.firme);

	let escala = 1;
	if (palavra.destaque && !pronta) {
		const soco = mola(frame, palavra.em, DURACAO_DO_SOCO, molas.soco);
		escala = misturar(ESCALA_DO_SOCO, 1, soco);
	}

	// Opacidade mais curta que o movimento: a palavra já está legível enquanto
	// ainda assenta, o que importa num gancho de 3 segundos.
	const opacidade = pronta
		? 1
		: interpolate(t, [0, 0.4], [0, 1], clamp);

	return (
		<span
			style={{
				display: 'inline-block',
				color: palavra.destaque ? cor.destaque : undefined,
				opacity: opacidade,
				transform: `translateY(${(1 - t) * SUBIDA}px) scale(${escala})`,
				transformOrigin: 'left 70%',
			}}
		>
			{palavra.texto}
			{ultima ? '' : ' '}
		</span>
	);
};
