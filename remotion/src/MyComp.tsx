import {
	AbsoluteFill,
	interpolate,
	Sequence,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

const COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d'];

const Circle: React.FC<{color: string; delay: number; x: number}> = ({
	color,
	delay,
	x,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const scale = spring({
		fps,
		frame: frame - delay,
		config: {damping: 200},
	});

	return (
		<div
			style={{
				position: 'absolute',
				top: '60%',
				left: x,
				width: 160,
				height: 160,
				borderRadius: '50%',
				backgroundColor: color,
				transform: `translate(-50%, -50%) scale(${scale})`,
			}}
		/>
	);
};

export const MyComp: React.FC<{title: string}> = ({title}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const titleScale = spring({
		fps,
		frame,
		config: {damping: 200},
	});

	const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{backgroundColor: '#1a1a2e'}}>
			<AbsoluteFill
				style={{alignItems: 'center', justifyContent: 'center'}}
			>
				<div
					style={{
						fontSize: 100,
						fontWeight: 700,
						color: 'white',
						fontFamily: 'sans-serif',
						opacity: titleOpacity,
						transform: `scale(${titleScale})`,
					}}
				>
					{title}
				</div>
			</AbsoluteFill>

			<Sequence from={25}>
				<Circle color={COLORS[0]} delay={0} x={1920 * 0.3} />
				<Circle color={COLORS[1]} delay={6} x={1920 * 0.5} />
				<Circle color={COLORS[2]} delay={12} x={1920 * 0.7} />
			</Sequence>
		</AbsoluteFill>
	);
};
