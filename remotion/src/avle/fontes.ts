import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

const PESOS = [300, 400, 500, 600, 700] as const;

/**
 * Urbanist carregada de `public/fonts`, do mesmo jeito que a Inter da Sinapis:
 * nada vem da rede na hora do render. Os arquivos saíram de
 * `node_modules/@fontsource/urbanist` (subconjunto latin, que já cobre á, ç, ã,
 * õ e o ponto do "1 · 2 · 3"). O render segura até todos os pesos estarem
 * prontos; sem isso os primeiros frames saem na fonte de reserva.
 */
const espera = delayRender('Carregando a fonte Urbanist');

Promise.all(
	PESOS.map(async (peso) => {
		const url = staticFile(`fonts/urbanist-latin-${peso}-normal.woff2`);
		const face = new FontFace('Urbanist', `url(${url}) format('woff2')`, {
			weight: String(peso),
			style: 'normal',
			display: 'block',
		});
		await face.load();
		document.fonts.add(face);
	}),
)
	.then(() => document.fonts.ready)
	.then(() => continueRender(espera))
	.catch((erro: Error) => {
		cancelRender(
			new Error(
				`Não foi possível carregar a Urbanist de public/fonts. Confira se os arquivos urbanist-latin-{300,400,500,600,700}-normal.woff2 existem. Causa: ${erro.message}`,
			),
		);
	});
