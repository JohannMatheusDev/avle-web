'use client';

import { useEffect, useRef, useState } from 'react';

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
/**
 * O refresh também volta para onde a pessoa estava. O `history.state`
 * sobrevive ao recarregar a página, mas o painel nascia no Início e gravava
 * o Início por cima: quem estava em Clientes, ou na ficha de um grupo, e
 * atualizava a página perdia o lugar.
 *
 * Agora o que estava salvo é reaplicado ao montar. A seção volta na hora; o
 * que depende de lista vinda do servidor (a ficha do grupo, a loja aberta, o
 * plano da cliente) volta quando `pronto` ficar verdadeiro - antes disso não
 * há de onde tirar o grupo pelo id. Enquanto espera, nada é gravado no
 * histórico, para um segundo refresh não perder o lugar de novo.
 */
export function useHistoricoDoPainel<T extends Record<string, unknown>>(
  estado: T,
  aplicar: (estado: T) => void,
  pronto = true,
) {
  const chave = JSON.stringify(estado);

  // O `aplicar` é recriado a cada render do painel. Guardar em ref deixa o
  // ouvinte de popstate ser registrado uma vez só, sem perder o acesso à
  // versão mais nova das funções que ele chama.
  const aplicarRef = useRef(aplicar);
  aplicarRef.current = aplicar;

  const jaRegistrouOPrimeiro = useRef(false);

  // O que estava na tela antes do refresh, lido uma vez, antes de qualquer
  // escrita no histórico.
  const [salvo] = useState<T | null>(() =>
    typeof window !== 'undefined' ? ((window.history.state?.painel as T | undefined) ?? null) : null);
  const restaurado = useRef(false);

  useEffect(() => {
    if (restaurado.current || !salvo) return;
    aplicarRef.current(salvo);
    if (pronto) {
      restaurado.current = true;
      return;
    }
    // Se a lista nunca chegar (servidor fora do ar), o histórico não pode
    // ficar parado para sempre: depois de alguns segundos, segue sem ela.
    const desiste = setTimeout(() => { restaurado.current = true; }, 8000);
    return () => clearTimeout(desiste);
  }, [pronto, salvo]);

  useEffect(() => {
    const atual = window.history.state?.painel;
    // Igual ao que já está no histórico: é o próprio popstate acabando de ser
    // aplicado. Empurrar aqui criaria uma entrada duplicada e o segundo toque
    // em voltar pareceria não fazer nada.
    if (atual && JSON.stringify(atual) === chave) {
      jaRegistrouOPrimeiro.current = true;
      return;
    }

    // Ainda a caminho do que estava salvo: gravar agora trocaria o lugar
    // salvo pela tela intermediária.
    if (salvo && !restaurado.current) return;

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
  }, [chave, salvo]);

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
