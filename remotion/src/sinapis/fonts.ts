import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

const WEIGHTS = [400, 500, 700, 800] as const;

/**
 * Inter is served from `public/fonts` rather than a CDN so a render never
 * depends on the network. Frames are held back until every weight is ready,
 * otherwise the first frames capture a fallback face.
 */
const handle = delayRender('Carregando a fonte Inter');

Promise.all(
	WEIGHTS.map(async (weight) => {
		const url = staticFile(`fonts/inter-latin-${weight}-normal.woff2`);
		const face = new FontFace('Inter', `url(${url}) format('woff2')`, {
			weight: String(weight),
			style: 'normal',
			display: 'block',
		});
		await face.load();
		document.fonts.add(face);
	}),
)
	.then(() => document.fonts.ready)
	.then(() => continueRender(handle))
	.catch((err: Error) => {
		cancelRender(
			new Error(
				`Não foi possível carregar a Inter de public/fonts. Confira se os arquivos inter-latin-{400,500,700,800}-normal.woff2 existem. Causa: ${err.message}`,
			),
		);
	});
