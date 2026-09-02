'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

/**
 * As boas-vindas do primeiro acesso, com o aceite dos termos.
 *
 * Fica por cima do painel e nao deixa usar nada antes do aceite. Um aviso que
 * a pessoa pode fechar e ignorar nao serve como consentimento, e e justamente
 * o registro do consentimento que a tela existe para obter.
 *
 * Quem decide se ela aparece e o servidor, e nao a sessao guardada no
 * navegador: se o texto dos termos mudar de versao, quem ja estava logada
 * precisa ver de novo, e a sessao antiga continuaria dizendo que esta tudo
 * aceito ate a proxima entrada.
 */
export default function BoasVindasTermos({ nome }: { nome?: string }) {
  const [precisaAceitar, setPrecisaAceitar] = useState(false);
  const [conferindo, setConferindo] = useState(true);
  const [marcou, setMarcou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    apiFetch(`${API_URL}/api/termos/situacao`)
      .then((r) => (r.ok ? r.json() : null))
      .then((dados) => {
        if (!ativo) return;
        setPrecisaAceitar(Boolean(dados?.precisaAceitar));
      })
      // Servidor fora do ar nao pode trancar a cliente do lado de fora do
      // painel dela. Na duvida, deixa passar: o aceite volta a ser pedido na
      // proxima abertura.
      .catch(() => ativo && setPrecisaAceitar(false))
      .finally(() => ativo && setConferindo(false));

    return () => {
      ativo = false;
    };
  }, []);

  const aceitar = async () => {
    setEnviando(true);
    setErro('');
    try {
      const resposta = await apiFetch(`${API_URL}/api/termos/aceitar`, { method: 'POST' });
      if (!resposta.ok) throw new Error();

      // A sessao guardada tambem passa a saber, para o painel nao piscar a
      // tela de novo antes da proxima conferencia.
      const salva = localStorage.getItem('@avle:usuario');
      if (salva) {
        localStorage.setItem('@avle:usuario', JSON.stringify({ ...JSON.parse(salva), aceitouTermos: true }));
      }
      setPrecisaAceitar(false);
    } catch {
      setErro('Não conseguimos registrar o seu aceite. Verifique a conexão e tente de novo.');
    } finally {
      setEnviando(false);
    }
  };

  if (conferindo || !precisaAceitar) return null;

  const primeiroNome = (nome || '').trim().split(/\s+/)[0] || '';

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1E14]/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">

        <div className="bg-[#0B1E14] px-6 py-7 text-center shrink-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#BD6B42] font-bold">Bem-vinda à AVLE</p>
          <h2 className="text-xl font-bold text-[#DFD9CE] mt-2">
            {primeiroNome ? `Olá, ${primeiroNome}!` : 'Olá!'}
          </h2>
          <p className="text-xs text-[#DFD9CE]/70 mt-2 leading-relaxed">
            Antes de começar, precisamos do seu aceite. É rápido e acontece uma vez só.
          </p>
        </div>

        <div className="px-6 py-5 overflow-y-auto text-sm text-stone-600 space-y-4 leading-relaxed">
          <p>
            A AVLE organiza clubes de compra coletiva junto com lojas parceiras. Ao participar, você
            contribui mensalmente e concorre à contemplação para retirar o seu produto na loja.
          </p>

          <div className="bg-[#F8F6F2] border border-[#DFD9CE] rounded-2xl p-4 space-y-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-stone-500">O que você aceita</p>
            <ul className="space-y-2 text-xs">
              <li>• Pagar a parcela do seu grupo até o <strong>quinto dia útil</strong> de cada mês.</li>
              <li>• Receber avisos de cobrança por e-mail e WhatsApp, com o Pix e o boleto.</li>
              <li>• Que a contemplação segue sorteio auditável, e a retirada depende das parcelas em dia.</li>
              <li>• Que os seus dados são usados para emitir as cobranças e falar com você sobre o plano.</li>
            </ul>
          </div>

          <p className="text-xs text-stone-400">
            O regulamento completo do seu grupo é apresentado pela loja no momento da adesão.
          </p>

          <label className="flex items-start gap-3 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={marcou}
              onChange={(e) => setMarcou(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#BD6B42] cursor-pointer"
            />
            <span className="text-xs text-stone-600">
              Li e aceito os termos de uso da AVLE.
            </span>
          </label>

          {erro && <p className="text-xs text-rose-600 font-medium">{erro}</p>}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 shrink-0">
          <button
            type="button"
            onClick={aceitar}
            disabled={!marcou || enviando}
            className="w-full py-4 bg-[#BD6B42] text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-40 active:scale-[0.99]"
          >
            {enviando ? 'Registrando...' : 'Aceitar e entrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
