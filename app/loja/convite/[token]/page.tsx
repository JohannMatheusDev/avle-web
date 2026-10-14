'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import RegrasDaSenha from '../../../components/RegrasDaSenha';
import { senhaForte, somenteDigitos, telefoneValido } from '../../../lib/validacao';
import ContratoDoLojista, { type DadosDoContrato } from '../../../documentos/ContratoDoLojista';
import { formatarPercentual } from '../../../documentos/preencher';

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * O convite que a AVLE manda ao lojista: o contrato preenchido com os dados
 * da loja e o percentual negociado, e o formulário para criar o acesso.
 *
 * Criar o acesso e aceitar são um passo só. Separados, sobraria uma conta de
 * loja com acesso e sem contrato, e o painel teria de trancar logo em seguida.
 */
export default function ConviteDoLojista() {
  const params = useParams();
  const router = useRouter();
  const token = decodeURIComponent(String(params.token || ''));

  const [dados, setDados] = useState<DadosDoContrato | null>(null);
  const [erroDoLink, setErroDoLink] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [aceitou, setAceitou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    const buscar = async () => {
      // A API dorme quando ninguém usa: a primeira chamada pode falhar por rede.
      for (let tentativa = 1; tentativa <= 4; tentativa++) {
        try {
          const r = await apiFetch(`/api/lojas/convite-lojista/${encodeURIComponent(token)}`);
          const d = await r.json().catch(() => null);
          if (!ativo) return;
          if (r.ok) { setDados(d); return; }
          if (r.status < 500 || tentativa === 4) { setErroDoLink(d?.erro || 'Este link de convite não vale mais.'); return; }
        } catch {
          if (tentativa === 4) { if (ativo) setErroDoLink('Não conseguimos falar com o servidor. Tente de novo em instantes.'); return; }
        }
        await new Promise((res) => setTimeout(res, 3000));
      }
    };
    buscar();
    return () => { ativo = false; };
  }, [token]);

  const mascaraTelefone = (v: string) => {
    const d = somenteDigitos(v).slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const valido = nome.trim().split(/\s+/).length >= 2 && regexEmail.test(email.trim())
    && telefoneValido(telefone) && senhaForte(senha) && aceitou;

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    setEnviando(true);
    setErro('');
    try {
      const r = await apiFetch(`/api/lojas/convite-lojista/${encodeURIComponent(token)}/aceitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim(), telefone: somenteDigitos(telefone), senha, aceitouContrato: aceitou }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.erro || 'Não foi possível criar o acesso.');
      localStorage.setItem('@avle:usuario', JSON.stringify(d));
      router.push('/dashboard');
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível criar o acesso.');
      setEnviando(false);
    }
  };

  const campo = 'w-full px-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-base sm:text-sm bg-stone-50 h-[48px]';
  const rotulo = 'block text-[10px] font-bold uppercase text-stone-500 mb-1';

  if (erroDoLink) {
    return (
      <div className="min-h-screen fundo-painel flex items-center justify-center p-4">
        <div className="cartao-avle p-8 max-w-md w-full text-center">
          <h1 className="text-lg font-bold text-[#0B1E14]">Convite indisponível</h1>
          <p className="text-sm text-stone-500 mt-2">{erroDoLink}</p>
        </div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="min-h-screen fundo-painel flex items-center justify-center p-4">
        <p className="text-sm text-stone-500">Preparando o seu contrato…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen fundo-painel p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="text-left">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#BD6B42] font-bold">Convite AVLE</p>
          <h1 className="text-2xl font-bold text-[#0B1E14] mt-1">Bem-vinda, {dados.nomeComercial}</h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">
            Leia o contrato e o Anexo II, preenchidos com os dados da sua loja. A remuneração da AVLE combinada com vocês é de{' '}
            <strong>{formatarPercentual(Number(dados.percentualAvle))}</strong> de cada parcela. Para entrar no painel, crie o
            acesso e aceite.
          </p>
        </header>

        <div className="grid lg:grid-cols-[1fr_22rem] gap-6 items-start">
          <div className="cartao-avle p-4 sm:p-6">
            <ContratoDoLojista dados={dados} alturaMaxima="70vh" />
          </div>

          <form onSubmit={criar} className="cartao-avle p-6 space-y-4 text-left lg:sticky lg:top-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-600">Criar o acesso da loja</h2>
            <div>
              <label className={rotulo} htmlFor="cl-nome">Nome completo de quem aceita *</label>
              <input id="cl-nome" className={campo} value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
            </div>
            <div>
              <label className={rotulo} htmlFor="cl-email">E-mail de acesso *</label>
              <input id="cl-email" type="email" className={campo} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <label className={rotulo} htmlFor="cl-telefone">Telefone / WhatsApp *</label>
              <input id="cl-telefone" type="tel" inputMode="numeric" className={campo} value={telefone}
                onChange={(e) => setTelefone(mascaraTelefone(e.target.value))} placeholder="(42) 99999-9999" />
            </div>
            <div>
              <label className={rotulo} htmlFor="cl-senha">Senha *</label>
              <input id="cl-senha" type="password" className={campo} value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
              <RegrasDaSenha senha={senha} />
            </div>
            <label className="flex items-start gap-3 p-3 bg-stone-50 border border-stone-200/60 rounded-xl cursor-pointer">
              <input type="checkbox" checked={aceitou} onChange={(e) => setAceitou(e.target.checked)} className="mt-0.5 w-5 h-5 shrink-0 accent-[#0B1E14]" />
              <span className="text-[11px] text-stone-600 leading-relaxed">
                Li e aceito, em nome de {dados.razaoSocial}, o Contrato de Prestação de Serviços de Intermediação e Uso da
                Plataforma AVLE e o seu Anexo II, com remuneração da AVLE de {formatarPercentual(Number(dados.percentualAvle))}.
              </span>
            </label>
            {erro && <p className="text-xs text-rose-600 font-medium">{erro}</p>}
            <button type="submit" disabled={!valido || enviando}
              className="w-full py-4 bg-[#0B1E14] text-white font-bold rounded-full uppercase tracking-wide text-xs disabled:opacity-50 cursor-pointer">
              {enviando ? 'Criando o acesso…' : 'Aceitar e entrar no painel'}
            </button>
            <p className="text-[10px] text-stone-400 leading-relaxed">
              O aceite fica registrado com data, hora e endereço de rede, conforme a cláusula 15.11 do contrato.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
