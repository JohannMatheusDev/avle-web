import React from 'react';
import {brand} from '../brand';
import {content} from '../content';
import {TextLine, lineStep} from '../components/TextLine';
import {PILLAR_DOT_Y, pillarX} from '../layout';
import {reveal, riseY, snap} from '../motion';
import {font, type} from '../theme';

const TOP = 300;
const STEP = lineStep(type.headlineLarge);

const CELL_X = [100, 385, 670];
const CELL_W = 250;
const LABEL_TOP = 968;

/** Pillar art is authored around y=805; this enlarges it about its own centre. */
const PILLAR_SCALE = 1.1;

const HEAD_A = {start: 497, enter: 14};
const HEAD_B = {start: 500, enter: 14};
const PILLAR_IN = [538, 542, 546];
const LABEL_IN = [544, 548, 552];
const INVITE = {start: 606, enter: 14};

const INK = 'rgba(0, 0, 0, 0.16)';
const SKETCH = 'rgba(0, 0, 0, 0.28)';

/** An idea, still rough: the thing that exists before anything is built. */
const Sketch = () => (
	<>
		<rect
			x={120}
			y={718}
			width={210}
			height={174}
			rx={16}
			fill="none"
			stroke={SKETCH}
			strokeWidth={3}
			strokeDasharray="10 9"
		/>
		<rect x={150} y={758} width={132} height={8} rx={4} fill={INK} />
		<rect x={150} y={846} width={96} height={8} rx={4} fill={INK} />
	</>
);

/** Two possible routes, one of them chosen. */
const Fork = () => (
	<>
		<path
			d="M 396 868 C 450 868, 466 812, 508 806"
			fill="none"
			stroke={INK}
			strokeWidth={6}
			strokeLinecap="round"
		/>
		<path
			d="M 396 742 C 450 742, 466 800, 508 806"
			fill="none"
			stroke={brand.colors.cobalt}
			strokeWidth={6}
			strokeLinecap="round"
		/>
		<path
			d="M 512 806 L 624 806"
			fill="none"
			stroke={brand.colors.cobalt}
			strokeWidth={6}
			strokeLinecap="round"
		/>
		<circle cx={624} cy={806} r={9} fill={brand.colors.cobalt} />
	</>
);

/** A small working interface — illustrative, not a screenshot of a product. */
const Working = () => (
	<>
		<rect
			x={682}
			y={718}
			width={226}
			height={174}
			rx={16}
			fill={brand.colors.white}
			stroke="rgba(0, 0, 0, 0.14)"
			strokeWidth={2.5}
		/>
		<path
			d="M 682 734 A 16 16 0 0 1 698 718 L 892 718 A 16 16 0 0 1 908 734 L 908 760 L 682 760 Z"
			fill={brand.colors.neutral}
		/>
		<circle cx={706} cy={739} r={5} fill="rgba(0, 0, 0, 0.2)" />
		<circle cx={726} cy={739} r={5} fill="rgba(0, 0, 0, 0.2)" />
		<rect x={706} y={772} width={118} height={12} rx={6} fill={INK} />
		<rect x={706} y={838} width={90} height={12} rx={6} fill={INK} />
		<rect x={838} y={824} width={50} height={26} rx={13} fill={brand.colors.cobalt} />
		<circle cx={875} cy={837} r={9} fill={brand.colors.white} />
	</>
);

const PILLARS = [Sketch, Fork, Working];

/**
 * Scene 5 — what following actually gets you. Nothing here claims a portfolio
 * already exists; each shape stands for a kind of post.
 */
export const Scene5Reason: React.FC<{frame: number}> = ({frame}) => {
	// No exit fade: the cobalt field wipes this scene away from frame 688.
	if (frame < HEAD_A.start || frame >= 708) {
		return null;
	}

	return (
		<>
			<TextLine
				top={TOP}
				style={type.headlineLarge}
				opacity={reveal(frame, HEAD_A)}
				shiftY={riseY(frame, HEAD_A, 22)}
			>
				{content.scene5.headline[0]}
			</TextLine>
			<TextLine
				top={TOP + STEP}
				style={type.headlineLarge}
				color={brand.colors.cobalt}
				opacity={reveal(frame, HEAD_B)}
				shiftY={riseY(frame, HEAD_B, 22)}
			>
				{content.scene5.headline[1]}
			</TextLine>

			<svg
				width={1080}
				height={1920}
				viewBox="0 0 1080 1920"
				style={{position: 'absolute', inset: 0}}
			>
				{PILLARS.map((Pillar, i) => {
					const cue = {start: PILLAR_IN[i], enter: 14};
					const cx = pillarX[i];
					return (
						<g
							key={content.scene5.pillars[i]}
							opacity={reveal(frame, cue)}
							transform={[
								`translate(0 ${snap(riseY(frame, cue, 20))})`,
								`translate(${cx} ${PILLAR_DOT_Y})`,
								`scale(${PILLAR_SCALE})`,
								`translate(${-cx} ${-PILLAR_DOT_Y})`,
							].join(' ')}
						>
							<Pillar />
						</g>
					);
				})}
			</svg>

			{content.scene5.pillars.map((pillar, i) => {
				const cue = {start: LABEL_IN[i], enter: 14};
				const opacity = reveal(frame, cue);
				if (opacity <= 0) {
					return null;
				}
				return (
					<div
						key={pillar}
						style={{
							...type.label,
							fontSize: 42,
							fontFamily: font.family,
							position: 'absolute',
							left: CELL_X[i],
							top: LABEL_TOP,
							width: CELL_W,
							margin: 0,
							opacity,
							transform: `translateY(${snap(riseY(frame, cue, 18))}px)`,
						}}
					>
						{pillar}
					</div>
				);
			})}

			<TextLine
				top={1380}
				style={type.bodyStrong}
				opacity={reveal(frame, INVITE)}
				shiftY={riseY(frame, INVITE, 20)}
			>
				{content.scene5.invitation}
			</TextLine>
		</>
	);
};
