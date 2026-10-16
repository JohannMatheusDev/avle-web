import React from 'react';
import {Easing, interpolate} from 'remotion';
import {cor} from '../marca';
import {clamp} from '../movimento';
import {raio, tipo} from '../tema';
import {Cartao} from './Cartao';

export const PLACAR = {
	digitoLargura: 216,
	digitoAltura: 280,
	espaco: 28,
	tamanhoDoNumero: 196,
} as const;

/** Quantas voltas cada coluna dá antes de travar. A última gira mais. */
const VOLTAS = [2, 3, 4];

/**
 * Os números do sorteio girando como um placar mecânico e travando, um por
 * vez, no número contemplado.
 *
 * Cada coluna é uma tira de dígitos que desliza; a posição sai de uma curva
 * que desacelera até o dígito final. Nada é sorteado no render: o número é
 * fixo no roteiro, e o vídeo sai igual toda vez.
 */
export const Placar: React.FC<{
	frame: number;
	numero: string;
	comeca: number;
	travam: readonly number[];
}> = ({frame, numero, comeca, travam}) => (
	<div style={{display: 'flex', gap: PLACAR.espaco}}>
		{numero.split('').map((digito, i) => (
			<Coluna
				key={i}
				frame={frame}
				digito={Number(digito)}
				voltas={VOLTAS[i % VOLTAS.length]}
				comeca={comeca}
				trava={travam[i]}
			/>
		))}
	</div>
);

const Coluna: React.FC<{
	frame: number;
	digito: number;
	voltas: number;
	comeca: number;
	trava: number;
}> = ({frame, digito, voltas, comeca, trava}) => {
	const destino = voltas * 10 + digito;
	const posicao = interpolate(frame, [comeca, trava], [0, destino], {
		...clamp,
		easing: Easing.out(Easing.cubic),
	});
	const travou = frame >= trava;
	const tira = Array.from({length: destino + 2}, (_, n) => n % 10);

	return (
		<Cartao
			style={{
				width: PLACAR.digitoLargura,
				height: PLACAR.digitoAltura,
				overflow: 'hidden',
				position: 'relative',
				borderRadius: raio.cartao,
				outline: travou ? `4px solid ${cor.destaque}` : 'none',
				outlineOffset: -4,
			}}
		>
			<div style={{transform: `translateY(${-posicao * PLACAR.digitoAltura}px)`}}>
				{tira.map((n, indice) => (
					<div
						key={indice}
						style={{
							...tipo.numero,
							height: PLACAR.digitoAltura,
							fontSize: PLACAR.tamanhoDoNumero,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: travou ? cor.destaque : cor.texto,
						}}
					>
						{n}
					</div>
				))}
			</div>
		</Cartao>
	);
};
