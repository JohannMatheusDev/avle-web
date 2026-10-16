import {staticFile} from 'remotion';

export const brand = {
	name: 'Sinapis Dev',

	colors: {
		cobalt: '#2457FF',
		black: '#000000',
		white: '#FFFFFF',
		/** Pale neutral, only for interface containers. */
		neutral: '#F2F4F7',
	},

	logo: {
		src: staticFile('brand/sinapis-dev-azul-horizontal.png'),
		/** Intrinsic pixels of the approved PNG — never distort away from this. */
		intrinsicWidth: 2054,
		intrinsicHeight: 766,
	},

	/**
	 * Left empty on purpose: no handle has been confirmed. When filled it renders
	 * as a plain text line on the end card — nothing resembling a profile UI.
	 */
	profileHandle: '',
} as const;

export const logoAspect = brand.logo.intrinsicWidth / brand.logo.intrinsicHeight;

export const logoHeightFor = (width: number) => width / logoAspect;
