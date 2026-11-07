'use client';

/**
 * "Baixar planilha" com a escolha do formato: Excel (.xlsx) ou CSV. Abre um
 * menu curto embaixo do botão; o Excel vem primeiro porque é o que a loja
 * abre. O botão em si herda a aparência de onde está (className e children),
 * para caber tanto nos painéis quanto na Conta AVLE.
 */

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { FORMATOS, type Formato } from '../../lib/planilha';

export default function BotaoDePlanilha({
  aoEscolher, className, children = 'Baixar planilha', disabled, alinhar = 'direita',
}: {
  aoEscolher: (formato: Formato) => void | Promise<void>;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  /** De que lado do botão o menu se alinha. */
  alinhar?: 'direita' | 'esquerda';
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setAberto(false); botao.current?.focus(); }
    };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', tecla);
    // O foco vai para a primeira opção, para quem usa o teclado.
    caixa.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', tecla);
    };
  }, [aberto]);

  const escolher = (f: Formato) => {
    setAberto(false);
    void aoEscolher(f);
  };

  return (
    <div ref={caixa} className="relative inline-flex">
      <button ref={botao} type="button" className={className} disabled={disabled}
        aria-haspopup="menu" aria-expanded={aberto} aria-controls={aberto ? id : undefined}
        onClick={() => setAberto((a) => !a)}>
        {children}
      </button>
      {aberto && (
        <div id={id} role="menu" aria-label="Formato da planilha"
          className={`absolute top-full mt-2 z-30 w-64 rounded-2xl bg-white p-1 shadow-xl ring-1 ring-painel-borda text-left ${alinhar === 'direita' ? 'right-0' : 'left-0'}`}>
          {FORMATOS.map((f) => (
            <button key={f.formato} type="button" role="menuitem" onClick={() => escolher(f.formato)}
              className="block w-full rounded-xl px-3 py-2 text-left hover:bg-painel-papel focus:bg-painel-papel focus:outline-none cursor-pointer">
              <span className="block text-[13px] font-semibold text-painel-tinta">{f.rotulo}</span>
              <span className="block text-[11px] text-stone-500">{f.ajuda}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
