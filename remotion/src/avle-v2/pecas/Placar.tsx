import React from 'react';
import {Easing, interpolate} from 'remotion';
import {cor} from '../marca';
import {clamp, punch} from '../movimento';
import {raio, tipo} from '../tema';

/** Quantas voltas cada coluna dá antes de travar. A última gira mais. */
const VOLTAS = [2, 3, 4];

/**
 * Números do sorteio girando como placar mecânico e travando um por vez.
 * O número é fixo no roteiro e a posição sai de uma curva que desacelera:
 * nada é sorteado no render, e o vídeo sai igual toda vez.
 */
export const Placar: React.FC<{
	frame: number;
	numero: string;
	comeca: number;
	travam: readonly number[];
	largura: number;
	altura: number;
	espaco: number;
}> = ({frame, numero, comeca, travam, largura, altura, espaco}) => (
	<div style={{display: 'flex', gap: espaco}}>
		{numero.split('').map((digito, i) => {
			const destino = VOLTAS[i % VOLTAS.length] * 10 + Number(digito);
			const posicao = interpolate(frame, [comeca, travam[i]], [0, destino], {
				...clamp,
				easing: Easing.out(Easing.cubic),
			});
			const travou = frame >= travam[i];
			const tira = Array.from({length: destino + 2}, (_, n) => n % 10);
			return (
				<div
					key={i}
					style={{
						width: largura,
						height: altura,
						overflow: 'hidden',
						borderRadius: raio.cartao,
						backgroundColor: cor.cartao,
						boxShadow: travou ? `inset 0 0 0 5px ${cor.destaque}` : 'inset 0 0 0 2px rgba(11,30,20,.08)',
						transform: `scale(${travou ? punch(frame, travam[i], 1.1) : 1})`,
					}}
				>
					<div style={{transform: `translateY(${-posicao * altura}px)`}}>
						{tira.map((n, indice) => (
							<div
								key={indice}
								style={{
									...tipo.numero,
									height: altura,
									fontSize: altura * 0.72,
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
				</div>
			);
		})}
	</div>
);
