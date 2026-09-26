'use client';

/**
 * Peças da tela inicial da loja e do admin.
 *
 * O desenho vem da referência que o Johann escolheu: uma fileira de quatro
 * cartões, cada um com o seu número e um gráfico pequeno embaixo; uma faixa
 * de números miúdos; e um painel escuro com a lista à esquerda e o detalhe
 * do item escolhido à direita. As cores são as da AVLE: o verde-tinta faz o
 * papel do escuro e a terracota o do destaque.
 *
 * Os gráficos são desenhados à mão, e não com o recharts que o resto do
 * painel usa: dentro de um cartão de 260px os eixos, a grade e a legenda do
 * recharts ocupam mais que as barras, e a referência não tem nenhum deles.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { Icone } from './Casca';

type NomeDeIcone = Parameters<typeof Icone>[0]['nome'];

export const real = (n: unknown, casas = 2) =>
  `R$ ${(Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}`;

/**
 * Dinheiro em poucas letras, para os blocos estreitos: "R$ 12,3 mil". O valor
 * inteiro vai no `title` de quem usa.
 */
export const realCurto = (n: unknown) => `R$ ${numeroCurto(n)}`;

/** Só o número de `realCurto`, sem o "R$": "12,3 mil". */
export const numeroCurto = (n: unknown) => {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  const fmt = (x: number) => x.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  if (abs >= 1_000_000) return `${fmt(v / 1_000_000)} mi`;
  if (abs >= 1_000) return `${fmt(v / 1_000)} mil`;
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
};

/**
 * Variação percentual entre o último e o penúltimo valor de uma série.
 * Nulo quando não há os dois, ou quando o anterior é zero: "+∞%" não diz
 * nada a quem lê, e "0%" diria algo falso.
 */
export function variacao(serie: number[]): number | null {
  if (serie.length < 2) return null;
  const atual = serie[serie.length - 1];
  const anterior = serie[serie.length - 2];
  if (!anterior) return null;
  return ((atual - anterior) / anterior) * 100;
}

/** "↑ 12,5% sobre o mês anterior", com a cor do sentido. */
export function Variacao({
  valor,
  texto = 'sobre o mês anterior',
  bomQuandoSobe = true,
}: {
  valor: number | null;
  texto?: string;
  bomQuandoSobe?: boolean;
}) {
  if (valor === null) return null;
  const subiu = valor >= 0;
  const bom = subiu === bomQuandoSobe;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
      <span className={`font-semibold ${bom ? 'text-emerald-700' : 'text-rose-600'}`}>
        {subiu ? '↑' : '↓'} {Math.abs(valor).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
      </span>
      {texto}
    </span>
  );
}

const TONS_DO_ICONE = {
  alerta: 'bg-amber-50 text-amber-600 ring-amber-100',
  perigo: 'bg-rose-50 text-rose-600 ring-rose-100',
  acento: 'bg-painel-acento/10 text-painel-acento ring-painel-acento/15',
  positivo: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  neutro: 'bg-painel-papel text-painel-tinta ring-painel-borda',
} as const;

/**
 * Cartão da fileira de cima: título, ícone no canto, número grande, uma
 * linha de contexto e o gráfico ocupando o resto da altura.
 */
export function CartaoIndicador({
  titulo,
  icone,
  tom = 'neutro',
  canto,
  valor,
  unidade,
  nota,
  children,
  tour,
}: {
  titulo: React.ReactNode;
  icone?: NomeDeIcone;
  tom?: keyof typeof TONS_DO_ICONE;
  canto?: React.ReactNode;
  valor: React.ReactNode;
  unidade?: React.ReactNode;
  nota?: React.ReactNode;
  children?: React.ReactNode;
  tour?: string;
}) {
  return (
    <div data-tour={tour} className="cartao-avle p-5 flex flex-col min-h-[272px] overflow-hidden relative">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-painel-tinta leading-snug">{titulo}</span>
        {canto ?? (icone && (
          <span className={`w-8 h-8 rounded-full ring-1 flex items-center justify-center flex-shrink-0 ${TONS_DO_ICONE[tom]}`}>
            <Icone nome={icone} className="w-4 h-4" />
          </span>
        ))}
      </div>

      <div className="mt-3">
        <span className="flex items-baseline gap-1.5 text-[30px] font-semibold tracking-tight leading-none text-painel-tinta tabular-nums">
          {valor}
          {unidade && <span className="text-[15px] font-medium text-stone-400 tracking-normal">{unidade}</span>}
        </span>
        {nota && <div className="mt-2 min-h-[16px]">{nota}</div>}
      </div>

      {children && <div className="mt-auto pt-4">{children}</div>}
    </div>
  );
}

/**
 * Barras com a última em terracota e as anteriores clareando para trás, como
 * na referência. O valor de cada uma fica no `title`: passar o mouse mostra o
 * número sem precisar de eixo.
 */
export function BarrasMini({
  dados,
  formatar = (n) => String(n),
  altura = 112,
}: {
  // `dica` substitui o texto do hover quando a barra carrega mais de um numero.
  dados: { rotulo: string; valor: number; dica?: string }[];
  formatar?: (n: number) => string;
  altura?: number;
}) {
  if (dados.length === 0) {
    return <SemDados altura={altura} />;
  }
  const maior = Math.max(...dados.map((d) => d.valor), 0);

  return (
    <div>
      <div className="flex items-end gap-[6px]" style={{ height: altura }}>
        {dados.map((d, i) => {
          const ultima = i === dados.length - 1;
          // Nunca some: barra de zero vira um traço, para o mês aparecer
          // como "houve e foi zero", e não como mês faltando.
          const pct = maior > 0 ? Math.max(6, (d.valor / maior) * 100) : 6;
          const opacidade = 0.18 + (0.5 * (i + 1)) / dados.length;
          return (
            <div
              key={`${d.rotulo}-${i}`}
              title={d.dica ?? `${d.rotulo}: ${formatar(d.valor)}`}
              className={`flex-1 rounded-[7px] transition-[height] duration-500 ${ultima ? 'bg-painel-acento' : 'bg-painel-tinta'}`}
              style={{ height: `${pct}%`, opacity: ultima ? 1 : opacidade }}
            />
          );
        })}
      </div>
      <div className="flex gap-[6px] mt-2">
        {dados.map((d, i) => (
          <span key={`${d.rotulo}-${i}`} className="flex-1 text-center text-[9px] text-stone-400 truncate">
            {d.rotulo}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Curva de Catmull-Rom convertida em Bézier: a linha suave da referência. */
function caminhoSuave(pontos: { x: number; y: number }[]) {
  if (pontos.length === 0) return '';
  if (pontos.length === 1) return `M ${pontos[0].x} ${pontos[0].y}`;
  let d = `M ${pontos[0].x} ${pontos[0].y}`;
  for (let i = 0; i < pontos.length - 1; i++) {
    const p0 = pontos[i - 1] ?? pontos[i];
    const p1 = pontos[i];
    const p2 = pontos[i + 1];
    const p3 = pontos[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * Linha com área esmaecida embaixo e pontos brancos de borda colorida.
 *
 * Os pontos são HTML posicionado por porcentagem, e não círculos do SVG: o
 * SVG estica com o cartão (`preserveAspectRatio="none"`), e círculo esticado
 * vira elipse.
 */
export function LinhaMini({
  dados,
  formatar = (n) => String(n),
  altura = 112,
  cor = 'text-painel-acento',
}: {
  dados: { rotulo: string; valor: number }[];
  formatar?: (n: number) => string;
  altura?: number;
  // Classe de cor do texto: a linha, a area e a borda dos pontos saem todas
  // de `currentColor`.
  cor?: string;
}) {
  const id = useId();
  if (dados.length === 0) {
    return <SemDados altura={altura} />;
  }
  const L = 300;
  const A = 100;
  const valores = dados.map((d) => d.valor);
  const maior = Math.max(...valores);
  const menor = Math.min(...valores);
  const faixa = maior - menor || 1;
  // Folga em cima e embaixo para o ponto não encostar na borda do cartão.
  const pontos = dados.map((d, i) => ({
    x: dados.length === 1 ? L / 2 : (i / (dados.length - 1)) * L,
    y: A - 10 - ((d.valor - menor) / faixa) * (A - 24),
  }));
  const linha = caminhoSuave(pontos);
  const area = pontos.length > 1 ? `${linha} L ${L} ${A} L 0 ${A} Z` : '';
  const idGradiente = `linha-mini-${id.replace(/:/g, '')}`;

  return (
    <div className={cor}>
      <div className="relative" style={{ height: altura }}>
        <svg viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
          <defs>
            <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {area && <path d={area} fill={`url(#${idGradiente})`} />}
          <path d={linha} fill="none" stroke="currentColor" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        </svg>
        {pontos.map((p, i) => (
          <span
            key={i}
            title={`${dados[i].rotulo}: ${formatar(dados[i].valor)}`}
            className="absolute w-[9px] h-[9px] -ml-[4.5px] -mt-[4.5px] rounded-full bg-white border-2 border-current"
            style={{ left: `${(p.x / L) * 100}%`, top: `${(p.y / A) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[9px] text-stone-400">{dados[0].rotulo}</span>
        {dados.length > 1 && <span className="text-[9px] text-stone-400">{dados[dados.length - 1].rotulo}</span>}
      </div>
    </div>
  );
}

function SemDados({ altura }: { altura: number }) {
  return (
    <div className="flex items-center justify-center text-[11px] text-stone-400 rounded-[18px] bg-painel-papel" style={{ height: altura }}>
      Sem histórico ainda
    </div>
  );
}

/**
 * A arte do primeiro cartão. Na referência é a foto de uma mesa; aqui é a
 * árvore da AVLE sobre o papel da marca, sangrando até a borda do cartão.
 */
export function ArteDaMarca() {
  return (
    <div className="-mx-5 -mb-5 h-[122px] relative overflow-hidden bg-gradient-to-b from-avle-bege to-painel-papel">
      <div className="absolute inset-x-0 bottom-0 h-7 bg-painel-borda/60" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/arvore-escura.png"
        alt=""
        className="absolute left-1/2 -translate-x-1/2 bottom-[18px] w-[78%] max-w-[260px] opacity-90"
      />
    </div>
  );
}

/**
 * Os três blocos do quarto cartão, com o do meio mais alto e em terracota,
 * e o botão escuro sobreposto ao canto como o "Payout now" da referência.
 */
export function BlocosDeValor({
  blocos,
  acao,
}: {
  blocos: { rotulo: string; valor: React.ReactNode; destaque?: boolean; dica?: string }[];
  acao?: { rotulo: string; aoClicar: () => void };
}) {
  return (
    <div className="relative">
      <div className="flex items-end gap-2">
        {blocos.map((b) => (
          <div
            key={b.rotulo}
            title={b.dica}
            className={`flex-1 min-w-0 rounded-[16px] px-3 pt-3 flex flex-col ${
              b.destaque
                ? 'h-[118px] bg-painel-acento text-white shadow-[0_14px_24px_-16px_rgba(189,107,66,0.9)]'
                : 'h-[92px] bg-painel-papel text-painel-tinta'
            }`}
          >
            <span className={`text-[10px] leading-tight ${b.destaque ? 'text-white/75' : 'text-stone-400'}`}>{b.rotulo}</span>
            <span className="text-[17px] font-semibold tabular-nums leading-tight mt-1 break-words">{b.valor}</span>
          </div>
        ))}
      </div>
      {acao && (
        <button
          type="button"
          onClick={acao.aoClicar}
          className="absolute -bottom-1 right-0 h-9 px-4 rounded-full bg-painel-tinta text-white text-[11px] font-semibold shadow-lg hover:bg-avle-verde transition-colors cursor-pointer"
        >
          {acao.rotulo}
        </button>
      )}
    </div>
  );
}

/** Botão redondo do canto do cartão, no lugar do ícone: a seta "↗". */
export function BotaoDeCanto({ rotulo, aoClicar }: { rotulo: string; aoClicar: () => void }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label={rotulo}
      title={rotulo}
      className="w-8 h-8 rounded-full bg-white border border-painel-borda text-painel-tinta flex items-center justify-center hover:bg-painel-tinta hover:text-white transition-colors cursor-pointer flex-shrink-0"
    >
      <Icone nome="seta" className="w-4 h-4" />
    </button>
  );
}

/**
 * Faixa de números miúdos entre os cartões e o painel escuro: o lugar da
 * fileira de filtros da referência. Cada item é uma pílula branca; a nota
 * vai escrita ao lado do número, e não num tooltip, porque é ela que avisa
 * quando o número é estimado.
 */
export function FaixaDeNumeros({
  titulo,
  itens,
  fim,
  tour,
}: {
  titulo: string;
  itens: { rotulo: string; valor: React.ReactNode; nota?: React.ReactNode; tom?: 'alerta' | 'acento' | 'positivo' }[];
  fim?: React.ReactNode;
  tour?: string;
}) {
  const corDoValor = { alerta: 'text-amber-700', acento: 'text-painel-acento', positivo: 'text-emerald-700' };
  return (
    <div data-tour={tour} className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-2 pr-2 text-[13px] font-medium text-painel-tinta">
        {titulo}
        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-painel-tinta text-white text-[10px] font-bold flex items-center justify-center">
          {itens.length}
        </span>
      </span>
      {itens.map((item) => (
        <span
          key={item.rotulo}
          className="flex flex-wrap items-center gap-x-2 gap-y-0.5 max-w-full bg-white border border-painel-borda rounded-full px-4 min-h-10 py-1.5 text-[12px]"
        >
          <span className="text-stone-400 whitespace-nowrap">{item.rotulo}</span>
          <span className={`font-semibold tabular-nums whitespace-nowrap ${item.tom ? corDoValor[item.tom] : 'text-painel-tinta'}`}>
            {item.valor}
          </span>
          {item.nota && <span className="text-[11px] text-stone-400">{item.nota}</span>}
        </span>
      ))}
      {fim && <span className="ml-auto">{fim}</span>}
    </div>
  );
}

/**
 * Painel escuro de lista e detalhe.
 *
 * As abas ficam num recorte da borda de cima, na cor do fundo da página, como
 * na referência. Os dois cantos côncavos do recorte são gradientes radiais:
 * um quarto de círculo transparente deixa o escuro aparecer na curva.
 */
export function PainelEscuro({
  titulo,
  abas,
  abaAtiva,
  aoTrocarAba,
  canto,
  lista,
  detalhe,
  tour,
}: {
  titulo: string;
  abas: { id: string; rotulo: string; contador?: number }[];
  abaAtiva: string;
  aoTrocarAba: (id: string) => void;
  canto?: React.ReactNode;
  lista: React.ReactNode;
  detalhe: React.ReactNode;
  tour?: string;
}) {
  const curva = (lado: 'esq' | 'dir') => ({
    background: `radial-gradient(circle at ${lado === 'esq' ? '0' : '100%'} 100%, transparent 18px, var(--color-painel-papel) 18.5px)`,
  });

  return (
    <section data-tour={tour} className="relative bg-painel-tinta rounded-[28px] p-5 pt-5 text-white shadow-[0_30px_60px_-40px_rgba(11,30,20,0.9)]">
      <div className="hidden lg:flex absolute top-0 left-1/2 -translate-x-1/2 bg-painel-papel rounded-b-[22px] px-2 pb-2 z-10">
        <span aria-hidden="true" className="absolute top-0 right-full w-[18px] h-[18px]" style={curva('esq')} />
        <span aria-hidden="true" className="absolute top-0 left-full w-[18px] h-[18px]" style={curva('dir')} />
        <Abas abas={abas} abaAtiva={abaAtiva} aoTrocarAba={aoTrocarAba} />
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 min-h-[36px]">
        <h3 style={{ fontWeight: 600 }} className="text-[15px] text-white">{titulo}</h3>
        <div className="flex items-center gap-2">{canto}</div>
      </div>

      {/* Abaixo de 1024px o recorte não cabe entre o título e o canto: as
          abas descem para uma linha própria, dentro do escuro. */}
      <div className="lg:hidden mb-4 bg-white/5 rounded-full p-1 w-fit max-w-full overflow-x-auto">
        <Abas abas={abas} abaAtiva={abaAtiva} aoTrocarAba={aoTrocarAba} escuro />
      </div>

      {/* Lado a lado so a partir de 1280px: em 1024 a coluna da lista deixava
          o detalhe com 500px e cortava o nome do grupo. */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-4">
        <div className="space-y-2 xl:max-h-[440px] xl:overflow-y-auto pr-0.5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
          {lista}
        </div>
        <div className="min-w-0">{detalhe}</div>
      </div>
    </section>
  );
}

function Abas({
  abas,
  abaAtiva,
  aoTrocarAba,
  escuro = false,
}: {
  abas: { id: string; rotulo: string; contador?: number }[];
  abaAtiva: string;
  aoTrocarAba: (id: string) => void;
  escuro?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {abas.map((aba) => {
        const ativa = aba.id === abaAtiva;
        return (
          <button
            key={aba.id}
            type="button"
            onClick={() => aoTrocarAba(aba.id)}
            aria-pressed={ativa}
            className={`flex items-center gap-2 h-9 px-4 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              ativa
                ? 'bg-painel-acento text-white'
                : escuro
                  ? 'text-white/60 hover:text-white'
                  : 'bg-white text-painel-tinta hover:bg-white/70'
            }`}
          >
            {aba.rotulo}
            {aba.contador !== undefined && (
              <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                ativa ? 'bg-white text-painel-acento' : escuro ? 'bg-white/10 text-white' : 'bg-painel-papel text-painel-tinta'
              }`}>
                {aba.contador}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Uma linha da lista do painel escuro. */
export function ItemDoPainel({
  sigla,
  titulo,
  subtitulo,
  selo,
  valor,
  ativo,
  aoEscolher,
}: {
  sigla: string;
  titulo: React.ReactNode;
  subtitulo?: React.ReactNode;
  selo?: React.ReactNode;
  valor?: React.ReactNode;
  ativo: boolean;
  aoEscolher: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoEscolher}
      aria-pressed={ativo}
      className={`w-full flex items-center gap-3 rounded-[18px] px-3 py-2.5 text-left transition-colors cursor-pointer ${
        ativo ? 'bg-avle-verde ring-1 ring-painel-acento/70' : 'bg-white/[0.04] hover:bg-white/[0.08]'
      }`}
    >
      <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
        ativo ? 'bg-painel-acento text-white' : 'bg-white/10 text-white/80'
      }`}>
        {sigla}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold text-white truncate">{titulo}</span>
        {subtitulo && <span className="block text-[10px] text-white/45 truncate mt-0.5">{subtitulo}</span>}
      </span>
      {selo && (
        <span className={`hidden sm:inline-flex items-center h-6 px-2.5 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0 ${
          ativo ? 'bg-white text-painel-tinta' : 'bg-white/[0.07] text-white/65'
        }`}>
          {selo}
        </span>
      )}
      {valor && <span className="text-[13px] font-semibold tabular-nums text-white whitespace-nowrap flex-shrink-0">{valor}</span>}
    </button>
  );
}

/** Um bloco do detalhe do painel escuro, com a seta do canto da referência. */
export function BlocoDoDetalhe({
  rotulo,
  valor,
  nota,
  aoClicar,
}: {
  rotulo: string;
  valor: React.ReactNode;
  nota?: React.ReactNode;
  aoClicar?: () => void;
}) {
  const Tag = aoClicar ? 'button' : 'div';
  return (
    <Tag
      {...(aoClicar ? { type: 'button' as const, onClick: aoClicar } : {})}
      className={`relative text-left rounded-[18px] bg-white/[0.07] p-4 min-h-[96px] flex flex-col justify-between ${aoClicar ? 'hover:bg-white/[0.11] transition-colors cursor-pointer' : ''}`}
    >
      <span className="absolute top-3 right-3 text-white/40">
        <Icone nome="seta" className="w-3.5 h-3.5" />
      </span>
      <span className="text-[18px] font-semibold tabular-nums text-white leading-tight pr-5">{valor}</span>
      <span className="text-[11px] text-white/55 mt-2 leading-snug">
        {rotulo}
        {nota && <span className="block text-[10px] text-white/40 mt-0.5">{nota}</span>}
      </span>
    </Tag>
  );
}

/** O bloco tracejado de "adicionar" que fecha a fileira do detalhe. */
export function BlocoDeAdicionar({
  rotulo,
  aoClicar,
  icone = 'mais',
}: {
  rotulo: string;
  aoClicar: () => void;
  icone?: NomeDeIcone;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      className="rounded-[18px] border border-dashed border-white/25 min-h-[96px] flex flex-col items-center justify-center gap-1.5 text-white/70 hover:text-white hover:border-white/45 transition-colors cursor-pointer"
    >
      <Icone nome={icone} className="w-5 h-5" />
      <span className="text-[11px] font-medium">{rotulo}</span>
    </button>
  );
}

/** Botão escuro redondo do canto do painel escuro e do rodapé do detalhe. */
export function BotaoEscuro({ icone, rotulo, aoClicar }: { icone: NomeDeIcone; rotulo: string; aoClicar: () => void }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label={rotulo}
      title={rotulo}
      className="w-9 h-9 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
    >
      <Icone nome={icone} className="w-4 h-4" />
    </button>
  );
}

/** Iniciais de um nome, para o círculo da lista. */
export function sigla(nome: string | null | undefined) {
  const partes = (nome || '?').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/**
 * O ícone de calendário do canto do cartão, que abre a escolha do período.
 *
 * Fecha ao escolher, ao clicar fora e no Esc. Fica no canto, no lugar do
 * ícone que era só enfeite, porque é ali que a referência põe o calendário.
 */
export function SeletorDePeriodo<T extends string>({
  opcoes,
  valor,
  aoEscolher,
}: {
  opcoes: { id: T; rotulo: string }[];
  valor: T;
  aoEscolher: (id: T) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  const atual = opcoes.find((o) => o.id === valor);

  return (
    <div ref={caixa} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={`Período: ${atual?.rotulo ?? ''}. Trocar período`}
        title="Trocar período"
        className={`h-8 pl-2.5 pr-3 rounded-full ring-1 flex items-center gap-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
          aberto
            ? 'bg-painel-tinta text-white ring-painel-tinta'
            : 'bg-painel-papel text-painel-tinta ring-painel-borda hover:ring-painel-tinta/30'
        }`}
      >
        <Icone nome="calendario" className="w-4 h-4" />
        {atual?.rotulo}
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 z-30 min-w-[150px] bg-white rounded-[18px] p-1.5 ring-1 ring-painel-borda shadow-[0_18px_40px_-18px_rgba(11,30,20,0.45)] animate-fadeIn"
        >
          {opcoes.map((o) => {
            const escolhido = o.id === valor;
            return (
              <button
                key={o.id}
                type="button"
                role="menuitemradio"
                aria-checked={escolhido}
                onClick={() => { aoEscolher(o.id); setAberto(false); }}
                className={`w-full flex items-center justify-between gap-3 h-9 px-3 rounded-full text-[12px] font-medium text-left transition-colors cursor-pointer ${
                  escolhido ? 'bg-painel-tinta text-white' : 'text-painel-tinta hover:bg-painel-papel'
                }`}
              >
                {o.rotulo}
                {escolhido && <span className="w-1.5 h-1.5 rounded-full bg-painel-acento" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
