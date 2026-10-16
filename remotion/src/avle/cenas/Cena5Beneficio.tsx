import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Dinheiro} from '../componentes/Dinheiro';
import {cor} from '../marca';
import {clamp, mola, molas} from '../movimento';
import {tela} from '../roteiro';
import {areaSegura, raio, tipo} from '../tema';
import {LARGURA, batidas} from '../timing';

const b = batidas.beneficio;
const t5 = tela.beneficio;

const ROTULO_TOPO = areaSegura.topo + 70;
const VALOR_TOPO = ROTULO_TOPO + 70;
const VALOR_TAMANHO = 156;
const GRAFICO_BASE = 1220;
const BARRA_ALTURA = 430;
const BARRA_LARGURA = 104;
const BARRA_ESPACO = 36;
const LEGENDA_DO_MES_TOPO = GRAFICO_BASE + 22;
const NOTA_TOPO = LEGENDA_DO_MES_TOPO + 64;
const APROXIMACAO = 1.03;
const ENTRADA = 16;

/** A barra de destaque do DESIGN.md: terracota no topo, sumindo para baixo. */
const BARRA_DEGRADE = 'linear-gradient(180deg,#BD6B42 0%,rgba(189,107,66,.15) 100%)';

/**
 * Benefício, 21–25 s. Barras mensais sobem uma depois da outra e o valor no
 * topo soma junto com elas, porque o número é a soma das barras e não um
 * contador independente: os dois nunca desencontram.
 *
 * O valor é ilustrativo e diz isso na tela (ver `tela.beneficio` no roteiro).
 */
export const Cena5Beneficio: React.FC = () => {
	const frame = useCurrentFrame();
	const subidas = t5.meses.map((_, i) =>
		mola(frame, b.primeiraBarra + i * b.intervaloEntreBarras, b.subidaDaBarra, molas.firme),
	);
	const total = subidas.reduce((soma, t) => soma + t * t5.porMes, 0);

	const rotulo = mola(frame, b.rotulo, ENTRADA, molas.firme);
	const nota = mola(frame, b.nota, ENTRADA, molas.firme);
	const etiqueta = mola(frame, b.etiqueta, ENTRADA);
	const escala = interpolate(frame, [0, b.aproximacaoFim], [1, APROXIMACAO], clamp);

	const larguraDoGrafico = t5.meses.length * BARRA_LARGURA + (t5.meses.length - 1) * BARRA_ESPACO;
	const esquerdaDoGrafico = (LARGURA - larguraDoGrafico) / 2;
	const ultima = t5.meses.length - 1;

	return (
		<AbsoluteFill style={{backgroundColor: cor.papel}}>
			<AbsoluteFill style={{transform: `scale(${escala})`, transformOrigin: '50% 40%'}}>
				<div
					style={{
						...tipo.rotulo,
						fontSize: 40,
						position: 'absolute',
						top: ROTULO_TOPO,
						width: LARGURA,
						textAlign: 'center',
						color: cor.textoSecundario,
						opacity: rotulo,
					}}
				>
					{t5.rotulo}
				</div>
				<div
					style={{
						position: 'absolute',
						top: VALOR_TOPO,
						width: LARGURA,
						textAlign: 'center',
						opacity: rotulo,
					}}
				>
					<Dinheiro valor={total} tamanho={VALOR_TAMANHO} />
				</div>

				{t5.meses.map((mes, i) => {
					const altura = BARRA_ALTURA * subidas[i];
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
									top: LEGENDA_DO_MES_TOPO,
									textAlign: 'center',
									color: cor.textoSecundario,
									opacity: subidas[i],
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
						opacity: etiqueta,
						// Puxada mais para a esquerda que o centro da barra: centrada, a
						// etiqueta da última barra passaria da margem da área segura.
						transform: `translateX(-70%) translateY(${(1 - etiqueta) * 16}px)`,
					}}
				>
					{`R$ ${new Intl.NumberFormat('pt-BR').format(t5.porMes)}/mês`}
				</div>

				<div
					style={{
						...tipo.rotulo,
						fontSize: 28,
						fontWeight: 400,
						position: 'absolute',
						top: NOTA_TOPO,
						width: LARGURA,
						textAlign: 'center',
						color: cor.textoSecundario,
						opacity: nota,
					}}
				>
					{t5.nota}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
