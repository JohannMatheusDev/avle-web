'use client';

/**
 * A aba Afiliados da loja: o link para quem quer divulgar a loja se cadastrar
 * como afiliada, e a lista de afiliadas com o que cada uma trouxe. A loja pode
 * desligar uma afiliada: o link dela para de marcar clientes novas.
 */

import { useCallback, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '../../lib/api';

type Afiliada = {
  afiliadoId: number; nome: string; email?: string; telefone?: string; codigo: string; ativo: boolean; criadoEm: string;
  clientesIndicados: number; clientesQuePagaram: number; parcelasPagas: number;
  totalGanho: number; aReceber: number; aDefinir: number;
};

const reais = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AfiliadosDaLoja({ lojaId, nomeLoja, ehColaborador }: { lojaId: number; nomeLoja: string; ehColaborador: boolean }) {
  const [lista, setLista] = useState<Afiliada[] | null>(null);
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState<number | null>(null);

  const slug = nomeLoja.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const linkDeCadastro = typeof window !== 'undefined' ? `${window.location.origin}/afiliados/${lojaId}-${slug || 'loja'}` : '';

  const carregar = useCallback(async () => {
    try {
      const r = await apiFetch(`${API_URL}/api/afiliados/loja/${lojaId}`);
      if (!r.ok) throw new Error();
      setLista(await r.json());
    } catch {
      setAviso('Não foi possível carregar as afiliadas.');
      setLista([]);
    }
  }, [lojaId]);

  // A primeira carga sai depois da renderização: chamada direto no efeito, o
  // estado mudaria em cascata (regra do React).
  useEffect(() => {
    const t = setTimeout(carregar, 0);
    return () => clearTimeout(t);
  }, [carregar]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(linkDeCadastro);
      setAviso('Link copiado. Mande para quem vai divulgar a loja.');
    } catch {
      setAviso('Não deu para copiar. Selecione o link e copie.');
    }
  };

  const alternar = async (a: Afiliada) => {
    if (a.ativo && !window.confirm(`Desligar ${a.nome}? O link dela para de marcar clientes novas e as próximas parcelas não geram comissão.`)) return;
    setOcupado(a.afiliadoId);
    try {
      const r = await apiFetch(`${API_URL}/api/afiliados/loja/${lojaId}/${a.afiliadoId}/ativo`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo: !a.ativo }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.erro || 'Não foi possível alterar.');
      setAviso(d.mensagem);
      await carregar();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não foi possível alterar.');
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="cartao-avle p-6 space-y-3">
        <h3 style={{ fontWeight: 600 }} className="text-[16px] text-painel-tinta">Link para novas afiliadas</h3>
        <p className="text-[12px] text-stone-500 max-w-xl leading-relaxed">
          Mande este link para quem vai divulgar a loja (influenciadoras, parceiras). Ela se cadastra, aceita os termos
          e recebe um link de indicação só dela. Cada parcela paga por quem entrar pelo link dela gera uma comissão.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-[220px] px-4 py-2.5 rounded-full bg-painel-papel text-[12px] text-painel-tinta break-all">{linkDeCadastro}</code>
          <button type="button" onClick={copiar}
            className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde cursor-pointer">
            Copiar link
          </button>
        </div>
        {aviso && <p className="text-[12px] text-painel-tinta">{aviso}</p>}
      </div>

      <div className="cartao-avle p-6">
        <h3 style={{ fontWeight: 600 }} className="text-[16px] text-painel-tinta mb-3">Afiliadas</h3>
        {lista === null ? (
          <p className="text-[12px] text-stone-400 animate-pulse">Carregando…</p>
        ) : lista.length === 0 ? (
          <p className="text-[12px] text-stone-400">Nenhuma afiliada ainda. Mande o link acima para quem vai divulgar a loja.</p>
        ) : (
          <div className="divide-y divide-painel-borda">
            {lista.map((a) => (
              <div key={a.afiliadoId} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 text-[12px] text-stone-500">
                  <p className="text-[13px] font-semibold text-painel-tinta">
                    {a.nome}
                    {!a.ativo && <span className="ml-2 text-[10px] font-bold uppercase text-rose-700">desligada</span>}
                  </p>
                  <p>{[a.email, a.telefone].filter(Boolean).join(' · ')} · código {a.codigo}</p>
                  <p className="text-painel-tinta">
                    {a.clientesIndicados} entraram · {a.clientesQuePagaram} pagaram · {a.parcelasPagas} parcela(s) ·{' '}
                    comissão {reais(a.totalGanho)}{a.aDefinir > 0 ? ` (+${a.aDefinir} a definir)` : ''}
                  </p>
                </div>
                {!ehColaborador && (
                  <button type="button" onClick={() => alternar(a)} disabled={ocupado === a.afiliadoId}
                    className="h-9 px-4 rounded-full border border-painel-borda text-[12px] font-semibold text-painel-tinta hover:bg-stone-50 disabled:opacity-50 cursor-pointer">
                    {a.ativo ? 'Desligar' : 'Reativar'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
