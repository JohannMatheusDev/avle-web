import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {Cena1Gancho} from './cenas/Cena1Gancho';
import {Cena2Contraste} from './cenas/Cena2Contraste';
import {Cena3Virada} from './cenas/Cena3Virada';
import {Cena4ComoFunciona} from './cenas/Cena4ComoFunciona';
import {Cena5Beneficio} from './cenas/Cena5Beneficio';
import {Cena6Cta} from './cenas/Cena6Cta';
import {cor} from './marca';
import {clamp, curvaDupla} from './movimento';
import {BarraDeProgresso} from './motion/BarraDeProgresso';
import {Legendas} from './motion/Legendas';
import {FONTE} from './tema';
import {
	audio,
	DURACAO,
	duracaoDaSequencia,
	ORDEM_DAS_CENAS,
	todosOsBeats,
	transicoes,
	type NomeDaCena,
} from './timing';

export type AvleApresentacaoV2Props = {
	/** Desligadas por padrão: com `true` e sem o arquivo, o render falha. */
	comNarracao: boolean;
	comTrilha: boolean;
	comSfx: boolean;
};

const CENAS: Record<NomeDaCena, React.FC> = {
	gancho: Cena1Gancho,
	contraste: Cena2Contraste,
	virada: Cena3Virada,
	comoFunciona: Cena4ComoFunciona,
	beneficio: Cena5Beneficio,
	cta: Cena6Cta,
};

/**
 * Só duas saídas usam transição de verdade; as outras são cortes secos,
 * porque o match cut já acontece dentro da cena (ver `transicoes`).
 */
const saida = (nome: Exclude<NomeDaCena, 'cta'>) => {
	if (transicoes[nome] === 0) {
		return null;
	}
	// O TransitionSeries só aceita o elemento Transition como filho direto,
	// então a escolha devolve o elemento pronto.
	const chave = `${nome}-saida`;
	const timing = linearTiming({durationInFrames: transicoes[nome], easing: curvaDupla});
	return nome === 'virada' ? (
		<TransitionSeries.Transition key={chave} timing={timing} presentation={slide({direction: 'from-bottom'})} />
	) : (
		<TransitionSeries.Transition key={chave} timing={timing} presentation={wipe({direction: 'from-bottom'})} />
	);
};

/**
 * V2 do vídeo da AVLE para lojistas: mais motion, mais retenção e outro
 * gancho. A V1 (`AvleApresentacao`, em `src/avle/`) continua intacta.
 *
 * As cenas ficam num `TransitionSeries`; a barra de progresso, as legendas e
 * os efeitos sonoros ficam por cima, no frame global.
 */
export const AvleApresentacaoV2: React.FC<AvleApresentacaoV2Props> = ({comNarracao, comTrilha, comSfx}) => (
	<AbsoluteFill style={{backgroundColor: cor.fundoForte, fontFamily: FONTE, WebkitFontSmoothing: 'antialiased'}}>
		<TransitionSeries>
			{ORDEM_DAS_CENAS.flatMap((nome) => {
				const Cena = CENAS[nome];
				const sequencia = (
					<TransitionSeries.Sequence key={nome} durationInFrames={duracaoDaSequencia(nome)}>
						<Cena />
					</TransitionSeries.Sequence>
				);
				const depois = nome === 'cta' ? null : saida(nome);
				return depois ? [sequencia, depois] : [sequencia];
			})}
		</TransitionSeries>

		<Legendas />
		<BarraDeProgresso />

		{comNarracao ? <Audio src={staticFile(audio.narracao)} /> : null}
		{comTrilha ? (
			<Audio
				src={staticFile(audio.trilha)}
				volume={(f) =>
					interpolate(f, [DURACAO - audio.fadeOutDaTrilha, DURACAO], [audio.volumeDaTrilha, 0], clamp)
				}
			/>
		) : null}
		{comSfx
			? todosOsBeats()
					.filter((beat) => beat.som)
					.map((beat) => (
						<Sequence key={`${beat.cena}-${beat.nome}`} from={beat.frame} layout="none">
							<Audio src={staticFile(`${audio.pastaSfx}/${beat.som}.mp3`)} volume={audio.volumeDoSfx} />
						</Sequence>
					))
			: null}
	</AbsoluteFill>
);
