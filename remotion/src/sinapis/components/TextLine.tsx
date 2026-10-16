import React from 'react';
import {columnStyle} from '../theme';
import {snap} from '../motion';

/**
 * One typeset line, anchored by the top of its line box so scene layouts can
 * be reasoned about in absolute pixels.
 */
export const TextLine: React.FC<{
	top: number;
	style: React.CSSProperties;
	opacity: number;
	shiftY?: number;
	color?: string;
	children: React.ReactNode;
}> = ({top, style, opacity, shiftY = 0, color, children}) => {
	if (opacity <= 0) {
		return null;
	}

	return (
		<div
			style={{
				...columnStyle,
				...style,
				...(color ? {color} : null),
				top,
				opacity,
				transform: `translateY(${snap(shiftY)}px)`,
			}}
		>
			{children}
		</div>
	);
};

/** Vertical advance of a line box, for stacking lines by hand. */
export const lineStep = (style: {fontSize: number; lineHeight: number}) =>
	Math.round(style.fontSize * style.lineHeight);
