'use client';

/**
 * Troca o celular da cliente, pela loja ou pela AVLE.
 *
 * O código de acesso só sai pelo WhatsApp: com o número errado no cadastro
 * (fixo, sem o 9, de outra pessoa) a cliente nunca recebe o código e não
 * consegue entrar. Quem resolve é quem atende, sem precisar da AVLE.
 */

import { useState } from 'react';
import { apiFetch } from '../../lib/api';
import { somenteDigitos } from '../../lib/validacao';

export const mascaraCelular = (valor: string) => {
  const v = somenteDigitos(valor).slice(0, 11);
  if (v.length <= 2) return v;
  if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
};

export default function TrocarCelular({ clienteId, telefoneAtual, aoTrocar }: {
  clienteId: number;
  telefoneAtual?: string;
  /** Recebe o número gravado, só dígitos, para a lista mostrar sem recarregar. */
  aoTrocar: (telefone: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [numero, setNumero] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const abrir = () => {
    setNumero(mascaraCelular(telefoneAtual || ''));
    setErro('');
    setAberto(true);
  };

  const salvar = async () => {
    setSalvando(true);
    setErro('');
    try {
      const r = await apiFetch(`/api/usuarios/${clienteId}/telefone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: somenteDigitos(numero) }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.erro || d?.error || 'Não foi possível trocar o celular.');
      aoTrocar(String(d?.telefone ?? somenteDigitos(numero)));
      setAberto(false);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível trocar o celular.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) {
    return (
      <button type="button" onClick={abrir}
        className="text-[10px] font-bold text-painel-tinta hover:underline cursor-pointer uppercase tracking-wider">
        Trocar celular
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1 text-left">
      <div className="flex items-center gap-2">
        <input
          type="tel"
          inputMode="numeric"
          aria-label="Novo celular da cliente"
          placeholder="(42) 99999-9999"
          value={numero}
          onChange={(e) => setNumero(mascaraCelular(e.target.value))}
          onKeyDown={(e) => { if (e.key === 'Enter') salvar(); if (e.key === 'Escape') setAberto(false); }}
          disabled={salvando}
          autoFocus
          className="h-8 w-36 px-3 bg-white border border-stone-200 rounded-lg text-xs font-mono focus:outline-none focus:border-painel-tinta"
        />
        <button type="button" onClick={salvar} disabled={salvando || somenteDigitos(numero).length < 10}
          className="h-8 px-3 rounded-lg bg-painel-tinta text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50">
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
        <button type="button" onClick={() => setAberto(false)} disabled={salvando}
          className="text-[10px] font-bold text-stone-400 hover:text-stone-700 cursor-pointer uppercase tracking-wider">
          Cancelar
        </button>
      </div>
      {erro && <p className="text-[11px] text-rose-600">{erro}</p>}
    </div>
  );
}
