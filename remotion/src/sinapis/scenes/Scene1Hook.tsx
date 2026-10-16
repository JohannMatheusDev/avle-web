import React from 'react';
import {brand} from '../brand';
import {content} from '../content';
import {TextLine, lineStep} from '../components/TextLine';
import {phase, reveal, riseY} from '../motion';
import {type} from '../theme';

const TOP = 300;
const STEP = lineStep(type.headline);
const EXIT = {from: 80, to: 92};

/**
 * Scene 1 — the hook. The first line carries no entry animation on purpose:
 * frame 0 has to be a readable statement, not the start of a fade.
 */
export const Scene1Hook: React.FC<{frame: number}> = ({frame}) => {
	if (frame >= EXIT.to) {
		return null;
	}

	const out = 1 - phase(frame, EXIT.from, EXIT.to);
	const second = reveal(frame, {start: 20, end: EXIT.to, enter: 14, exit: 12});

	return (
		<>
			<TextLine top={TOP} style={type.headline} opacity={out}>
				{content.scene1.headlineDark}
			</TextLine>
			<TextLine
				top={TOP + STEP}
				style={type.headline}
				color={brand.colors.cobalt}
				opacity={second}
				shiftY={riseY(frame, {start: 20, end: EXIT.to, enter: 14, exit: 12}, 22)}
			>
				{content.scene1.headlineBlue}
			</TextLine>
		</>
	);
};
