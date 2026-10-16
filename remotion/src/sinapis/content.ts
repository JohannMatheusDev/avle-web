/**
 * Every audience-facing string in the video. Line breaks are authored here so
 * copy can be revised without opening animation code.
 */
export const content = {
	scene1: {
		headlineDark: 'Seu negócio cresceu.',
		headlineBlue: 'E os processos?',
	},

	blocks: {
		pedidos: 'Pedidos',
		planilhas: 'Planilhas',
		mensagens: 'Mensagens',
	},

	scene2: {
		// "Informação espalhada." is the only line in the script too wide for the
		// safe column at headline size, so it is set over two lines.
		headline: ['Informação', 'espalhada.', 'Trabalho repetido.'],
	},

	scene3: {
		headline: ['E se tudo', 'fizesse mais sentido?'],
	},

	scene4: {
		valueLead: 'Software sob medida',
		valueTail: 'para a realidade do seu negócio.',
	},

	scene5: {
		headline: ['Como uma ideia', 'vira solução?'],
		pillars: ['Bastidores.', 'Decisões.', 'Na prática.'],
		invitation: 'Acompanhe a Sinapis Dev.',
	},

	scene6: {
		kicker: ['Tecnologia faz mais sentido', 'quando resolve algo real.'],
		cta: ['Entre no perfil e siga', 'a Sinapis Dev.'],
		support: ['Veja como transformamos', 'ideias em soluções.'],
	},

	cover: {
		headlineDark: 'Seu negócio cresceu.',
		headlineBlue: 'E os processos?',
	},
} as const;
