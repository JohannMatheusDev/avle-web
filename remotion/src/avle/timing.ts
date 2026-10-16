/**
 * Toda a minutagem do vídeo da AVLE, em frames a 30 fps.
 *
 * Os componentes não guardam número de frame próprio: leem daqui. Retemporizar
 * uma cena é mexer neste arquivo e conferir as legendas em `roteiro.ts`, que
 * contam a partir do início de cada cena e por isso andam junto.
 */

export const FPS = 30;
export const LARGURA = 1080;
export const ALTURA = 1920;
export const DURACAO = 900;

export type NomeDaCena =
	| 'gancho'
	| 'dor'
	| 'virada'
	| 'comoFunciona'
	| 'beneficio'
	| 'cta';

/**
 * Início e duração de cada cena, como estão no roteiro. Tem de ladrilhar 0..900
 * sem buraco: a soma das durações é 900.
 */
export const cenas: Record<NomeDaCena, {inicio: number; duracao: number}> = {
	gancho: {inicio: 0, duracao: 90},
	dor: {inicio: 90, duracao: 150},
	virada: {inicio: 240, duracao: 90},
	comoFunciona: {inicio: 330, duracao: 300},
	beneficio: {inicio: 630, duracao: 120},
	cta: {inicio: 750, duracao: 150},
};

export const ORDEM_DAS_CENAS: NomeDaCena[] = [
	'gancho',
	'dor',
	'virada',
	'comoFunciona',
	'beneficio',
	'cta',
];

/**
 * Transição que sai de cada cena para a seguinte, em frames.
 *
 * No `TransitionSeries` a transição sobrepõe as duas cenas, e o vídeo encolhe
 * o tamanho dela. Para cada cena começar no frame do roteiro, quem sai ganha
 * esses frames a mais (`duracaoDaSequencia`): a cena nova entra no frame certo
 * e a transição acontece nos primeiros frames dela, por cima da antiga.
 */
export const transicoes: Record<Exclude<NomeDaCena, 'cta'>, number> = {
	gancho: 8,
	dor: 12,
	virada: 10,
	comoFunciona: 10,
	beneficio: 10,
};

export const duracaoDaSequencia = (cena: NomeDaCena) =>
	cenas[cena].duracao + (cena === 'cta' ? 0 : transicoes[cena]);

/**
 * Batidas dentro de cada cena, contadas a partir do frame 0 da própria cena
 * (é o que `useCurrentFrame()` devolve dentro de uma sequência).
 */
export const batidas = {
	gancho: {
		/** Empurrão lento do bloco inteiro, para o gancho nunca ficar parado. */
		aproximacaoFim: 90,
	},
	dor: {
		rotulo: 2,
		/** Um cartão a cada frase da narração: atraso, braço, caixa. */
		cartoes: [24, 60, 94],
		/** O X entra depois de o cartão assentar. */
		atrasoDoX: 9,
		/** O corte que derruba os três. */
		queda: 132,
		quedaDuracao: 16,
		/** Os cartões caem um depois do outro, de cima para baixo. */
		quedaEscalonada: 2,
	},
	virada: {
		arvoreInicio: 2,
		arvoreFim: 36,
		marca: 24,
		slogan: 42,
		aproximacaoFim: 100,
	},
	comoFunciona: {
		/** Onde cada passo começa. O contador no topo troca nesses frames. */
		passos: [0, 104, 166],
		celularEntra: 0,
		cartaoDoGrupo: 10,
		parcela: 20,
		/** A barra avança uma parcela em cada um destes frames. */
		parcelasPagas: [38, 52, 66, 80],
		/** Dentro do celular, o painel dá lugar à conversa. */
		trocaDeTela: 104,
		balao: 112,
		toqueNoPix: 132,
		pago: 140,
		celularSai: 166,
		placarEntra: 168,
		/** Cada dígito trava num frame, da esquerda para a direita. */
		digitosTravam: [206, 216, 226],
		selo: 232,
		contemplada: 252,
	},
	beneficio: {
		rotulo: 0,
		primeiraBarra: 8,
		intervaloEntreBarras: 7,
		subidaDaBarra: 22,
		nota: 24,
		etiqueta: 66,
		aproximacaoFim: 130,
	},
	cta: {
		/** Linhas do título, uma depois da outra. */
		titulo: [0, 6, 12],
		botao: 44,
		/** As duas pulsadas do botão. */
		pulsos: [72, 94],
		pulsoDuracao: 16,
		seta: 56,
		/** A seta desce e volta duas vezes, apontando para o link da bio. */
		setaBalancos: [84, 106],
		setaBalancoDuracao: 14,
		rodape: 28,
		/**
		 * Daqui até o fim (20 frames) nada se move: é a imagem que fica como
		 * thumbnail de fim. Toda animação da cena termina antes deste frame.
		 */
		congela: 130,
	},
} as const;

export const audio = {
	narracao: 'avle/narracao.mp3',
	trilha: 'avle/trilha.mp3',
	/** Trilha baixa, por baixo da narração. */
	volumeDaTrilha: 0.12,
	fadeOutDaTrilha: 15,
} as const;
