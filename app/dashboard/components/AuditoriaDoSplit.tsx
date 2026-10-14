'use client';

/**
 * Auditoria do split: confere no Asaas, cobrança por cobrança, se o dinheiro
 * da loja foi para a conta dela e se só a comissão foi para a AVLE.
 *
 * Existe porque o extrato da conta da AVLE mostrava parcelas inteiras de
 * cliente entrando e saindo de novo, e houve pagamento cujo repasse foi
 * cancelado sem ninguém ver. Só lê: não baixa, não cancela, não emite nada.
 * O "Copiar relatório" é para mandar o resultado inteiro para quem vai
 * analisar.
 */

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

type Problema = { gravidade: 'ALTA' | 'MEDIA'; texto: string };
type Repasse = { destino: 'AVLE' | 'LOJA' | 'OUTRA'; carteira?: string; valor?: number; status?: string; motivo?: string };
type Linha = {
  transacaoId: number; cotaId?: number; cliente?: string; grupo?: string; competencia?: string; vencimento?: string;
  valor?: number; statusNoAvle?: string; statusNoAsaas?: string | null; conta: 'AVLE' | 'LOJA'; paymentId: string;
  formaDePagamento?: string; pagaEm?: string; repasses?: Repasse[]; problemas: Problema[];
};
type Resultado = {
  loja: string; contaConectada: boolean; conferidaEm: string;
  resumo: {
    cobrancas: number; pagasNoAsaas: number; comProblema: number; graves: number; pagasNaContaDaAvle: number;
    semLeitura: number; devidoALojaPelaAvle: number; repasseParadoNaLoja: number; comissaoNaoRepassada: number;
  };
  cobrancas: Linha[];
  semRegistroNoAvle: { conferido: boolean; motivo?: string; cobrancas?: { paymentId: string; status: string; valor: number; vencimento: string; descricao?: string }[] };
};

const reais = (v?: number) => (v == null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

const STATUS_DO_REPASSE: Record<string, string> = {
  DONE: 'feito', PENDING: 'pendente', AWAITING_CREDIT: 'aguardando crédito', CANCELLED: 'cancelado',
  REFUSED: 'recusado', BLOCKED_BY_VALUE_DIVERGENCE: 'bloqueado',
};

export default function AuditoriaDoSplit() {
  const [lojas, setLojas] = useState<{ id: number; nome: string }[] | null>(null);
  const [lojaId, setLojaId] = useState<number | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [soProblemas, setSoProblemas] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);

  const abrir = async () => {
    setErro('');
    try {
      const r = await apiFetch('/api/admin/auditoria-split');
      if (!r.ok) throw new Error();
      setLojas((await r.json()).lojas);
    } catch {
      setErro('Não foi possível carregar as lojas.');
    }
  };

  const conferir = async () => {
    if (!lojaId) return;
    setCarregando(true);
    setErro('');
    setResultado(null);
    try {
      const r = await apiFetch(`/api/admin/auditoria-split?lojaId=${lojaId}`);
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.erro || 'A conferência não terminou.');
      setResultado(d);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'A conferência não terminou.');
    } finally {
      setCarregando(false);
    }
  };

  const copiar = async () => {
    if (!resultado) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(resultado, null, 2));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErro('O navegador não deixou copiar. Selecione o texto da página e copie à mão.');
    }
  };

  const linhas = (resultado?.cobrancas ?? []).filter((l) => !soProblemas || l.problemas.length > 0);
  const semRegistro = resultado?.semRegistroNoAvle;

  return (
    <div className="cartao-avle p-6 space-y-4 text-left">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 style={{ fontWeight: 600 }} className="text-[16px] text-painel-tinta">Auditoria do split no Asaas</h3>
          <p className="text-[12px] text-stone-500 mt-1 max-w-xl leading-relaxed">
            Confere cada cobrança da loja no Asaas, na conta em que ela nasceu: se foi paga, se está baixada aqui e se
            cada repasse foi feito. O dinheiro da cliente tem de cair na conta da loja, e só a comissão na AVLE. Só lê:
            nada é alterado.
          </p>
        </div>
        {!lojas && (
          <button type="button" onClick={abrir}
            className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde cursor-pointer">
            Começar
          </button>
        )}
      </div>

      {lojas && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={lojaId ?? ''}
            onChange={(e) => setLojaId(e.target.value ? Number(e.target.value) : null)}
            className="h-10 px-3 rounded-xl border border-stone-200 bg-white text-[13px]"
          >
            <option value="">Escolha a loja</option>
            {lojas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
          <button type="button" onClick={conferir} disabled={!lojaId || carregando}
            className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
            {carregando ? 'Conferindo no Asaas… pode levar um minuto' : 'Conferir no Asaas'}
          </button>
          {resultado && (
            <button type="button" onClick={copiar}
              className="h-10 px-5 rounded-full border border-stone-200 text-[12px] font-semibold text-painel-tinta hover:bg-painel-papel cursor-pointer">
              {copiado ? 'Relatório copiado' : 'Copiar relatório'}
            </button>
          )}
        </div>
      )}

      {erro && <p className="text-[12px] text-rose-600">{erro}</p>}

      {resultado && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { rotulo: 'Cobranças', valor: resultado.resumo.cobrancas },
              { rotulo: 'Pagas no Asaas', valor: resultado.resumo.pagasNoAsaas },
              { rotulo: 'Com problema', valor: resultado.resumo.comProblema, alerta: resultado.resumo.comProblema > 0 },
              { rotulo: 'Graves', valor: resultado.resumo.graves, alerta: resultado.resumo.graves > 0 },
              { rotulo: 'Pagas na conta da AVLE', valor: resultado.resumo.pagasNaContaDaAvle, alerta: resultado.resumo.pagasNaContaDaAvle > 0 },
            ].map((c) => (
              <div key={c.rotulo} className={`rounded-2xl p-3 ${c.alerta ? 'bg-rose-50' : 'bg-painel-papel'}`}>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">{c.rotulo}</p>
                <p className={`text-[20px] font-semibold ${c.alerta ? 'text-rose-700' : 'text-painel-tinta'}`}>{c.valor}</p>
              </div>
            ))}
          </div>

          {/* Os dois números que dizem o que precisa voltar para o dono. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { rotulo: 'A AVLE deve à loja', ajuda: 'parte da loja presa na AVLE por repasse que falhou', valor: resultado.resumo.devidoALojaPelaAvle },
              { rotulo: 'Comissão não repassada', ajuda: 'parte da AVLE que ficou com a loja', valor: resultado.resumo.comissaoNaoRepassada },
              { rotulo: 'Repasse parado na loja', ajuda: 'repasse da conta da loja que falhou', valor: resultado.resumo.repasseParadoNaLoja },
            ].map((c) => (
              <div key={c.rotulo} className={`rounded-2xl p-3 ${Number(c.valor) > 0 ? 'bg-rose-50' : 'bg-painel-papel'}`}>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">{c.rotulo}</p>
                <p className={`text-[20px] font-semibold ${Number(c.valor) > 0 ? 'text-rose-700' : 'text-painel-tinta'}`}>{reais(c.valor)}</p>
                <p className="text-[10px] text-stone-500">{c.ajuda}</p>
              </div>
            ))}
          </div>

          {resultado.resumo.semLeitura > 0 && (
            <p className="text-[12px] text-amber-800 bg-amber-50 rounded-xl p-3">
              {resultado.resumo.semLeitura} cobrança(s) não puderam ser lidas no Asaas. Espere alguns minutos e confira de novo.
            </p>
          )}

          {!resultado.contaConectada && (
            <p className="text-[12px] text-amber-800 bg-amber-50 rounded-xl p-3">
              {resultado.loja} não tem a conta do Asaas conectada: as cobranças novas dela nascem na conta da AVLE.
            </p>
          )}

          <label className="flex items-center gap-2 text-[12px] text-stone-600 cursor-pointer">
            <input type="checkbox" checked={soProblemas} onChange={(e) => setSoProblemas(e.target.checked)} />
            Mostrar só as cobranças com problema
          </label>

          {linhas.length === 0 && (
            <p className="text-[12px] text-emerald-700">
              {soProblemas ? 'Nenhuma cobrança com problema.' : 'Nenhuma cobrança com registro no Asaas.'}
            </p>
          )}

          <ul className="space-y-2">
            {linhas.map((l) => (
              <li key={l.transacaoId} className="rounded-2xl border border-stone-200 p-4 space-y-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-semibold text-painel-tinta">{l.cliente || 'Sem nome'} · {l.grupo}</p>
                    <p className="text-[11px] text-stone-500">
                      Parcela {l.competencia || '—'} · {reais(l.valor)} · no AVLE: {l.statusNoAvle} · no Asaas: {l.statusNoAsaas || '?'}
                      {l.pagaEm ? ` em ${new Date(`${l.pagaEm}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}
                    </p>
                    <p className="text-[10px] text-stone-400 font-mono">
                      {l.paymentId} · conta {l.conta === 'AVLE' ? 'da AVLE' : 'da loja'} · cota {l.cotaId}
                    </p>
                  </div>
                </div>
                {l.repasses && l.repasses.length > 0 && (
                  <p className="text-[11px] text-stone-600">
                    Repasses: {l.repasses.map((r) => `${reais(r.valor)} para ${r.destino === 'AVLE' ? 'a AVLE' : r.destino === 'LOJA' ? 'a loja' : 'outra carteira'} (${STATUS_DO_REPASSE[r.status || ''] || r.status})`).join(' · ')}
                  </p>
                )}
                {l.problemas.map((p, i) => (
                  <p key={i} className={`text-[12px] leading-relaxed rounded-xl px-3 py-2 ${p.gravidade === 'ALTA' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'}`}>
                    {p.texto}
                  </p>
                ))}
              </li>
            ))}
          </ul>

          {semRegistro && (
            <div className="rounded-2xl bg-painel-papel p-4">
              <p className="text-[12px] font-semibold text-painel-tinta">Cobranças na conta da loja que o AVLE não conhece</p>
              {!semRegistro.conferido ? (
                <p className="text-[11px] text-stone-500 mt-1">{semRegistro.motivo}</p>
              ) : (semRegistro.cobrancas ?? []).length === 0 ? (
                <p className="text-[11px] text-emerald-700 mt-1">Nenhuma. Toda cobrança da conta da loja tem registro aqui.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {semRegistro.cobrancas!.map((c) => (
                    <li key={c.paymentId} className="text-[11px] text-stone-600 font-mono">
                      {c.paymentId} · {c.status} · {reais(c.valor)} · vence {c.vencimento}{c.descricao ? ` · ${c.descricao}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
