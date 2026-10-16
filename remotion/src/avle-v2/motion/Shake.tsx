import React from 'react';
import {random} from 'remotion';

const DURACAO = 6;
const AMPLITUDE = 4;

/**
 * Micro-tremor de 6 frames nos beats de impacto, que some aos poucos.
 *
 * A direção de cada frame vem do `random()` do Remotion com semente fixa:
 * parece aleatório, mas o render sai igual toda vez. `Math.random()` faria
 * cada render tremer diferente e quebraria o render em paralelo.
 */
export const deslocamentoDoShake = (
	frame: number,
	em: readonly number[],
	semente: string,
	amplitude = AMPLITUDE,
) => {
	const ativo = em.filter((inicio) => frame >= inicio && frame < inicio + DURACAO).pop();
	if (ativo === undefined) {
		return {x: 0, y: 0};
	}
	const decai = 1 - (frame - ativo) / DURACAO;
	const forca = amplitude * (0.5 + decai * 0.5);
	return {
		x: (random(`${semente}-x-${frame}`) * 2 - 1) * forca,
		y: (random(`${semente}-y-${frame}`) * 2 - 1) * forca,
	};
};

export const Shake: React.FC<{
	frame: number;
	em: readonly number[];
	semente: string;
	amplitude?: number;
	children: React.ReactNode;
}> = ({frame, em, semente, amplitude, children}) => {
	const {x, y} = deslocamentoDoShake(frame, em, semente, amplitude);
	return (
		<div style={{position: 'absolute', inset: 0, transform: `translate(${x}px, ${y}px)`}}>{children}</div>
	);
};
