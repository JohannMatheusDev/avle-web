'use client';

/**
 * Os gráficos da página da Conta AVLE.
 *
 * O desenho segue a referência que o Johann escolheu: números soltos no
 * topo, a área hachurada entre duas curvas com a janela de valores no ponto,
 * os blocos coloridos de situação, a colmeia, as barras hachuradas com a do
 * destaque cheia e as duas linhas da semana. As cores são as da AVLE - o
 * verde-tinta no lugar do azul e a terracota no lugar do roxo.
 *
 * Tudo desenhado à mão em SVG e HTML, como os outros mini gráficos do painel:
 * dentro de cartões deste tamanho, eixos e legendas de biblioteca ocupam mais
 * que o dado.
 */

import { useId, useMemo, useState } from 'react';
import { Icone } from './Casca';
import { real, variacao } from './Indicadores';

export type DadosDoPainel = {
  semanas: { inicio: string; entradas: number; saidas: number }[];
  porDiaDaSemana: number[];
  resumoDaSemana: {
    inicio: string;
    fim: string;
    estaSemana: number[];
    semanaPassada: number[];
    total: number;
    totalSemanaPassada: number;
  };
  saques: Record<'andamento' | 'banco' | 'concluidos' | 'naoSairam', { quantidade: number; valor: number }>;
};

const dataCurta = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

/** "↑ 12%" verde ou "↓ 8%" vermelho, na pílula da referência. */
export function PilulaDeVariacao({ valor, bomQuandoSobe = true }: { valor: number | null; bomQuandoSobe?: boolean }) {
  if (valor === null || !Number.isFinite(valor)) return null;
  const subiu = valor >= 0;
  const bom = subiu === bomQuandoSobe;
  return (
    <span className={`inline-flex items-center gap-0.5 h-6 px-2 rounded-full text-[11px] font-semibold ${
      bom ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
    }`}>
      {subiu ? '↑' : '↓'} {Math.abs(valor).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
    </span>
  );
}

// ── Números do topo ─────────────────────────────────────────────────────────

export function NumerosDoTopo({
  itens,
}: {
  itens: { rotulo: string; valor: string; variacao?: number | null; nota: string; bomQuandoSobe?: boolean }[];
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
      {itens.map((i) => (
        <div key={i.rotulo} className="min-w-0">
          <span className="block text-[13px] text-stone-500">{i.rotulo}</span>
          <div className="flex flex-wrap items-end gap-x-2.5 gap-y-1 mt-1.5">
            <span className="text-[26px] sm:text-[34px] font-semibold tracking-tight tabular-nums text-painel-tinta leading-none">
              {i.valor}
            </span>
            <span className="flex flex-col gap-0.5 pb-0.5">
              <PilulaDeVariacao valor={i.variacao ?? null} bomQuandoSobe={i.bomQuandoSobe} />
              <span className="text-[11px] text-stone-400 leading-tight">{i.nota}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Movimento da conta (área hachurada) ─────────────────────────────────────

/** Curva suave de Catmull-Rom, a mesma dos outros gráficos do painel. */
function curva(p: { x: number; y: number }[]) {
  if (p.length === 0) return '';
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function GraficoDeMovimento({
  semanas,
  controle,
}: {
  semanas: DadosDoPainel['semanas'];
  controle?: React.ReactNode;
}) {
  const id = useId().replace(/:/g, '');
  const [ativa, setAtiva] = useState<number | null>(null);
  const L = 1000;
  const A = 240;

  const totalEntradas = semanas.reduce((a, s) => a + Number(s.entradas), 0);
  const totalSaidas = semanas.reduce((a, s) => a + Number(s.saidas), 0);
  const maior = Math.max(1, ...semanas.map((s) => Number(s.entradas)), ...semanas.map((s) => Number(s.saidas)));

  // As duas curvas: a das entradas por cima, a das saídas por baixo. O vão
  // entre elas é o que ficou na conta na semana, e é ele que a hachura pinta.
  const passo = semanas.length > 1 ? L / (semanas.length - 1) : L;
  const y = (v: number) => A - 18 - (v / maior) * (A - 44);
  const topo = semanas.map((s, i) => ({ x: i * passo, y: y(Number(s.entradas)) }));
  const base = semanas.map((s, i) => ({ x: i * passo, y: y(Number(s.saidas)) }));
  const area = `${curva(topo)} L ${base[base.length - 1].x} ${base[base.length - 1].y} ${
    curva([...base].reverse()).replace(/^M [^C]+/, '')
  } Z`;

  const indice = ativa ?? semanas.length - 1;
  const semana = semanas[indice];
  const xPct = (topo[indice].x / L) * 100;

  return (
    <div className="cartao-avle p-5 sm:p-6 flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 style={{ fontWeight: 500 }} className="text-[20px] sm:text-[22px] text-painel-tinta">Movimento da conta</h3>
        {controle}
      </div>
      <div className="flex flex-wrap gap-x-10 gap-y-2 mt-3">
        <div>
          <span className="block text-[13px] text-stone-400">Entrou</span>
          <span className="block text-[24px] sm:text-[28px] font-semibold tabular-nums text-painel-tinta">{real(totalEntradas)}</span>
        </div>
        <div>
          <span className="block text-[13px] text-stone-400">Saiu</span>
          <span className="block text-[24px] sm:text-[28px] font-semibold tabular-nums text-painel-tinta">{real(totalSaidas)}</span>
        </div>
      </div>

      <div className="relative mt-6 h-[200px] sm:h-[220px]" onMouseLeave={() => setAtiva(null)}>
        <svg viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
          <defs>
            <pattern id={`hachura-${id}`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
              <line x1="0" y1="0" x2="0" y2="9" className="stroke-painel-tinta" strokeWidth="1.1" />
            </pattern>
          </defs>
          <path d={area} fill={`url(#hachura-${id})`} opacity="0.55" />
          <path d={curva(topo)} fill="none" className="stroke-painel-tinta" strokeWidth="1.4" vectorEffect="non-scaling-stroke" opacity="0.6" />
          <path d={curva(base)} fill="none" className="stroke-painel-acento" strokeWidth="1.4" vectorEffect="non-scaling-stroke" opacity="0.7" />
          <line x1={topo[indice].x} x2={topo[indice].x} y1="0" y2={A} className="stroke-painel-tinta/20" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" />
        </svg>

        {/* Pontos em HTML: o SVG estica com a largura, e quadrado esticado
            vira retângulo. */}
        {topo.map((p, i) => (
          <span key={`t${i}`} className={`absolute w-[7px] h-[7px] -ml-[3.5px] -mt-[3.5px] ${i === indice ? 'bg-painel-tinta scale-150' : 'bg-painel-tinta/70'} transition-transform`}
            style={{ left: `${(p.x / L) * 100}%`, top: `${(p.y / A) * 100}%` }} />
        ))}
        {base.map((p, i) => (
          <span key={`b${i}`} className={`absolute w-[7px] h-[7px] -ml-[3.5px] -mt-[3.5px] ${i === indice ? 'bg-painel-acento scale-150' : 'bg-painel-acento/70'} transition-transform`}
            style={{ left: `${(p.x / L) * 100}%`, top: `${(p.y / A) * 100}%` }} />
        ))}

        {/* Faixas invisíveis por semana: passar o mouse (ou tocar) escolhe a
            semana da janelinha. */}
        <div className="absolute inset-0 flex">
          {semanas.map((s, i) => (
            <button
              key={s.inicio}
              type="button"
              aria-label={`Semana de ${dataCurta(s.inicio)}: entrou ${real(s.entradas)}, saiu ${real(s.saidas)}`}
              onMouseEnter={() => setAtiva(i)}
              onFocus={() => setAtiva(i)}
              onClick={() => setAtiva(i)}
              className="flex-1 h-full cursor-crosshair focus:outline-none"
            />
          ))}
        </div>

        <div
          className="pointer-events-none absolute z-10 bg-white rounded-[16px] ring-1 ring-painel-borda shadow-[0_18px_36px_-18px_rgba(11,30,20,0.45)] px-4 py-3 w-[190px]"
          style={{
            left: `clamp(0px, calc(${xPct}% - 95px), calc(100% - 190px))`,
            top: 0,
          }}
        >
          <span className="block text-[11px] text-stone-400">Semana de {dataCurta(semana.inicio)}</span>
          <span className="flex items-center justify-between gap-3 mt-1.5 text-[12px]">
            <span className="flex items-center gap-2 text-stone-500"><span className="w-2.5 h-2.5 rounded-full bg-painel-tinta" />Entrou</span>
            <span className="font-semibold tabular-nums text-painel-tinta">{real(semana.entradas)}</span>
          </span>
          <span className="flex items-center justify-between gap-3 mt-1 text-[12px]">
            <span className="flex items-center gap-2 text-stone-500"><span className="w-2.5 h-2.5 rounded-full bg-painel-acento" />Saiu</span>
            <span className="font-semibold tabular-nums text-painel-tinta">{real(semana.saidas)}</span>
          </span>
        </div>
      </div>

      <div className="flex justify-between mt-3">
        {semanas.map((s, i) => (
          <span key={s.inicio} className={`text-[11px] text-stone-400 tabular-nums ${
            // No celular só metade dos rótulos cabe: fica um sim, um não.
            i % 2 === 1 && i !== semanas.length - 1 ? 'hidden sm:inline' : ''
          }`}>
            {dataCurta(s.inicio)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Saques (os blocos coloridos) ────────────────────────────────────────────

export function CartaoDeSaques({
  saldo,
  saques,
  aoSacar,
}: {
  saldo: number | null;
  saques: DadosDoPainel['saques'];
  aoSacar?: () => void;
}) {
  const blocos = [
    { chave: 'andamento', rotulo: 'Em andamento', classe: 'bg-painel-tinta text-white', ponto: 'bg-painel-tinta' },
    { chave: 'banco', rotulo: 'No banco', classe: 'bg-avle-verde text-white', ponto: 'bg-avle-verde' },
    { chave: 'concluidos', rotulo: 'Concluídos', classe: 'bg-painel-acento text-white', ponto: 'bg-painel-acento' },
    { chave: 'naoSairam', rotulo: 'Não saíram', classe: 'bg-painel-acento/25 text-painel-tinta', ponto: 'bg-painel-acento/40' },
  ] as const;

  return (
    <div className="cartao-avle p-5 sm:p-6 flex flex-col">
      <h3 style={{ fontWeight: 500 }} className="text-[20px] sm:text-[22px] text-painel-tinta">Saques</h3>

      <div className="mt-4 flex items-center justify-between gap-3 bg-painel-papel rounded-full pl-5 pr-2 h-14">
        <span className="text-[14px] text-stone-500 truncate">
          Saldo disponível: <strong className="text-[18px] font-semibold tabular-nums text-painel-tinta">{saldo != null ? real(saldo) : '—'}</strong>
        </span>
        {aoSacar && (
          <button
            type="button"
            onClick={aoSacar}
            aria-label="Sacar via Pix"
            title="Sacar via Pix"
            className="w-10 h-10 rounded-full bg-white ring-1 ring-painel-borda text-painel-tinta flex items-center justify-center hover:bg-painel-tinta hover:text-white transition-colors cursor-pointer flex-shrink-0"
          >
            <Icone nome="seta" className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {blocos.map((b) => (
          <div key={b.chave} className={`rounded-[18px] ${b.classe} px-2 py-4 sm:py-5 text-center`}>
            <span className="block text-[28px] font-semibold tabular-nums leading-none">{saques[b.chave].quantidade}</span>
            <span className="block text-[12px] mt-2 opacity-85 leading-tight">{b.rotulo}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-4 mt-auto pt-6">
        {blocos.map((b) => (
          <div key={b.chave} className="min-w-0">
            <span className="flex items-center gap-1.5 text-[12px] text-stone-500 truncate">
              <span className={`w-2.5 h-2.5 rounded-[3px] flex-shrink-0 ${b.ponto}`} />
              {b.rotulo}
            </span>
            <span className="block text-[15px] font-semibold tabular-nums text-painel-tinta mt-1 truncate">{real(saques[b.chave].valor)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Faturado por grupo (a colmeia) ──────────────────────────────────────────

/**
 * Colmeia de hexágonos, cada um uma fatia do faturado: os do centro para o
 * grupo que mais fatura, os de fora para os seguintes. Mostra de relance se
 * a loja depende de um grupo só.
 */
export function ColmeiaDeGrupos({
  grupos,
  aoAbrir,
}: {
  grupos: { nome: string; faturado: number }[];
  aoAbrir?: () => void;
}) {
  // Tinta, terracota e terracota clara: o verde da marca ao lado do
  // verde-tinta nao se distinguia, e a colmeia virava uma mancha so.
  const TONS = ['fill-painel-tinta', 'fill-painel-acento', 'fill-painel-acento/40', 'fill-painel-borda'];
  const PONTOS = ['bg-painel-tinta', 'bg-painel-acento', 'bg-painel-acento/40', 'bg-painel-borda'];

  const { celulas, legenda } = useMemo(() => {
    const ordenados = [...grupos].filter((g) => Number(g.faturado) > 0).sort((a, b) => Number(b.faturado) - Number(a.faturado));
    const tres = ordenados.slice(0, 3);
    const outros = ordenados.slice(3).reduce((a, g) => a + Number(g.faturado), 0);
    const fatias = [...tres.map((g) => ({ nome: g.nome, valor: Number(g.faturado) }))];
    if (outros > 0) fatias.push({ nome: 'Outros grupos', valor: outros });
    const total = fatias.reduce((a, f) => a + f.valor, 0);

    // Grade hexagonal em volta do centro, do mais perto para o mais longe.
    const R = 5;
    const lista: { q: number; r: number; d: number }[] = [];
    for (let q = -R; q <= R; q++) {
      for (let r = Math.max(-R, -q - R); r <= Math.min(R, -q + R); r++) {
        const x = Math.sqrt(3) * (q + r / 2);
        const y = 1.5 * r;
        lista.push({ q, r, d: Math.hypot(x, y * 1.05) });
      }
    }
    lista.sort((a, b) => a.d - b.d);

    let fatia = 0;
    let acumulado = total > 0 ? fatias[0]?.valor ?? 0 : 0;
    const celulas = lista.map((c, i) => {
      if (total > 0) {
        while (fatia < fatias.length - 1 && (i + 1) / lista.length > acumulado / total) {
          fatia++;
          acumulado += fatias[fatia].valor;
        }
      }
      return { ...c, tom: total > 0 ? Math.min(fatia, 3) : 3 };
    });
    return { celulas, legenda: fatias };
  }, [grupos]);

  const tam = 10;
  const hex = (cx: number, cy: number) => {
    const pts = Array.from({ length: 6 }, (_, k) => {
      const ang = (Math.PI / 180) * (60 * k - 30);
      return `${(cx + (tam - 1.2) * Math.cos(ang)).toFixed(2)},${(cy + (tam - 1.2) * Math.sin(ang)).toFixed(2)}`;
    });
    return pts.join(' ');
  };

  return (
    <div className="cartao-avle p-5 sm:p-6 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 style={{ fontWeight: 500 }} className="text-[20px] sm:text-[22px] text-painel-tinta">Faturado por grupo</h3>
        {aoAbrir && (
          <button type="button" onClick={aoAbrir} aria-label="Ver os grupos" title="Ver os grupos"
            className="w-10 h-10 rounded-full bg-white ring-1 ring-painel-borda text-painel-tinta flex items-center justify-center hover:bg-painel-tinta hover:text-white transition-colors cursor-pointer">
            <Icone nome="seta" className="w-4 h-4" />
          </button>
        )}
      </div>

      <svg viewBox="-100 -90 200 180" className="w-full max-w-[260px] mx-auto my-4" role="img" aria-label="Colmeia do faturado por grupo">
        {celulas.map((c) => {
          const cx = tam * Math.sqrt(3) * (c.q + c.r / 2);
          const cy = tam * 1.5 * c.r;
          return <polygon key={`${c.q},${c.r}`} points={hex(cx, cy)} className={TONS[c.tom]} opacity={c.tom === 3 ? 0.9 : 1} />;
        })}
      </svg>

      {legenda.length === 0 ? (
        <p className="text-[12px] text-stone-400 text-center mt-auto">Nenhum grupo faturou ainda.</p>
      ) : (
        <ul className="space-y-2 mt-auto">
          {legenda.map((l, i) => (
            <li key={l.nome} className="flex items-center justify-between gap-3 text-[14px]">
              <span className="flex items-center gap-2.5 min-w-0 text-painel-tinta">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PONTOS[Math.min(i, 3)]}`} />
                <span className="truncate">{l.nome}</span>
              </span>
              <span className="tabular-nums text-painel-tinta">{real(l.valor, 0)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Dia que mais entra (barras hachuradas) ──────────────────────────────────

export function DiaQueMaisEntra({ porDia }: { porDia: number[] }) {
  const id = useId().replace(/:/g, '');
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const total = porDia.reduce((a, v) => a + Number(v), 0);
  const maior = Math.max(1, ...porDia.map(Number));
  const melhor = porDia.map(Number).indexOf(Math.max(...porDia.map(Number)));
  const pctMelhor = total > 0 ? Math.round((Number(porDia[melhor]) / total) * 100) : 0;

  return (
    <div className="cartao-avle p-5 sm:p-6 flex flex-col">
      <h3 style={{ fontWeight: 500 }} className="text-[20px] sm:text-[22px] text-painel-tinta">Dia que mais entra</h3>
      <span className="block text-[13px] text-stone-400 mt-3">
        {total > 0 ? `${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'][melhor]} · do que entrou no período` : 'Sem entradas no período'}
      </span>
      <span className="block text-[26px] font-semibold tabular-nums text-painel-tinta">{pctMelhor}%</span>

      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <pattern id={`barra-${id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
            <rect width="8" height="8" className="fill-painel-papel" />
            <line x1="0" y1="0" x2="0" y2="8" className="stroke-painel-borda" strokeWidth="2" />
          </pattern>
        </defs>
      </svg>

      <div className="flex items-end gap-1.5 sm:gap-2 h-[170px] mt-auto pt-8">
        {porDia.map((v, i) => {
          const destaque = i === melhor && total > 0;
          const pct = Math.max(12, (Number(v) / maior) * 100);
          return (
            <div key={dias[i]} className="flex-1 h-full flex flex-col justify-end items-center relative" title={`${dias[i]}: ${real(v)}`}>
              {destaque && (
                <span className="absolute -translate-y-full mb-1 h-6 px-2.5 rounded-full bg-painel-acento text-white text-[11px] font-semibold flex items-center"
                  style={{ bottom: `${pct}%` }}>
                  {pctMelhor}%
                </span>
              )}
              {destaque ? (
                <div className="w-full rounded-[12px] bg-painel-acento" style={{ height: `${pct}%` }} />
              ) : (
                <svg className="w-full rounded-[12px]" style={{ height: `${pct}%` }} preserveAspectRatio="none">
                  <rect width="100%" height="100%" rx="12" fill={`url(#barra-${id})`} />
                </svg>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 sm:gap-2 mt-2">
        {dias.map((d) => <span key={d} className="flex-1 text-center text-[11px] text-stone-400">{d}</span>)}
      </div>
    </div>
  );
}

// ── Resumo da semana (duas linhas) ──────────────────────────────────────────

export function ResumoDaSemana({
  dados,
  aoBaixar,
}: {
  dados: DadosDoPainel['resumoDaSemana'];
  aoBaixar?: () => void;
}) {
  const L = 600;
  const A = 220;
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  // A linha desta semana para no dia de hoje: o que ainda não chegou não é zero.
  const hojeIdx = (new Date().getDay() + 6) % 7;

  const acumular = (v: number[]) => v.reduce<number[]>((acc, x, i) => [...acc, (acc[i - 1] ?? 0) + Number(x)], []);
  const esta = acumular(dados.estaSemana).slice(0, hojeIdx + 1);
  const passada = acumular(dados.semanaPassada);
  const maior = Math.max(1, ...esta, ...passada);
  const topoDoEixo = Math.ceil(maior / 1000) * 1000 || 1000;
  const px = (i: number) => (i / 6) * L;
  const py = (v: number) => A - (v / topoDoEixo) * A;
  const linha = (v: number[]) => curva(v.map((x, i) => ({ x: px(i), y: py(x) })));
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => f * topoDoEixo);

  return (
    <div className="cartao-avle p-5 sm:p-6 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 style={{ fontWeight: 500 }} className="text-[20px] sm:text-[22px] text-painel-tinta">Resumo da semana</h3>
        {aoBaixar && (
          <button type="button" onClick={aoBaixar} aria-label="Baixar a planilha da semana" title="Baixar a planilha da semana"
            className="w-10 h-10 rounded-full bg-white ring-1 ring-painel-borda text-painel-tinta flex items-center justify-center hover:bg-painel-tinta hover:text-white transition-colors cursor-pointer">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 4v11" /><path d="m7 10.5 5 5 5-5" /><path d="M5 19.5h14" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
        <span className="flex items-center gap-2">
          <span className="text-[26px] font-semibold tabular-nums text-painel-tinta">{real(dados.total)}</span>
          <PilulaDeVariacao valor={variacao([Number(dados.totalSemanaPassada), Number(dados.total)])} />
        </span>
        <span className="text-[13px] text-stone-400">{dataCurta(dados.inicio)} – {dataCurta(dados.fim)}</span>
      </div>

      <div className="flex gap-2 mt-5 flex-1 min-h-[170px]">
        <div className="flex flex-col justify-between text-[10px] text-stone-400 tabular-nums py-0.5 text-right w-10 flex-shrink-0">
          {[...marcas].reverse().map((m) => <span key={m}>{m >= 1000 ? `R$ ${m / 1000}k` : `R$ ${m}`}</span>)}
        </div>
        <div className="relative flex-1">
          <svg viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
            {marcas.map((m) => (
              <line key={m} x1="0" x2={L} y1={py(m)} y2={py(m)} className="stroke-painel-borda" strokeWidth="1" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
            ))}
            <path d={linha(passada)} fill="none" className="stroke-stone-400" strokeWidth="1.6" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
            <path d={linha(esta)} fill="none" className="stroke-painel-tinta" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full bg-stone-400"
            style={{ left: '100%', top: `${(py(passada[6] ?? 0) / A) * 100}%` }} />
          <span className="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full bg-painel-tinta ring-2 ring-white"
            style={{ left: `${(px(esta.length - 1) / L) * 100}%`, top: `${(py(esta[esta.length - 1] ?? 0) / A) * 100}%` }} />
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <span className="w-10 flex-shrink-0" />
        <div className="flex-1 flex justify-between">
          {dias.map((d) => <span key={d} className="text-[11px] text-stone-400">{d}</span>)}
        </div>
      </div>
      <div className="flex gap-4 mt-3 text-[11px] text-stone-500">
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-painel-tinta" />esta semana</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-stone-400" />semana passada</span>
      </div>
    </div>
  );
}
