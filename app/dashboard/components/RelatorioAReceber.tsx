'use client';

/**
 * Contas a receber da loja: quanto falta entrar de cada grupo, quanto já venceu
 * e não entrou, quando o resto deve entrar e quem concentra o atraso.
 *
 * Segue o que um relatório de contas a receber costuma ter (posição da
 * carteira, aging, previsão de recebimento, concentração), mais o que é de
 * grupo: a parte da loja e a da AVLE, e o saldo de quem já foi contemplada.
 * As contas são do servidor (RelatorioDeRecebiveis.java).
 */

import { Fragment, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { GraficoPorPeriodo, Numero, baixarPlanilha, rotuloDoPonto } from './RelatoriosDoAdmin';

type Totais = {
  contratado: number; recebido: number; aReceber: number; vencido: number; aVencer: number;
  comissaoAvleAReceber: number; parteDaLojaAReceber: number; previstoProximoMes: number;
  percentualRecebido: number; inadimplencia: number; cotas: number; cotasEmAtraso: number; cotasQuitadas: number;
  contempladas: number; contempladasComSaldo: number; saldoContempladas: number; saldoContempladasQueRetiraram: number;
};
type ClienteDoGrupo = {
  cotaId: number; cliente: string; telefone?: string; parcelasPagas: number; parcelasEsperadas: number; parcelasTotal: number;
  parcelasEmAtraso: number; situacao: string; recebido: number; vencido: number; aReceber: number; contemplada: boolean; retirou: boolean;
};
type GrupoAReceber = Totais & {
  grupoId: number; nome: string; status?: string; valorParcela: number; percentualAvle?: number; duracaoMeses: number;
  inicio?: string; termino?: string; mesDoGrupo?: number; vagas?: number; clientes: ClienteDoGrupo[];
};
type Relatorio = {
  dataReferencia: string; resumo: Totais;
  aging: { faixa: string; cotas: number; valor: number; percentual: number }[];
  previsao: { competencia: string; valor: number; comissaoAvle: number; parteDaLoja: number; parcelas: number }[];
  previstoDepois: number;
  concentracao: { cliente: string; grupo: string; vencido: number; parcelasEmAtraso: number; percentualDoVencido: number }[];
  concentracaoTop5: number;
  grupos: GrupoAReceber[];
};

const reais = (v: unknown) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: unknown) => `${(Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const th = 'py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-stone-400 whitespace-nowrap';
const td = 'py-3 px-4';

const SITUACAO: Record<string, { texto: string; classe: string }> = {
  EM_DIA: { texto: 'Em dia', classe: 'text-emerald-700' },
  ADIANTADA: { texto: 'Adiantada', classe: 'text-emerald-700' },
  QUITADA: { texto: 'Quitada', classe: 'text-stone-500' },
  EM_ATRASO: { texto: 'Em atraso', classe: 'text-amber-700 font-semibold' },
  INDEFINIDA: { texto: '—', classe: 'text-stone-400' },
};

function Secao({ titulo, descricao, children, acao }: { titulo: string; descricao?: string; children: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold text-painel-tinta">{titulo}</h3>
          {descricao && <p className="text-[12px] text-stone-500 mt-0.5 max-w-3xl leading-relaxed">{descricao}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

export default function RelatorioAReceber({ lojaId }: { lojaId: number }) {
  const [dados, setDados] = useState<Relatorio | null>(null);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;
    apiFetch(`/api/financeiro/loja/${lojaId}/a-receber`)
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error(d?.erro || 'Não foi possível carregar o relatório agora.');
        if (ativo) setDados(d);
      })
      .catch((e) => ativo && setErro(e instanceof Error ? e.message : 'Não foi possível carregar o relatório agora.'));
    return () => { ativo = false; };
  }, [lojaId]);

  if (erro) return <div className="cartao-avle p-6 text-center text-[12px] text-rose-700">{erro}</div>;
  if (!dados) return <div className="cartao-avle p-8 text-center text-[12px] text-stone-400">Montando o relatório...</div>;

  const r = dados.resumo;
  const referencia = new Date(`${dados.dataReferencia}T12:00:00`).toLocaleDateString('pt-BR');

  const planilha = () => baixarPlanilha(`a-receber-${dados.dataReferencia}.csv`, [
    ['Grupo', 'Cliente', 'Telefone', 'Parcelas pagas', 'Parcelas que já deviam estar pagas', 'Total de parcelas', 'Parcelas em atraso',
      'Situação', 'Recebido', 'Vencido', 'Falta receber', 'Contemplada', 'Retirou o produto'],
    ...dados.grupos.flatMap((g) => g.clientes.map((c) => [
      g.nome, c.cliente, c.telefone ?? '', c.parcelasPagas, c.parcelasEsperadas, c.parcelasTotal, c.parcelasEmAtraso,
      SITUACAO[c.situacao]?.texto ?? c.situacao, Number(c.recebido).toFixed(2).replace('.', ','),
      Number(c.vencido).toFixed(2).replace('.', ','), Number(c.aReceber).toFixed(2).replace('.', ','),
      c.contemplada ? 'Sim' : 'Não', c.retirou ? 'Sim' : 'Não',
    ])),
  ]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-stone-500">
          Posição de <strong className="text-painel-tinta">{referencia}</strong> · {r.cotas} cota(s) na carteira, em {dados.grupos.length} grupo(s)
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={planilha} className="h-9 px-4 rounded-full bg-painel-tinta text-white text-[12px] font-semibold cursor-pointer">
            Baixar planilha
          </button>
          <button type="button" onClick={() => window.print()} className="h-9 px-4 rounded-full ring-1 ring-painel-borda bg-white text-painel-tinta text-[12px] font-semibold cursor-pointer">
            Imprimir
          </button>
        </div>
      </div>

      {/* ── Posição da carteira ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Numero destaque rotulo="Falta receber" valor={reais(r.aReceber)}
          nota={`${reais(r.parteDaLojaAReceber)} da loja · ${reais(r.comissaoAvleAReceber)} da AVLE`} />
        <Numero rotulo="Vencido, sem pagar" valor={<span className={Number(r.vencido) > 0 ? 'text-amber-700' : ''}>{reais(r.vencido)}</span>}
          nota={`inadimplência de ${pct(r.inadimplencia)} · ${r.cotasEmAtraso} cota(s) em atraso`} />
        <Numero rotulo="A vencer" valor={reais(r.aVencer)} nota={`${reais(r.previstoProximoMes)} previstos no mês que vem`} />
        <Numero rotulo="Já recebido" valor={reais(r.recebido)} nota={`${pct(r.percentualRecebido)} do contratado (${reais(r.contratado)})`} />
      </div>

      {/* ── Por grupo ── */}
      <Secao titulo="Quanto falta receber de cada grupo"
        descricao="Clique num grupo para ver cliente por cliente. Vencido é o que já devia ter sido pago até hoje; a vencer são as parcelas que ainda vão vencer até o fim do grupo.">
        <div className="cartao-avle overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead><tr className="border-b border-painel-borda">
              <th className={th}>Grupo</th><th className={`${th} text-right`}>Cotas</th><th className={`${th} text-right`}>Recebido</th>
              <th className={`${th} text-right`}>Vencido</th><th className={`${th} text-right`}>A vencer</th>
              <th className={`${th} text-right`}>Falta receber</th><th className={`${th} text-right`}>Parte da loja</th>
              <th className={`${th} text-right`}>Mês que vem</th><th className={`${th} text-right`}>Inadimpl.</th>
            </tr></thead>
            <tbody className="divide-y divide-painel-borda">
              {dados.grupos.map((g) => (
                <Fragment key={g.grupoId}>
                  <tr className="hover:bg-painel-papel/60 cursor-pointer" onClick={() => setAberto(aberto === g.grupoId ? null : g.grupoId)}>
                    <td className={td}>
                      <span className="block font-semibold text-painel-tinta">{aberto === g.grupoId ? '▾' : '▸'} {g.nome}</span>
                      <span className="block text-[10px] text-stone-400">
                        {reais(g.valorParcela)} × {g.duracaoMeses} meses
                        {g.mesDoGrupo != null && ` · mês ${g.mesDoGrupo} de ${g.duracaoMeses}`}
                        {g.termino && ` · última parcela em ${rotuloDoPonto(g.termino)}`}
                      </span>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{g.cotas}{g.vagas ? <span className="text-stone-400">/{g.vagas}</span> : null}</td>
                    <td className={`${td} text-right tabular-nums`}>
                      {reais(g.recebido)}<span className="block text-[10px] text-stone-400">{pct(g.percentualRecebido)}</span>
                    </td>
                    <td className={`${td} text-right tabular-nums ${Number(g.vencido) > 0 ? 'text-amber-700 font-semibold' : 'text-stone-300'}`}>
                      {reais(g.vencido)}{g.cotasEmAtraso > 0 && <span className="block text-[10px] font-normal">{g.cotasEmAtraso} em atraso</span>}
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{reais(g.aVencer)}</td>
                    <td className={`${td} text-right tabular-nums font-semibold text-painel-tinta`}>{reais(g.aReceber)}</td>
                    <td className={`${td} text-right tabular-nums text-emerald-700`}>{reais(g.parteDaLojaAReceber)}</td>
                    <td className={`${td} text-right tabular-nums`}>{reais(g.previstoProximoMes)}</td>
                    <td className={`${td} text-right tabular-nums`}>{pct(g.inadimplencia)}</td>
                  </tr>
                  {aberto === g.grupoId && (
                    <tr>
                      <td colSpan={9} className="bg-painel-papel/50 p-0">
                        {g.clientes.length === 0 ? (
                          <p className="p-5 text-[12px] text-stone-400">Nenhuma cota na carteira deste grupo.</p>
                        ) : (
                          <table className="w-full text-left text-[12px]">
                            <thead><tr className="border-b border-painel-borda">
                              <th className={th}>Cliente</th><th className={`${th} text-right`}>Parcelas pagas</th><th className={th}>Situação</th>
                              <th className={`${th} text-right`}>Recebido</th><th className={`${th} text-right`}>Vencido</th><th className={`${th} text-right`}>Falta receber</th>
                            </tr></thead>
                            <tbody className="divide-y divide-painel-borda">
                              {g.clientes.map((c) => (
                                <tr key={c.cotaId}>
                                  <td className={td}>
                                    <span className="block font-semibold text-painel-tinta">{c.cliente}</span>
                                    <span className="block text-[10px] text-stone-400">
                                      Cota #{c.cotaId}{c.contemplada && (c.retirou ? ' · contemplada, já retirou' : ' · contemplada')}
                                    </span>
                                  </td>
                                  <td className={`${td} text-right tabular-nums`}>{c.parcelasPagas} de {c.parcelasTotal}</td>
                                  <td className={`${td} ${SITUACAO[c.situacao]?.classe ?? ''}`}>
                                    {SITUACAO[c.situacao]?.texto ?? c.situacao}
                                    {c.parcelasEmAtraso > 0 && <span className="block text-[10px]">{c.parcelasEmAtraso} parcela(s) atrasada(s)</span>}
                                  </td>
                                  <td className={`${td} text-right tabular-nums`}>{reais(c.recebido)}</td>
                                  <td className={`${td} text-right tabular-nums ${Number(c.vencido) > 0 ? 'text-amber-700 font-semibold' : 'text-stone-300'}`}>{reais(c.vencido)}</td>
                                  <td className={`${td} text-right tabular-nums`}>{reais(c.aReceber)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
            <tfoot><tr className="border-t-2 border-painel-borda font-semibold text-painel-tinta">
              <td className={td}>Total</td><td className={`${td} text-right tabular-nums`}>{r.cotas}</td>
              <td className={`${td} text-right tabular-nums`}>{reais(r.recebido)}</td><td className={`${td} text-right tabular-nums text-amber-700`}>{reais(r.vencido)}</td>
              <td className={`${td} text-right tabular-nums`}>{reais(r.aVencer)}</td><td className={`${td} text-right tabular-nums`}>{reais(r.aReceber)}</td>
              <td className={`${td} text-right tabular-nums text-emerald-700`}>{reais(r.parteDaLojaAReceber)}</td>
              <td className={`${td} text-right tabular-nums`}>{reais(r.previstoProximoMes)}</td><td className={`${td} text-right tabular-nums`}>{pct(r.inadimplencia)}</td>
            </tr></tfoot>
          </table>
        </div>
      </Secao>

      {/* ── Previsão ── */}
      <Secao titulo="Previsão de recebimento, mês a mês"
        descricao="As parcelas que vencem em cada um dos próximos 12 meses, se todas forem pagas em dia. O vencido não entra aqui: ele aparece no aging, abaixo.">
        <GraficoPorPeriodo cima="Previsto por mês" formatar={reais}
          pontos={dados.previsao.map((p) => ({ rotulo: p.competencia, cima: Number(p.valor),
            dica: `${rotuloDoPonto(p.competencia)}: ${reais(p.valor)} em ${p.parcelas} parcela(s) · loja ${reais(p.parteDaLoja)} · AVLE ${reais(p.comissaoAvle)}` }))} />
        <div className="cartao-avle overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead><tr className="border-b border-painel-borda">
              <th className={th}>Mês</th><th className={`${th} text-right`}>Parcelas</th><th className={`${th} text-right`}>Previsto</th>
              <th className={`${th} text-right`}>Parte da loja</th><th className={`${th} text-right`}>Parte da AVLE</th>
            </tr></thead>
            <tbody className="divide-y divide-painel-borda">
              {dados.previsao.map((p) => (
                <tr key={p.competencia}>
                  <td className={`${td} font-semibold text-painel-tinta`}>{rotuloDoPonto(p.competencia)}</td>
                  <td className={`${td} text-right tabular-nums`}>{p.parcelas}</td>
                  <td className={`${td} text-right tabular-nums font-semibold`}>{reais(p.valor)}</td>
                  <td className={`${td} text-right tabular-nums text-emerald-700`}>{reais(p.parteDaLoja)}</td>
                  <td className={`${td} text-right tabular-nums text-stone-500`}>{reais(p.comissaoAvle)}</td>
                </tr>
              ))}
              {Number(dados.previstoDepois) > 0 && (
                <tr><td className={`${td} text-stone-500`}>Depois disso</td><td /><td className={`${td} text-right tabular-nums`}>{reais(dados.previstoDepois)}</td><td /><td /></tr>
              )}
            </tbody>
          </table>
        </div>
      </Secao>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Aging ── */}
        <Secao titulo="Vencido por tempo de atraso" descricao="Quanto mais tempo em atraso, menor a chance de receber: o que passa de 90 dias pede ação.">
          <div className="cartao-avle p-5 space-y-4">
            {Number(r.vencido) <= 0 ? <p className="text-[12px] text-stone-400 py-4">Nada vencido. Todas as cotas estão em dia.</p> : dados.aging.map((a, i) => (
              <div key={a.faixa}>
                <div className="flex justify-between gap-3 text-[12px]">
                  <span className="text-painel-tinta font-medium">{a.faixa}</span>
                  <span className="tabular-nums text-stone-500">{a.cotas} cota(s) · <strong className="text-painel-tinta">{reais(a.valor)}</strong> · {pct(a.percentual)}</span>
                </div>
                <div className="h-2 mt-1.5 rounded-full bg-painel-papel overflow-hidden">
                  <div className={`h-full rounded-full ${i >= 2 ? 'bg-painel-acento' : 'bg-painel-tinta'}`} style={{ width: `${Math.min(100, Number(a.percentual))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Secao>

        {/* ── Concentração e contempladas ── */}
        <Secao titulo="Onde está o atraso" descricao="As cinco clientes com mais valor vencido, e o saldo de quem já foi contemplada.">
          <div className="cartao-avle p-5 space-y-4">
            {dados.concentracao.length === 0 ? <p className="text-[12px] text-stone-400">Nenhuma cliente em atraso.</p> : (
              <>
                <p className="text-[12px] text-stone-500">As cinco somam <strong className="text-painel-tinta">{pct(dados.concentracaoTop5)}</strong> de todo o vencido.</p>
                <ol className="space-y-2">
                  {dados.concentracao.map((c, i) => (
                    <li key={`${c.cliente}-${i}`} className="flex items-center gap-3 text-[12px]">
                      <span className="w-5 text-stone-400 tabular-nums">{i + 1}º</span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-painel-tinta truncate">{c.cliente}</span>
                        <span className="block text-[10px] text-stone-400">{c.grupo} · {c.parcelasEmAtraso} parcela(s)</span>
                      </span>
                      <span className="tabular-nums text-amber-700 font-semibold">{reais(c.vencido)}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
            <div className="pt-4 border-t border-painel-borda text-[12px] text-stone-500 leading-relaxed">
              <strong className="text-painel-tinta">{r.contempladasComSaldo}</strong> de {r.contempladas} contemplada(s) ainda têm parcelas a pagar,
              somando <strong className="text-painel-tinta">{reais(r.saldoContempladas)}</strong>.
              {Number(r.saldoContempladasQueRetiraram) > 0 && <> Desse valor, <strong className="text-amber-700">{reais(r.saldoContempladasQueRetiraram)}</strong> é de quem já retirou o produto.</>}
            </div>
          </div>
        </Secao>
      </div>

      <p className="text-[11px] text-stone-400 leading-relaxed max-w-3xl">
        Como é calculado: cada grupo cobra a mesma parcela todo mês, e a parcela n vence no mês n depois do início do grupo. Uma cota está em
        atraso quando tem menos parcelas pagas do que os meses que o grupo já correu. Reservas sem pagamento e cotas canceladas ficam de fora.
        A parte da AVLE é a comissão de cada grupo sobre cada parcela.
      </p>
    </div>
  );
}
