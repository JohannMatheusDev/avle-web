import React from 'react';
import {brand} from '../brand';
import {content} from '../content';
import {TextLine, lineStep} from '../components/TextLine';
import {reveal, riseY, snap} from '../motion';
import {type} from '../theme';
import {beats} from '../timing';

const WHITE = brand.colors.white;

const kickerStyle = {...type.body, fontSize: 54, fontWeight: 500, lineHeight: 1.26};
const ctaStyle = {...type.headline, fontSize: 80};
const supportStyle = {...type.body, fontSize: 50, fontWeight: 400};

const KICKER_TOP = 520;
const CTA_TOP = 790;
const SUPPORT_TOP = 1120;

const KICKER = [
	{start: beats.kickerIn, enter: 14},
	{start: beats.kickerIn + 3, enter: 14},
];
const CTA = [
	{start: 730, enter: 14},
	{start: 733, enter: 14},
];
const SUPPORT = [
	{start: 740, enter: 14},
	{start: 743, enter: 14},
];

/** Nonessential drift, so the hold is not frozen. Derived from frame only. */
const Drift: React.FC<{frame: number}> = ({frame}) => {
	const t = frame - beats.fieldEnd;
	const sway = Math.sin(t / 78) * 4;
	// Settled before frame 765, after which nothing new may appear.
	const fade = reveal(frame, {start: 728, enter: 30});

	return (
		<svg
			width={1080}
			height={1920}
			viewBox="0 0 1080 1920"
			style={{position: 'absolute', inset: 0, opacity: fade * 0.16}}
		>
			<g transform={`translate(${snap(sway)} ${snap(-sway * 0.6)})`}>
				<path
					d="M 1010 1700 C 960 1620, 918 1560, 866 1512"
					fill="none"
					stroke={WHITE}
					strokeWidth={3}
					strokeLinecap="round"
				/>
				<path
					d="M 952 1620 C 900 1606, 848 1600, 792 1602"
					fill="none"
					stroke={WHITE}
					strokeWidth={3}
					strokeLinecap="round"
				/>
				<path
					d="M 918 1572 C 926 1516, 944 1472, 972 1432"
					fill="none"
					stroke={WHITE}
					strokeWidth={3}
					strokeLinecap="round"
				/>
				<circle cx={866} cy={1512} r={8} fill={WHITE} />
				<circle cx={792} cy={1602} r={6} fill={WHITE} />
				<circle cx={972} cy={1432} r={6} fill={WHITE} />
			</g>
		</svg>
	);
};

/**
 * Scene 6 — the single conversion goal: visit the profile and follow.
 * Everything is settled by frame 764 and nothing new arrives after it.
 */
export const Scene6Cta: React.FC<{frame: number}> = ({frame}) => {
	if (frame < beats.kickerIn) {
		return null;
	}

	return (
		<>
			<Drift frame={frame} />

			{content.scene6.kicker.map((line, i) => (
				<TextLine
					key={line}
					top={KICKER_TOP + i * lineStep(kickerStyle)}
					style={kickerStyle}
					color="rgba(255, 255, 255, 0.86)"
					opacity={reveal(frame, KICKER[i])}
					shiftY={riseY(frame, KICKER[i], 20)}
				>
					{line}
				</TextLine>
			))}

			{content.scene6.cta.map((line, i) => (
				<TextLine
					key={line}
					top={CTA_TOP + i * lineStep(ctaStyle)}
					style={ctaStyle}
					color={WHITE}
					opacity={reveal(frame, CTA[i])}
					shiftY={riseY(frame, CTA[i], 24)}
				>
					{line}
				</TextLine>
			))}

			{content.scene6.support.map((line, i) => (
				<TextLine
					key={line}
					top={SUPPORT_TOP + i * lineStep(supportStyle)}
					style={supportStyle}
					color="rgba(255, 255, 255, 0.86)"
					opacity={reveal(frame, SUPPORT[i])}
					shiftY={riseY(frame, SUPPORT[i], 18)}
				>
					{line}
				</TextLine>
			))}

			{brand.profileHandle ? (
				<TextLine
					top={SUPPORT_TOP + 2 * lineStep(supportStyle) + 40}
					style={{...supportStyle, fontWeight: 600}}
					color={WHITE}
					opacity={reveal(frame, SUPPORT[1])}
				>
					{brand.profileHandle}
				</TextLine>
			) : null}
		</>
	);
};
