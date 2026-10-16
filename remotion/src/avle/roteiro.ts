import {cenas, type NomeDaCena} from './timing';

/**
 * O texto falado e o que aparece escrito na tela, num lugar só.
 *
 * Trocar uma palavra da narração é mexer aqui; a legenda e a tela leem daqui.
 * Os frames das legendas contam a partir do início da cena, então retemporizar
 * uma cena em `timing.ts` arrasta as legendas dela junto.
 */

export const narracao: Record<NomeDaCena, string> = {
	gancho: 'E se o seu cliente pagasse antes de levar o produto?',
	dor: 'Vender parcelado hoje é correr atrás de atraso, cobrar no braço e torcer pra receber.',
	virada: 'Com a AVLE, sua loja monta um clube de compras.',
	comoFunciona:
		'A cliente entra num grupo e paga uma parcela fixa por mês. A gente cobra pelo WhatsApp. Todo mês tem sorteio auditável pela Loteria Federal, e quem é contemplada retira o produto na sua loja.',
	beneficio: 'Dinheiro entrando todo mês, direto na conta da sua loja.',
	cta: 'Quer montar o primeiro grupo da sua loja? Chama a gente no WhatsApp. Link na bio.',
};

/**
 * O que a tela escreve, cena a cena. Reforça a narração com poucas palavras e
 * não repete a frase inteira, exceto no gancho e no CTA.
 */
export const tela = {
	dor: {
		rotulo: 'Venda parcelada, hoje',
		cartoes: ['Cliente atrasado', 'Cobrança no braço', 'Caixa apertado'],
	},
	virada: {
		slogan: ['Seu clube de compras', 'planejado'],
	},
	comoFunciona: {
		passos: ['Parcela fixa', 'Cobrança no WhatsApp', 'Sorteio auditável'],
		saudacao: 'Olá, Marina',
		grupo: 'Meu grupo',
		parcelaRotulo: 'Parcela fixa',
		parcelaValor: 150,
		parcelasRotulo: 'Parcelas pagas',
		parcelasTotal: 12,
		/** Antes da barra avançar. Avança uma por batida em `parcelasPagas`. */
		parcelasIniciais: 3,
		contatoNome: 'AVLE',
		contatoDetalhe: 'WhatsApp oficial',
		mensagem: 'Olá, Marina. Sua parcela de R$ 150 do grupo vence hoje.',
		botaoPix: 'Pagar com Pix',
		pago: 'Pago',
		placarRotulo: 'Número contemplado',
		/** Ilustrativo. Os dígitos giram e travam neste número. */
		numeroContemplado: '047',
		selo: 'Auditável · Loteria Federal',
		contempladaTitulo: 'Contemplada!',
		contempladaTexto: 'Retire seu produto na loja',
	},
	beneficio: {
		rotulo: 'Entrou na conta da loja',
		/**
		 * Ilustrativo e sem promessa: 20 clientes a R$ 150, menos os 10% da AVLE,
		 * dá R$ 2.700 por mês. As barras ficam iguais de propósito: parcela fixa
		 * é previsível, e barras crescendo sugeririam um crescimento que ninguém
		 * prometeu.
		 */
		porMes: 2700,
		meses: ['mês 1', 'mês 2', 'mês 3', 'mês 4', 'mês 5', 'mês 6'],
		nota: 'Ilustrativo: 20 clientes de R$ 150, sem os 10% da AVLE',
	},
	cta: {
		/** Uma linha por item; a do meio sai em terracota. */
		titulo: [
			{texto: 'Monte o', destaque: false},
			{texto: 'primeiro grupo', destaque: true},
			{texto: 'da sua loja', destaque: false},
		],
		botao: 'Chamar no WhatsApp',
		bio: 'Link na bio',
		siga: 'Siga',
	},
} as const;

/**
 * A frase do gancho, palavra por palavra, com o frame em que cada uma entra.
 * Quem tem `em: 0` já está na tela no frame 0: o vídeo não abre no preto.
 * As quebras de linha são fixas para a frase não reorganizar enquanto entra.
 */
export type PalavraDoGancho = {texto: string; em: number; destaque?: boolean};

export const gancho: PalavraDoGancho[][] = [
	[
		{texto: 'E', em: 0},
		{texto: 'se', em: 0},
		{texto: 'o', em: 5},
		{texto: 'seu', em: 9},
	],
	[{texto: 'cliente', em: 14}],
	[{texto: 'pagasse', em: 23}],
	[{texto: 'ANTES', em: 33, destaque: true}],
	[
		{texto: 'de', em: 44},
		{texto: 'levar', em: 49},
		{texto: 'o', em: 56},
	],
	[{texto: 'produto?', em: 60}],
];

/**
 * Legendas queimadas. `destaque` é o trecho do texto que sai em terracota.
 *
 * O gancho e o CTA não têm legenda: a frase falada já está na tela em letra
 * grande, e repetir embaixo cobriria a área do botão e da seta.
 */
export type Legenda = {
	cena: NomeDaCena;
	de: number;
	ate: number;
	texto: string;
	destaque: string;
};

export const legendas: Legenda[] = [
	{cena: 'dor', de: 2, ate: 46, texto: 'Vender parcelado hoje', destaque: 'parcelado'},
	{cena: 'dor', de: 46, ate: 92, texto: 'é correr atrás de atraso,', destaque: 'atraso'},
	{cena: 'dor', de: 92, ate: 150, texto: 'cobrar no braço e torcer pra receber.', destaque: 'cobrar no braço'},

	{cena: 'virada', de: 4, ate: 40, texto: 'Com a AVLE,', destaque: 'AVLE'},
	{cena: 'virada', de: 40, ate: 90, texto: 'sua loja monta um clube de compras.', destaque: 'clube de compras'},

	{cena: 'comoFunciona', de: 3, ate: 52, texto: 'A cliente entra num grupo', destaque: 'grupo'},
	{cena: 'comoFunciona', de: 52, ate: 104, texto: 'e paga uma parcela fixa por mês.', destaque: 'parcela fixa'},
	{cena: 'comoFunciona', de: 106, ate: 166, texto: 'A gente cobra pelo WhatsApp.', destaque: 'WhatsApp'},
	{cena: 'comoFunciona', de: 168, ate: 218, texto: 'Todo mês tem sorteio auditável', destaque: 'sorteio auditável'},
	{cena: 'comoFunciona', de: 218, ate: 252, texto: 'pela Loteria Federal,', destaque: 'Loteria Federal'},
	{cena: 'comoFunciona', de: 252, ate: 300, texto: 'e quem é contemplada retira o produto na sua loja.', destaque: 'retira o produto'},

	{cena: 'beneficio', de: 3, ate: 60, texto: 'Dinheiro entrando todo mês,', destaque: 'todo mês'},
	{cena: 'beneficio', de: 60, ate: 120, texto: 'direto na conta da sua loja.', destaque: 'direto na conta'},
];

export const inicioGlobal = (legenda: Legenda) => cenas[legenda.cena].inicio + legenda.de;
export const fimGlobal = (legenda: Legenda) => cenas[legenda.cena].inicio + legenda.ate;
