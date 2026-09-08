'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

type Lancamento = {
  transacaoId: number;
  valor: number;
  origem: string;
  entrouNoSaldo: boolean;
  status: string;
  competencia: string | null;
  data: string | null;
  equivaleAParcelas: number | null;
};

type Extrato = {
  temCota: boolean;
  valorParcela?: number;
  saldo?: number;
  bolinhasVerdes?: number;
  recebidoPeloAsaas?: number;
  baixaManualDaLoja?: number;
  semExplicacao?: number;
  lancamentos?: Lancamento[];
};

const dinheiro = (v: number | undefined) =>
  `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

/**
 * De onde veio o dinheiro desta cota, lançamento por lançamento.
 *
 * A ficha mostrava só o saldo, que é o resultado e não a história. A loja não
 * conseguia distinguir quem pagou o boleto de quem apareceu no balcão com
 * dinheiro, nem lembrar quando cada baixa foi lançada — e é essa a pergunta
 * que ela faz quando uma cliente liga dizendo que já pagou.
 *
 * O bloco de conferência no topo existe porque o saldo pode não bater com a
 * soma dos lançamentos: parte dele veio de antes da plataforma, lançada direto
 * no banco. Quando sobra diferença, ela aparece nomeada em vez de ficar
 * escondida dentro do total.
 */
export default function ExtratoDePagamentos({
  usuarioId,
  grupoId,
}: {
  usuarioId: number;
  grupoId: number;
}) {
  const [extrato, setExtrato] = useState<Extrato | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    apiFetch(`/api/cobranca/extrato/${usuarioId}/grupo/${grupoId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => ativo && setExtrato(d))
      .catch(() => ativo && setExtrato(null))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [usuarioId, grupoId]);

  if (carregando) {
    return <p className="text-[10px] text-stone-400 italic">Carregando os pagamentos...</p>;
  }
  if (!extrato?.temCota) return null;

  const lancamentos = extrato.lancamentos ?? [];
  const semExplicacao = Number(extrato.semExplicacao || 0);

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
        De onde veio o dinheiro
      </p>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-stone-50 border border-[#DFD9CE] rounded-lg px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Pelo Asaas</p>
          <p className="font-mono text-xs font-bold text-[#0B1E14] mt-0.5">
            {dinheiro(extrato.recebidoPeloAsaas)}
          </p>
        </div>
        <div className="bg-stone-50 border border-[#DFD9CE] rounded-lg px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Baixa da loja</p>
          <p className="font-mono text-xs font-bold text-[#0B1E14] mt-0.5">
            {dinheiro(extrato.baixaManualDaLoja)}
          </p>
        </div>
        <div className="bg-stone-50 border border-[#DFD9CE] rounded-lg px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Saldo</p>
          <p className="font-mono text-xs font-bold text-[#0B1E14] mt-0.5">{dinheiro(extrato.saldo)}</p>
        </div>
      </div>

      {/* Só aparece quando não fecha. Diferença de um centavo já é sinal de
          alguma coisa, e esconder atrás do total é como o erro sobrevive. */}
      {semExplicacao !== 0 && (
        <div className="border-l-2 border-[#BD6B42] bg-[#BD6B42]/5 px-3 py-2 mb-3">
          <p className="text-[10px] text-[#BD6B42] font-bold">
            {dinheiro(Math.abs(semExplicacao))}{' '}
            {semExplicacao > 0 ? 'no saldo sem lançamento correspondente' : 'lançados que não entraram no saldo'}
          </p>
          <p className="text-[10px] text-stone-500 mt-0.5">
            {semExplicacao > 0
              ? 'Pode ser saldo anterior à plataforma, o que é normal, ou baixa lançada em duplicidade.'
              : 'Confira se uma baixa foi desfeita pela metade.'}
          </p>
        </div>
      )}

      {lancamentos.length === 0 ? (
        <p className="text-[10px] text-stone-400 italic">
          Nenhum pagamento registrado. O saldo, se houver, veio de antes da plataforma.
        </p>
      ) : (
        <ul className="divide-y divide-[#DFD9CE] border border-[#DFD9CE] rounded-lg overflow-hidden">
          {lancamentos.map((l) => (
            <li key={l.transacaoId} className="px-3 py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-[11px] font-bold ${l.entrouNoSaldo ? 'text-stone-700' : 'text-stone-400'}`}>
                  {l.origem}
                  {!l.entrouNoSaldo && ` · ${l.status.toLowerCase()}`}
                </p>
                <p className="text-[9px] text-stone-400 font-mono mt-0.5">
                  {l.data ? new Date(l.data).toLocaleDateString('pt-BR') : 'sem data'}
                  {l.competencia && ` · ${l.competencia}`}
                  {l.equivaleAParcelas != null && ` · ${l.equivaleAParcelas} parcela(s)`}
                </p>
              </div>
              <span
                className={`font-mono text-xs shrink-0 ${
                  l.entrouNoSaldo ? 'text-[#0B1E14] font-bold' : 'text-stone-400 line-through'
                }`}
              >
                {dinheiro(l.valor)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
