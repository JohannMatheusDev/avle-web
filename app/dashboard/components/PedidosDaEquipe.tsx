'use client';

/**
 * Os pedidos da equipe, na aba Aprovações. A loja mãe vê os pendentes e decide,
 * vê o que já foi decidido e o que cada colaborador fez. O colaborador vê só os
 * pedidos dele e o que aconteceu com cada um.
 */

import { useCallback, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '../../lib/api';

type Pedido = {
  id: number;
  tipo: string;
  descricao?: string;
  quem?: string;
  status: 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'FALHOU';
  criadoEm?: string;
  decididoEm?: string;
  motivoRecusa?: string;
  falha?: string;
};
type Atividade = { id: number; quem?: string; acao: string; quando?: string; deuCerto?: boolean };

const SITUACAO: Record<Pedido['status'], { rotulo: string; classe: string }> = {
  PENDENTE: { rotulo: 'Aguardando', classe: 'bg-amber-50 text-amber-800' },
  APROVADO: { rotulo: 'Aprovado', classe: 'bg-emerald-50 text-emerald-700' },
  RECUSADO: { rotulo: 'Recusado', classe: 'bg-stone-100 text-stone-600' },
  FALHOU: { rotulo: 'Aprovado, mas não deu certo', classe: 'bg-rose-50 text-rose-700' },
};

const quando = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

const lerErro = async (res: Response, padrao: string) => {
  const texto = await res.text().catch(() => '');
  try {
    return JSON.parse(texto)?.erro || padrao;
  } catch {
    return texto || padrao;
  }
};

export default function PedidosDaEquipe({
  lojaId,
  ehColaborador,
  mostrarAviso,
  aoDecidir,
  aoContarPendentes,
}: {
  lojaId: number | undefined;
  ehColaborador: boolean;
  mostrarAviso: (titulo: string, texto: string, erro: boolean) => void;
  /** Depois de aprovar, o painel relê grupos, clientes e números. */
  aoDecidir?: () => void;
  aoContarPendentes?: (n: number) => void;
}) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [atividade, setAtividade] = useState<Atividade[]>([]);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [recusando, setRecusando] = useState<Pedido | null>(null);
  const [motivo, setMotivo] = useState('');

  const carregar = useCallback(async () => {
    if (!lojaId) return;
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/aprovacoes`);
      if (!res.ok) return;
      const dados = await res.json();
      setPedidos(Array.isArray(dados.pedidos) ? dados.pedidos : []);
      setAtividade(Array.isArray(dados.atividade) ? dados.atividade : []);
      aoContarPendentes?.(Number(dados.pendentes) || 0);
    } catch {
      // Sem a lista, a aba mostra o resto.
    }
  }, [lojaId, aoContarPendentes]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial dos pedidos
    carregar();
    // Um pedido novo do colaborador aparece sem precisar recarregar a página.
    const aoPedir = () => { setTimeout(carregar, 300); };
    window.addEventListener('avle:aguardando-aprovacao', aoPedir);
    return () => window.removeEventListener('avle:aguardando-aprovacao', aoPedir);
  }, [carregar]);

  const decidir = async (p: Pedido, aprovar: boolean, motivoRecusa?: string) => {
    setOcupado(p.id);
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/aprovacoes/${p.id}/${aprovar ? 'aprovar' : 'recusar'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoRecusa ?? null }),
      });
      if (!res.ok) throw new Error(await lerErro(res, 'Não foi possível decidir agora.'));
      const decidido: Pedido = await res.json();
      if (decidido.status === 'FALHOU') {
        mostrarAviso('O pedido não deu certo', decidido.falha || 'A ação foi recusada pelo sistema.', true);
      } else {
        mostrarAviso(aprovar ? 'Pedido aprovado' : 'Pedido recusado',
          aprovar ? `${p.tipo}: feito.` : `${p.tipo}: o colaborador vai ver que foi recusado.`, false);
      }
      await carregar();
      if (aprovar) aoDecidir?.();
    } catch (e) {
      mostrarAviso('Não deu certo', e instanceof Error ? e.message : 'Tente de novo.', true);
    } finally {
      setOcupado(null);
      setRecusando(null);
      setMotivo('');
    }
  };

  const pendentes = pedidos.filter((p) => p.status === 'PENDENTE');
  const decididos = pedidos.filter((p) => p.status !== 'PENDENTE').slice(0, 15);

  const linha = (p: Pedido, comAcoes: boolean) => (
    <div key={p.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-painel-tinta">{p.tipo}</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${SITUACAO[p.status].classe}`}>
            {SITUACAO[p.status].rotulo}
          </span>
        </div>
        {p.descricao && <p className="text-[12px] text-stone-500 mt-0.5 break-words">{p.descricao}</p>}
        <p className="text-[11px] text-stone-400 mt-0.5">
          {!ehColaborador && p.quem ? `${p.quem} · ` : ''}{quando(p.criadoEm)}
          {p.motivoRecusa && <> · Motivo: {p.motivoRecusa}</>}
          {p.status === 'FALHOU' && p.falha && <> · {p.falha}</>}
        </p>
      </div>
      {comAcoes && (
        <div className="flex gap-2">
          <button type="button" disabled={ocupado === p.id} onClick={() => { setRecusando(p); setMotivo(''); }}
            className="h-9 px-4 rounded-full border border-painel-borda text-[12px] font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-40 cursor-pointer">
            Recusar
          </button>
          <button type="button" disabled={ocupado === p.id} onClick={() => decidir(p, true)}
            className="h-9 px-4 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-40 cursor-pointer">
            {ocupado === p.id ? 'Fazendo…' : 'Aprovar'}
          </button>
        </div>
      )}
    </div>
  );

  if (ehColaborador) {
    return (
      <div className="cartao-avle overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50">
          <h3 style={{ fontWeight: 600 }} className="text-[14px] text-painel-tinta">Meus pedidos</h3>
          <p className="text-[12px] text-stone-400">O que você pediu e a loja ainda vai aprovar, ou já decidiu.</p>
        </div>
        {pedidos.length === 0 ? (
          <p className="px-5 py-6 text-[12px] text-stone-400">Nenhum pedido ainda.</p>
        ) : (
          <div className="divide-y divide-painel-borda">{pedidos.map((p) => linha(p, false))}</div>
        )}
      </div>
    );
  }

  if (pedidos.length === 0 && atividade.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="cartao-avle overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50">
          <h3 style={{ fontWeight: 600 }} className="text-[14px] text-painel-tinta">
            Pedidos da equipe{pendentes.length > 0 ? ` · ${pendentes.length}` : ''}
          </h3>
          <p className="text-[12px] text-stone-400">Aprovado, o pedido é feito na hora, como se você mesma tivesse feito.</p>
        </div>
        {pendentes.length === 0 ? (
          <p className="px-5 py-6 text-[12px] text-stone-400">Nenhum pedido esperando você.</p>
        ) : (
          <div className="divide-y divide-painel-borda">{pendentes.map((p) => linha(p, true))}</div>
        )}
        {decididos.length > 0 && (
          <details className="border-t border-painel-borda">
            <summary className="px-5 py-3 text-[12px] font-semibold text-stone-500 cursor-pointer">Já decididos</summary>
            <div className="divide-y divide-painel-borda">{decididos.map((p) => linha(p, false))}</div>
          </details>
        )}
      </div>

      {atividade.length > 0 && (
        <details className="cartao-avle overflow-hidden">
          <summary className="px-5 py-4 text-[14px] text-painel-tinta cursor-pointer" style={{ fontWeight: 600 }}>
            O que a equipe fez
          </summary>
          <div className="divide-y divide-painel-borda border-t border-painel-borda">
            {atividade.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <span className="text-[12px] text-painel-tinta min-w-0">
                  <strong>{a.quem}</strong> · {a.acao}
                  {a.deuCerto === false && <span className="text-rose-600"> · não deu certo</span>}
                </span>
                <span className="text-[11px] text-stone-400 whitespace-nowrap">{quando(a.quando)}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {recusando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="cartao-avle w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">Recusar: {recusando.tipo}</h3>
            {recusando.descricao && <p className="text-[12px] text-stone-500">{recusando.descricao}</p>}
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3}
              placeholder="Motivo (opcional). O colaborador vai ver."
              className="w-full border border-painel-borda rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-painel-acento resize-none" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setRecusando(null)}
                className="flex-1 py-2.5 border rounded-full text-stone-500 font-semibold text-[12px] hover:bg-stone-50 cursor-pointer">
                Voltar
              </button>
              <button type="button" disabled={ocupado === recusando.id} onClick={() => decidir(recusando, false, motivo)}
                className="flex-1 py-2.5 bg-rose-700 text-white font-semibold rounded-full text-[12px] hover:bg-rose-800 disabled:opacity-40 cursor-pointer">
                Recusar pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
