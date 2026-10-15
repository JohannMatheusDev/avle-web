'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { aplicarMascaraCep, somenteDigitos } from '../../lib/validacao';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * O resto do cadastro, pedido depois de a cliente entrar e pagar.
 *
 * O cadastro ficou curto de propósito (CPF, nome e celular), e o endereço veio
 * para cá: na primeira tela ele fazia quem chegava pelo link desistir. Sem
 * ele a loja não libera o produto, então a tela volta enquanto faltar - mas
 * pode ser deixada para depois, porque a cliente que acabou de pagar não
 * precisa do endereço para participar do sorteio.
 *
 * O CEP preenche rua, bairro e cidade pelo ViaCEP, o mesmo das configurações
 * da loja. Digitar endereço no celular é o que mais faz errar.
 */
export default function CompletarCadastro({
  usuarioId,
  titulo,
  aoConcluir,
  aoFechar,
  nomeDaCliente,
}: {
  usuarioId: number;
  titulo?: string;
  aoConcluir: () => void;
  aoFechar: () => void;
  // Preenchido quando é a loja que completa o cadastro da sorteada, no balcão.
  // Aí o e-mail fica de fora: ele recebe avisos da conta, e quem decide qual é
  // a própria cliente.
  nomeDaCliente?: string;
}) {
  const pelaLoja = nomeDaCliente != null;
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [email, setEmail] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // Volta preenchido com o que ela já informou, para corrigir em vez de
  // digitar tudo de novo.
  useEffect(() => {
    let ativo = true;
    apiFetch(`${API_URL}/api/usuarios/${usuarioId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!ativo || !d) return;
        if (d.cep) setCep(aplicarMascaraCep(d.cep));
        setLogradouro(d.logradouro || '');
        setNumero(d.numeroEndereco || '');
        setComplemento(d.complemento || '');
        setBairro(d.bairro || '');
        setCidade(d.cidade || '');
        setUf(d.uf || '');
        setEmail(d.email || '');
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [usuarioId]);

  const buscarCep = async (valor: string) => {
    const digitos = somenteDigitos(valor);
    if (digitos.length !== 8) return;
    setBuscandoCep(true);
    setErro('');
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const d = await r.json();
      if (d?.erro) {
        setErro('CEP não encontrado. Confira os números ou preencha o endereço à mão.');
        return;
      }
      setLogradouro((atual) => atual || d.logradouro || '');
      setBairro((atual) => atual || d.bairro || '');
      setCidade(d.localidade || '');
      setUf(d.uf || '');
    } catch {
      // Sem o ViaCEP, ela preenche à mão: o endereço não pode depender dele.
    } finally {
      setBuscandoCep(false);
    }
  };

  const emailOk = email.trim() === '' || regexEmail.test(email.trim());
  const valido =
    somenteDigitos(cep).length === 8 && logradouro.trim() && numero.trim() && bairro.trim()
    && cidade.trim() && uf.trim().length === 2 && emailOk;

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    setSalvando(true);
    setErro('');
    try {
      const r = await apiFetch(`${API_URL}/api/usuarios/${usuarioId}/completar-cadastro`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep, logradouro, numeroEndereco: numero, complemento, bairro, cidade, uf, email: pelaLoja ? '' : email.trim(),
        }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.erro || 'Não foi possível salvar agora. Tente de novo.');

      // A sessão guardada é de quem está usando o aparelho: quando é a loja
      // que preenche, ela não muda.
      const salva = pelaLoja ? null : localStorage.getItem('@avle:usuario');
      if (salva) {
        localStorage.setItem('@avle:usuario', JSON.stringify({
          ...JSON.parse(salva), cadastroCompleto: true, email: d?.email ?? JSON.parse(salva).email,
        }));
      }
      aoConcluir();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar agora.');
    } finally {
      setSalvando(false);
    }
  };

  const campo =
    'w-full px-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-base sm:text-sm bg-stone-50 h-[48px]';
  const rotulo = 'block text-[10px] font-bold uppercase text-stone-500 mb-1';

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1E14]/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={salvar}
        className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-left"
      >
        <div className="bg-[#0B1E14] px-6 py-6 shrink-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#BD6B42] font-bold">{pelaLoja ? 'Cadastro da cliente' : 'Falta pouco'}</p>
          <h2 className="text-lg font-bold text-[#DFD9CE] mt-1">
            {titulo || (pelaLoja ? `Completar o cadastro de ${nomeDaCliente}` : 'Complete o seu cadastro')}
          </h2>
          <p className="text-xs text-[#DFD9CE]/70 mt-2 leading-relaxed">
            {pelaLoja
              ? 'Confira o endereço com a cliente. Sem ele o produto não é liberado; com ele salvo, a retirada pode seguir.'
              : 'A loja precisa do seu endereço para liberar o produto quando você for contemplada.'}
          </p>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-4">
          <div>
            <label className={rotulo} htmlFor="cc-cep">CEP *</label>
            <input
              id="cc-cep"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              value={cep}
              onChange={(e) => {
                const v = aplicarMascaraCep(e.target.value);
                setCep(v);
                buscarCep(v);
              }}
              className={campo}
            />
            {buscandoCep && <p className="text-[10px] text-stone-400 mt-1">Buscando o endereço...</p>}
          </div>
          <div>
            <label className={rotulo} htmlFor="cc-rua">Rua *</label>
            <input id="cc-rua" type="text" autoComplete="address-line1" value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)} className={campo} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={rotulo} htmlFor="cc-numero">Número *</label>
              <input id="cc-numero" type="text" placeholder="Ou S/N" value={numero}
                onChange={(e) => setNumero(e.target.value)} className={campo} />
            </div>
            <div>
              <label className={rotulo} htmlFor="cc-complemento">Complemento</label>
              <input id="cc-complemento" type="text" placeholder="Apto, bloco" value={complemento}
                onChange={(e) => setComplemento(e.target.value)} className={campo} />
            </div>
          </div>
          <div>
            <label className={rotulo} htmlFor="cc-bairro">Bairro *</label>
            <input id="cc-bairro" type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} className={campo} />
          </div>
          <div className="grid grid-cols-[1fr_5rem] gap-3">
            <div>
              <label className={rotulo} htmlFor="cc-cidade">Cidade *</label>
              <input id="cc-cidade" type="text" autoComplete="address-level2" value={cidade}
                onChange={(e) => setCidade(e.target.value)} className={campo} />
            </div>
            <div>
              <label className={rotulo} htmlFor="cc-uf">UF *</label>
              <input id="cc-uf" type="text" maxLength={2} value={uf}
                onChange={(e) => setUf(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())} className={campo} />
            </div>
          </div>
          {!pelaLoja && (<div>
            <label className={rotulo} htmlFor="cc-email">E-mail (opcional)</label>
            <input id="cc-email" type="email" autoComplete="email" placeholder="seu@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} className={campo} />
            <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">Para receber os comprovantes e avisos do plano.</p>
          </div>)}
          {erro && <p className="text-xs text-rose-600 font-medium">{erro}</p>}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 shrink-0 space-y-2">
          <button
            type="submit"
            disabled={!valido || salvando}
            className="w-full py-4 bg-[#BD6B42] text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-40 active:scale-[0.99] cursor-pointer"
          >
            {salvando ? 'Salvando...' : 'Salvar e concluir'}
          </button>
          <button
            type="button"
            onClick={aoFechar}
            className="w-full text-stone-400 hover:text-stone-700 text-center font-bold text-xs py-1 cursor-pointer"
          >
            {pelaLoja ? 'Cancelar' : 'Completar depois'}
          </button>
        </div>
      </form>
    </div>
  );
}
