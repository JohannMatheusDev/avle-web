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
import { SeletorDePeriodo, real, variacao } from './Indicadores';
import {
  CartaoDeSaques, ColmeiaDeGrupos, DadosDoPainel, DiaQueMaisEntra, GraficoDeMovimento, NumerosDoTopo, ResumoDaSemana,
} from './PainelDaConta';

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

type Lancamento = {
  id: string;
  data: string;
  valor: number;
  saldoDepois?: number;
  tipo: string;
  titulo: string;
  descricao?: string;
};

type Saque = {
  id: number;
  valor: number;
  chavePix: string;
  tipoChavePix: string;
  status: string;
  motivoFalha?: string | null;
  comprovanteUrl?: string | null;
  criadoEm: string;
};

const NOME_DO_TIPO: Record<string, string> = {
  CPF: 'CPF', CNPJ: 'CNPJ', EMAIL: 'E-mail', PHONE: 'Celular', EVP: 'Chave aleatória',
};

const SITUACAO_DO_SAQUE: Record<string, { rotulo: string; classe: string }> = {
  SOLICITANDO: { rotulo: 'Enviando', classe: 'bg-painel-papel text-stone-500' },
  AGUARDANDO_APROVACAO: { rotulo: 'Aprovar no app do Asaas', classe: 'bg-amber-50 text-amber-800' },
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
  podeAbrirSubconta = false,
}: {
  lojaId: number | undefined;
  /** Só a própria loja saca; o admin vê a página sem o botão. */
  podeSacar: boolean;
  aoIrParaConfiguracoes?: () => void;
  mostrarAviso: (titulo: string, texto: string, erro: boolean) => void;
  /** Só o admin abre a conta no Asaas pela ficha da loja. */
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
  const [grupos, setGrupos] = useState<{ nome: string; faturado: number }[]>([]);
  const [exportando, setExportando] = useState(false);

  const conectada = !!resumo?.conectada;

  const abrirSubconta = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/conta/abrir-subconta`, { method: 'POST' });
      if (!res.ok) throw new Error(await lerErro(res, 'Não foi possível abrir a conta no Asaas.'));
      const r = await res.json();
      mostrarAviso(r.situacao === 'ABERTA' || r.situacao === 'JA_EXISTIA' ? 'Conta no Asaas' : 'Ainda não deu', r.mensagem, !(r.situacao === 'ABERTA' || r.situacao === 'JA_EXISTIA'));
      recarregar();
    } catch (e) {
      mostrarAviso('Erro', e instanceof Error ? e.message : 'Não foi possível abrir a conta no Asaas.', true);
    }
  };

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

  // O faturado por grupo vem do analytics da loja, o mesmo da tela inicial.
  useEffect(() => {
    if (!lojaId) return;
    let ativo = true;
    apiFetch(`${API_URL}/api/analytics/loja/${lojaId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((dados) => {
        if (!ativo || !Array.isArray(dados?.faturamentoPorGrupo)) return;
        setGrupos(dados.faturamentoPorGrupo.map((g: { nome: string; faturado?: number; total?: number }) => ({
          nome: g.nome, faturado: Number(g.faturado ?? g.total ?? 0),
        })));
      })
      .catch(() => {});
    return () => { ativo = false; };
  }, [lojaId]);

  if (!resumo) {
    return (
      <div className="cartao-avle p-8 text-center text-[13px] text-stone-400">
        {carregando || !erro ? 'Carregando a Conta AVLE…' : erro}
      </div>
    );
  }

  if (!conectada) {
    return (
      <div className="space-y-4">
        <FaixaDeAtivacao
          resumo={resumo}
          aoIrParaConfiguracoes={aoIrParaConfiguracoes}
          aoAbrirSubconta={podeAbrirSubconta ? abrirSubconta : undefined}
        />
        <ConectarConta
          lojaId={lojaId}
          aoConectar={recarregar}
          mostrarAviso={mostrarAviso}
          resumo={resumo}
          jaTemContaNoAsaas={resumo.ativacao?.situacao === 'SEM_CHAVE'}
        />
      </div>
    );
  }

  const chavePix = resumo.chavePix;
  const saldo = resumo.saldo ?? null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <FaixaDeAtivacao resumo={resumo} aoIrParaConfiguracoes={aoIrParaConfiguracoes} />

      {/* A cabeça da página: os números soltos, como na referência, e as
          ações do lado. */}
      <div className="flex flex-col-reverse gap-6">
        <div className="min-w-0">
          <NumerosDoTopo
            itens={[
              {
                rotulo: 'Saldo disponível',
                valor: saldo != null ? real(saldo) : '—',
                nota: saldo != null ? 'na conta do Asaas' : (resumo.erroSaldo || 'indisponível agora'),
              },
              {
                rotulo: 'Recebido no mês',
                valor: real(resumo.recebidoNoMes),
                variacao: variacao([Number(resumo.recebidoMesAnterior ?? 0), Number(resumo.recebidoNoMes)]),
                nota: 'vs mês anterior',
              },
              {
                rotulo: 'A receber no mês',
                valor: real(resumo.aReceberNoMes),
                nota: `${resumo.parcelasEmAberto} parcela${resumo.parcelasEmAberto === 1 ? '' : 's'} em aberto`,
              },
              {
                rotulo: 'Taxa AVLE no mês',
                valor: real(resumo.taxaAvleNoMes),
                variacao: variacao([Number(resumo.taxaAvleMesAnterior ?? 0), Number(resumo.taxaAvleNoMes)]),
                nota: '10% retidos',
              },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => exportar()}
            disabled={exportando}
            className="h-11 px-5 rounded-full bg-white ring-1 ring-painel-borda text-[13px] font-semibold text-painel-tinta hover:ring-painel-tinta/30 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {exportando ? 'Gerando…' : 'Exportar planilha'}
          </button>
          {podeSacar && (
            <button
              type="button"
              onClick={() => setModalSaque(true)}
              disabled={saldo == null || saldo <= 0 || resumo.saqueEmAndamento || !resumo.tipoChavePix}
              className="h-11 px-6 rounded-full bg-painel-acento text-white text-[13px] font-semibold shadow-[0_10px_20px_-12px_rgba(189,107,66,0.9)] hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {resumo.saqueEmAndamento ? 'Saque em andamento' : 'Sacar via Pix'}
            </button>
          )}
        </div>
      </div>

      {painel ? (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] gap-4">
            <GraficoDeMovimento
              semanas={painel.semanas}
              controle={
                <SeletorDePeriodo
                  valor={semanasDoPainel}
                  aoEscolher={setSemanasDoPainel}
                  opcoes={[
                    { id: '4', rotulo: '4 semanas' },
                    { id: '12', rotulo: '12 semanas' },
                    { id: '26', rotulo: '6 meses' },
                  ]}
                />
              }
            />
            <CartaoDeSaques
              saldo={saldo}
              saques={painel.saques}
              aoSacar={podeSacar && saldo != null && saldo > 0 && !resumo.saqueEmAndamento && resumo.tipoChavePix
                ? () => setModalSaque(true) : undefined}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <ColmeiaDeGrupos grupos={grupos} />
            <DiaQueMaisEntra porDia={painel.porDiaDaSemana} />
            <ResumoDaSemana dados={painel.resumoDaSemana} aoBaixar={() => exportar(7)} />
          </div>
        </>
      ) : (
        <div className="cartao-avle p-8 text-center text-[13px] text-stone-400">Carregando os gráficos da conta…</div>
      )}

      <div className="cartao-avle p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-full bg-painel-papel ring-1 ring-painel-borda text-painel-acento flex items-center justify-center flex-shrink-0">
            <Icone nome="link" className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <span className="block text-[13px] font-medium text-painel-tinta">Os saques vão para</span>
            <span className="block text-[12px] text-stone-500 truncate">
              {chavePix && resumo.tipoChavePix
                ? `${NOME_DO_TIPO[resumo.tipoChavePix] ?? resumo.tipoChavePix} · ${chavePix}`
                : 'Nenhuma chave Pix válida cadastrada ainda.'}
            </span>
          </div>
        </div>
        {aoIrParaConfiguracoes && (
          <button
            type="button"
            onClick={aoIrParaConfiguracoes}
            className="h-10 px-4 rounded-full border border-painel-borda text-[12px] font-semibold text-painel-tinta hover:border-painel-tinta/30 transition-colors cursor-pointer"
          >
            {chavePix ? 'Alterar em Configurações' : 'Cadastrar chave Pix'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4">
        <div className="cartao-avle overflow-hidden">
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-painel-borda/70">
            <div>
              <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">Extrato</h3>
              <p className="text-[11px] text-stone-400">tudo o que entrou e saiu da conta da loja</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => exportar()}
              disabled={exportando}
              className="h-10 px-4 rounded-full border border-painel-borda text-[12px] font-semibold text-painel-tinta hover:border-painel-tinta/30 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {exportando ? 'Gerando…' : 'Exportar planilha'}
            </button>
            <div className="flex gap-1 bg-painel-papel rounded-full p-1">
              {([7, 30, 90] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDias(d)}
                  aria-pressed={dias === d}
                  className={`h-8 px-3.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    dias === d ? 'bg-painel-tinta text-white' : 'text-stone-500 hover:text-painel-tinta'
                  }`}
                >
                  {d} dias
                </button>
              ))}
            </div>
            </div>
          </div>

          {erroExtrato ? (
            <p className="px-5 py-10 text-center text-[12px] text-rose-600">{erroExtrato}</p>
          ) : !extrato ? (
            <p className="px-5 py-10 text-center text-[12px] text-stone-400">Carregando o extrato…</p>
          ) : extrato.lancamentos.length === 0 ? (
            <p className="px-5 py-10 text-center text-[12px] text-stone-400">Nenhuma movimentação nos últimos {dias} dias.</p>
          ) : (
            <ul className="divide-y divide-painel-borda/60">
              {extrato.lancamentos.map((l) => {
                const entrada = Number(l.valor) >= 0;
                return (
                  <li key={l.id} className="px-5 py-3.5 flex items-center gap-3">
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[15px] font-semibold ${
                      entrada ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {entrada ? '+' : '−'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-painel-tinta truncate">{l.titulo}</span>
                      <span className="block text-[11px] text-stone-400 truncate">
                        {l.data ? new Date(`${l.data}T12:00:00`).toLocaleDateString('pt-BR') : ''}
                        {l.descricao ? ` · ${l.descricao}` : ''}
                      </span>
                    </span>
                    <span className="text-right flex-shrink-0">
                      <span className={`block text-[13px] font-semibold tabular-nums ${entrada ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {entrada ? '+' : '−'} {real(Math.abs(Number(l.valor)))}
                      </span>
                      {l.saldoDepois != null && (
                        <span className="block text-[10px] text-stone-400 tabular-nums">saldo {real(l.saldoDepois)}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {extrato?.temMais && (
            <div className="px-5 py-4 border-t border-painel-borda/70 text-center">
              <button
                type="button"
                onClick={() => carregarExtrato(extrato.lancamentos.length)}
                disabled={carregandoExtrato}
                className="h-10 px-5 rounded-full border border-painel-borda text-[12px] font-semibold text-painel-tinta disabled:opacity-50 cursor-pointer"
              >
                {carregandoExtrato ? 'Carregando…' : 'Carregar mais'}
              </button>
            </div>
          )}
        </div>

        <div className="cartao-avle overflow-hidden self-start">
          <div className="px-5 py-4 border-b border-painel-borda/70">
            <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">Saques</h3>
            <p className="text-[11px] text-stone-400">os últimos pedidos pela Conta AVLE</p>
          </div>
          {saques.length === 0 ? (
            <p className="px-5 py-10 text-center text-[12px] text-stone-400">Nenhum saque pedido ainda.</p>
          ) : (
            <ul className="divide-y divide-painel-borda/60">
              {saques.map((s) => {
                const situacao = SITUACAO_DO_SAQUE[s.status] ?? { rotulo: s.status, classe: 'bg-painel-papel text-stone-500' };
                return (
                  <li key={s.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[14px] font-semibold tabular-nums text-painel-tinta">{real(s.valor)}</span>
                      <span className={`h-6 px-2.5 rounded-full text-[10px] font-semibold flex items-center ${situacao.classe}`}>
                        {situacao.rotulo}
                      </span>
                    </div>
                    <span className="block text-[11px] text-stone-400 mt-1">
                      {new Date(s.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      {' · '}{NOME_DO_TIPO[s.tipoChavePix] ?? s.tipoChavePix} {s.chavePix}
                    </span>
                    {s.motivoFalha && <span className="block text-[11px] text-rose-600 mt-1">{s.motivoFalha}</span>}
                    {s.comprovanteUrl && (
                      <a
                        href={s.comprovanteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-painel-acento mt-1.5 hover:underline"
                      >
                        Ver comprovante
                        <Icone nome="seta" className="w-3 h-3" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {modalSaque && saldo != null && (
        <ModalDeSaque
          lojaId={lojaId}
          saldo={saldo}
          chavePix={chavePix || ''}
          tipoChavePix={resumo.tipoChavePix || ''}
          aoFechar={() => setModalSaque(false)}
          aoConcluir={() => {
            setModalSaque(false);
            recarregar();
            carregarSaques();
            carregarExtrato(0);
            mostrarAviso('Saque pedido', 'O dinheiro sai para a sua chave Pix. Acompanhe o andamento na lista de saques.', false);
          }}
        />
      )}
    </div>
  );
}

function ConectarConta({
  lojaId,
  aoConectar,
  mostrarAviso,
  resumo,
  jaTemContaNoAsaas,
}: {
  lojaId: number | undefined;
  aoConectar: () => void;
  mostrarAviso: (titulo: string, texto: string, erro: boolean) => void;
  resumo: ResumoDaConta;
  jaTemContaNoAsaas: boolean;
}) {
  const [chave, setChave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const conectar = async () => {
    setEnviando(true);
    setErro('');
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/conta/conectar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave }),
      });
      if (!res.ok) throw new Error(await lerErro(res, 'Não foi possível conectar a conta.'));
      setChave('');
      mostrarAviso('Conta conectada', 'A Conta AVLE já mostra o saldo e o extrato da loja.', false);
      aoConectar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível conectar a conta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 animate-fadeIn">
      <div className="cartao-avle-destaque p-7 flex flex-col justify-between min-h-[280px]">
        <div>
          <span className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
            <Icone nome="carteira" />
          </span>
          <h3 style={{ fontWeight: 600 }} className="text-[24px] mt-5 leading-tight">
            {jaTemContaNoAsaas ? 'Conecte a conta do Asaas da loja' : 'Já tem conta própria no Asaas?'}
          </h3>
          <p className="text-[13px] text-white/65 mt-2 leading-relaxed">
            Os 90% de cada parcela caem na conta da loja no Asaas. Conectando, a Conta AVLE mostra o saldo, o extrato e
            deixa sacar por Pix sem sair do painel.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-6">
          {[
            { r: 'Recebido no mês', v: resumo.recebidoNoMes },
            { r: 'A receber', v: resumo.aReceberNoMes },
            { r: 'Taxa AVLE', v: resumo.taxaAvleNoMes },
          ].map((b) => (
            <div key={b.r} className="rounded-[16px] bg-white/[0.07] p-3">
              <span className="block text-[10px] text-white/50">{b.r}</span>
              <span className="block text-[14px] font-semibold tabular-nums mt-1">{real(b.v)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="cartao-avle p-7">
        <ol className="space-y-3 text-[13px] text-stone-500 leading-relaxed">
          <li><strong className="text-painel-tinta">1.</strong> Entre no Asaas com a conta da loja.</li>
          <li><strong className="text-painel-tinta">2.</strong> Abra <strong className="text-painel-tinta">Integrações → Chave de API</strong> e gere uma chave.</li>
          <li><strong className="text-painel-tinta">3.</strong> Cole abaixo. Ela fica guardada cifrada, e só é aceita se for da mesma conta que recebe os 90%.</li>
        </ol>
        <label className="block text-[12px] text-stone-400 mt-6 mb-1.5" htmlFor="chave-asaas">Chave de API do Asaas</label>
        <input
          id="chave-asaas"
          type="password"
          autoComplete="off"
          value={chave}
          onChange={(e) => setChave(e.target.value)}
          placeholder="$aact_…"
          className="w-full h-12 px-5 bg-painel-papel ring-1 ring-painel-borda rounded-full text-[13px] text-painel-tinta focus:outline-none focus:ring-2 focus:ring-painel-acento/50"
        />
        {erro && <p className="text-[12px] text-rose-600 mt-2 leading-snug">{erro}</p>}
        <button
          type="button"
          onClick={conectar}
          disabled={enviando || !chave.trim()}
          className="mt-4 h-11 px-6 rounded-full bg-painel-tinta text-white text-[13px] font-semibold hover:bg-avle-verde disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {enviando ? 'Conferindo com o Asaas…' : 'Conectar conta'}
        </button>
      </div>
    </div>
  );
}

function ModalDeSaque({
  lojaId,
  saldo,
  chavePix,
  tipoChavePix,
  aoFechar,
  aoConcluir,
}: {
  lojaId: number | undefined;
  saldo: number;
  chavePix: string;
  tipoChavePix: string;
  aoFechar: () => void;
  aoConcluir: () => void;
}) {
  const [valor, setValor] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const numero = Number(valor.replace(/\./g, '').replace(',', '.'));
  const valido = Number.isFinite(numero) && numero > 0 && numero <= saldo && senha.length > 0;

  const sacar = async () => {
    setEnviando(true);
    setErro('');
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/conta/saque`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: numero.toFixed(2), senha }),
      });
      if (!res.ok) throw new Error(await lerErro(res, 'Não foi possível pedir o saque.'));
      aoConcluir();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível pedir o saque.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-painel-tinta/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-saque">
      <div className="bg-white w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-avle-subir">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="titulo-saque" style={{ fontWeight: 600 }} className="text-[20px] text-painel-tinta">Sacar via Pix</h3>
            <p className="text-[12px] text-stone-400 mt-1">Disponível: {real(saldo)}</p>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="w-9 h-9 rounded-full bg-painel-papel text-stone-500 hover:text-painel-tinta flex items-center justify-center cursor-pointer">
            ✕
          </button>
        </div>

        <label className="block text-[12px] text-stone-400 mt-5 mb-1.5" htmlFor="valor-saque">Valor</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[14px] text-stone-400">R$</span>
            <input
              id="valor-saque"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value.replace(/[^\d,.]/g, ''))}
              placeholder="0,00"
              className="w-full h-12 pl-12 pr-5 bg-painel-papel ring-1 ring-painel-borda rounded-full text-[16px] font-semibold tabular-nums text-painel-tinta focus:outline-none focus:ring-2 focus:ring-painel-acento/50"
            />
          </div>
          <button
            type="button"
            onClick={() => setValor(saldo.toFixed(2).replace('.', ','))}
            className="h-12 px-4 rounded-full border border-painel-borda text-[12px] font-semibold text-painel-tinta hover:border-painel-tinta/30 cursor-pointer"
          >
            Tudo
          </button>
        </div>
        {numero > saldo && <p className="text-[11px] text-rose-600 mt-1.5">O valor passa do saldo disponível.</p>}

        <div className="rounded-[18px] bg-painel-papel p-4 mt-4">
          <span className="block text-[11px] text-stone-400">Vai para a chave Pix da loja</span>
          <span className="block text-[13px] font-semibold text-painel-tinta mt-0.5 break-all">
            {NOME_DO_TIPO[tipoChavePix] ?? tipoChavePix} · {chavePix}
          </span>
        </div>

        <label className="block text-[12px] text-stone-400 mt-4 mb-1.5" htmlFor="senha-saque">Confirme com a senha do painel</label>
        <input
          id="senha-saque"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full h-12 px-5 bg-painel-papel ring-1 ring-painel-borda rounded-full text-[13px] text-painel-tinta focus:outline-none focus:ring-2 focus:ring-painel-acento/50"
        />

        {erro && <p className="text-[12px] text-rose-600 mt-3 leading-snug">{erro}</p>}

        <button
          type="button"
          onClick={sacar}
          disabled={!valido || enviando}
          className="mt-5 w-full h-12 rounded-full bg-painel-acento text-white text-[14px] font-semibold shadow-[0_12px_24px_-14px_rgba(189,107,66,0.9)] hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {enviando ? 'Enviando ao Asaas…' : valido ? `Sacar ${real(numero)}` : 'Sacar'}
        </button>
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
