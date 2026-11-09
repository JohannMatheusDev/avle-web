'use client';

/**
 * O painel do financeiro da loja: o login que a loja mãe convida para cuidar
 * do dinheiro, separado do painel da loja para não misturar a operação com a
 * conferência.
 *
 * Tem a Conta AVLE (saldo, extrato e saques), o a receber, os pagamentos do
 * mês e os pedidos. Tudo baixa em Excel, PDF ou CSV. O financeiro não mexe em
 * grupo nem em cliente; o saque e a troca da chave Pix que ele pede vão para a
 * loja mãe aprovar (RegrasDoFinanceiro.java, na API).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge, BottomNav, Button, Card, EmptyState, Input, PageHead, Select, Stat, Table, TopNav, useToast,
} from '@/design-system';
import RegrasDaSenha from '../../components/RegrasDaSenha';
import { API_URL, apiFetch, encerrarSessao } from '../../lib/api';
import { baixarRelatorio, type Celula, type Formato } from '../../lib/planilha';
import { senhaForte } from '../../lib/validacao';
import BotaoDeBaixar from './BotaoDeBaixar';
import { PaginaContaAvle } from './ContaAvle';
import PedidosDaEquipe from './PedidosDaEquipe';
import RelatorioAReceber from './RelatorioAReceber';
import s from './DashboardFinanceiro.module.css';

type Usuario = { id: number; nome?: string; lojaId?: number };
type Transacao = {
  id: number; dataTransacao?: string | null; cotaId?: number | null; nomeCliente?: string | null;
  statusPagamento?: string | null; tipo?: string | null;
  valorBruto?: number | null; taxaPlataforma?: number | null; valorLiquido?: number | null;
};

const SECOES = [
  { value: 'conta', label: 'Conta AVLE', icon: 'wallet' },
  { value: 'receber', label: 'A receber', icon: 'calendar-clock' },
  { value: 'pagamentos', label: 'Pagamentos', icon: 'receipt' },
  { value: 'pedidos', label: 'Pedidos', icon: 'inbox' },
  { value: 'perfil', label: 'Perfil', icon: 'user' },
];

// O nome de cada situação como a loja fala (os mesmos status da API).
const SITUACAO: Record<string, { texto: string; tom: 'neutral' | 'positive' | 'warning' | 'negative' }> = {
  PAGO: { texto: 'Paga', tom: 'positive' },
  PAGO_PIX: { texto: 'Paga no Pix', tom: 'positive' },
  BAIXA_MANUAL_LOJA: { texto: 'Baixa manual', tom: 'positive' },
  PENDENTE: { texto: 'Em aberto', tom: 'warning' },
  ATRASADO: { texto: 'Atrasada', tom: 'negative' },
  VENCIDO: { texto: 'Vencida', tom: 'negative' },
  CANCELADO: { texto: 'Cancelada', tom: 'neutral' },
  DESFEITO: { texto: 'Desfeita', tom: 'neutral' },
  ESTORNADO: { texto: 'Estornada', tom: 'negative' },
  CONTESTADO: { texto: 'Contestada', tom: 'negative' },
};
const situacao = (st?: string | null) =>
  SITUACAO[(st ?? '').toUpperCase()] ?? { texto: st || '—', tom: 'neutral' as const };

// Só o que entrou tem taxa e líquido: numa cancelada, os dois ficam vazios.
const entrou = (t: Transacao) => t.tipo === 'ENTRADA';

const reais = (v?: number | null) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataCurta = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');
const mesDe = (iso?: string | null) => (iso ? iso.slice(0, 7) : '');
const nomeDoMes = (mes: string) => {
  const [a, m] = mes.split('-').map(Number);
  const t = new Date(a, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

async function erroDe(r: Response, padrao: string) {
  const d = await r.json().catch(() => null);
  return d?.erro || d?.mensagem || padrao;
}

export default function DashboardFinanceiro({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const lojaId = Number(usuario.lojaId) || undefined;
  const [secao, setSecao] = useState('conta');
  const [loja, setLoja] = useState<{ nomeComercial?: string; chavePix?: string | null } | null>(null);
  const [mostrar, toast] = useToast();

  // As telas da Conta AVLE e dos pedidos avisam com título, texto e tom.
  const mostrarAviso = useCallback((titulo: string, texto: string, erro: boolean) => {
    mostrar(texto ? `${titulo}: ${texto}` : titulo, erro ? 'negative' : 'positive');
  }, [mostrar]);

  const carregarLoja = useCallback(async () => {
    if (!lojaId) return;
    try {
      const r = await apiFetch(`${API_URL}/api/lojas/${lojaId}/dados`);
      if (r.ok) setLoja(await r.json());
    } catch {
      // Sem o nome da loja, o painel segue com "loja".
    }
  }, [lojaId]);

  useEffect(() => {
    const t = setTimeout(carregarLoja, 0);
    return () => clearTimeout(t);
  }, [carregarLoja]);

  const sair = async () => {
    await encerrarSessao();
    router.push('/');
  };

  const ir = (v: string) => { setSecao(v); window.scrollTo(0, 0); };
  const nomeDaLoja = loja?.nomeComercial || 'loja';

  return (
    <div className={`avle-ds ${s.pagina}`}>
      <TopNav role="Financeiro" items={SECOES} value={secao} onChange={ir}
        end={<Button variant="ghost" size="sm" onClick={sair}>Sair</Button>} />
      <main className="kit-main">
        {secao === 'conta' && (
          // A Conta AVLE já abre com o nome da loja; o botão diz "Pedir saque".
          <PaginaContaAvle lojaId={lojaId} podeSacar sacarComoPedido mostrarAviso={mostrarAviso} />
        )}

        {secao === 'receber' && (
          <div className={s.secao}>
            <PageHead title="A receber" sub="O que cada grupo ainda tem para pagar, o vencido e a previsão dos próximos meses." />
            <RelatorioAReceber lojaId={Number(lojaId)} />
          </div>
        )}

        {secao === 'pagamentos' && <Pagamentos lojaId={lojaId} nomeDaLoja={nomeDaLoja} />}

        {secao === 'pedidos' && (
          <div className={s.secao}>
            <PageHead title="Pedidos" sub="O que você pediu à loja e o que ela decidiu." />
            <PedidosDaEquipe lojaId={lojaId} ehColaborador mostrarAviso={mostrarAviso} />
            <ChavePix lojaId={lojaId} atual={loja?.chavePix ?? ''} aviso={mostrar} />
          </div>
        )}

        {secao === 'perfil' && <Perfil usuario={usuario} nomeDaLoja={nomeDaLoja} aviso={mostrar} />}
      </main>
      <BottomNav items={SECOES} value={secao} onChange={ir} />
      {toast}
    </div>
  );
}

/* ------------------------------------------------------------ pagamentos */

/**
 * Os pagamentos da loja, mês a mês: quem pagou, quando, quanto, a taxa da
 * AVLE e o que fica para a loja. É a lista que o financeiro confere contra o
 * extrato, e baixa.
 */
function Pagamentos({ lojaId, nomeDaLoja }: { lojaId: number | undefined; nomeDaLoja: string }) {
  const [lista, setLista] = useState<Transacao[] | null>(null);
  const [erro, setErro] = useState('');
  const [mes, setMes] = useState('');

  const carregar = useCallback(async () => {
    if (!lojaId) return;
    try {
      const r = await apiFetch(`${API_URL}/api/financeiro/loja/${lojaId}/transacoes`);
      if (!r.ok) throw new Error(await erroDe(r, 'Não foi possível carregar os pagamentos.'));
      const dados: Transacao[] = await r.json();
      dados.sort((a, b) => String(b.dataTransacao ?? '').localeCompare(String(a.dataTransacao ?? '')));
      setLista(dados);
      setErro('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar os pagamentos.');
    }
  }, [lojaId]);

  useEffect(() => {
    const t = setTimeout(carregar, 0);
    return () => clearTimeout(t);
  }, [carregar]);

  const meses = useMemo(
    () => [...new Set((lista ?? []).map((t) => mesDe(t.dataTransacao)).filter(Boolean))].sort().reverse(),
    [lista],
  );
  // Abre no mês mais recente com pagamento.
  const mesAtivo = mes || meses[0] || 'todos';
  const doMes = (lista ?? []).filter((t) => mesAtivo === 'todos' || mesDe(t.dataTransacao) === mesAtivo);
  const entradas = doMes.filter(entrou);
  const soma = (k: 'valorBruto' | 'taxaPlataforma' | 'valorLiquido') =>
    entradas.reduce((acc, t) => acc + Number(t[k] ?? 0), 0);
  const periodo = mesAtivo === 'todos' ? 'Todos os meses' : nomeDoMes(mesAtivo);

  const baixar = (formato: Formato) => {
    const linhas: Celula[][] = [
      ['Data', 'Cliente', 'Cota', 'Situação', 'Valor (R$)', 'Taxa AVLE (R$)', 'Líquido (R$)'],
      ...doMes.map((t): Celula[] => [
        dataCurta(t.dataTransacao), t.nomeCliente ?? '', t.cotaId ?? null, situacao(t.statusPagamento).texto,
        Number(t.valorBruto ?? 0), entrou(t) ? Number(t.taxaPlataforma ?? 0) : null, entrou(t) ? Number(t.valorLiquido ?? 0) : null,
      ]),
      ['Total recebido', `${entradas.length} pagamento(s)`, null, null, soma('valorBruto'), soma('taxaPlataforma'), soma('valorLiquido')],
    ];
    const mesNoNome = mesAtivo === 'todos' ? 'todos' : mesAtivo;
    return baixarRelatorio(`pagamentos-${mesNoNome}`, [{
      nome: 'Pagamentos', linhas, decimais: [4, 5, 6], ultimaLinhaEhTotal: true,
    }], formato, { titulo: `Pagamentos · ${nomeDaLoja}`, subtitulo: periodo });
  };

  return (
    <div className={s.secao}>
      <PageHead title="Pagamentos" sub="Quem pagou, quando e quanto fica para a loja depois da taxa da AVLE." />
      {erro && (
        <Card>
          <p className={s.apoio}>{erro}</p>
          <Button variant="secondary" size="sm" onClick={carregar}>Tentar de novo</Button>
        </Card>
      )}
      {!lista && !erro && <p className={s.apoio}>Carregando…</p>}
      {lista && (
        <>
          <div className={s.barra}>
            <Select className={s.filtro} label="Mês" size="sm" value={mesAtivo} onChange={(e) => setMes(e.target.value)}
              options={[...meses.map((m) => ({ value: m, label: nomeDoMes(m) })), { value: 'todos', label: 'Todos os meses' }]} />
            <BotaoDeBaixar aoEscolher={baixar} disabled={doMes.length === 0}
              className="av-btn av-btn--secondary av-btn--sm" />
          </div>
          <div className="g">
            <div className="s4 m-half"><Card><Stat label="Recebido" value={soma('valorBruto')}
              foot={`${entradas.length} pagamento(s)`} /></Card></div>
            <div className="s4 m-half"><Card><Stat label="Taxa da AVLE" value={soma('taxaPlataforma')} /></Card></div>
            <div className="s4"><Card variant="accent"><Stat label="Fica para a loja" value={soma('valorLiquido')} /></Card></div>
          </div>
          <Card title={periodo}>
            {doMes.length === 0 ? (
              <EmptyState icon="receipt" title="Nenhum pagamento" body="Neste período não entrou nenhum pagamento." />
            ) : (
              <Table<Transacao>
                rows={doMes}
                columns={[
                  { key: 'data', label: 'Data', render: (t) => dataCurta(t.dataTransacao) },
                  { key: 'cliente', label: 'Cliente', render: (t) => t.nomeCliente || '—' },
                  { key: 'situacao', label: 'Situação', render: (t) => {
                    const x = situacao(t.statusPagamento);
                    return <Badge tone={x.tom}>{x.texto}</Badge>;
                  } },
                  { key: 'valor', label: 'Valor', align: 'right', render: (t) => reais(t.valorBruto) },
                  { key: 'taxa', label: 'Taxa AVLE', align: 'right', hideOnMobile: true, render: (t) => (entrou(t) ? reais(t.taxaPlataforma) : '—') },
                  { key: 'liquido', label: 'Líquido', align: 'right', render: (t) => (entrou(t) ? reais(t.valorLiquido) : '—') },
                ]}
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- chave Pix */

/** A chave Pix da loja, para onde vai o saque. Trocar é pedido para a loja. */
function ChavePix({ lojaId, atual, aviso }: {
  lojaId: number | undefined; atual: string; aviso: (m: string, tom?: 'positive' | 'negative') => void;
}) {
  const [chave, setChave] = useState('');
  const [enviando, setEnviando] = useState(false);

  const pedir = async () => {
    setEnviando(true);
    try {
      const r = await apiFetch(`${API_URL}/api/lojas/${lojaId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chavePix: chave.trim() }),
      });
      const corpo = await r.clone().json().catch(() => null);
      // O apiFetch devolve o "aguardando aprovação" como 409: aqui é o sucesso.
      if (!(r.status === 409 && corpo?.aguardandoAprovacao)) {
        throw new Error(await erroDe(r, 'Não foi possível enviar o pedido.'));
      }
      aviso('Pedido enviado: a loja aprova a troca da chave Pix.');
      setChave('');
      window.dispatchEvent(new CustomEvent('avle:aguardando-aprovacao'));
    } catch (e) {
      aviso(e instanceof Error ? e.message : 'Não foi possível enviar o pedido.', 'negative');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Card title="Chave Pix da loja" subtitle={atual ? `Hoje: ${atual}` : 'A loja ainda não cadastrou uma chave Pix.'}>
      <div className={s.formulario}>
        <Input label="Nova chave Pix" value={chave} onChange={(e) => setChave(e.target.value)} autoCapitalize="none" />
        <p className={s.apoio}>A troca vai como pedido. Só vale depois que a loja aprovar.</p>
        <Button variant="secondary" onClick={pedir} disabled={enviando || !chave.trim() || chave.trim() === atual}>
          {enviando ? 'Enviando…' : 'Pedir a troca'}
        </Button>
      </div>
    </Card>
  );
}

/* ----------------------------------------------------------------- perfil */

function Perfil({ usuario, nomeDaLoja, aviso }: {
  usuario: Usuario; nomeDaLoja: string; aviso: (m: string, tom?: 'positive' | 'negative') => void;
}) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const trocarSenha = async () => {
    setOcupado(true);
    try {
      const r = await apiFetch(`${API_URL}/api/usuarios/${usuario.id}/senha`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      if (!r.ok) throw new Error(await erroDe(r, 'Não foi possível trocar a senha.'));
      aviso('Senha alterada');
      setSenhaAtual('');
      setNovaSenha('');
    } catch (e) {
      aviso(e instanceof Error ? e.message : 'Não foi possível trocar a senha.', 'negative');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className={s.secao}>
      <PageHead title="Perfil" sub={`${usuario.nome ?? ''} · financeiro da ${nomeDaLoja}`} />
      <Card title="Trocar senha">
        <div className={s.formulario}>
          <Input label="Senha atual" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} autoComplete="current-password" />
          <div>
            <Input label="Nova senha" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} autoComplete="new-password" />
            <RegrasDaSenha senha={novaSenha} />
          </div>
          <Button variant="secondary" onClick={trocarSenha} disabled={ocupado || !senhaAtual || !senhaForte(novaSenha)}>
            {ocupado ? 'Trocando…' : 'Trocar senha'}
          </Button>
        </div>
      </Card>
      <Card title="O que o financeiro faz">
        <p className={s.apoio}>
          Você vê a Conta AVLE, o a receber e os pagamentos da {nomeDaLoja}, e baixa tudo em Excel, PDF ou CSV. Grupos,
          clientes e sorteios ficam com a loja. O saque e a troca da chave Pix que você pedir só valem depois que a
          loja aprovar.
        </p>
      </Card>
    </div>
  );
}
