'use client';

/**
 * Casca visual dos três painéis (loja, cliente e admin).
 *
 * Existe porque os três dashboards repetiam à mão a mesma barra lateral verde
 * de 256px com os nomes das seções empilhados: 256px que nenhuma tabela podia
 * usar, em telas cujo conteúdo principal é justamente tabela larga. Pior, cada
 * painel tinha a sua cópia da navegação, então qualquer ajuste de aparência
 * precisava ser feito três vezes e sempre ficava diferente em um deles.
 *
 * Aqui a navegação virou um trilho estreito de ícones no desktop e uma barra
 * inferior no celular, com as seções repetidas como pílulas ao lado do título.
 * O ícone sozinho não diz o que é para quem nunca usou o sistema — por isso
 * todo item tem rótulo visível ao passar o mouse, `aria-label` e a pílula
 * correspondente escrita por extenso no topo do conteúdo.
 *
 * Nada aqui decide o que aparece na tela: quem monta as listas continua sendo
 * cada painel. Esta casca só recebe pronto e desenha.
 */

type NomeDeIcone =
  | 'inicio' | 'clientes' | 'aprovacoes' | 'fila' | 'grupos' | 'sorteios'
  | 'configuracoes' | 'historico' | 'regras' | 'ajuda' | 'perfil' | 'lojas'
  | 'financeiro' | 'cobranca' | 'planos' | 'sair'
  | 'link' | 'voltar' | 'seta' | 'calendario' | 'alerta' | 'relogio' | 'mais' | 'atualizar' | 'carteira';

export type ItemDeNavegacao = {
  id: string;
  rotulo: string;
  icone: NomeDeIcone;
  // Contador do próprio item (pendências à espera de alguém). Zero e nulo não
  // desenham nada: bolinha vazia treina a pessoa a ignorar a bolinha.
  contador?: number;
  urgente?: boolean;
};

const DESENHOS: Record<NomeDeIcone, React.ReactNode> = {
  inicio: <><path d="M3.5 10.8 12 3.5l8.5 7.3" /><path d="M5.8 9.6V20h12.4V9.6" /><path d="M10 20v-5h4v5" /></>,
  clientes: <><circle cx="9.2" cy="8.4" r="3.2" /><path d="M3.4 19.6c0-3.1 2.6-5.2 5.8-5.2s5.8 2.1 5.8 5.2" /><path d="M16.4 6.1a3 3 0 0 1 .6 5.9" /><path d="M17.6 14.8c2 .6 3.4 2.3 3.4 4.4" /></>,
  aprovacoes: <><circle cx="12" cy="12" r="8.4" /><path d="m8.3 12.2 2.6 2.6 4.8-5.4" /></>,
  fila: <><circle cx="12" cy="12" r="8.4" /><path d="M12 7.3V12l3.2 2" /></>,
  grupos: <><rect x="3.6" y="3.6" width="7" height="7" rx="2" /><rect x="13.4" y="3.6" width="7" height="7" rx="2" /><rect x="3.6" y="13.4" width="7" height="7" rx="2" /><rect x="13.4" y="13.4" width="7" height="7" rx="2" /></>,
  sorteios: <><rect x="3.4" y="8.6" width="17.2" height="11.8" rx="2" /><path d="M3.4 13.2h17.2M12 8.6v11.8" /><path d="M12 8.6c-2.6 0-4.4-.9-4.4-2.6S9 3.6 12 8.6zM12 8.6c2.6 0 4.4-.9 4.4-2.6S15 3.6 12 8.6z" /></>,
  configuracoes: <><circle cx="12" cy="12" r="3.1" /><path d="M12 3.4v2.3M12 18.3v2.3M20.6 12h-2.3M5.7 12H3.4M18.1 5.9l-1.6 1.6M7.5 16.5l-1.6 1.6M18.1 18.1l-1.6-1.6M7.5 7.5 5.9 5.9" /></>,
  historico: <><path d="M3.8 12a8.2 8.2 0 1 0 2.6-6" /><path d="M3.6 3.9v3.9h3.9" /><path d="M12 7.6V12l3 1.9" /></>,
  regras: <><path d="M6.6 3.6h7.2l4.2 4.2v12.6H6.6z" /><path d="M13.6 3.7v4.3h4.3" /><path d="M9.4 13h5.6M9.4 16.4h5.6" /></>,
  ajuda: <><path d="M4 6.4a2.4 2.4 0 0 1 2.4-2.4h11.2A2.4 2.4 0 0 1 20 6.4v8a2.4 2.4 0 0 1-2.4 2.4H9.6L4.8 20.4z" /><path d="M9.9 8.6a2.2 2.2 0 1 1 2.9 2.2c-.6.3-.9.8-.9 1.4" /><path d="M12 14.6h.01" /></>,
  perfil: <><circle cx="12" cy="8.2" r="3.6" /><path d="M4.8 20c0-3.6 3.2-6 7.2-6s7.2 2.4 7.2 6" /></>,
  lojas: <><path d="M4.2 9.4h15.6l-1.1-4.6a1.2 1.2 0 0 0-1.2-.9H6.5a1.2 1.2 0 0 0-1.2.9z" /><path d="M5.6 9.4V20h12.8V9.4" /><path d="M10 20v-5.4h4V20" /></>,
  financeiro: <><path d="M4 19.8h16" /><rect x="5" y="11.4" width="3.6" height="6" rx="1.2" /><rect x="10.2" y="7.4" width="3.6" height="10" rx="1.2" /><rect x="15.4" y="4.2" width="3.6" height="13.2" rx="1.2" /></>,
  cobranca: <><path d="M6 3.4h12v17.2l-3-1.9-3 1.9-3-1.9-3 1.9z" /><path d="M9.2 8.4h5.6M9.2 12.2h5.6" /></>,
  planos: <><rect x="3.4" y="5.6" width="17.2" height="12.8" rx="2.4" /><path d="M3.4 10h17.2" /><path d="M7 14.4h3.4" /></>,
  sair: <><path d="M14.6 4.4H5.4v15.2h9.2" /><path d="M10.8 12h9.4" /><path d="m17.2 8.8 3.4 3.2-3.4 3.2" /></>,
  link: <><path d="M10.2 13.8a3.8 3.8 0 0 0 5.4 0l3-3a3.8 3.8 0 0 0-5.4-5.4l-1 1" /><path d="M13.8 10.2a3.8 3.8 0 0 0-5.4 0l-3 3a3.8 3.8 0 0 0 5.4 5.4l1-1" /></>,
  voltar: <><path d="M19.4 12H4.8" /><path d="m10.6 6.2-5.8 5.8 5.8 5.8" /></>,
  seta: <><path d="M7 17 17 7" /><path d="M8.4 7H17v8.6" /></>,
  calendario: <><rect x="3.8" y="5.2" width="16.4" height="15" rx="2.6" /><path d="M3.8 10h16.4M8.4 3.4v3.4M15.6 3.4v3.4" /></>,
  alerta: <><circle cx="12" cy="12" r="8.4" /><path d="M12 7.8v4.9" /><path d="M12 16.2h.01" /></>,
  relogio: <><circle cx="12" cy="12" r="8.4" /><path d="M12 7.6V12l2.9 1.8" /></>,
  mais: <><path d="M12 5.4v13.2M5.4 12h13.2" /></>,
  atualizar: <><path d="M19.6 12a7.6 7.6 0 0 1-13.4 4.9" /><path d="M4.4 12a7.6 7.6 0 0 1 13.4-4.9" /><path d="M17.9 3.6v3.6h-3.6" /><path d="M6.1 20.4v-3.6h3.6" /></>,
  carteira: <><rect x="3.4" y="6" width="17.2" height="13" rx="2.6" /><path d="M3.4 10.2h17.2" /><path d="M15.8 14.6h1.6" /><path d="M6.6 6 15 3.6l1 2.4" /></>,
};

export function Icone({ nome, className = 'w-[18px] h-[18px]' }: { nome: NomeDeIcone; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {DESENHOS[nome]}
    </svg>
  );
}

function Contador({ valor, urgente }: { valor: number; urgente?: boolean }) {
  return (
    <span
      className={`absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-sm ${
        urgente ? 'bg-rose-600' : 'bg-[#BD6B42]'
      }`}
    >
      {valor > 99 ? '99+' : valor}
    </span>
  );
}

/**
 * Trilho de navegação. No desktop é uma coluna estreita que acompanha a
 * rolagem; no celular vira barra fixa no rodapé, que é onde o polegar alcança
 * — o painel da cliente é usado quase só no celular.
 */
export function TrilhoDeNavegacao({
  itens,
  ativo,
  aoEscolher,
  aoSair,
  itemDeConfiguracao,
  sigla = 'A',
  soCelular = false,
}: {
  itens: ItemDeNavegacao[];
  ativo: string;
  aoEscolher: (id: string) => void;
  aoSair: () => void;
  itemDeConfiguracao?: ItemDeNavegacao;
  sigla?: string;
  // Loja e admin navegam pela barra do topo no computador; o trilho fica so
  // com a barra do rodape, que continua sendo a navegacao no celular.
  soCelular?: boolean;
}) {
  const todos = itemDeConfiguracao ? [...itens, itemDeConfiguracao] : itens;

  // O rotulo sai do `title` do navegador e vira etiqueta propria.
  //
  // A barra de pilulas escrita por extenso saiu do topo do painel, entao o
  // trilho passou a ser o unico lugar onde a navegacao mora - e icone sozinho
  // nao diz para onde leva. O `title` nativo resolveria, mas demora quase um
  // segundo para surgir e aparece na cor do sistema, fora da pagina.
  //
  // A etiqueta fica em `group-hover` e tambem em `group-focus-visible`, senao
  // quem anda pelo teclado perde o rotulo que o mouse ganha. O `aria-label`
  // continua no botao: leitor de tela nao depende de hover.
  const botao = (item: ItemDeNavegacao, ativoAgora: boolean) => (
    <div key={item.id} className="relative group">
      <button
        type="button"
        onClick={() => aoEscolher(item.id)}
        aria-label={item.rotulo}
        aria-current={ativoAgora ? 'page' : undefined}
        data-tour={`secao-${item.id}`}
        className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
          ativoAgora
            ? 'bg-[#0B1E14] text-white shadow-md'
            : 'bg-white text-stone-400 hover:text-[#0B1E14] hover:-translate-y-0.5 shadow-[0_1px_2px_rgba(11,30,20,0.06)]'
        }`}
      >
        <Icone nome={item.icone} />
        {!!item.contador && item.contador > 0 && (
          <Contador valor={item.contador} urgente={item.urgente} />
        )}
      </button>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 flex items-center gap-2
                   whitespace-nowrap rounded-full bg-[#0B1E14] text-white text-[11px] font-bold tracking-wide
                   px-3.5 py-2 shadow-lg opacity-0 -translate-x-1 transition-all duration-200
                   group-hover:opacity-100 group-hover:translate-x-0
                   group-focus-within:opacity-100 group-focus-within:translate-x-0"
      >
        {item.rotulo}
        {!!item.contador && item.contador > 0 && (
          <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center ${
            item.urgente ? 'bg-rose-500 text-white' : 'bg-white/20 text-white'
          }`}>
            {item.contador > 99 ? '99+' : item.contador}
          </span>
        )}
      </span>
    </div>
  );

  return (
    <>
      {!soCelular && <aside data-tour="navegacao" className="hidden md:flex sticky top-0 h-screen w-[84px] flex-col items-center justify-between py-6 flex-shrink-0">
        <div className="flex flex-col items-center gap-2">
          <div className="w-11 h-11 rounded-2xl bg-[#0B1E14] text-white flex items-center justify-center font-serif font-bold text-base shadow-md mb-4">
            {sigla}
          </div>
          {itens.map((item) => botao(item, ativo === item.id))}
        </div>

        <div className="flex flex-col items-center gap-2">
          {itemDeConfiguracao && botao(itemDeConfiguracao, ativo === itemDeConfiguracao.id)}
          <div className="relative group">
            <button
              type="button"
              onClick={aoSair}
              aria-label="Sair"
              className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white text-stone-400 hover:text-rose-600 transition-colors cursor-pointer shadow-[0_1px_2px_rgba(11,30,20,0.06)]"
            >
              <Icone nome="sair" />
            </button>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
                         whitespace-nowrap rounded-full bg-[#0B1E14] text-white text-[11px] font-bold tracking-wide
                         px-3.5 py-2 shadow-lg opacity-0 -translate-x-1 transition-all duration-200
                         group-hover:opacity-100 group-hover:translate-x-0
                         group-focus-within:opacity-100 group-focus-within:translate-x-0"
            >
              Sair
            </span>
          </div>
        </div>
      </aside>}

      {/* Barra do celular. `pb-[env(safe-area-inset-bottom)]` evita que o
          último ícone fique embaixo da barra de gestos do iPhone, onde o toque
          não chega. */}
      <nav data-tour="navegacao" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[#E8E4DA] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around gap-1 px-2 py-2 overflow-x-auto">
          {todos.map((item) => {
            const ativoAgora = ativo === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => aoEscolher(item.id)}
                aria-label={item.rotulo}
                aria-current={ativoAgora ? 'page' : undefined}
                data-tour={`secao-${item.id}`}
                className={`relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl min-w-[58px] transition-colors cursor-pointer ${
                  ativoAgora ? 'text-[#0B1E14]' : 'text-stone-400'
                }`}
              >
                <span className={`w-9 h-8 rounded-xl flex items-center justify-center ${ativoAgora ? 'bg-[#0B1E14] text-white' : ''}`}>
                  <Icone nome={item.icone} />
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wide leading-none truncate max-w-[56px]">
                  {item.rotulo}
                </span>
                {!!item.contador && item.contador > 0 && (
                  <Contador valor={item.contador} urgente={item.urgente} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/**
 * Pílulas de seção. São a mesma navegação do trilho, escrita por extenso: o
 * ícone diz onde a pessoa pode ir, a pílula diz onde ela está.
 */
export function PilulasDeSecao({
  itens,
  ativo,
  aoEscolher,
}: {
  itens: ItemDeNavegacao[];
  ativo: string;
  aoEscolher: (id: string) => void;
}) {
  return (
    <div data-tour="navegacao" className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {itens.map((item) => {
        const ativoAgora = ativo === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => aoEscolher(item.id)}
            aria-current={ativoAgora ? 'page' : undefined}
            data-tour={`secao-${item.id}`}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
              ativoAgora
                ? 'bg-[#0B1E14] text-white shadow-sm'
                : 'text-stone-500 hover:text-[#0B1E14] hover:bg-white'
            }`}
          >
            {item.rotulo}
            {!!item.contador && item.contador > 0 && (
              <span className={`min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center ${
                ativoAgora ? 'bg-white/20 text-white' : item.urgente ? 'bg-rose-100 text-rose-700' : 'bg-[#BD6B42]/15 text-[#BD6B42]'
              }`}>
                {item.contador}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Cabeçalho do conteúdo: etiqueta miúda, título grande, pílulas e ações.
 * O título ganhou tamanho de propósito — quem abre o painel precisa saber em
 * uma olhada em que tela está, sem procurar o item aceso na lateral.
 */
export function CabecalhoDoPainel({
  etiqueta,
  titulo,
  descricao,
  acoes,
  identidade,
  pilulas,
}: {
  etiqueta?: React.ReactNode;
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  acoes?: React.ReactNode;
  identidade?: React.ReactNode;
  pilulas?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {etiqueta && (
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
              {etiqueta}
            </p>
          )}
          <h2 className="text-2xl sm:text-[30px] font-bold tracking-tight text-[#0B1E14] leading-none">
            {titulo}
          </h2>
          {descricao && <p className="text-xs text-stone-500 mt-2 max-w-xl leading-relaxed">{descricao}</p>}
        </div>

        {/* `min-w-0` deixa este bloco encolher abaixo da largura natural dos
            botões. Sem ele, item de flex não encolhe além do conteúdo e uma
            fileira de três ações empurraria a tela para os lados no celular. */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {acoes}
          {identidade}
        </div>
      </div>

      {pilulas && (
        <div className="bg-white/60 backdrop-blur-sm rounded-full p-1 flex max-w-full w-fit border border-white overflow-hidden">
          {pilulas}
        </div>
      )}
    </div>
  );
}

/**
 * Bloco de identidade do canto superior direito: quem está logado e em qual
 * unidade. Substitui o cabeçalho que morava dentro da barra lateral verde.
 */
export function Identidade({
  nome,
  detalhe,
  foto,
  aoClicar,
}: {
  nome: string;
  detalhe?: string;
  foto?: string | null;
  aoClicar?: () => void;
}) {
  const iniciais = (nome || 'AV').trim().substring(0, 2).toUpperCase();
  return (
    <button
      type="button"
      onClick={aoClicar}
      className="flex items-center gap-2.5 bg-white rounded-full pl-1.5 pr-4 py-1.5 shadow-[0_1px_2px_rgba(11,30,20,0.06)] hover:shadow-md transition-shadow cursor-pointer text-left"
    >
      <span className="w-9 h-9 rounded-full bg-[#0B1E14] text-white flex items-center justify-center font-bold text-[11px] overflow-hidden flex-shrink-0">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="" className="w-full h-full object-cover" />
        ) : (
          iniciais
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-[#0B1E14] truncate max-w-[160px] leading-tight">{nome}</span>
        {detalhe && <span className="block text-[10px] text-stone-400 truncate max-w-[160px] leading-tight">{detalhe}</span>}
      </span>
    </button>
  );
}

/**
 * Cartão de número. O `destaque` é para o valor que a pessoa abriu o painel
 * para ver — um por tela. Usar em dois já faz os dois pararem de se destacar.
 */
export function CartaoDeNumero({
  rotulo,
  valor,
  nota,
  selo,
  destaque = false,
  icone,
}: {
  rotulo: string;
  valor: React.ReactNode;
  nota?: React.ReactNode;
  selo?: React.ReactNode;
  destaque?: boolean;
  icone?: NomeDeIcone;
}) {
  return (
    <div className={`${destaque ? 'cartao-avle-destaque' : 'cartao-avle'} p-5 flex flex-col justify-between min-h-[128px]`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${destaque ? 'text-white/60' : 'text-stone-400'}`}>
          {rotulo}
        </span>
        {icone && (
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
            destaque ? 'bg-white/10 text-white/80' : 'bg-[#F5F2EB] text-[#BD6B42]'
          }`}>
            <Icone nome={icone} />
          </span>
        )}
      </div>

      <div className="mt-4">
        <span className={`block text-[26px] font-bold font-mono leading-none tracking-tight ${destaque ? 'text-white' : 'text-[#0B1E14]'}`}>
          {valor}
        </span>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {selo}
          {nota && (
            <span className={`text-[10px] leading-snug ${destaque ? 'text-white/60' : 'text-stone-400'}`}>{nota}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Barra do topo da loja e do admin, no computador.
 *
 * Veio da referencia que o Johann escolheu: marca a esquerda, as secoes numa
 * pilula escura unica e os atalhos em botoes redondos a direita. Troca o
 * trilho de icones porque a loja e o admin sao usados no computador, onde
 * sobra largura para escrever o nome de cada secao - e nome escrito dispensa
 * a etiqueta de hover que o icone sozinho precisava. No celular a navegacao
 * continua na barra do rodape (`TrilhoDeNavegacao` com `soCelular`).
 */
export function BarraSuperior({
  itens,
  ativo,
  aoEscolher,
  detalhe,
  acoes,
  identidade,
}: {
  itens: ItemDeNavegacao[];
  ativo: string;
  aoEscolher: (id: string) => void;
  detalhe?: string;
  acoes?: React.ReactNode;
  identidade?: React.ReactNode;
}) {
  return (
    <>
    {/* No celular a navegacao mora na barra do rodape; em cima sobram a
        marca e os atalhos, para a pessoa saber onde esta e poder sair. */}
    <header className="md:hidden flex items-center justify-between gap-3 px-4 pt-4">
      <div className="flex items-center gap-2 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/arvore-escura.png" alt="" className="w-9 h-auto flex-shrink-0" />
        <div className="leading-tight min-w-0">
          <span className="block text-[15px] font-bold tracking-tight text-painel-tinta">AVLE</span>
          {detalhe && <span className="block text-[10px] text-stone-400 truncate">{detalhe}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {acoes}
        {identidade}
      </div>
    </header>

    <header className="hidden md:flex items-center gap-4 px-6 lg:px-8 pt-6">
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/arvore-escura.png" alt="" className="w-11 h-auto" />
        <div className="leading-tight">
          <span className="block text-[17px] font-bold tracking-tight text-painel-tinta">AVLE</span>
          {detalhe && (
            <span className="block text-[10px] text-stone-400 max-w-[150px] truncate">{detalhe}</span>
          )}
        </div>
      </div>

      {/* A pilula rola sozinha quando a tela e estreita: entre 768 e 1200px
          as seis secoes da loja nao cabem ao lado da marca e dos atalhos. */}
      <nav aria-label="Seções do painel" className="min-w-0 flex-1 flex xl:justify-center">
        <div data-tour="navegacao" className="flex items-center gap-1 bg-painel-tinta rounded-full p-1.5 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shadow-[0_10px_24px_-14px_rgba(11,30,20,0.8)]">
          {itens.map((item) => {
            const ativoAgora = ativo === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => aoEscolher(item.id)}
                aria-current={ativoAgora ? 'page' : undefined}
                data-tour={`secao-${item.id}`}
                className={`flex items-center gap-1.5 px-4 h-9 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  ativoAgora
                    ? 'bg-painel-acento text-white shadow-[0_6px_16px_-8px_rgba(189,107,66,0.9)]'
                    : 'text-white/65 hover:text-white'
                }`}
              >
                {ativoAgora && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                {item.rotulo}
                {!!item.contador && item.contador > 0 && (
                  <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    ativoAgora ? 'bg-white/25 text-white' : item.urgente ? 'bg-rose-500 text-white' : 'bg-white/15 text-white'
                  }`}>
                    {item.contador > 99 ? '99+' : item.contador}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="flex items-center gap-2 flex-shrink-0">
        {acoes}
        {identidade}
      </div>
    </header>
    </>
  );
}

/**
 * Botao redondo de atalho, com o nome escrito embaixo ao passar o mouse.
 * O `ponto` marca que ha algo esperando, como o sino da referencia.
 */
export function BotaoRedondo({
  icone,
  rotulo,
  aoClicar,
  ponto = false,
  ativo = false,
  perigo = false,
  desabilitado = false,
  tour,
}: {
  icone: NomeDeIcone;
  rotulo: string;
  aoClicar?: () => void;
  ponto?: boolean;
  ativo?: boolean;
  perigo?: boolean;
  desabilitado?: boolean;
  /** Nome do passo do tour que aponta para este botão. */
  tour?: string;
}) {
  return (
    <div className="relative group" data-tour={tour}>
      <button
        type="button"
        onClick={aoClicar}
        disabled={desabilitado}
        aria-label={rotulo}
        className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 ${
          ativo
            ? 'bg-painel-tinta text-white'
            : `bg-white text-painel-tinta border border-painel-borda ${perigo ? 'hover:text-rose-600' : 'hover:border-painel-tinta/30'}`
        }`}
      >
        <Icone nome={icone} />
        {ponto && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />}
      </button>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 whitespace-nowrap rounded-full
                   bg-painel-tinta text-white text-[11px] font-semibold px-3 py-1.5 shadow-lg opacity-0 -translate-y-1
                   transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0
                   group-focus-within:opacity-100 group-focus-within:translate-y-0"
      >
        {rotulo}
      </span>
    </div>
  );
}

/** Foto ou iniciais, sem nome: o avatar da ponta direita da barra do topo. */
export function Avatar({ nome, foto, aoClicar }: { nome: string; foto?: string | null; aoClicar?: () => void }) {
  const iniciais = (nome || 'AV').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label={nome}
      title={nome}
      className="w-11 h-11 rounded-full bg-painel-tinta text-white flex items-center justify-center text-[12px] font-bold overflow-hidden ring-2 ring-white shadow-sm cursor-pointer"
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" className="w-full h-full object-cover" />
      ) : (
        iniciais
      )}
    </button>
  );
}

/**
 * Titulo da tela, grande como na referencia, com a seta de voltar quando ha
 * para onde voltar e as acoes principais do lado direito.
 */
export function CabecalhoDaPagina({
  titulo,
  descricao,
  aoVoltar,
  acoes,
}: {
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  aoVoltar?: () => void;
  acoes?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        {aoVoltar && (
          <button
            type="button"
            onClick={aoVoltar}
            aria-label="Voltar"
            className="w-11 h-11 rounded-full bg-white border border-painel-borda text-painel-tinta flex items-center justify-center hover:border-painel-tinta/30 transition-colors cursor-pointer flex-shrink-0"
          >
            <Icone nome="voltar" />
          </button>
        )}
        <div className="min-w-0">
          {/* Peso no `style`: a camada do design system deixa todo h1 leve
              com um seletor mais forte que qualquer classe, e aqui o titulo
              pesado e justamente o que a referencia tem. */}
          <h1 style={{ fontWeight: 600 }} className="text-[28px] sm:text-[38px] tracking-tight text-painel-tinta leading-none truncate">
            {titulo}
          </h1>
          {descricao && <p className="text-[13px] text-stone-400 mt-2 leading-snug">{descricao}</p>}
        </div>
      </div>
      {acoes && <div className="flex items-center gap-2 flex-wrap min-w-0">{acoes}</div>}
    </div>
  );
}
