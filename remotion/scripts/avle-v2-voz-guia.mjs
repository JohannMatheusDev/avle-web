// Gera uma voz guia para a V2 com a voz Luciana do macOS (comando `say`) e
// salva em public/avle/narracao-v2.mp3, onde o `npm run avle-v2` a encontra.
//
// É uma voz sintética, para ouvir o ritmo do vídeo com fala antes de gravar,
// não para publicar. Cada bloco de legenda vira uma fala que começa no frame
// do bloco; se a fala não couber na janela, ela é acelerada (até 1,35×) e o
// script avisa. Grave a narração de verdade por cima deste mesmo arquivo.
import {spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {buildSync} from 'esbuild';
import {raiz} from './carregar-timing-v2.mjs';

const VOZ = process.env.VOZ ?? 'Luciana';
// Palavras por minuto do `say`. A 190 (perto do padrão) três falas não
// cabiam nas janelas; locutor de anúncio fala na faixa de 200 a 220.
const VELOCIDADE = 210;
const CABE = 0.95; // a fala ocupa no máximo 95% da janela
const ACELERACAO_MAXIMA = 1.35;

const {outputFiles} = buildSync({
	entryPoints: [path.join(raiz, 'src/avle-v2/roteiro.ts')],
	bundle: true,
	format: 'esm',
	write: false,
	platform: 'node',
});
const r = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString('base64')}`);
const {FPS, DURACAO} = await import(
	`data:text/javascript;base64,${Buffer.from(
		buildSync({entryPoints: [path.join(raiz, 'src/avle-v2/timing.ts')], bundle: true, format: 'esm', write: false}).outputFiles[0].contents,
	).toString('base64')}`
);

const rodar = (cmd, args) => {
	const res = spawnSync(cmd, args, {encoding: 'utf8'});
	if (res.status !== 0) throw new Error(`${cmd} falhou: ${res.stderr}`);
	return res.stdout;
};
const duracaoDe = (arquivo) =>
	Number(rodar('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arquivo]).trim());

const pasta = mkdtempSync(path.join(tmpdir(), 'voz-guia-'));
const entradas = [];
const filtros = [];
const avisos = [];

r.legendas.forEach((legenda, i) => {
	const aiff = path.join(pasta, `fala-${i}.aiff`);
	rodar('say', ['-v', VOZ, '-r', String(VELOCIDADE), '-o', aiff, legenda.texto]);
	const fala = duracaoDe(aiff);
	const inicio = r.inicioGlobal(legenda) / FPS;
	const janela = (r.fimGlobal(legenda) - r.inicioGlobal(legenda)) / FPS;
	let tempo = Math.max(1, fala / (janela * CABE));
	if (tempo > ACELERACAO_MAXIMA) {
		avisos.push(`"${legenda.texto}": ${fala.toFixed(2)} s numa janela de ${janela.toFixed(2)} s`);
		tempo = ACELERACAO_MAXIMA;
	}
	entradas.push('-i', aiff);
	filtros.push(`[${i}:a]atempo=${tempo.toFixed(3)},adelay=${Math.round(inicio * 1000)}:all=1[f${i}]`);
	console.log(`${inicio.toFixed(2).padStart(5)} s  ${tempo > 1 ? `${tempo.toFixed(2)}×` : '     '}  ${legenda.texto}`);
});

const saida = path.join(raiz, 'public/avle/narracao-v2.mp3');
const n = r.legendas.length;
rodar('ffmpeg', [
	'-y',
	'-loglevel',
	'error',
	...entradas,
	'-filter_complex',
	`${filtros.join(';')};${Array.from({length: n}, (_, i) => `[f${i}]`).join('')}amix=inputs=${n}:normalize=0,apad,atrim=0:${DURACAO / FPS}[a]`,
	'-map',
	'[a]',
	'-c:a',
	'libmp3lame',
	'-b:a',
	'192k',
	saida,
]);
rmSync(pasta, {recursive: true});

console.log(`\nVoz guia (${VOZ}) salva em ${path.relative(raiz, saida)}.`);
if (avisos.length > 0) {
	console.log('Falas que não couberam nem acelerando 1,35× (passam da janela):');
	for (const a of avisos) console.log(`  ${a}`);
}
