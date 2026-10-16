import React from 'react';
import {brand} from '../brand';
import {phase, reveal} from '../motion';

type Twig = {d: string; node?: {x: number; y: number; r: number}; delay: number};

/**
 * Supporting vector branches. Deliberately simplified — they echo the logo's
 * idea and never stand in for the approved mark. They sit clear of the
 * lettering, in the lower band and off the top-right edge.
 */
/**
 * Every twig starts at a point that genuinely lies on its stem, so the shapes
 * read as one branch instead of crossing strokes. The stems are the quadratics
 * below; the start points were evaluated on them, and the twigs all leave to
 * the same side so none of them cross each other.
 *
 *   lower stem  Q: (600,1920) → (730,1440) → (820,1330)
 *     t=0.35 → (686,1629)   t=0.60 → (742,1477)   t=0.82 → (786,1382)
 *   upper stem  Q: (1100,318) → (1000,330) → (934,400)
 *     t=0.42 → (1022,338)
 *
 * Both stems run off an edge rather than stopping in open space. The lower one
 * ends exactly on the blue dot's scene-4 resting point, so the dot reads as a
 * node of the branch rather than a mark laid over it.
 */
const lower: Twig[] = [
	{d: 'M 600 1920 Q 730 1440 820 1330', delay: 0},
	{d: 'M 686 1629 Q 596 1626 500 1668', node: {x: 500, y: 1668, r: 8}, delay: 6},
	{d: 'M 742 1477 Q 648 1452 548 1442', node: {x: 548, y: 1442, r: 9}, delay: 11},
	{d: 'M 786 1382 Q 774 1312 716 1258', node: {x: 716, y: 1258, r: 7}, delay: 16},
];

const upper: Twig[] = [
	{d: 'M 1100 318 Q 1000 330 934 400', node: {x: 934, y: 400, r: 8}, delay: 2},
	{d: 'M 1022 338 Q 1004 294 986 250', node: {x: 986, y: 250, r: 6}, delay: 9},
];

/** Confined to the last tenth of the draw, or the node detaches from the tip. */
const nodeScale = (drawn: number) => Math.min(1, Math.max(0, (drawn - 0.9) * 10));

const Twigs: React.FC<{twigs: Twig[]; frame: number; start: number; opacity: number}> = ({
	twigs,
	frame,
	start,
	opacity,
}) => (
	<g opacity={opacity}>
		{twigs.map((twig) => {
			const drawn = phase(frame, start + twig.delay, start + twig.delay + 30);
			return (
				<g key={twig.d}>
					<path
						d={twig.d}
						fill="none"
						stroke={brand.colors.cobalt}
						strokeWidth={3}
						strokeLinecap="round"
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - drawn}
					/>
					{twig.node ? (
						<circle
							cx={twig.node.x}
							cy={twig.node.y}
							r={twig.node.r * nodeScale(drawn)}
							fill={brand.colors.cobalt}
						/>
					) : null}
				</g>
			);
		})}
	</g>
);

export const Branches: React.FC<{frame: number}> = ({frame}) => {
	const visible = reveal(frame, {start: 368, end: 508, enter: 18, exit: 22});
	if (visible <= 0) {
		return null;
	}

	return (
		<svg
			width={1080}
			height={1920}
			viewBox="0 0 1080 1920"
			style={{position: 'absolute', inset: 0, opacity: visible}}
		>
			<Twigs twigs={lower} frame={frame} start={370} opacity={0.42} />
			<Twigs twigs={upper} frame={frame} start={382} opacity={0.3} />
		</svg>
	);
};
