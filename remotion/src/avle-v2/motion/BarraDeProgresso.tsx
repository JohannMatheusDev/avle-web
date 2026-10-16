import React from 'react';
import {useCurrentFrame} from 'remotion';
import {cor} from '../marca';
import {DURACAO, LARGURA} from '../timing';

const ALTURA_DA_BARRA = 10;

/**
 * Barra fina no topo que anda os 30 s. Mostra que o vídeo é curto, e quem
 * vê que falta pouco fica até o fim.
 *
 * Fica colada na borda de cima, dentro dos 250 px que a interface da rede
 * cobre. Ela é decorativa, não informação: se a rede cobrir, nada se perde.
 */
export const BarraDeProgresso: React.FC = () => {
	const frame = useCurrentFrame();
	const progresso = (frame + 1) / DURACAO;
	return (
		<div style={{position: 'absolute', top: 0, left: 0, width: LARGURA, height: ALTURA_DA_BARRA}}>
			<div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(247,244,235,.18)'}} />
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					height: ALTURA_DA_BARRA,
					width: LARGURA * progresso,
					backgroundColor: cor.destaque,
				}}
			/>
		</div>
	);
};
