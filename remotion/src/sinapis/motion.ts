import {Easing, interpolate} from 'remotion';

/** The one easing curve the whole piece uses. */
export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

type Range = {
	/** Frame the element starts appearing. */
	start: number;
	/** Frame the element is fully gone. Omit to keep it on screen. */
	end?: number;
	enter?: number;
	exit?: number;
};

export const clamp = {
	extrapolateLeft: 'clamp',
	extrapolateRight: 'clamp',
} as const;

/** 0 before `start`, 1 while held, 0 again after `end`. */
export const reveal = (frame: number, {start, end, enter = 14, exit = 12}: Range) => {
	const appearing = interpolate(frame, [start, start + enter], [0, 1], {
		...clamp,
		easing: ease,
	});
	if (end === undefined) {
		return appearing;
	}
	const leaving = interpolate(frame, [end - exit, end], [1, 0], {
		...clamp,
		easing: easeInOut,
	});
	return Math.min(appearing, leaving);
};

/** Pairs with `reveal`: a short rise on entry, a short lift on exit. */
export const riseY = (
	frame: number,
	{start, end, enter = 14, exit = 12}: Range,
	distance = 26,
) => {
	const entering = interpolate(frame, [start, start + enter], [distance, 0], {
		...clamp,
		easing: ease,
	});
	if (end === undefined) {
		return entering;
	}
	const leaving = interpolate(frame, [end - exit, end], [0, -distance * 0.55], {
		...clamp,
		easing: easeInOut,
	});
	return entering + leaving;
};

/** Eased 0..1 progress across a frame window. */
export const phase = (frame: number, start: number, end: number, easing = ease) =>
	interpolate(frame, [start, end], [0, 1], {...clamp, easing});

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Sub-pixel jitter makes text shimmer between frames; snap layout values. */
export const snap = (value: number) => Math.round(value * 100) / 100;
