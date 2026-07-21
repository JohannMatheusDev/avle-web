'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

export default function TelaCarregamento({ onFinalizado }: { onFinalizado: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoPronto, setVideoPronto] = useState(false);

  const transicaoSair = () => {
    if (!containerRef.current) {
      onFinalizado();
      return;
    }

    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 1.02,
      duration: 0.6,
      ease: 'power3.inOut',
      onComplete: () => {
        onFinalizado();
      }
    });
  };

  // 🔥 GARANTIA DE DOM: Força a mutação nativa no instante em que o elemento entra no HTML
  const setVideoRef = (element: HTMLVideoElement | null) => {
    if (element) {
      videoRef.current = element;
      element.muted = true;
      element.defaultMuted = true;
      element.volume = 0;
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Dispara o play e deixa os eventos nativos do vídeo controlarem a visibilidade
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setVideoPronto(true);
        })
        .catch((error) => {
          if (error.name === 'AbortError') return;
          console.warn("Autoplay bloqueado pelo navegador, tentando novamente:", error);
          
          // Segunda tentativa silenciosa sem fechar o componente
          video.play().then(() => setVideoPronto(true)).catch(() => {});
        });
    }
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-50 bg-[#0B1E14] flex items-center justify-center overflow-hidden select-none"
    >
      {/* Remove controles e botões nativos em navegadores Webkit */}
      <style dangerouslySetInnerHTML={{ __html: `
        video::-webkit-media-controls-start-playback-button,
        video::-webkit-media-controls {
          display: none !important;
          -webkit-appearance: none !important;
          opacity: 0 !important;
        }
      `}} />

      <video
        ref={setVideoRef}
        autoPlay
        muted
        playsInline
        controls={false}
        preload="auto"
        onPlay={() => setVideoPronto(true)}
        onLoadedData={() => setVideoPronto(true)}
        onEnded={transicaoSair}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          videoPronto ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <source src="/videos/avle-intro.mp4" type="video/mp4" />
        Seu navegador não suporta a reprodução de vídeos.
      </video>

      {/* Botão de Pular Intro */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          transicaoSair();
        }}
        className="absolute z-55 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white font-bold uppercase tracking-widest border border-white/10 transition-all backdrop-blur-sm cursor-pointer hover:scale-105 rounded-xl
          bottom-4 right-4 px-4 py-2 text-[10px] 
          sm:bottom-8 sm:right-8 sm:px-5 sm:py-2.5 sm:text-xs"
      >
        Pular Intro
      </button>
    </div>
  );
}