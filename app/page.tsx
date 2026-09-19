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
 * O visual é o mesmo dos painéis de propósito. A loja vê a página, contrata e
 * entra no sistema; se a página e o produto tivessem caras diferentes, a
 * primeira impressão de seriedade morreria no primeiro clique depois da venda.
 *
 * Os preços estão como espaço reservado até a decisão comercial sair. Estão
 * todos em PLANOS, logo abaixo, num lugar só.
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
    resumo: 'Para a loja que está começando o primeiro clube.',
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
    texto: 'A parcela é emitida sozinha no quinto dia útil, em Pix, boleto ou cartão. Você não cobra ninguém no dedo.',
    icone: 'cobranca' as const,
  },
  {
    titulo: 'O sorteio acontece',
    texto: 'Dia 10, pela Loteria Federal, com código que qualquer cliente pode conferir por fora do sistema.',
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
    titulo: 'Você vê quem pagou e quem não pagou',
    texto: 'Quanto entrou no mês, quantas cotas estão preenchidas, quem está em atraso e quem saiu da carteira.',
    icone: 'inicio' as const,
  },
  {
    titulo: 'A sua cliente resolve sozinha',
    texto: 'Ela abre o painel no celular, vê o próprio plano e paga a parcela pelo Pix na hora. Sua loja para de ser central de dúvida de saldo.',
    icone: 'planos' as const,
  },
  {
    titulo: 'Sorteio que ninguém questiona',
    texto: 'A contemplação sai de um número público da Loteria Federal, depois de a lista ser fechada. Qualquer pessoa refaz a conta.',
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
    <div className="fundo-painel min-h-screen text-[#0B1E14]">

      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b border-white">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#0B1E14] text-white flex items-center justify-center font-serif font-bold text-sm">A</span>
            <span className="fonte-display font-bold tracking-wide text-xl">AVLE</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/entrar"
              className="px-4 py-2.5 rounded-full text-xs font-bold text-stone-600 hover:text-[#0B1E14] transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="#planos"
              className="px-4 py-2.5 rounded-full text-xs font-bold bg-[#0B1E14] text-white shadow-sm hover:brightness-125 transition-all"
            >
              Começar o teste
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ── Abertura ──
            O titulo e o elemento grafico da pagina, nao um rotulo em cima do
            conteudo: ocupa a tela inteira e a arvore da marca entra atras
            dele, em escala grande. A composicao e assimetrica de proposito -
            landing de sistema costuma empilhar blocos centralizados iguais, e
            era disso que a referencia fugia. */}
        <section className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/arvore-escura.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none absolute -right-24 -top-20 w-[46rem] max-w-none opacity-[0.07] hidden md:block"
          />

          <div className="max-w-6xl mx-auto px-5 pt-16 pb-10 sm:pt-24 relative">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#BD6B42] bg-white rounded-full px-3.5 py-1.5 shadow-[0_1px_2px_rgba(11,30,20,0.06)]">
              Primeiro mês grátis
            </span>

            <h1 className="fonte-display font-bold mt-7 leading-[0.86] text-[clamp(3rem,11vw,9rem)]">
              O clube
              <br />
              <span className="text-[#BD6B42] italic">de compras</span>
              <br />
              da sua loja.
            </h1>

            <div className="grid lg:grid-cols-12 gap-8 mt-10 items-end">
              <p className="lg:col-span-4 text-base text-stone-600 leading-relaxed">
                A sua cliente paga uma parcela por mês, concorre ao sorteio e volta à sua loja o ano
                inteiro. A AVLE cuida da cobrança, do sorteio e do painel — você cuida da venda.
              </p>

              <div className="lg:col-span-4 flex flex-wrap items-center gap-3">
                <Link
                  href="#planos"
                  className="px-6 py-3.5 rounded-full bg-[#0B1E14] text-white text-sm font-bold shadow-md hover:brightness-125 transition-all"
                >
                  Testar um mês grátis
                </Link>
                <Link
                  href="#como-funciona"
                  className="px-6 py-3.5 rounded-full bg-white text-[#0B1E14] text-sm font-bold shadow-[0_1px_2px_rgba(11,30,20,0.06)] hover:shadow-md transition-all"
                >
                  Como funciona
                </Link>
              </div>

              {/* O painel entra inclinado e sobreposto: e a prova de que o
                  produto existe, e a inclinacao tira a pagina do prumo certinho. */}
              <div className="lg:col-span-4 lg:-mb-16 lg:rotate-[-3deg]">
                <div className="cartao-avle-destaque p-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Recebido este mês</span>
                  <span className="block text-[26px] font-bold font-mono mt-3 tracking-tight whitespace-nowrap">R$ 12.480,00</span>
                  <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-[10px] font-bold px-2.5 py-1 rounded-full mt-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    38 parcelas pagas
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Esteira ── */}
          <div className="mt-20 py-5 bg-[#0B1E14] text-white overflow-hidden">
            <div className="esteira flex w-max gap-10 whitespace-nowrap">
              {[0, 1].map((volta) => (
                <div key={volta} className="flex items-center gap-10" aria-hidden={volta === 1}>
                  {['Cobrança automática', 'Sorteio auditável', 'Pix e cartão', 'Painel da cliente',
                    'Fila de espera', 'Sem planilha', 'Receita recorrente'].map((palavra) => (
                    <span key={palavra} className="fonte-display text-2xl sm:text-3xl text-white/90 flex items-center gap-10">
                      {palavra}
                      <span className="text-[#BD6B42]">✦</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Como funciona ── */}
        <section id="como-funciona" className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="fonte-display text-[clamp(2.2rem,6vw,4.5rem)] font-bold leading-[0.95]">Como funciona</h2>
          <p className="text-sm text-stone-500 mt-2 max-w-xl">
            Do primeiro grupo ao primeiro sorteio, sem planilha e sem cobrar ninguém por mensagem.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {COMO_FUNCIONA.map((passo, indice) => (
              <div key={passo.titulo} className="cartao-avle p-6 flex flex-col">
                <span className="w-10 h-10 rounded-2xl bg-[#F5F2EB] text-[#BD6B42] flex items-center justify-center">
                  <Icone nome={passo.icone} className="w-5 h-5" />
                </span>
                <span className="fonte-display text-5xl text-stone-200 leading-none mt-5 block">
                  {String(indice + 1).padStart(2, '0')}
                </span>
                <h3 className="text-base font-bold mt-2">{passo.titulo}</h3>
                <p className="text-xs text-stone-500 leading-relaxed mt-2">{passo.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── O que a loja recebe ── */}
        <section className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="fonte-display text-[clamp(2.2rem,6vw,4.5rem)] font-bold leading-[0.95]">O que a sua<br />loja recebe</h2>
          <p className="text-sm text-stone-500 mt-2 max-w-xl">
            Tudo isto já está no ar, em uso por lojas que operam hoje.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {RECURSOS.map((recurso) => (
              <div key={recurso.titulo} className="cartao-avle p-6">
                <span className="w-10 h-10 rounded-2xl bg-[#F5F2EB] text-[#BD6B42] flex items-center justify-center">
                  <Icone nome={recurso.icone} className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold mt-5">{recurso.titulo}</h3>
                <p className="text-xs text-stone-500 leading-relaxed mt-2">{recurso.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── A razão de existir, dita de uma vez ── */}
        <section className="max-w-6xl mx-auto px-5 py-10">
          <div className="cartao-avle-destaque p-8 sm:p-12">
            <h2 className="fonte-display text-[clamp(2rem,5vw,3.8rem)] font-bold max-w-3xl leading-[1.02]">
              Cada parcela é uma volta da sua cliente na loja.
            </h2>
            <p className="text-sm text-white/70 leading-relaxed mt-4 max-w-2xl">
              Um plano de doze meses são doze contatos com alguém que já decidiu comprar com você.
              É por isso que o clube não é um sistema de cobrança: é um jeito de ter receita
              recorrente num negócio que normalmente vende uma vez e espera a próxima visita.
            </p>
          </div>
        </section>

        {/* ── Planos ── */}
        <section id="planos" className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="fonte-display text-[clamp(2.2rem,6vw,4.5rem)] font-bold leading-[0.95]">Planos</h2>
          <p className="text-sm text-stone-500 mt-2 max-w-xl">
            O primeiro mês é grátis nos dois planos — o tempo de um ciclo completo, com cobrança e
            sorteio acontecendo de verdade.
          </p>

          <div className="grid md:grid-cols-2 gap-5 mt-8 max-w-4xl">
            {PLANOS.map((plano) => (
              <div
                key={plano.nome}
                className={`${plano.destaque ? 'cartao-avle-destaque' : 'cartao-avle'} p-7 flex flex-col`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold">{plano.nome}</h3>
                  {plano.destaque && (
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white/80 px-2.5 py-1 rounded-full">
                      Mais completo
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1.5 ${plano.destaque ? 'text-white/60' : 'text-stone-500'}`}>
                  {plano.resumo}
                </p>

                <div className="mt-6">
                  <span className="fonte-display text-5xl font-bold tracking-tight">{plano.preco}</span>
                  <span className={`text-xs ml-1 ${plano.destaque ? 'text-white/60' : 'text-stone-400'}`}>/mês</span>
                </div>

                <ul className={`space-y-2.5 mt-6 flex-1 ${plano.destaque ? 'text-white/80' : 'text-stone-600'}`}>
                  {plano.inclui.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-xs leading-relaxed">
                      <span className={`mt-0.5 flex-shrink-0 ${plano.destaque ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        <Icone nome="aprovacoes" className="w-4 h-4" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/entrar"
                  className={`mt-7 py-3.5 rounded-full text-center text-sm font-bold transition-all ${
                    plano.destaque
                      ? 'bg-white text-[#0B1E14] hover:shadow-lg'
                      : 'bg-[#0B1E14] text-white hover:brightness-125'
                  }`}
                >
                  Começar o mês grátis
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── Perguntas ── */}
        <section className="max-w-3xl mx-auto px-5 py-16">
          <h2 className="fonte-display text-[clamp(2.2rem,6vw,4.5rem)] font-bold leading-[0.95]">Perguntas<br />frequentes</h2>

          <div className="mt-8 space-y-3">
            {PERGUNTAS.map((item) => (
              <details key={item.pergunta} className="cartao-avle p-5 group">
                <summary className="text-sm font-bold cursor-pointer list-none flex items-center justify-between gap-4">
                  {item.pergunta}
                  <span className="text-stone-300 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                </summary>
                <p className="text-xs text-stone-500 leading-relaxed mt-3">{item.resposta}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Chamada final ── */}
        <section className="max-w-6xl mx-auto px-5 pb-20">
          <div className="cartao-avle p-8 sm:p-12 text-center">
            <h2 className="fonte-display text-[clamp(2rem,5.5vw,4rem)] font-bold leading-[1.02] max-w-3xl mx-auto">
              Comece com um grupo.<br />Veja um mês inteiro acontecer.
            </h2>
            <p className="text-sm text-stone-500 mt-3 max-w-lg mx-auto leading-relaxed">
              Sem contrato de fidelidade para experimentar. Se no fim do primeiro mês não fizer
              sentido, é só não continuar.
            </p>
            <Link
              href="#planos"
              className="inline-block mt-7 px-7 py-3.5 rounded-full bg-[#BD6B42] text-white text-sm font-bold shadow-md hover:bg-[#A95A33] transition-all"
            >
              Começar o meu clube
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E8E4DA]">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#0B1E14] text-white flex items-center justify-center font-serif font-bold text-xs">A</span>
            <span className="text-xs text-stone-500">
              AVLE · Seu clube de compras planejado
            </span>
          </div>
          <div className="flex items-center gap-5 text-xs text-stone-500">
            <Link href="/entrar" className="hover:text-[#0B1E14] transition-colors">Já sou cliente</Link>
            <a href="mailto:contato@avle.com.br" className="hover:text-[#0B1E14] transition-colors">contato@avle.com.br</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
