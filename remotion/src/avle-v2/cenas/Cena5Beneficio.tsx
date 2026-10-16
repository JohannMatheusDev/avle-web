import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {cor} from '../marca';
import {clamp, curva, mola, molas, punch, quantosPassaram, zoomLento} from '../movimento';
import {Contador} from '../motion/Contador';
import {KineticText, emSequencia} from '../motion/KineticText';
import {tela} from '../roteiro';
import {LARGURA, batidas, duracaoDaSequencia} from '../timing';
import {areaSegura, raio, tipo} from '../tema';

const b = batidas.beneficio;
const t5 = tela.beneficio;

const ROTULO_TOPO = areaSegura.topo + 50;
const VALOR_TOPO = ROTULO_TOPO + 90;
const VALOR_TAMANHO = 156;
const SELO_TOPO = VALOR_TOPO + VALOR_TAMANHO + 30;
const GRAFICO_BASE = 1250;
const BARRA_ALTURA = 440;
const BARRA_LARGURA = 104;
const BARRA_ESPACO = 36;
const SUBIDA = 18;
/** Entra como se a câmera saísse de dentro da tela do celular da cena 4. */
const ESCALA_DE_ENTRADA = 1.3;
const ZOOM_NO_TOTAL = 1.08;
const BARRA_DEGRADE = 'linear-gradient(180deg,#BD6B42 0%,rgba(189,107,66,.15) 100%)';

/**
 * Benefício, 21–25 s. Abre de dentro da tela do celular (o fundo de papel é
 * o mesmo, e a câmera recua) e as barras mensais sobem. O total é a soma das
 * barras, não um contador à parte, então os dois nunca desencontram. O selo
 * "valores ilustrativos" entra antes de o número terminar de subir.
 */
export const Cena5Beneficio: React.FC = () => {
	const frame = useCurrentFrame();
	const sai = interpolate(frame, [b.saiDoZoom.em, b.saiDoZoom.em + (b.saiDoZoom.dur ?? 0)], [ESCALA_DE_ENTRADA, 1], {
		...clamp,
		easing: curva,
	});
	const zoom =
		sai *
		zoomLento(frame, 0, duracaoDaSequencia('beneficio')) *
		punch(frame, b.zoomNoTotal.em, ZOOM_NO_TOTAL);

	const subidas = b.barras.map((barra) => mola(frame, barra.em, SUBIDA, molas.kinetic));
	const total = subidas.reduce((soma, t) => soma + Math.min(t, 1) * t5.porMes, 0);
	const barrasCheias = quantosPassaram(frame, b.barras);
	const selo = mola(frame, b.selo.em, 10, molas.kinetic);
	const etiqueta = mola(frame, b.etiqueta.em, 10, molas.kinetic);

	const larguraDoGrafico = t5.meses.length * BARRA_LARGURA + (t5.meses.length - 1) * BARRA_ESPACO;
	const esquerdaDoGrafico = (LARGURA - larguraDoGrafico) / 2;
	const ultima = t5.meses.length - 1;

	return (
		<AbsoluteFill style={{backgroundColor: cor.papel}}>
			<AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `50% ${VALOR_TOPO + VALOR_TAMANHO / 2}px`}}>
				<div style={{position: 'absolute', top: ROTULO_TOPO, width: LARGURA}}>
					<KineticText
						frame={frame}
						linhas={emSequencia([t5.rotulo], b.rotulo.em, 2, ['conta'])}
						estilo={{...tipo.rotulo, fontSize: 44, color: cor.textoSecundario}}
						corDoDestaque={cor.destaque}
						alinhamento="center"
					/>
				</div>

				<div style={{position: 'absolute', top: VALOR_TOPO, width: LARGURA, textAlign: 'center'}}>
					<Contador
						valor={total}
						frame={frame}
						ultimaTroca={frame >= b.total.em ? b.total.em : barrasCheias > 0 ? b.barras[barrasCheias - 1].em : undefined}
						tamanho={VALOR_TAMANHO}
						prefixo="R$"
						pico={frame >= b.total.em ? 1.15 : 1.05}
					/>
				</div>

				<div style={{position: 'absolute', top: SELO_TOPO, width: LARGURA, display: 'flex', justifyContent: 'center'}}>
					<div
						style={{
							...tipo.rotulo,
							fontSize: 28,
							padding: '10px 24px',
							borderRadius: raio.pilula,
							border: `2px solid ${cor.borda}`,
							color: cor.textoSecundario,
							opacity: Math.min(selo * 2, 1),
							transform: `scale(${0.8 + 0.2 * selo})`,
						}}
					>
						{t5.selo}
					</div>
				</div>

				{t5.meses.map((mes, i) => {
					const altura = BARRA_ALTURA * Math.max(subidas[i], 0);
					const esquerda = esquerdaDoGrafico + i * (BARRA_LARGURA + BARRA_ESPACO);
					return (
						<React.Fragment key={mes}>
							<div
								style={{
									position: 'absolute',
									left: esquerda,
									top: GRAFICO_BASE - altura,
									width: BARRA_LARGURA,
									height: altura,
									borderRadius: raio.pilula,
									background: i === ultima ? cor.destaque : BARRA_DEGRADE,
								}}
							/>
							<div
								style={{
									...tipo.rotulo,
									fontSize: 28,
									position: 'absolute',
									left: esquerda - 20,
									width: BARRA_LARGURA + 40,
									top: GRAFICO_BASE + 20,
									textAlign: 'center',
									color: cor.textoSecundario,
									opacity: Math.min(subidas[i] * 2, 1),
								}}
							>
								{mes}
							</div>
						</React.Fragment>
					);
				})}

				<div
					style={{
						...tipo.numero,
						fontSize: 32,
						position: 'absolute',
						left: esquerdaDoGrafico + ultima * (BARRA_LARGURA + BARRA_ESPACO) + BARRA_LARGURA / 2,
						top: GRAFICO_BASE - BARRA_ALTURA - 76,
						padding: '12px 22px',
						borderRadius: raio.pilula,
						backgroundColor: cor.fundoForte,
						color: cor.bege,
						whiteSpace: 'pre',
						opacity: Math.min(etiqueta * 2, 1),
						// Puxada para a esquerda: centrada na última barra, passaria da
						// margem da área segura.
						transform: `translateX(-70%) translateY(${(1 - etiqueta) * 20}px)`,
					}}
				>
					{`R$ ${new Intl.NumberFormat('pt-BR').format(t5.porMes)}/mês`}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
