import React from 'react';
import {Img} from 'remotion';
import {brand, logoHeightFor} from '../brand';
import {content} from '../content';
import {TextLine} from '../components/TextLine';
import {clamp, ease, phase, reveal, riseY} from '../motion';
import {safe, type} from '../theme';
import {interpolate} from 'remotion';

const LOGO_WIDTH = 720;
const LOGO_TOP = 560;

const WIPE = {start: 329, end: 360};
const LEAD = {start: 372, end: 506, enter: 14, exit: 16};
const TAIL = {start: 376, end: 506, enter: 14, exit: 16};

/**
 * Scene 4 — who this is and what they do. The PNG is revealed as a whole asset
 * behind a travelling edge: no stretching, no recolouring, no faked internal
 * animation of the branches.
 */
export const Scene4Brand: React.FC<{frame: number}> = ({frame}) => {
	if (frame < WIPE.start || frame >= 506) {
		return null;
	}

	const wipe = phase(frame, WIPE.start, WIPE.end);
	const logoOut = 1 - phase(frame, 490, 506);
	const lift = interpolate(frame, [WIPE.start, WIPE.end], [14, 0], {
		...clamp,
		easing: ease,
	});

	return (
		<>
			<div
				style={{
					position: 'absolute',
					left: safe.left,
					top: LOGO_TOP,
					width: LOGO_WIDTH,
					height: logoHeightFor(LOGO_WIDTH),
					opacity: logoOut,
					transform: `translateY(${lift.toFixed(2)}px)`,
					clipPath: `inset(0 ${((1 - wipe) * 100).toFixed(3)}% 0 0)`,
				}}
			>
				<Img
					src={brand.logo.src}
					style={{width: '100%', height: '100%', display: 'block'}}
				/>
			</div>

			<TextLine
				top={940}
				style={type.headline}
				opacity={reveal(frame, LEAD)}
				shiftY={riseY(frame, LEAD, 22)}
			>
				{content.scene4.valueLead}
			</TextLine>
			<TextLine
				top={1042}
				style={type.body}
				opacity={reveal(frame, TAIL)}
				shiftY={riseY(frame, TAIL, 18)}
			>
				{content.scene4.valueTail}
			</TextLine>
		</>
	);
};
