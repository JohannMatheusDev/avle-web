'use client';

/**
 * A comissão da AVLE de uma loja: o percentual negociado e quanto cada grupo
 * paga por parcela, em reais.
 *
 * No admin dá para mudar o percentual; na loja, só ver. A regra que a tela
 * repete é a do servidor (Grupo.comissaoAvleSobre): o percentual sobre a
 * parcela, arredondado sempre para baixo, guardado no grupo no dia em que ele
 * nasce. Mudar o percentual vale só para os grupos novos.
 */

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

type GrupoDaComissao = {
  grupoId: number; nome: string; status?: string; valorParcela: number;
  percentualAvle: number; comissaoPorParcela: number; lojaRecebePorParcela: number;
};
type Comissao = { lojaId: number; loja: string; percentualAvle: number; grupos: GrupoDaComissao[] };

const reais = (v?: number) => (v == null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
const pct = (v?: number) => (v == null ? '—' : `${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`);

/** A mesma conta do servidor: centavos inteiros, para baixo. */
export function comissaoPorParcela(parcela: number, percentual: number) {
  const centavos = Math.round(parcela * 100);
  return Math.floor((centavos * percentual) / 100 + 1e-9) / 100;
}

export default function ComissaoDaLoja({ lojaId, podeEditar = false }: { lojaId: number; podeEditar?: boolean }) {
  const [dados, setDados] = useState<Comissao | null>(null);
  const [erro, setErro] = useState('');
  const [novo, setNovo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let ativo = true;
    apiFetch(`/api/lojas/${lojaId}/comissao`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Comissao) => {
        if (!ativo) return;
        setDados(d);
        setNovo(String(d.percentualAvle).replace('.', ','));
      })
      .catch(() => ativo && setErro('Não foi possível carregar a comissão agora.'));
    return () => {
      ativo = false;
    };
  }, [lojaId]);

  const salvar = async () => {
    setSalvando(true);
    setErro('');
    setAviso('');
    try {
      const r = await apiFetch(`/api/admin/lojas/${lojaId}/percentual-avle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentual: novo }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.erro || 'Não foi possível salvar o percentual.');
      setDados(d);
      setAviso(d.mensagem);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar o percentual.');
    } finally {
      setSalvando(false);
    }
  };

  const numeroNovo = Number(novo.replace(',', '.'));
  const exemplo = numeroNovo > 0 && numeroNovo < 100 ? comissaoPorParcela(179.9, numeroNovo) : null;

  return (
    <div className="cartao-avle p-6 space-y-4 text-left">
      <div>
        <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">Comissão da AVLE</h3>
        <p className="text-[12px] text-stone-500 mt-1 leading-relaxed max-w-2xl">
          É um valor fixo por parcela, calculado quando o grupo é criado: o percentual sobre a parcela, arredondado
          para baixo. A loja recebe sempre a parcela menos a comissão; a taxa do Asaas sai da parte da AVLE. Cada grupo
          guarda o percentual do dia em que foi criado.
        </p>
      </div>

      {erro && <p className="text-[12px] text-rose-600">{erro}</p>}

      {dados && (
        <>
          {podeEditar ? (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="percentual-avle" className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1">
                  Percentual para os grupos novos
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="percentual-avle"
                    type="text"
                    inputMode="decimal"
                    value={novo}
                    onChange={(e) => setNovo(e.target.value.replace(/[^0-9,.]/g, ''))}
                    className="h-10 w-24 px-3 rounded-xl border border-stone-200 bg-white text-[14px] font-semibold"
                  />
                  <span className="text-[14px] text-stone-500">%</span>
                </div>
              </div>
              <button type="button" onClick={salvar} disabled={salvando || !(numeroNovo > 0 && numeroNovo < 100)}
                className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
                {salvando ? 'Salvando…' : 'Salvar percentual'}
              </button>
              {exemplo != null && (
                <p className="text-[11px] text-stone-500">
                  Ex.: numa parcela de R$ 179,90, a comissão fica {reais(exemplo)} e a loja recebe {reais(179.9 - exemplo)}.
                </p>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-painel-tinta">
              Percentual combinado para os grupos novos: <strong>{pct(dados.percentualAvle)}</strong>
            </p>
          )}

          {aviso && <p className="text-[12px] text-emerald-700">{aviso}</p>}

          {dados.grupos.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-stone-500">
                    <th className="py-2 pr-3">Grupo</th>
                    <th className="py-2 pr-3 text-right">Parcela</th>
                    <th className="py-2 pr-3 text-right">Percentual</th>
                    <th className="py-2 pr-3 text-right">Comissão AVLE</th>
                    <th className="py-2 text-right">Loja recebe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {dados.grupos.map((g) => (
                    <tr key={g.grupoId}>
                      <td className="py-2 pr-3 text-painel-tinta">{g.nome}</td>
                      <td className="py-2 pr-3 text-right">{reais(g.valorParcela)}</td>
                      <td className="py-2 pr-3 text-right">{pct(g.percentualAvle)}</td>
                      <td className="py-2 pr-3 text-right">{reais(g.comissaoPorParcela)}</td>
                      <td className="py-2 text-right font-semibold">{reais(g.lojaRecebePorParcela)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
