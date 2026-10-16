'use client';

/**
 * Os relatórios que abrem dos cartões do painel do admin: clientes (quem
 * entrou, quem saiu, por loja) e receita (recebido, comissão e repasse por
 * loja, e quem pagou), sempre por período. Mais as listas de contratos e de
 * taxas de todas as lojas.
 *
 * As regras de "entrou" e "saiu" moram no servidor (RelatoriosDoAdmin.java):
 * entrou é o primeiro pagamento num grupo da loja; saiu é a última cota dela na
 * loja cancelada por saída do grupo.
 */

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/api';

// ── Período ─────────────────────────────────────────────────────────────────

type TipoDePeriodo = 'hoje' | 'mes' | 'ano' | 'tudo' | 'personalizado';
export type Periodo = { tipo: TipoDePeriodo; de: string; ate: string };

const OPCOES: { id: TipoDePeriodo; rotulo: string }[] = [
  { id: 'hoje', rotulo: 'Hoje' },
  { id: 'mes', rotulo: 'Este mês' },
  { id: 'ano', rotulo: 'Este ano' },
  { id: 'tudo', rotulo: 'Tudo' },
  { id: 'personalizado', rotulo: 'Personalizado' },
];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function intervalo(p: Periodo): { de?: string; ate?: string } {
  const hoje = new Date();
  if (p.tipo === 'hoje') return { de: iso(hoje), ate: iso(hoje) };
  if (p.tipo === 'mes') return { de: iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), ate: iso(hoje) };
  if (p.tipo === 'ano') return { de: iso(new Date(hoje.getFullYear(), 0, 1)), ate: iso(hoje) };
  if (p.tipo === 'personalizado') return { de: p.de || undefined, ate: p.ate || undefined };
  return {};
}

export function periodoInicial(): Periodo {
  return { tipo: 'mes', de: '', ate: '' };
}

function FiltroDePeriodo({ valor, aoMudar }: { valor: Periodo; aoMudar: (p: Periodo) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPCOES.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => {
            const { de, ate } = intervalo({ ...valor, tipo: o.id === 'personalizado' ? 'mes' : o.id });
            aoMudar(o.id === 'personalizado'
              ? { tipo: 'personalizado', de: valor.de || de || '', ate: valor.ate || ate || '' }
              : { ...valor, tipo: o.id });
          }}
          className={`h-9 px-4 rounded-full text-[12px] font-semibold transition-colors cursor-pointer ${
            valor.tipo === o.id ? 'bg-painel-tinta text-white' : 'bg-white text-painel-tinta ring-1 ring-painel-borda hover:ring-painel-tinta/30'
          }`}
        >
          {o.rotulo}
        </button>
      ))}
      {valor.tipo === 'personalizado' && (
        <div className="flex items-center gap-2 text-[12px] text-stone-500">
          <input type="date" value={valor.de} max={valor.ate || undefined}
            onChange={(e) => aoMudar({ ...valor, de: e.target.value })}
            className="h-9 px-3 rounded-full ring-1 ring-painel-borda bg-white text-painel-tinta" aria-label="Data inicial" />
          até
          <input type="date" value={valor.ate} min={valor.de || undefined}
            onChange={(e) => aoMudar({ ...valor, ate: e.target.value })}
            className="h-9 px-3 rounded-full ring-1 ring-painel-borda bg-white text-painel-tinta" aria-label="Data final" />
        </div>
      )}
    </div>
  );
}

function useRelatorio<T>(caminho: string, periodo: Periodo) {
  const { de, ate } = intervalo(periodo);
  const q = new URLSearchParams();
  if (de) q.set('de', de);
  if (ate) q.set('ate', ate);
  const url = `${caminho}?${q.toString()}`;
  // O resultado guarda de qual endereço veio: enquanto não for o do período
  // atual, a tela está carregando, e os números anteriores seguem à vista.
  const [resultado, setResultado] = useState<{ url: string; dados: T | null; erro: string } | null>(null);

  useEffect(() => {
    let ativo = true;
    apiFetch(url)
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error(d?.erro || 'Não foi possível carregar o relatório agora.');
        if (ativo) setResultado({ url, dados: d as T, erro: '' });
      })
      .catch((e) => {
        if (ativo) setResultado((atual) => ({ url, dados: atual?.dados ?? null,
          erro: e instanceof Error ? e.message : 'Não foi possível carregar o relatório agora.' }));
      });
    return () => { ativo = false; };
  }, [url]);

  const carregando = resultado?.url !== url;
  return { dados: resultado?.dados ?? null, erro: carregando ? '' : resultado?.erro ?? '', carregando };
}

// ── Peças comuns ────────────────────────────────────────────────────────────

const reais = (v: unknown) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const data = (v: unknown, comHora = false) => {
  if (!v) return '—';
  const d = new Date(String(v));
  return comHora
    ? d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR');
};
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function rotuloDoPonto(r: string) {
  if (r.length === 10) return `${r.slice(8, 10)}/${r.slice(5, 7)}`;
  if (r.length === 7) return `${MESES[Number(r.slice(5, 7)) - 1]}/${r.slice(2, 4)}`;
  return r;
}

export function Numero({ rotulo, valor, nota, destaque }: { rotulo: string; valor: React.ReactNode; nota?: React.ReactNode; destaque?: boolean }) {
  return (
    <div className={destaque ? 'cartao-avle-destaque p-5' : 'cartao-avle p-5'}>
      <span className={`block text-[12px] font-medium ${destaque ? 'text-white/60' : 'text-stone-500'}`}>{rotulo}</span>
      <span className={`block text-[22px] sm:text-[26px] font-semibold tracking-tight tabular-nums mt-2 break-words ${destaque ? 'text-white' : 'text-painel-tinta'}`}>{valor}</span>
      {nota && <span className={`block text-[11px] mt-1 ${destaque ? 'text-white/50' : 'text-stone-400'}`}>{nota}</span>}
    </div>
  );
}

function Estado({ carregando, erro, vazio }: { carregando: boolean; erro: string; vazio?: boolean }) {
  if (carregando) return <div className="cartao-avle p-8 text-center text-[12px] text-stone-400">Carregando...</div>;
  if (erro) return <div className="cartao-avle p-6 text-center text-[12px] text-rose-700">{erro}</div>;
  if (vazio) return <div className="cartao-avle p-8 text-center text-[12px] text-stone-400">Nada neste período.</div>;
  return null;
}

function Abas<T extends string>({ abas, ativa, aoTrocar }: { abas: { id: T; rotulo: string; contador?: number }[]; ativa: T; aoTrocar: (id: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {abas.map((a) => (
        <button key={a.id} type="button" onClick={() => aoTrocar(a.id)}
          className={`h-9 px-4 rounded-full text-[12px] font-semibold transition-colors cursor-pointer ${
            ativa === a.id ? 'bg-painel-acento text-white' : 'bg-white text-painel-tinta ring-1 ring-painel-borda hover:ring-painel-tinta/30'
          }`}>
          {a.rotulo}{a.contador != null && <span className="ml-1.5 opacity-70 tabular-nums">{a.contador}</span>}
        </button>
      ))}
    </div>
  );
}

/** Uma lista longa aparece aos poucos: 50 linhas e "mostrar mais". */
function useAosPoucos<T>(itens: T[], passo = 50) {
  // Lista nova (outro filtro, outro período) volta a mostrar só o começo.
  const [estado, setEstado] = useState({ fonte: itens, quantos: passo });
  const quantos = estado.fonte === itens ? estado.quantos : passo;
  return {
    visiveis: itens.slice(0, quantos),
    resto: Math.max(0, itens.length - quantos),
    mais: () => setEstado({ fonte: itens, quantos: quantos + passo }),
  };
}

function MostrarMais({ resto, aoClicar }: { resto: number; aoClicar: () => void }) {
  if (resto <= 0) return null;
  return (
    <button type="button" onClick={aoClicar}
      className="w-full py-3 text-[12px] font-semibold text-painel-tinta hover:bg-painel-papel transition-colors cursor-pointer">
      Mostrar mais ({resto} restantes)
    </button>
  );
}

export function baixarPlanilha(nome: string, linhas: (string | number)[][]) {
  const csv = linhas.map((l) => l.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Barras por período. Com duas séries, a de cima sobe e a de baixo desce a
 * partir da linha do meio: a posição diz qual é qual, e a cor só reforça. O
 * verde da marca e o terracota se confundem para quem não distingue
 * vermelho e verde.
 */
export function GraficoPorPeriodo({ pontos, cima, baixo, formatar = (n) => String(n) }: {
  pontos: { rotulo: string; cima: number; baixo?: number; dica?: string }[];
  cima: string;
  baixo?: string;
  formatar?: (n: number) => string;
}) {
  const [foco, setFoco] = useState<number | null>(null);
  if (pontos.length === 0) return null;
  const maior = Math.max(1, ...pontos.map((p) => Math.max(p.cima, p.baixo ?? 0)));
  const passoDoRotulo = Math.ceil(pontos.length / 12);
  const altura = baixo ? 88 : 150;
  const emFoco = foco != null ? pontos[foco] : null;

  return (
    <div className="cartao-avle p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-4 text-[11px] text-stone-500">
          {baixo ? (
            <>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-painel-tinta" />{cima} (para cima)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-painel-acento" />{baixo} (para baixo)</span>
            </>
          ) : <span className="text-[12px] font-medium text-painel-tinta">{cima}</span>}
        </div>
        <span className="text-[11px] text-stone-500 tabular-nums min-h-[16px]" aria-live="polite">
          {emFoco ? (emFoco.dica ?? `${rotuloDoPonto(emFoco.rotulo)}: ${formatar(emFoco.cima)}${baixo ? ` · ${formatar(emFoco.baixo ?? 0)}` : ''}`) : 'Passe o mouse numa barra'}
        </span>
      </div>
      <div className="flex gap-[2px]" onMouseLeave={() => setFoco(null)}>
        {pontos.map((p, i) => (
          <div key={p.rotulo} className="flex-1 min-w-0 flex flex-col cursor-default" onMouseEnter={() => setFoco(i)}
            title={p.dica ?? `${rotuloDoPonto(p.rotulo)}: ${formatar(p.cima)}${baixo ? ` · ${formatar(p.baixo ?? 0)}` : ''}`}>
            <div className="flex items-end" style={{ height: altura }}>
              <div className={`w-full rounded-t-[4px] bg-painel-tinta transition-opacity ${foco != null && foco !== i ? 'opacity-40' : ''}`}
                style={{ height: p.cima > 0 ? `${Math.max(3, (p.cima / maior) * 100)}%` : 1 }} />
            </div>
            {baixo && (
              <div className="flex items-start border-t border-painel-borda" style={{ height: altura }}>
                <div className={`w-full rounded-b-[4px] bg-painel-acento transition-opacity ${foco != null && foco !== i ? 'opacity-40' : ''}`}
                  style={{ height: (p.baixo ?? 0) > 0 ? `${Math.max(3, ((p.baixo ?? 0) / maior) * 100)}%` : 0 }} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-[2px] mt-2">
        {pontos.map((p, i) => (
          <span key={p.rotulo} className="flex-1 min-w-0 text-center text-[9px] text-stone-400 overflow-visible whitespace-nowrap">
            {i % passoDoRotulo === 0 ? rotuloDoPonto(p.rotulo) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

const th = 'py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-stone-400';
const td = 'py-3 px-4';

// ── Clientes ────────────────────────────────────────────────────────────────

type Pessoa = { usuarioId: number; nome: string; telefone?: string; lojaId: number; loja: string; grupo: string; data?: string; observacao?: string };
type LojaDeClientes = { lojaId: number; nome: string; ativas: number; entraram: number; sairam: number; saldo: number; churn: number };
type DadosDeClientes = {
  ativas: number; entraram: number; sairam: number; churn: number;
  lojas: LojaDeClientes[]; serie: { rotulo: string; entraram: number; sairam: number }[];
  listaEntraram: Pessoa[]; listaSairam: Pessoa[];
};

export function RelatorioDeClientes({ periodo, aoMudarPeriodo, aoAbrirLoja, incompletos }: {
  periodo: Periodo; aoMudarPeriodo: (p: Periodo) => void; aoAbrirLoja: (id: number) => void; incompletos?: React.ReactNode;
}) {
  const { dados, erro, carregando } = useRelatorio<DadosDeClientes>('/api/admin/relatorios/clientes', periodo);
  const [aba, setAba] = useState<'lojas' | 'entraram' | 'sairam' | 'incompletos'>('lojas');
  const [busca, setBusca] = useState('');
  const [lojaFiltro, setLojaFiltro] = useState<number | 'todas'>('todas');

  const lista = useMemo(() => {
    const base = aba === 'entraram' ? dados?.listaEntraram ?? [] : aba === 'sairam' ? dados?.listaSairam ?? [] : [];
    const b = busca.trim().toLowerCase();
    return base.filter((p) => (lojaFiltro === 'todas' || p.lojaId === lojaFiltro) && (!b || p.nome?.toLowerCase().includes(b)));
  }, [dados, aba, busca, lojaFiltro]);
  const { visiveis, resto, mais } = useAosPoucos(lista);

  // Quem mais trouxe clientes, pelas entradas; quem mais perdeu, pelas saídas.
  // O saldo vai na nota: uma loja pode perder muitas e ainda crescer.
  const ganhando = [...(dados?.lojas ?? [])].filter((l) => l.entraram > 0).sort((a, b) => b.entraram - a.entraram || b.saldo - a.saldo).slice(0, 5);
  const perdendo = [...(dados?.lojas ?? [])].filter((l) => l.sairam > 0).sort((a, b) => b.sairam - a.sairam || a.saldo - b.saldo).slice(0, 5);
  const saldo = (n: number) => (n > 0 ? `+${n}` : String(n));

  return (
    <div className="space-y-5 animate-fadeIn">
      <FiltroDePeriodo valor={periodo} aoMudar={aoMudarPeriodo} />
      <Estado carregando={carregando && !dados} erro={erro} />
      {dados && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <Numero destaque rotulo="Clientes ativas hoje" valor={dados.ativas} nota="com cota ativa em algum grupo" />
            <Numero rotulo="Entraram no período" valor={<span className="text-emerald-700">+{dados.entraram}</span>} nota="pelo primeiro pagamento" />
            <Numero rotulo="Saíram no período" valor={<span className="text-painel-acento">−{dados.sairam}</span>} nota="saíram do último grupo da loja" />
            <Numero rotulo="Churn do período" valor={`${Number(dados.churn).toLocaleString('pt-BR')}%`} nota="saídas sobre a carteira do início" />
          </div>

          <GraficoPorPeriodo
            cima="Entraram" baixo="Saíram"
            pontos={dados.serie.map((s) => ({ rotulo: s.rotulo, cima: s.entraram, baixo: s.sairam,
              dica: `${rotuloDoPonto(s.rotulo)}: ${s.entraram} entraram, ${s.sairam} saíram` }))}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RankingDeLojas titulo="Lojas que mais colocaram clientes" vazio="Nenhuma entrada neste período."
              itens={ganhando.map((l) => ({ id: l.lojaId, nome: l.nome, valor: `+${l.entraram}`, nota: `saldo ${saldo(l.saldo)} · ${l.sairam} saíram` }))}
              aoAbrir={aoAbrirLoja} />
            <RankingDeLojas titulo="Lojas que mais perderam clientes" vazio="Nenhuma saída neste período." alerta
              itens={perdendo.map((l) => ({ id: l.lojaId, nome: l.nome, valor: `−${l.sairam}`, nota: `saldo ${saldo(l.saldo)} · churn ${Number(l.churn).toLocaleString('pt-BR')}%` }))}
              aoAbrir={aoAbrirLoja} />
          </div>

          <Abas
            abas={[
              { id: 'lojas', rotulo: 'Por loja', contador: dados.lojas.length },
              { id: 'entraram', rotulo: 'Quem entrou', contador: dados.listaEntraram.length },
              { id: 'sairam', rotulo: 'Quem saiu', contador: dados.listaSairam.length },
              ...(incompletos ? [{ id: 'incompletos' as const, rotulo: 'Não finalizaram o cadastro' }] : []),
            ]}
            ativa={aba} aoTrocar={setAba}
          />

          {aba === 'lojas' && (
            <div className="cartao-avle overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead><tr className="border-b border-painel-borda">
                  <th className={th}>Loja</th><th className={`${th} text-right`}>Ativas</th><th className={`${th} text-right`}>Entraram</th>
                  <th className={`${th} text-right`}>Saíram</th><th className={`${th} text-right`}>Saldo</th><th className={`${th} text-right`}>Churn</th>
                </tr></thead>
                <tbody className="divide-y divide-painel-borda">
                  {dados.lojas.map((l) => (
                    <tr key={l.lojaId} className="hover:bg-painel-papel/60 cursor-pointer" onClick={() => aoAbrirLoja(l.lojaId)}>
                      <td className={`${td} font-semibold text-painel-tinta`}>{l.nome}</td>
                      <td className={`${td} text-right tabular-nums`}>{l.ativas}</td>
                      <td className={`${td} text-right tabular-nums text-emerald-700`}>{l.entraram > 0 ? `+${l.entraram}` : 0}</td>
                      <td className={`${td} text-right tabular-nums text-painel-acento`}>{l.sairam > 0 ? `−${l.sairam}` : 0}</td>
                      <td className={`${td} text-right tabular-nums font-semibold`}>{l.saldo > 0 ? `+${l.saldo}` : l.saldo}</td>
                      <td className={`${td} text-right tabular-nums`}>{Number(l.churn).toLocaleString('pt-BR')}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(aba === 'entraram' || aba === 'sairam') && (
            <div className="cartao-avle overflow-hidden">
              <div className="p-4 flex flex-wrap gap-2 border-b border-painel-borda">
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pelo nome"
                  className="h-9 px-4 rounded-full ring-1 ring-painel-borda bg-white text-[12px] flex-1 min-w-[160px]" />
                <select value={String(lojaFiltro)} onChange={(e) => setLojaFiltro(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}
                  className="h-9 px-3 rounded-full ring-1 ring-painel-borda bg-white text-[12px]">
                  <option value="todas">Todas as lojas</option>
                  {dados.lojas.map((l) => <option key={l.lojaId} value={l.lojaId}>{l.nome}</option>)}
                </select>
                <button type="button" onClick={() => baixarPlanilha(aba === 'entraram' ? 'clientes-que-entraram.csv' : 'clientes-que-sairam.csv',
                  [['Cliente', 'Telefone', 'Loja', 'Grupo', aba === 'entraram' ? 'Entrou em' : 'Saiu em'],
                    ...lista.map((p) => [p.nome, p.telefone ?? '', p.loja, p.grupo, p.data ? data(p.data) : (p.observacao ?? '')])])}
                  className="h-9 px-4 rounded-full bg-painel-tinta text-white text-[12px] font-semibold cursor-pointer">Baixar planilha</button>
              </div>
              {lista.length === 0 ? (
                <p className="p-8 text-center text-[12px] text-stone-400">Ninguém neste período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead><tr className="border-b border-painel-borda">
                      <th className={th}>Cliente</th><th className={th}>Telefone</th><th className={th}>Loja</th><th className={th}>Grupo</th>
                      <th className={th}>{aba === 'entraram' ? 'Entrou em' : 'Saiu em'}</th>
                    </tr></thead>
                    <tbody className="divide-y divide-painel-borda">
                      {visiveis.map((p, i) => (
                        <tr key={`${p.usuarioId}-${p.lojaId}-${i}`}>
                          <td className={`${td} font-semibold text-painel-tinta`}>{p.nome}{p.observacao && aba === 'entraram' && p.observacao !== 'Ativa' && <span className="ml-2 text-[10px] font-medium text-painel-acento">{p.observacao}</span>}</td>
                          <td className={`${td} tabular-nums text-stone-500`}>{p.telefone || '—'}</td>
                          <td className={td}>{p.loja}</td>
                          <td className={`${td} text-stone-500`}>{p.grupo}</td>
                          <td className={`${td} tabular-nums text-stone-500`}>{p.data ? data(p.data) : (p.observacao ?? '—')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <MostrarMais resto={resto} aoClicar={mais} />
                </div>
              )}
            </div>
          )}

          {aba === 'incompletos' && incompletos}
        </>
      )}
    </div>
  );
}

function RankingDeLojas({ titulo, itens, vazio, alerta, aoAbrir }: {
  titulo: string; itens: { id: number; nome: string; valor: string; nota: string }[]; vazio: string; alerta?: boolean; aoAbrir: (id: number) => void;
}) {
  return (
    <div className="cartao-avle p-5">
      <h3 className="text-[13px] font-semibold text-painel-tinta mb-3">{titulo}</h3>
      {itens.length === 0 ? <p className="text-[12px] text-stone-400 py-4">{vazio}</p> : (
        <ol className="space-y-1">
          {itens.map((l, i) => (
            <li key={l.id}>
              <button type="button" onClick={() => aoAbrir(l.id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-[14px] hover:bg-painel-papel transition-colors text-left cursor-pointer">
                <span className="w-6 text-[11px] font-semibold text-stone-400 tabular-nums">{i + 1}º</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold text-painel-tinta truncate">{l.nome}</span>
                  <span className="block text-[11px] text-stone-400">{l.nota}</span>
                </span>
                <span className={`text-[15px] font-semibold tabular-nums ${alerta ? 'text-painel-acento' : 'text-emerald-700'}`}>{l.valor}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ── Receita ─────────────────────────────────────────────────────────────────

type Valores = { recebido: number; comissaoAvle: number; repasseLoja: number; viaAsaas: number; baixaManual: number; comissaoAReceber: number; pagamentos: number };
type LojaDaReceita = Valores & { lojaId: number; nome: string; percentualAvle?: number };
type Pagamento = { id: number; data: string; cliente: string; lojaId: number; loja: string; grupo: string; competencia?: string; valor: number; comissaoAvle: number; repasseLoja: number; forma: string };
type DadosDeReceita = Valores & {
  lojas: LojaDaReceita[]; serie: { rotulo: string; recebido: number; comissaoAvle: number; repasseLoja: number }[];
  listaDePagamentos: Pagamento[]; totalDePagamentos: number;
};

export function RelatorioDeReceita({ periodo, aoMudarPeriodo, aoAbrirLoja, abaInicial = 'lojas' }: {
  periodo: Periodo; aoMudarPeriodo: (p: Periodo) => void; aoAbrirLoja: (id: number) => void; abaInicial?: 'lojas' | 'periodo' | 'pagamentos';
}) {
  const { dados, erro, carregando } = useRelatorio<DadosDeReceita>('/api/admin/relatorios/receita', periodo);
  const [abaEscolhida, setAba] = useState<{ de: typeof abaInicial; aba: typeof abaInicial }>({ de: abaInicial, aba: abaInicial });
  // Abrir de outro cartão (que pede outra aba) vale mais que a aba escolhida antes.
  const aba = abaEscolhida.de === abaInicial ? abaEscolhida.aba : abaInicial;
  const trocarAba = (a: typeof abaInicial) => setAba({ de: abaInicial, aba: a });
  const [medida, setMedida] = useState<'recebido' | 'comissaoAvle' | 'repasseLoja'>('recebido');
  const [busca, setBusca] = useState('');
  const [lojaFiltro, setLojaFiltro] = useState<number | 'todas'>('todas');

  const pagamentos = useMemo(() => {
    const b = busca.trim().toLowerCase();
    return (dados?.listaDePagamentos ?? []).filter((p) => (lojaFiltro === 'todas' || p.lojaId === lojaFiltro) && (!b || p.cliente?.toLowerCase().includes(b)));
  }, [dados, busca, lojaFiltro]);
  const { visiveis, resto, mais } = useAosPoucos(pagamentos);
  const somaFiltrada = pagamentos.reduce((s, p) => s + Number(p.valor), 0);

  const NOMES = { recebido: 'Recebido', comissaoAvle: 'Comissão da AVLE', repasseLoja: 'Parte das lojas' };

  return (
    <div className="space-y-5 animate-fadeIn">
      <FiltroDePeriodo valor={periodo} aoMudar={aoMudarPeriodo} />
      <Estado carregando={carregando && !dados} erro={erro} />
      {dados && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <Numero destaque rotulo="Recebido no período" valor={reais(dados.recebido)} nota={`${dados.pagamentos} pagamento(s)`} />
            <Numero rotulo="Comissão da AVLE" valor={<span className="text-emerald-700">{reais(dados.comissaoAvle)}</span>} nota="a parte da AVLE do que entrou" />
            <Numero rotulo="Repassado às lojas" valor={reais(dados.repasseLoja)} nota="a parte das lojas, na conta delas" />
            <Numero rotulo="Comissão a receber" valor={<span className={Number(dados.comissaoAReceber) > 0 ? 'text-amber-700' : ''}>{reais(dados.comissaoAReceber)}</span>}
              nota={`de ${reais(dados.baixaManual)} em baixa manual`} />
          </div>

          <Abas
            abas={[
              { id: 'lojas', rotulo: 'Por loja', contador: dados.lojas.length },
              { id: 'periodo', rotulo: 'Por período' },
              { id: 'pagamentos', rotulo: 'Quem pagou', contador: dados.totalDePagamentos },
            ]}
            ativa={aba} aoTrocar={trocarAba}
          />

          {aba === 'lojas' && (
            <div className="cartao-avle overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead><tr className="border-b border-painel-borda">
                  <th className={th}>Loja</th><th className={`${th} text-right`}>Recebido</th><th className={`${th} text-right`}>Comissão AVLE</th>
                  <th className={`${th} text-right`}>Repassado à loja</th><th className={`${th} text-right`}>Pelo Asaas</th>
                  <th className={`${th} text-right`}>Baixa manual</th><th className={`${th} text-right`}>A receber</th>
                </tr></thead>
                <tbody className="divide-y divide-painel-borda">
                  {dados.lojas.map((l) => (
                    <tr key={l.lojaId} className="hover:bg-painel-papel/60 cursor-pointer"
                      onClick={() => { setLojaFiltro(l.lojaId); trocarAba('pagamentos'); }}>
                      <td className={td}>
                        <span className="block font-semibold text-painel-tinta">{l.nome}</span>
                        <span className="block text-[10px] text-stone-400">{l.pagamentos} pagamento(s){l.percentualAvle != null && ` · taxa ${Number(l.percentualAvle).toLocaleString('pt-BR')}%`}</span>
                      </td>
                      <td className={`${td} text-right tabular-nums font-semibold`}>{reais(l.recebido)}</td>
                      <td className={`${td} text-right tabular-nums text-emerald-700`}>{reais(l.comissaoAvle)}</td>
                      <td className={`${td} text-right tabular-nums`}>{reais(l.repasseLoja)}</td>
                      <td className={`${td} text-right tabular-nums text-stone-500`}>{reais(l.viaAsaas)}</td>
                      <td className={`${td} text-right tabular-nums text-stone-500`}>{reais(l.baixaManual)}</td>
                      <td className={`${td} text-right tabular-nums ${Number(l.comissaoAReceber) > 0 ? 'text-amber-700 font-semibold' : 'text-stone-300'}`}>{reais(l.comissaoAReceber)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-4 py-3 text-[11px] text-stone-400 border-t border-painel-borda">Clique numa loja para ver quem pagou.</p>
            </div>
          )}

          {aba === 'periodo' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(NOMES) as (keyof typeof NOMES)[]).map((m) => (
                  <button key={m} type="button" onClick={() => setMedida(m)}
                    className={`h-8 px-3 rounded-full text-[11px] font-semibold cursor-pointer ${medida === m ? 'bg-painel-tinta text-white' : 'bg-white ring-1 ring-painel-borda text-painel-tinta'}`}>
                    {NOMES[m]}
                  </button>
                ))}
              </div>
              <GraficoPorPeriodo cima={NOMES[medida]} formatar={reais}
                pontos={dados.serie.map((s) => ({ rotulo: s.rotulo, cima: Number(s[medida]) || 0,
                  dica: `${rotuloDoPonto(s.rotulo)}: recebido ${reais(s.recebido)} · AVLE ${reais(s.comissaoAvle)} · lojas ${reais(s.repasseLoja)}` }))} />
              <div className="cartao-avle overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead><tr className="border-b border-painel-borda">
                    <th className={th}>Período</th><th className={`${th} text-right`}>Recebido</th><th className={`${th} text-right`}>Comissão AVLE</th><th className={`${th} text-right`}>Parte das lojas</th>
                  </tr></thead>
                  <tbody className="divide-y divide-painel-borda">
                    {[...dados.serie].reverse().filter((s) => Number(s.recebido) > 0).map((s) => (
                      <tr key={s.rotulo}>
                        <td className={`${td} font-semibold text-painel-tinta`}>{rotuloDoPonto(s.rotulo)}</td>
                        <td className={`${td} text-right tabular-nums font-semibold`}>{reais(s.recebido)}</td>
                        <td className={`${td} text-right tabular-nums text-emerald-700`}>{reais(s.comissaoAvle)}</td>
                        <td className={`${td} text-right tabular-nums`}>{reais(s.repasseLoja)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {aba === 'pagamentos' && (
            <div className="cartao-avle overflow-hidden">
              <div className="p-4 flex flex-wrap gap-2 items-center border-b border-painel-borda">
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pela cliente"
                  className="h-9 px-4 rounded-full ring-1 ring-painel-borda bg-white text-[12px] flex-1 min-w-[160px]" />
                <select value={String(lojaFiltro)} onChange={(e) => setLojaFiltro(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}
                  className="h-9 px-3 rounded-full ring-1 ring-painel-borda bg-white text-[12px]">
                  <option value="todas">Todas as lojas</option>
                  {dados.lojas.map((l) => <option key={l.lojaId} value={l.lojaId}>{l.nome}</option>)}
                </select>
                <button type="button" onClick={() => baixarPlanilha('pagamentos.csv',
                  [['Data', 'Cliente', 'Loja', 'Grupo', 'Competência', 'Valor', 'Comissão AVLE', 'Parte da loja', 'Forma'],
                    ...pagamentos.map((p) => [data(p.data, true), p.cliente, p.loja, p.grupo, p.competencia ?? '',
                      Number(p.valor).toFixed(2).replace('.', ','), Number(p.comissaoAvle).toFixed(2).replace('.', ','),
                      Number(p.repasseLoja).toFixed(2).replace('.', ','), p.forma])])}
                  className="h-9 px-4 rounded-full bg-painel-tinta text-white text-[12px] font-semibold cursor-pointer">Baixar planilha</button>
                <span className="w-full text-[11px] text-stone-500">
                  {pagamentos.length} pagamento(s) · {reais(somaFiltrada)}
                  {dados.totalDePagamentos > dados.listaDePagamentos.length && ` · mostrando os ${dados.listaDePagamentos.length} mais recentes de ${dados.totalDePagamentos}; escolha um período menor para ver todos`}
                </span>
              </div>
              {pagamentos.length === 0 ? (
                <p className="p-8 text-center text-[12px] text-stone-400">Nenhum pagamento neste período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead><tr className="border-b border-painel-borda">
                      <th className={th}>Data</th><th className={th}>Cliente</th><th className={th}>Loja · grupo</th><th className={th}>Mês</th>
                      <th className={`${th} text-right`}>Valor</th><th className={`${th} text-right`}>AVLE</th><th className={th}>Forma</th>
                    </tr></thead>
                    <tbody className="divide-y divide-painel-borda">
                      {visiveis.map((p) => (
                        <tr key={p.id}>
                          <td className={`${td} tabular-nums text-stone-500 whitespace-nowrap`}>{data(p.data, true)}</td>
                          <td className={`${td} font-semibold text-painel-tinta`}>{p.cliente}</td>
                          <td className={td}><span className="block">{p.loja}</span><span className="block text-[10px] text-stone-400">{p.grupo}</span></td>
                          <td className={`${td} tabular-nums text-stone-500`}>{p.competencia ? rotuloDoPonto(p.competencia) : '—'}</td>
                          <td className={`${td} text-right tabular-nums font-semibold`}>{reais(p.valor)}</td>
                          <td className={`${td} text-right tabular-nums text-emerald-700`}>{reais(p.comissaoAvle)}</td>
                          <td className={`${td} text-[11px] ${p.forma === 'Baixa manual' ? 'text-amber-700' : 'text-stone-500'}`}>{p.forma}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <MostrarMais resto={resto} aoClicar={mais} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Contratos ───────────────────────────────────────────────────────────────

type ContratoDaLoja = {
  lojaId: number; nome: string; razaoSocial?: string; cnpj?: string; enderecoSede?: string; percentualAvle?: number;
  exigido: boolean; aceitoEm?: string; aceitoPor?: string; versao?: string; percentualDoContrato?: number;
  conviteExpiraEm?: string; situacao: 'ACEITO' | 'SEM_CONTRATO' | 'AGUARDANDO_ACEITE' | 'CONVITE_VENCIDO'; temAcesso: boolean;
};

const SITUACAO: Record<ContratoDaLoja['situacao'], { texto: string; classe: string }> = {
  ACEITO: { texto: 'Aceito', classe: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  AGUARDANDO_ACEITE: { texto: 'Aguardando aceite', classe: 'bg-amber-50 text-amber-800 ring-amber-100' },
  CONVITE_VENCIDO: { texto: 'Convite vencido', classe: 'bg-rose-50 text-rose-700 ring-rose-100' },
  SEM_CONTRATO: { texto: 'Sem contrato', classe: 'bg-stone-100 text-stone-600 ring-stone-200' },
};

export function ContratosDasLojas({ aoAbrirLoja }: { aoAbrirLoja: (id: number) => void }) {
  const [lojas, setLojas] = useState<ContratoDaLoja[] | null>(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [editando, setEditando] = useState<ContratoDaLoja | null>(null);
  const [razao, setRazao] = useState('');
  const [sede, setSede] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const carregar = () => {
    apiFetch('/api/admin/contratos')
      .then(async (r) => { const d = await r.json().catch(() => null); if (!r.ok) throw new Error(d?.erro); return d; })
      .then(setLojas)
      .catch((e) => setErro(e?.message || 'Não foi possível carregar os contratos agora.'));
  };
  useEffect(carregar, []);

  const novoConvite = async (l: ContratoDaLoja) => {
    setOcupado(true); setErro(''); setAviso('');
    try {
      const r = await apiFetch(`/api/admin/lojas/${l.lojaId}/convite`, { method: 'POST' });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.erro || 'Não foi possível gerar o convite.');
      await navigator.clipboard?.writeText(d.link).catch(() => {});
      setAviso(`Convite novo de ${l.nome} copiado. Vale até ${data(d.expiraEm)}. O link anterior deixou de valer.\n${d.link}`);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar o convite.');
    } finally {
      setOcupado(false);
    }
  };

  const abrirExigir = async (l: ContratoDaLoja) => {
    setEditando(l); setRazao(l.razaoSocial || ''); setSede(l.enderecoSede || ''); setErro(''); setAviso('');
    // Preenche pela Receita o que faltar, como no cadastro da loja.
    const cnpj = (l.cnpj || '').replace(/\D/g, '');
    if (cnpj.length !== 14 || (l.razaoSocial && l.enderecoSede)) return;
    try {
      const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!r.ok) return;
      const d = await r.json();
      if (d.razao_social) setRazao((a) => a || String(d.razao_social));
      const rua = [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' ');
      const endereco = [rua, d.numero, d.complemento, d.bairro, d.municipio && d.uf ? `${d.municipio}/${d.uf}` : d.municipio,
        d.cep ? `CEP ${String(d.cep).replace(/^(\d{5})(\d{3})$/, '$1-$2')}` : null]
        .map((p: unknown) => (p ? String(p).trim() : '')).filter(Boolean).join(', ');
      if (endereco) setSede((a) => a || endereco);
    } catch {
      // Sem a Receita, o admin digita.
    }
  };

  const exigir = async () => {
    if (!editando) return;
    setOcupado(true); setErro('');
    try {
      const r = await apiFetch(`/api/admin/lojas/${editando.lojaId}/contrato/exigir`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razaoSocial: razao, enderecoSede: sede }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.erro || 'Não foi possível pedir o aceite.');
      setAviso(`${editando.nome}: ${d.mensagem}`);
      setEditando(null);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível pedir o aceite.');
    } finally {
      setOcupado(false);
    }
  };

  const contagem = (s: ContratoDaLoja['situacao']) => (lojas ?? []).filter((l) => l.situacao === s).length;

  return (
    <div className="space-y-5 animate-fadeIn">
      {lojas && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Numero destaque rotulo="Contratos aceitos" valor={contagem('ACEITO')} nota={`de ${lojas.length} loja(s)`} />
          <Numero rotulo="Aguardando aceite" valor={contagem('AGUARDANDO_ACEITE')} />
          <Numero rotulo="Convite vencido" valor={contagem('CONVITE_VENCIDO')} />
          <Numero rotulo="Sem contrato" valor={contagem('SEM_CONTRATO')} nota="entraram antes do contrato" />
        </div>
      )}
      {erro && <p className="p-3 rounded-xl text-[12px] font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-100">{erro}</p>}
      {aviso && <p className="p-3 rounded-xl text-[12px] font-semibold bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 whitespace-pre-line break-all">{aviso}</p>}

      {editando && (
        <div className="cartao-avle p-5 space-y-3">
          <h3 className="text-[14px] font-semibold text-painel-tinta">Pedir o aceite do contrato · {editando.nome}</h3>
          <p className="text-[12px] text-stone-500 leading-relaxed">
            Na próxima vez que a dona abrir o painel, o contrato aparece preenchido com estes dados e com a taxa de{' '}
            <strong>{Number(editando.percentualAvle ?? 10).toLocaleString('pt-BR')}%</strong>, e o painel só libera depois do aceite.
          </p>
          <label className="block text-[11px] font-semibold text-stone-500">Razão social
            <input value={razao} onChange={(e) => setRazao(e.target.value)} className="mt-1 w-full h-10 px-4 rounded-full ring-1 ring-painel-borda bg-white text-[13px] font-normal text-painel-tinta" />
          </label>
          <label className="block text-[11px] font-semibold text-stone-500">Endereço da sede
            <input value={sede} onChange={(e) => setSede(e.target.value)} className="mt-1 w-full h-10 px-4 rounded-full ring-1 ring-painel-borda bg-white text-[13px] font-normal text-painel-tinta" />
          </label>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditando(null)} className="h-10 px-5 rounded-full ring-1 ring-painel-borda text-[12px] font-semibold cursor-pointer">Cancelar</button>
            <button type="button" disabled={ocupado || !razao.trim() || !sede.trim()} onClick={exigir}
              className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold disabled:opacity-50 cursor-pointer">Pedir o aceite</button>
          </div>
        </div>
      )}

      {!lojas && !erro && <Estado carregando erro="" />}
      {lojas && (
        <div className="cartao-avle overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead><tr className="border-b border-painel-borda">
              <th className={th}>Loja</th><th className={th}>Situação</th><th className={th}>Aceite</th><th className={`${th} text-right`}>Taxa</th><th className={th} />
            </tr></thead>
            <tbody className="divide-y divide-painel-borda">
              {lojas.map((l) => (
                <tr key={l.lojaId}>
                  <td className={td}>
                    <span className="block font-semibold text-painel-tinta">{l.nome}</span>
                    <span className="block text-[10px] text-stone-400">{l.razaoSocial || 'Razão social não informada'} · {l.cnpj || 'sem CNPJ'}</span>
                  </td>
                  <td className={td}>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold ring-1 ${SITUACAO[l.situacao].classe}`}>{SITUACAO[l.situacao].texto}</span>
                    {l.situacao === 'AGUARDANDO_ACEITE' && l.conviteExpiraEm && <span className="block text-[10px] text-stone-400 mt-1">convite até {data(l.conviteExpiraEm)}</span>}
                  </td>
                  <td className={`${td} text-stone-500`}>
                    {l.aceitoEm ? <><span className="block tabular-nums">{data(l.aceitoEm, true)}</span><span className="block text-[10px]">{l.aceitoPor} · versão {l.versao}</span></> : '—'}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>
                    {Number(l.aceitoEm ? l.percentualDoContrato ?? l.percentualAvle : l.percentualAvle).toLocaleString('pt-BR')}%
                  </td>
                  <td className={`${td} text-right whitespace-nowrap`}>
                    <div className="flex justify-end gap-2">
                      {l.situacao === 'SEM_CONTRATO' && (
                        <button type="button" disabled={ocupado} onClick={() => abrirExigir(l)}
                          className="h-8 px-3 rounded-full bg-painel-tinta text-white text-[11px] font-semibold disabled:opacity-50 cursor-pointer">Pedir aceite</button>
                      )}
                      {(l.situacao === 'AGUARDANDO_ACEITE' || l.situacao === 'CONVITE_VENCIDO') && !l.temAcesso && (
                        <button type="button" disabled={ocupado} onClick={() => novoConvite(l)}
                          className="h-8 px-3 rounded-full bg-painel-tinta text-white text-[11px] font-semibold disabled:opacity-50 cursor-pointer">Novo convite</button>
                      )}
                      <button type="button" onClick={() => aoAbrirLoja(l.lojaId)}
                        className="h-8 px-3 rounded-full ring-1 ring-painel-borda text-[11px] font-semibold text-painel-tinta cursor-pointer">Ver contrato</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Taxas ───────────────────────────────────────────────────────────────────

export function TaxasDasLojas({ lojas, aoSalvar }: { lojas: { id: number; nomeComercial: string; percentualAvle?: number }[]; aoSalvar: () => void }) {
  // Só o que foi digitado; o resto mostra a taxa atual da loja.
  const [digitado, setValores] = useState<Record<number, string>>({});
  const valores: Record<number, string> = Object.fromEntries(
    lojas.map((l) => [l.id, digitado[l.id] ?? String(l.percentualAvle ?? 10).replace('.', ',')]));
  const [estado, setEstado] = useState<Record<number, { ok?: string; erro?: string; salvando?: boolean }>>({});

  const salvar = async (id: number) => {
    setEstado((e) => ({ ...e, [id]: { salvando: true } }));
    try {
      const r = await apiFetch(`/api/admin/lojas/${id}/percentual-avle`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ percentual: valores[id] }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.erro || 'Não foi possível salvar.');
      setEstado((e) => ({ ...e, [id]: { ok: d?.mensagem || 'Salvo.' } }));
      aoSalvar();
    } catch (err) {
      setEstado((e) => ({ ...e, [id]: { erro: err instanceof Error ? err.message : 'Não foi possível salvar.' } }));
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <p className="text-[12px] text-stone-500 leading-relaxed max-w-3xl">
        A taxa da AVLE de cada loja, sobre cada parcela paga. A nova taxa vale para os <strong>grupos que a loja criar daqui em
        diante</strong>: cada grupo guarda a taxa do dia em que nasceu, para não mudar o combinado de quem já entrou. A taxa de
        cada grupo existente aparece na ficha da loja.
      </p>
      <div className="cartao-avle overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead><tr className="border-b border-painel-borda">
            <th className={th}>Loja</th><th className={`${th} text-right`}>Taxa atual</th><th className={th}>Nova taxa</th><th className={th} />
          </tr></thead>
          <tbody className="divide-y divide-painel-borda">
            {lojas.map((l) => {
              const v = valores[l.id] ?? '';
              const n = Number(v.replace(',', '.'));
              const valido = v.trim() !== '' && n >= 0 && n < 100;
              const mudou = valido && n !== Number(l.percentualAvle ?? 10);
              const e = estado[l.id] ?? {};
              return (
                <tr key={l.id}>
                  <td className={`${td} font-semibold text-painel-tinta`}>{l.nomeComercial}</td>
                  <td className={`${td} text-right tabular-nums`}>{Number(l.percentualAvle ?? 10).toLocaleString('pt-BR')}%</td>
                  <td className={td}>
                    <div className="flex items-center gap-1.5">
                      <input value={v} inputMode="decimal" aria-label={`Nova taxa de ${l.nomeComercial}`}
                        onChange={(ev) => setValores((x) => ({ ...x, [l.id]: ev.target.value.replace(/[^\d,.]/g, '') }))}
                        className="w-20 h-9 px-3 rounded-full ring-1 ring-painel-borda bg-white text-[13px] tabular-nums text-right" />
                      <span className="text-stone-400">%</span>
                    </div>
                    {e.erro && <span className="block text-[10px] text-rose-700 mt-1">{e.erro}</span>}
                    {e.ok && <span className="block text-[10px] text-emerald-700 mt-1">{e.ok}</span>}
                  </td>
                  <td className={`${td} text-right`}>
                    <button type="button" disabled={!mudou || e.salvando} onClick={() => salvar(l.id)}
                      className="h-8 px-4 rounded-full bg-painel-tinta text-white text-[11px] font-semibold disabled:opacity-30 cursor-pointer">
                      {e.salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
