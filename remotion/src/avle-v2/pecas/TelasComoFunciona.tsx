import React from 'react';
import {Img, interpolate} from 'remotion';
import {artes, cor, hachura} from '../marca';
import {clamp, curvaDupla, fase, mola, molas, punch, quantosPassaram} from '../movimento';
import {Contador} from '../motion/Contador';
import {tela} from '../roteiro';
import {batidas} from '../timing';
import {raio, tipo} from '../tema';
import {Check, Dedo, Loja, Sacola} from './Icones';
import {Placar} from './Placar';

const b = batidas.comoFunciona;
const t4 = tela.comoFunciona;

const MARGEM = 28;
const TOPO = 110;
const ENTRADA = 12;

/**
 * As três telas do celular da cena 4, uma por passo. Recebem o frame da
 * cena (já congelado no pattern interrupt) e a largura da tela, e se desenham
 * em coordenadas da tela, para o aparelho poder ficar fixo enquanto elas
 * trocam.
 */

export const TelaDoGrupo: React.FC<{frame: number; largura: number}> = ({frame, largura}) => {
	const cartao = mola(frame, b.cartaoDoGrupo.em, ENTRADA, molas.kinetic);
	const cotasCheias = quantosPassaram(frame, b.cotas);
	const larguraDoCartao = largura - MARGEM * 2;

	return (
		<div style={{position: 'absolute', inset: 0, padding: `${TOPO}px ${MARGEM}px 0`}}>
			<div style={{...tipo.cartao, fontSize: 46, fontWeight: 300, color: cor.texto, marginBottom: 26}}>
				{t4.saudacao}
			</div>

			<div
				style={{
					width: larguraDoCartao,
					boxSizing: 'border-box',
					padding: 30,
					borderRadius: raio.cartao,
					backgroundColor: cor.cartao,
					boxShadow: '0 22px 44px -30px rgba(11,30,20,.55)',
					transform: `translateX(${(1 - cartao) * largura}px)`,
				}}
			>
				<div style={{...tipo.rotulo, fontSize: 28, color: cor.textoSecundario}}>{t4.grupo}</div>
				<div style={{...tipo.rotulo, fontSize: 34, color: cor.texto, marginTop: 20}}>{t4.parcelaRotulo}</div>
				<div style={{marginTop: 8, transformOrigin: 'left center'}}>
					{frame >= b.parcela.em ? (
						<Contador
							valor={t4.parcelaValor}
							frame={frame}
							ultimaTroca={b.parcela.em}
							tamanho={120}
							prefixo="R$"
							sufixo="/mês"
							pico={1.15}
						/>
					) : (
						<div style={{height: 120}} />
					)}
				</div>
			</div>

			<div
				style={{
					width: larguraDoCartao,
					boxSizing: 'border-box',
					marginTop: 22,
					padding: 30,
					borderRadius: raio.cartao,
					backgroundColor: cor.cartao,
					opacity: interpolate(frame, [b.cotas[0].em - 6, b.cotas[0].em], [0, 1], clamp),
				}}
			>
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
					<span style={{...tipo.numero, fontSize: 52, color: cor.texto}}>
						{cotasCheias}
						<span style={{fontSize: 30, color: cor.textoSecundario, fontWeight: 500}}> de {t4.cotasTotal}</span>
					</span>
					<span style={{...tipo.rotulo, fontSize: 26, color: cor.textoSecundario}}>{t4.cotasRotulo}</span>
				</div>
				<div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginTop: 26}}>
					{Array.from({length: t4.cotasTotal}, (_, i) => {
						const cheia = i < b.cotas.length ? mola(frame, b.cotas[i].em, 8, molas.kinetic) : 0;
						return (
							<div
								key={i}
								style={{
									aspectRatio: '1',
									borderRadius: raio.pilula,
									backgroundImage: cheia > 0 ? undefined : hachura,
									backgroundColor: cheia > 0 ? cor.destaque : cor.bege,
									transform: `scale(${cheia > 0 ? 0.6 + 0.4 * cheia : 1})`,
								}}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
};

const BALAO_TOPO = 190;
const BALAO_TEXTO_ALTURA = 200;
const BALAO_PADDING = 28;
const BOTAO_ALTURA = 84;
const BOTAO_TOPO = BALAO_TOPO + BALAO_PADDING + BALAO_TEXTO_ALTURA + 20;
const DEDO = 130;
const TOQUE_DURACAO = 8;
const RIPPLE = 160;
const VIRA_CHECK = 8;

export const TelaDaConversa: React.FC<{frame: number; largura: number}> = ({frame, largura}) => {
	const balao = mola(frame, b.balao.em, ENTRADA, molas.kinetic);
	const viraCheck = fase(frame, b.pago.em, b.pago.em + VIRA_CHECK, curvaDupla);
	const check = mola(frame, b.pago.em, 14, molas.kinetic);
	const emDia = mola(frame, b.emDia.em, ENTRADA, molas.kinetic);
	const larguraDoBalao = largura - MARGEM * 2 - 30;

	const dedoChega = fase(frame, b.dedo.em, b.toque.em, curvaDupla);
	const toque = interpolate(frame, [b.toque.em, b.toque.em + TOQUE_DURACAO / 2, b.toque.em + TOQUE_DURACAO], [0, 1, 0], clamp);
	const ripple = fase(frame, b.toque.em, b.toque.em + 12);
	const dedoSome = interpolate(frame, [b.pago.em, b.pago.em + 4], [1, 0], clamp);
	const centroDoBotao = {x: MARGEM + larguraDoBalao / 2, y: BOTAO_TOPO + BOTAO_ALTURA / 2};

	return (
		<div style={{position: 'absolute', inset: 0, backgroundColor: cor.bege}}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 18,
					height: 150,
					boxSizing: 'border-box',
					padding: `60px ${MARGEM}px 0`,
					backgroundColor: cor.cartao,
					borderBottom: `1px solid ${cor.borda}`,
				}}
			>
				<div
					style={{
						width: 64,
						height: 64,
						borderRadius: raio.pilula,
						backgroundColor: cor.fundoMarca,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Img src={artes.arvoreCreme.src} style={{width: 46}} />
				</div>
				<span style={{...tipo.rotulo, fontSize: 36, fontWeight: 600, color: cor.texto}}>{t4.contato}</span>
			</div>

			<div
				style={{
					position: 'absolute',
					top: BALAO_TOPO,
					left: MARGEM,
					width: larguraDoBalao,
					boxSizing: 'border-box',
					padding: BALAO_PADDING,
					borderRadius: `8px ${raio.cartao}px ${raio.cartao}px ${raio.cartao}px`,
					backgroundColor: cor.cartao,
					opacity: Math.min(balao * 2, 1) * (1 - viraCheck),
					transform: `scale(${(0.8 + 0.2 * Math.min(balao, 1.05)) * (1 - 0.6 * viraCheck)})`,
					transformOrigin: '50% 50%',
				}}
			>
				<div style={{...tipo.cartao, fontSize: 36, lineHeight: 1.25, height: BALAO_TEXTO_ALTURA, color: cor.texto}}>
					{t4.mensagem}
				</div>
				<div
					style={{
						...tipo.rotulo,
						fontSize: 34,
						fontWeight: 600,
						marginTop: 20,
						height: BOTAO_ALTURA,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: raio.pilula,
						backgroundColor: cor.fundoForte,
						color: cor.cartao,
						transform: `scale(${1 - 0.06 * toque})`,
					}}
				>
					{t4.botaoPix}
				</div>
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
						border: `4px solid ${cor.destaque}`,
						opacity: 1 - ripple,
					}}
				/>
			) : null}

			{frame >= b.dedo.em && dedoSome > 0 ? (
				<div
					style={{
						position: 'absolute',
						// A ponta do indicador do ícone fica a 1/3 da largura e no topo.
						left: centroDoBotao.x - DEDO / 3 + (1 - dedoChega) * 160,
						top: centroDoBotao.y - DEDO * 0.08 + (1 - dedoChega) * 260,
						opacity: dedoSome * Math.min(dedoChega * 3, 1),
						transform: `scale(${1 - 0.1 * toque})`,
					}}
				>
					<Dedo tamanho={DEDO} corDoTraco={cor.fundoForte} espessura={4.2} style={{position: 'absolute'}} />
					<Dedo tamanho={DEDO} corDoTraco={cor.cartao} espessura={2} style={{position: 'absolute'}} />
				</div>
			) : null}

			{frame >= b.pago.em ? (
				<div
					style={{
						position: 'absolute',
						top: BALAO_TOPO + 40,
						width: largura,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: 20,
						opacity: Math.min(check * 2, 1),
						transform: `scale(${0.6 + 0.4 * check})`,
					}}
				>
					<Check progresso={Math.min(check, 1)} tamanho={170} />
					<div style={{...tipo.titulo, fontSize: 72, color: cor.positivo}}>{t4.pago}</div>
				</div>
			) : null}

			{frame >= b.emDia.em ? (
				<div style={{position: 'absolute', top: BALAO_TOPO + 400, width: largura, display: 'flex', justifyContent: 'center'}}>
					<div
						style={{
							...tipo.rotulo,
							fontSize: 32,
							padding: '16px 30px',
							borderRadius: raio.pilula,
							backgroundColor: cor.positivoSuave,
							color: cor.positivo,
							opacity: Math.min(emDia * 2, 1),
							transform: `translateY(${(1 - emDia) * 30}px)`,
						}}
					>
						{t4.emDia}
					</div>
				</div>
			) : null}
		</div>
	);
};

const DIGITO = {largura: 140, altura: 190, espaco: 18} as const;
const SACOLA = 96;
const LOJA = 170;

export const TelaDoSorteio: React.FC<{frame: number; largura: number}> = ({frame, largura}) => {
	const selo = mola(frame, b.selo.em, ENTRADA, molas.kinetic);
	const contemplada = mola(frame, b.contemplada.em, ENTRADA, molas.kinetic);
	const sacolaFim = b.sacola.em + (b.sacola.dur ?? 0);
	const anda = fase(frame, b.sacola.em, sacolaFim, curvaDupla);
	const entraNaLoja = interpolate(frame, [sacolaFim - 6, sacolaFim], [1, 0], clamp);
	const larguraDoPlacar = DIGITO.largura * 3 + DIGITO.espaco * 2;
	const lojaX = largura - MARGEM - LOJA;
	const sacolaX = interpolate(anda, [0, 1], [MARGEM, lojaX + (LOJA - SACOLA) / 2]);

	return (
		<div style={{position: 'absolute', inset: 0, backgroundColor: cor.papel}}>
			<div
				style={{
					...tipo.rotulo,
					fontSize: 32,
					position: 'absolute',
					top: TOPO,
					width: largura,
					textAlign: 'center',
					color: cor.textoSecundario,
				}}
			>
				{t4.sorteioRotulo}
			</div>
			<div style={{position: 'absolute', top: TOPO + 60, left: (largura - larguraDoPlacar) / 2}}>
				<Placar
					frame={frame}
					numero={t4.numero}
					comeca={b.placar.em}
					travam={b.digitos.map((d) => d.em)}
					largura={DIGITO.largura}
					altura={DIGITO.altura}
					espaco={DIGITO.espaco}
				/>
			</div>

			<div style={{position: 'absolute', top: TOPO + 290, width: largura, display: 'flex', justifyContent: 'center'}}>
				<div
					style={{
						...tipo.rotulo,
						fontSize: 27,
						display: 'flex',
						alignItems: 'center',
						gap: 12,
						padding: '12px 24px 12px 12px',
						borderRadius: raio.pilula,
						backgroundColor: cor.fundoForte,
						color: cor.bege,
						opacity: Math.min(selo * 2, 1),
						transform: `scale(${(0.7 + 0.3 * selo) * (frame >= b.selo.em ? punch(frame, b.selo.em + 4, 1.08) : 1)})`,
					}}
				>
					<Check progresso={Math.min(selo, 1)} tamanho={40} fundo={cor.fundoMarca} />
					{t4.selo}
				</div>
			</div>

			<div
				style={{
					position: 'absolute',
					top: TOPO + 390,
					left: MARGEM,
					width: largura - MARGEM * 2,
					boxSizing: 'border-box',
					padding: '28px 32px',
					borderRadius: raio.cartao,
					backgroundColor: cor.destaque,
					color: cor.cartao,
					opacity: Math.min(contemplada * 2, 1),
					transform: `translateY(${(1 - contemplada) * 80}px)`,
				}}
			>
				<div style={{...tipo.titulo, fontSize: 64}}>{t4.contempladaTitulo}</div>
				<div style={{...tipo.cartao, fontSize: 30, marginTop: 6}}>{t4.contempladaTexto}</div>
			</div>

			{frame >= b.sacola.em - 4 ? (
				<div
					style={{
						position: 'absolute',
						top: TOPO + 610,
						left: 0,
						width: largura,
						height: LOJA + 60,
						opacity: interpolate(frame, [b.sacola.em - 4, b.sacola.em], [0, 1], clamp),
					}}
				>
					<div style={{position: 'absolute', left: lojaX, top: 0}}>
						<Loja tamanho={LOJA} corDoTraco={cor.fundoForte} espessura={1.6} />
					</div>
					<div
						style={{
							position: 'absolute',
							left: sacolaX,
							top: LOJA - SACOLA - 4 - Math.sin(anda * Math.PI) * 30,
							opacity: entraNaLoja,
							transform: `scale(${0.7 + 0.3 * entraNaLoja})`,
						}}
					>
						<Sacola tamanho={SACOLA} corDoTraco={cor.destaque} espessura={2.2} />
					</div>
					<div
						style={{
							...tipo.rotulo,
							fontSize: 26,
							position: 'absolute',
							top: LOJA + 16,
							left: lojaX - 40,
							width: LOJA + 80,
							textAlign: 'center',
							color: cor.textoSecundario,
						}}
					>
						{t4.retirada}
					</div>
				</div>
			) : null}
		</div>
	);
};
