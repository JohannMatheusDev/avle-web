// Faturamento da loja por semana, a partir do extrato de transacoes.
//
// O servidor so manda o faturamento agrupado por mes. A semana e montada aqui
// com o extrato que o painel ja carrega (/api/financeiro/lojas/{id}/transacoes),
// e com a mesma regra do MetricasLojaService do avle-api: soma so o que entrou
// de fato, pelo liquido da loja (90%), na data do pagamento. Se a regra mudar
// la, tem que mudar aqui - senao a semana e o mes passam a discordar.

const SOMA_NO_FATURAMENTO = new Set(['PAGO', 'PAGO_PIX', 'BAIXA_MANUAL_LOJA', 'SALDO_ANTERIOR_A_PLATAFORMA']);
const PARTE_DA_LOJA = 0.9;

type LinhaDoExtrato = {
  dataTransacao?: string | null;
  statusPagamento?: string | null;
  valorBruto?: number | string | null;
  valorLiquido?: number | string | null;
};

/** Segunda-feira da semana de `data`, a zero hora. */
export function inicioDaSemana(data: Date): Date {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  // getDay: domingo e 0. A semana comeca na segunda, como no calendario do
  // comercio, entao domingo volta seis dias.
  const recuo = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - recuo);
  return d;
}

/** Cada entrada de dinheiro do extrato, com a data e o liquido da loja. */
function entradas(extrato: unknown[]) {
  const lista: { quando: number; liquido: number }[] = [];
  for (const bruto of extrato) {
    const t = bruto as LinhaDoExtrato;
    if (!t?.dataTransacao || !SOMA_NO_FATURAMENTO.has(String(t.statusPagamento ?? '').toUpperCase())) continue;

    // A API manda LocalDateTime sem fuso ("2026-09-20T10:15:00"), que o
    // navegador le como hora local - a de Brasilia, que e a da loja.
    const quando = new Date(t.dataTransacao).getTime();
    if (Number.isNaN(quando)) continue;

    const liquido = t.valorLiquido != null
      ? Number(t.valorLiquido)
      : (Number(t.valorBruto) || 0) * PARTE_DA_LOJA;
    lista.push({ quando, liquido: Number.isFinite(liquido) ? liquido : 0 });
  }
  return lista;
}

const UM_DIA = 24 * 60 * 60 * 1000;
const arredondar = (n: number) => Math.round(n * 100) / 100;

/**
 * As ultimas `quantas` semanas, da mais antiga para a atual, com o total
 * liquido recebido em cada uma. A semana atual vem parcial: vai de segunda
 * ate hoje.
 */
export function faturamentoPorSemana(extrato: unknown[], quantas = 8, hoje = new Date()) {
  const atual = inicioDaSemana(hoje);
  const semanas = Array.from({ length: quantas }, (_, i) => {
    const inicio = new Date(atual);
    inicio.setDate(atual.getDate() - 7 * (quantas - 1 - i));
    return { inicio, total: 0 };
  });
  const primeira = semanas[0].inicio.getTime();

  for (const { quando, liquido } of entradas(extrato)) {
    if (quando < primeira) continue;
    const indice = Math.floor((quando - primeira) / (7 * UM_DIA));
    if (indice >= 0 && indice < quantas) semanas[indice].total += liquido;
  }

  return semanas.map(({ inicio, total }) => ({
    inicio,
    rotulo: inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    total: arredondar(total),
  }));
}

/**
 * A semana atual contra o mesmo trecho da semana passada: de segunda ate o
 * mesmo dia da semana e a mesma hora de hoje.
 *
 * Comparar a semana em andamento com a anterior inteira faria toda
 * segunda-feira parecer uma queda de quase 100%, sem nada ter piorado.
 */
export function semanaContraAnterior(extrato: unknown[], hoje = new Date()) {
  const inicio = inicioDaSemana(hoje).getTime();
  const decorrido = hoje.getTime() - inicio;
  const inicioAnterior = inicio - 7 * UM_DIA;

  let atual = 0;
  let anterior = 0;
  for (const { quando, liquido } of entradas(extrato)) {
    if (quando >= inicio && quando <= hoje.getTime()) atual += liquido;
    else if (quando >= inicioAnterior && quando <= inicioAnterior + decorrido) anterior += liquido;
  }
  return { atual: arredondar(atual), anterior: arredondar(anterior) };
}
