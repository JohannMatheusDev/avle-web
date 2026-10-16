/**
 * Minutagem da V2, em frames a 30 fps: cenas, transições e beats.
 *
 * Um beat é um estímulo novo na tela (corte, palavra, número mudando, objeto
 * entrando, zoom). A V2 promete um estímulo a cada 0,8–1,2 s, e quem confere
 * é `scripts/avle-v2-ritmo.mjs`, que lê este arquivo e falha se dois beats
 * seguidos ficarem a mais de 36 frames um do outro. Por isso todo momento
 * que mexe na tela mora aqui, e não solto dentro de uma cena.
 *
 * Este arquivo não importa nada: os scripts de render o carregam fora do
 * Remotion para saber em que frame toca cada efeito sonoro.
 */

export const FPS = 30;
export const LARGURA = 1080;
export const ALTURA = 1920;
export const DURACAO = 900;

/** Maior intervalo aceito entre dois estímulos (1,2 s). */
export const INTERVALO_MAXIMO = 36;

export type NomeDaCena = 'gancho' | 'contraste' | 'virada' | 'comoFunciona' | 'beneficio' | 'cta';

export const ORDEM_DAS_CENAS: NomeDaCena[] = [
	'gancho',
	'contraste',
	'virada',
	'comoFunciona',
	'beneficio',
	'cta',
];

export const cenas: Record<NomeDaCena, {inicio: number; duracao: number}> = {
	gancho: {inicio: 0, duracao: 90},
	contraste: {inicio: 90, duracao: 150},
	virada: {inicio: 240, duracao: 90},
	comoFunciona: {inicio: 330, duracao: 300},
	beneficio: {inicio: 630, duracao: 120},
	cta: {inicio: 750, duracao: 150},
};

/**
 * Transição na saída de cada cena. Zero é corte seco: os match cuts (o
 * caderno que vira árvore, a tela do celular que vira o fundo do benefício)
 * acontecem dentro das cenas e terminam num corte, para o objeto não ser
 * cortado ao meio por um wipe.
 *
 * Como no `TransitionSeries` a transição sobrepõe as duas cenas, a cena que
 * sai dura a mais o tamanho dela, e a seguinte começa no frame do roteiro.
 */
export const transicoes: Record<Exclude<NomeDaCena, 'cta'>, number> = {
	gancho: 0,
	contraste: 0,
	virada: 8,
	comoFunciona: 0,
	beneficio: 8,
};

export const duracaoDaSequencia = (cena: NomeDaCena) =>
	cenas[cena].duracao + (cena === 'cta' ? 0 : transicoes[cena]);

export type Som = 'whoosh' | 'pop' | 'ding' | 'impacto';

/**
 * Um momento de impacto. `em` conta a partir do frame 0 da cena (o que o
 * `useCurrentFrame()` devolve dentro dela). `som` é o efeito que toca nele,
 * quando a prop `comSfx` está ligada. `dur` é quanto o movimento dura, quando
 * a cena precisa saber.
 */
export type Beat = {em: number; som?: Som; dur?: number};

const beat = (em: number, som?: Som, dur?: number): Beat => ({em, som, dur});
const varios = (frames: number[], som?: Som) => frames.map((em) => beat(em, som));

export const batidas = {
	gancho: {
		/**
		 * As notificações caem cada vez mais rápido: 11 frames entre as primeiras,
		 * 1 entre as últimas, até cobrir a tela. A última entra no 68 para estar
		 * assentada no congelamento: congelada no meio da entrada, ela aparecia
		 * meio transparente, como defeito, e não como pausa.
		 */
		notificacoes: varios([3, 14, 23, 31, 38, 44, 49, 53, 57, 60, 62, 64, 66, 67, 68], 'pop'),
		/** Tudo congela, flash, e o carimbo cai. */
		congela: beat(75, 'impacto'),
		carimbo: beat(75, undefined, 4),
	},
	contraste: {
		caderno: beat(0, 'whoosh'),
		viraPagina: varios([3, 20], 'whoosh'),
		/** Cada folha virada mostra um nome que se risca na hora. */
		risca: varios([14, 31]),
		mensagem: beat(39, 'whoosh'),
		balao: beat(42, 'pop'),
		lido: beat(52),
		digitando: beat(58),
		digitandoSome: beat(70),
		calendario: beat(78, 'whoosh'),
		/** Os dias passam de 10 a 18, um a cada 3 frames. */
		dias: varios([82, 85, 88, 91, 94, 97, 100, 103]),
		atrasado: beat(106, 'impacto'),
		/** Pattern interrupt: tela inteira em terracota, uma palavra. */
		chega: beat(117, 'impacto'),
	},
	virada: {
		/** A capa fecha acelerando e bate no frame do impacto. */
		cadernoFecha: beat(6, 'impacto'),
		viraTronco: beat(12, undefined, 10),
		arvore: beat(18, 'whoosh', 30),
		marca: beat(42, 'pop'),
		slogan: beat(54),
		planejado: beat(66),
		/** O slogan acaba de assentar; a câmera dá um empurrão antes do corte. */
		empurrao: beat(78),
	},
	comoFunciona: {
		/** Onde cada passo começa no contador lateral. */
		passos: varios([0, 104, 180]),
		celularEntra: beat(0, 'whoosh'),
		cartaoDoGrupo: beat(8, 'whoosh'),
		parcela: beat(22, 'pop'),
		cotas: varios([34, 38, 42, 46, 50, 54, 58, 62, 66, 70]),
		/** Pattern interrupt aos 14 s. */
		interrupcao: beat(90, 'impacto', 14),
		conversa: beat(104, 'whoosh'),
		balao: beat(110, 'pop'),
		dedo: beat(120),
		toque: beat(128, 'pop'),
		pago: beat(136, 'ding'),
		emDia: beat(156, 'pop'),
		placar: beat(180, 'whoosh'),
		digitos: varios([204, 214, 224], 'pop'),
		selo: beat(232, 'pop'),
		/** Pattern interrupt aos 19 s: congela no número e inverte a cor. */
		congela: beat(240, 'impacto', 8),
		inverte: beat(240, undefined, 4),
		contemplada: beat(248, 'ding'),
		sacola: beat(262, 'whoosh', 18),
		/** A câmera entra na tela do celular, que vira o fundo do benefício. */
		zoomNaTela: beat(282, 'whoosh', 18),
	},
	beneficio: {
		saiDoZoom: beat(0, undefined, 14),
		rotulo: beat(4),
		barras: varios([10, 18, 26, 34, 42, 50], 'pop'),
		selo: beat(14),
		etiqueta: beat(66, 'pop'),
		total: beat(76, 'ding'),
		zoomNoTotal: beat(98, 'whoosh', 14),
	},
	cta: {
		titulo: varios([0, 6, 14]),
		destaque: beat(10, 'whoosh'),
		botao: beat(30, 'pop'),
		pulsos: varios([46, 62]),
		dedo: beat(74),
		toque: beat(86, 'pop'),
		seta: beat(94, 'whoosh'),
		rodape: beat(102),
		balancos: varios([108, 122]),
		/**
		 * Os últimos 15 frames: o celular do gancho volta a vibrar no canto, e
		 * o fim emenda no começo quando a rede repete o vídeo.
		 */
		loop: beat(135, 'pop'),
		loopVibra: varios([135, 141, 147]),
	},
} satisfies Record<NomeDaCena, Record<string, Beat | Beat[]>>;

export const pulsoDuracao = 16;
export const balancoDuracao = 14;
export const flipDuracao = 10;

export const audio = {
	narracao: 'avle/narracao-v2.mp3',
	trilha: 'avle/trilha-v2.mp3',
	pastaSfx: 'avle/sfx',
	volumeDaTrilha: 0.12,
	volumeDoSfx: 0.55,
	fadeOutDaTrilha: 15,
} as const;

export type BeatGlobal = {cena: NomeDaCena; nome: string; frame: number; som?: Som};

/** Todos os beats em frame global, em ordem. Usado pelo SFX e pelos scripts. */
export const todosOsBeats = (): BeatGlobal[] => {
	const lista: BeatGlobal[] = [];
	for (const cena of ORDEM_DAS_CENAS) {
		const inicio = cenas[cena].inicio;
		for (const [nome, valor] of Object.entries(batidas[cena])) {
			const itens = Array.isArray(valor) ? valor : [valor];
			itens.forEach((b, i) =>
				lista.push({
					cena,
					nome: itens.length > 1 ? `${nome}[${i}]` : nome,
					frame: inicio + b.em,
					som: b.som,
				}),
			);
		}
	}
	return lista.sort((a, b) => a.frame - b.frame);
};
