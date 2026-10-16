import {cenas, type NomeDaCena} from './timing';

/**
 * O que a V2 fala e o que ela escreve, num lugar só.
 *
 * Todo nome de pessoa e de grupo aqui é inventado: o brief proíbe nome real
 * de cliente ou de grupo. Os grupos têm nome de flor para ninguém confundir
 * com um grupo que exista numa loja de verdade.
 */

export const narracao: Record<NomeDaCena, string> = {
	gancho: 'Isso é o celular de uma loja no dia do vencimento.',
	contraste: 'Porque vender parcelado do jeito antigo é isso:',
	virada: 'Com a AVLE, sua loja vira um clube de compras.',
	comoFunciona:
		'A cliente entra num grupo com parcela fixa. A AVLE cobra pelo WhatsApp. Todo mês tem sorteio pela Loteria Federal, e quem é contemplada retira na sua loja.',
	beneficio: 'E o dinheiro cai direto na conta da sua loja.',
	cta: 'Quer isso na sua loja? Chama a gente no WhatsApp. Link na bio.',
};

/** Uma notificação por beat de `batidas.gancho.notificacoes`, na mesma ordem. */
const GRUPOS = [
	'Girassóis',
	'Ipês',
	'Jasmins',
	'Orquídeas',
	'Lavandas',
	'Hortênsias',
	'Camélias',
	'Violetas',
	'Margaridas',
	'Tulipas',
	'Azaleias',
	'Begônias',
	'Dálias',
	'Magnólias',
	'Gardênias',
];
const VALORES = ['150,00', '89,90', '150,00', '220,00', '120,00'];

export const tela = {
	gancho: {
		hora: '09:00',
		data: 'Dia do vencimento',
		notificacoes: GRUPOS.map((grupo, i) => ({
			titulo: 'Pagamento recebido',
			texto: `Grupo ${grupo} · R$ ${VALORES[i % VALORES.length]}`,
		})),
		/**
		 * O contador do canto, um valor por notificação. Passa por 1, 4, 12 e 27
		 * como o roteiro pede: cada notificação da cascata soma alguns pagamentos.
		 */
		contador: [1, 2, 4, 6, 9, 12, 15, 17, 19, 21, 23, 24, 25, 26, 27],
		contadorRotulo: 'pagos hoje',
		/**
		 * O celular é de uma loja inventada, e o contador também. A etiqueta
		 * existe porque o brief proíbe número de resultado apresentado como real.
		 */
		aviso: 'Cena ilustrativa',
		carimbo: ['SEM COBRAR', 'NINGUÉM'],
	},
	contraste: {
		/** Páginas do caderno de fiado, na ordem em que aparecem ao virar. */
		paginas: [
			['Cida · R$ 150', 'Valdir · R$ 89,90', 'Neide · R$ 150', 'Edson · R$ 220'],
			['Rosângela · R$ 120', 'Cleusa · R$ 150', 'Ivone · R$ 89,90', 'Dirceu · R$ 150'],
			['Marli · R$ 220', 'Osmar · R$ 150', 'Zuleide · R$ 120', 'Geraldo · R$ 89,90'],
			['Lurdes · R$ 150', 'Aparecida · R$ 89,90', 'Nivaldo · R$ 220', 'Sônia · R$ 150'],
			['Tânia · R$ 120', 'Juarez · R$ 150', 'Elza · R$ 150', 'Wilson · R$ 89,90'],
			['Graça · R$ 220', 'Benedito · R$ 150', 'Iracema · R$ 120', 'Nilton · R$ 150'],
		],
		tituloDoCaderno: 'Fiado',
		contato: 'Cida',
		mensagem: 'Oi, tudo bem? Lembra da parcela?',
		horaDaMensagem: '10:02',
		status: 'visto por último hoje',
		digitando: 'digitando…',
		vencimento: 'Vencimento: dia 10',
		diaInicial: 10,
		hoje: 'hoje',
		atrasado: 'ATRASADO',
		chega: 'CHEGA.',
	},
	virada: {
		slogan: [['Seu', 'clube', 'de', 'compras'], ['planejado']],
	},
	comoFunciona: {
		cliente: 'Bruna',
		saudacao: 'Olá, Bruna',
		grupo: 'Grupo Girassóis',
		parcelaRotulo: 'Parcela fixa',
		parcelaValor: 150,
		cotasTotal: 12,
		cotasRotulo: 'cotas preenchidas',
		interrupcao: 'WhatsApp.',
		contato: 'AVLE',
		mensagem: 'Oi, Bruna. Sua parcela de R$ 150 do Grupo Girassóis vence hoje.',
		botaoPix: 'Pagar com Pix',
		pago: 'Pago',
		emDia: 'Parcelas em dia',
		sorteioRotulo: 'Sorteio do mês',
		/** Ilustrativo. Os dígitos giram e travam neste número. */
		numero: '047',
		selo: 'Auditável · Loteria Federal',
		contempladaTitulo: 'Contemplada!',
		contempladaTexto: 'Retire seu produto na loja',
		retirada: 'Retirada na loja',
	},
	beneficio: {
		rotulo: ['Direto', 'na', 'conta', 'da', 'loja'],
		/**
		 * Ilustrativo e sem promessa. As barras ficam iguais de propósito:
		 * parcela fixa é previsível, e barras crescendo sugeririam um
		 * crescimento que ninguém prometeu.
		 */
		porMes: 2700,
		meses: ['mês 1', 'mês 2', 'mês 3', 'mês 4', 'mês 5', 'mês 6'],
		selo: 'valores ilustrativos',
	},
	cta: {
		titulo: [['Monte', 'o'], ['primeiro', 'grupo'], ['da', 'sua', 'loja']],
		/** Palavras do título que saem em terracota. */
		destaque: ['primeiro', 'grupo'],
		botao: 'Chamar no WhatsApp',
		bio: 'Link na bio',
		siga: 'Siga',
	},
} as const;

/**
 * Legendas queimadas, em blocos de no máximo duas linhas. As palavras de cada
 * bloco entram uma a uma (ver `palavrasDaLegenda`). `de` e `ate` contam a
 * partir do início da cena; `destaque` é o trecho em terracota.
 */
export type Legenda = {cena: NomeDaCena; de: number; ate: number; texto: string; destaque: string};

export const legendas: Legenda[] = [
	{cena: 'gancho', de: 2, ate: 42, texto: 'Isso é o celular de uma loja', destaque: 'celular'},
	// Some no congelamento (frame 75): o carimbo precisa da tela só para ele.
	{cena: 'gancho', de: 42, ate: 75, texto: 'no dia do vencimento.', destaque: 'vencimento'},

	{cena: 'contraste', de: 2, ate: 38, texto: 'Porque vender parcelado', destaque: 'parcelado'},
	{cena: 'contraste', de: 38, ate: 78, texto: 'do jeito antigo é isso:', destaque: 'jeito antigo'},

	{cena: 'virada', de: 2, ate: 40, texto: 'Com a AVLE,', destaque: 'AVLE'},
	{cena: 'virada', de: 40, ate: 90, texto: 'sua loja vira um clube de compras.', destaque: 'clube de compras'},

	{cena: 'comoFunciona', de: 3, ate: 45, texto: 'A cliente entra num grupo', destaque: 'grupo'},
	{cena: 'comoFunciona', de: 45, ate: 90, texto: 'com parcela fixa.', destaque: 'parcela fixa'},
	{cena: 'comoFunciona', de: 92, ate: 160, texto: 'A AVLE cobra pelo WhatsApp.', destaque: 'WhatsApp'},
	// A última fala do passo 3 é a mais longa do vídeo (8 palavras): as duas
	// anteriores cederam tempo para ela não invadir o benefício. Medido com a
	// voz guia, que a 210 palavras/min ainda precisa de 1,3× para caber.
	{cena: 'comoFunciona', de: 181, ate: 214, texto: 'Todo mês tem sorteio', destaque: 'sorteio'},
	{cena: 'comoFunciona', de: 214, ate: 246, texto: 'pela Loteria Federal,', destaque: 'Loteria Federal'},
	{cena: 'comoFunciona', de: 246, ate: 300, texto: 'e quem é contemplada retira na sua loja.', destaque: 'retira na sua loja'},

	{cena: 'beneficio', de: 3, ate: 60, texto: 'E o dinheiro cai direto', destaque: 'direto'},
	{cena: 'beneficio', de: 60, ate: 120, texto: 'na conta da sua loja.', destaque: 'conta da sua loja'},

	{cena: 'cta', de: 2, ate: 45, texto: 'Quer isso na sua loja?', destaque: 'na sua loja'},
	{cena: 'cta', de: 45, ate: 95, texto: 'Chama a gente no WhatsApp.', destaque: 'WhatsApp'},
	// Acaba no frame 135, quando o celular do loop entra no canto.
	{cena: 'cta', de: 95, ate: 135, texto: 'Link na bio.', destaque: 'bio'},
];

export const inicioGlobal = (l: Legenda) => cenas[l.cena].inicio + l.de;
export const fimGlobal = (l: Legenda) => cenas[l.cena].inicio + l.ate;

export type PalavraFalada = {texto: string; em: number; destaque: boolean};

/** A fala ocupa esta fração do bloco; o resto é respiro antes do próximo. */
const FRACAO_FALADA = 0.82;

/**
 * Quando cada palavra de um bloco entra, em frame global.
 *
 * Sem a narração gravada não há tempo real de cada palavra, então o tempo é
 * repartido pelo tamanho da palavra, com uma pausa a mais depois de vírgula e
 * ponto. Fica perto do ritmo de fala; depois de gravar, quem manda são os
 * `de`/`ate` dos blocos acima.
 */
export const palavrasDaLegenda = (legenda: Legenda): PalavraFalada[] => {
	const palavras = legenda.texto.split(' ');
	const pesos = palavras.map((p) => p.length + 3 + (/[,.:?]$/.test(p) ? 3 : 0));
	const total = pesos.reduce((a, b) => a + b, 0);
	const janela = (legenda.ate - legenda.de) * FRACAO_FALADA;
	const inicioDoDestaque = legenda.texto.indexOf(legenda.destaque);
	const fimDoDestaque = inicioDoDestaque + legenda.destaque.length;

	let acumulado = 0;
	let posicao = 0;
	return palavras.map((texto, i) => {
		const em = inicioGlobal(legenda) + Math.round((acumulado / total) * janela);
		const destaque = inicioDoDestaque >= 0 && posicao < fimDoDestaque && posicao + texto.length > inicioDoDestaque;
		acumulado += pesos[i];
		posicao += texto.length + 1;
		return {texto, em, destaque};
	});
};
