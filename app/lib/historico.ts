'use client';

import { useEffect, useRef } from 'react';

/**
 * Faz o botão voltar do navegador andar pelas seções do painel.
 *
 * Os painéis guardam em que aba a pessoa está dentro de `useState`, e o
 * navegador não sabe nada disso: a URL era sempre `/dashboard`. Quem abria a
 * ficha de um grupo e apertava voltar — ou deslizava da borda da tela, que é
 * como se volta no celular — saía do painel inteiro e caía no site, perdendo
 * a navegação que tinha feito. No celular isso acontecia o tempo todo, porque
 * o gesto de voltar é o mesmo que a pessoa usa para fechar qualquer coisa.
 *
 * Aqui cada mudança de seção vira uma entrada no histórico do navegador, e
 * voltar devolve a seção anterior em vez de sair. O estado vai dentro de
 * `history.state`, não na URL: a URL do painel não é compartilhável de
 * qualquer forma (depende da sessão em cookie), e mexer nela faria o Next
 * remontar a página a cada clique de aba.
 *
 * `estado` precisa ser um objeto simples, comparável por JSON — ids e
 * strings, nunca o objeto inteiro do grupo. `aplicar` recebe de volta
 * exatamente o que foi guardado e recoloca a tela naquele ponto.
 */
export function useHistoricoDoPainel<T extends Record<string, unknown>>(
  estado: T,
  aplicar: (estado: T) => void,
) {
  const chave = JSON.stringify(estado);

  // O `aplicar` é recriado a cada render do painel. Guardar em ref deixa o
  // ouvinte de popstate ser registrado uma vez só, sem perder o acesso à
  // versão mais nova das funções que ele chama.
  const aplicarRef = useRef(aplicar);
  aplicarRef.current = aplicar;

  const jaRegistrouOPrimeiro = useRef(false);

  useEffect(() => {
    const atual = window.history.state?.painel;
    // Igual ao que já está no histórico: é o próprio popstate acabando de ser
    // aplicado. Empurrar aqui criaria uma entrada duplicada e o segundo toque
    // em voltar pareceria não fazer nada.
    if (atual && JSON.stringify(atual) === chave) return;

    const novo = { ...window.history.state, painel: JSON.parse(chave) };

    // A primeira seção não é uma navegação: ela é onde a pessoa entrou. Se
    // virasse uma entrada nova, seria preciso apertar voltar duas vezes para
    // sair do painel.
    if (!jaRegistrouOPrimeiro.current) {
      jaRegistrouOPrimeiro.current = true;
      window.history.replaceState(novo, '');
      return;
    }

    window.history.pushState(novo, '');
  }, [chave]);

  useEffect(() => {
    const aoVoltar = (evento: PopStateEvent) => {
      const alvo = evento.state?.painel;
      // Entrada de fora do painel (o site, outra página): deixa o navegador
      // fazer o que ele faria sozinho.
      if (!alvo) return;
      aplicarRef.current(alvo);
    };

    window.addEventListener('popstate', aoVoltar);
    return () => window.removeEventListener('popstate', aoVoltar);
  }, []);
}
