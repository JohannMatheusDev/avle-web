'use client';

import { useState } from 'react';
import { useAvisos } from '../../lib/avisos';
import ListaDeAvisos from './ListaDeAvisos';

/**
 * O INBOX do painel do admin, no mesmo ícone da árvore que a loja usa.
 *
 * Existe separado porque o painel da loja já tinha esse botão flutuante, com as
 * sorteadas aguardando crédito dentro, e ali os avisos entram como uma seção a
 * mais. O admin não tinha nada, então ganha o botão inteiro — e a árvore no
 * canto passa a significar a mesma coisa nos dois lugares.
 */
export default function PainelDeAvisosFlutuante() {
  const [aberto, setAberto] = useState(false);
  const { avisos, naoLidas, marcarTodas } = useAvisos();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {aberto && (
        <div className="mb-4 w-[min(24rem,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-[#0B1E14] p-4 text-white">
            <h3 className="text-xs font-bold uppercase tracking-wider">Avisos da AVLE</h3>
            <button
              onClick={() => setAberto(false)}
              className="cursor-pointer px-2 font-bold text-stone-400 hover:text-white"
            >
              X
            </button>
          </div>
          <div className="max-h-[400px] overflow-y-auto bg-stone-50/50 p-4">
            <ListaDeAvisos avisos={avisos} naoLidas={naoLidas} onMarcarTodas={marcarTodas} />
          </div>
        </div>
      )}

      <button
        onClick={() => setAberto(!aberto)}
        aria-label={naoLidas > 0 ? `${naoLidas} avisos não lidos` : 'Avisos'}
        className="group relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-[3px] border-[#BD6B42] bg-[#0B1E14] shadow-2xl transition-transform hover:scale-105"
      >
        <img
          src="/arvore-clara.png"
          alt="AVLE"
          className="w-9 opacity-90 transition-opacity group-hover:opacity-100"
        />
        {naoLidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white shadow-md">
            {naoLidas > 99 ? '99' : naoLidas}
          </span>
        )}
      </button>
    </div>
  );
}
