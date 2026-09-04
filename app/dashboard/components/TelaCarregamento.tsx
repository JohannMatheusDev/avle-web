'use client';

import { useEffect, useRef, useState } from 'react';

// O desfecho da animacao - a arvore formada com o logotipo - acontece por volta
// dos 9s. Um corte fixo antes disso derruba a marca justamente no quadro que
// ela existe para mostrar, entao quem manda no fim e o proprio video.
const DURACAO_ESTIMADA_MS = 10_000;

// Rede de seguranca, nunca o cronometro principal: cobre o caso de o navegador
// nao disparar onEnded (aba em segundo plano, decodificacao travada) para a
// pessoa nao ficar presa na abertura.
const LIMITE_SEGURANCA_MS = DURACAO_ESTIMADA_MS + 4_000;

// Tempo suficiente para a marca aparecer antes de oferecer a saida.
const ESPERA_DO_PULAR_MS = 2_500;

export default function TelaCarregamento({
  onFinalizado,
  permitirPular = false,
}: {
  onFinalizado: () => void;
  /**
   * Mostra um "pular" discreto depois de alguns segundos.
   *
   * Desligado por padrao para a entrada pelo site, onde a abertura da marca e
   * o proposito da tela. Ligado no convite, que e um link de cadastro: ali os
   * dez segundos disputam com a paciencia de quem veio se inscrever.
   */
  permitirPular?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const jaFinalizou = useRef(false);
  const [podePular, setPodePular] = useState(false);

  // onEnded, falha de carregamento e o limite de seguranca podem chegar juntos;
  // sem esta trava a navegacao seria disparada mais de uma vez.
  const finalizarUmaVez = () => {
    if (jaFinalizou.current) return;
    jaFinalizou.current = true;
    onFinalizado();
  };

  useEffect(() => {
    const seguranca = setTimeout(finalizarUmaVez, LIMITE_SEGURANCA_MS);

    // Nao aparece de cara: um botao de pular no primeiro quadro convida a
    // pular sempre, e a abertura deixaria de ser vista por qualquer pessoa.
    const liberarPular = setTimeout(() => setPodePular(true), ESPERA_DO_PULAR_MS);

    // Navegador que recusa a reproducao automatica deixaria a tela parada num
    // quadro congelado. Sem video para assistir, seguir direto e melhor.
    const video = videoRef.current;
    video?.play?.().catch(() => finalizarUmaVez());

    return () => {
      clearTimeout(seguranca);
      clearTimeout(liberarPular);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      // Mesma cor de fundo do video. Com object-contain sobram faixas nas telas
      // de proporcao diferente, e igualar a cor faz a borda desaparecer.
      style={{ backgroundColor: '#132920' }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finalizarUmaVez}
        // Falha de rede ou arquivo ausente nao pode segurar a entrada no sistema.
        onError={finalizarUmaVez}
        // contain, e nao cover: a arvore fica centralizada e cover cortaria os
        // galhos nas laterais em tela de celular.
        className="w-full h-full object-contain"
      >
        <source src="/videos/intro.mp4" type="video/mp4" />
      </video>

      {permitirPular && podePular && (
        <button
          type="button"
          onClick={finalizarUmaVez}
          className="absolute bottom-8 right-6 px-4 py-2 rounded-full border border-white/25 text-white/70 text-[10px] font-bold uppercase tracking-wider hover:text-white hover:border-white/60 transition-colors cursor-pointer"
        >
          Pular
        </button>
      )}
    </div>
  );
}
