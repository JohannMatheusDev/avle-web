import React from 'react';
import {interpolate} from 'remotion';
import {brand} from '../brand';
import {
	CONNECTION_D,
	DOT_RADIUS,
	DRAW_END,
	DRAW_START,
	FIELD_ORIGIN,
	FIELD_RADIUS,
	dotAt,
} from '../layout';
import {clamp, ease, easeInOut, phase} from '../motion';
import {beats} from '../timing';

/**
 * The single blue dot that carries the whole piece. It searches in scene 1–2,
 * draws the connection in scene 3, rests as a node in scene 4, threads the
 * pillars in scene 5, and finally becomes the end-card field.
 */
export const BlueDot: React.FC<{frame: number}> = ({frame}) => {
	if (frame >= beats.fieldStart) {
		return null;
	}

	const {x, y} = dotAt(frame);

	// A ring marks the moment it finally lands on something.
	const ring = phase(frame, 196, 226, easeInOut);
	const ringVisible = frame >= 196 && frame < 226;

	return (
		<svg
			width={1080}
			height={1920}
			viewBox="0 0 1080 1920"
			style={{position: 'absolute', inset: 0}}
		>
			{ringVisible ? (
				<circle
					cx={x}
					cy={y}
					r={DOT_RADIUS + ring * 46}
					fill="none"
					stroke={brand.colors.cobalt}
					strokeWidth={3}
					opacity={(1 - ring) * 0.55}
				/>
			) : null}
			<circle cx={x} cy={y} r={DOT_RADIUS} fill={brand.colors.cobalt} />
		</svg>
	);
};

/** The clean path the dot leaves behind in scene 3. */
export const Connection: React.FC<{frame: number}> = ({frame}) => {
	if (frame < DRAW_START || frame > 312) {
		return null;
	}

	const drawn = phase(frame, DRAW_START, DRAW_END, easeInOut);
	// Fades as the workspace shell takes over the job of holding things together.
	const fade = 1 - phase(frame, 268, 300);

	return (
		<svg
			width={1080}
			height={1920}
			viewBox="0 0 1080 1920"
			style={{position: 'absolute', inset: 0, opacity: fade}}
		>
			<path
				d={CONNECTION_D}
				fill="none"
				stroke={brand.colors.cobalt}
				strokeWidth={4}
				strokeLinecap="round"
				pathLength={1}
				strokeDasharray={1}
				strokeDashoffset={1 - drawn}
			/>
		</svg>
	);
};

/** The dot grown into the cobalt end card. Same centre, same colour. */
export const CobaltField: React.FC<{frame: number}> = ({frame}) => {
	if (frame < beats.fieldStart) {
		return null;
	}

	const r = interpolate(
		frame,
		[beats.fieldStart, beats.fieldEnd],
		[DOT_RADIUS, FIELD_RADIUS],
		{...clamp, easing: ease},
	);

	if (frame >= beats.fieldEnd) {
		return (
			<div
				style={{
					position: 'absolute',
					inset: 0,
					backgroundColor: brand.colors.cobalt,
				}}
			/>
		);
	}

	return (
		<svg
			width={1080}
			height={1920}
			viewBox="0 0 1080 1920"
			style={{position: 'absolute', inset: 0}}
		>
			<circle
				cx={FIELD_ORIGIN.x}
				cy={FIELD_ORIGIN.y}
				r={r}
				fill={brand.colors.cobalt}
			/>
		</svg>
	);
};
