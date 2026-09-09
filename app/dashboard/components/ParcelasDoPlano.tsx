'use client';

import { parcelasPagas } from '../../lib/parcelas';

/**
 * Quanto do plano de uma cota já foi pago.
 *
 * A loja precisa ver de relance quem está em dia e quem não está, sem abrir a
 * ficha de cada uma. Um número de saldo não responde isso — R$ 100 é muito ou
 * pouco depende do valor da parcela e de quantos meses o grupo já rodou.
 *
 * Era uma bolinha por mês, e a bolinha mentia. Ela parecia dizer QUAL mês
 * estava pago, mas o sistema só sabe QUANTAS parcelas foram pagas — os
 * pagamentos antigos foram lançados sem competência. A terceira bolinha verde
 * nunca significou "março pago", e era assim que todo mundo lia.
 *
 * A barra diz a mesma coisa sem sugerir mês nenhum, e o número escrito ao lado
 * tira a dúvida sem ninguém precisar contar bolinha.
 *
 * Verde é pago. Terracota é o que já venceu e não foi pago. Bege é o que ainda
 * não chegou.
 */
export default function ParcelasDoPlano({
  saldoPoupanca,
  valorParcela,
  duracaoMeses,
  inicio,
  recebidoEmPagamentos,
}: {
  saldoPoupanca: number;
  valorParcela: number;
  duracaoMeses: number;
  inicio?: string | null;
  /**
   * Quanto a cota recebeu de verdade, somando Asaas e baixas da loja.
   *
   * Quando vem, manda no lugar do saldo. O saldo e escrito por caminhos que
   * nem sempre deixam lancamento - aporte de quitacao, carga antiga, correcao
   * feita direto no banco - entao ele conta a conta e nao os pagamentos. Uma
   * cota chegou a mostrar cinco parcelas pagas tendo um unico lancamento de
   * tres.
   */
  recebidoEmPagamentos?: number | null;
}) {
  if (!valorParcela || !duracaoMeses) return null;

  // Sem o numero dos lancamentos, cai no saldo: e o caso da cliente que so tem
  // saldo herdado de antes da plataforma, e zerar as bolinhas dela seria pior
  // do que mostrar o numero antigo.
  const base = recebidoEmPagamentos != null ? recebidoEmPagamentos : saldoPoupanca;
  const pagas = parcelasPagas(base, valorParcela, duracaoMeses);

  // Quantas já venceram. A primeira parcela vence no mês SEGUINTE ao início do
  // grupo, e não no mês de abertura — contar o mês de início dava um mês a mais
  // de dívida para todo mundo.
  const vencidas = (() => {
    if (!inicio) return 0;
    const comeco = new Date(inicio);
    if (Number.isNaN(comeco.getTime())) return 0;
    const hoje = new Date();
    const meses =
      (hoje.getFullYear() - comeco.getFullYear()) * 12 + (hoje.getMonth() - comeco.getMonth());
    return Math.max(0, Math.min(meses, duracaoMeses));
  })();

  const atrasadas = Math.max(0, vencidas - pagas);

  const largura = (quantas: number) => `${(Math.max(0, quantas) / duracaoMeses) * 100}%`;

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-2 w-28 shrink-0 overflow-hidden rounded-full bg-[#DFD9CE]"
        role="img"
        aria-label={`${pagas} de ${duracaoMeses} parcelas pagas${atrasadas > 0 ? `, ${atrasadas} em atraso` : ''}`}
        title={`${pagas} de ${duracaoMeses} pagas${atrasadas > 0 ? ` · ${atrasadas} em atraso` : ''}`}
      >
        <span className="h-full bg-[#0B1E14]" style={{ width: largura(pagas) }} />
        {/* O atraso ocupa a faixa entre o que foi pago e o que já venceu. Sem
            ele a barra pareceria só "faltar", sem distinguir mês que ainda nem
            chegou de mês vencido e não pago. */}
        <span className="h-full bg-[#BD6B42]" style={{ width: largura(atrasadas) }} />
      </div>

      <span className="whitespace-nowrap font-mono text-[10px] text-stone-500">
        <strong className="text-[#0B1E14]">
          {pagas}/{duracaoMeses}
        </strong>
        {atrasadas > 0 ? (
          <span className="font-bold text-[#BD6B42]"> · {atrasadas} em atraso</span>
        ) : pagas >= duracaoMeses ? (
          <span className="text-[#0B1E14]"> · quitada</span>
        ) : (
          <span className="text-stone-400"> · em dia</span>
        )}
      </span>
    </div>
  );
}
