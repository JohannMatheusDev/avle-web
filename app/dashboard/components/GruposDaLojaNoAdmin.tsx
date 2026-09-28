'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '../../lib/api';

type Grupo = { id: number; nome: string; quantidadeMaxCotas?: number; cotasOcupadas?: number; status?: string };

type Relato = {
  grupoNome?: string;
  cotas?: number;
  parcelas?: number;
  cobrancasNoAsaas?: number;
  parcelasPagas?: number;
  pagas?: { cliente?: string; valor?: number; data?: string; forma?: string }[];
  permitido?: boolean;
  motivo?: string;
  erro?: string;
};

const real = (n?: number) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Os grupos de uma loja na ficha do admin, com a exclusao forcada: apaga o
 * grupo de teste mesmo com baixa manual lancada, o que a loja sozinha nao
 * pode. O servidor recusa se algum pagamento passou pelo Asaas.
 */
export default function GruposDaLojaNoAdmin({ lojaId }: { lojaId: number }) {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [conferindo, setConferindo] = useState<{ grupo: Grupo; relato: Relato } | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; erro: boolean } | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/grupos/loja/${lojaId}`);
      const data = res.ok ? await res.json() : [];
      setGrupos(Array.isArray(data) ? data : []);
    } catch {
      setGrupos([]);
    } finally {
      setCarregando(false);
    }
  }, [lojaId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial da lista
    carregar();
  }, [carregar]);

  const conferir = async (grupo: Grupo) => {
    setAviso(null);
    try {
      const res = await apiFetch(`${API_URL}/api/grupos/${grupo.id}/completo?ensaio=true&forcar=true`, { method: 'DELETE' });
      const relato: Relato = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAviso({ texto: relato.motivo || relato.erro || 'Não foi possível conferir o grupo.', erro: true });
        return;
      }
      setConferindo({ grupo, relato });
    } catch {
      setAviso({ texto: 'Não foi possível falar com o servidor.', erro: true });
    }
  };

  const excluir = async () => {
    if (!conferindo) return;
    setExcluindo(true);
    try {
      const res = await apiFetch(`${API_URL}/api/grupos/${conferindo.grupo.id}/completo?ensaio=false&forcar=true`, { method: 'DELETE' });
      const relato: Relato = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAviso({ texto: relato.motivo || relato.erro || 'O grupo não foi excluído.', erro: true });
      } else {
        setAviso({ texto: `O grupo ${conferindo.grupo.nome} foi excluído.`, erro: false });
        carregar();
      }
    } catch {
      setAviso({ texto: 'Não foi possível falar com o servidor.', erro: true });
    } finally {
      setExcluindo(false);
      setConferindo(null);
    }
  };

  const r = conferindo?.relato;

  return (
    <div className="cartao-avle p-6">
      <h3 className="text-sm font-bold text-painel-tinta uppercase tracking-wider mb-1">Grupos da loja</h3>
      <p className="text-[11px] text-stone-400 mb-4">
        Aqui o admin exclui grupo de teste mesmo com baixa manual lançada. Grupo com pagamento pelo Asaas não sai.
      </p>

      {aviso && (
        <p className={`text-[12px] mb-3 px-3 py-2 rounded-xl ${aviso.erro ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {aviso.texto}
        </p>
      )}

      {carregando ? (
        <p className="text-[12px] text-stone-400">Carregando os grupos…</p>
      ) : grupos.length === 0 ? (
        <p className="text-[12px] text-stone-400">Esta loja não tem grupos.</p>
      ) : (
        <div className="divide-y divide-painel-borda">
          {grupos.map((g) => (
            <div key={g.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="nome-do-grupo text-[13px] text-painel-tinta truncate">{g.nome}</p>
                <p className="text-[11px] text-stone-400">
                  #{g.id} · {g.cotasOcupadas ?? 0}/{g.quantidadeMaxCotas ?? '—'} cotas
                </p>
              </div>
              <button
                type="button"
                onClick={() => conferir(g)}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      )}

      {conferindo && r && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="cartao-avle w-full max-w-md p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">Excluir o grupo {conferindo.grupo.nome}</h3>
            <p className="text-[12px] text-stone-600 leading-relaxed">
              Saem junto {r.cotas ?? 0} cota(s), {r.parcelas ?? 0} parcela(s) e {r.cobrancasNoAsaas ?? 0} cobrança(s) em aberto no
              Asaas. Esta ação não pode ser desfeita.
            </p>
            {(r.pagas?.length ?? 0) > 0 && (
              <div>
                <p className="text-[12px] font-semibold text-painel-tinta mb-2">
                  Pagamentos que também serão apagados. Confira se são todos de teste:
                </p>
                <div className="rounded-xl bg-stone-50 divide-y divide-painel-borda">
                  {r.pagas!.map((p, i) => (
                    <div key={i} className="px-3 py-2 flex justify-between gap-3 text-[12px]">
                      <span className="truncate">
                        {p.cliente || 'Cliente'} · {p.forma}
                        {p.data && <span className="text-stone-400"> · {new Date(p.data).toLocaleDateString('pt-BR')}</span>}
                      </span>
                      <span className="font-semibold tabular-nums">{real(p.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConferindo(null)}
                className="flex-1 py-2.5 border rounded-full text-stone-500 font-semibold text-[12px] hover:bg-stone-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo}
                onClick={excluir}
                className="flex-1 py-2.5 bg-rose-700 text-white font-semibold rounded-full text-[12px] hover:bg-rose-800 disabled:opacity-50 cursor-pointer"
              >
                {excluindo ? 'Excluindo…' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
