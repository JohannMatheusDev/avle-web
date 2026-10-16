import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {cor} from '../marca';
import {clamp, curvaDeQueda, curvaDupla, fase, mola, molas, punch, quantosPassaram, zoomLento} from '../movimento';
import {Flash} from '../motion/Flash';
import {deslocamentoDoShake} from '../motion/Shake';
import {CADERNO_LARGURA, PAGINA, Pagina} from '../pecas/Caderno';
import {CheckDuplo} from '../pecas/Icones';
import {tela} from '../roteiro';
import {LARGURA, batidas, flipDuracao} from '../timing';
import {areaSegura, larguraUtil, raio, tipo} from '../tema';

const b = batidas.contraste;
const t2 = tela.contraste;

const RISCO_DURACAO = 6;
const CARIMBO_DESCIDA = 4;
const ENTRADA = 10;

/**
 * Contraste, 3–8 s. Três cortes de cerca de 1,3 s mostram o parcelado do jeito
 * antigo (o caderno de fiado, a mensagem lida e sem resposta, o calendário
 * vencendo), e a quebra de padrão fecha a cena: tela inteira em terracota
 * com uma palavra só.
 */
export const Cena2Contraste: React.FC = () => {
	const frame = useCurrentFrame();
	if (frame < b.mensagem.em) {
		return <CorteCaderno frame={frame} />;
	}
	if (frame < b.calendario.em) {
		return <CorteMensagem frame={frame} />;
	}
	if (frame < b.chega.em) {
		return <CorteCalendario frame={frame} />;
	}
	return <CorteChega frame={frame} />;
};

const Camera: React.FC<{frame: number; inicio: number; fim: number; children: React.ReactNode}> = ({
	frame,
	inicio,
	fim,
	children,
}) => (
	<AbsoluteFill style={{transform: `scale(${zoomLento(frame, inicio, fim)})`}}>{children}</AbsoluteFill>
);

const CADERNO_TOPO = 600;
const CADERNO_ESQUERDA = (LARGURA - CADERNO_LARGURA) / 2;
const CAPA_SOBRA = 14;

const CorteCaderno: React.FC<{frame: number}> = ({frame}) => {
	const paginas = t2.paginas;
	const viradas = b.viraPagina.map((v) => v.em);
	const completas = viradas.filter((em) => frame >= em + flipDuracao).length;
	const virando = viradas.findIndex((em) => frame >= em && frame < em + flipDuracao);

	const esquerda = paginas[completas * 2];
	const direita = paginas[Math.min(completas * 2 + 1, paginas.length - 1)];
	// Depois de cada virada, um nome da página nova é riscado na hora.
	const riscoNovo = completas > 0 ? fase(frame, b.risca[completas - 1].em, b.risca[completas - 1].em + RISCO_DURACAO) : 0;
	// Nomes que já estavam riscados antes: o caderno é velho.
	const riscosAntigos = [0, 0, 1, 0];

	return (
		<AbsoluteFill style={{backgroundColor: cor.fundoMarca}}>
			<Camera frame={frame} inicio={0} fim={b.mensagem.em}>
				<div
					style={{
						position: 'absolute',
						left: CADERNO_ESQUERDA,
						top: CADERNO_TOPO,
						width: CADERNO_LARGURA,
						height: PAGINA.altura,
						perspective: 2200,
						transform: 'rotate(-3deg)',
					}}
				>
					<div
						style={{
							position: 'absolute',
							inset: -CAPA_SOBRA,
							borderRadius: 22,
							backgroundColor: cor.fundoForte,
						}}
					/>
					<Pagina linhas={esquerda} riscos={riscosAntigos} titulo={completas === 0 ? t2.tituloDoCaderno : undefined} lado="esquerda" />
					<Pagina
						linhas={virando >= 0 ? paginas[Math.min(virando * 2 + 3, paginas.length - 1)] : direita}
						riscos={virando >= 0 ? [] : [riscoNovo]}
						lado="direita"
						style={{left: PAGINA.largura}}
					/>
					{virando >= 0 ? <Folha frame={frame} indice={virando} /> : null}
				</div>
			</Camera>
		</AbsoluteFill>
	);
};

/** A folha que vira: frente é a página da direita, verso é a próxima esquerda. */
const Folha: React.FC<{frame: number; indice: number}> = ({frame, indice}) => {
	const em = b.viraPagina[indice].em;
	const t = fase(frame, em, em + flipDuracao, curvaDupla);
	const face: React.CSSProperties = {backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden'};
	return (
		<div
			style={{
				position: 'absolute',
				left: PAGINA.largura,
				width: PAGINA.largura,
				height: PAGINA.altura,
				transformStyle: 'preserve-3d',
				transformOrigin: 'left center',
				transform: `rotateY(${-180 * t}deg)`,
			}}
		>
			<Pagina linhas={t2.paginas[indice * 2 + 1]} lado="direita" style={face} />
			<Pagina
				linhas={t2.paginas[indice * 2 + 2]}
				riscos={[0, 0, 1, 0]}
				lado="esquerda"
				style={{...face, transform: 'rotateY(180deg)'}}
			/>
		</div>
	);
};

const BALAO_TOPO = 640;
const DIGITANDO_TOPO = 930;

const CorteMensagem: React.FC<{frame: number}> = ({frame}) => {
	const balao = mola(frame, b.balao.em, ENTRADA, molas.kinetic);
	const lido = frame >= b.lido.em;
	const digitando = frame >= b.digitando.em && frame < b.digitandoSome.em;
	const bolha = digitando ? mola(frame, b.digitando.em, 8, molas.kinetic) : 0;

	return (
		<AbsoluteFill style={{backgroundColor: cor.bege}}>
			<Camera frame={frame} inicio={b.mensagem.em} fim={b.calendario.em}>
				<div
					style={{
						position: 'absolute',
						top: areaSegura.topo,
						left: 0,
						width: LARGURA,
						height: 140,
						boxSizing: 'border-box',
						display: 'flex',
						alignItems: 'center',
						gap: 24,
						padding: `0 ${areaSegura.esquerda}px`,
						backgroundColor: cor.cartao,
						borderBottom: `2px solid ${cor.borda}`,
					}}
				>
					<div
						style={{
							...tipo.numero,
							width: 84,
							height: 84,
							borderRadius: raio.pilula,
							backgroundColor: cor.fundoMarca,
							color: cor.bege,
							fontSize: 40,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						{t2.contato[0]}
					</div>
					<div>
						<div style={{...tipo.rotulo, fontSize: 42, fontWeight: 600, color: cor.texto}}>{t2.contato}</div>
						<div style={{...tipo.rotulo, fontSize: 30, color: digitando ? cor.positivo : cor.textoSecundario}}>
							{digitando ? t2.digitando : t2.status}
						</div>
					</div>
				</div>

				<div
					style={{
						position: 'absolute',
						top: BALAO_TOPO,
						right: areaSegura.esquerda,
						maxWidth: larguraUtil - 120,
						padding: '30px 36px 22px',
						borderRadius: `${raio.cartao}px 8px ${raio.cartao}px ${raio.cartao}px`,
						backgroundColor: cor.cartao,
						boxShadow: '0 2px 4px rgba(11,30,20,.08)',
						opacity: Math.min(balao * 2, 1),
						transform: `scale(${0.8 + 0.2 * balao})`,
						transformOrigin: 'right top',
					}}
				>
					<div style={{...tipo.cartao, fontSize: 52, color: cor.texto}}>{t2.mensagem}</div>
					<div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 10}}>
						<span style={{...tipo.rotulo, fontSize: 28, color: cor.textoSecundario}}>{t2.horaDaMensagem}</span>
						<div style={{transform: `scale(${lido ? punch(frame, b.lido.em, 1.4) : 1})`}}>
							<CheckDuplo tamanho={30} corDoTraco={lido ? cor.lido : cor.textoTerciario} />
						</div>
					</div>
				</div>

				{digitando ? (
					<div
						style={{
							position: 'absolute',
							top: DIGITANDO_TOPO,
							left: areaSegura.esquerda,
							display: 'flex',
							gap: 14,
							padding: '30px 36px',
							borderRadius: `8px ${raio.cartao}px ${raio.cartao}px ${raio.cartao}px`,
							backgroundColor: cor.cartao,
							opacity: Math.min(bolha * 2, 1),
							transform: `scale(${0.7 + 0.3 * bolha})`,
							transformOrigin: 'left top',
						}}
					>
						{[0, 1, 2].map((i) => {
							const sobe = Math.max(0, Math.sin(((frame - b.digitando.em) / 6 - i * 0.5) * Math.PI));
							return (
								<div
									key={i}
									style={{
										width: 22,
										height: 22,
										borderRadius: raio.pilula,
										backgroundColor: cor.textoTerciario,
										transform: `translateY(${-sobe * 10}px)`,
									}}
								/>
							);
						})}
					</div>
				) : null}
			</Camera>
		</AbsoluteFill>
	);
};

const CALENDARIO = {largura: 640, altura: 720, topo: 480} as const;
const TROCA_DE_DIA = 3;

const CorteCalendario: React.FC<{frame: number}> = ({frame}) => {
	const passaram = quantosPassaram(frame, b.dias);
	const dia = t2.diaInicial + passaram;
	const ultimaTroca = passaram > 0 ? b.dias[passaram - 1].em : b.calendario.em;
	const troca = fase(frame, ultimaTroca, ultimaTroca + TROCA_DE_DIA);
	const entra = mola(frame, b.calendario.em, ENTRADA, molas.kinetic);

	const carimboBate = b.atrasado.em + CARIMBO_DESCIDA;
	const desce = interpolate(frame, [b.atrasado.em, carimboBate], [0, 1], {...clamp, easing: curvaDeQueda});
	const tremor = deslocamentoDoShake(frame, [carimboBate], 'atrasado');

	return (
		<AbsoluteFill style={{backgroundColor: cor.fundoMarca}}>
			<Camera frame={frame} inicio={b.calendario.em} fim={b.chega.em}>
				<AbsoluteFill style={{transform: `translate(${tremor.x}px, ${tremor.y}px)`}}>
					<div
						style={{
							position: 'absolute',
							top: CALENDARIO.topo,
							left: (LARGURA - CALENDARIO.largura) / 2,
							width: CALENDARIO.largura,
							height: CALENDARIO.altura,
							borderRadius: raio.cartaoGrande,
							backgroundColor: cor.cartao,
							overflow: 'hidden',
							transform: `scale(${0.85 + 0.15 * entra})`,
						}}
					>
						<div
							style={{
								...tipo.rotulo,
								fontSize: 40,
								height: 130,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColor: cor.fundoForte,
								color: cor.bege,
							}}
						>
							{t2.vencimento}
						</div>
						<div
							style={{
								...tipo.numero,
								fontSize: 340,
								textAlign: 'center',
								marginTop: 40,
								color: passaram > 0 ? cor.negativo : cor.texto,
								// Troca a cada 3 frames: começar mais apagado que 0,6 deixava o
								// número sempre esmaecido, sem nunca ler.
								opacity: interpolate(troca, [0, 1], [0.6, 1], clamp),
								transform: `translateY(${(1 - troca) * 50}px)`,
							}}
						>
							{dia}
						</div>
						<div style={{...tipo.rotulo, fontSize: 40, textAlign: 'center', color: cor.textoSecundario}}>
							{t2.hoje}
						</div>
					</div>

					{frame >= b.atrasado.em ? (
						<div
							style={{
								position: 'absolute',
								top: CALENDARIO.topo + 300,
								width: LARGURA,
								display: 'flex',
								justifyContent: 'center',
							}}
						>
							<div
								style={{
									...tipo.numero,
									fontSize: 120,
									fontWeight: 700,
									letterSpacing: '0.02em',
									color: cor.negativo,
									border: `12px solid ${cor.negativo}`,
									borderRadius: raio.cartao,
									padding: '18px 40px',
									backgroundColor: 'rgba(255,255,255,.9)',
									opacity: interpolate(desce, [0, 0.3], [0, 1], clamp),
									transform: `rotate(-12deg) scale(${2.2 - 1.2 * desce})`,
								}}
							>
								{t2.atrasado}
							</div>
						</div>
					) : null}
				</AbsoluteFill>
			</Camera>
			<Flash frame={frame} em={[b.atrasado.em]} />
		</AbsoluteFill>
	);
};

const CorteChega: React.FC<{frame: number}> = ({frame}) => {
	const entra = mola(frame, b.chega.em, 10, molas.kinetic);
	const tremor = deslocamentoDoShake(frame, [b.chega.em], 'chega');
	return (
		<AbsoluteFill style={{backgroundColor: cor.destaque}}>
			<Camera frame={frame} inicio={b.chega.em} fim={b.chega.em + 40}>
				<AbsoluteFill
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						transform: `translate(${tremor.x}px, ${tremor.y}px)`,
					}}
				>
					<div
						style={{
							...tipo.gigante,
							fontSize: 230,
							color: cor.bege,
							transform: `scale(${(1.4 - 0.4 * entra) * punch(frame, b.chega.em + 6)})`,
						}}
					>
						{t2.chega}
					</div>
				</AbsoluteFill>
			</Camera>
			<Flash frame={frame} em={[b.chega.em]} />
		</AbsoluteFill>
	);
};
