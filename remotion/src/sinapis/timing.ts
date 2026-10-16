export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 900;

export type SceneName =
	| 'hook'
	| 'recognition'
	| 'turning'
	| 'brand'
	| 'reason'
	| 'cta';

/** Inclusive start, exclusive end. Must tile 0..900 with no gaps. */
export const scenes: Record<SceneName, {start: number; end: number}> = {
	hook: {start: 0, end: 90},
	recognition: {start: 90, end: 210},
	turning: {start: 210, end: 330},
	brand: {start: 330, end: 510},
	reason: {start: 510, end: 690},
	cta: {start: 690, end: 900},
};

/**
 * Beats that several layers have to agree on. Keeping them here stops the
 * persistent layers (blocks, blue dot) and the per-scene text from drifting
 * apart when timing is tuned.
 */
export const beats = {
	/** Scattered cards travel into the organised workspace. */
	alignStart: 258,
	alignEnd: 304,
	/** Workspace dissolves into supporting lines behind the brand. */
	recedeStart: 330,
	recedeEnd: 366,
	/** Blue dot drops to the spot the end-card field grows from. */
	dotSettleStart: 648,
	dotSettleEnd: 684,
	/** Cobalt field wipe. Finishes before frame 708 as specified. */
	fieldStart: 688,
	fieldEnd: 707,
	/** End-card: kicker starts as the field closes, so the blue is never dead. */
	kickerIn: 702,
} as const;

export const sceneLocal = (frame: number, scene: SceneName) =>
	frame - scenes[scene].start;
