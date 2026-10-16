import {staticFile} from 'remotion';

/**
 * Cores e artes da AVLE para o vídeo.
 *
 * Os valores vêm do DESIGN.md da raiz do app. O Remotion é um projeto à parte
 * e não enxerga as variáveis CSS do `.avle-ds`, então os tons são repetidos
 * aqui, mas com nome de papel (fundo, destaque, texto), como o DESIGN.md pede:
 * se a paleta mudar, troca-se o valor e as cenas acompanham.
 */
export const cor = {
	/** Verde-tinta: fundo forte do gancho e do CTA. */
	fundoForte: '#0B1E14',
	/** Verde da marca: fundo forte da dor, para não emendar com o gancho. */
	fundoMarca: '#1C3F24',
	/** Papel: fundo claro das cenas de produto. */
	papel: '#F5F2EB',
	/** Bege: superfície elevada sobre o papel e texto claro sobre o verde. */
	bege: '#F7F4EB',
	areia: '#EFEAE1',
	borda: '#E8E4DA',
	cartao: '#FFFFFF',
	texto: '#2C2A29',
	textoSecundario: 'oklch(55.3% 0.013 58.071)',
	textoTerciario: 'oklch(70.9% 0.01 56.259)',
	/** Terracota: destaque e CTA. Usada com parcimônia. */
	destaque: '#BD6B42',
	destaqueEscuro: '#A95A33',
	destaqueSuave: 'rgba(189,107,66,.12)',
	positivo: 'oklch(50.8% 0.118 165.612)',
	positivoSuave: 'oklch(97.9% 0.021 166.113)',
	/** O "rosa" do X dos cartões da dor: o rose-600 do DESIGN.md. */
	negativo: 'oklch(58.6% 0.253 17.585)',
	negativoSuave: 'oklch(96.9% 0.015 12.422)',
} as const;

/** Sombra do cartão do DESIGN.md: tingida de verde-tinta, nunca preta. */
export const sombraDoCartao =
	'0 0 0 1px rgba(11,30,20,.05),0 1px 2px rgba(11,30,20,.04),0 22px 44px -34px rgba(11,30,20,.55)';

/** Hachura diagonal do DESIGN.md, para o que falta numa barra de progresso. */
export const hachura =
	'repeating-linear-gradient(135deg,rgba(11,30,20,.14) 0 2px,transparent 2px 7px)';

type Arte = {src: string; largura: number; altura: number};

/**
 * As artes copiadas de `design-system/assets/`. A medida é a do PNG: as cenas
 * calculam a altura pela proporção para nunca deformar a marca.
 */
export const artes = {
	logoCreme: {src: staticFile('avle/avle-logo-cream.png'), largura: 1296, altura: 984},
	logoFloresta: {src: staticFile('avle/avle-logo-forest.png'), largura: 1296, altura: 984},
	arvoreCreme: {src: staticFile('avle/avle-tree-cream.png'), largura: 972, altura: 576},
	arvoreFloresta: {src: staticFile('avle/avle-tree-forest.png'), largura: 972, altura: 576},
	marcaCreme: {src: staticFile('avle/avle-wordmark-cream.png'), largura: 640, altura: 200},
	marcaFloresta: {src: staticFile('avle/avle-wordmark-forest.png'), largura: 640, altura: 200},
} satisfies Record<string, Arte>;

export const alturaPara = (arte: Arte, largura: number) =>
	(largura * arte.altura) / arte.largura;

/** O perfil que o CTA manda seguir. Troque aqui e a capa e o fim acompanham. */
export const PERFIL = '@avle';
