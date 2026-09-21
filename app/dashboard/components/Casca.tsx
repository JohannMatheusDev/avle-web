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
  | 'financeiro' | 'cobranca' | 'planos' | 'sair';

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
}: {
  itens: ItemDeNavegacao[];
  ativo: string;
  aoEscolher: (id: string) => void;
  aoSair: () => void;
  itemDeConfiguracao?: ItemDeNavegacao;
  sigla?: string;
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
      <aside className="hidden md:flex sticky top-0 h-screen w-[84px] flex-col items-center justify-between py-6 flex-shrink-0">
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
      </aside>

      {/* Barra do celular. `pb-[env(safe-area-inset-bottom)]` evita que o
          último ícone fique embaixo da barra de gestos do iPhone, onde o toque
          não chega. */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[#E8E4DA] pb-[env(safe-area-inset-bottom)]">
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
    <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {itens.map((item) => {
        const ativoAgora = ativo === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => aoEscolher(item.id)}
            aria-current={ativoAgora ? 'page' : undefined}
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
