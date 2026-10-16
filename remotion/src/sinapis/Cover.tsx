import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {brand, logoHeightFor} from './brand';
import {content} from './content';
import {font, safe, type} from './theme';
import {lineStep} from './components/TextLine';

const LOGO_WIDTH = 620;

/**
 * Feed thumbnail. Everything essential sits between y=460 and y=1350 so a
 * centre-square or 4:5 crop still shows the logo, the hook and the cards.
 */
const CARDS = [
	{label: content.blocks.pedidos, x: 110, y: 1100, w: 250, h: 96, rot: -2.2},
	{label: content.blocks.planilhas, x: 400, y: 1132, w: 270, h: 96, rot: 1.8},
	{label: content.blocks.mensagens, x: 205, y: 1250, w: 280, h: 96, rot: -1.2},
];

export const Cover: React.FC = () => (
	<AbsoluteFill
		style={{backgroundColor: brand.colors.white, fontFamily: font.family}}
	>
		<div
			style={{
				position: 'absolute',
				left: safe.left,
				top: 460,
				width: LOGO_WIDTH,
				height: logoHeightFor(LOGO_WIDTH),
			}}
		>
			<Img
				src={brand.logo.src}
				style={{width: '100%', height: '100%', display: 'block'}}
			/>
		</div>

		<div
			style={{
				...type.headline,
				position: 'absolute',
				left: safe.left,
				top: 820,
				margin: 0,
				whiteSpace: 'pre',
			}}
		>
			{content.cover.headlineDark}
		</div>
		<div
			style={{
				...type.headline,
				color: brand.colors.cobalt,
				position: 'absolute',
				left: safe.left,
				top: 820 + lineStep(type.headline),
				margin: 0,
				whiteSpace: 'pre',
			}}
		>
			{content.cover.headlineBlue}
		</div>

		<svg
			width={1080}
			height={1920}
			viewBox="0 0 1080 1920"
			style={{position: 'absolute', inset: 0}}
		>
			{CARDS.map((card) => {
				const cx = card.x + card.w / 2;
				const cy = card.y + card.h / 2;
				return (
					<g key={card.label} transform={`rotate(${card.rot} ${cx} ${cy})`}>
						<rect
							x={card.x}
							y={card.y}
							width={card.w}
							height={card.h}
							rx={16}
							fill={brand.colors.neutral}
							stroke="rgba(0, 0, 0, 0.10)"
							strokeWidth={2}
						/>
						<text
							x={card.x + 24}
							y={cy}
							dominantBaseline="central"
							style={{...type.blockLabel, fontSize: 34}}
						>
							{card.label}
						</text>
					</g>
				);
			})}
			<circle cx={398} cy={1232} r={15} fill={brand.colors.cobalt} />
		</svg>
	</AbsoluteFill>
);
