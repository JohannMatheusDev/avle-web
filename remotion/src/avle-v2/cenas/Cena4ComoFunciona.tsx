import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {cor} from '../marca';
import {clamp, curvaDupla, fase, mola, molas, punch, zoomLento} from '../movimento';
import {Flash} from '../motion/Flash';
import {MockupCelular, telaDe} from '../motion/MockupCelular';
import {deslocamentoDoShake} from '../motion/Shake';
import {TelaDaConversa, TelaDoGrupo, TelaDoSorteio} from '../pecas/TelasComoFunciona';
import {tela} from '../roteiro';
import {ALTURA, LARGURA, batidas, cenas} from '../timing';
import {areaSegura, tipo} from '../tema';

const b = batidas.comoFunciona;
const t4 = tela.comoFunciona;

const CELULAR = {largura: 560, altura: 980} as const;
const TELA = telaDe(CELULAR.largura, CELULAR.altura);
const CELULAR_ESQUERDA = LARGURA - areaSegura.esquerda - CELULAR.largura;
const CELULAR_TOPO = 330;
const CONTADOR_TOPO = 560;
const NUMERO_ATIVO = 150;
const NUMERO_INATIVO = 92;
const NUMERO_DE_FUNDO = 1000;

/** Parallax: cada camada anda uma distância diferente durante o passo. */
const PARALLAX = {fundo: 40, celular: -24, tela: -22} as const;

/**
 * Como funciona, 11–21 s. O celular fica fixo e a tela troca a cada passo;
 * o contador "1 · 2 · 3" grande na lateral acende o passo em terracota.
 *
 * Duas quebras de padrão moram aqui: aos 14 s a tela inteira vira terracota
 * com "WhatsApp.", e aos 19 s a imagem congela no número sorteado com a cor
 * invertida por 4 frames. No fim, a câmera entra na tela do celular, que vira
 * o fundo de papel da cena seguinte (o match cut com o benefício).
 */
export const Cena4ComoFunciona: React.FC = () => {
	const real = useCurrentFrame();
	const congelaFim = b.congela.em + (b.congela.dur ?? 0);
	// Durante o congelamento tudo lê o frame do beat; depois retoma no relógio,
	// para os beats seguintes continuarem nos frames de `timing.ts`.
	const frame = real >= b.congela.em && real < congelaFim ? b.congela.em : real;

	const passo = b.passos.reduce<number>((atual, p, i) => (frame >= p.em ? i : atual), 0);
	const inicioDoPasso = b.passos[passo].em;
	const fimDoPasso = passo + 1 < b.passos.length ? b.passos[passo + 1].em : cenas.comoFunciona.duracao;
	const p = fase(frame, inicioDoPasso, fimDoPasso, (x) => x);

	const entra = mola(frame, b.celularEntra.em, 16, molas.kinetic);
	const zoomNaTela = fase(frame, b.zoomNaTela.em, b.zoomNaTela.em + (b.zoomNaTela.dur ?? 0), curvaDupla);
	// Escala que faz a tela do celular cobrir o quadro inteiro.
	const escalaFinal = Math.max(LARGURA / TELA.largura, ALTURA / TELA.altura) * 1.06;
	const zoom = zoomLento(frame, 0, cenas.comoFunciona.duracao) * (1 + (escalaFinal - 1) * zoomNaTela);
	const centroDaTela = {x: CELULAR_ESQUERDA + CELULAR.largura / 2, y: CELULAR_TOPO + CELULAR.altura / 2};
	const conteudoSome = interpolate(zoomNaTela, [0.3, 0.8], [1, 0], clamp);

	const invertido = real >= b.inverte.em && real < b.inverte.em + (b.inverte.dur ?? 0);
	const tremor = deslocamentoDoShake(real, [b.interrupcao.em, b.congela.em], 'como-funciona');
	const naInterrupcao = real >= b.interrupcao.em && real < b.interrupcao.em + (b.interrupcao.dur ?? 0);

	return (
		<AbsoluteFill style={{backgroundColor: cor.papel, filter: invertido ? 'invert(1)' : undefined}}>
			<AbsoluteFill
				style={{
					transform: `translate(${tremor.x}px, ${tremor.y}px) scale(${zoom})`,
					transformOrigin: `${centroDaTela.x}px ${centroDaTela.y}px`,
				}}
			>
				<div
					style={{
						...tipo.numero,
						position: 'absolute',
						right: -60,
						top: 160,
						fontSize: NUMERO_DE_FUNDO,
						color: cor.areia,
						transform: `translateY(${PARALLAX.fundo * p}px)`,
						opacity: 1 - zoomNaTela,
					}}
				>
					{passo + 1}
				</div>

				<ContadorLateral frame={frame} passo={passo} some={zoomNaTela} />

				<MockupCelular
					largura={CELULAR.largura}
					altura={CELULAR.altura}
					deslocamentoDaTela={PARALLAX.tela * p}
					style={{
						position: 'absolute',
						left: CELULAR_ESQUERDA,
						top: CELULAR_TOPO,
						opacity: Math.min(entra * 2, 1),
						transform: `translateY(${(1 - entra) * 500 + PARALLAX.celular * p}px)`,
					}}
				>
					<div style={{position: 'absolute', inset: 0, opacity: conteudoSome}}>
						{passo === 0 ? <TelaDoGrupo frame={frame} largura={TELA.largura} /> : null}
						{passo === 1 ? <TelaDaConversa frame={frame} largura={TELA.largura} /> : null}
						{passo === 2 ? <TelaDoSorteio frame={frame} largura={TELA.largura} /> : null}
					</div>
				</MockupCelular>
			</AbsoluteFill>

			{naInterrupcao ? <Interrupcao frame={real} /> : null}
			<Flash frame={real} em={[b.interrupcao.em]} />
		</AbsoluteFill>
	);
};

const ContadorLateral: React.FC<{frame: number; passo: number; some: number}> = ({frame, passo, some}) => {
	const acende = mola(frame, b.passos[passo].em, 12, molas.kinetic);
	return (
		<div
			style={{
				position: 'absolute',
				left: areaSegura.esquerda,
				top: CONTADOR_TOPO,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 4,
				opacity: 1 - some,
			}}
		>
			{b.passos.map((_, i) => {
				const ativo = i === passo;
				return (
					<React.Fragment key={i}>
						{i > 0 ? <span style={{...tipo.numero, fontSize: 60, color: cor.textoTerciario}}>·</span> : null}
						<span
							style={{
								...tipo.numero,
								fontSize: ativo ? NUMERO_ATIVO : NUMERO_INATIVO,
								color: ativo ? cor.destaque : cor.textoTerciario,
								transform: `scale(${ativo ? (0.7 + 0.3 * acende) * punch(frame, b.passos[i].em + 2) : 1})`,
							}}
						>
							{i + 1}
						</span>
					</React.Fragment>
				);
			})}
		</div>
	);
};

const Interrupcao: React.FC<{frame: number}> = ({frame}) => {
	const entra = mola(frame, b.interrupcao.em, 8, molas.kinetic);
	return (
		<AbsoluteFill
			style={{
				backgroundColor: cor.destaque,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<div
				style={{
					...tipo.gigante,
					fontSize: 170,
					color: cor.bege,
					transform: `scale(${(1.35 - 0.35 * entra) * punch(frame, b.interrupcao.em + 5)})`,
				}}
			>
				{t4.interrupcao}
			</div>
		</AbsoluteFill>
	);
};
