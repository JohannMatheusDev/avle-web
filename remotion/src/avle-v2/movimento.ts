import {Easing, interpolate, spring, type SpringConfig} from 'remotion';
import {FPS} from './timing';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** As curvas do DESIGN.md: `ease-out` para entrar, `ease-in-out` para trocar. */
export const curva = Easing.bezier(0.2, 0.8, 0.2, 1);
export const curvaDupla = Easing.bezier(0.65, 0, 0.35, 1);
/** Acelera até o fim: carimbo, capa do caderno batendo. Peso, não interface. */
export const curvaDeQueda = Easing.in(Easing.cubic);

/**
 * Molas da V2. A `kinetic` é a da tipografia: curta e com um overshoot leve
 * (cerca de 7%), o que a V1 evitava e a V2 pede. A `firme` não passa do ponto.
 */
export const molas = {
	firme: {damping: 200},
	kinetic: {damping: 14, stiffness: 200, mass: 0.6},
	entrada: {damping: 20, stiffness: 180, mass: 0.8},
} satisfies Record<string, Partial<SpringConfig>>;

/** Mola que começa em `inicio` e termina exatamente em `inicio + duracao`. */
export const mola = (
	frame: number,
	inicio: number,
	duracao: number,
	config: Partial<SpringConfig> = molas.entrada,
) =>
	frame < inicio ? 0 : spring({frame: frame - inicio, fps: FPS, config, durationInFrames: duracao});

export const fase = (frame: number, inicio: number, fim: number, easing = curva) =>
	interpolate(frame, [inicio, fim], [0, 1], {...clamp, easing});

/** O "punch" da palavra-chave: 1 → 1,15 → 1 em 12 frames. */
export const PUNCH = 1.15;
export const punch = (frame: number, em: number, pico = PUNCH) =>
	interpolate(frame, [em, em + 4, em + 12], [1, pico, 1], {...clamp, easing: curvaDupla});

/**
 * Margem lateral, em em, para uma palavra escalada não engolir os espaços.
 * Escalar 1,15× faz a palavra crescer 7,5% para cada lado; numa palavra longa
 * isso passa da largura do espaço, e "do vencimento" virava "dovencimento".
 * A margem acompanha a escala (larga só durante o punch) e empurra as
 * vizinhas, que é o efeito de um punch de verdade. A largura vem de uma
 * estimativa de 0,55 em por letra, que é a média da Urbanist.
 */
export const margemDoPunch = (texto: string, escala: number) =>
	`0 ${(Math.max(escala - 1, 0) * texto.length * 0.55) / 2}em`;

/** Sobe e desce uma vez: 0 → 1 → 0. */
export const pulso = (frame: number, inicio: number, duracao: number) =>
	interpolate(frame, [inicio, inicio + duracao / 2, inicio + duracao], [0, 1, 0], {
		...clamp,
		easing: curvaDupla,
	});

export const maiorPulso = (frame: number, inicios: number[], duracao: number) =>
	inicios.reduce((maior, inicio) => Math.max(maior, pulso(frame, inicio, duracao)), 0);

/** Zoom lento da câmera parada: 1,00 → 1,04 ao longo da janela. */
export const ZOOM_DA_CAMERA = 1.04;
export const zoomLento = (frame: number, inicio: number, fim: number) =>
	interpolate(frame, [inicio, fim], [1, ZOOM_DA_CAMERA], clamp);

export const misturar = (a: number, b: number, t: number) => a + (b - a) * t;

/** Quantos beats da lista já aconteceram. */
export const quantosPassaram = (frame: number, beats: readonly {em: number}[]) =>
	beats.filter((b) => frame >= b.em).length;

export const ems = (beats: readonly {em: number}[]) => beats.map((b) => b.em);
