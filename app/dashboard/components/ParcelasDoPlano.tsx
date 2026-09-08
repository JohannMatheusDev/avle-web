'use client';

import { parcelasPagas } from '../../lib/parcelas';

/**
 * As parcelas do plano de uma cota, uma bolinha por mês.
 *
 * A loja precisa ver de relance quem está em dia e quem não está, sem abrir a
 * ficha de cada uma. Um número de saldo não responde isso — R$ 100 é muito ou
 * pouco depende do valor da parcela e de quantos meses o grupo já rodou.
 *
 * Verde é parcela paga. Terracota é mês que já venceu e não foi pago.
 * Bege é mês que ainda não chegou.
 *
 * As parcelas pagas vêm do saldo dividido pelo valor da parcela, e não de um
 * registro por mês: os pagamentos antigos foram lançados sem a competência,
 * então não há como dizer QUAL mês cada um quitou. O saldo diz quantos, e para
 * a leitura da loja isso basta.
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

  const cor = (mes: number) => {
    if (mes <= pagas) return 'bg-[#0B1E14]';
    if (mes <= vencidas) return 'bg-[#BD6B42]';
    return 'bg-[#DFD9CE]';
  };

  const legenda = (mes: number) => {
    if (mes <= pagas) return `Parcela ${mes}: paga`;
    if (mes <= vencidas) return `Parcela ${mes}: em atraso`;
    return `Parcela ${mes}: ainda não venceu`;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1" aria-label={`${pagas} de ${duracaoMeses} parcelas pagas`}>
        {Array.from({ length: duracaoMeses }, (_, i) => i + 1).map((mes) => (
          <span
            key={mes}
            title={legenda(mes)}
            className={`h-2.5 w-2.5 rounded-full ${cor(mes)} ${mes <= vencidas ? '' : 'opacity-70'}`}
          />
        ))}
      </div>
      <span className="text-[10px] font-mono text-stone-400 whitespace-nowrap">
        {pagas}/{duracaoMeses}
        {atrasadas > 0 && <span className="text-[#BD6B42] font-bold"> · {atrasadas} em atraso</span>}
      </span>
    </div>
  );
}
