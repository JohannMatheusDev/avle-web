'use client';

import { useEffect } from 'react';

export default function TelaCarregamento({ onFinalizado }: { onFinalizado: () => void }) {
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinalizado();
    }, 6000); 
    
    return () => clearTimeout(timer);
  }, [onFinalizado]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0B1E14] flex items-center justify-center overflow-hidden">
      
      <video 
        autoPlay 
        muted 
        playsInline 
        onEnded={onFinalizado} 
        className="w-full h-full object-cover opacity-80"
      >
        <source src="/videos/intro.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 className="text-white text-5xl md:text-7xl font-bold tracking-widest font-serif opacity-80 animate-pulse">
          AVLE
        </h1>
      </div>
      
    </div>
  );
}