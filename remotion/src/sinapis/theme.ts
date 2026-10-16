import {brand} from './brand';

/**
 * Conservative composition guides for the 1080x1920 master. Essential copy and
 * the logo stay inside; decorative strokes may cross them.
 */
export const safe = {
	left: 100,
	right: 920,
	top: 220,
	bottom: 1580,
} as const;

export const safeWidth = safe.right - safe.left;

export const font = {
	family: 'Inter, system-ui, sans-serif',
} as const;

export const type = {
	/**
	 * 80 is the floor of the brief's headline range, and the longest lines
	 * ("fizesse mais sentido?", "Seu negócio cresceu.") only clear the 820px
	 * safe column with real margin at this size.
	 */
	headline: {
		fontFamily: font.family,
		fontSize: 80,
		fontWeight: 800,
		lineHeight: 1.08,
		letterSpacing: '-0.035em',
		color: brand.colors.black,
	},
	/** For scenes whose lines are short enough to carry more weight. */
	headlineLarge: {
		fontFamily: font.family,
		fontSize: 92,
		fontWeight: 800,
		lineHeight: 1.08,
		letterSpacing: '-0.035em',
		color: brand.colors.black,
	},
	body: {
		fontFamily: font.family,
		fontSize: 50,
		fontWeight: 400,
		lineHeight: 1.28,
		letterSpacing: '-0.012em',
		color: brand.colors.black,
	},
	bodyStrong: {
		fontFamily: font.family,
		fontSize: 52,
		fontWeight: 700,
		lineHeight: 1.25,
		letterSpacing: '-0.018em',
		color: brand.colors.black,
	},
	label: {
		fontFamily: font.family,
		fontSize: 40,
		fontWeight: 600,
		lineHeight: 1.2,
		letterSpacing: '-0.01em',
		color: brand.colors.black,
	},
	blockLabel: {
		fontFamily: font.family,
		fontSize: 38,
		fontWeight: 500,
		lineHeight: 1.2,
		letterSpacing: '-0.01em',
		color: brand.colors.black,
	},
} as const;

/** Text is laid out from the top edge of its line box, not centred. */
export const columnStyle: React.CSSProperties = {
	position: 'absolute',
	left: safe.left,
	width: safeWidth,
	textAlign: 'left',
	margin: 0,
	whiteSpace: 'pre',
};
