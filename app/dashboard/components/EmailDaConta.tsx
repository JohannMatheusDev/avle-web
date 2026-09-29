'use client';

/**
 * O e-mail da conta da loja, nas Configurações. Corrige de uma vez o e-mail do
 * login no AVLE e o da subconta do Asaas - para onde o Asaas manda o link de
 * senha e os avisos da conta.
 */

import { useState } from 'react';
import { API_URL, apiFetch } from '../../lib/api';

const lerErro = async (res: Response, padrao: string) => {
  const texto = await res.text().catch(() => '');
  try {
    return JSON.parse(texto)?.erro || padrao;
  } catch {
    return texto || padrao;
  }
};

export default function EmailDaConta({
  lojaId,
  emailAtual,
  mostrarAviso,
}: {
  lojaId: number | undefined;
  emailAtual?: string;
  mostrarAviso: (titulo: string, texto: string, erro: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [atual, setAtual] = useState(emailAtual || '');

  const valido = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) && senha.length > 0;

  const salvar = async () => {
    setEnviando(true);
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/email-da-conta`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), senhaDoPainel: senha }),
      });
      if (!res.ok) throw new Error(await lerErro(res, 'Não foi possível trocar o e-mail agora.'));
      const r = await res.json();
      setAtual(r.email);
      setEmail('');
      setSenha('');
      // O login também usa este e-mail: a sessão guardada no navegador passa a mostrar o novo.
      try {
        const salvo = JSON.parse(localStorage.getItem('@avle:usuario') || '{}');
        localStorage.setItem('@avle:usuario', JSON.stringify({ ...salvo, email: r.email }));
      } catch {
        // Sem armazenamento, o e-mail novo aparece no próximo login.
      }
      mostrarAviso(
        'E-mail trocado',
        r.asaasAtualizado
          ? `O e-mail agora é ${r.email}, no AVLE e no Asaas. Para entrar no Asaas, use "Esqueci minha senha" em asaas.com com este e-mail.`
          : `O e-mail do login no AVLE agora é ${r.email}.${r.motivo ? ` ${r.motivo}` : ''}`,
        false,
      );
    } catch (e) {
      mostrarAviso('Não deu certo', e instanceof Error ? e.message : 'Tente de novo em instantes.', true);
    } finally {
      setEnviando(false);
    }
  };

  const campo = 'w-full h-11 px-4 bg-painel-papel ring-1 ring-painel-borda rounded-full text-[13px] text-painel-tinta focus:outline-none focus:ring-2 focus:ring-painel-acento/50';

  return (
    <div className="cartao-avle p-6 space-y-3">
      <div>
        <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">E-mail da conta</h3>
        <p className="text-[12px] text-stone-500 mt-1 leading-relaxed">
          É com ele que a loja entra no AVLE, e é para ele que o Asaas manda o link de senha e os avisos da conta.
          {atual && <> Hoje: <strong className="text-painel-tinta">{atual}</strong>.</>}
        </p>
      </div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail certo" inputMode="email"
        autoCapitalize="none" className={campo} />
      <input value={senha} onChange={(e) => setSenha(e.target.value)} type="password" autoComplete="current-password"
        placeholder="Senha do painel, para confirmar" className={campo} />
      <button type="button" onClick={salvar} disabled={!valido || enviando}
        className="w-full h-11 rounded-full bg-painel-tinta text-white text-[13px] font-semibold hover:bg-avle-verde disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
        {enviando ? 'Trocando…' : 'Trocar e-mail'}
      </button>
    </div>
  );
}
