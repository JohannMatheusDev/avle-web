import React from 'react';
import {content} from '../content';
import {TextLine, lineStep} from '../components/TextLine';
import {reveal, riseY} from '../motion';
import {type} from '../theme';

const TOP = 300;
const STEP = lineStep(type.headline);

const END = 210;

/** Lines 1–2 are one sentence; line 3 is the second, so it waits a beat. */
const CUES = [
	{start: 92, end: END, enter: 14, exit: 14},
	{start: 95, end: END, enter: 14, exit: 14},
	{start: 112, end: END, enter: 14, exit: 14},
];

/** Scene 2 — naming what the viewer is already living with. */
export const Scene2Recognition: React.FC<{frame: number}> = ({frame}) => {
	if (frame < CUES[0].start || frame >= END) {
		return null;
	}

	return (
		<>
			{content.scene2.headline.map((line, i) => (
				<TextLine
					key={line}
					top={TOP + i * STEP}
					style={type.headline}
					opacity={reveal(frame, CUES[i])}
					shiftY={riseY(frame, CUES[i], 22)}
				>
					{line}
				</TextLine>
			))}
		</>
	);
};
