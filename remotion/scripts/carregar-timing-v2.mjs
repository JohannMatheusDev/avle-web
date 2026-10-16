// Carrega src/avle-v2/timing.ts fora do Remotion, para os scripts saberem os
// beats sem repetir os números. O timing.ts não importa nada de propósito:
// o esbuild (que já vem com o Remotion) só precisa tirar os tipos.
import {buildSync} from 'esbuild';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const carregarTiming = async () => {
	const {outputFiles} = buildSync({
		entryPoints: [path.join(raiz, 'src/avle-v2/timing.ts')],
		bundle: true,
		format: 'esm',
		write: false,
		platform: 'node',
	});
	const codigo = Buffer.from(outputFiles[0].contents).toString('base64');
	return import(`data:text/javascript;base64,${codigo}`);
};

export {raiz};
