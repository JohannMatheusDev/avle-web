import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {cor} from '../marca';
import {clamp, curva} from '../movimento';
import {fimGlobal, inicioGlobal, legendas, type Legenda} from '../roteiro';
import {ALTURA} from '../timing';
import {areaSegura, faixaDaLegenda, larguraUtil, tipo} from '../tema';

const ENTRADA = 5;
const SUBIDA = 14;

/**
 * Legendas queimadas, por cima de todas as cenas.
 *
 * Ficam fora do `TransitionSeries` de propósito: dentro dele, uma legenda que
 * atravessa a troca de cena seria cortada pelo wipe junto com o fundo antigo.
 * Aqui elas leem o frame global e só obedecem ao roteiro.
 */
export const Legendas: React.FC = () => {
	const frame = useCurrentFrame();
	const atual = legendas.find(
		(legenda) => frame >= inicioGlobal(legenda) && frame < fimGlobal(legenda),
	);

	if (!atual) {
		return null;
	}

	const t = interpolate(frame - inicioGlobal(atual), [0, ENTRADA], [0, 1], {
		...clamp,
		easing: curva,
	});

	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					...tipo.legenda,
					position: 'absolute',
					left: areaSegura.esquerda,
					width: larguraUtil,
					bottom: ALTURA - faixaDaLegenda.base,
					maxHeight: faixaDaLegenda.alturaMaxima,
					textAlign: 'center',
					textWrap: 'balance',
					color: sobreEscuro(atual) ? cor.bege : cor.texto,
					opacity: t,
					transform: `translateY(${(1 - t) * SUBIDA}px)`,
				}}
			>
				<ComDestaque legenda={atual} />
			</div>
		</AbsoluteFill>
	);
};

/** Só a dor acontece sobre verde; as outras cenas com legenda são papel. */
const sobreEscuro = (legenda: Legenda) => legenda.cena === 'dor';

const ComDestaque: React.FC<{legenda: Legenda}> = ({legenda}) => {
	const {texto, destaque} = legenda;
	const posicao = texto.indexOf(destaque);
	if (posicao < 0) {
		return <>{texto}</>;
	}

	// Sobre o papel a terracota de sempre fica em 3,6:1; a escura passa de
	// 4,5:1 e continua lendo como terracota. Sobre o verde, a normal basta.
	const corDoDestaque = sobreEscuro(legenda) ? cor.destaque : cor.destaqueEscuro;

	return (
		<>
			{texto.slice(0, posicao)}
			<span style={{color: corDoDestaque}}>{destaque}</span>
			{texto.slice(posicao + destaque.length)}
		</>
	);
};
