import {Composition} from 'remotion';
import {MyComp} from './MyComp';
import './sinapis/fonts';
import {SinapisIntro} from './sinapis/SinapisIntro';
import {Cover} from './sinapis/Cover';
import {DURATION, FPS, HEIGHT, WIDTH} from './sinapis/timing';
import './avle/fontes';
import {AvleApresentacao, type AvleApresentacaoProps} from './avle/AvleApresentacao';
import {AvleCapa} from './avle/AvleCapa';
import * as avle from './avle/timing';
import './avle-v2/fontes';
import {AvleApresentacaoV2, type AvleApresentacaoV2Props} from './avle-v2/AvleApresentacaoV2';
import {AvleCapaV2} from './avle-v2/AvleCapaV2';
import * as avleV2 from './avle-v2/timing';

export const Root: React.FC = () => {
	return (
		<>
			<Composition
				id="SinapisDevIntro"
				component={SinapisIntro}
				durationInFrames={DURATION}
				width={WIDTH}
				height={HEIGHT}
				fps={FPS}
			/>
			<Composition
				id="SinapisDevCover"
				component={Cover}
				durationInFrames={1}
				width={WIDTH}
				height={HEIGHT}
				fps={FPS}
			/>
			<Composition
				id="AvleApresentacao"
				component={AvleApresentacao}
				durationInFrames={avle.DURACAO}
				width={avle.LARGURA}
				height={avle.ALTURA}
				fps={avle.FPS}
				defaultProps={{comNarracao: false, comTrilha: false} satisfies AvleApresentacaoProps}
			/>
			<Composition
				id="AvleCapa"
				component={AvleCapa}
				durationInFrames={1}
				width={avle.LARGURA}
				height={avle.ALTURA}
				fps={avle.FPS}
			/>
			<Composition
				id="AvleApresentacaoV2"
				component={AvleApresentacaoV2}
				durationInFrames={avleV2.DURACAO}
				width={avleV2.LARGURA}
				height={avleV2.ALTURA}
				fps={avleV2.FPS}
				defaultProps={{comNarracao: false, comTrilha: false, comSfx: false} satisfies AvleApresentacaoV2Props}
			/>
			<Composition
				id="AvleCapaV2"
				component={AvleCapaV2}
				durationInFrames={1}
				width={avleV2.LARGURA}
				height={avleV2.ALTURA}
				fps={avleV2.FPS}
			/>
			<Composition
				id="MyComp"
				component={MyComp}
				durationInFrames={150}
				width={1920}
				height={1080}
				fps={30}
				defaultProps={{title: 'Hello, Remotion'}}
			/>
		</>
	);
};
