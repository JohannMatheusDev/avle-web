'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

type Fatura = { link?: string; valor?: number; vencimento?: string; primeiroNome?: string; plano?: string; loja?: string; error?: string };

/**
 * O link da mensagem de cobrança: leva a cliente direto à fatura, sem login.
 *
 * Antes a mensagem mandava o endereço do painel, que abre na tela de entrar.
 * A cliente que já tinha conta e só queria pagar caía num pedido de código e
 * desistia. Agora o servidor confere a assinatura do link, reaproveita ou
 * emite a fatura da parcela em aberto, e a página só encaminha para ela - que
 * era como funcionava quando a mensagem levava a fatura do Asaas.
 */
export default function PagarPeloLink() {
  const params = useParams();
  const router = useRouter();
  const token = decodeURIComponent(String(params.token || ''));

  const [fatura, setFatura] = useState<Fatura | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    const buscar = async () => {
      // A API dorme quando ninguém usa: a primeira chamada pode falhar por rede
      // antes de ela acordar, e a cliente veria erro justamente ao tocar no link.
      for (let tentativa = 1; tentativa <= 4; tentativa++) {
        try {
          const resposta = await apiFetch(`${API_URL}/api/pagamentos/publico/${encodeURIComponent(token)}`);
          const corpo: Fatura = await resposta.json().catch(() => ({}));
          if (!ativo) return;
          if (resposta.ok && corpo.link) {
            setFatura(corpo);
            window.location.replace(corpo.link);
            return;
          }
          if (resposta.status < 500 || tentativa === 4) {
            setErro(corpo.error || 'Não foi possível abrir o pagamento por este link.');
            return;
          }
        } catch {
          if (tentativa === 4) {
            if (ativo) setErro('Não conseguimos falar com o servidor. Confira a internet e toque no link de novo.');
            return;
          }
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    };

    buscar();
    return () => {
      ativo = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen fundo-painel flex items-center justify-center p-4">
      <div className="cartao-avle p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[#0B1E14] rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-[#F5F2EB] font-black text-2xl">AV</span>
        </div>

        {erro ? (
          <>
            <h1 className="text-lg font-bold text-[#0B1E14]">Não deu para abrir o pagamento</h1>
            <p className="text-sm text-stone-500 mt-2 leading-relaxed">{erro}</p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="mt-6 px-6 py-3 bg-[#0B1E14] text-white font-bold rounded-full text-xs uppercase tracking-wider cursor-pointer"
            >
              Entrar no app da AVLE
            </button>
          </>
        ) : (
          <>
            <h1 className="text-lg font-bold text-[#0B1E14]">
              {fatura?.primeiroNome ? `Olá, ${fatura.primeiroNome}!` : 'Abrindo o seu pagamento'}
            </h1>
            <p className="text-sm text-stone-500 mt-2 leading-relaxed">
              {fatura
                ? `Levando você para a parcela do plano ${fatura.plano}${fatura.loja ? `, da ${fatura.loja}` : ''}.`
                : 'Estamos preparando a sua parcela. Isso leva alguns segundos.'}
            </p>
            <div className="mt-6 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-[#BD6B42] rounded-full animate-pulse" />
            </div>
            {fatura?.link && (
              <a href={fatura.link} className="inline-block mt-6 text-xs font-bold text-[#BD6B42] underline">
                Se a página não abrir sozinha, toque aqui
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
