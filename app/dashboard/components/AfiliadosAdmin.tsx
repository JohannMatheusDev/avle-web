'use client';

/**
 * As afiliadas no admin: a regra de comissão de cada loja (enquanto não existe,
 * as comissões ficam "a definir") e o que pagar a cada afiliada, com a chave
 * Pix. Depois de pagar pelo Pix, "Marcar como paga" fecha as comissões dela.
 */

import { useCallback, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '../../lib/api';

type Regra = { lojaId: number; loja: string; tipo: string | null; valor: number | null; regra: string | null; afiliadas: number };
type APagar = { afiliadoId: number; nome: string; loja: string; chavePix: string; aPagar: number; comissoesAPagar: number; aDefinir: number };

const reais = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const campo = 'h-9 px-3 bg-white ring-1 ring-painel-borda rounded-full text-[12px] text-painel-tinta focus:outline-none focus:ring-2 focus:ring-painel-acento/50';

export default function AfiliadosAdmin() {
  const [regras, setRegras] = useState<Regra[]>([]);
  const [aPagar, setAPagar] = useState<APagar[]>([]);
  const [edicao, setEdicao] = useState<Record<number, { tipo: string; valor: string }>>({});
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [r1, r2] = await Promise.all([
        apiFetch(`${API_URL}/api/afiliados/admin/regras`),
        apiFetch(`${API_URL}/api/afiliados/admin/a-pagar`),
      ]);
      if (r1.ok) setRegras(await r1.json());
      if (r2.ok) setAPagar(await r2.json());
    } catch {
      setAviso('Não foi possível carregar as afiliadas.');
    }
  }, []);

  // A primeira carga sai depois da renderização: chamada direto no efeito, o
  // estado mudaria em cascata (regra do React).
  useEffect(() => {
    const t = setTimeout(carregar, 0);
    return () => clearTimeout(t);
  }, [carregar]);

  const salvarRegra = async (r: Regra) => {
    const e = edicao[r.lojaId] ?? { tipo: r.tipo ?? '', valor: r.valor != null ? String(r.valor) : '' };
    const descricao = e.tipo ? (e.tipo === 'PERCENTUAL' ? `${e.valor}% de cada parcela` : `R$ ${e.valor} por parcela`) : 'sem regra';
    if (!window.confirm(`Comissão das afiliadas da ${r.loja}: ${descricao}? As comissões "a definir" desta loja ganham este valor.`)) return;
    setOcupado(true);
    setAviso('');
    try {
      const res = await apiFetch(`${API_URL}/api/afiliados/admin/regra/${r.lojaId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: e.tipo || null, valor: e.valor || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.erro || 'Não foi possível salvar.');
      setAviso(`${r.loja}: ${d.regra}. ${d.atualizadas} comissão(ões) ganharam valor.`);
      await carregar();
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setOcupado(false);
    }
  };

  const marcarPaga = async (a: APagar) => {
    if (!window.confirm(`Você já pagou ${reais(a.aPagar)} para ${a.nome} no Pix ${a.chavePix}? As ${a.comissoesAPagar} comissão(ões) viram pagas.`)) return;
    setOcupado(true);
    setAviso('');
    try {
      const res = await apiFetch(`${API_URL}/api/afiliados/admin/${a.afiliadoId}/pagas`, { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.erro || 'Não foi possível marcar.');
      setAviso(d.mensagem);
      await carregar();
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'Não foi possível marcar.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="cartao-avle p-6 mb-6 space-y-5">
      <div>
        <h3 style={{ fontWeight: 600 }} className="text-[16px] text-painel-tinta">Afiliadas</h3>
        <p className="text-[12px] text-stone-500 mt-1 max-w-xl leading-relaxed">
          Cada parcela paga por uma cliente indicada gera uma comissão para a afiliada, até o fim do plano. Sem regra na
          loja, a comissão fica &quot;a definir&quot; e ganha valor quando a regra for salva.
        </p>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">Regra por loja</p>
        <div className="divide-y divide-painel-borda">
          {regras.map((r) => {
            const e = edicao[r.lojaId] ?? { tipo: r.tipo ?? '', valor: r.valor != null ? String(r.valor) : '' };
            const mudar = (parcial: Partial<typeof e>) => setEdicao((m) => ({ ...m, [r.lojaId]: { ...e, ...parcial } }));
            return (
              <div key={r.lojaId} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 text-[12px] text-stone-500">
                  <p className="text-[13px] font-semibold text-painel-tinta">{r.loja}</p>
                  <p>{r.regra ?? 'Sem regra (a definir)'} · {r.afiliadas} afiliada(s)</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select value={e.tipo} onChange={(ev) => mudar({ tipo: ev.target.value })} className={campo}>
                    <option value="">Sem regra</option>
                    <option value="PERCENTUAL">% da parcela</option>
                    <option value="FIXO">R$ por parcela</option>
                  </select>
                  {e.tipo && (
                    <input value={e.valor} onChange={(ev) => mudar({ valor: ev.target.value })} inputMode="decimal"
                      placeholder={e.tipo === 'PERCENTUAL' ? '%' : 'R$'} className={`${campo} w-20`} />
                  )}
                  <button type="button" onClick={() => salvarRegra(r)} disabled={ocupado || (!!e.tipo && !e.valor)}
                    className="h-9 px-4 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
                    Salvar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">A pagar</p>
        {aPagar.length === 0 ? (
          <p className="text-[12px] text-stone-400">Nenhuma comissão a pagar.</p>
        ) : (
          <div className="divide-y divide-painel-borda">
            {aPagar.map((a) => (
              <div key={a.afiliadoId} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 text-[12px] text-stone-500">
                  <p className="text-[13px] font-semibold text-painel-tinta">{a.nome} · {a.loja}</p>
                  <p>Pix: <span className="font-mono text-painel-tinta">{a.chavePix}</span></p>
                  <p>
                    {reais(a.aPagar)} em {a.comissoesAPagar} comissão(ões)
                    {a.aDefinir > 0 ? ` · ${a.aDefinir} a definir` : ''}
                  </p>
                </div>
                {a.comissoesAPagar > 0 && (
                  <button type="button" onClick={() => marcarPaga(a)} disabled={ocupado}
                    className="h-9 px-4 rounded-full border border-painel-borda text-[12px] font-semibold text-painel-tinta hover:bg-stone-50 disabled:opacity-50 cursor-pointer">
                    Marcar como paga
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {aviso && <p className="text-[12px] text-painel-tinta break-words">{aviso}</p>}
    </div>
  );
}
