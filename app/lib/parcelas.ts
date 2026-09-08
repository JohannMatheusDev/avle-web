// Quantas parcelas o saldo de uma cota já cobre.
//
// Regra única de propósito. Três telas faziam essa mesma conta por conta
// própria — a bolinha, a ficha da participante e o resumo do grupo — e todas
// erravam do mesmo jeito, porque todas dividiam reais direto.
//
// O erro: em ponto flutuante, 909,30 / 129,90 dá 6.999999999999999, e o
// Math.floor derruba para 6. Quem tinha sete parcelas baixadas aparecia com
// seis. Atingia todos os grupos da base — os de R$ 129,90 com 7 e 9 parcelas
// pagas, os de R$ 179,90 com 7 — e o resumo do grupo chegava a contar como "em
// atraso" quem estava em dia.
//
// A conta aqui é feita em centavos inteiros, onde essa imprecisão não existe.
// O backend nunca teve o problema porque usa BigDecimal, que é aritmética
// decimal exata; era só o navegador que discordava da ficha.
export function parcelasPagas(
  saldoPoupanca: number | string | null | undefined,
  valorParcela: number | string | null | undefined,
  duracaoMeses?: number | null,
): number {
  const parcela = Number(valorParcela) || 0;
  if (parcela <= 0) return 0;

  const centavosPagos = Math.round((Number(saldoPoupanca) || 0) * 100);
  const centavosDaParcela = Math.round(parcela * 100);

  // Pagamento parcial continua arredondando para baixo: meia parcela não é
  // parcela paga.
  const pagas = Math.max(0, Math.floor(centavosPagos / centavosDaParcela));

  const teto = Number(duracaoMeses) || 0;
  return teto > 0 ? Math.min(pagas, teto) : pagas;
}
