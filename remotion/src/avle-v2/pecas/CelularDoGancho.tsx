import React from 'react';
import {interpolate, random} from 'remotion';
import {cor} from '../marca';
import {clamp, curvaDupla, mola, molas} from '../movimento';
import {MockupCelular, telaDe} from '../motion/MockupCelular';
import {NOTIFICACAO_ALTURA, Notificacao} from '../motion/Notificacao';
import {tela} from '../roteiro';
import {batidas} from '../timing';
import {tipo} from '../tema';

const b = batidas.gancho;
const t1 = tela.gancho;

export const GANCHO_CELULAR = {largura: 860, altura: 1700} as const;

const MARGEM = 28;
const ESPACO = 14;
const PASSO = NOTIFICACAO_ALTURA + ESPACO;
/** A pilha começa abaixo do relógio e sobe por cima dele: a tela fica coberta. */
const PILHA_TOPO_INICIAL = 420;
const PILHA_TOPO_FINAL = 110;
const SOBE_DE = 40;
const SOBE_ATE = 72;
/** Curta: a última notificação (frame 68) precisa assentar antes do 75. */
const ENTRADA = 6;
const QUEDA = 70;

/**
 * O celular de uma loja no dia do vencimento, com as notificações de
 * pagamento caindo em cascata. Recebe o frame já congelado pela cena: no
 * gancho ele para no beat 75; na capa e no loop do CTA ele é uma foto.
 */
export const CelularDoGancho: React.FC<{frame: number; style?: React.CSSProperties}> = ({frame, style}) => {
	const {largura} = telaDe(GANCHO_CELULAR.largura, GANCHO_CELULAR.altura);
	const larguraDoCartao = largura - MARGEM * 2;
	const chegadas = b.notificacoes.map((n) => mola(frame, n.em, ENTRADA, molas.kinetic));
	const topo = interpolate(frame, [SOBE_DE, SOBE_ATE], [PILHA_TOPO_INICIAL, PILHA_TOPO_FINAL], {
		...clamp,
		easing: curvaDupla,
	});

	return (
		<MockupCelular
			largura={GANCHO_CELULAR.largura}
			altura={GANCHO_CELULAR.altura}
			fundoDaTela={cor.fundoMarca}
			contornoClaro
			style={style}
		>
			{/* O relógio some enquanto a pilha sobe por cima dele: aparecendo entre
			    as notificações, os dígitos finos pareciam desenhados por cima delas. */}
			<div
				style={{
					position: 'absolute',
					top: 120,
					width: '100%',
					textAlign: 'center',
					color: cor.bege,
					opacity: interpolate(frame, [SOBE_DE, SOBE_DE + 12], [1, 0], clamp),
				}}
			>
				<div style={{...tipo.numero, fontSize: 190, fontWeight: 300}}>{t1.hora}</div>
				<div style={{...tipo.rotulo, fontSize: 38, marginTop: 14}}>{t1.data}</div>
			</div>

			{t1.notificacoes.map((n, i) => {
				const chegou = chegadas[i];
				if (chegou <= 0) {
					return null;
				}
				// A mais nova fica em cima; cada uma que chega depois empurra esta
				// um passo para baixo, de forma contínua, junto com a mola dela.
				const empurrada = chegadas.slice(i + 1).reduce((soma, c) => soma + Math.min(c, 1), 0);
				const y = topo + empurrada * PASSO - (1 - chegou) * QUEDA;
				return (
					<Notificacao
						key={i}
						titulo={n.titulo}
						texto={n.texto}
						largura={larguraDoCartao}
						style={{
							position: 'absolute',
							left: MARGEM,
							top: y,
							opacity: interpolate(chegou, [0, 0.35], [0, 1], clamp),
							transform: `scale(${0.94 + 0.06 * Math.min(chegou, 1)})`,
						}}
					/>
				);
			})}
		</MockupCelular>
	);
};

const VIBRACAO_DURACAO = 7;
const VIBRACAO_X = 7;
const VIBRACAO_GIRO = 0.9;
/**
 * O primeiro "bzz" começa antes do frame 0: o vídeo abre com o celular já
 * vibrando, e não esperando para vibrar.
 */
export const VIBRA_ANTES_DO_COMECO = -3;

/** Tremor de celular vibrando: um impulso por notificação, que decai. */
export const vibracao = (frame: number, impulsos: readonly number[], semente: string) => {
	const forca = impulsos.reduce(
		(maior, em) => Math.max(maior, frame >= em ? 1 - (frame - em) / VIBRACAO_DURACAO : 0),
		0,
	);
	const intensidade = Math.max(forca, 0);
	return {
		x: (random(`${semente}-x-${frame}`) * 2 - 1) * VIBRACAO_X * intensidade,
		giro: (random(`${semente}-g-${frame}`) * 2 - 1) * VIBRACAO_GIRO * intensidade,
	};
};

export const contadorNoFrame = (frame: number) => {
	const passaram = b.notificacoes.filter((n) => frame >= n.em);
	return {
		valor: passaram.length === 0 ? 0 : t1.contador[passaram.length - 1],
		ultimaTroca: passaram.length === 0 ? undefined : passaram[passaram.length - 1].em,
	};
};
