/**
 * Planilha e PDF da auditoria do split, montados no navegador com o que a
 * conferência já trouxe: nada volta ao Asaas para baixar o relatório.
 *
 * A planilha sai em Excel ou CSV, à escolha (app/lib/planilha.ts), com uma
 * aba para as cobranças, outra para o que está fora do AVLE e o resumo. O
 * PDF sai pela impressão do navegador ("Salvar como PDF"), como os
 * contratos, sem biblioteca nova.
 */

import { baixarPlanilha, type Aba, type Celula, type Formato } from '../../lib/planilha';

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

/* ---------------------------------------------------------------- planilha */

const num = (v?: number | null): Celula => (v == null ? null : Number(v));

export function baixarPlanilhaDaAuditoria(r: Resultado, formato: Formato) {
  const abas: Aba[] = [{
    nome: 'Cobranças',
    decimais: [5],
    linhas: [
      ['Cliente', 'Grupo', 'Cota', 'Competência', 'Vencimento', 'Valor (R$)', 'Situação', 'Status no AVLE',
        'Status no Asaas', 'Paga em', 'Forma de pagamento', 'Conta', 'Repasses', 'Gravidade', 'Problemas',
        'Cobrança no Asaas', 'Transação'],
      ...r.cobrancas.map((l): Celula[] => [
        l.cliente, l.grupo, l.cotaId, l.competencia, data(l.vencimento), num(l.valor), situacao(l), l.statusNoAvle,
        l.statusNoAsaas ?? '', data(l.pagaEm), l.formaDePagamento, l.conta === 'AVLE' ? 'da AVLE' : 'da loja',
        repassesEmTexto(l), gravidade(l), l.problemas.map((p) => `[${p.gravidade}] ${p.texto}`).join(' | '),
        l.paymentId, l.transacaoId,
      ]),
    ],
  }];

  const fora = r.semRegistroNoAvle?.cobrancas ?? [];
  if (fora.length > 0) {
    abas.push({
      nome: 'Sem registro no AVLE',
      decimais: [2],
      linhas: [
        ['Cobrança no Asaas', 'Status no Asaas', 'Valor (R$)', 'Vencimento', 'Descrição'],
        ...fora.map((c): Celula[] => [c.paymentId, c.status, num(c.valor), data(c.vencimento), c.descricao]),
      ],
    });
  }

  // Quantidade e valor em colunas separadas: assim a contagem não ganha
  // casas decimais e o dinheiro sai sempre com duas.
  const s = r.resumo;
  abas.push({
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
      [],
      ['Loja', r.loja],
      ['Conferida em', new Date(r.conferidaEm).toLocaleString('pt-BR')],
      ['Conta do Asaas conectada', r.contaConectada ? 'sim' : 'não'],
    ],
  });

  baixarPlanilha(nomeDoArquivo(r), abas, formato);
}

/* --------------------------------------------------------------------- PDF */

const esc = (v: unknown) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Só tokens: o documento impresso herda as folhas da página e roda dentro do
// escopo .avle-ds, então as variáveis do design system valem lá também.
const ESTILO_DO_PDF = `
@page { size: A4; margin: 1.4cm 1.2cm; }
html, body { background: var(--surface-card); }
body { margin: 0; color: var(--text-primary); font: var(--type-body); font-size: var(--text-xs);
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
h1 { font: var(--type-card-title); margin: 0; }
h2 { font-size: var(--text-sm); font-weight: var(--weight-semibold); margin: var(--space-6) 0 var(--space-2); }
.sub { color: var(--text-secondary); margin: var(--space-1) 0 var(--space-4); }
.numeros { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-2); }
.numero { background: var(--surface-sunken); border-radius: var(--radius-xs); padding: var(--space-2) var(--space-3); break-inside: avoid; }
.numero.alerta { background: var(--negative-soft); }
.numero span { display: block; color: var(--text-secondary); font-size: var(--text-2xs); text-transform: uppercase; letter-spacing: .04em; }
.numero b { font-size: var(--text-md); font-weight: var(--weight-semibold); }
.numero.alerta b { color: var(--negative); }
.aviso { background: var(--warning-soft); color: var(--warning); border-radius: var(--radius-xs); padding: var(--space-2) var(--space-3); margin-top: var(--space-2); }
table { width: 100%; border-collapse: collapse; font-size: var(--text-2xs); }
th { text-align: left; font-weight: var(--weight-semibold); color: var(--text-secondary); background: var(--surface-sunken); padding: var(--space-1) var(--space-2); }
td { vertical-align: top; padding: var(--space-2); border-bottom: thin solid var(--border-default); }
tr { break-inside: avoid; }
thead { display: table-header-group; }
.direita { text-align: right; white-space: nowrap; }
.mono { font-family: var(--font-mono); color: var(--text-tertiary); }
.p { display: block; margin-top: var(--space-1); border-radius: var(--radius-xs); padding: var(--space-1) var(--space-2); }
.p.ALTA { background: var(--negative-soft); color: var(--negative); }
.p.MEDIA { background: var(--warning-soft); color: var(--warning); }
.situacao { font-weight: var(--weight-semibold); }
.ok { color: var(--positive); }
`;

export function baixarPdf(r: Resultado, linhas: Linha[], soProblemas: boolean) {
  const s = r.resumo;
  const numeros = [
    { rotulo: 'Cobranças', valor: s.cobrancas },
    { rotulo: 'Pagas no Asaas', valor: s.pagasNoAsaas },
    { rotulo: 'Pagas no AVLE', valor: contarPagasNoAvle(r) },
    { rotulo: 'Com problema', valor: s.comProblema, alerta: s.comProblema > 0 },
    { rotulo: 'Graves', valor: s.graves, alerta: s.graves > 0 },
    { rotulo: 'Pagas na conta da AVLE', valor: s.pagasNaContaDaAvle, alerta: s.pagasNaContaDaAvle > 0 },
    { rotulo: 'A AVLE deve à loja', valor: reais(s.devidoALojaPelaAvle), alerta: s.devidoALojaPelaAvle > 0 },
    { rotulo: 'Comissão não repassada', valor: reais(s.comissaoNaoRepassada), alerta: s.comissaoNaoRepassada > 0 },
  ];
  const avisos = [
    s.repasseParadoNaLoja > 0 ? `Repasse parado na conta da loja: ${reais(s.repasseParadoNaLoja)}.` : '',
    (s.pagasPeloSaldo ?? 0) > 0 ? `${s.pagasPeloSaldo} parcela(s) já pagas pelo saldo da cota seguem com a cobrança aberta no Asaas: se a cliente pagar, paga duas vezes.` : '',
    s.semLeitura > 0 ? `${s.semLeitura} cobrança(s) não puderam ser lidas no Asaas.` : '',
    !r.contaConectada ? `${r.loja} não tem a conta do Asaas conectada: as cobranças novas dela nascem na conta da AVLE.` : '',
  ].filter(Boolean);

  const tabela = linhas.length === 0
    ? `<p class="ok">${soProblemas ? 'Nenhuma cobrança com problema.' : 'Nenhuma cobrança com registro no Asaas.'}</p>`
    : `<table>
        <thead><tr><th>Cliente e grupo</th><th>Parcela</th><th class="direita">Valor</th><th>Situação</th><th>AVLE / Asaas</th><th>Repasses e problemas</th></tr></thead>
        <tbody>${linhas.map((l) => `
          <tr>
            <td><b>${esc(l.cliente || 'Sem nome')}</b><br>${esc(l.grupo)}<br><span class="mono">cota ${esc(l.cotaId)}</span></td>
            <td>${esc(l.competencia || '—')}<br>vence ${esc(data(l.vencimento) || '—')}${l.pagaEm ? `<br>paga ${esc(data(l.pagaEm))}` : ''}</td>
            <td class="direita">${esc(reais(l.valor))}</td>
            <td class="situacao">${esc(situacao(l))}</td>
            <td>${esc(l.statusNoAvle)} / ${esc(l.statusNoAsaas ?? '?')}<br>conta ${l.conta === 'AVLE' ? 'da AVLE' : 'da loja'}<br><span class="mono">${esc(l.paymentId)}</span></td>
            <td>${l.repasses?.length ? esc(repassesEmTexto(l)) : ''}${l.problemas.map((p) => `<span class="p ${p.gravidade}">${esc(p.texto)}</span>`).join('')}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;

  const sem = r.semRegistroNoAvle;
  const semRegistro = !sem ? '' : `
    <h2>Cobranças na conta da loja que o AVLE não conhece</h2>
    ${!sem.conferido ? `<p class="sub">${esc(sem.motivo)}</p>`
      : (sem.cobrancas ?? []).length === 0 ? '<p class="ok">Nenhuma. Toda cobrança da conta da loja tem registro aqui.</p>'
      : `<table><thead><tr><th>Cobrança</th><th>Status</th><th class="direita">Valor</th><th>Vencimento</th><th>Descrição</th></tr></thead><tbody>
          ${sem.cobrancas!.map((c) => `<tr><td class="mono">${esc(c.paymentId)}</td><td>${esc(c.status)}</td><td class="direita">${esc(reais(c.valor))}</td><td>${esc(data(c.vencimento))}</td><td>${esc(c.descricao)}</td></tr>`).join('')}
        </tbody></table>`}`;

  const corpo = `
    <h1>Auditoria do split · ${esc(r.loja)}</h1>
    <p class="sub">Conferida no Asaas em ${esc(new Date(r.conferidaEm).toLocaleString('pt-BR'))} ·
      ${soProblemas ? `só as cobranças com problema (${linhas.length} de ${r.cobrancas.length})` : `todas as cobranças (${linhas.length})`}</p>
    <div class="numeros">${numeros.map((n) => `<div class="numero${n.alerta ? ' alerta' : ''}"><span>${esc(n.rotulo)}</span><b>${esc(n.valor)}</b></div>`).join('')}</div>
    ${avisos.map((a) => `<p class="aviso">${esc(a)}</p>`).join('')}
    <h2>Cobranças</h2>
    ${tabela}
    ${semRegistro}`;

  imprimir(nomeDoArquivo(r), corpo);
}

/**
 * Imprime o HTML num iframe escondido, com as folhas de estilo da página.
 * O título vira o nome sugerido do arquivo no "Salvar como PDF".
 */
function imprimir(titulo: string, corpo: string) {
  const folhas = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) => n.outerHTML).join('');
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  // O srcdoc usa o endereço da página como base, então os links das folhas
  // (/_next/static/...) resolvem igual aqui dentro.
  iframe.srcdoc = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title>${folhas}`
    + `<style>${ESTILO_DO_PDF}</style></head><body class="avle-ds ${esc(document.body.className)}">${corpo}</body></html>`;

  const tituloDaPagina = document.title;
  let limpo = false;
  const limpar = () => {
    if (limpo) return;
    limpo = true;
    document.title = tituloDaPagina;
    iframe.remove();
  };

  iframe.onload = async () => {
    const w = iframe.contentWindow;
    if (!w) return limpar();
    // Sem esperar a fonte, o PDF sai na fonte do sistema.
    await w.document.fonts?.ready.catch(() => undefined);
    // O Chrome sugere o nome do arquivo pelo título da página de cima.
    document.title = titulo;
    w.addEventListener('afterprint', () => setTimeout(limpar, 0), { once: true });
    w.focus();
    w.print();
    // Navegador que não avisa o fim da impressão: o iframe sai sozinho depois.
    setTimeout(limpar, 5 * 60 * 1000);
  };
  document.body.appendChild(iframe);
}
