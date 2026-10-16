import React from 'react';
import {interpolate} from 'remotion';
import {clamp, margemDoPunch, misturar, mola, molas, punch} from '../movimento';

export type PalavraCinetica = {texto: string; em: number; destaque?: boolean};

const ENTRADA = 12;
const SUBIDA = 0.45;

/**
 * Tipografia cinética: cada palavra entra no seu frame com uma mola curta de
 * overshoot leve, e a palavra-chave dá o punch de escala (1 → 1,15 → 1) e
 * sai na cor de destaque.
 *
 * As linhas são fixas para o texto não reorganizar enquanto entra. Com
 * `frame` nulo tudo aparece pronto, que é o que a capa usa.
 */
export const KineticText: React.FC<{
	frame: number | null;
	linhas: PalavraCinetica[][];
	estilo: React.CSSProperties;
	corDoDestaque: string;
	alinhamento?: 'left' | 'center';
}> = ({frame, linhas, estilo, corDoDestaque, alinhamento = 'left'}) => (
	<div style={{textAlign: alinhamento}}>
		{linhas.map((linha, i) => (
			<div key={i} style={{...estilo, whiteSpace: 'pre'}}>
				{linha.map((palavra, j) => (
					<Palavra
						key={j}
						palavra={palavra}
						frame={frame}
						corDoDestaque={corDoDestaque}
						espaco={j < linha.length - 1}
					/>
				))}
			</div>
		))}
	</div>
);

const Palavra: React.FC<{
	palavra: PalavraCinetica;
	frame: number | null;
	corDoDestaque: string;
	espaco: boolean;
}> = ({palavra, frame, corDoDestaque, espaco}) => {
	const pronta = frame === null;
	const t = pronta ? 1 : mola(frame, palavra.em, ENTRADA, molas.kinetic);
	const opacidade = pronta ? 1 : interpolate(frame - palavra.em, [0, 3], [0, 1], clamp);
	const escala = !pronta && palavra.destaque ? punch(frame, palavra.em + 2) : 1;
	return (
		<span
			style={{
				display: 'inline-block',
				color: palavra.destaque ? corDoDestaque : undefined,
				margin: margemDoPunch(palavra.texto, escala),
				opacity: opacidade,
				transform: `translateY(${(1 - t) * SUBIDA}em) scale(${misturar(0.88, 1, Math.min(t, 1)) * escala})`,
				transformOrigin: '50% 80%',
			}}
		>
			{palavra.texto}
			{espaco ? ' ' : ''}
		</span>
	);
};

/** Monta as palavras de um bloco com um passo fixo entre elas. */
export const emSequencia = (
	linhas: readonly (readonly string[])[],
	inicio: number,
	passo: number,
	destaques: readonly string[] = [],
): PalavraCinetica[][] => {
	let n = 0;
	return linhas.map((linha) =>
		linha.map((texto) => ({texto, em: inicio + passo * n++, destaque: destaques.includes(texto)})),
	);
};
