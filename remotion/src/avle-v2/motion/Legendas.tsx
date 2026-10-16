import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {cor} from '../marca';
import {clamp, margemDoPunch, misturar, mola, molas, punch} from '../movimento';
import {fimGlobal, inicioGlobal, legendas, palavrasDaLegenda} from '../roteiro';
import {ALTURA} from '../timing';
import {areaSegura, faixaDaLegenda, larguraUtil, raio, tipo} from '../tema';

const ENTRADA = 8;

/**
 * Legendas queimadas, palavra por palavra no ritmo da fala, com a
 * palavra-chave em terracota e o punch de escala.
 *
 * Ficam sobre uma tarja verde-tinta porque a V2 troca de fundo o tempo todo
 * (verde, papel, terracota cheia, cor invertida): uma cor de texto que lê em
 * todos eles não existe, e a tarja resolve sem depender da cena.
 *
 * Moram fora do `TransitionSeries` e leem o frame global, para o wipe de uma
 * transição não cortar a legenda ao meio.
 */
export const Legendas: React.FC = () => {
	const frame = useCurrentFrame();
	const atual = legendas.find((l) => frame >= inicioGlobal(l) && frame < fimGlobal(l));
	if (!atual) {
		return null;
	}
	// `>` e não `>=`: no frame exato da entrada a palavra ainda tem opacidade
	// zero, e a tarja aparecia vazia por um frame no começo de cada bloco.
	const palavras = palavrasDaLegenda(atual).filter((p) => frame > p.em);
	if (palavras.length === 0) {
		return null;
	}

	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					left: areaSegura.esquerda,
					width: larguraUtil,
					bottom: ALTURA - faixaDaLegenda.base,
					maxHeight: faixaDaLegenda.alturaMaxima,
					textAlign: 'center',
					textWrap: 'balance',
				}}
			>
				<span
					style={{
						...tipo.legenda,
						color: cor.bege,
						backgroundColor: 'rgba(11,30,20,.9)',
						borderRadius: raio.tile,
						padding: '6px 20px',
						boxDecorationBreak: 'clone',
						WebkitBoxDecorationBreak: 'clone',
					}}
				>
					{palavras.map((p, i) => {
						const t = mola(frame, p.em, ENTRADA, molas.kinetic);
						const escala = misturar(0.85, 1, Math.min(t, 1)) * (p.destaque ? punch(frame, p.em + 1) : 1);
						// O espaço vai entre as palavras, fora delas: no fim de um
						// inline-block ele é descartado, e as palavras grudavam.
						return (
							<React.Fragment key={i}>
								{i > 0 ? ' ' : null}
								<span
									style={{
										display: 'inline-block',
										color: p.destaque ? cor.destaque : undefined,
										margin: margemDoPunch(p.texto, escala),
										opacity: interpolate(frame - p.em, [0, 2], [0, 1], clamp),
										transform: `translateY(${(1 - t) * 14}px) scale(${escala})`,
										transformOrigin: '50% 80%',
									}}
								>
									{p.texto}
								</span>
							</React.Fragment>
						);
					})}
				</span>
			</div>
		</AbsoluteFill>
	);
};
