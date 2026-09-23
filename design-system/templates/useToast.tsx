'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Toast, ToastStack } from '../components/feedback/Toast';

type AvisoAtual = { mensagem: ReactNode; tom: 'positive' | 'negative'; chave: number };

/**
 * Aviso passageiro no rodapé, que some sozinho em 2,8s.
 *
 * Devolve a função que mostra o aviso e o nó que precisa ir para a tela. O
 * original guardava o cronômetro em `window.__avToast`, compartilhado por
 * todas as telas; dois painéis abertos apagavam o aviso um do outro.
 */
export function useToast(): [(mensagem: ReactNode, tom?: 'positive' | 'negative') => void, ReactNode] {
  const [aviso, setAviso] = useState<AvisoAtual | null>(null);
  const cronometro = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const mostrar = useCallback((mensagem: ReactNode, tom: 'positive' | 'negative' = 'positive') => {
    setAviso({ mensagem, tom, chave: Date.now() });
    clearTimeout(cronometro.current);
    cronometro.current = setTimeout(() => setAviso(null), 2800);
  }, []);

  useEffect(() => () => clearTimeout(cronometro.current), []);

  const no = aviso ? <ToastStack><Toast key={aviso.chave} tone={aviso.tom}>{aviso.mensagem}</Toast></ToastStack> : null;
  return [mostrar, no];
}
