'use client';

/**
 * A ficha da cliente, aberta pelo nome na aba Clientes da loja.
 *
 * Mostra tudo o que a AVLE tem dela e deixa a loja corrigir nome, e-mail e
 * celular - é a loja que atende quem ficou travada por cadastro errado. O CPF
 * fica com a AVLE, porque amarra a cobrança e o contrato. Depois de corrigir,
 * a loja manda os dados pelo WhatsApp oficial da AVLE. A senha não vai: a loja
 * não tem acesso a ela, e a mensagem ensina a entrar pelo código.
 */

import { useEffect, useState } from 'react';
import { Badge, Button, Dialog, Input } from '@/design-system';
import { apiFetch } from '../../lib/api';
import { somenteDigitos } from '../../lib/validacao';
import { mascaraCelular } from './TrocarCelular';

export type ClienteDaLista = {
  id: number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  cpf?: string | null;
  numeroCliente?: number | null;
  ultimoGrupo?: string | null;
};

type Perfil = {
  cep?: string; logradouro?: string; numeroEndereco?: string; complemento?: string;
  bairro?: string; cidade?: string; uf?: string; cadastroCompleto?: boolean;
};

const cpfComMascara = (cpf?: string | null) => {
  const d = somenteDigitos(cpf || '');
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf || 'Não informado';
};

const endereco = (p: Perfil | null) => {
  if (!p?.logradouro) return 'Não informado';
  const linha = [p.logradouro, p.numeroEndereco, p.complemento].filter(Boolean).join(', ');
  return `${linha} — ${p.bairro || ''}, ${p.cidade || ''}/${p.uf || ''}${p.cep ? ` · CEP ${p.cep}` : ''}`;
};

async function erroDe(r: Response, padrao: string) {
  const texto = await r.text().catch(() => '');
  try {
    const d = JSON.parse(texto);
    return d?.erro || d?.error || d?.mensagem || d?.message || padrao;
  } catch {
    return texto || padrao;
  }
}

export default function FichaDaCliente({ cliente, aoFechar, aoSalvar }: {
  cliente: ClienteDaLista;
  aoFechar: () => void;
  /** Recebe os dados gravados, para a lista mostrar sem recarregar. */
  aoSalvar: (dados: { nome: string; email: string | null; telefone: string }) => void;
}) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(cliente.nome || '');
  const [email, setEmail] = useState(cliente.email || '');
  const [celular, setCelular] = useState(mascaraCelular(cliente.telefone || ''));
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let ativo = true;
    apiFetch(`/api/usuarios/${cliente.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (ativo && d) setPerfil(d); })
      .catch(() => {});
    return () => { ativo = false; };
  }, [cliente.id]);

  const salvar = async () => {
    setSalvando(true);
    setErro('');
    setAviso('');
    try {
      const r = await apiFetch(`/api/usuarios/${cliente.id}/dados-pela-loja`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim(), telefone: somenteDigitos(celular) }),
      });
      if (!r.ok) throw new Error(await erroDe(r, 'Não foi possível salvar os dados.'));
      const d = await r.json();
      aoSalvar({ nome: d.nome, email: d.email ?? null, telefone: String(d.telefone) });
      setCelular(mascaraCelular(String(d.telefone)));
      setEditando(false);
      setAviso('Dados salvos. Envie para a cliente pelo WhatsApp para ela saber como entrar.');
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar os dados.');
    } finally {
      setSalvando(false);
    }
  };

  const enviar = async () => {
    setEnviando(true);
    setErro('');
    setAviso('');
    try {
      const r = await apiFetch(`/api/usuarios/${cliente.id}/enviar-dados-whatsapp`, { method: 'POST' });
      if (!r.ok) throw new Error(await erroDe(r, 'A mensagem não saiu.'));
      setAviso('Mensagem enviada para o WhatsApp da cliente.');
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'A mensagem não saiu.');
    } finally {
      setEnviando(false);
    }
  };

  const cancelar = () => {
    setNome(cliente.nome || '');
    setEmail(cliente.email || '');
    setCelular(mascaraCelular(cliente.telefone || ''));
    setEditando(false);
    setErro('');
  };

  const linha = (rotulo: string, valor: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', padding: 'var(--space-2) 0', borderBottom: 'thin solid var(--border-subtle)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{rotulo}</span>
      <span style={{ textAlign: 'right', fontWeight: 600 }}>{valor}</span>
    </div>
  );

  return (
    <div className="avle-ds">
      <Dialog
        open
        title={cliente.nome}
        description={cliente.numeroCliente != null ? `Cliente #${String(cliente.numeroCliente).padStart(3, '0')}` : undefined}
        onClose={aoFechar}
        footer={editando ? (
          <>
            <Button variant="ghost" onClick={cancelar} disabled={salvando}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar dados'}</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => { setEditando(true); setAviso(''); }}>Editar dados</Button>
            <Button onClick={enviar} disabled={enviando || !cliente.telefone}>
              {enviando ? 'Enviando...' : 'Enviar dados pelo WhatsApp'}
            </Button>
          </>
        )}
      >
        {editando ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
            <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              hint="Opcional. Deixe vazio se a cliente não tiver." />
            <Input label="Celular com WhatsApp" type="tel" inputMode="numeric" value={celular}
              onChange={(e) => setCelular(mascaraCelular(e.target.value))}
              hint="É por ele que chega o código de acesso." />
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              O CPF só a AVLE corrige. A senha a loja não vê nem troca: a cliente entra pelo código ou por &quot;Esqueci minha senha&quot;.
            </p>
          </div>
        ) : (
          <div>
            {linha('CPF', cpfComMascara(cliente.cpf))}
            {linha('E-mail', cliente.email || 'Não informado')}
            {linha('Celular', cliente.telefone ? mascaraCelular(cliente.telefone) : 'Não informado')}
            {linha('Último grupo', cliente.ultimoGrupo || 'Nenhum grupo ativo')}
            {linha('Endereço', endereco(perfil))}
            {linha('Cadastro', perfil == null ? '...' : perfil.cadastroCompleto
              ? <Badge tone="positive">Completo</Badge> : <Badge tone="warning">Falta o endereço</Badge>)}
          </div>
        )}
        {erro && <p role="alert" style={{ color: 'var(--negative)', marginTop: 'var(--space-3)' }}>{erro}</p>}
        {aviso && <p style={{ color: 'var(--primary)', marginTop: 'var(--space-3)' }}>{aviso}</p>}
      </Dialog>
    </div>
  );
}
