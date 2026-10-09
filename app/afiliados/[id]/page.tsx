'use client';

/**
 * A porta da afiliada: o link que a loja divulga para quem quer indicar a loja
 * e ganhar comissão. Abre no cadastro, com os termos, e tem a entrada para quem
 * já é afiliada. O [id] é o mesmo do convite da cliente: "12-nome-da-loja".
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Checkbox, Input, Logo } from '@/design-system';
import RegrasDaSenha from '../../components/RegrasDaSenha';
import { apiFetch } from '../../lib/api';
import { cpfValido, senhaForte, somenteDigitos, telefoneValido } from '../../lib/validacao';
import TermosDoAfiliado from '../TermosDoAfiliado';
import s from '../Afiliados.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

type Modo = 'cadastro' | 'entrar' | 'codigo';
type Aviso = { erro: boolean; texto: string } | null;

// O servidor responde erro como texto puro ou como { erro } / { mensagem }.
async function motivo(resposta: Response, padrao: string) {
  const texto = await resposta.text().catch(() => '');
  try {
    const j = JSON.parse(texto);
    return j.erro || j.mensagem || j.message || padrao;
  } catch {
    return texto || padrao;
  }
}

export default function CadastroDeAfiliada() {
  const router = useRouter();
  const params = useParams();
  const lojaId = Number(String(params.id ?? '').split('-')[0]);

  const [loja, setLoja] = useState<string | null>(null);
  const [lojaNaoAchada, setLojaNaoAchada] = useState(false);
  const lojaInvalida = !lojaId || lojaNaoAchada;
  const [modo, setModo] = useState<Modo>('cadastro');
  const [aviso, setAviso] = useState<Aviso>(null);
  const [enviando, setEnviando] = useState(false);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [senha, setSenha] = useState('');
  const [aceitou, setAceitou] = useState(false);
  const [identificador, setIdentificador] = useState('');
  const [codigo, setCodigo] = useState('');
  const [emailDoCodigo, setEmailDoCodigo] = useState('');

  useEffect(() => {
    if (!lojaId) return;
    apiFetch(`${API_URL}/api/lojas/${lojaId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        setLoja(d.nomeComercial || 'a loja');
      })
      .catch(() => setLojaNaoAchada(true));
  }, [lojaId]);

  const cadastroValido =
    nome.trim().split(/\s+/).length >= 2 &&
    cpfValido(cpf) &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) &&
    telefoneValido(telefone) &&
    chavePix.trim().length > 0 &&
    senhaForte(senha) &&
    aceitou;

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadastroValido) {
      setAviso({ erro: true, texto: 'Preencha todos os campos e aceite os termos.' });
      return;
    }
    setEnviando(true);
    setAviso(null);
    try {
      const r = await apiFetch(`${API_URL}/api/usuarios/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          cpf: somenteDigitos(cpf),
          email: email.trim(),
          telefone: somenteDigitos(telefone),
          senha,
          chavePix: chavePix.trim(),
          tipoUsuario: 'AFILIADO',
          lojaId,
          aceitouTermos: true,
        }),
      });
      if (!r.ok) throw new Error(await motivo(r, 'Não foi possível concluir o cadastro.'));
      const d = await r.json().catch(() => ({}));
      if (d.verificacaoPendente) {
        setEmailDoCodigo(d.email || email.trim());
        setModo('codigo');
        setAviso({ erro: false, texto: `Enviamos um código para ${d.emailMascarado || 'o seu e-mail'}. Digite-o abaixo.` });
      } else {
        setModo('entrar');
        setIdentificador(email.trim());
        setAviso({ erro: false, texto: 'Cadastro feito. Entre com o seu e-mail e a senha.' });
      }
      setSenha('');
    } catch (erro) {
      setAviso({ erro: true, texto: erro instanceof Error ? erro.message : 'Não foi possível concluir o cadastro.' });
    } finally {
      setEnviando(false);
    }
  };

  const confirmarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setAviso(null);
    try {
      const r = await apiFetch(`${API_URL}/api/usuarios/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailDoCodigo, codigo: codigo.trim() }),
      });
      if (!r.ok) throw new Error(await motivo(r, 'Código incorreto ou vencido.'));
      setModo('entrar');
      setIdentificador(emailDoCodigo);
      setAviso({ erro: false, texto: 'Conta confirmada. Agora é só entrar.' });
    } catch (erro) {
      setAviso({ erro: true, texto: erro instanceof Error ? erro.message : 'Código incorreto ou vencido.' });
    } finally {
      setEnviando(false);
    }
  };

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setAviso(null);
    try {
      const r = await apiFetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: identificador.trim(), senha }),
      });
      if (r.status === 403) {
        const d = await r.json().catch(() => ({}));
        if (d.verificacaoPendente || d.email) {
          setEmailDoCodigo(d.email || identificador.trim());
          setModo('codigo');
          setAviso({ erro: false, texto: 'Confirme o código enviado para o seu e-mail.' });
          return;
        }
        throw new Error(d.erro || 'Acesso não permitido.');
      }
      if (!r.ok) throw new Error(await motivo(r, 'E-mail, CPF ou senha incorretos.'));
      const usuario = await r.json();
      localStorage.setItem('@avle:usuario', JSON.stringify(usuario));
      router.push('/dashboard');
    } catch (erro) {
      setAviso({ erro: true, texto: erro instanceof Error ? erro.message : 'Não foi possível entrar.' });
    } finally {
      setEnviando(false);
    }
  };

  const trocar = (m: Modo) => {
    setModo(m);
    setAviso(null);
  };

  return (
    <div className={`avle-ds ${s.pagina}`}>
      <div className={s.entrada}>
        <div className={s.marca}>
          <Logo height={24} />
        </div>

        {lojaInvalida ? (
          <Card>
            <p className={s.apoio}>Este link de afiliada não está mais valendo. Peça um link novo à loja.</p>
          </Card>
        ) : !loja ? (
          <p className={s.apoio}>Carregando…</p>
        ) : (
          <>
            <div>
              <h1 className={s.chamada}>
                {modo === 'entrar' ? 'Entrar no seu painel' : `Divulgue a ${loja} e ganhe por cliente que pagar`}
              </h1>
              {modo === 'cadastro' && (
                <p className={s.apoio}>
                  Você recebe um link só seu. Cada parcela paga por quem entrar por ele gera uma comissão para você,
                  até o fim do plano da cliente.
                </p>
              )}
            </div>

            {aviso && <div className={`${s.aviso} ${aviso.erro ? s.avisoErro : ''}`} role="status">{aviso.texto}</div>}

            {modo === 'cadastro' && (
              <form className={s.formulario} onSubmit={cadastrar}>
                <Input label="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
                <Input label="CPF" inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value)}
                  error={cpf && !cpfValido(cpf) ? 'CPF inválido' : undefined} />
                <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                <Input label="Celular com DDD" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)}
                  error={telefone && !telefoneValido(telefone) ? 'Celular inválido' : undefined} />
                <Input label="Chave Pix para receber" hint="CPF, celular, e-mail ou chave aleatória" value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)} />
                <div>
                  <Input label="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
                  <RegrasDaSenha senha={senha} />
                </div>
                <div className={s.termos}>
                  <TermosDoAfiliado loja={loja} />
                </div>
                <Checkbox label="Li e aceito os termos de afiliada" checked={aceitou} onChange={setAceitou} />
                <Button type="submit" block disabled={enviando || !cadastroValido}>
                  {enviando ? 'Enviando…' : 'Quero ser afiliada'}
                </Button>
                <button type="button" className={s.trocar} onClick={() => trocar('entrar')}>Já sou afiliada, quero entrar</button>
              </form>
            )}

            {modo === 'codigo' && (
              <form className={s.formulario} onSubmit={confirmarCodigo}>
                <Input label="Código recebido no e-mail" inputMode="numeric" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
                <Button type="submit" block disabled={enviando || codigo.trim().length < 4}>
                  {enviando ? 'Conferindo…' : 'Confirmar'}
                </Button>
              </form>
            )}

            {modo === 'entrar' && (
              <form className={s.formulario} onSubmit={entrar}>
                <Input label="E-mail, CPF ou celular" value={identificador} onChange={(e) => setIdentificador(e.target.value)} autoComplete="username" />
                <Input label="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
                <Button type="submit" block disabled={enviando || !identificador.trim() || !senha}>
                  {enviando ? 'Entrando…' : 'Entrar'}
                </Button>
                <button type="button" className={s.trocar} onClick={() => router.push('/')}>Esqueci a senha</button>
                <button type="button" className={s.trocar} onClick={() => trocar('cadastro')}>Ainda não sou afiliada</button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
