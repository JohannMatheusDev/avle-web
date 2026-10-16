import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {Cena1Gancho} from './cenas/Cena1Gancho';
import {Cena2Dor} from './cenas/Cena2Dor';
import {Cena3Virada} from './cenas/Cena3Virada';
import {Cena4ComoFunciona} from './cenas/Cena4ComoFunciona';
import {Cena5Beneficio} from './cenas/Cena5Beneficio';
import {Cena6Cta} from './cenas/Cena6Cta';
import {Legendas} from './componentes/Legendas';
import {cor} from './marca';
import {clamp, curvaDupla} from './movimento';
import {FONTE} from './tema';
import {
	audio,
	DURACAO,
	duracaoDaSequencia,
	ORDEM_DAS_CENAS,
	transicoes,
	type NomeDaCena,
} from './timing';

export type AvleApresentacaoProps = {
	/**
	 * Desligada por padrão para o vídeo renderizar antes de a narração existir:
	 * com `true` e sem `public/avle/narracao.mp3`, o render falha.
	 */
	comNarracao: boolean;
	/** Mesma lógica, para `public/avle/trilha.mp3`. */
	comTrilha: boolean;
};

const CENAS: Record<NomeDaCena, React.FC> = {
	gancho: Cena1Gancho,
	dor: Cena2Dor,
	virada: Cena3Virada,
	comoFunciona: Cena4ComoFunciona,
	beneficio: Cena5Beneficio,
	cta: Cena6Cta,
};

/**
 * Como cada cena sai. Curtas e com direção: slide ou wipe, nunca dissolve.
 * Sobre o verde a dor sobe como um cartão; o papel sobe por cima da dor; entre
 * cenas claras o movimento é lateral, como passar de tela; o CTA sobe escuro.
 */
const saida = (nome: Exclude<NomeDaCena, 'cta'>) => {
	// O TransitionSeries só aceita o elemento Transition como filho direto, então
	// a escolha devolve o elemento pronto, e não um componente que o embrulha.
	const chave = `${nome}-saida`;
	const props = {
		timing: linearTiming({durationInFrames: transicoes[nome], easing: curvaDupla}),
	};
	switch (nome) {
		case 'gancho':
			return <TransitionSeries.Transition key={chave} {...props} presentation={slide({direction: 'from-bottom'})} />;
		case 'dor':
			return <TransitionSeries.Transition key={chave} {...props} presentation={wipe({direction: 'from-bottom'})} />;
		case 'virada':
			return <TransitionSeries.Transition key={chave} {...props} presentation={slide({direction: 'from-right'})} />;
		case 'comoFunciona':
			return <TransitionSeries.Transition key={chave} {...props} presentation={wipe({direction: 'from-right'})} />;
		case 'beneficio':
			return <TransitionSeries.Transition key={chave} {...props} presentation={wipe({direction: 'from-bottom'})} />;
	}
};

/**
 * Vídeo de 30 s da AVLE para lojistas (Reels, TikTok, Shorts).
 *
 * As cenas ficam num `TransitionSeries` e as legendas por cima dele, no frame
 * global. Cada cena começa exatamente no frame do roteiro: quem sai dura a
 * mais o tamanho da transição (ver `duracaoDaSequencia` em `timing.ts`).
 */
export const AvleApresentacao: React.FC<AvleApresentacaoProps> = ({comNarracao, comTrilha}) => (
	<AbsoluteFill
		style={{
			backgroundColor: cor.fundoForte,
			fontFamily: FONTE,
			WebkitFontSmoothing: 'antialiased',
		}}
	>
		<TransitionSeries>
			{ORDEM_DAS_CENAS.flatMap((nome) => {
				const Cena = CENAS[nome];
				const sequencia = (
					<TransitionSeries.Sequence key={nome} durationInFrames={duracaoDaSequencia(nome)}>
						<Cena />
					</TransitionSeries.Sequence>
				);
				if (nome === 'cta') {
					return [sequencia];
				}
				return [sequencia, saida(nome)];
			})}
		</TransitionSeries>

		<Legendas />

		{comNarracao ? <Audio src={staticFile(audio.narracao)} /> : null}
		{comTrilha ? (
			<Audio
				src={staticFile(audio.trilha)}
				volume={(f) =>
					interpolate(
						f,
						[DURACAO - audio.fadeOutDaTrilha, DURACAO],
						[audio.volumeDaTrilha, 0],
						clamp,
					)
				}
			/>
		) : null}
	</AbsoluteFill>
);
