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
 * A barra não compara com a data de início do grupo. Já comparou, e era de lá
 * que vinham os números errados: a data de início é informada pela loja, cai na
 * data de criação quando ninguém informa, e um grupo lançado no sistema depois
 * de meses de rua aparecia começando ontem. A conta ficava refém do campo menos
 * confiável do cadastro.
 *
 * Agora a leitura é direta: quantas parcelas foram pagas das que o plano tem.
 * É o que a loja pergunta, e não depende de nenhuma data estar certa.
 */
export default function ParcelasDoPlano({
  saldoPoupanca,
  valorParcela,
  duracaoMeses,
  recebidoEmPagamentos,
}: {
  saldoPoupanca: number;
  valorParcela: number;
  duracaoMeses: number;
  /**
   * Quanto a cota recebeu de verdade, somando Asaas e baixas da loja.
   *
   * Quando vem, manda no lugar do saldo. O saldo é escrito por caminhos que nem
   * sempre deixam lançamento — aporte de quitação, carga antiga, correção feita
   * direto no banco — então ele conta a conta e não os pagamentos.
   */
  recebidoEmPagamentos?: number | null;
}) {
  if (!valorParcela || !duracaoMeses) return null;

  const base = recebidoEmPagamentos != null ? recebidoEmPagamentos : saldoPoupanca;
  const pagas = parcelasPagas(base, valorParcela, duracaoMeses);
  const largura = `${(Math.max(0, pagas) / duracaoMeses) * 100}%`;

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-2 w-20 shrink-0 overflow-hidden rounded-full bg-[#DFD9CE] sm:w-28"
        role="img"
        aria-label={`${pagas} de ${duracaoMeses} parcelas pagas`}
        title={`${pagas} de ${duracaoMeses} parcelas pagas`}
      >
        <span className="h-full bg-[#0B1E14]" style={{ width: largura }} />
      </div>

      <span className="whitespace-nowrap font-mono text-[10px] text-stone-500">
        <strong className="text-[#0B1E14]">
          {pagas}/{duracaoMeses}
        </strong>
        {pagas >= duracaoMeses && <span className="text-[#0B1E14]"> · quitada</span>}
      </span>
    </div>
  );
}
