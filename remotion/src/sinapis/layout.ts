import {interpolate} from 'remotion';
import {clamp, ease, easeInOut, phase} from './motion';
import {beats} from './timing';

export type BlockKey = 'pedidos' | 'planilhas' | 'mensagens';

export const BLOCK_KEYS: BlockKey[] = ['pedidos', 'planilhas', 'mensagens'];

export type Rect = {x: number; y: number; w: number; h: number; rot: number};

/** Scenes 1–2: the same three cards, slightly out of true. Never illegible. */
export const scattered: Record<BlockKey, Rect> = {
	pedidos: {x: 110, y: 800, w: 310, h: 140, rot: -2.2},
	planilhas: {x: 540, y: 890, w: 340, h: 140, rot: 1.8},
	mensagens: {x: 240, y: 1090, w: 350, h: 140, rot: -1.2},
};

/** Scene 3: the very same cards, squared up into rows of one workspace. */
export const organised: Record<BlockKey, Rect> = {
	pedidos: {x: 180, y: 980, w: 720, h: 86, rot: 0},
	planilhas: {x: 180, y: 1086, w: 720, h: 86, rot: 0},
	mensagens: {x: 180, y: 1192, w: 720, h: 86, rot: 0},
};

export const workspace = {x: 140, y: 870, w: 800, h: 480};

export const center = (r: Rect) => ({x: r.x + r.w / 2, y: r.y + r.h / 2});

/** Cards leave the scattered layout one after another, 3 frames apart. */
const STAGGER: Record<BlockKey, number> = {pedidos: 0, planilhas: 3, mensagens: 6};

export const blockRectAt = (key: BlockKey, frame: number): Rect => {
	const from = scattered[key];
	const to = organised[key];
	const offset = STAGGER[key];

	const inT = phase(frame, beats.alignStart + offset, beats.alignEnd + offset);
	const lerp = (a: number, b: number) => a + (b - a) * inT;

	return {
		x: lerp(from.x, to.x),
		y: lerp(from.y, to.y),
		w: lerp(from.w, to.w),
		h: lerp(from.h, to.h),
		rot: lerp(from.rot, to.rot),
	};
};

/* ------------------------------------------------------------------ *
 * The connection the dot draws in scene 3.
 * Dot and stroke read from the same curve so they cannot drift apart.
 * ------------------------------------------------------------------ */

type Pt = {x: number; y: number};

/**
 * The ends dock on the right edge of a card rather than its centre, so the dot
 * never comes to rest on top of a label. The middle point is a centre, but the
 * dot only passes through it — and the stroke there sits behind the card.
 */
const P0: Pt = {x: 420, y: 865}; // Pedidos, right edge
const C1: Pt = {x: 545, y: 862};
const P1: Pt = center(scattered.planilhas); // 710, 960
const C2: Pt = {x: 712, y: 1085};
const P2: Pt = {x: 590, y: 1156}; // Mensagens, right edge

/** Split point between the two quadratic segments, by arc length. */
const SPLIT = 0.56;

const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => {
	const u = 1 - t;
	return {
		x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
		y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
	};
};

export const connectionAt = (t: number): Pt =>
	t <= SPLIT
		? quad(P0, C1, P1, t / SPLIT)
		: quad(P1, C2, P2, (t - SPLIT) / (1 - SPLIT));

export const CONNECTION_D = `M ${P0.x} ${P0.y} Q ${C1.x} ${C1.y} ${P1.x} ${P1.y} Q ${C2.x} ${C2.y} ${P2.x} ${P2.y}`;

export const DRAW_START = 214;
export const DRAW_END = 256;

/* ------------------------------------------------------------------ *
 * The blue dot. One continuous thread; a job in every scene.
 * ------------------------------------------------------------------ */

type DotKey = {frame: number; x: number; y: number};

/** Scene 5 pillar centres, mirrored in Scene5Reason. */
export const pillarX = [225, 510, 795];
export const PILLAR_DOT_Y = 805;

/** Where the cobalt end-card field grows from. */
export const FIELD_ORIGIN = {x: 540, y: 1140};
export const FIELD_RADIUS = 1280;
export const DOT_RADIUS = 15;

const keys: DotKey[] = [
	// Scene 1 — searching the gaps, never joining anything.
	{frame: 0, x: 500, y: 745},
	{frame: 22, x: 452, y: 905},
	{frame: 44, x: 600, y: 1045},
	{frame: 58, x: 560, y: 1070}, // hesitates
	{frame: 78, x: 330, y: 1015},
	// Scene 2 — still circling, then edging towards a real connection.
	{frame: 104, x: 470, y: 925},
	{frame: 132, x: 690, y: 1090},
	{frame: 158, x: 300, y: 980},
	{frame: 180, x: 360, y: 900},
	{frame: 198, x: P0.x, y: P0.y}, // arrives at Pedidos
	{frame: DRAW_START, x: P0.x, y: P0.y},
	// Scene 3 — drawing is handled by connectionAt(); these match its ends.
	{frame: DRAW_END, x: P2.x, y: P2.y},
	{frame: 296, x: workspace.x + 60, y: workspace.y + 44}, // status dot in the header
	{frame: 336, x: workspace.x + 60, y: workspace.y + 44},
	// Scene 4 — becomes a node on the branching motif.
	{frame: 384, x: 820, y: 1330},
	{frame: 508, x: 820, y: 1330},
	// Scene 5 — threads the three pillars once they have all settled.
	{frame: 572, x: pillarX[0], y: PILLAR_DOT_Y},
	{frame: 600, x: pillarX[1], y: PILLAR_DOT_Y},
	{frame: 628, x: pillarX[2], y: PILLAR_DOT_Y},
	{frame: beats.dotSettleStart, x: pillarX[2], y: PILLAR_DOT_Y},
	// Scene 6 — drops to the origin of the cobalt field.
	{frame: beats.dotSettleEnd, x: FIELD_ORIGIN.x, y: FIELD_ORIGIN.y},
	{frame: beats.fieldStart, x: FIELD_ORIGIN.x, y: FIELD_ORIGIN.y},
];

const frames = keys.map((k) => k.frame);
const xs = keys.map((k) => k.x);
const ys = keys.map((k) => k.y);

export const dotAt = (frame: number): Pt => {
	if (frame >= DRAW_START && frame <= DRAW_END) {
		return connectionAt(phase(frame, DRAW_START, DRAW_END, easeInOut));
	}
	return {
		x: interpolate(frame, frames, xs, {...clamp, easing: ease}),
		y: interpolate(frame, frames, ys, {...clamp, easing: ease}),
	};
};
