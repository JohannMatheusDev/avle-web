import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import {alturaPara, artes, cor, PERFIL} from '../marca';
import {clamp, curvaDupla, fase, maiorPulso, mola, molas, zoomLento} from '../movimento';
import {KineticText, type PalavraCinetica} from '../motion/KineticText';
import {CelularDoGancho, GANCHO_CELULAR, vibracao} from '../pecas/CelularDoGancho';
import {Dedo} from '../pecas/Icones';
import {tela} from '../roteiro';
import {LARGURA, balancoDuracao, batidas, cenas, pulsoDuracao} from '../timing';
import {areaSegura, larguraUtil, raio, tipo} from '../tema';

const b = batidas.cta;
const t6 = tela.cta;

const TITULO_TOPO = areaSegura.topo + 80;
const BOTAO_TOPO = 730;
const BOTAO_ALTURA = 150;
const SETA_TOPO = BOTAO_TOPO + BOTAO_ALTURA + 40;
const SETA_ALTURA = 96;
const BIO_TOPO = SETA_TOPO + SETA_ALTURA + 10;
const RODAPE_TOPO = 1120;
const LOGO_LARGURA = 170;
const DEDO = 150;
const PULSO_ESCALA = 0.06;
const BALANCO = 24;
const RIPPLE = 260;

/** O celular do gancho, pequeno, no canto de baixo à direita da área segura. */
const MINI_ESCALA = 0.2;
const MINI_LARGURA = GANCHO_CELULAR.largura * MINI_ESCALA;
const MINI_ALTURA = GANCHO_CELULAR.altura * MINI_ESCALA;
/** O celular do loop mostra o gancho no meio da cascata, já cheio de notificações. */
const FRAME_DO_GANCHO_NO_LOOP = 70;

/**
 * CTA, 25–30 s. Título, botão que entra, pulsa duas vezes e é tocado pelo
 * dedo, seta para o link da bio, logo e "Siga @avle".
 *
 * Nos últimos 15 frames o celular do gancho volta a vibrar no canto: quando
 * a rede repete o vídeo, o fim emenda no começo, que abre com esse mesmo
 * celular vibrando.
 */
export const Cena6Cta: React.FC = () => {
	const frame = useCurrentFrame();
	const zoom = zoomLento(frame, 0, cenas.cta.duracao);

	const destaques: readonly string[] = t6.destaque;
	const linhas: PalavraCinetica[][] = t6.titulo.map((linha, i) =>
		linha.map((texto, j) => ({
			texto,
			em: (destaques.includes(texto) ? b.destaque.em : b.titulo[i].em) + j * 2,
			destaque: destaques.includes(texto),
		})),
	);

	const botao = mola(frame, b.botao.em, 16, molas.kinetic);
	const pulsada = maiorPulso(frame, b.pulsos.map((p) => p.em), pulsoDuracao);
	const toque = interpolate(frame, [b.toque.em, b.toque.em + 4, b.toque.em + 10], [0, 1, 0], clamp);
	const ripple = fase(frame, b.toque.em, b.toque.em + 14);
	const dedoChega = fase(frame, b.dedo.em, b.toque.em, curvaDupla);
	const dedoSai = fase(frame, b.toque.em + 10, b.seta.em + 6, curvaDupla);
	const seta = mola(frame, b.seta.em, 12, molas.kinetic);
	const balanco = maiorPulso(frame, b.balancos.map((p) => p.em), balancoDuracao);
	const rodape = mola(frame, b.rodape.em, 12, molas.kinetic);
	const loop = mola(frame, b.loop.em, 8, molas.kinetic);
	const vib = vibracao(frame, b.loopVibra.map((v) => v.em), 'loop');

	const centroDoBotao = {x: LARGURA / 2, y: BOTAO_TOPO + BOTAO_ALTURA / 2};

	return (
		<AbsoluteFill style={{backgroundColor: cor.fundoForte}}>
			<AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 40%'}}>
				<div style={{position: 'absolute', left: areaSegura.esquerda, top: TITULO_TOPO, width: larguraUtil}}>
					<KineticText
						frame={frame}
						linhas={linhas}
						estilo={{...tipo.titulo, color: cor.bege}}
						corDoDestaque={cor.destaque}
					/>
				</div>

				<div
					style={{
						position: 'absolute',
						top: BOTAO_TOPO,
						left: areaSegura.esquerda,
						width: larguraUtil,
						height: BOTAO_ALTURA,
						borderRadius: raio.pilula,
						backgroundColor: cor.destaque,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						opacity: Math.min(botao * 2, 1),
						transform: `translateY(${(1 - botao) * 90}px) scale(${(0.85 + 0.15 * botao) * (1 + pulsada * PULSO_ESCALA - toque * 0.05)})`,
						boxShadow: `0 0 0 ${pulsada * 26}px rgba(189,107,66,${0.28 * pulsada})`,
					}}
				>
					<span style={{...tipo.legenda, fontSize: 54, color: cor.cartao}}>{t6.botao}</span>
				</div>

				{frame >= b.toque.em && ripple < 1 ? (
					<div
						style={{
							position: 'absolute',
							left: centroDoBotao.x - (RIPPLE * ripple) / 2,
							top: centroDoBotao.y - (RIPPLE * ripple) / 2,
							width: RIPPLE * ripple,
							height: RIPPLE * ripple,
							borderRadius: raio.pilula,
							border: `5px solid ${cor.bege}`,
							opacity: 1 - ripple,
						}}
					/>
				) : null}

				{frame >= b.dedo.em && dedoSai < 1 ? (
					<div
						style={{
							position: 'absolute',
							// A ponta do indicador do ícone fica a 1/3 da largura, no topo.
							left: centroDoBotao.x - DEDO / 3 + (1 - dedoChega) * 220 + dedoSai * 300,
							top: centroDoBotao.y - DEDO * 0.08 + (1 - dedoChega) * 360 + dedoSai * 200,
							opacity: Math.min(dedoChega * 3, 1) * (1 - dedoSai),
							transform: `scale(${1 - 0.1 * toque})`,
						}}
					>
						<Dedo tamanho={DEDO} corDoTraco={cor.fundoForte} espessura={4.4} style={{position: 'absolute'}} />
						<Dedo tamanho={DEDO} corDoTraco={cor.bege} espessura={2} style={{position: 'absolute'}} />
					</div>
				) : null}

				<div
					style={{
						position: 'absolute',
						top: SETA_TOPO,
						width: LARGURA,
						display: 'flex',
						justifyContent: 'center',
						opacity: Math.min(seta * 2, 1),
						transform: `translateY(${(1 - seta) * -30 + balanco * BALANCO}px)`,
					}}
				>
					<svg width={60} height={SETA_ALTURA} viewBox="0 0 60 96" fill="none">
						<path
							d="M30 6 V88 M8 66 L30 88 L52 66"
							stroke={cor.bege}
							strokeWidth={6}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
				<div
					style={{
						...tipo.rotulo,
						fontSize: 42,
						position: 'absolute',
						top: BIO_TOPO,
						width: LARGURA,
						textAlign: 'center',
						color: cor.bege,
						opacity: Math.min(seta * 2, 1),
					}}
				>
					{t6.bio}
				</div>

				<div
					style={{
						position: 'absolute',
						top: RODAPE_TOPO,
						width: LARGURA,
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						gap: 36,
						opacity: Math.min(rodape * 2, 1),
						transform: `translateY(${(1 - rodape) * 30}px)`,
					}}
				>
					<Img
						src={artes.logoCreme.src}
						style={{width: LOGO_LARGURA, height: alturaPara(artes.logoCreme, LOGO_LARGURA)}}
					/>
					<div style={{...tipo.titulo, fontSize: 56, color: cor.bege}}>
						{t6.siga} <span style={{fontWeight: 600}}>{PERFIL}</span>
					</div>
				</div>
			</AbsoluteFill>

			{frame >= b.loop.em ? (
				<div
					style={{
						position: 'absolute',
						left: areaSegura.direita - MINI_LARGURA,
						top: areaSegura.base - MINI_ALTURA,
						width: MINI_LARGURA,
						height: MINI_ALTURA,
						opacity: Math.min(loop * 2, 1),
						transform: `translate(${vib.x * 0.6}px, ${(1 - loop) * 120}px) rotate(${-6 + vib.giro * 2}deg)`,
					}}
				>
					<div style={{transform: `scale(${MINI_ESCALA})`, transformOrigin: 'top left'}}>
						<CelularDoGancho frame={FRAME_DO_GANCHO_NO_LOOP} />
					</div>
				</div>
			) : null}
		</AbsoluteFill>
	);
};
