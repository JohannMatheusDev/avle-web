import type { Metadata } from 'next';
import Link from 'next/link';
import { Icone } from './dashboard/components/Casca';

/**
 * A página comercial da AVLE, para lojas.
 *
 * Esta rota era a tela de login, que passou para /entrar. A troca é
 * deliberada: quem digita o endereço da AVLE é lojista — a cliente da loja
 * nunca chega por aqui, ela entra pelo link de convite que a loja manda, e
 * esse caminho continua intacto.
 *
 * O desenho segue a referência que o Johann escolheu (Gravity Off, de Victoria
 * Kovtun): título em caixa alta ocupando a largura inteira, fundo saturado, um
 * elemento recortado passando na FRENTE das letras, e a página clara subindo
 * por baixo com cantos muito arredondados. O que muda é a matéria-prima: o
 * verde da marca no lugar do azul, e a árvore da AVLE no lugar do cavalo.
 *
 * Os preços estão como espaço reservado até a decisão comercial sair, todos
 * em PLANOS logo abaixo.
 */

export const metadata: Metadata = {
  title: 'AVLE · O clube de compras da sua loja',
  description:
    'A AVLE monta e opera o clube de compras programadas da sua loja: cobrança mensal automática, '
    + 'sorteio auditável e painel para você e para as suas clientes.',
};

/** Um lugar só para os números mudarem quando o comercial fechar o preço. */
const PLANOS = [
  {
    nome: 'Essencial',
    resumo: 'Para a loja que está montando o primeiro clube.',
    preco: 'R$ —',
    destaque: false,
    inclui: [
      'Até 3 grupos ativos',
      'Clientes ilimitadas',
      'Cobrança mensal automática',
      'Painel da loja e painel da cliente',
      'Sorteio auditável pela Loteria Federal',
    ],
  },
  {
    nome: 'Completo',
    resumo: 'Para quem já roda vários grupos ao mesmo tempo.',
    preco: 'R$ —',
    destaque: true,
    inclui: [
      'Grupos ilimitados',
      'Clientes ilimitadas',
      'Tudo do Essencial',
      'Fila de espera e aprovações',
      'Relatórios de faturamento e de carteira',
      'Atendimento prioritário',
    ],
  },
];

const COMO_FUNCIONA = [
  {
    titulo: 'Você cria o grupo',
    texto: 'Define o valor da parcela, a duração e quantas cotas o grupo tem. Leva um minuto.',
    icone: 'grupos' as const,
  },
  {
    titulo: 'Convida as suas clientes',
    texto: 'Um link com a marca da sua loja. Para a cliente, o clube é seu — ela se cadastra sozinha.',
    icone: 'clientes' as const,
  },
  {
    titulo: 'O sistema cobra todo mês',
    texto: 'A parcela sai sozinha no quinto dia útil, em Pix, boleto ou cartão. Você não cobra ninguém no dedo.',
    icone: 'cobranca' as const,
  },
  {
    titulo: 'O sorteio acontece',
    texto: 'Dia 10, pela Loteria Federal, com código que qualquer cliente confere por fora do sistema.',
    icone: 'sorteios' as const,
  },
];

const RECURSOS = [
  {
    titulo: 'O dinheiro cai dividido',
    texto: 'De cada parcela paga, a sua parte entra direto na sua conta. Sem repasse manual, sem esperar fechamento.',
    icone: 'financeiro' as const,
  },
  {
    titulo: 'Quem pagou e quem não pagou',
    texto: 'Quanto entrou no mês, quantas cotas estão preenchidas, quem está em atraso e quem saiu da carteira.',
    icone: 'inicio' as const,
  },
  {
    titulo: 'A sua cliente resolve sozinha',
    texto: 'Ela abre o painel no celular, vê o plano e paga pelo Pix na hora. Sua loja para de ser central de dúvida de saldo.',
    icone: 'planos' as const,
  },
  {
    titulo: 'Sorteio que ninguém questiona',
    texto: 'A contemplação sai de um número público da Loteria Federal, depois de a lista ser fechada.',
    icone: 'aprovacoes' as const,
  },
  {
    titulo: 'Fila de espera',
    texto: 'Grupo cheio não perde cliente: ela entra na fila e você chama quando abrir vaga.',
    icone: 'fila' as const,
  },
  {
    titulo: 'Histórico de tudo',
    texto: 'Cada pagamento, cada sorteio e cada entrega ficam registrados. Se alguém perguntar, você mostra.',
    icone: 'historico' as const,
  },
];

const PERGUNTAS = [
  {
    pergunta: 'Isso é um consórcio?',
    resposta:
      'Não. A AVLE é uma comunidade de compras programadas: as clientes pagam parcelas mensais para '
      + 'adquirir produtos da sua loja, e a contemplação é sorteada por um número público. Não somos '
      + 'consórcio nem fundo financeiro, e o regulamento que a sua cliente aceita deixa isso escrito.',
  },
  {
    pergunta: 'Como as minhas clientes pagam?',
    resposta:
      'Pix, boleto ou cartão, direto pelo painel delas. A cobrança de cada mês é emitida automaticamente '
      + 'no quinto dia útil, e quem entra no meio do mês já recebe a primeira parcela na hora.',
  },
  {
    pergunta: 'Preciso entender de tecnologia?',
    resposta:
      'Não. Você cria o grupo, manda o link para as suas clientes e acompanha pelo painel. O resto é o '
      + 'sistema que faz.',
  },
  {
    pergunta: 'E se eu não gostar no primeiro mês?',
    resposta:
      'O primeiro mês é grátis justamente para isso. É o tempo de um ciclo completo: você vê a cobrança '
      + 'sair, o dinheiro entrar e o sorteio acontecer antes de decidir.',
  },
];

export default function PaginaComercial() {
  return (
    <div className="bg-[#F7F4EB] text-[#0B1E14]">

      {/* ══ CARTAZ ══
          Título em caixa alta ocupando a largura da tela, a árvore recortada
          passando na frente das letras, e as informações miúdas nas laterais,
          como na referência. */}
      <section className="ceu-avle relative text-white overflow-hidden pb-44 sm:pb-60">

        <nav className="relative z-30 max-w-[1500px] mx-auto px-5 sm:px-8 h-20 flex items-center justify-between gap-4">
          <span className="font-black tracking-tight text-2xl">AVLE</span>

          <div className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-white/70">
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <a href="#perguntas" className="hover:text-white transition-colors">Dúvidas</a>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/entrar" className="px-4 py-2.5 text-[13px] font-bold text-white/80 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link
              href="#planos"
              className="px-5 py-2.5 rounded-full bg-[#F7F4EB] text-[#0B1E14] text-[13px] font-black hover:scale-[1.03] transition-transform"
            >
              Começar
            </Link>
          </div>
        </nav>

        <div className="relative max-w-[1500px] mx-auto px-5 sm:px-8 pt-8 sm:pt-12">
          {/* O título fica atrás; a árvore, na frente. */}
          <h1 className="titulo-cartaz relative z-10 text-[clamp(3.4rem,15vw,13rem)] max-w-[72%]">
            <span className="block">Seu clube</span>
            <span className="block text-[#E08C55]">de compras</span>
          </h1>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/arvore-clara.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none absolute z-20 right-0 translate-x-[10%] top-[16%] w-[36vw] max-w-[480px] opacity-95 drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)] hidden sm:block"
          />

          <div className="relative z-30 grid sm:grid-cols-2 gap-8 mt-8 sm:mt-12">
            <div className="max-w-xs">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#E08C55]">O que é</span>
              <p className="text-[13px] text-white/70 leading-relaxed mt-2">
                A sua loja passa a ter um clube de compras programadas: a cliente paga uma parcela por
                mês, concorre ao sorteio e leva o produto na sua loja.
              </p>
            </div>
            <div className="max-w-xs sm:ml-auto sm:text-right">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#E08C55]">Para quem</span>
              <p className="text-[13px] text-white/70 leading-relaxed mt-2">
                Para a loja que vende uma vez e espera a próxima visita. Aqui a cliente volta todo mês,
                por doze meses, e você não cobra ninguém por mensagem.
              </p>
            </div>
          </div>

          <div className="relative z-30 flex flex-col items-center gap-5 mt-14 sm:mt-20">
            <Link
              href="#planos"
              className="px-9 py-4 rounded-full bg-[#E08C55] text-[#0B1E14] text-sm font-black shadow-[0_18px_40px_-18px_rgba(224,140,85,0.9)] hover:scale-[1.04] transition-transform"
            >
              Primeiro mês grátis
            </Link>
            <a href="#como-funciona" className="flex flex-col items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white/80 transition-colors">
              Ver como funciona
              <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-base">↓</span>
            </a>
          </div>
        </div>
      </section>

      {/* ══ A PÁGINA CLARA SOBE POR CIMA DO CÉU ══ */}
      <div className="bg-[#F7F4EB] rounded-t-[2.5rem] sm:rounded-t-[4rem] -mt-28 sm:-mt-40 relative z-30">

        {/* ── Esteira ── */}
        <div className="py-6 overflow-hidden border-b border-[#E8E4DA]">
          <div className="esteira flex w-max gap-8 whitespace-nowrap">
            {[0, 1].map((volta) => (
              <div key={volta} className="flex items-center gap-8" aria-hidden={volta === 1}>
                {['Cobrança automática', 'Sorteio auditável', 'Pix e cartão', 'Painel da cliente',
                  'Fila de espera', 'Sem planilha', 'Receita recorrente'].map((palavra) => (
                  <span key={palavra} className="titulo-cartaz text-3xl sm:text-5xl text-[#0B1E14]/10 flex items-center gap-8">
                    {palavra}
                    <span className="text-[#E08C55]/40">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── A frase, com as palavras que importam em cor ── */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Por que existe</span>
          <p className="text-[clamp(1.6rem,4.4vw,3.1rem)] font-black leading-[1.12] tracking-tight mt-5">
            Cliente fiel não se conquista com desconto —{' '}
            <span className="text-[#BD6B42]">se conquista com motivo para voltar.</span>{' '}
            Um plano de doze meses são doze visitas de alguém que já decidiu comprar com você.
          </p>
        </section>

        {/* ── Como funciona ── */}
        <section id="como-funciona" className="max-w-[1500px] mx-auto px-5 sm:px-8 py-16">
          <h2 className="titulo-cartaz text-[clamp(2.6rem,9vw,7rem)]">Como funciona</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {COMO_FUNCIONA.map((passo, indice) => (
              <div key={passo.titulo} className="bg-white rounded-3xl p-7 flex flex-col">
                <div className="flex items-start justify-between">
                  <span className="w-11 h-11 rounded-2xl bg-[#0B1E14] text-white flex items-center justify-center">
                    <Icone nome={passo.icone} className="w-5 h-5" />
                  </span>
                  <span className="titulo-cartaz text-5xl text-[#0B1E14]/10">
                    {String(indice + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight mt-6">{passo.titulo}</h3>
                <p className="text-[13px] text-stone-500 leading-relaxed mt-2">{passo.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── O número que vende sozinho ── */}
        <section className="max-w-[1500px] mx-auto px-5 sm:px-8 py-10">
          <div className="bg-[#0B1E14] text-white rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-14 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="titulo-cartaz text-[clamp(5rem,18vw,13rem)] text-[#E08C55] block">90%</span>
              <p className="text-xl font-bold tracking-tight mt-1">
                de cada parcela cai direto na conta da sua loja.
              </p>
            </div>
            <p className="text-sm text-white/60 leading-relaxed lg:border-l lg:border-white/15 lg:pl-10">
              O pagamento da sua cliente é dividido no momento em que entra: a parte da loja vai para a
              sua conta e a nossa fica com a gente. Não existe repasse manual, não existe esperar
              fechamento do mês, e não existe dinheiro da loja parado numa conta nossa.
            </p>
          </div>
        </section>

        {/* ── Recursos ── */}
        <section id="recursos" className="max-w-[1500px] mx-auto px-5 sm:px-8 py-16">
          <h2 className="titulo-cartaz text-[clamp(2.6rem,9vw,7rem)]">O que você recebe</h2>
          <p className="text-sm text-stone-500 mt-4 max-w-md">
            Tudo isto já está no ar, em uso por lojas que operam hoje.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {RECURSOS.map((recurso) => (
              <div key={recurso.titulo} className="bg-white rounded-3xl p-7">
                <span className="w-11 h-11 rounded-2xl bg-[#F5F2EB] text-[#BD6B42] flex items-center justify-center">
                  <Icone nome={recurso.icone} className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-black tracking-tight mt-6">{recurso.titulo}</h3>
                <p className="text-[13px] text-stone-500 leading-relaxed mt-2">{recurso.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Planos ── */}
        <section id="planos" className="max-w-[1500px] mx-auto px-5 sm:px-8 py-16">
          <h2 className="titulo-cartaz text-[clamp(2.6rem,9vw,7rem)]">Planos</h2>
          <p className="text-sm text-stone-500 mt-4 max-w-lg">
            O primeiro mês é grátis nos dois — o tempo de um ciclo completo, com cobrança e sorteio
            acontecendo de verdade.
          </p>

          <div className="grid md:grid-cols-2 gap-5 mt-10 max-w-4xl">
            {PLANOS.map((plano) => (
              <div
                key={plano.nome}
                className={`rounded-[2rem] p-8 flex flex-col ${
                  plano.destaque ? 'bg-[#0B1E14] text-white' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-black tracking-tight">{plano.nome}</h3>
                  {plano.destaque && (
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] bg-[#E08C55] text-[#0B1E14] px-3 py-1.5 rounded-full">
                      Completo
                    </span>
                  )}
                </div>
                <p className={`text-[13px] mt-2 ${plano.destaque ? 'text-white/60' : 'text-stone-500'}`}>
                  {plano.resumo}
                </p>

                <div className="mt-8 flex items-end gap-2">
                  <span className="titulo-cartaz text-[clamp(3rem,8vw,5rem)]">{plano.preco}</span>
                  <span className={`text-sm font-bold mb-3 ${plano.destaque ? 'text-white/50' : 'text-stone-400'}`}>/mês</span>
                </div>

                <ul className={`space-y-3 mt-6 flex-1 ${plano.destaque ? 'text-white/80' : 'text-stone-600'}`}>
                  {plano.inclui.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[13px] leading-relaxed">
                      <span className={`mt-0.5 flex-shrink-0 ${plano.destaque ? 'text-[#E08C55]' : 'text-emerald-600'}`}>
                        <Icone nome="aprovacoes" className="w-4 h-4" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/entrar"
                  className={`mt-8 py-4 rounded-full text-center text-sm font-black transition-transform hover:scale-[1.02] ${
                    plano.destaque ? 'bg-[#E08C55] text-[#0B1E14]' : 'bg-[#0B1E14] text-white'
                  }`}
                >
                  Começar o mês grátis
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── Perguntas ── */}
        <section id="perguntas" className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
          <h2 className="titulo-cartaz text-[clamp(2.6rem,9vw,7rem)]">Dúvidas</h2>

          <div className="mt-10 space-y-3">
            {PERGUNTAS.map((item) => (
              <details key={item.pergunta} className="bg-white rounded-3xl p-6 group">
                <summary className="text-[15px] font-black tracking-tight cursor-pointer list-none flex items-center justify-between gap-4">
                  {item.pergunta}
                  <span className="text-[#E08C55] group-open:rotate-45 transition-transform text-2xl leading-none font-normal">+</span>
                </summary>
                <p className="text-[13px] text-stone-500 leading-relaxed mt-4">{item.resposta}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* ══ FECHAMENTO ══ */}
      <section className="ceu-avle text-white rounded-t-[2.5rem] sm:rounded-t-[4rem] pt-20 sm:pt-28">
        <div className="max-w-[1500px] mx-auto px-5 sm:px-8 text-center">
          <h2 className="titulo-cartaz text-[clamp(2.8rem,11vw,9rem)]">
            Comece
            <br />
            <span className="text-[#E08C55]">com um grupo</span>
          </h2>
          <p className="text-sm text-white/60 leading-relaxed mt-8 max-w-md mx-auto">
            Sem contrato de fidelidade para experimentar. Se no fim do primeiro mês não fizer sentido,
            é só não continuar.
          </p>
          <Link
            href="/entrar"
            className="inline-block mt-9 px-10 py-4 rounded-full bg-[#F7F4EB] text-[#0B1E14] text-sm font-black hover:scale-[1.04] transition-transform"
          >
            Criar o meu clube
          </Link>
        </div>

        <footer className="max-w-[1500px] mx-auto px-5 sm:px-8 mt-20 py-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-white/40">AVLE · Seu clube de compras planejado</span>
          <div className="flex items-center gap-6 text-xs text-white/40">
            <Link href="/entrar" className="hover:text-white transition-colors">Já sou cliente</Link>
            <a href="mailto:contato@avle.com.br" className="hover:text-white transition-colors">contato@avle.com.br</a>
          </div>
        </footer>
      </section>
    </div>
  );
}
