// Monta out/avle-v2.mp4 a partir dos frames de out/avle-v2-frames.
//
// Existe pelo mesmo motivo do avle-montar.sh da V1: o compositor do Remotion
// 4.0.532 exige macOS 15, e neste macOS 13 o `remotion render ... .mp4`
// morre ao juntar o vídeo ("Symbol not found: _AVCaptureDeviceTypeContinuityCamera").
//
// O áudio também é montado aqui, a partir do mesmo timing.ts que o vídeo usa:
// cada beat com `som` vira um efeito no frame dele. Entra o que existir em
// public/: narracao-v2.mp3, trilha-v2.mp3 e sfx/<som>.mp3. Faltando tudo, o
// vídeo sai sem áudio.
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {carregarTiming, raiz} from './carregar-timing-v2.mjs';

const t = await carregarTiming();
const publico = (arquivo) => path.join(raiz, 'public', arquivo);
const duracao = t.DURACAO / t.FPS;

const entradas = ['-framerate', String(t.FPS), '-i', path.join(raiz, 'out/avle-v2-frames/element-%03d.jpeg')];
const filtros = [];
const rotulos = [];
let n = 1;

if (existsSync(publico(t.audio.narracao))) {
	entradas.push('-i', publico(t.audio.narracao));
	filtros.push(`[${n}:a]apad,atrim=0:${duracao}[narr]`);
	rotulos.push('[narr]');
	n++;
}
if (existsSync(publico(t.audio.trilha))) {
	const fade = t.audio.fadeOutDaTrilha / t.FPS;
	entradas.push('-i', publico(t.audio.trilha));
	filtros.push(
		`[${n}:a]apad,atrim=0:${duracao},volume=${t.audio.volumeDaTrilha},afade=t=out:st=${duracao - fade}:d=${fade}[tril]`,
	);
	rotulos.push('[tril]');
	n++;
}

const faltando = new Set();
for (const [i, beat] of t.todosOsBeats().filter((b) => b.som).entries()) {
	const arquivo = publico(`${t.audio.pastaSfx}/${beat.som}.mp3`);
	if (!existsSync(arquivo)) {
		faltando.add(beat.som);
		continue;
	}
	const atraso = Math.round((beat.frame / t.FPS) * 1000);
	entradas.push('-i', arquivo);
	filtros.push(`[${n}:a]volume=${t.audio.volumeDoSfx},adelay=${atraso}:all=1[s${i}]`);
	rotulos.push(`[s${i}]`);
	n++;
}

const saida = path.join(raiz, 'out/avle-v2.mp4');
const audio =
	rotulos.length === 0
		? ['-an']
		: [
				'-filter_complex',
				[...filtros, `${rotulos.join('')}amix=inputs=${rotulos.length}:normalize=0,atrim=0:${duracao}[a]`].join(';'),
				'-map',
				'0:v',
				'-map',
				'[a]',
				'-c:a',
				'aac',
				'-b:a',
				'192k',
			];

const resultado = spawnSync(
	'ffmpeg',
	[
		'-y',
		'-loglevel',
		'error',
		...entradas,
		...audio,
		'-vf',
		'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
		'-c:v',
		'libx264',
		'-profile:v',
		'high',
		'-preset',
		'slow',
		'-crf',
		'16',
		'-color_primaries',
		'bt709',
		'-color_trc',
		'bt709',
		'-colorspace',
		'bt709',
		'-color_range',
		'tv',
		'-movflags',
		'+faststart',
		'-t',
		String(duracao),
		saida,
	],
	{stdio: 'inherit'},
);
if (resultado.status !== 0) process.exit(resultado.status ?? 1);

console.log(`Pronto: ${path.relative(raiz, saida)} (${rotulos.length === 0 ? 'sem áudio' : `${rotulos.length} faixas de áudio`})`);
if (faltando.size > 0) console.log(`Efeitos sem arquivo em public/${t.audio.pastaSfx}/: ${[...faltando].join(', ')}`);
