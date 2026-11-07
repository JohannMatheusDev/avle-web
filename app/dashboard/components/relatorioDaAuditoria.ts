/**
 * Planilha e PDF da auditoria do split, montados no navegador com o que a
 * conferência já trouxe: nada volta ao Asaas para baixar o relatório.
 *
 * O relatório sai em Excel, PDF ou CSV, à escolha (app/lib/planilha.ts),
 * com uma parte para as cobranças, outra para o que está fora do AVLE e o
 * resumo.
 */

import { baixarRelatorio, type Aba, type Celula, type Formato } from '../../lib/planilha';

export type Problema = { gravidade: 'ALTA' | 'MEDIA'; texto: string };
export type Repasse = { destino: 'AVLE' | 'LOJA' | 'OUTRA'; carteira?: string; valor?: number; status?: string; motivo?: string };
export type Linha = {
  transacaoId: number; cotaId?: number; cliente?: string; grupo?: string; competencia?: string; vencimento?: string;
  valor?: number; statusNoAvle?: string; statusNoAsaas?: string | null; conta: 'AVLE' | 'LOJA'; paymentId: string;
  formaDePagamento?: string; pagaEm?: string; repasses?: Repasse[]; problemas: Problema[];
  /** O saldo da cota já cobre o mês, mas a cobrança segue aberta no Asaas. */
  pagaPeloSaldo?: boolean;
};
export type Resultado = {
  loja: string; contaConectada: boolean; conferidaEm: string;
  resumo: {
    cobrancas: number; pagasNoAsaas: number; comProblema: number; graves: number; pagasNaContaDaAvle: number;
    semLeitura: number; devidoALojaPelaAvle: number; repasseParadoNaLoja: number; comissaoNaoRepassada: number;
    // Vêm da API a partir da versão que cruza com o saldo da cota.
    pagasNoAvle?: number; pagasPeloSaldo?: number;
  };
  cobrancas: Linha[];
  semRegistroNoAvle: { conferido: boolean; motivo?: string; cobrancas?: { paymentId: string; status: string; valor: number; vencimento: string; descricao?: string }[] };
};

export const STATUS_DO_REPASSE: Record<string, string> = {
  DONE: 'feito', PENDING: 'pendente', AWAITING_CREDIT: 'aguardando crédito', CANCELLED: 'cancelado',
  REFUSED: 'recusado', BLOCKED_BY_VALUE_DIVERGENCE: 'bloqueado',
};

// As mesmas listas da API (AuditoriaDoSplit.java): pago aqui é o que soma no
// saldo da cota, e pago lá é o que o Asaas dá como recebido.
const PAGA_NO_AVLE = new Set(['PAGO', 'PAGO_PIX', 'BAIXA_MANUAL_LOJA']);
const PAGA_NO_ASAAS = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED']);
const ESTORNO = new Set(['REFUNDED', 'REFUND_REQUESTED', 'REFUND_IN_PROGRESS', 'CHARGEBACK_REQUESTED',
  'CHARGEBACK_DISPUTE', 'AWAITING_CHARGEBACK_REVERSAL', 'ESTORNADO', 'CONTESTADO']);

export const reais = (v?: number) => (v == null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

export const pagaNoAvle = (l: Linha) => PAGA_NO_AVLE.has(l.statusNoAvle ?? '');

/** Quantas parcelas o AVLE dá como pagas: a conta que tem de bater com a do Asaas. */
export const contarPagasNoAvle = (r: Resultado) => r.resumo.pagasNoAvle ?? r.cobrancas.filter(pagaNoAvle).length;

/**
 * Pagou ou não pagou, em uma frase, cruzando o AVLE e o Asaas. É a coluna
 * que deixa a planilha conversar com o painel da loja.
 */
export function situacao(l: Linha): string {
  const aqui = pagaNoAvle(l);
  const la = PAGA_NO_ASAAS.has(l.statusNoAsaas ?? '');
  if (l.statusNoAsaas == null) return 'Sem leitura no Asaas';
  if (aqui && la) return 'Paga';
  if (l.statusNoAvle === 'DESFEITO' && la) return 'Paga (contada em outra parcela)';
  if (la) return 'Divergente: paga no Asaas, aberta no AVLE';
  if (l.statusNoAvle === 'BAIXA_MANUAL_LOJA') return 'Paga por baixa manual';
  if (aqui) return 'Divergente: baixada no AVLE, sem pagamento no Asaas';
  if (ESTORNO.has(l.statusNoAsaas) || ESTORNO.has(l.statusNoAvle ?? '')) return 'Estornada ou contestada';
  if (l.pagaPeloSaldo) return 'Paga pelo saldo, cobrança aberta no Asaas';
  if (l.statusNoAsaas === 'EXCLUIDA' || l.statusNoAvle === 'CANCELADO') return 'Cancelada';
  if (l.statusNoAsaas === 'OVERDUE') return 'Não paga (vencida)';
  if (l.statusNoAsaas === 'PENDING') return 'Não paga (a vencer)';
  return `Não paga (${l.statusNoAvle ?? '?'} / ${l.statusNoAsaas})`;
}

const data = (v?: string | null) => {
  if (!v) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v;
};

const repassesEmTexto = (l: Linha) =>
  (l.repasses ?? []).map((r) =>
    `${reais(r.valor)} para ${r.destino === 'AVLE' ? 'a AVLE' : r.destino === 'LOJA' ? 'a loja' : 'outra carteira'} (${STATUS_DO_REPASSE[r.status || ''] || r.status || '?'})`,
  ).join(' · ');

const gravidade = (l: Linha) =>
  l.problemas.some((p) => p.gravidade === 'ALTA') ? 'Grave' : l.problemas.length > 0 ? 'Atenção' : '';

const nomeDoArquivo = (r: Resultado) => {
  const loja = r.loja.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `auditoria-split-${loja || 'loja'}-${r.conferidaEm.slice(0, 10)}`;
};

/* ------------------------------------------------------------- relatório */

const num = (v?: number | null): Celula => (v == null ? null : Number(v));

/**
 * Planilha (todas as cobranças) ou PDF (como está na tela: com "só com
 * problema" marcado, só essas). No PDF o resumo vem primeiro, e a tabela das
 * cobranças leva só as colunas que cabem na página.
 */
export function baixarRelatorioDaAuditoria(r: Resultado, formato: Formato, soProblemas: boolean) {
  const pdf = formato === 'pdf';
  const cobrancas = pdf && soProblemas ? r.cobrancas.filter((l) => l.problemas.length > 0) : r.cobrancas;

  const abaDeCobrancas: Aba = {
    nome: 'Cobranças',
    decimais: [5],
    colunasNoPdf: [0, 1, 3, 5, 6, 7, 8, 14],
    linhas: [
      ['Cliente', 'Grupo', 'Cota', 'Competência', 'Vencimento', 'Valor (R$)', 'Situação', 'Status no AVLE',
        'Status no Asaas', 'Paga em', 'Forma de pagamento', 'Conta', 'Repasses', 'Gravidade', 'Problemas',
        'Cobrança no Asaas', 'Transação'],
      ...cobrancas.map((l): Celula[] => [
        l.cliente, l.grupo, l.cotaId, l.competencia, data(l.vencimento), num(l.valor), situacao(l), l.statusNoAvle,
        l.statusNoAsaas ?? '', data(l.pagaEm), l.formaDePagamento, l.conta === 'AVLE' ? 'da AVLE' : 'da loja',
        repassesEmTexto(l), gravidade(l), l.problemas.map((p) => `[${p.gravidade}] ${p.texto}`).join(' | '),
        l.paymentId, l.transacaoId,
      ]),
    ],
  };

  const fora = r.semRegistroNoAvle?.cobrancas ?? [];
  const semRegistro: Aba | null = fora.length === 0 ? null : {
    nome: 'Sem registro no AVLE',
    decimais: [2],
    linhas: [
      ['Cobrança no Asaas', 'Status no Asaas', 'Valor (R$)', 'Vencimento', 'Descrição'],
      ...fora.map((c): Celula[] => [c.paymentId, c.status, num(c.valor), data(c.vencimento), c.descricao]),
    ],
  };

  // Quantidade e valor em colunas separadas: assim a contagem não ganha
  // casas decimais e o dinheiro sai sempre com duas.
  const s = r.resumo;
  const resumo: Aba = {
    nome: 'Resumo',
    decimais: [2],
    filtro: false,
    linhas: [
      ['Item', 'Quantidade', 'Valor (R$)'],
      ['Cobranças', s.cobrancas],
      ['Pagas no Asaas', s.pagasNoAsaas],
      ['Pagas no AVLE', contarPagasNoAvle(r)],
      ...(s.pagasPeloSaldo != null ? [['Pagas pelo saldo, cobrança aberta no Asaas', s.pagasPeloSaldo] as Celula[]] : []),
      ['Com problema', s.comProblema],
      ['Graves', s.graves],
      ['Pagas na conta da AVLE', s.pagasNaContaDaAvle],
      ['Sem leitura no Asaas', s.semLeitura],
      ['A AVLE deve à loja', null, num(s.devidoALojaPelaAvle)],
      ['Comissão não repassada', null, num(s.comissaoNaoRepassada)],
      ['Repasse parado na loja', null, num(s.repasseParadoNaLoja)],
      // Loja e data já vão no título do PDF.
      ...(pdf ? [] : [[], ['Loja', r.loja], ['Conferida em', new Date(r.conferidaEm).toLocaleString('pt-BR')]]),
      ['Conta do Asaas conectada', r.contaConectada ? 'sim' : 'não'],
    ],
  };

  const abas = (pdf ? [resumo, abaDeCobrancas, semRegistro] : [abaDeCobrancas, semRegistro, resumo])
    .filter((a): a is Aba => a !== null);

  return baixarRelatorio(nomeDoArquivo(r), abas, formato, {
    titulo: `Auditoria do split · ${r.loja}`,
    subtitulo: `Conferida no Asaas em ${new Date(r.conferidaEm).toLocaleString('pt-BR')} · `
      + (soProblemas ? `só as cobranças com problema (${cobrancas.length} de ${r.cobrancas.length})` : `todas as cobranças (${cobrancas.length})`),
  });
}
