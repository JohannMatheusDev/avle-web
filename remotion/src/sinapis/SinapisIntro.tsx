import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {brand} from './brand';
import {BlueDot, CobaltField, Connection} from './components/BlueDot';
import {Branches} from './components/Branches';
import {Cards} from './components/Cards';
import {Scene1Hook} from './scenes/Scene1Hook';
import {Scene2Recognition} from './scenes/Scene2Recognition';
import {Scene3Turning} from './scenes/Scene3Turning';
import {Scene4Brand} from './scenes/Scene4Brand';
import {Scene5Reason} from './scenes/Scene5Reason';
import {Scene6Cta} from './scenes/Scene6Cta';
import {font} from './theme';

/**
 * Scenes are not wrapped in Sequences: the cards and the blue dot have to read
 * one global frame so they can carry across scene boundaries unbroken. Each
 * scene component owns its own in/out window instead.
 */
export const SinapisIntro: React.FC = () => {
	const frame = useCurrentFrame();

	return (
		<AbsoluteFill
			style={{
				backgroundColor: brand.colors.white,
				fontFamily: font.family,
				WebkitFontSmoothing: 'antialiased',
			}}
		>
			{/* Behind the cards: the stroke emerges between them instead of
			    striking through their labels. */}
			<Connection frame={frame} />
			<Cards frame={frame} />
			<Branches frame={frame} />

			<Scene1Hook frame={frame} />
			<Scene2Recognition frame={frame} />
			<Scene3Turning frame={frame} />
			<Scene4Brand frame={frame} />
			<Scene5Reason frame={frame} />

			<BlueDot frame={frame} />

			<CobaltField frame={frame} />
			<Scene6Cta frame={frame} />
		</AbsoluteFill>
	);
};
