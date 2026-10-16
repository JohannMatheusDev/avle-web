import React from 'react';
import {brand} from '../brand';
import {content} from '../content';
import {TextLine, lineStep} from '../components/TextLine';
import {reveal, riseY} from '../motion';
import {type} from '../theme';

const TOP = 300;
const STEP = lineStep(type.headline);

const FIRST = {start: 216, end: 332, enter: 14, exit: 14};
const SECOND = {start: 219, end: 332, enter: 14, exit: 14};

/** Scene 3 — the turn. The question stays dominant while the cards square up. */
export const Scene3Turning: React.FC<{frame: number}> = ({frame}) => {
	if (frame < FIRST.start || frame >= FIRST.end) {
		return null;
	}

	return (
		<>
			<TextLine
				top={TOP}
				style={type.headline}
				opacity={reveal(frame, FIRST)}
				shiftY={riseY(frame, FIRST, 22)}
			>
				{content.scene3.headline[0]}
			</TextLine>
			<TextLine
				top={TOP + STEP}
				style={type.headline}
				color={brand.colors.cobalt}
				opacity={reveal(frame, SECOND)}
				shiftY={riseY(frame, SECOND, 22)}
			>
				{content.scene3.headline[1]}
			</TextLine>
		</>
	);
};
