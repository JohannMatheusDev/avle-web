import {Easing, interpolate, spring, type SpringConfig} from 'remotion';
import {FPS} from './timing';

export const clamp = {
	extrapolateLeft: 'clamp',
	extrapolateRight: 'clamp',
} as const;

/** A curva de entrada do DESIGN.md (`ease-out`). */
export const curva = Easing.bezier(0.2, 0.8, 0.2, 1);
/** A curva de troca do DESIGN.md (`ease-in-out`), para saída e transição. */
export const curvaDupla = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * Molas do vídeo. O pedido é movimento curto e preciso, sem quicar: a
 * `entrada` passa do ponto cerca de 1% e assenta; a `firme` não passa nada.
 * A `soco` só existe para o "ANTES" do gancho, e mesmo ela volta em um balanço.
 */
export const molas = {
	firme: {damping: 200},
	entrada: {damping: 20, stiffness: 180, mass: 0.8},
	soco: {damping: 12, stiffness: 210, mass: 0.6},
} satisfies Record<string, Partial<SpringConfig>>;

/**
 * Mola que começa em `inicio` e termina exatamente em `inicio + duracao`.
 * A duração fixa importa no fim do CTA: sem ela a mola continua mexendo
 * milésimos depois de "parar", e a imagem de thumbnail não fica parada de fato.
 */
export const mola = (
	frame: number,
	inicio: number,
	duracao: number,
	config: Partial<SpringConfig> = molas.entrada,
) =>
	frame < inicio
		? 0
		: spring({frame: frame - inicio, fps: FPS, config, durationInFrames: duracao});

/** Progresso 0..1 numa janela de frames, com a curva da casa. */
export const fase = (frame: number, inicio: number, fim: number, easing = curva) =>
	interpolate(frame, [inicio, fim], [0, 1], {...clamp, easing});

/** Sobe e desce uma vez: 0 → 1 → 0. Usado nas pulsadas do botão e da seta. */
export const pulso = (frame: number, inicio: number, duracao: number) =>
	interpolate(frame, [inicio, inicio + duracao / 2, inicio + duracao], [0, 1, 0], {
		...clamp,
		easing: curvaDupla,
	});

export const misturar = (a: number, b: number, t: number) => a + (b - a) * t;
