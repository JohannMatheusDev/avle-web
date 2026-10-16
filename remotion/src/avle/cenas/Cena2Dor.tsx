import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Cartao} from '../componentes/Cartao';
import {cor} from '../marca';
import {clamp, fase, misturar, mola, molas} from '../movimento';
import {tela} from '../roteiro';
import {areaSegura, larguraUtil, raio, tipo} from '../tema';
import {batidas} from '../timing';

const b = batidas.dor;

const ROTULO_TOPO = areaSegura.topo + 70;
const CARTAO_ALTURA = 184;
const CARTAO_LARGURA = larguraUtil - 40;
const CARTOES_TOPO = [600, 812, 1024];
/** Levemente fora de esquadro: pilha feita às pressas, mas sempre legível. */
const CARTOES_GIRO = [-1.6, 1.3, -0.9];
const ENTRADA_DESLOCAMENTO = 220;
const ENTRADA_DURACAO = 18;
const X_TAMANHO = 104;
const X_DESENHO = 8;
const QUEDA_DISTANCIA = 1500;
/** Cada cartão tomba para um lado, como numa pilha derrubada. */
const QUEDA_GIRO = [-14, 11, -8];

/**
 * Dor, 3–8 s. Três cartões empilham, um a cada frase da narração, cada um
 * marcado com um X; no fim, um corte derruba os três de uma vez.
 */
export const Cena2Dor: React.FC = () => {
	const frame = useCurrentFrame();
	const rotulo = mola(frame, b.rotulo, ENTRADA_DURACAO, molas.firme);

	return (
		<AbsoluteFill style={{backgroundColor: cor.fundoMarca}}>
			<div
				style={{
					...tipo.rotulo,
					position: 'absolute',
					left: areaSegura.esquerda,
					top: ROTULO_TOPO,
					color: cor.bege,
					border: `2px solid rgba(247,244,235,.35)`,
					borderRadius: raio.pilula,
					padding: '14px 30px',
					opacity: rotulo,
					transform: `translateY(${(1 - rotulo) * 20}px)`,
				}}
			>
				{tela.dor.rotulo}
			</div>

			{tela.dor.cartoes.map((texto, i) => (
				<CartaoDaDor key={texto} texto={texto} indice={i} frame={frame} />
			))}
		</AbsoluteFill>
	);
};

const CartaoDaDor: React.FC<{texto: string; indice: number; frame: number}> = ({
	texto,
	indice,
	frame,
}) => {
	const entra = b.cartoes[indice];
	const t = mola(frame, entra, ENTRADA_DURACAO);
	const x = fase(frame, entra + b.atrasoDoX, entra + b.atrasoDoX + X_DESENHO);

	// Queda acelerada (t²): parece peso, não animação de interface.
	const inicioDaQueda = b.queda + indice * b.quedaEscalonada;
	const queda = interpolate(
		frame,
		[inicioDaQueda, inicioDaQueda + b.quedaDuracao],
		[0, 1],
		clamp,
	);
	const quedaY = queda * queda * QUEDA_DISTANCIA;
	const quedaGiro = queda * QUEDA_GIRO[indice];

	const y = (1 - t) * ENTRADA_DESLOCAMENTO + quedaY;
	const giro = misturar(0, CARTOES_GIRO[indice], t) + quedaGiro;

	return (
		<Cartao
			style={{
				position: 'absolute',
				left: areaSegura.esquerda + 20,
				top: CARTOES_TOPO[indice],
				width: CARTAO_LARGURA,
				height: CARTAO_ALTURA,
				display: 'flex',
				alignItems: 'center',
				gap: 36,
				padding: '0 44px',
				boxSizing: 'border-box',
				opacity: interpolate(t, [0, 0.3], [0, 1], clamp),
				transform: `translateY(${y}px) rotate(${giro}deg) scale(${misturar(0.94, 1, t)})`,
			}}
		>
			<MarcaX progresso={x} />
			<span style={tipo.cartao}>{texto}</span>
		</Cartao>
	);
};

/** O X é desenhado traço a traço, não aparece pronto. */
const MarcaX: React.FC<{progresso: number}> = ({progresso}) => {
	const traco = 34;
	const primeiro = Math.min(progresso * 2, 1);
	const segundo = Math.max(progresso * 2 - 1, 0);
	return (
		<svg width={X_TAMANHO} height={X_TAMANHO} viewBox="0 0 104 104" style={{flexShrink: 0}}>
			<circle
				cx={52}
				cy={52}
				r={52}
				style={{fill: cor.negativoSuave, opacity: Math.min(progresso * 3, 1)}}
			/>
			<line
				x1={35}
				y1={35}
				x2={69}
				y2={69}
				strokeWidth={8}
				strokeLinecap="round"
				strokeDasharray={traco * 1.5}
				strokeDashoffset={traco * 1.5 * (1 - primeiro)}
				style={{stroke: cor.negativo}}
			/>
			<line
				x1={69}
				y1={35}
				x2={35}
				y2={69}
				strokeWidth={8}
				strokeLinecap="round"
				strokeDasharray={traco * 1.5}
				strokeDashoffset={traco * 1.5 * (1 - segundo)}
				style={{stroke: cor.negativo}}
			/>
		</svg>
	);
};
