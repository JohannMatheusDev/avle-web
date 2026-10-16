import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Celular, CELULAR} from '../componentes/Celular';
import {PLACAR, Placar} from '../componentes/Placar';
import {Check, TelasDoCelular} from '../componentes/TelasDoCelular';
import {cor} from '../marca';
import {clamp, curvaDupla, mola, molas} from '../movimento';
import {tela} from '../roteiro';
import {areaSegura, larguraUtil, raio, tipo} from '../tema';
import {LARGURA, batidas} from '../timing';

const b = batidas.comoFunciona;
const t4 = tela.comoFunciona;

const CONTADOR_TOPO = areaSegura.topo + 20;
const BOLINHA = 76;
const ROTULO_DO_PASSO_TOPO = CONTADOR_TOPO + BOLINHA + 24;
const PALCO_TOPO = 450;
const ENTRADA = 18;
const SAIDA = 12;
const TROCA_DE_ROTULO = 8;

const PLACAR_ROTULO_TOPO = PALCO_TOPO + 40;
const PLACAR_TOPO = PLACAR_ROTULO_TOPO + 70;
const SELO_TOPO = PLACAR_TOPO + PLACAR.digitoAltura + 40;
const CONTEMPLADA_TOPO = SELO_TOPO + 130;

/**
 * Como funciona, 11–21 s. Três passos, com o contador "1 · 2 · 3" no topo:
 * a parcela fixa no painel da cliente, a cobrança no WhatsApp e o sorteio.
 *
 * É a cena mais longa e a mais falada (cerca de 37 palavras em 10 s). Cada
 * passo começa quando a narração chega nele, e dentro de cada passo algo novo
 * acontece a cada segundo e meio, no máximo.
 */
export const Cena4ComoFunciona: React.FC = () => {
	const frame = useCurrentFrame();

	const celularEntra = mola(frame, b.celularEntra, ENTRADA);
	const celularSai = interpolate(frame, [b.celularSai, b.celularSai + SAIDA], [0, 1], {
		...clamp,
		easing: curvaDupla,
	});
	const placarEntra = mola(frame, b.placarEntra, ENTRADA, molas.firme);

	return (
		<AbsoluteFill style={{backgroundColor: cor.papel}}>
			<Contador frame={frame} />

			{celularSai < 1 ? (
				<Celular
					style={{
						position: 'absolute',
						left: (LARGURA - CELULAR.largura) / 2,
						top: PALCO_TOPO,
						opacity: celularEntra,
						transform: `translate(${-celularSai * LARGURA}px, ${(1 - celularEntra) * 160}px)`,
					}}
				>
					<TelasDoCelular frame={frame} />
				</Celular>
			) : null}

			{frame >= b.placarEntra ? (
				<AbsoluteFill style={{transform: `translateX(${(1 - placarEntra) * LARGURA}px)`}}>
					<Sorteio frame={frame} />
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};

const passoAtual = (frame: number) =>
	b.passos.reduce<number>((atual, inicio, i) => (frame >= inicio ? i : atual), 0);

const Contador: React.FC<{frame: number}> = ({frame}) => {
	const atual = passoAtual(frame);
	const desdeATroca = frame - b.passos[atual];
	const rotulo = interpolate(desdeATroca, [0, TROCA_DE_ROTULO], [0, 1], clamp);

	return (
		<>
			<div
				style={{
					position: 'absolute',
					top: CONTADOR_TOPO,
					width: LARGURA,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					gap: 22,
				}}
			>
				{t4.passos.map((_, i) => {
					const ativo = i === atual;
					const feito = i < atual;
					// A bolinha ativa acende com mola no frame em que o passo começa.
					const acende = ativo ? mola(frame, b.passos[i], 12, molas.firme) : feito ? 1 : 0;
					return (
						<React.Fragment key={i}>
							{i > 0 ? (
								<span style={{...tipo.numero, fontSize: 44, color: cor.textoTerciario}}>·</span>
							) : null}
							<div
								style={{
									...tipo.numero,
									width: BOLINHA,
									height: BOLINHA,
									fontSize: 38,
									borderRadius: raio.pilula,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									boxSizing: 'border-box',
									border: `2px solid ${ativo ? cor.fundoForte : cor.borda}`,
									backgroundColor: ativo ? cor.fundoForte : feito ? cor.bege : 'transparent',
									color: ativo ? cor.bege : feito ? cor.texto : cor.textoTerciario,
									transform: `scale(${ativo ? 0.9 + acende * 0.1 : 0.9})`,
								}}
							>
								{i + 1}
							</div>
						</React.Fragment>
					);
				})}
			</div>
			<div
				style={{
					...tipo.rotulo,
					fontSize: 42,
					fontWeight: 400,
					position: 'absolute',
					top: ROTULO_DO_PASSO_TOPO,
					width: LARGURA,
					textAlign: 'center',
					color: cor.texto,
					opacity: rotulo,
					transform: `translateY(${(1 - rotulo) * 14}px)`,
				}}
			>
				{t4.passos[atual]}
			</div>
		</>
	);
};

const Sorteio: React.FC<{frame: number}> = ({frame}) => {
	const selo = mola(frame, b.selo, ENTRADA);
	const contemplada = mola(frame, b.contemplada, ENTRADA);
	const larguraDoPlacar = PLACAR.digitoLargura * 3 + PLACAR.espaco * 2;

	return (
		<>
			<div
				style={{
					...tipo.rotulo,
					position: 'absolute',
					top: PLACAR_ROTULO_TOPO,
					width: LARGURA,
					textAlign: 'center',
					color: cor.textoSecundario,
				}}
			>
				{t4.placarRotulo}
			</div>

			<div style={{position: 'absolute', top: PLACAR_TOPO, left: (LARGURA - larguraDoPlacar) / 2}}>
				<Placar
					frame={frame}
					numero={t4.numeroContemplado}
					comeca={b.placarEntra}
					travam={b.digitosTravam}
				/>
			</div>

			<div
				style={{
					position: 'absolute',
					top: SELO_TOPO,
					width: LARGURA,
					display: 'flex',
					justifyContent: 'center',
				}}
			>
				<div
					style={{
						...tipo.rotulo,
						fontSize: 36,
						display: 'flex',
						alignItems: 'center',
						gap: 16,
						padding: '16px 32px 16px 18px',
						borderRadius: raio.pilula,
						backgroundColor: cor.fundoForte,
						color: cor.bege,
						opacity: selo,
						transform: `scale(${0.85 + selo * 0.15})`,
					}}
				>
					<Check progresso={selo} tamanho={44} corDoFundo={cor.fundoMarca} />
					{t4.selo}
				</div>
			</div>

			<div
				style={{
					position: 'absolute',
					top: CONTEMPLADA_TOPO,
					left: areaSegura.esquerda,
					width: larguraUtil,
					boxSizing: 'border-box',
					padding: '40px 48px',
					borderRadius: raio.cartaoGrande,
					backgroundColor: cor.destaque,
					color: cor.cartao,
					opacity: contemplada,
					transform: `translateY(${(1 - contemplada) * 120}px)`,
				}}
			>
				<div style={{...tipo.titulo, fontSize: 88}}>{t4.contempladaTitulo}</div>
				<div style={{...tipo.cartao, fontSize: 46, color: cor.cartao, marginTop: 12}}>
					{t4.contempladaTexto}
				</div>
			</div>
		</>
	);
};
