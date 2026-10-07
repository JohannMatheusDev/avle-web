'use client';

/**
 * Corrige o cadastro de uma cliente: nome, CPF, e-mail e telefone. Busca pelo
 * nome, CPF, telefone ou e-mail, mostra o que está gravado e, ao salvar, o
 * antes e o depois. O servidor confere o CPF e se algum dado já é de outra
 * conta.
 */

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

type Cliente = { id: number; nome: string; cpf?: string; email?: string; telefone?: string; tipo?: string; grupos: string[] };
type Campos = { nome: string; cpf: string; email: string; telefone: string };

const campo = 'w-full h-10 px-4 bg-white ring-1 ring-painel-borda rounded-full text-[13px] text-painel-tinta focus:outline-none focus:ring-2 focus:ring-painel-acento/50';

export default function CorrigirCadastro() {
  const [busca, setBusca] = useState('');
  const [lista, setLista] = useState<Cliente[] | null>(null);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [valores, setValores] = useState<Campos>({ nome: '', cpf: '', email: '', telefone: '' });
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const buscar = async () => {
    setOcupado(true);
    setAviso('');
    try {
      const r = await apiFetch(`/api/admin/clientes?busca=${encodeURIComponent(busca.trim())}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || 'Não deu para buscar.');
      setLista(d);
      setEditando(null);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu para buscar.');
    } finally {
      setOcupado(false);
    }
  };

  // As clientes com CPF inválido: o Asaas recusa a cobrança delas, e o Pix não sai.
  const verCpfsInvalidos = async () => {
    setOcupado(true);
    setAviso('');
    try {
      const r = await apiFetch('/api/admin/clientes/cpf-invalido');
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || 'Não deu para buscar.');
      setLista(d);
      setEditando(null);
      setAviso(d.length ? `${d.length} cliente(s) com CPF inválido: o Pix delas não sai até corrigir.` : 'Nenhuma cliente com CPF inválido.');
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu para buscar.');
    } finally {
      setOcupado(false);
    }
  };

  const abrir = (c: Cliente) => {
    setEditando(c);
    setValores({ nome: c.nome ?? '', cpf: c.cpf ?? '', email: c.email ?? '', telefone: c.telefone ?? '' });
    setAviso('');
  };

  const salvar = async () => {
    if (!editando) return;
    setOcupado(true);
    setAviso('');
    try {
      const r = await apiFetch(`/api/admin/clientes/${editando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || 'Não deu para salvar.');
      const mudou = (['nome', 'cpf', 'email', 'telefone'] as const)
        .filter((k) => d.antes[k] !== d.depois[k])
        .map((k) => `${k}: ${d.antes[k] ?? '—'} → ${d.depois[k]}`);
      setAviso(mudou.length ? `Salvo. ${mudou.join(' · ')}` : 'Nada mudou: os dados já estavam assim.');
      setLista((l) => l?.map((c) => (c.id === editando.id ? { ...c, ...d.depois } : c)) ?? null);
      setEditando(null);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu para salvar.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="cartao-avle p-6 mb-6 space-y-4">
      <div>
        <h3 style={{ fontWeight: 600 }} className="text-[16px] text-painel-tinta">Corrigir cadastro de cliente</h3>
        <p className="text-[12px] text-stone-500 mt-1 max-w-xl leading-relaxed">
          Busque pelo nome, CPF, telefone ou e-mail. O CPF é conferido, e nenhum dado pode ser de outra conta. Celular
          sem o nono dígito ganha o 9 ao salvar.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, CPF, telefone ou e-mail"
          onKeyDown={(e) => { if (e.key === 'Enter' && busca.trim().length >= 3) buscar(); }}
          className={`${campo} flex-1 min-w-[200px]`} />
        <button type="button" onClick={buscar} disabled={ocupado || busca.trim().length < 3}
          className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
          Buscar
        </button>
        <button type="button" onClick={verCpfsInvalidos} disabled={ocupado}
          className="h-10 px-5 rounded-full border border-painel-borda text-[12px] font-semibold text-painel-tinta hover:bg-stone-50 disabled:opacity-50 cursor-pointer">
          Ver CPFs inválidos
        </button>
      </div>

      {lista && lista.length === 0 && <p className="text-[12px] text-stone-400">Ninguém com essa busca.</p>}
      {lista && lista.length > 0 && !editando && (
        <div className="divide-y divide-painel-borda">
          {lista.map((c) => (
            <div key={c.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 text-[12px] text-stone-500">
                <p className="text-[13px] font-semibold text-painel-tinta">{c.nome}</p>
                <p>CPF {c.cpf || '—'} · {c.telefone || 'sem telefone'} · {c.email || 'sem e-mail'}</p>
                <p className="text-stone-400">{c.grupos.length ? c.grupos.join(', ') : 'sem grupo'}</p>
              </div>
              <button type="button" onClick={() => abrir(c)}
                className="h-9 px-4 rounded-full border border-painel-borda text-[12px] font-semibold text-painel-tinta hover:bg-stone-50 cursor-pointer">
                Corrigir
              </button>
            </div>
          ))}
        </div>
      )}

      {editando && (
        <div className="rounded-2xl bg-painel-papel p-4 space-y-2">
          <p className="text-[13px] font-semibold text-painel-tinta">Corrigindo: {editando.nome}</p>
          {(['nome', 'cpf', 'email', 'telefone'] as const).map((k) => (
            <label key={k} className="block">
              <span className="block text-[11px] text-stone-400 mb-1">{{ nome: 'Nome', cpf: 'CPF', email: 'E-mail', telefone: 'Telefone' }[k]}</span>
              <input value={valores[k]} onChange={(e) => setValores((v) => ({ ...v, [k]: e.target.value }))} className={campo} />
            </label>
          ))}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setEditando(null)}
              className="h-10 px-5 rounded-full border border-painel-borda text-[12px] font-semibold text-stone-500 cursor-pointer">
              Voltar
            </button>
            <button type="button" onClick={salvar} disabled={ocupado}
              className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
              {ocupado ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {aviso && <p className="text-[12px] text-painel-tinta break-words">{aviso}</p>}
    </div>
  );
}
