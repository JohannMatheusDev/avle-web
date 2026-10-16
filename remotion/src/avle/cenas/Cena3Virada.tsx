import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import {alturaPara, artes, cor} from '../marca';
import {clamp, fase, misturar, mola, molas} from '../movimento';
import {tela} from '../roteiro';
import {LARGURA, batidas} from '../timing';
import {tipo} from '../tema';

const b = batidas.virada;

const ARVORE_LARGURA = 760;
const ARVORE_TOPO = 340;
const MARCA_LARGURA = 500;
const MARCA_TOPO = ARVORE_TOPO + alturaPara(artes.arvoreFloresta, ARVORE_LARGURA) + 50;
const SLOGAN_TOPO = MARCA_TOPO + alturaPara(artes.marcaFloresta, MARCA_LARGURA) + 70;
const SLOGAN_TAMANHO = 78;
/** Raio final do recorte, em % do círculo do CSS: passa da copa inteira. */
const RECORTE_FINAL = 125;
const APROXIMACAO = 1.035;
const ENTRADA = 20;

/**
 * Virada, 8–11 s. O fundo vira papel (o wipe da transição) e a árvore nasce
 * do tronco para cima.
 *
 * A árvore é um PNG, então não dá para desenhar o traço galho a galho. O
 * crescimento vem de um recorte circular com centro na base do tronco: o
 * tronco aparece primeiro e a copa se abre por último, que é como se lê uma
 * árvore nascendo. Redesenhar a árvore em vetor para animar o traço seria
 * redesenhar o logo, e o DESIGN.md proíbe.
 */
export const Cena3Virada: React.FC = () => {
	const frame = useCurrentFrame();
	const cresce = fase(frame, b.arvoreInicio, b.arvoreFim);
	const marca = mola(frame, b.marca, ENTRADA, molas.firme);
	const escala = interpolate(frame, [0, b.aproximacaoFim], [1, APROXIMACAO], clamp);

	return (
		<AbsoluteFill style={{backgroundColor: cor.papel}}>
			<AbsoluteFill style={{transform: `scale(${escala})`, transformOrigin: '50% 45%'}}>
				<Img
					src={artes.arvoreFloresta.src}
					style={{
						position: 'absolute',
						left: (LARGURA - ARVORE_LARGURA) / 2,
						top: ARVORE_TOPO,
						width: ARVORE_LARGURA,
						clipPath: `circle(${cresce * RECORTE_FINAL}% at 50% 100%)`,
						transform: `scale(${misturar(0.92, 1, cresce)})`,
						transformOrigin: '50% 100%',
					}}
				/>

				<Img
					src={artes.marcaFloresta.src}
					style={{
						position: 'absolute',
						left: (LARGURA - MARCA_LARGURA) / 2,
						top: MARCA_TOPO,
						width: MARCA_LARGURA,
						opacity: marca,
						transform: `translateY(${(1 - marca) * 30}px)`,
					}}
				/>

				<div
					style={{
						position: 'absolute',
						top: SLOGAN_TOPO,
						width: LARGURA,
						textAlign: 'center',
					}}
				>
					{tela.virada.slogan.map((linha, i) => {
						const t = mola(frame, b.slogan + i * 5, ENTRADA, molas.firme);
						const ultima = i === tela.virada.slogan.length - 1;
						return (
							<div
								key={linha}
								style={{
									...tipo.titulo,
									fontSize: SLOGAN_TAMANHO,
									color: ultima ? cor.destaque : cor.texto,
									opacity: t,
									transform: `translateY(${(1 - t) * 24}px)`,
								}}
							>
								{linha}
							</div>
						);
					})}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
