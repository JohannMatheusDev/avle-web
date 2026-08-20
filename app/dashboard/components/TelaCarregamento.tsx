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

export default function TelaCarregamento({ onFinalizado }: { onFinalizado: () => void }) {
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
    // O atalho so aparece depois de um instante para nao competir com o inicio
    // da animacao, mas existe para quem ja viu e nao quer rever.
    const atalho = setTimeout(() => setPodePular(true), 2_000);

    // Navegador que recusa a reproducao automatica deixaria a tela parada num
    // quadro congelado. Sem video para assistir, seguir direto e melhor.
    const video = videoRef.current;
    video?.play?.().catch(() => finalizarUmaVez());

    return () => {
      clearTimeout(seguranca);
      clearTimeout(atalho);
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

      {podePular && (
        <button
          type="button"
          onClick={finalizarUmaVez}
          className="absolute bottom-8 right-8 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white/90 transition-colors cursor-pointer px-4 py-2"
        >
          Pular
        </button>
      )}
    </div>
  );
}
