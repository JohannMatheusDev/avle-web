'use client';

/**
 * Conta AVLE: o dinheiro da loja num lugar só.
 *
 * O saldo e o extrato vêm da conta da loja no Asaas, onde os 90% de cada
 * parcela caem. O "a receber" vem do sistema, das parcelas do mês ainda em
 * aberto. O saque manda o saldo para a chave Pix cadastrada nas
 * Configurações - o destino não se escolhe aqui, de propósito: é a trava que
 * impede uma sessão aberta no balcão de desviar o dinheiro.
 */

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Icone } from './Casca';
import FluxoDeSaque from './FluxoDeSaque';
import ContaAsaasDaLoja from './ContaAsaasDaLoja';
import { real, variacao } from './Indicadores';
import type { DadosDoPainel } from './PainelDaConta';
import { Badge, Button, Card, Icon, Segmented, Select } from '@/design-system';
import {
  ArcoDoDinheiro, BarrasDoPeriodo, CurvaDosDias, FaixaDeNumeros, Leque, ListaDeMovimentos, type Movimento,
} from './ContaAvleVisual';
import s from './ContaAvle.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

export type ResumoDaConta = {
  lojaId: number;
  nomeLoja?: string;
  competencia: string;
  recebidoNoMes: number;
  taxaAvleNoMes: number;
  recebidoMesAnterior?: number;
  taxaAvleMesAnterior?: number;
  aReceberNoMes: number;
  parcelasEmAberto: number;
  chavePix?: string | null;
  tipoChavePix?: string | null;
  conectada: boolean;
  saqueEmAndamento: boolean;
  saldo?: number | null;
  erroSaldo?: string;
  ativacao?: Ativacao;
};

type Ativacao = {
  /** SEM_CONTA, SEM_CHAVE, PENDENTE, RECUSADA, ATIVA ou DESCONHECIDA. */
  situacao: string;
  aguardandoAprovacao?: boolean;
  pendencias?: { titulo: string; situacao: string }[];
  links?: { titulo: string; link: string }[];
  erro?: string;
};

export type Lancamento = {
  id: string;
  data: string;
  valor: number;
  saldoDepois?: number;
  tipo: string;
  titulo: string;
  descricao?: string;
};

export type Saque = {
  id: number;
  valor: number;
  chavePix: string;
  tipoChavePix: string;
  status: string;
  motivoFalha?: string | null;
  comprovanteUrl?: string | null;
  criadoEm: string;
};

const TOM_DO_SAQUE: Record<string, 'positive' | 'negative' | 'warning' | 'neutral'> = {
  CONCLUIDO: 'positive', FALHOU: 'negative', CANCELADO: 'neutral',
  SOLICITANDO: 'warning', AGUARDANDO_APROVACAO: 'warning', PENDENTE: 'warning', EM_PROCESSAMENTO: 'warning',
};

const NOME_DO_TIPO: Record<string, string> = {
  CPF: 'CPF', CNPJ: 'CNPJ', EMAIL: 'E-mail', PHONE: 'Celular', EVP: 'Chave aleatória',
};

const SITUACAO_DO_SAQUE: Record<string, { rotulo: string; classe: string }> = {
  SOLICITANDO: { rotulo: 'Enviando', classe: 'bg-painel-papel text-stone-500' },
  AGUARDANDO_APROVACAO: { rotulo: 'Aguardando aprovação', classe: 'bg-amber-50 text-amber-800' },
  PENDENTE: { rotulo: 'Em andamento', classe: 'bg-amber-50 text-amber-800' },
  EM_PROCESSAMENTO: { rotulo: 'No banco', classe: 'bg-amber-50 text-amber-800' },
  CONCLUIDO: { rotulo: 'Concluído', classe: 'bg-emerald-50 text-emerald-700' },
  FALHOU: { rotulo: 'Não saiu', classe: 'bg-rose-50 text-rose-700' },
  CANCELADO: { rotulo: 'Cancelado', classe: 'bg-stone-100 text-stone-500' },
};

async function lerErro(res: Response, padrao: string) {
  try {
    const corpo = await res.json();
    return corpo?.erro || padrao;
  } catch {
    return padrao;
  }
}

/** Busca o resumo da conta. Compartilhado pela página e pelo painel verde. */
export function useResumoDaConta(lojaId: number | undefined, ativo = true) {
  const [resumo, setResumo] = useState<ResumoDaConta | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const recarregar = useCallback(async () => {
    if (!lojaId) return;
    setCarregando(true);
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/conta`);
      if (!res.ok) throw new Error(await lerErro(res, 'Não foi possível carregar a Conta AVLE.'));
      setResumo(await res.json());
      setErro('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar a Conta AVLE.');
    } finally {
      setCarregando(false);
    }
  }, [lojaId]);

  useEffect(() => {
    if (!ativo) return;
    // A primeira busca sai no quadro seguinte, e não dentro do efeito: o
    // painel inteiro não re-renderiza em cascata por causa dela.
    const quadro = window.requestAnimationFrame(() => { recarregar(); });
    return () => window.cancelAnimationFrame(quadro);
  }, [ativo, recarregar]);

  return { resumo, erro, carregando, recarregar };
}

// ── A faixa de ativação ─────────────────────────────────────────────────────

/**
 * O que falta para a Conta AVLE ficar pronta, dito do jeito que a loja
 * entende: esperar a aprovação, completar o cadastro, ativar a conta no
 * Asaas (com o link de cada documento) ou conectar a chave. Some quando a
 * conta está ativa - faixa que fica para sempre vira paisagem.
 */
export function FaixaDeAtivacao({
  resumo,
  aoIrParaConfiguracoes,
  aoAbrirConta,
  aoAbrirSubconta,
  compacta = false,
}: {
  resumo: ResumoDaConta | null;
  aoIrParaConfiguracoes?: () => void;
  aoAbrirConta?: () => void;
  /** Só o admin: abre a conta no Asaas agora. */
  aoAbrirSubconta?: () => void;
  compacta?: boolean;
}) {
  const a = resumo?.ativacao;
  if (!a || a.situacao === 'ATIVA' || a.situacao === 'DESCONHECIDA') return null;

  let titulo = '';
  let texto = '';
  const botoes: { rotulo: string; aoClicar?: () => void; href?: string; principal?: boolean }[] = [];

  if (a.situacao === 'SEM_CONTA') {
    if (a.aguardandoAprovacao) {
      titulo = 'Sua conta no Asaas abre quando a AVLE aprovar a loja';
      texto = 'Enquanto isso, deixe o endereço completo e o faturamento preenchidos nas Configurações: é com eles que a conta é aberta.';
    } else {
      titulo = 'A loja ainda não tem conta no Asaas';
      texto = 'É nela que caem os 90% de cada parcela. Complete o endereço e o faturamento nas Configurações para a AVLE abrir a conta.';
    }
    if (aoIrParaConfiguracoes) botoes.push({ rotulo: 'Abrir Configurações', aoClicar: aoIrParaConfiguracoes, principal: true });
    if (aoAbrirSubconta) botoes.push({ rotulo: 'Abrir conta no Asaas agora', aoClicar: aoAbrirSubconta, principal: true });
  } else if (a.situacao === 'SEM_CHAVE') {
    titulo = 'Conecte a conta do Asaas para ver o saldo';
    texto = 'O repasse dos 90% já cai na conta da loja. Falta conectar a chave de API para a Conta AVLE mostrar o saldo e sacar.';
    if (aoAbrirConta) botoes.push({ rotulo: 'Conectar agora', aoClicar: aoAbrirConta, principal: true });
  } else {
    const recusada = a.situacao === 'RECUSADA';
    titulo = recusada ? 'O Asaas pediu para refazer parte do cadastro' : 'Ative a conta da loja no Asaas';
    const falta = (a.pendencias ?? []).map((p) => `${p.titulo} (${p.situacao})`).join(', ');
    texto = falta
      ? `Falta: ${falta}. Até a conta ficar ativa, o dinheiro fica retido no Asaas.`
      : 'O Asaas ainda está conferindo o cadastro. Até a conta ficar ativa, o dinheiro fica retido lá.';
    (a.links ?? []).forEach((l, i) => botoes.push({ rotulo: `Enviar ${l.titulo.toLowerCase()}`, href: l.link, principal: i === 0 }));
    botoes.push({ rotulo: 'Abrir o Asaas', href: 'https://www.asaas.com/login', principal: (a.links ?? []).length === 0 });
  }

  return (
    <div className={`rounded-[22px] bg-painel-acento/10 ring-1 ring-painel-acento/25 flex flex-wrap items-center gap-4 ${compacta ? 'px-5 py-4' : 'p-5'}`}>
      <span className="w-10 h-10 rounded-full bg-painel-acento text-white flex items-center justify-center flex-shrink-0">
        <Icone nome="alerta" className="w-[18px] h-[18px]" />
      </span>
      <div className="min-w-0 flex-1 basis-[260px]">
        <p style={{ fontWeight: 600 }} className="text-[14px] text-painel-tinta leading-snug">{titulo}</p>
        <p className="text-[12px] text-stone-500 mt-0.5 leading-relaxed">{texto}</p>
      </div>
      {botoes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {botoes.map((b) => {
            const classe = `h-10 px-4 rounded-full text-[12px] font-semibold inline-flex items-center transition-colors cursor-pointer ${
              b.principal ? 'bg-painel-acento text-white hover:brightness-95' : 'bg-white text-painel-tinta ring-1 ring-painel-borda hover:ring-painel-tinta/30'
            }`;
            return b.href ? (
              <a key={b.rotulo} href={b.href} target="_blank" rel="noreferrer" className={classe}>{b.rotulo}</a>
            ) : (
              <button key={b.rotulo} type="button" onClick={b.aoClicar} className={classe}>{b.rotulo}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** A faixa sozinha, para a tela inicial: busca o resumo por conta própria. */
export function FaixaDeAtivacaoNoInicio({
  lojaId,
  aoIrParaConfiguracoes,
  aoAbrirConta,
}: {
  lojaId: number | undefined;
  aoIrParaConfiguracoes: () => void;
  aoAbrirConta: () => void;
}) {
  const { resumo } = useResumoDaConta(lojaId);
  return (
    <FaixaDeAtivacao
      resumo={resumo}
      compacta
      aoIrParaConfiguracoes={aoIrParaConfiguracoes}
      aoAbrirConta={aoAbrirConta}
    />
  );
}

// ── O que aparece dentro do painel verde da tela inicial ───────────────────

export function ResumoNoPainel({
  lojaId,
  aoAbrir,
}: {
  lojaId: number | undefined;
  aoAbrir: () => void;
}) {
  const { resumo, erro, carregando } = useResumoDaConta(lojaId);

  if (!resumo) {
    return (
      <div className="min-h-[240px] rounded-[24px] bg-white/[0.04] flex items-center justify-center text-[13px] text-white/60 p-6 text-center">
        {carregando || !erro ? 'Carregando a Conta AVLE…' : erro}
      </div>
    );
  }

  const blocos = [
    { rotulo: 'Recebido no mês', valor: real(resumo.recebidoNoMes), nota: 'os 90% da loja' },
    {
      rotulo: 'A receber no mês',
      valor: real(resumo.aReceberNoMes),
      nota: `${resumo.parcelasEmAberto} parcela${resumo.parcelasEmAberto === 1 ? '' : 's'} em aberto`,
    },
    { rotulo: 'Taxa AVLE no mês', valor: real(resumo.taxaAvleNoMes), nota: '10% das parcelas pagas' },
  ];

  return (
    <button
      type="button"
      onClick={aoAbrir}
      className="w-full text-left grid grid-cols-1 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-4 cursor-pointer group"
    >
      <div className="rounded-[24px] bg-avle-verde p-6 flex flex-col justify-between min-h-[240px] ring-1 ring-transparent group-hover:ring-painel-acento/60 transition-shadow">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-white/60">Saldo disponível</span>
          <span className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center">
            <Icone nome="carteira" className="w-4 h-4" />
          </span>
        </div>
        <div>
          {resumo.conectada ? (
            resumo.saldo != null ? (
              <span className="block text-[36px] font-semibold tracking-tight tabular-nums leading-none">{real(resumo.saldo)}</span>
            ) : (
              <span className="block text-[13px] text-amber-300 leading-snug">{resumo.erroSaldo || 'Saldo indisponível agora.'}</span>
            )
          ) : (
            <span className="block text-[15px] text-white/80 leading-snug">
              Conecte a conta do Asaas da loja para ver o saldo e sacar.
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 mt-4 text-[12px] font-semibold text-white bg-painel-acento rounded-full h-9 px-4">
            Abrir Conta AVLE
            <Icone nome="seta" className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 auto-rows-fr">
        {blocos.map((b) => (
          <div key={b.rotulo} className="rounded-[18px] bg-white/[0.07] p-5 flex flex-col justify-end">
            <span className="block text-[11px] text-white/55">{b.rotulo}</span>
            <span className="block text-[20px] font-semibold tabular-nums text-white mt-1.5">{b.valor}</span>
            <span className="block text-[10px] text-white/40 mt-1">{b.nota}</span>
          </div>
        ))}
        {resumo.saqueEmAndamento && (
          <div className="sm:col-span-3 rounded-[18px] bg-amber-400/15 text-amber-200 text-[12px] p-4">
            Há um saque em andamento. Acompanhe na Conta AVLE.
          </div>
        )}
      </div>
    </button>
  );
}

// ── A página da Conta AVLE ──────────────────────────────────────────────────

export function PaginaContaAvle({
  lojaId,
  podeSacar,
  aoIrParaConfiguracoes,
  mostrarAviso,
}: {
  lojaId: number | undefined;
  /** Só a própria loja saca; o admin vê a página sem o botão. */
  podeSacar: boolean;
  aoIrParaConfiguracoes?: () => void;
  mostrarAviso: (titulo: string, texto: string, erro: boolean) => void;
  /** Não é mais usado: o AVLE não abre conta no Asaas para a loja. Fica para quem ainda passa. */
  podeAbrirSubconta?: boolean;
}) {
  const { resumo, erro, carregando, recarregar } = useResumoDaConta(lojaId);
  const [dias, setDias] = useState<7 | 30 | 90>(30);
  const [extrato, setExtrato] = useState<{ lancamentos: Lancamento[]; temMais: boolean } | null>(null);
  const [erroExtrato, setErroExtrato] = useState('');
  const [carregandoExtrato, setCarregandoExtrato] = useState(false);
  const [saques, setSaques] = useState<Saque[]>([]);
  const [modalSaque, setModalSaque] = useState(false);
  const [semanasDoPainel, setSemanasDoPainel] = useState<'4' | '12' | '26'>('12');
  const [painel, setPainel] = useState<DadosDoPainel | null>(null);
  const [exportando, setExportando] = useState(false);

  const conectada = !!resumo?.conectada;

  // Planilha pelo fetch, e não por link direto: a sessão viaja no cookie, e
  // um <a href> para outra origem sairia sem ela.
  const exportar = async (periodo: number = dias) => {
    setExportando(true);
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/conta/extrato.csv?dias=${periodo}`);
      if (!res.ok) throw new Error(await lerErro(res, 'Não foi possível gerar a planilha.'));
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `extrato-conta-avle-${periodo}-dias.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      mostrarAviso('Erro', e instanceof Error ? e.message : 'Não foi possível gerar a planilha.', true);
    } finally {
      setExportando(false);
    }
  };

  const carregarExtrato = useCallback(async (offset: number) => {
    if (!lojaId) return;
    setCarregandoExtrato(true);
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/conta/extrato?dias=${dias}&offset=${offset}`);
      if (!res.ok) throw new Error(await lerErro(res, 'Não foi possível carregar o extrato.'));
      const dados = await res.json();
      setExtrato((atual) => ({
        lancamentos: offset === 0 ? dados.lancamentos : [...(atual?.lancamentos ?? []), ...dados.lancamentos],
        temMais: !!dados.temMais,
      }));
      setErroExtrato('');
    } catch (e) {
      setErroExtrato(e instanceof Error ? e.message : 'Não foi possível carregar o extrato.');
    } finally {
      setCarregandoExtrato(false);
    }
  }, [lojaId, dias]);

  const carregarSaques = useCallback(async () => {
    if (!lojaId) return;
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/conta/saques`);
      if (res.ok) setSaques(await res.json());
    } catch {
      // A lista de saques é complemento: sem ela, o resto da página segue.
    }
  }, [lojaId]);

  useEffect(() => {
    if (!conectada) return;
    const quadro = window.requestAnimationFrame(() => {
      carregarExtrato(0);
      carregarSaques();
    });
    return () => window.cancelAnimationFrame(quadro);
  }, [conectada, carregarExtrato, carregarSaques]);

  useEffect(() => {
    if (!conectada || !lojaId) return;
    let ativo = true;
    apiFetch(`${API_URL}/api/lojas/${lojaId}/conta/painel?semanas=${semanasDoPainel}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((dados) => { if (ativo && dados?.semanas) setPainel(dados); })
      .catch(() => {});
    return () => { ativo = false; };
  }, [conectada, lojaId, semanasDoPainel]);

  if (!resumo) {
    return (
      <div className="cartao-avle p-8 text-center text-[13px] text-stone-400">
        {carregando || !erro ? 'Carregando a Conta AVLE…' : erro}
      </div>
    );
  }

  // Sem a conta do Asaas da loja conectada não há saldo nem extrato: o que a
  // página tem a dizer é como conectar.
  if (!conectada) {
    return (
      <div className="space-y-4 max-w-xl">
        <FaixaDeAtivacao resumo={resumo} aoIrParaConfiguracoes={aoIrParaConfiguracoes} />
        <ContaAsaasDaLoja lojaId={lojaId} mostrarAviso={mostrarAviso} aoConectar={recarregar} />
      </div>
    );
  }

  const saldo = resumo.saldo ?? null;

  return (
    <>
      <FaixaDeAtivacao resumo={resumo} aoIrParaConfiguracoes={aoIrParaConfiguracoes} />
      <TelaDaContaAvle
        resumo={resumo}
        painel={painel}
        extrato={extrato}
        erroExtrato={erroExtrato}
        carregandoExtrato={carregandoExtrato}
        saques={saques}
        dias={dias}
        aoMudarDias={setDias}
        semanasDoPainel={semanasDoPainel}
        aoMudarSemanas={setSemanasDoPainel}
        podeSacar={podeSacar}
        exportando={exportando}
        aoExportar={() => exportar()}
        aoSacar={() => setModalSaque(true)}
        aoIrParaConfiguracoes={aoIrParaConfiguracoes}
        aoCarregarMais={() => extrato && carregarExtrato(extrato.lancamentos.length)}
      />

      {modalSaque && saldo != null && (
        <FluxoDeSaque
          lojaId={lojaId}
          saldo={saldo}
          chavePix={resumo.chavePix || ''}
          tipoChavePix={resumo.tipoChavePix || ''}
          aoFechar={() => setModalSaque(false)}
          aoConcluir={() => {
            setModalSaque(false);
            recarregar();
            carregarSaques();
            carregarExtrato(0);
          }}
        />
      )}
    </>
  );
}

/**
 * A Conta AVLE desenhada, sem buscar nada: recebe os dados prontos. A página
 * busca e passa; a prévia visual passa números de exemplo.
 */
export function TelaDaContaAvle({
  resumo, painel, extrato, erroExtrato, carregandoExtrato, saques, dias, aoMudarDias, semanasDoPainel, aoMudarSemanas,
  podeSacar, exportando, aoExportar, aoSacar, aoIrParaConfiguracoes, aoCarregarMais,
}: {
  resumo: ResumoDaConta;
  painel: DadosDoPainel | null;
  extrato: { lancamentos: Lancamento[]; temMais: boolean } | null;
  erroExtrato?: string;
  carregandoExtrato?: boolean;
  saques: Saque[];
  dias: 7 | 30 | 90;
  aoMudarDias: (d: 7 | 30 | 90) => void;
  semanasDoPainel: '4' | '12' | '26';
  aoMudarSemanas: (s: '4' | '12' | '26') => void;
  podeSacar: boolean;
  exportando?: boolean;
  aoExportar: () => void;
  aoSacar: () => void;
  aoIrParaConfiguracoes?: () => void;
  aoCarregarMais: () => void;
}) {
  const [abaDeMovimentos, setAbaDeMovimentos] = useState<'extrato' | 'saques'>('extrato');
  const chavePix = resumo.chavePix;
  const saldo = resumo.saldo ?? null;
  const semanas = painel?.semanas ?? [];
  const entrou = semanas.reduce((t, x) => t + Number(x.entradas || 0), 0);
  const saiu = semanas.reduce((t, x) => t + Number(x.saidas || 0), 0);
  const podeSacarAgora = podeSacar && saldo != null && saldo > 0 && !resumo.saqueEmAndamento;

  const agora = new Date();
  const hora = agora.getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const dataLonga = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const movimentos: Movimento[] = abaDeMovimentos === 'extrato'
    ? (extrato?.lancamentos ?? []).map((l) => ({
        id: l.id, data: l.data, titulo: l.titulo, subtitulo: l.descricao, valor: Number(l.valor),
      }))
    : saques.map((q) => {
        const situacao = SITUACAO_DO_SAQUE[q.status];
        return {
          id: `saque-${q.id}`,
          data: q.criadoEm,
          titulo: 'Saque via Pix',
          subtitulo: `${NOME_DO_TIPO[q.tipoChavePix] ?? q.tipoChavePix} ${q.chavePix}${q.motivoFalha ? ` · ${q.motivoFalha}` : ''}`,
          valor: -Number(q.valor),
          situacao: <Badge tone={TOM_DO_SAQUE[q.status] ?? 'neutral'}>{situacao?.rotulo ?? q.status}</Badge>,
        };
      });


  return (
      <div className="avle-ds">
        <div className={s.pagina}>
          <header className={s.cabeca}>
            <div>
              <h1 className={s.saudacao}>{saudacao}{resumo.nomeLoja ? `, ${resumo.nomeLoja}` : ''}</h1>
              <div className={s.data}>{dataLonga.charAt(0).toUpperCase() + dataLonga.slice(1)}</div>
            </div>
            <div className={s.acoes}>
              {podeSacar && (
                <button type="button" className={`${s.acaoGrande} ${s.acaoPrincipal}`} onClick={aoSacar} disabled={!podeSacarAgora}>
                  <span className={s.acaoIcone}><Icon name="arrow-up-from-line" size={18} /></span>
                  {resumo.saqueEmAndamento ? 'Saque em andamento' : 'Sacar via Pix'}
                </button>
              )}
              <button type="button" className={s.acaoGrande} onClick={aoExportar} disabled={exportando}>
                <span className={s.acaoIcone}><Icon name="download" size={18} /></span>
                {exportando ? 'Gerando…' : 'Extrato'}
              </button>
              {aoIrParaConfiguracoes && (
                <button type="button" className={s.acaoGrande} onClick={aoIrParaConfiguracoes}>
                  <span className={s.acaoIcone}><Icon name="key-round" size={18} /></span>
                  Chave Pix
                </button>
              )}
            </div>
          </header>

          <Leque
            esquerda={[
              { nome: 'Asaas', marca: 'conta' },
              { nome: 'Chave', resto: 'Pix', marca: chavePix && resumo.tipoChavePix ? (NOME_DO_TIPO[resumo.tipoChavePix] ?? resumo.tipoChavePix) : 'sem chave' },
            ]}
            direita={[
              { nome: 'A receber', marca: real(resumo.aReceberNoMes) },
              { nome: 'Taxa', resto: 'AVLE', marca: '10%' },
            ]}
            saldo={saldo}
            saldoNota={saldo != null ? 'na conta do Asaas da loja' : (resumo.erroSaldo || 'indisponível agora')}
            rotuloEsquerda="Conta conectada"
            rotuloDireita={<>Saques<small>{painel ? `${painel.saques.concluidos.quantidade} concluídos` : ''}</small></>}
          />

          <section className={s.mesa}>
            <FaixaDeNumeros
              itens={[
                {
                  rotulo: 'Taxa AVLE no mês',
                  valor: Number(resumo.taxaAvleNoMes),
                  variacao: variacao([Number(resumo.taxaAvleMesAnterior ?? 0), Number(resumo.taxaAvleNoMes)]),
                  nota: '10% de cada parcela',
                  // A taxa acompanha o que entra: 10% de cada parcela.
                  serie: semanas.map((x) => Number(x.entradas || 0) * 0.1),
                },
                {
                  rotulo: 'Recebido no mês',
                  valor: Number(resumo.recebidoNoMes),
                  variacao: variacao([Number(resumo.recebidoMesAnterior ?? 0), Number(resumo.recebidoNoMes)]),
                  nota: 'vs mês anterior',
                  serie: semanas.map((x) => Number(x.entradas || 0)),
                },
                { rotulo: 'Sacado no período', valor: saiu, nota: `nas últimas ${semanas.length || '—'} semanas`, serie: semanas.map((x) => Number(x.saidas || 0)) },
                {
                  rotulo: 'A receber no mês',
                  valor: Number(resumo.aReceberNoMes),
                  nota: `${resumo.parcelasEmAberto} parcela${resumo.parcelasEmAberto === 1 ? '' : 's'} em aberto`,
                },
              ]}
            />

            <div className={s.grade}>
              <Card
                className={s.recebido}
                title="Entradas"
                actions={
                  <Segmented
                    size="sm"
                    value={semanasDoPainel}
                    onChange={(v) => aoMudarSemanas(v as '4' | '12' | '26')}
                    options={[{ value: '4', label: '4 sem.' }, { value: '12', label: '12 sem.' }, { value: '26', label: '6 meses' }]}
                  />
                }
              >
                {painel ? <BarrasDoPeriodo semanas={semanas} /> : <p className={s.pequeno}>Carregando…</p>}
              </Card>

              <Card className={s.paraOnde} title="Para onde foi">
                {painel ? <ArcoDoDinheiro entrou={entrou} saiu={saiu} /> : <p className={s.pequeno}>Carregando…</p>}
              </Card>

              <Card className={s.curva} title="Dia que mais entra">
                {painel ? <CurvaDosDias porDia={painel.porDiaDaSemana} /> : <p className={s.pequeno}>Carregando…</p>}
              </Card>

              <Card
                className={s.movimentos}
                title="Movimentações"
                actions={
                  <>
                    <Segmented
                      size="sm"
                      value={abaDeMovimentos}
                      onChange={(v) => setAbaDeMovimentos(v as 'extrato' | 'saques')}
                      options={[{ value: 'extrato', label: 'Extrato' }, { value: 'saques', label: 'Saques' }]}
                    />
                    {abaDeMovimentos === 'extrato' && (
                      <Select
                        size="sm"
                        value={String(dias)}
                        onChange={(e) => aoMudarDias(Number(e.target.value) as 7 | 30 | 90)}
                        options={[{ value: '7', label: '7 dias' }, { value: '30', label: '30 dias' }, { value: '90', label: '90 dias' }]}
                      />
                    )}
                  </>
                }
              >
                {abaDeMovimentos === 'extrato' && erroExtrato ? (
                  <p className={`${s.vazio} ${s.erro}`}>{erroExtrato}</p>
                ) : abaDeMovimentos === 'extrato' && !extrato ? (
                  <p className={s.vazio}>Carregando o extrato…</p>
                ) : (
                  <ListaDeMovimentos
                    itens={movimentos}
                    vazio={abaDeMovimentos === 'extrato' ? `Nenhuma movimentação nos últimos ${dias} dias.` : 'Nenhum saque pedido ainda.'}
                  />
                )}
                {abaDeMovimentos === 'extrato' && extrato?.temMais && (
                  <Button variant="ghost" size="sm" onClick={aoCarregarMais} disabled={carregandoExtrato}>
                    {carregandoExtrato ? 'Carregando…' : 'Carregar mais'}
                  </Button>
                )}
              </Card>
            </div>
          </section>
        </div>
      </div>
  );
}

// ── A visão do admin ────────────────────────────────────────────────────────

type VisaoDoAdmin = {
  saldoAvle: number | null;
  erroSaldoAvle?: string;
  taxaAvleNoMes: number;
  lojas: ResumoDaConta[];
};

export function ContaAvleDoAdmin({ aoAbrirLoja }: { aoAbrirLoja?: (lojaId: number) => void }) {
  const [visao, setVisao] = useState<VisaoDoAdmin | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    apiFetch(`${API_URL}/api/admin/conta-avle`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await lerErro(res, 'Não foi possível carregar a Conta AVLE.'));
        return res.json();
      })
      .then((dados) => { if (ativo) setVisao(dados); })
      .catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : 'Não foi possível carregar a Conta AVLE.'); });
    return () => { ativo = false; };
  }, []);

  if (!visao) {
    return <div className="cartao-avle p-8 text-center text-[13px] text-stone-400">{erro || 'Carregando a Conta AVLE…'}</div>;
  }

  const somaLojas = visao.lojas.reduce((a, l) => a + (Number(l.saldo) || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cartao-avle-destaque p-6 min-h-[180px] flex flex-col justify-between">
          <span className="text-[13px] text-white/60">Saldo da AVLE</span>
          <div>
            {visao.saldoAvle != null ? (
              <span className="block text-[34px] font-semibold tracking-tight tabular-nums leading-none">{real(visao.saldoAvle)}</span>
            ) : (
              <span className="block text-[13px] text-amber-300">{visao.erroSaldoAvle || 'Saldo indisponível agora.'}</span>
            )}
            <span className="block text-[11px] text-white/50 mt-2">na conta da AVLE no Asaas</span>
          </div>
        </div>
        <div className="cartao-avle p-6 min-h-[180px] flex flex-col justify-between">
          <span className="text-[13px] font-medium text-painel-tinta">Taxa AVLE no mês</span>
          <span className="block text-[28px] font-semibold tabular-nums text-painel-tinta">{real(visao.taxaAvleNoMes)}</span>
        </div>
        <div className="cartao-avle p-6 min-h-[180px] flex flex-col justify-between">
          <span className="text-[13px] font-medium text-painel-tinta">Saldo somado das lojas</span>
          <div>
            <span className="block text-[28px] font-semibold tabular-nums text-painel-tinta">{real(somaLojas)}</span>
            <span className="block text-[11px] text-stone-400 mt-1">
              {visao.lojas.filter((l) => l.conectada).length} de {visao.lojas.length} lojas conectadas
            </span>
          </div>
        </div>
      </div>

      <div className="cartao-avle overflow-hidden">
        <div className="px-5 py-4 border-b border-painel-borda/70">
          <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">Lojas</h3>
          <p className="text-[11px] text-stone-400">o saldo de cada loja e o que ela ainda recebe no mês</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[12px]">
            <thead>
              <tr className="text-stone-400 border-b border-painel-borda/70">
                <th className="py-3 px-5 font-medium">Loja</th>
                <th className="py-3 px-5 font-medium">Conta</th>
                <th className="py-3 px-5 font-medium text-right">Saldo</th>
                <th className="py-3 px-5 font-medium text-right">Recebido no mês</th>
                <th className="py-3 px-5 font-medium text-right">A receber</th>
                <th className="py-3 px-5 font-medium text-right">Taxa AVLE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-painel-borda/60">
              {visao.lojas.map((l) => (
                <tr
                  key={l.lojaId}
                  onClick={() => aoAbrirLoja?.(l.lojaId)}
                  className={aoAbrirLoja ? 'hover:bg-painel-papel/60 cursor-pointer' : ''}
                >
                  <td className="py-3.5 px-5 font-semibold text-painel-tinta">{l.nomeLoja || `Loja #${l.lojaId}`}</td>
                  <td className="py-3.5 px-5">
                    <span className={`h-6 px-2.5 rounded-full text-[10px] font-semibold inline-flex items-center ${
                      l.conectada ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {l.conectada ? 'Conectada' : 'Não conectada'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-semibold tabular-nums text-painel-tinta">
                    {l.conectada ? (l.saldo != null ? real(l.saldo) : '—') : '—'}
                  </td>
                  <td className="py-3.5 px-5 text-right tabular-nums">{real(l.recebidoNoMes)}</td>
                  <td className="py-3.5 px-5 text-right tabular-nums">{real(l.aReceberNoMes)}</td>
                  <td className="py-3.5 px-5 text-right tabular-nums text-emerald-700">{real(l.taxaAvleNoMes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
