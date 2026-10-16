import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {cor} from '../marca';
import {clamp, curvaDeQueda, zoomLento} from '../movimento';
import {Contador} from '../motion/Contador';
import {Flash} from '../motion/Flash';
import {deslocamentoDoShake} from '../motion/Shake';
import {CelularDoGancho, contadorNoFrame, GANCHO_CELULAR, VIBRA_ANTES_DO_COMECO, vibracao} from '../pecas/CelularDoGancho';
import {tela} from '../roteiro';
import {LARGURA, batidas, cenas} from '../timing';
import {areaSegura, raio, tipo} from '../tema';

const b = batidas.gancho;
const t1 = tela.gancho;

const CELULAR_TOPO = 310;
const CARIMBO_TOPO = 700;
const CARIMBO_GIRO = -8;
const CARIMBO_ESCALA_INICIAL = 2.2;
/** O carimbo bate quando termina a descida; é aí que a tela treme. */
const carimboBate = b.carimbo.em + (b.carimbo.dur ?? 0);
const ESCURECE = 0.3;

/**
 * Gancho, 0–3 s. O celular já vibra no frame 0 e as notificações caem cada
 * vez mais rápido. No beat 75 tudo congela, a tela pisca e o carimbo cai.
 */
export const Cena1Gancho: React.FC = () => <QuadroDoGancho frame={useCurrentFrame()} />;

/**
 * O gancho num frame qualquer. A capa usa este mesmo quadro no último frame
 * da cena, já congelado e carimbado: capa e vídeo não divergem.
 */
export const QuadroDoGancho: React.FC<{frame: number}> = ({frame}) => {
	const congelou = frame >= b.congela.em;
	// Depois do congelamento, o celular, as notificações, o contador e a
	// câmera leem o frame do beat; só o carimbo e o tremor seguem o relógio.
	const f = Math.min(frame, b.congela.em);
	const impulsos = [VIBRA_ANTES_DO_COMECO, ...b.notificacoes.map((n) => n.em)];
	const vib = congelou ? {x: 0, giro: 0} : vibracao(f, impulsos, 'gancho');
	const zoom = zoomLento(f, 0, cenas.gancho.duracao);
	const tremor = deslocamentoDoShake(frame, [carimboBate], 'carimbo');
	const contador = contadorNoFrame(f);

	return (
		<AbsoluteFill style={{backgroundColor: cor.fundoForte, overflow: 'hidden'}}>
			<AbsoluteFill
				style={{
					transform: `translate(${tremor.x}px, ${tremor.y}px) scale(${zoom})`,
					transformOrigin: '50% 40%',
				}}
			>
				<CelularDoGancho
					frame={f}
					style={{
						position: 'absolute',
						left: (LARGURA - GANCHO_CELULAR.largura) / 2,
						top: CELULAR_TOPO,
						transform: `translateX(${vib.x}px) rotate(${vib.giro}deg)`,
					}}
				/>

				{/* O contador fica acima do escurecimento: é o número que o gancho quer
				    que fique na cabeça. */}
				{congelou ? (
					<AbsoluteFill style={{backgroundColor: cor.fundoForte, opacity: ESCURECE}} />
				) : null}

				{contador.valor > 0 ? (
					<div
						style={{
							position: 'absolute',
							top: CELULAR_TOPO - 30,
							right: areaSegura.esquerda + 40,
							display: 'flex',
							alignItems: 'baseline',
							gap: 12,
							padding: '14px 28px',
							borderRadius: raio.pilula,
							backgroundColor: cor.destaque,
							color: cor.cartao,
						}}
					>
						<Contador
							valor={contador.valor}
							frame={f}
							ultimaTroca={contador.ultimaTroca}
							tamanho={64}
							corDoNumero={cor.cartao}
							pico={1.25}
						/>
						<span style={{...tipo.rotulo, fontSize: 28, color: cor.cartao}}>{t1.contadorRotulo}</span>
					</div>
				) : null}


				{/* Fora da tela do celular, para nenhuma notificação cobrir: o
				    brief proíbe número de resultado apresentado como real. */}
				<div
					style={{
						...tipo.rotulo,
						fontSize: 26,
						position: 'absolute',
						top: areaSegura.topo + 4,
						left: areaSegura.esquerda,
						color: cor.bege,
						opacity: 0.6,
					}}
				>
					{t1.aviso}
				</div>
			</AbsoluteFill>

			{congelou ? <Carimbo frame={frame} /> : null}
			<Flash frame={frame} em={[b.congela.em]} />
		</AbsoluteFill>
	);
};

const Carimbo: React.FC<{frame: number}> = ({frame}) => {
	const desce = interpolate(frame, [b.carimbo.em, carimboBate], [0, 1], {...clamp, easing: curvaDeQueda});
	const escala = CARIMBO_ESCALA_INICIAL - (CARIMBO_ESCALA_INICIAL - 1) * desce;
	return (
		<div
			style={{
				position: 'absolute',
				top: CARIMBO_TOPO,
				width: LARGURA,
				display: 'flex',
				justifyContent: 'center',
			}}
		>
			<div
				style={{
					...tipo.numero,
					fontSize: 116,
					fontWeight: 700,
					letterSpacing: '0.01em',
					lineHeight: 1.02,
					textAlign: 'center',
					color: cor.destaque,
					border: `12px solid ${cor.destaque}`,
					borderRadius: raio.cartao,
					padding: '30px 44px',
					backgroundColor: 'rgba(247,244,235,.94)',
					opacity: interpolate(desce, [0, 0.3], [0, 1], clamp),
					transform: `rotate(${CARIMBO_GIRO}deg) scale(${escala})`,
				}}
			>
				{t1.carimbo.map((linha) => (
					<div key={linha}>{linha}</div>
				))}
			</div>
		</div>
	);
};
