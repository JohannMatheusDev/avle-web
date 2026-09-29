'use client';

/**
 * O link do convite que a loja manda ao colaborador. Mostra de qual loja é o
 * convite, pede CPF e senha, cria a conta e já entra no painel da loja.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_URL, apiFetch } from '../../lib/api';

type Convite = { nome: string; email: string; loja: string };

const lerErro = async (res: Response, padrao: string) => {
  const texto = await res.text().catch(() => '');
  try {
    return JSON.parse(texto)?.erro || padrao;
  } catch {
    return texto || padrao;
  }
};

const mascaraCpf = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
};

export default function AceitarConviteDeColaborador() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [convite, setConvite] = useState<Convite | null>(null);
  const [erroDoConvite, setErroDoConvite] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [repetida, setRepetida] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    apiFetch(`${API_URL}/api/auth/colaborador/convite/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await lerErro(res, 'Convite inválido.'));
        return res.json();
      })
      .then((c) => { if (ativo) setConvite(c); })
      .catch((e) => { if (ativo) setErroDoConvite(e instanceof Error ? e.message : 'Convite inválido.'); });
    return () => { ativo = false; };
  }, [token]);

  const valido = cpf.replace(/\D/g, '').length === 11 && senha.length >= 8 && senha === repetida;

  const criarConta = async () => {
    if (!convite) return;
    setEnviando(true);
    setErro('');
    try {
      const res = await apiFetch(`${API_URL}/api/auth/colaborador/convite/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, senha }),
      });
      if (!res.ok) throw new Error(await lerErro(res, 'Não foi possível criar a conta.'));

      // Conta criada: entra direto, com o mesmo login de sempre.
      const login = await apiFetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: convite.email, senha }),
      });
      if (!login.ok) {
        router.push('/');
        return;
      }
      localStorage.setItem('@avle:usuario', JSON.stringify(await login.json()));
      router.push('/dashboard');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível criar a conta.');
    } finally {
      setEnviando(false);
    }
  };

  const campo = 'w-full h-12 px-5 bg-white ring-1 ring-painel-borda rounded-full text-[16px] text-painel-tinta focus:outline-none focus:ring-2 focus:ring-painel-acento/50';

  return (
    <div className="min-h-screen fundo-painel flex items-center justify-center p-4">
      <div className="cartao-avle w-full max-w-md p-7">
        <span className="block text-[12px] text-stone-400">AVLE · convite de equipe</span>
        {erroDoConvite ? (
          <>
            <h1 style={{ fontWeight: 600 }} className="text-[22px] text-painel-tinta mt-2">Convite indisponível</h1>
            <p className="text-[14px] text-stone-500 mt-2 leading-relaxed">{erroDoConvite}</p>
            <button type="button" onClick={() => router.push('/')}
              className="mt-6 w-full h-12 rounded-full bg-painel-tinta text-white text-[14px] font-semibold cursor-pointer">
              Ir para o login
            </button>
          </>
        ) : !convite ? (
          <p className="text-[14px] text-stone-400 mt-4">Carregando o convite…</p>
        ) : (
          <>
            <h1 style={{ fontWeight: 600 }} className="text-[22px] text-painel-tinta mt-2 leading-tight">
              Olá, {convite.nome.split(' ')[0]}! A {convite.loja} convidou você para a equipe.
            </h1>
            <p className="text-[13px] text-stone-500 mt-2 leading-relaxed">
              Crie a sua senha para entrar no painel da loja com o e-mail <strong className="text-painel-tinta">{convite.email}</strong>.
            </p>

            <label className="block text-[12px] text-stone-500 mt-6 mb-1.5" htmlFor="cpf">Seu CPF</label>
            <input id="cpf" inputMode="numeric" autoComplete="off" value={cpf}
              onChange={(e) => setCpf(mascaraCpf(e.target.value))} placeholder="000.000.000-00" className={campo} />

            <label className="block text-[12px] text-stone-500 mt-4 mb-1.5" htmlFor="senha">Senha (mínimo de 8 caracteres)</label>
            <input id="senha" type="password" autoComplete="new-password" value={senha}
              onChange={(e) => setSenha(e.target.value)} className={campo} />

            <label className="block text-[12px] text-stone-500 mt-4 mb-1.5" htmlFor="repetir">Repita a senha</label>
            <input id="repetir" type="password" autoComplete="new-password" value={repetida}
              onChange={(e) => setRepetida(e.target.value)} className={campo} />
            {repetida.length > 0 && senha !== repetida && (
              <p className="text-[12px] text-rose-600 mt-1.5">As duas senhas não são iguais.</p>
            )}

            {erro && <p className="text-[13px] text-rose-600 mt-4 leading-snug">{erro}</p>}

            <button type="button" onClick={criarConta} disabled={!valido || enviando}
              className="mt-6 w-full h-12 rounded-full bg-painel-acento text-white text-[15px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              {enviando ? 'Criando a conta…' : 'Criar conta e entrar'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
