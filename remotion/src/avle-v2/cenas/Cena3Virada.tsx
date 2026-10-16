import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import {alturaPara, artes, cor} from '../marca';
import {clamp, curvaDeQueda, curvaDupla, fase, mola, molas, punch, zoomLento} from '../movimento';
import {Flash} from '../motion/Flash';
import {KineticText, emSequencia} from '../motion/KineticText';
import {deslocamentoDoShake} from '../motion/Shake';
import {CADERNO_LARGURA, PAGINA, Pagina} from '../pecas/Caderno';
import {tela} from '../roteiro';
import {LARGURA, batidas, duracaoDaSequencia} from '../timing';
import {tipo} from '../tema';

const b = batidas.virada;
const t3 = tela.virada;

const CADERNO_TOPO = 300;
const CADERNO_ESQUERDA = (LARGURA - CADERNO_LARGURA) / 2;
const ARVORE_LARGURA = 760;
/** A base do tronco fica onde o caderno fechado encosta no chão. */
const BASE_DO_TRONCO = CADERNO_TOPO + PAGINA.altura;
const ARVORE_TOPO = BASE_DO_TRONCO - alturaPara(artes.arvoreFloresta, ARVORE_LARGURA);
const MARCA_LARGURA = 480;
const MARCA_TOPO = BASE_DO_TRONCO + 40;
const SLOGAN_TOPO = MARCA_TOPO + alturaPara(artes.marcaFloresta, MARCA_LARGURA) + 40;
const RECORTE_FINAL = 125;
const TRONCO_LARGURA = 0.07;
const TRONCO_ALTURA = 0.5;
const EMPURRAO = 1.03;

/**
 * Virada, 8–11 s, com o primeiro match cut: o caderno de fiado fecha com
 * força, se estreita até virar um tronco e, do tronco, cresce a árvore da AVLE.
 *
 * A árvore é PNG, então "desenhada" é um recorte circular que abre da base do
 * tronco para cima: redesenhar a árvore em vetor seria redesenhar o logo, e o
 * DESIGN.md proíbe.
 */
export const Cena3Virada: React.FC = () => {
	const frame = useCurrentFrame();
	const fecha = fase(frame, 0, b.cadernoFecha.em, curvaDeQueda);
	const estreita = fase(frame, b.viraTronco.em, b.viraTronco.em + (b.viraTronco.dur ?? 0), curvaDupla);
	const cresce = fase(frame, b.arvore.em, b.arvore.em + (b.arvore.dur ?? 0));
	const marca = mola(frame, b.marca.em, 12, molas.kinetic);
	const tremor = deslocamentoDoShake(frame, [b.cadernoFecha.em], 'caderno-fecha', 5);
	const zoom = zoomLento(frame, 0, duracaoDaSequencia('virada')) * punch(frame, b.empurrao.em, EMPURRAO);
	const cadernoSome = interpolate(frame, [b.arvore.em, b.arvore.em + 12], [1, 0], clamp);

	return (
		<AbsoluteFill style={{backgroundColor: cor.papel}}>
			<AbsoluteFill
				style={{
					transform: `translate(${tremor.x}px, ${tremor.y}px) scale(${zoom})`,
					transformOrigin: '50% 45%',
				}}
			>
				{cadernoSome > 0 ? (
					<div
						style={{
							position: 'absolute',
							left: CADERNO_ESQUERDA,
							top: CADERNO_TOPO,
							width: CADERNO_LARGURA,
							height: PAGINA.altura,
							perspective: 2200,
							opacity: cadernoSome,
							// Fecha e desliza para o centro: o livro fechado fica onde
							// a árvore vai nascer.
							transform: `translateX(${(-PAGINA.largura / 2) * fecha}px)`,
						}}
					>
						<div
							style={{
								position: 'absolute',
								left: PAGINA.largura,
								width: PAGINA.largura,
								height: PAGINA.altura,
								perspective: 2200,
								transformOrigin: '50% 100%',
								transform: `scaleX(${1 - (1 - TRONCO_LARGURA) * estreita}) scaleY(${1 - (1 - TRONCO_ALTURA) * estreita})`,
							}}
						>
							<Pagina linhas={tela.contraste.paginas[0]} riscos={[1, 0, 1, 0]} lado="direita" />
							<div
								style={{
									position: 'absolute',
									left: -PAGINA.largura,
									width: PAGINA.largura,
									height: PAGINA.altura,
									transformStyle: 'preserve-3d',
									transformOrigin: 'right center',
									transform: `rotateY(${180 * fecha}deg)`,
								}}
							>
								<Pagina
									linhas={tela.contraste.paginas[1]}
									titulo={tela.contraste.tituloDoCaderno}
									lado="esquerda"
									style={{backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden'}}
								/>
								<div
									style={{
										position: 'absolute',
										inset: 0,
										borderRadius: 14,
										backgroundColor: cor.fundoForte,
										backfaceVisibility: 'hidden',
										WebkitBackfaceVisibility: 'hidden',
										transform: 'rotateY(180deg)',
									}}
								/>
							</div>
						</div>
					</div>
				) : null}

				<Img
					src={artes.arvoreFloresta.src}
					style={{
						position: 'absolute',
						left: (LARGURA - ARVORE_LARGURA) / 2,
						top: ARVORE_TOPO,
						width: ARVORE_LARGURA,
						clipPath: `circle(${cresce * RECORTE_FINAL}% at 50% 100%)`,
						transform: `scale(${0.9 + 0.1 * cresce})`,
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
						opacity: Math.min(marca * 2, 1),
						transform: `translateY(${(1 - marca) * 40}px) scale(${0.9 + 0.1 * marca})`,
					}}
				/>

				<div style={{position: 'absolute', top: SLOGAN_TOPO, width: LARGURA}}>
					<KineticText
						frame={frame}
						linhas={emSequencia(t3.slogan, b.slogan.em, (b.planejado.em - b.slogan.em) / 4, ['planejado'])}
						estilo={{...tipo.titulo, fontSize: 76, color: cor.texto}}
						corDoDestaque={cor.destaque}
						alinhamento="center"
					/>
				</div>
			</AbsoluteFill>
			<Flash frame={frame} em={[b.cadernoFecha.em]} />
		</AbsoluteFill>
	);
};
