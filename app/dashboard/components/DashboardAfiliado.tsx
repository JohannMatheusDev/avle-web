'use client';

/**
 * O painel da afiliada: o link de indicação da loja que ela divulga, quantas
 * pessoas entraram por ele, quantas pagaram, quanto ela ganhou, e o perfil
 * (dados, chave Pix, senha e os termos). Pensado primeiro para o celular.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge, BottomNav, Button, Card, EmptyState, Input, ListRow, Money, PageHead, Stat, TopNav, useToast,
} from '@/design-system';
import RegrasDaSenha from '../../components/RegrasDaSenha';
import { API_URL, apiFetch, encerrarSessao } from '../../lib/api';
import { senhaForte, telefoneValido } from '../../lib/validacao';
import TermosDoAfiliado from '../../afiliados/TermosDoAfiliado';
import s from '../../afiliados/Afiliados.module.css';

type Indicada = { nome: string; entrouEm: string; parcelasPagas: number };
type Comissao = {
  cliente: string; grupo?: string; valorParcela?: number; valorComissao?: number | null;
  status: 'A_DEFINIR' | 'A_PAGAR' | 'PAGA' | 'CANCELADA'; criadaEm: string; pagaEm?: string;
};
type Painel = {
  nome: string; codigo: string; ativo: boolean; chavePix: string; loja: string; regra: string | null;
  clientesIndicados: number; clientesQuePagaram: number; parcelasPagas: number;
  totalGanho: number; aReceber: number; recebido: number; aDefinir: number;
  indicadas: Indicada[]; comissoes: Comissao[];
};
type Usuario = { id: number; nome?: string };

const SECOES = [
  { value: 'inicio', label: 'Início', icon: 'house' },
  { value: 'perfil', label: 'Perfil', icon: 'user' },
];

const SITUACAO: Record<Comissao['status'], { texto: string; tom: 'neutral' | 'positive' | 'warning' | 'negative' }> = {
  A_DEFINIR: { texto: 'A definir', tom: 'neutral' },
  A_PAGAR: { texto: 'A receber', tom: 'warning' },
  PAGA: { texto: 'Recebida', tom: 'positive' },
  CANCELADA: { texto: 'Cancelada', tom: 'negative' },
};

const dataCurta = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '');
const reais = (v?: number | null) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function erroDe(r: Response, padrao: string) {
  const d = await r.json().catch(() => null);
  return d?.erro || d?.mensagem || padrao;
}

export default function DashboardAfiliado({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const [secao, setSecao] = useState('inicio');
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState('');
  const [mostrar, toast] = useToast();

  const carregar = useCallback(async () => {
    try {
      const r = await apiFetch(`${API_URL}/api/afiliados/painel`);
      if (!r.ok) throw new Error(await erroDe(r, 'Não foi possível abrir o painel.'));
      setPainel(await r.json());
      setErro('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível abrir o painel.');
    }
  }, []);

  // A primeira carga sai depois da renderização: chamada direto no efeito, o
  // estado mudaria em cascata (regra do React).
  useEffect(() => {
    const t = setTimeout(carregar, 0);
    return () => clearTimeout(t);
  }, [carregar]);

  const sair = async () => {
    await encerrarSessao();
    router.push('/');
  };

  const link = painel && typeof window !== 'undefined' ? `${window.location.origin}/a/${painel.codigo}` : '';

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      mostrar('Link copiado');
    } catch {
      mostrar('Não deu para copiar. Selecione o link e copie.', 'negative');
    }
  };

  const compartilhar = async () => {
    const texto = `Conheça os grupos da ${painel?.loja} na AVLE: ${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: painel?.loja, text: texto, url: link });
        return;
      } catch {
        // Cancelou o compartilhamento: nada a fazer.
        return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <div className={`avle-ds ${s.pagina}`}>
      <TopNav role="Afiliada" items={SECOES} value={secao} onChange={setSecao}
        end={<Button variant="ghost" size="sm" onClick={sair}>Sair</Button>} />
      <main className="kit-main">
        {erro && (
          <Card>
            <p className={s.apoio}>{erro}</p>
            <Button variant="secondary" size="sm" onClick={carregar}>Tentar de novo</Button>
          </Card>
        )}
        {!painel && !erro && <p className={s.apoio}>Carregando…</p>}

        {painel && secao === 'inicio' && (
          <div className={s.secao}>
            <PageHead title={`Olá, ${painel.nome.split(' ')[0]}`}
              sub={painel.ativo ? `Você divulga a ${painel.loja}` : `Seu link da ${painel.loja} foi desligado pela loja`} />

            <Card title="Seu link de indicação" subtitle="Quem se cadastrar por ele fica marcada como sua indicação">
              <div className={s.link}>
                <div className={s.linkTexto}>{link}</div>
                <div className={s.acoes}>
                  <Button icon="share-2" onClick={compartilhar} disabled={!painel.ativo}>Compartilhar</Button>
                  <Button variant="secondary" icon="copy" onClick={copiar} disabled={!painel.ativo}>Copiar link</Button>
                </div>
                <p className={s.apoio}>
                  {painel.regra
                    ? `Comissão: ${painel.regra}, até o fim do plano da cliente.`
                    : 'O valor da comissão ainda vai ser definido pela loja. As parcelas pagas já ficam registradas.'}
                </p>
              </div>
            </Card>

            <div className="g">
              <div className="s4 m-half"><Card><Stat label="Entraram pelo seu link" value={painel.clientesIndicados} money={false} /></Card></div>
              <div className="s4 m-half"><Card><Stat label="Já pagaram" value={painel.clientesQuePagaram} money={false}
                foot={`${painel.parcelasPagas} parcela(s) paga(s)`} /></Card></div>
              <div className="s4"><Card variant="accent"><Stat label="Você já ganhou" value={painel.totalGanho}
                foot={`${reais(painel.aReceber)} a receber · ${reais(painel.recebido)} recebido`} /></Card></div>
            </div>
            {painel.aDefinir > 0 && (
              <p className={s.apoio}>{painel.aDefinir} comissão(ões) aguardando a loja definir o valor.</p>
            )}

            <Card title="Quem entrou pelo seu link">
              {painel.indicadas.length === 0 ? (
                <EmptyState icon="users" title="Ninguém ainda" body="Compartilhe o link: quem se cadastrar por ele aparece aqui." />
              ) : (
                <div className={s.lista}>
                  {painel.indicadas.map((i, n) => (
                    <ListRow key={n} icon="user" title={i.nome} subtitle={`Entrou em ${dataCurta(i.entrouEm)}`}
                      trailing={i.parcelasPagas > 0 ? `${i.parcelasPagas} paga(s)` : 'Sem pagamento'}
                      trailingTone={i.parcelasPagas > 0 ? 'positive' : undefined} />
                  ))}
                </div>
              )}
            </Card>

            <Card title="Comissões">
              {painel.comissoes.length === 0 ? (
                <EmptyState icon="wallet" title="Nenhuma comissão ainda" body="Cada parcela paga por quem você indicou gera uma comissão." />
              ) : (
                <div className={s.lista}>
                  {painel.comissoes.map((c, n) => (
                    <ListRow key={n} icon="receipt" title={c.cliente}
                      subtitle={<>{c.grupo ? `${c.grupo} · ` : ''}parcela de {reais(c.valorParcela)} <Badge tone={SITUACAO[c.status].tom}>{SITUACAO[c.status].texto}</Badge></>}
                      meta={dataCurta(c.pagaEm || c.criadaEm)}
                      trailing={c.valorComissao != null ? <Money value={Number(c.valorComissao)} size={16} /> : '—'} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {painel && secao === 'perfil' && (
          <Perfil usuarioId={usuario.id} chavePix={painel.chavePix} loja={painel.loja} aviso={mostrar} aoSalvar={carregar} />
        )}
      </main>
      <BottomNav items={SECOES} value={secao} onChange={(v) => { setSecao(v); window.scrollTo(0, 0); }} />
      {toast}
    </div>
  );
}

function Perfil({ usuarioId, chavePix, loja, aviso, aoSalvar }: {
  usuarioId: number; chavePix: string; loja: string;
  aviso: (m: string, tom?: 'positive' | 'negative') => void; aoSalvar: () => void;
}) {
  const [dados, setDados] = useState({ nome: '', email: '', telefone: '' });
  const [pix, setPix] = useState(chavePix);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [ocupado, setOcupado] = useState('');

  useEffect(() => {
    apiFetch(`${API_URL}/api/usuarios/${usuarioId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setDados({ nome: d.nome ?? '', email: d.email ?? '', telefone: d.telefone ?? '' }))
      .catch(() => undefined);
  }, [usuarioId]);

  const salvarDados = async () => {
    setOcupado('dados');
    try {
      const r = await apiFetch(`${API_URL}/api/usuarios/${usuarioId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados),
      });
      if (!r.ok) throw new Error(await erroDe(r, 'Não foi possível salvar.'));
      aviso('Dados salvos');
      aoSalvar();
    } catch (e) {
      aviso(e instanceof Error ? e.message : 'Não foi possível salvar.', 'negative');
    } finally {
      setOcupado('');
    }
  };

  const salvarPix = async () => {
    setOcupado('pix');
    try {
      const r = await apiFetch(`${API_URL}/api/afiliados/chave-pix`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chavePix: pix }),
      });
      if (!r.ok) throw new Error(await erroDe(r, 'Não foi possível salvar a chave.'));
      aviso('Chave Pix atualizada');
      aoSalvar();
    } catch (e) {
      aviso(e instanceof Error ? e.message : 'Não foi possível salvar a chave.', 'negative');
    } finally {
      setOcupado('');
    }
  };

  const trocarSenha = async () => {
    setOcupado('senha');
    try {
      const r = await apiFetch(`${API_URL}/api/usuarios/${usuarioId}/senha`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      if (!r.ok) throw new Error(await erroDe(r, 'Não foi possível trocar a senha.'));
      aviso('Senha alterada');
      setSenhaAtual('');
      setNovaSenha('');
    } catch (e) {
      aviso(e instanceof Error ? e.message : 'Não foi possível trocar a senha.', 'negative');
    } finally {
      setOcupado('');
    }
  };

  return (
    <div className={s.secao}>
      <PageHead title="Perfil" />
      <Card title="Seus dados">
        <div className={s.formulario}>
          <Input label="Nome" value={dados.nome} onChange={(e) => setDados({ ...dados, nome: e.target.value })} />
          <Input label="E-mail" type="email" value={dados.email} onChange={(e) => setDados({ ...dados, email: e.target.value })} />
          <Input label="Celular" inputMode="tel" value={dados.telefone} onChange={(e) => setDados({ ...dados, telefone: e.target.value })}
            error={dados.telefone && !telefoneValido(dados.telefone) ? 'Celular inválido' : undefined} />
          <Button onClick={salvarDados} disabled={ocupado !== '' || !dados.nome.trim()}>
            {ocupado === 'dados' ? 'Salvando…' : 'Salvar dados'}
          </Button>
        </div>
      </Card>
      <Card title="Chave Pix" subtitle="É nela que você recebe as comissões">
        <div className={s.formulario}>
          <Input label="Chave Pix" value={pix} onChange={(e) => setPix(e.target.value)} />
          <Button variant="secondary" onClick={salvarPix} disabled={ocupado !== '' || !pix.trim() || pix.trim() === chavePix}>
            {ocupado === 'pix' ? 'Salvando…' : 'Salvar chave'}
          </Button>
        </div>
      </Card>
      <Card title="Trocar senha">
        <div className={s.formulario}>
          <Input label="Senha atual" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} autoComplete="current-password" />
          <div>
            <Input label="Nova senha" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} autoComplete="new-password" />
            <RegrasDaSenha senha={novaSenha} />
          </div>
          <Button variant="secondary" onClick={trocarSenha} disabled={ocupado !== '' || !senhaAtual || !senhaForte(novaSenha)}>
            {ocupado === 'senha' ? 'Trocando…' : 'Trocar senha'}
          </Button>
        </div>
      </Card>
      <Card title="Termos de afiliada">
        <div className={s.termos}>
          <TermosDoAfiliado loja={loja} />
        </div>
      </Card>
    </div>
  );
}
