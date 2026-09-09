'use client';

import type { Aviso } from '../../lib/avisos';

/**
 * A lista de entradas de dinheiro, sem moldura própria.
 *
 * Não traz botão nem painel: quem a usa já tem o seu. No painel da loja ela
 * entra dentro do INBOX da árvore, junto das sorteadas aguardando crédito —
 * concentrar tudo num lugar só foi decisão de quem usa, e dois ícones piscando
 * em cantos diferentes da tela era exatamente o que incomodava.
 */
export default function ListaDeAvisos({
  avisos,
  naoLidas,
  onMarcarTodas,
}: {
  avisos: Aviso[];
  naoLidas: number;
  onMarcarTodas: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-1 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Entradas recentes
        </p>
        {naoLidas > 0 && (
          <button
            type="button"
            onClick={onMarcarTodas}
            className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-[#BD6B42] hover:underline"
          >
            Marcar lidas
          </button>
        )}
      </div>

      {avisos.length === 0 ? (
        <p className="px-1 py-4 text-xs italic text-stone-400">
          Nenhuma entrada por enquanto. Os pagamentos aparecem aqui assim que caem.
        </p>
      ) : (
        <ul className="divide-y divide-[#DFD9CE] overflow-hidden rounded-xl border border-[#DFD9CE] bg-white">
          {avisos.map((a) => (
            <li key={a.id} className={`px-3 py-2.5 ${a.lida ? '' : 'bg-[#BD6B42]/5'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#0B1E14]">
                    {a.titulo}
                    <span className="ml-1.5 font-mono text-[9px] font-normal uppercase tracking-wider text-stone-400">
                      {a.tipo === 'ENTRADA_ASAAS' ? 'Asaas' : 'pela loja'}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-stone-600">{a.mensagem}</p>
                  {a.quando && (
                    <p className="mt-1 font-mono text-[9px] text-stone-400">{a.quando}</p>
                  )}
                </div>
                {!a.lida && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#BD6B42]" />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
