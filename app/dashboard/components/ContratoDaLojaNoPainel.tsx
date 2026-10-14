'use client';

/**
 * O contrato AVLE x Lojista dentro dos painéis: na loja, para ler e baixar;
 * no admin, também para gerar um link novo enquanto a loja não aceitou.
 *
 * As lojas que já operavam antes do contrato (exigido = falso e sem aceite)
 * veem o aviso de que não há contrato registrado no sistema, em vez de um
 * contrato que nunca aceitaram.
 */

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import ContratoDoLojista, { type DadosDoContrato } from '../../documentos/ContratoDoLojista';

export default function ContratoDaLojaNoPainel({ lojaId, ehAdmin = false }: { lojaId: number; ehAdmin?: boolean }) {
  const [dados, setDados] = useState<DadosDoContrato | null>(null);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    let ativo = true;
    apiFetch(`/api/lojas/${lojaId}/contrato-lojista`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => ativo && setDados(d))
      .catch(() => ativo && setErro('Não foi possível carregar o contrato agora.'));
    return () => { ativo = false; };
  }, [lojaId]);

  const gerarLink = async () => {
    setGerando(true);
    setErro('');
    try {
      const r = await apiFetch(`/api/admin/lojas/${lojaId}/convite`, { method: 'POST' });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.erro || 'Não foi possível gerar o link.');
      setLink(d.link);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar o link.');
    } finally {
      setGerando(false);
    }
  };

  const situacao = !dados ? '' : dados.aceito
    ? `Aceito em ${dados.aceitoEm ? new Date(dados.aceitoEm).toLocaleDateString('pt-BR') : '—'}${dados.aceitoPor ? ` por ${dados.aceitoPor}` : ''}`
    : dados.exigido ? 'Aguardando o aceite do lojista' : 'Loja anterior ao contrato no sistema: não há aceite registrado';

  return (
    <div className="cartao-avle p-6 space-y-3 text-left">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">Contrato com a AVLE</h3>
          <p className="text-[12px] text-stone-500 mt-0.5">{erro || situacao}</p>
        </div>
        {dados && (dados.aceito || dados.exigido) && (
          <button type="button" onClick={() => setAberto(!aberto)}
            className="h-9 px-4 rounded-full border border-stone-200 text-[12px] font-semibold text-painel-tinta cursor-pointer">
            {aberto ? 'Fechar' : 'Ver o contrato'}
          </button>
        )}
      </div>

      {ehAdmin && dados && dados.exigido && !dados.aceito && (
        <div className="space-y-2">
          <button type="button" onClick={gerarLink} disabled={gerando}
            className="h-9 px-4 rounded-full bg-painel-tinta text-white text-[12px] font-semibold disabled:opacity-50 cursor-pointer">
            {gerando ? 'Gerando…' : 'Gerar link novo do convite'}
          </button>
          {link && <p className="text-[12px] font-mono bg-painel-papel rounded-xl p-3 break-all select-all">{link}</p>}
        </div>
      )}

      {aberto && dados && <ContratoDoLojista dados={dados} alturaMaxima="65vh" />}
    </div>
  );
}
