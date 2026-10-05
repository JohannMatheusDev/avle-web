'use client';

/**
 * Corrige o mês que um pagamento quitou. Serve para quem pagou atrasado e ficou
 * com o pagamento marcado no mês seguinte: setembro pago em 15/09 aparecendo
 * como outubro. Muda só o mês; valor, saldo e Asaas ficam como estão.
 */

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

type Pagamento = {
  id: number;
  cliente: string;
  cotaId: number;
  grupo: string;
  loja?: string;
  valor: number;
  status: string;
  pago: boolean;
  competencia?: string;
  dataPagamento?: string;
};

const mes = (c?: string) =>
  c ? new Date(`${c}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'sem mês';

const vizinho = (c: string, passo: number) => {
  const [a, m] = c.split('-').map(Number);
  const d = new Date(a, m - 1 + passo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function MesDoPagamento() {
  const [nome, setNome] = useState('');
  const [lista, setLista] = useState<Pagamento[] | null>(null);
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const lerErro = async (r: Response) => {
    try {
      return (await r.json())?.erro || 'Não deu certo.';
    } catch {
      return 'Não deu certo.';
    }
  };

  const buscar = async () => {
    setOcupado(true);
    setAviso('');
    try {
      const r = await apiFetch(`/api/admin/pagamentos?nome=${encodeURIComponent(nome.trim())}`);
      if (!r.ok) throw new Error(await lerErro(r));
      setLista(await r.json());
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu certo.');
    } finally {
      setOcupado(false);
    }
  };

  const mudar = async (p: Pagamento, competencia: string) => {
    if (!window.confirm(`Passar o pagamento de ${p.cliente} de ${mes(p.competencia)} para ${mes(competencia)}?`)) return;
    setOcupado(true);
    try {
      const r = await apiFetch(`/api/admin/pagamentos/${p.id}/competencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competencia }),
      });
      if (!r.ok) throw new Error(await lerErro(r));
      setLista((l) => l?.map((x) => (x.id === p.id ? { ...x, competencia } : x)) ?? null);
      setAviso(`Pronto: o pagamento de ${p.cliente} agora quita ${mes(competencia)}.`);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu certo.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="cartao-avle p-6 mb-6 space-y-4">
      <div>
        <h3 style={{ fontWeight: 600 }} className="text-[16px] text-painel-tinta">Pagamento no mês errado</h3>
        <p className="text-[12px] text-stone-500 mt-1 max-w-xl leading-relaxed">
          Para quem pagou um mês e o sistema marcou outro. Muda só o mês que o pagamento quitou: valor, saldo e Asaas
          continuam iguais. Depois disso, a cliente vê em aberto o mês que ainda deve.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da cliente"
          onKeyDown={(e) => { if (e.key === 'Enter' && nome.trim().length >= 3) buscar(); }}
          className="h-10 px-4 flex-1 min-w-[180px] bg-white ring-1 ring-painel-borda rounded-full text-[13px] text-painel-tinta focus:outline-none focus:ring-2 focus:ring-painel-acento/50" />
        <button type="button" onClick={buscar} disabled={ocupado || nome.trim().length < 3}
          className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
          Buscar
        </button>
      </div>
      {aviso && <p className="text-[12px] text-painel-tinta">{aviso}</p>}
      {lista && (lista.length === 0 ? (
        <p className="text-[12px] text-stone-400">Nenhum pagamento com esse nome.</p>
      ) : (
        <div className="divide-y divide-painel-borda">
          {lista.map((p) => (
            <div key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-painel-tinta">{p.cliente} · {p.grupo}{p.loja ? ` · ${p.loja}` : ''}</p>
                <p className="text-[12px] text-stone-500">
                  R$ {Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · pago em{' '}
                  {p.dataPagamento ? new Date(p.dataPagamento).toLocaleDateString('pt-BR') : '—'} · quita{' '}
                  <strong className="text-painel-tinta">{mes(p.competencia)}</strong>
                  {!p.pago && <> · {p.status.toLowerCase()}</>}
                </p>
              </div>
              {p.pago && p.competencia && (
                <div className="flex gap-2">
                  {[-1, 1].map((passo) => {
                    const alvo = vizinho(p.competencia!, passo);
                    return (
                      <button key={passo} type="button" disabled={ocupado} onClick={() => mudar(p, alvo)}
                        className="h-9 px-4 rounded-full border border-painel-borda text-[12px] font-semibold text-painel-tinta hover:bg-stone-50 disabled:opacity-40 cursor-pointer">
                        Passar para {mes(alvo)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
