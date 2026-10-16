import React from 'react';
import {Img, interpolate} from 'remotion';
import {artes, cor, hachura} from '../marca';
import {clamp, curvaDupla, mola, molas, pulso} from '../movimento';
import {tela} from '../roteiro';
import {raio, tipo} from '../tema';
import {batidas} from '../timing';
import {Cartao} from './Cartao';
import {Dinheiro} from './Dinheiro';
import {TELA} from './Celular';

const b = batidas.comoFunciona;
const t4 = tela.comoFunciona;

const MARGEM = 30;
const TOPO_DO_CONTEUDO = 92;
const ENTRADA = 18;
const ENCHER_PARCELA = 12;
const TROCA_DURACAO = 10;
const TOQUE_DURACAO = 8;
const TOQUE_ESCALA = 0.06;

/**
 * As duas telas do passo 1 e 2 dentro do mesmo celular. O aparelho fica
 * parado e só a tela troca, para o espectador entender que a cobrança chega
 * no celular da mesma cliente que acabou de entrar no grupo.
 */
export const TelasDoCelular: React.FC<{frame: number}> = ({frame}) => {
	const troca = interpolate(frame, [b.trocaDeTela, b.trocaDeTela + TROCA_DURACAO], [0, 1], {
		...clamp,
		easing: curvaDupla,
	});
	return (
		<>
			<div style={{position: 'absolute', inset: 0, transform: `translateX(${-troca * TELA.largura}px)`}}>
				<PainelDaCliente frame={frame} />
			</div>
			<div
				style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - troca) * TELA.largura}px)`}}
			>
				<Conversa frame={frame} />
			</div>
		</>
	);
};

const sobe = (t: number, distancia = 28): React.CSSProperties => ({
	opacity: t,
	transform: `translateY(${(1 - t) * distancia}px)`,
});

const PainelDaCliente: React.FC<{frame: number}> = ({frame}) => {
	const cartao = mola(frame, b.cartaoDoGrupo, ENTRADA);
	const parcela = mola(frame, b.parcela, ENTRADA);

	// A barra enche suave, mas o número de parcelas troca seco, no frame da
	// batida: um contador que passa por "4,5 de 12" não existe.
	const enchidas = b.parcelasPagas.reduce(
		(soma, batida) => soma + mola(frame, batida, ENCHER_PARCELA, molas.firme),
		0,
	);
	const pagas = t4.parcelasIniciais + b.parcelasPagas.filter((batida) => frame >= batida).length;
	const preenchido = (t4.parcelasIniciais + enchidas) / t4.parcelasTotal;

	return (
		<div style={{position: 'absolute', inset: 0, padding: `${TOPO_DO_CONTEUDO}px ${MARGEM}px 0`}}>
			<div style={{...tipo.cartao, fontSize: 52, fontWeight: 300, marginBottom: 30, ...sobe(cartao)}}>
				{t4.saudacao}
			</div>

			<Cartao style={{padding: 34, marginBottom: 24, ...sobe(cartao, 40)}}>
				<div style={{...tipo.rotulo, fontSize: 30, color: cor.textoSecundario}}>{t4.grupo}</div>
				<div style={{...tipo.rotulo, fontSize: 36, color: cor.texto, marginTop: 24}}>
					{t4.parcelaRotulo}
				</div>
				<div style={{marginTop: 10, ...sobe(parcela, 20)}}>
					<Dinheiro valor={t4.parcelaValor} tamanho={124} sufixo="/mês" />
				</div>
			</Cartao>

			<Cartao style={{padding: 34, ...sobe(parcela, 40)}}>
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
					<span style={{...tipo.rotulo, fontSize: 34, color: cor.texto}}>{t4.parcelasRotulo}</span>
					<span style={{...tipo.numero, fontSize: 44, color: cor.texto}}>
						{pagas}
						<span style={{color: cor.textoSecundario, fontWeight: 500}}> de {t4.parcelasTotal}</span>
					</span>
				</div>
				<div
					style={{
						marginTop: 26,
						height: 38,
						borderRadius: raio.pilula,
						backgroundImage: hachura,
						backgroundColor: cor.bege,
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							width: `${preenchido * 100}%`,
							height: '100%',
							borderRadius: raio.pilula,
							backgroundColor: cor.destaque,
						}}
					/>
				</div>
			</Cartao>
		</div>
	);
};

const Conversa: React.FC<{frame: number}> = ({frame}) => {
	const balao = mola(frame, b.balao, ENTRADA);
	const toque = pulso(frame, b.toqueNoPix, TOQUE_DURACAO);
	const pago = mola(frame, b.pago, ENTRADA);

	return (
		<div style={{position: 'absolute', inset: 0, backgroundColor: cor.bege}}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 18,
					padding: `${TOPO_DO_CONTEUDO - 14}px ${MARGEM}px 22px`,
					backgroundColor: cor.cartao,
					borderBottom: `1px solid ${cor.borda}`,
				}}
			>
				<div
					style={{
						width: 68,
						height: 68,
						borderRadius: raio.pilula,
						backgroundColor: cor.fundoMarca,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Img src={artes.arvoreCreme.src} style={{width: 50}} />
				</div>
				<div>
					<div style={{...tipo.rotulo, fontSize: 36, fontWeight: 600, color: cor.texto}}>
						{t4.contatoNome}
					</div>
					<div style={{...tipo.rotulo, fontSize: 28, color: cor.textoSecundario}}>
						{t4.contatoDetalhe}
					</div>
				</div>
			</div>

			<div style={{padding: `40px ${MARGEM}px`}}>
				<div
					style={{
						backgroundColor: cor.cartao,
						borderRadius: `8px ${raio.cartao}px ${raio.cartao}px ${raio.cartao}px`,
						padding: 28,
						width: TELA.largura - MARGEM * 2 - 30,
						boxSizing: 'border-box',
						boxShadow: '0 1px 2px rgba(11,30,20,.08)',
						opacity: balao,
						transform: `translateX(${(1 - balao) * -70}px)`,
					}}
				>
					<div style={{...tipo.cartao, fontSize: 40, lineHeight: 1.25}}>{t4.mensagem}</div>
					<div
						style={{
							...tipo.rotulo,
							fontSize: 38,
							fontWeight: 600,
							marginTop: 28,
							padding: '24px 0',
							textAlign: 'center',
							borderRadius: raio.pilula,
							backgroundColor: cor.fundoForte,
							color: cor.cartao,
							transform: `scale(${1 - toque * TOQUE_ESCALA})`,
						}}
					>
						{t4.botaoPix}
					</div>
				</div>

				<div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 28}}>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 14,
							padding: '16px 28px 16px 18px',
							borderRadius: raio.pilula,
							backgroundColor: cor.positivoSuave,
							color: cor.positivo,
							...tipo.rotulo,
							fontSize: 40,
							fontWeight: 600,
							opacity: pago,
							transform: `scale(${0.8 + pago * 0.2})`,
							transformOrigin: 'right center',
						}}
					>
						<Check progresso={pago} tamanho={56} />
						{t4.pago}
					</div>
				</div>
			</div>
		</div>
	);
};

/** Check verde desenhado, não ícone pronto. */
export const Check: React.FC<{progresso: number; tamanho?: number; corDoFundo?: string}> = ({
	progresso,
	tamanho = 48,
	corDoFundo = cor.positivo,
}) => {
	const comprimento = 30;
	return (
		<svg width={tamanho} height={tamanho} viewBox="0 0 48 48">
			<circle cx={24} cy={24} r={24} style={{fill: corDoFundo}} />
			<path
				d="M14 25 L21 32 L34 17"
				fill="none"
				stroke="#FFFFFF"
				strokeWidth={5}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeDasharray={comprimento}
				strokeDashoffset={comprimento * (1 - progresso)}
			/>
		</svg>
	);
};
