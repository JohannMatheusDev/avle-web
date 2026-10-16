// Lista os beats da V2 e falha se algum intervalo entre estímulos passar de
// INTERVALO_MAXIMO (36 frames, 1,2 s). Rode antes de renderizar:
//   npm run avle-v2:ritmo
import {carregarTiming} from './carregar-timing-v2.mjs';

const t = await carregarTiming();
const beats = t.todosOsBeats();
// O início de cada cena é um corte, e corte conta como estímulo.
const estimulos = [
	...beats.map((b) => b.frame),
	...t.ORDEM_DAS_CENAS.map((c) => t.cenas[c].inicio),
	t.DURACAO,
];
const frames = [...new Set(estimulos)].sort((a, b) => a - b);

const segundos = (f) => (f / t.FPS).toFixed(2).replace('.', ',');
console.log('frame  tempo   cena          beat                  som');
for (const b of beats) {
	console.log(
		`${String(b.frame).padStart(5)}  ${segundos(b.frame).padStart(5)}s  ${b.cena.padEnd(12)}  ${b.nome.padEnd(20)}  ${b.som ?? ''}`,
	);
}

let pior = {de: 0, ate: 0, gap: 0};
const falhas = [];
for (let i = 1; i < frames.length; i++) {
	const gap = frames[i] - frames[i - 1];
	if (gap > pior.gap) pior = {de: frames[i - 1], ate: frames[i], gap};
	if (gap > t.INTERVALO_MAXIMO) falhas.push({de: frames[i - 1], ate: frames[i], gap});
}

console.log(`\n${beats.length} beats, ${beats.filter((b) => b.som).length} com som.`);
console.log(
	`Maior intervalo: ${pior.gap} frames (${segundos(pior.gap)} s), entre ${pior.de} e ${pior.ate}. Limite: ${t.INTERVALO_MAXIMO}.`,
);
if (falhas.length > 0) {
	for (const f of falhas) console.error(`PARADO DEMAIS: frames ${f.de}–${f.ate} (${f.gap} frames)`);
	process.exit(1);
}
console.log('Ritmo ok: nenhum trecho passa de 1,2 s sem estímulo novo.');
