import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FraseGancho} from '../componentes/FraseGancho';
import {cor} from '../marca';
import {clamp} from '../movimento';
import {batidas} from '../timing';

const APROXIMACAO = 1.045;

/**
 * Gancho, 0–3 s. O frame 0 já tem "E se" na tela: quem rola o feed decide em
 * menos de um segundo, e uma abertura no preto perde essa pessoa.
 */
export const Cena1Gancho: React.FC = () => {
	const frame = useCurrentFrame();
	const escala = interpolate(
		frame,
		[0, batidas.gancho.aproximacaoFim],
		[1, APROXIMACAO],
		clamp,
	);

	return (
		<AbsoluteFill style={{backgroundColor: cor.fundoForte}}>
			<AbsoluteFill style={{transform: `scale(${escala})`, transformOrigin: '8% 50%'}}>
				<FraseGancho frame={frame} />
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
