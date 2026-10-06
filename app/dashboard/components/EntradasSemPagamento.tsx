'use client';

/**
 * Quem clicou para entrar num grupo e não pagou a primeira parcela, por grupo.
 * A AVLE marca os grupos e manda o lembrete pelo WhatsApp. Ninguém é tirado
 * do grupo aqui.
 */

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

type Linha = { cotaId: number; nome: string; telefone?: string; email?: string; temCelular: boolean; valor?: number; reserva?: boolean };
type Grupo = { grupoId: number; grupo: string; loja?: string; cotas: Linha[] };

export default function EntradasSemPagamento() {
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);
  const [marcados, setMarcados] = useState<number[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState('');

  const carregar = async () => {
    setOcupado(true);
    setAviso('');
    try {
      const r = await apiFetch('/api/admin/entradas-sem-pagamento');
      if (!r.ok) throw new Error();
      setGrupos(await r.json());
      setMarcados([]);
    } catch {
      setAviso('Não foi possível carregar a lista.');
    } finally {
      setOcupado(false);
    }
  };

  const escolhidos = (grupos ?? []).filter((g) => marcados.includes(g.grupoId));
  const cotas = escolhidos.flatMap((g) => g.cotas.filter((c) => c.temCelular).map((c) => c.cotaId));

  const avisar = async () => {
    if (!window.confirm(`Mandar o lembrete da entrada pelo WhatsApp para ${cotas.length} cliente(s) de ${escolhidos.map((g) => g.grupo).join(', ')}?`)) return;
    setOcupado(true);
    try {
      const r = await apiFetch('/api/admin/entradas-sem-pagamento/avisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cotaIds: cotas }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || 'Não saiu.');
      setAviso(`${d.enviados} lembrete(s) enviado(s).${d.jaPagaram ? ` ${d.jaPagaram} já tinham pago.` : ''}${d.semCelular ? ` ${d.semCelular} sem celular.` : ''}${d.falhas?.length ? ` Não saíram: ${d.falhas.join('; ')}` : ''}`);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não saiu.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="cartao-avle p-6 mb-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 style={{ fontWeight: 600 }} className="text-[16px] text-painel-tinta">Entraram e não pagaram a entrada</h3>
          <p className="text-[12px] text-stone-500 mt-1 max-w-xl leading-relaxed">
            Quem está num grupo e nunca pagou nada, nem a primeira parcela. Elas não entram no sorteio. Marque os
            grupos e mande o lembrete pelo WhatsApp. Ninguém sai do grupo por aqui. Antes, confira os pagamentos no
            Asaas, logo acima, para não lembrar quem já pagou.
          </p>
        </div>
        <button type="button" onClick={carregar} disabled={ocupado}
          className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
          {ocupado && !grupos ? 'Carregando…' : 'Ver quem não pagou'}
        </button>
      </div>

      {grupos && grupos.length === 0 && <p className="text-[12px] text-stone-400">Ninguém com a entrada em aberto.</p>}

      {grupos && grupos.map((g) => (
        <div key={g.grupoId} className="rounded-2xl bg-painel-papel p-4 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={marcados.includes(g.grupoId)}
              onChange={(e) => setMarcados((m) => e.target.checked ? [...m, g.grupoId] : m.filter((x) => x !== g.grupoId))} />
            <span className="text-[13px] font-semibold text-painel-tinta">{g.grupo}</span>
            <span className="text-[12px] text-stone-400">· {g.loja} · {g.cotas.length} sem pagar</span>
          </label>
          <ul className="text-[12px] text-stone-600 space-y-0.5 pl-6">
            {g.cotas.map((c) => (
              <li key={c.cotaId}>
                {c.nome} <span className="text-stone-400">· {c.telefone || 'sem telefone'}{!c.temCelular ? ' (não recebe WhatsApp)' : ''}{c.reserva ? ' · vaga reservada' : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {grupos && grupos.length > 0 && (
        <button type="button" onClick={avisar} disabled={ocupado || cotas.length === 0}
          className="h-10 px-5 rounded-full bg-painel-acento text-white text-[12px] font-semibold disabled:opacity-40 cursor-pointer">
          {ocupado ? 'Enviando…' : `Avisar ${cotas.length} pelo WhatsApp`}
        </button>
      )}
      {aviso && <p className="text-[12px] text-painel-tinta break-words">{aviso}</p>}
    </div>
  );
}
