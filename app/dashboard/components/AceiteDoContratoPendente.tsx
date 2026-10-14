'use client';

/**
 * Trava o painel da loja enquanto o contrato AVLE x Lojista não foi aceito.
 *
 * Pelo convite isto não acontece - criar o acesso e aceitar é um passo só -,
 * mas a regra é que sem aceite o painel não abre, e a trava não pode depender
 * de a loja ter entrado pela porta certa. Só a conta principal aceita; o
 * colaborador vê o aviso.
 */

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import ContratoDoLojista, { type DadosDoContrato } from '../../documentos/ContratoDoLojista';

export default function AceiteDoContratoPendente({ usuario, aoAceitar }: {
  usuario: { lojaId?: number | null; tipoUsuario?: string | null };
  aoAceitar: () => void;
}) {
  const lojaId = usuario?.lojaId;
  const ehDona = String(usuario?.tipoUsuario).toUpperCase() === 'LOJA';
  const [dados, setDados] = useState<DadosDoContrato | null>(null);
  const [marcou, setMarcou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    apiFetch(`/api/lojas/${lojaId}/contrato-lojista`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => ativo && setDados(d))
      .catch(() => ativo && setErro('Não foi possível carregar o contrato agora.'));
    return () => { ativo = false; };
  }, [lojaId]);

  const aceitar = async () => {
    setEnviando(true);
    setErro('');
    try {
      const r = await apiFetch(`/api/lojas/${lojaId}/contrato-lojista/aceitar`, { method: 'POST' });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.erro || 'Não foi possível registrar o aceite.');
      const salva = localStorage.getItem('@avle:usuario');
      if (salva) localStorage.setItem('@avle:usuario', JSON.stringify({ ...JSON.parse(salva), contratoPendente: false }));
      aoAceitar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível registrar o aceite.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen fundo-painel p-4 sm:p-8">
      <div className="max-w-4xl mx-auto cartao-avle p-6 space-y-4 text-left">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#BD6B42] font-bold">Antes de começar</p>
          <h1 className="text-xl font-bold text-[#0B1E14] mt-1">Contrato com a AVLE</h1>
          <p className="text-sm text-stone-600 mt-1">
            {ehDona ? 'Leia e aceite o contrato e o Anexo II para usar o painel da loja.'
              : 'O painel abre depois que a conta principal da loja aceitar o contrato com a AVLE.'}
          </p>
        </div>
        {erro && <p className="text-xs text-rose-600">{erro}</p>}
        {dados && <ContratoDoLojista dados={dados} alturaMaxima="60vh" />}
        {ehDona && dados && (
          <>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={marcou} onChange={(e) => setMarcou(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#0B1E14]" />
              <span className="text-[12px] text-stone-600">
                Li e aceito, em nome de {dados.razaoSocial}, o contrato e o seu Anexo II.
              </span>
            </label>
            <button type="button" onClick={aceitar} disabled={!marcou || enviando}
              className="h-11 px-6 rounded-full bg-[#0B1E14] text-white text-[12px] font-bold uppercase tracking-wide disabled:opacity-50 cursor-pointer">
              {enviando ? 'Registrando…' : 'Aceitar e entrar'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
