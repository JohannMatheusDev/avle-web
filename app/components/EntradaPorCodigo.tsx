'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api';
import { codigoDaIndicacao } from '../lib/indicacao';
import { cpfValido, somenteDigitos, telefoneValido } from '../lib/validacao';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Etapa = 'entrar' | 'cadastrar' | 'codigo';

/**
 * Cadastro e entrada da cliente pelo celular: CPF ou telefone, e um código
 * que chega no WhatsApp. Sem senha.
 *
 * Substitui o cadastro com e-mail obrigatório, senha forte e confirmação por
 * e-mail, em que a cliente que chegava pelo link da loja desistia no meio. O
 * e-mail ficou opcional, e o endereço vem depois do pagamento.
 *
 * Usado no convite da loja e na tela principal, para as duas não voltarem a
 * divergir como divergiam quando cada uma tinha a sua cópia do formulário.
 * Quem usa passa key={inicio}: trocar a aba recomeça o formulário do zero.
 */
export default function EntradaPorCodigo({
  lojaId,
  inicio,
  aceitouTermos,
  aoMudarAceite,
  aoVerTermos,
  textoDosTermos,
  rodape,
}: {
  lojaId?: number | null;
  inicio: 'entrar' | 'cadastrar';
  aceitouTermos: boolean;
  aoMudarAceite: (aceitou: boolean) => void;
  aoVerTermos: () => void;
  textoDosTermos: string;
  rodape?: ReactNode;
}) {
  const router = useRouter();

  const [etapa, setEtapa] = useState<Etapa>(inicio);
  const [identificador, setIdentificador] = useState('');
  const [cpf, setCpf] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [destino, setDestino] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [statusConexao, setStatusConexao] = useState('');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [esperaReenvio, setEsperaReenvio] = useState(0);

  // O código sai só pelo WhatsApp, nunca por e-mail. Com o WhatsApp desligado
  // no servidor (o modelo da Meta em análise, por exemplo), a tela avisa em
  // vez de prometer um código que não vai chegar. Na dúvida vale o WhatsApp:
  // é o estado normal, e o servidor recusa com uma mensagem clara se não for.
  const [whatsappLigado, setWhatsappLigado] = useState(true);

  useEffect(() => {
    let ativo = true;
    apiFetch(`${API_URL}/api/auth/canais`)
      .then((r) => (r.ok ? r.json() : null))
      .then((dados) => {
        if (ativo && dados && typeof dados.telefone === 'boolean') setWhatsappLigado(dados.telefone);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (esperaReenvio <= 0) return;
    const t = setTimeout(() => setEsperaReenvio((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [esperaReenvio]);

  const mascaraTelefone = (valor: string) => {
    const v = somenteDigitos(valor).slice(0, 11);
    if (v.length <= 2) return v;
    if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  };

  const mascaraCpf = (valor: string) =>
    somenteDigitos(valor)
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

  // Celular com o 9: o código vai pelo WhatsApp, e fixo não recebe.
  const celularValido = telefoneValido(telefone) && somenteDigitos(telefone).length === 11;
  const emailPreenchido = email.trim().length > 0;
  const emailOk = emailPreenchido ? regexEmail.test(email.trim()) : true;
  const nomeCompleto = nome.trim().split(/\s+/).length >= 2;

  const cadastroValido = cpfValido(cpf) && nomeCompleto && celularValido && emailOk && aceitouTermos;
  const identificadorValido =
    cpfValido(identificador) || telefoneValido(identificador) || regexEmail.test(identificador.trim());

  /**
   * POST com paciência para o servidor acordando.
   *
   * A API dorme quando ninguém usa, e a primeira chamada do dia falha por
   * rede antes de ela subir. Sem repetir, a cliente lia "não foi possível
   * conectar" justamente na primeira vez que abria o link da loja.
   */
  const postar = async (caminho: string, corpo: unknown) => {
    for (let tentativa = 1; tentativa <= 4; tentativa++) {
      try {
        const resposta = await apiFetch(`${API_URL}${caminho}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(corpo),
        });
        if (resposta.status < 500 || tentativa === 4) return resposta;
      } catch (e) {
        if (tentativa === 4) throw e;
      }
      setStatusConexao('Acordando o servidor...');
      await new Promise((r) => setTimeout(r, 3000));
    }
    throw new Error('Sem resposta do servidor.');
  };

  const erroDa = async (resposta: Response, padrao: string) => {
    const texto = await resposta.text().catch(() => '');
    try {
      const json = JSON.parse(texto);
      return json?.erro || json?.error || json?.mensagem || padrao;
    } catch {
      return texto && texto.length < 300 ? texto : padrao;
    }
  };

  const pedirCodigo = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setCarregando(true);
    setStatusConexao('');
    setMensagem({ tipo: '', texto: '' });
    try {
      const resposta = await postar('/api/auth/codigo/solicitar', { identificador: identificador.trim() });
      if (resposta.status === 404) {
        // Não tem conta: segue para o cadastro com o que ela já digitou.
        if (cpfValido(identificador)) setCpf(mascaraCpf(identificador));
        else if (telefoneValido(identificador)) setTelefone(mascaraTelefone(identificador));
        setEtapa('cadastrar');
        setMensagem({ tipo: 'sucesso', texto: 'Ainda não há conta com esse dado. Complete o cadastro para entrar.' });
        return;
      }
      if (!resposta.ok) throw new Error(await erroDa(resposta, 'Não foi possível enviar o código agora.'));
      const retorno = await resposta.json().catch(() => null);
      irParaOCodigo(retorno?.destino, retorno?.destinoMascarado);
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: erro instanceof Error ? erro.message : 'Não foi possível enviar o código agora.' });
    } finally {
      setCarregando(false);
    }
  };

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadastroValido) return;
    setCarregando(true);
    setStatusConexao('');
    setMensagem({ tipo: '', texto: '' });
    try {
      const resposta = await postar('/api/auth/cliente/cadastro', {
        cpf: somenteDigitos(cpf),
        nome: nome.trim(),
        telefone: somenteDigitos(telefone),
        email: email.trim() || null,
        lojaId: lojaId ?? null,
        codigoAfiliado: lojaId ? codigoDaIndicacao(lojaId) ?? null : null,
        aceitouTermos,
      });
      if (!resposta.ok) throw new Error(await erroDa(resposta, 'Não foi possível concluir o cadastro.'));
      const retorno = await resposta.json().catch(() => null);
      // A partir daqui ela entra com o CPF, que não muda; o telefone ela pode
      // ter digitado diferente do que está na conta que já existia.
      setIdentificador(somenteDigitos(cpf));
      irParaOCodigo(retorno?.destino, retorno?.destinoMascarado,
        retorno?.jaTinhaConta ? 'Você já tem conta com esse CPF. Enviamos o código para entrar.' : undefined);
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: erro instanceof Error ? erro.message : 'Não foi possível concluir o cadastro.' });
    } finally {
      setCarregando(false);
    }
  };

  const irParaOCodigo = (canal?: string, mascarado?: string, aviso?: string) => {
    const onde = canal === 'EMAIL' ? `o e-mail ${mascarado || ''}` : `o WhatsApp ${mascarado || ''}`;
    setDestino(onde.trim());
    setCodigo('');
    setEsperaReenvio(60);
    setEtapa('codigo');
    // O subtítulo da tela já diz para onde foi; a caixa só aparece quando há
    // algo a mais a dizer, como "você já tem conta".
    setMensagem(aviso ? { tipo: 'sucesso', texto: aviso } : { tipo: '', texto: '' });
  };

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setStatusConexao('');
    setMensagem({ tipo: '', texto: '' });
    try {
      const resposta = await postar('/api/auth/codigo/entrar', { identificador: identificador.trim(), codigo });
      if (!resposta.ok) throw new Error(await erroDa(resposta, 'Código incorreto ou expirado.'));
      const usuario = await resposta.json();
      localStorage.setItem('@avle:usuario', JSON.stringify(usuario));

      // Já tinha conta e veio pelo link de uma afiliada: a indicação vale se
      // ela ainda não participa desta loja (o servidor confere).
      const codigoAfiliado = lojaId ? codigoDaIndicacao(lojaId) : null;
      if (codigoAfiliado) {
        await apiFetch(`${API_URL}/api/afiliados/indicar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: codigoAfiliado }),
        }).catch(() => undefined);
      }
      router.push('/dashboard');
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: erro instanceof Error ? erro.message : 'Código incorreto ou expirado.' });
      setCarregando(false);
    }
  };

  const campo =
    'w-full px-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] focus:ring-2 focus:ring-[#0B1E14]/5 text-base sm:text-sm bg-stone-50 h-[48px]';
  const rotulo = 'block text-[10px] font-bold uppercase text-stone-500 mb-1';
  const botao =
    'w-full py-4 bg-[#0B1E14] text-white font-bold rounded-full tracking-wide uppercase transition-all disabled:opacity-50 cursor-pointer text-xs shadow-md hover:bg-[#08170f]';

  const aviso = mensagem.texto && (
    <div
      className={`p-3 rounded-xl text-xs font-bold border ${
        mensagem.tipo === 'sucesso'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      }`}
    >
      {mensagem.texto}
    </div>
  );

  if (etapa === 'codigo') {
    return (
      <form onSubmit={entrar} className="flex flex-col space-y-4 text-left">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Digite o código</h3>
          <p className="text-xs text-stone-500 mt-1">
            Enviamos 6 números para {destino || 'o seu celular'}. Ele vale por 10 minutos.
          </p>
        </div>
        {aviso}
        <div>
          <label className={rotulo} htmlFor="codigo-acesso">Código</label>
          <input
            id="codigo-acesso"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={codigo}
            onChange={(e) => setCodigo(somenteDigitos(e.target.value))}
            className="w-full text-center font-mono font-bold tracking-[0.4em] px-4 py-2 border rounded-2xl bg-stone-50 h-[52px] text-lg focus:outline-none focus:border-[#0B1E14]"
            autoFocus
            disabled={carregando}
          />
        </div>
        <button type="submit" disabled={codigo.length !== 6 || carregando} className={botao}>
          {carregando ? statusConexao || 'Entrando...' : 'Entrar'}
        </button>
        <button
          type="button"
          onClick={() => pedirCodigo()}
          disabled={carregando || esperaReenvio > 0}
          className="w-full text-[#BD6B42] hover:underline text-center font-bold text-xs py-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
        >
          {esperaReenvio > 0 ? `Pedir outro código em ${esperaReenvio}s` : 'Não recebi. Enviar outro código'}
        </button>
        <button
          type="button"
          onClick={() => { setEtapa(inicio); setMensagem({ tipo: '', texto: '' }); }}
          className="w-full text-stone-400 hover:text-stone-700 text-center font-bold text-xs py-1 cursor-pointer"
        >
          Voltar
        </button>
      </form>
    );
  }

  if (etapa === 'entrar') {
    return (
      <form onSubmit={pedirCodigo} className="flex flex-col space-y-4 text-left">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Entrar na sua conta</h3>
          <p className="text-xs text-stone-500 mt-1">Digite o seu CPF ou celular. Enviamos um código pelo WhatsApp, sem senha.</p>
        </div>
      {!whatsappLigado && (
        <p className="p-3 rounded-xl text-xs font-bold border bg-amber-50 text-amber-800 border-amber-200">
          O envio do código pelo WhatsApp está indisponível no momento. Tente de novo mais tarde ou fale com a loja.
        </p>
      )}
        {aviso}
        <div>
          <label className={rotulo} htmlFor="identificador">CPF ou celular</label>
          {/* Sem máscara: CPF e celular têm os mesmos onze dígitos, e mascarar
              como um tornaria impossível digitar o outro. */}
          <input
            id="identificador"
            type="text"
            inputMode="numeric"
            placeholder="Somente números"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            className={campo}
            disabled={carregando}
          />
        </div>
        <button type="submit" disabled={!identificadorValido || carregando} className={botao}>
          {carregando ? statusConexao || 'Enviando...' : 'Receber código'}
        </button>
        <button
          type="button"
          onClick={() => { setEtapa('cadastrar'); setMensagem({ tipo: '', texto: '' }); }}
          className="w-full text-[#BD6B42] hover:underline text-center font-bold text-xs py-1 cursor-pointer"
        >
          Ainda não tenho conta
        </button>
        {rodape}
      </form>
    );
  }

  return (
    <form onSubmit={cadastrar} className="flex flex-col space-y-4 text-left">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Criar conta</h3>
        <p className="text-xs text-stone-500 mt-1">
          Só o básico agora. O endereço você informa depois, para retirar o produto.
        </p>
      </div>
      {!whatsappLigado && (
        <p className="p-3 rounded-xl text-xs font-bold border bg-amber-50 text-amber-800 border-amber-200">
          O envio do código pelo WhatsApp está indisponível no momento. Tente de novo mais tarde ou fale com a loja.
        </p>
      )}
      {aviso}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-[10px] font-bold uppercase text-stone-500" htmlFor="cad-cpf">CPF *</label>
          {somenteDigitos(cpf).length === 11 && !cpfValido(cpf) && (
            <span className="text-[10px] font-bold text-rose-500">CPF inválido</span>
          )}
        </div>
        <input id="cad-cpf" type="text" inputMode="numeric" placeholder="000.000.000-00" value={cpf}
          onChange={(e) => setCpf(mascaraCpf(e.target.value))} className={campo} disabled={carregando} />
      </div>
      <div>
        <label className={rotulo} htmlFor="cad-nome">Nome completo, como no documento *</label>
        <input id="cad-nome" type="text" autoComplete="name" placeholder="Ex.: Maria da Silva" value={nome}
          onChange={(e) => setNome(e.target.value)} className={campo} disabled={carregando} />
      </div>
      <div>
        <label className={rotulo} htmlFor="cad-celular">Celular com WhatsApp *</label>
        <input id="cad-celular" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="(42) 99999-9999"
          value={telefone} onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
          className={`${campo} ${telefone.length > 0 && somenteDigitos(telefone).length >= 10 && !celularValido ? 'border-rose-300' : ''}`}
          disabled={carregando} />
        <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">
          {telefone.length > 0 && somenteDigitos(telefone).length >= 10 && !celularValido
            ? 'Informe um celular com DDD e o 9 na frente.'
            : 'É para este número que vai o código de acesso, pelo WhatsApp.'}
        </p>
      </div>
      <div>
        <label className={rotulo} htmlFor="cad-email">E-mail (opcional)</label>
        <input id="cad-email" type="email" autoComplete="email" placeholder="seu@email.com" value={email}
          onChange={(e) => setEmail(e.target.value)} className={campo} disabled={carregando} />

      </div>

      <p className="text-[11px] text-stone-600 leading-relaxed bg-[#F8F6F2] border border-[#DFD9CE] rounded-xl p-3">
        A parcela é paga mês a mês, por Pix ou boleto. Participar <strong>não consome o limite do seu cartão de crédito</strong>.
      </p>

      <div className="flex items-start space-x-3 p-3 bg-stone-50 border border-stone-200/60 rounded-xl">
        <input
          type="checkbox"
          id="aceite-termos"
          checked={aceitouTermos}
          onChange={(e) => aoMudarAceite(e.target.checked)}
          className="mt-0.5 w-5 h-5 shrink-0 accent-[#0B1E14] cursor-pointer"
          disabled={carregando}
        />
        <label htmlFor="aceite-termos" className="text-[11px] text-stone-600 leading-relaxed cursor-pointer select-none">
          Li e concordo com o{' '}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); aoVerTermos(); }}
            className="inline text-left text-[#BD6B42] font-bold underline cursor-pointer"
          >
            {textoDosTermos}.
          </button>
        </label>
      </div>

      <button type="submit" disabled={!cadastroValido || carregando} className={botao}>
        {carregando ? statusConexao || 'Enviando...' : 'Receber código e entrar'}
      </button>
      <button
        type="button"
        onClick={() => { setEtapa('entrar'); setMensagem({ tipo: '', texto: '' }); }}
        className="w-full text-stone-400 hover:text-stone-700 text-center font-bold text-xs py-1 cursor-pointer"
      >
        Já tenho conta
      </button>
      {rodape}
    </form>
  );
}
