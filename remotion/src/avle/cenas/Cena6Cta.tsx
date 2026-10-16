import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {alturaPara, artes, cor, PERFIL} from '../marca';
import {mola, molas, pulso} from '../movimento';
import {tela} from '../roteiro';
import {areaSegura, larguraUtil, raio, tipo} from '../tema';
import {LARGURA, batidas} from '../timing';

const b = batidas.cta;
const t6 = tela.cta;

const TITULO_TOPO = areaSegura.topo + 90;
const TITULO_TAMANHO = 116;
const BOTAO_TOPO = 800;
const BOTAO_ALTURA = 156;
const SETA_TOPO = BOTAO_TOPO + BOTAO_ALTURA + 44;
const SETA_ALTURA = 104;
const BIO_TOPO = SETA_TOPO + SETA_ALTURA + 14;
const RODAPE_TOPO = 1300;
const LOGO_LARGURA = 190;

const ENTRADA = 20;
const BOTAO_ENTRADA = 24;
const PULSO_ESCALA = 0.06;
const PULSO_HALO = 26;
const BALANCO = 26;

/**
 * CTA, 25–30 s. Os últimos 20 frames (`batidas.cta.congela` em diante) ficam
 * parados: toda mola aqui tem duração fixa e termina antes disso, para o
 * frame final servir de thumbnail de fim sem nenhum elemento a meio caminho.
 */
export const Cena6Cta: React.FC = () => {
	const frame = useCurrentFrame();

	const botao = mola(frame, b.botao, BOTAO_ENTRADA);
	const pulsada = b.pulsos.reduce((maior, inicio) => Math.max(maior, pulso(frame, inicio, b.pulsoDuracao)), 0);
	const seta = mola(frame, b.seta, ENTRADA, molas.firme);
	const balanco = b.setaBalancos.reduce(
		(maior, inicio) => Math.max(maior, pulso(frame, inicio, b.setaBalancoDuracao)),
		0,
	);
	const rodape = mola(frame, b.rodape, ENTRADA, molas.firme);

	return (
		<AbsoluteFill style={{backgroundColor: cor.fundoForte}}>
			<div style={{position: 'absolute', left: areaSegura.esquerda, top: TITULO_TOPO, width: larguraUtil}}>
				{t6.titulo.map((linha, i) => {
					const t = mola(frame, b.titulo[i], ENTRADA, molas.firme);
					return (
						<div
							key={linha.texto}
							style={{
								...tipo.titulo,
								fontSize: TITULO_TAMANHO,
								color: linha.destaque ? cor.destaque : cor.bege,
								opacity: t,
								transform: `translateY(${(1 - t) * 40}px)`,
							}}
						>
							{linha.texto}
						</div>
					);
				})}
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
					transform: `translateY(${(1 - botao) * 80}px) scale(${0.86 + botao * 0.14 + pulsada * PULSO_ESCALA})`,
					boxShadow: `0 0 0 ${pulsada * PULSO_HALO}px rgba(189,107,66,${0.28 * pulsada})`,
				}}
			>
				<span style={{...tipo.legenda, fontSize: 56, color: cor.cartao}}>{t6.botao}</span>
			</div>

			<div
				style={{
					position: 'absolute',
					top: SETA_TOPO,
					width: LARGURA,
					display: 'flex',
					justifyContent: 'center',
					opacity: seta,
					transform: `translateY(${(1 - seta) * -30 + balanco * BALANCO}px)`,
				}}
			>
				<Seta />
			</div>
			<div
				style={{
					...tipo.rotulo,
					fontSize: 44,
					position: 'absolute',
					top: BIO_TOPO,
					width: LARGURA,
					textAlign: 'center',
					color: cor.bege,
					opacity: seta,
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
					gap: 40,
					opacity: rodape,
					transform: `translateY(${(1 - rodape) * 30}px)`,
				}}
			>
				<Img
					src={artes.logoCreme.src}
					style={{width: LOGO_LARGURA, height: alturaPara(artes.logoCreme, LOGO_LARGURA)}}
				/>
				<div style={{...tipo.titulo, fontSize: 58, color: cor.bege}}>
					{t6.siga} <span style={{fontWeight: 600}}>{PERFIL}</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};

/** Seta desenhada em traço, no peso dos ícones Lucide que os painéis usam. */
const Seta: React.FC = () => (
	<svg width={64} height={SETA_ALTURA} viewBox="0 0 64 104" fill="none">
		<path
			d="M32 6 V96 M8 72 L32 96 L56 72"
			stroke={cor.bege}
			strokeWidth={6}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);
