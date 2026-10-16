import React from 'react';
import {brand} from '../brand';
import {content} from '../content';
import {BLOCK_KEYS, blockRectAt, workspace} from '../layout';
import {mix, phase, reveal} from '../motion';
import {type} from '../theme';
import {beats} from '../timing';

const BORDER = 'rgba(0, 0, 0, 0.10)';

const Toggle: React.FC<{x: number; y: number; on: boolean; opacity: number}> = ({
	x,
	y,
	on,
	opacity,
}) => (
	<g opacity={opacity}>
		<rect
			x={x}
			y={y}
			width={58}
			height={32}
			rx={16}
			fill={on ? brand.colors.cobalt : 'rgba(0, 0, 0, 0.14)'}
		/>
		<circle cx={on ? x + 42 : x + 16} cy={y + 16} r={11} fill={brand.colors.white} />
	</g>
);

export const Cards: React.FC<{frame: number}> = ({frame}) => {
	// The workspace shell materialises as the cards square up.
	const shell = phase(frame, 262, 300);
	// Row furniture waits for the last card to finish travelling.
	const settled = phase(frame, 292, 312);
	// Scene 4: the interface recedes into supporting lines, then clears.
	const fillFade = 1 - phase(frame, beats.recedeStart, 350);
	const flatten = phase(frame, 332, 356);
	const layerOpacity = 1 - phase(frame, 348, beats.recedeEnd);

	if (layerOpacity <= 0) {
		return null;
	}

	// Scene 2: duplication, shown as a restrained stack behind one card.
	const ghost = reveal(frame, {start: 118, end: 262, enter: 16, exit: 18});
	const planilhas = blockRectAt('planilhas', frame);

	return (
		<svg
			width={1080}
			height={1920}
			viewBox="0 0 1080 1920"
			style={{position: 'absolute', inset: 0, opacity: layerOpacity}}
		>
			{/* Workspace shell */}
			<g opacity={shell * fillFade}>
				<rect
					x={workspace.x}
					y={workspace.y}
					width={workspace.w}
					height={workspace.h}
					rx={28}
					fill={brand.colors.white}
					stroke={BORDER}
					strokeWidth={2}
				/>
				<rect
					x={workspace.x}
					y={workspace.y}
					width={workspace.w}
					height={88}
					rx={28}
					fill={brand.colors.neutral}
				/>
				<rect
					x={workspace.x}
					y={workspace.y + 60}
					width={workspace.w}
					height={28}
					fill={brand.colors.neutral}
				/>
				<rect
					x={workspace.x + 92}
					y={workspace.y + 34}
					width={188}
					height={20}
					rx={10}
					fill="rgba(0, 0, 0, 0.13)"
				/>
				<rect
					x={workspace.x + 300}
					y={workspace.y + 34}
					width={84}
					height={20}
					rx={10}
					fill="rgba(0, 0, 0, 0.08)"
				/>
				<rect
					x={workspace.x}
					y={workspace.y + 88}
					width={workspace.w}
					height={2}
					fill={BORDER}
				/>
			</g>

			{/* Duplicate stack — "trabalho repetido" */}
			{ghost > 0
				? [24, 12].map((offset, i) => (
						<rect
							key={offset}
							x={planilhas.x - offset}
							y={planilhas.y - offset}
							width={planilhas.w}
							height={planilhas.h}
							rx={18}
							fill={brand.colors.neutral}
							stroke={BORDER}
							strokeWidth={2}
							opacity={ghost * (i === 0 ? 0.45 : 0.7)}
							transform={`rotate(${planilhas.rot} ${planilhas.x + planilhas.w / 2} ${
								planilhas.y + planilhas.h / 2
							})`}
						/>
					))
				: null}

			{/* The three cards themselves */}
			{BLOCK_KEYS.map((key, i) => {
				const rect = blockRectAt(key, frame);

				// Collapsing to a supporting line keeps the row's vertical centre.
				const height = mix(rect.h, 3, flatten);
				const top = rect.y + (rect.h - height) / 2;
				const cx = rect.x + rect.w / 2;
				const cy = rect.y + rect.h / 2;

				return (
					<g key={key} transform={`rotate(${rect.rot} ${cx} ${cy})`}>
						<rect
							x={rect.x}
							y={top}
							width={rect.w}
							height={height}
							rx={mix(18, 1.5, flatten)}
							fill={
								flatten > 0.6
									? 'rgba(0, 0, 0, 0.12)'
									: shell > 0.5
										? brand.colors.white
										: brand.colors.neutral
							}
							stroke={BORDER}
							strokeWidth={2 * fillFade}
						/>
						<text
							x={rect.x + 28}
							y={cy}
							dominantBaseline="central"
							opacity={fillFade}
							style={{
								...type.blockLabel,
								fontSize: mix(38, 34, phase(frame, beats.alignStart, beats.alignEnd)),
							}}
						>
							{content.blocks[key]}
						</text>
						{/* Rides its own card, or it floats detached while they travel. */}
						<Toggle
							x={rect.x + rect.w - 88}
							y={cy - 16}
							on={i !== 1}
							opacity={settled * fillFade * (1 - flatten)}
						/>
					</g>
				);
			})}
		</svg>
	);
};
