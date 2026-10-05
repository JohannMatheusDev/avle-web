'use client';

/**
 * A conta do Asaas da loja, nas Configurações. É nela que as cobranças das
 * clientes nascem: o dinheiro cai direto na conta da loja, a taxa do Asaas sai
 * de lá, e a AVLE recebe 10% do valor da parcela pelo split. A loja conecta com
 * a carteira (Wallet ID) e a chave de API; o servidor confere as duas no Asaas.
 */

import { useEffect, useState } from 'react';
import { API_URL, apiFetch } from '../../lib/api';

export default function ContaAsaasDaLoja({
  lojaId,
  mostrarAviso,
  aoConectar,
}: {
  lojaId: number | undefined;
  mostrarAviso: (titulo: string, texto: string, erro: boolean) => void;
  /** Depois de conectar, quem mostra o saldo recarrega. */
  aoConectar?: () => void;
}) {
  const [situacao, setSituacao] = useState<{ conectada: boolean; walletId?: string } | null>(null);
  const [walletId, setWalletId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [trocando, setTrocando] = useState(false);

  useEffect(() => {
    if (!lojaId) return;
    apiFetch(`${API_URL}/api/lojas/${lojaId}/conta-asaas`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => { if (s) setSituacao(s); })
      .catch(() => {});
  }, [lojaId]);

  const conectar = async () => {
    setEnviando(true);
    try {
      const r = await apiFetch(`${API_URL}/api/lojas/${lojaId}/conta-asaas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId: walletId.trim(), apiKey: apiKey.trim() }),
      });
      const dados = await r.json().catch(() => ({}));
      if (!r.ok || !dados.conectada) throw new Error(dados.erro || 'Não foi possível conectar agora.');
      setSituacao({ conectada: true, walletId: dados.walletId });
      setApiKey('');
      setWalletId('');
      setTrocando(false);
      aoConectar?.();
      mostrarAviso(
        'Conta do Asaas conectada',
        dados.webhook?.configurado
          ? 'As próximas cobranças das suas clientes nascem na sua conta do Asaas.'
          : `A conta foi conectada, mas o aviso de pagamento não foi ligado: ${dados.webhook?.motivo ?? ''} Fale com a AVLE.`,
        !dados.webhook?.configurado,
      );
    } catch (e) {
      mostrarAviso('Não conectou', e instanceof Error ? e.message : 'Tente de novo.', true);
    } finally {
      setEnviando(false);
    }
  };

  const campo = 'w-full h-11 px-4 bg-painel-papel ring-1 ring-painel-borda rounded-full text-[13px] text-painel-tinta font-mono focus:outline-none focus:ring-2 focus:ring-painel-acento/50';
  const mostrarFormulario = !situacao?.conectada || trocando;

  return (
    <div className="cartao-avle p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">Conta do Asaas</h3>
          <p className="text-[12px] text-stone-500 mt-1 leading-relaxed">
            As parcelas das suas clientes caem direto na sua conta do Asaas. A taxa do Asaas é descontada lá, e a AVLE
            recebe 10% do valor de cada parcela.
          </p>
        </div>
        {situacao && (
          <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${situacao.conectada ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
            {situacao.conectada ? 'Conectada' : 'Não conectada'}
          </span>
        )}
      </div>

      {situacao?.conectada && !trocando && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-stone-500 break-all">Carteira: <span className="font-mono text-painel-tinta">{situacao.walletId}</span></p>
          <button type="button" onClick={() => setTrocando(true)}
            className="text-[12px] font-semibold text-stone-500 hover:text-painel-tinta cursor-pointer">
            Trocar conta
          </button>
        </div>
      )}

      {mostrarFormulario && (
        <div className="space-y-2">
          <p className="text-[12px] text-stone-500 leading-relaxed">
            No app ou no site do Asaas, abra <strong className="text-painel-tinta">Integrações</strong>. Lá estão o
            Wallet ID e a chave de API, que começa com <span className="font-mono">$aact_</span>. Copie os dois da mesma
            conta, a da sua loja.
          </p>
          <input value={walletId} onChange={(e) => setWalletId(e.target.value)} placeholder="Wallet ID"
            autoCapitalize="none" autoComplete="off" className={campo} />
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Chave de API ($aact_...)"
            type="password" autoComplete="off" className={campo} />
          <div className="flex gap-2">
            {trocando && (
              <button type="button" onClick={() => setTrocando(false)}
                className="h-11 px-5 rounded-full border border-painel-borda text-[13px] font-semibold text-stone-500 cursor-pointer">
                Voltar
              </button>
            )}
            <button type="button" onClick={conectar} disabled={enviando || apiKey.trim().length < 10}
              className="flex-1 h-11 rounded-full bg-painel-tinta text-white text-[13px] font-semibold hover:bg-avle-verde disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              {enviando ? 'Conferindo no Asaas…' : 'Conectar conta'}
            </button>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            A chave fica guardada cifrada e não aparece mais na tela. O AVLE confere no Asaas se a chave e o Wallet ID
            são da mesma conta antes de salvar.
          </p>
        </div>
      )}
    </div>
  );
}
