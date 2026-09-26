'use client';

/**
 * Passo a passo guiado dos painéis: escurece a tela, recorta em volta do
 * elemento de que o passo fala e mostra um cartão explicando o que ele faz.
 *
 * Cada passo aponta para um elemento marcado com `data-tour="nome"`. O mesmo
 * nome pode existir em mais de um lugar - a barra do topo no computador e a
 * do rodapé no celular -, e o tour usa o que estiver visível. Passo cujo
 * elemento não existe na tela (a cliente sem parcela não tem botão de pagar)
 * é pulado, em vez de apontar para o nada.
 *
 * Abre sozinho só uma vez por pessoa, e só quando não há outra tela por cima:
 * os termos de boas-vindas, o Pix obrigatório da entrada no grupo e a
 * abertura em vídeo vêm antes. Um tour por cima deles tiraria da pessoa a
 * única ação que ela tem naquele momento.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export type PassoDoTour = {
  /** Valor do `data-tour` do elemento. Sem alvo, o cartão aparece no centro. */
  alvo?: string;
  titulo: string;
  texto: React.ReactNode;
  /** Seção do painel que precisa estar aberta para o alvo existir. */
  secao?: string;
};

type Retangulo = { top: number; left: number; width: number; height: number };

const FOLGA = 8;
const CARTAO_LARGURA = 340;

/** Lê e grava sem quebrar: o armazenamento pode estar bloqueado. */
function jaViu(chave: string) {
  try { return localStorage.getItem(chave) === 'visto'; } catch { return false; }
}
function marcarVisto(chave: string) {
  try { localStorage.setItem(chave, 'visto'); } catch { /* segue sem lembrar */ }
}

/** O elemento marcado que está de fato na tela, com tamanho. */
function acharAlvo(nome: string): HTMLElement | null {
  const candidatos = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${nome}"]`));
  return candidatos.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  }) ?? null;
}

/**
 * Se há outra tela por cima do painel. Os modais do sistema cobrem a janela
 * inteira com `fixed inset-0`; os do próprio tour ficam de fora.
 */
function temSobreposicao() {
  return Array.from(document.querySelectorAll<HTMLElement>('.fixed.inset-0'))
    .some((el) => !el.closest('[data-tour-camada]') && el.getBoundingClientRect().height > 0);
}

export function useTour({
  chave,
  passos,
  aoIrParaSecao,
  pronto = true,
}: {
  /** Onde fica gravado que a pessoa já viu, por painel e por pessoa. */
  chave: string;
  passos: PassoDoTour[];
  aoIrParaSecao?: (secao: string) => void;
  /** Falso enquanto o painel ainda carrega o que os passos apontam. */
  pronto?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [indice, setIndice] = useState(0);

  // Abre sozinho na primeira visita, esperando o painel ficar livre.
  useEffect(() => {
    if (!pronto || jaViu(chave)) return;
    const vigia = window.setInterval(() => {
      if (!temSobreposicao()) {
        window.clearInterval(vigia);
        setIndice(0);
        setAberto(true);
      }
    }, 900);
    return () => window.clearInterval(vigia);
  }, [pronto, chave]);

  const abrir = useCallback(() => { setIndice(0); setAberto(true); }, []);
  const fechar = useCallback(() => {
    marcarVisto(chave);
    setAberto(false);
  }, [chave]);

  return {
    abrir,
    elemento: aberto ? (
      <CamadaDoTour
        passos={passos}
        indice={indice}
        setIndice={setIndice}
        aoFechar={fechar}
        aoIrParaSecao={aoIrParaSecao}
      />
    ) : null,
  };
}

function CamadaDoTour({
  passos,
  indice,
  setIndice,
  aoFechar,
  aoIrParaSecao,
}: {
  passos: PassoDoTour[];
  indice: number;
  setIndice: (i: number) => void;
  aoFechar: () => void;
  aoIrParaSecao?: (secao: string) => void;
}) {
  const passo = passos[indice];
  // A medida guarda de qual passo ela é: enquanto o passo atual não foi
  // medido, o cartão espera, em vez de aparecer apontando para o anterior.
  const [medida, setMedida] = useState<{ indice: number; alvo: Retangulo | null } | null>(null);
  const procurando = medida?.indice !== indice;
  const alvo = procurando ? null : medida!.alvo;
  const direcao = useRef<1 | -1>(1);
  const botaoPrincipal = useRef<HTMLButtonElement>(null);

  // O painel recria a lista de passos e a funcao de trocar de secao a cada
  // render. Se os efeitos abaixo dependessem delas, cada medida re-renderiza o
  // painel, que refaz o efeito, que rola a tela e mede de novo - em laco. Eles
  // leem pela referencia e so reagem quando o passo muda.
  //
  // A atualizacao e um useLayoutEffect, e vem antes do que procura o alvo:
  // efeitos do mesmo tipo rodam na ordem em que foram escritos, e um useEffect
  // comum rodaria depois - a busca do passo 7 ainda veria o passo 6.
  const passoRef = useRef(passo);
  const irParaSecaoRef = useRef(aoIrParaSecao);
  useLayoutEffect(() => {
    passoRef.current = passo;
    irParaSecaoRef.current = aoIrParaSecao;
  });

  const ultimo = indice === passos.length - 1;

  const irPara = useCallback((novo: number, sentido: 1 | -1) => {
    direcao.current = sentido;
    if (novo < 0) return;
    if (novo >= passos.length) { aoFechar(); return; }
    setIndice(novo);
  }, [passos.length, aoFechar, setIndice]);

  // Abre a seção do passo, espera ela desenhar e localiza o alvo.
  useLayoutEffect(() => {
    const passo = passoRef.current;
    if (!passo) return;
    if (passo.secao) irParaSecaoRef.current?.(passo.secao);

    let tentativas = 0;
    let cancelado = false;

    if (!passo.alvo) {
      const quadro = window.requestAnimationFrame(() => {
        if (!cancelado) setMedida({ indice, alvo: null });
      });
      return () => { cancelado = true; window.cancelAnimationFrame(quadro); };
    }

    const procurar = () => {
      if (cancelado) return;
      const el = acharAlvo(passo.alvo!);
      if (!el) {
        // A seção pode levar alguns quadros para montar. Passado o tempo, o
        // passo não tem o que mostrar para esta pessoa e segue adiante.
        if (++tentativas < 12) { window.setTimeout(procurar, 80); return; }
        irPara(indice + direcao.current, direcao.current);
        return;
      }
      const noCelular = window.innerWidth < 640;
      const r0 = el.getBoundingClientRect();
      const fixo = getComputedStyle(el).position === 'fixed' || !!el.closest('nav.fixed, .fixed');
      if (!fixo) {
        // No celular o cartão ocupa a metade de baixo: o alvo sobe para a de cima.
        const destino = noCelular
          ? window.scrollY + r0.top - 96
          : window.scrollY + r0.top - Math.max(96, (window.innerHeight - r0.height) / 2);
        window.scrollTo({ top: Math.max(0, destino), behavior: 'smooth' });
      }
      window.setTimeout(() => {
        if (cancelado) return;
        const r = el.getBoundingClientRect();
        setMedida({ indice, alvo: { top: r.top, left: r.left, width: r.width, height: r.height } });
      }, fixo ? 0 : 380);
    };
    procurar();
    return () => { cancelado = true; };
  }, [indice, irPara]);

  // Acompanha rolagem e mudança de tamanho sem perder o recorte.
  const nomeDoAlvo = passo?.alvo;
  useEffect(() => {
    if (!nomeDoAlvo) return;
    const medir = () => {
      const el = acharAlvo(nomeDoAlvo);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setMedida({ indice, alvo: { top: r.top, left: r.left, width: r.width, height: r.height } });
    };
    window.addEventListener('resize', medir);
    window.addEventListener('scroll', medir, { passive: true });
    return () => {
      window.removeEventListener('resize', medir);
      window.removeEventListener('scroll', medir);
    };
  }, [nomeDoAlvo, indice]);

  // Teclado: setas andam, Esc encerra.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar();
      if (e.key === 'ArrowRight') irPara(indice + 1, 1);
      if (e.key === 'ArrowLeft') irPara(indice - 1, -1);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [indice, irPara, aoFechar]);

  useEffect(() => {
    if (!procurando) botaoPrincipal.current?.focus({ preventScroll: true });
  }, [procurando, indice]);

  if (!passo) return null;

  const noCelular = typeof window !== 'undefined' && window.innerWidth < 640;
  const recorte = alvo && {
    top: alvo.top - FOLGA,
    left: alvo.left - FOLGA,
    width: alvo.width + FOLGA * 2,
    height: alvo.height + FOLGA * 2,
  };

  // Onde o cartão fica: embaixo do alvo quando cabe, senão em cima. No
  // celular ele vira uma folha presa na borda oposta à do alvo.
  let posicaoDoCartao: React.CSSProperties;
  if (!recorte) {
    posicaoDoCartao = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  } else if (noCelular) {
    const alvoEmBaixo = recorte.top + recorte.height / 2 > window.innerHeight * 0.55;
    posicaoDoCartao = alvoEmBaixo ? { top: 16, left: 12, right: 12 } : { bottom: 16, left: 12, right: 12 };
  } else {
    const espacoAbaixo = window.innerHeight - (recorte.top + recorte.height);
    const esquerda = Math.min(
      Math.max(16, recorte.left + recorte.width / 2 - CARTAO_LARGURA / 2),
      window.innerWidth - CARTAO_LARGURA - 16,
    );
    posicaoDoCartao = espacoAbaixo > 260
      ? { top: recorte.top + recorte.height + 14, left: esquerda }
      : { top: Math.max(16, recorte.top - 14), left: esquerda, transform: 'translateY(-100%)' };
  }

  const semAlvo = !recorte;

  return (
    <div data-tour-camada className="fixed inset-0 z-[300]" role="dialog" aria-modal="true" aria-labelledby="tour-titulo">
      {/* O escuro. Com alvo, é a sombra enorme do recorte; sem alvo, um véu. */}
      {recorte ? (
        <div
          aria-hidden="true"
          className="absolute rounded-[22px] ring-2 ring-painel-acento/80 transition-all duration-300 ease-out motion-reduce:transition-none"
          style={{ ...recorte, boxShadow: '0 0 0 9999px rgba(11, 30, 20, 0.66)' }}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-painel-tinta/70 backdrop-blur-[2px]" />
      )}

      {!procurando && (
        <div
          key={indice}
          className={`absolute ${noCelular ? '' : 'w-[340px]'} bg-white rounded-[24px] p-5 shadow-[0_30px_60px_-20px_rgba(11,30,20,0.6)] animate-avle-subir`}
          style={posicaoDoCartao}
        >
          {semAlvo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/arvore-escura.png" alt="" className="w-20 h-auto mb-3 opacity-90" />
          )}

          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[11px] font-semibold text-painel-acento">
              Passo {indice + 1} de {passos.length}
            </span>
            <button
              type="button"
              onClick={aoFechar}
              className="text-[11px] text-stone-400 hover:text-painel-tinta transition-colors cursor-pointer"
            >
              Pular tour
            </button>
          </div>

          <h2 id="tour-titulo" style={{ fontWeight: 600 }} className="text-[18px] text-painel-tinta leading-snug">
            {passo.titulo}
          </h2>
          <div className="text-[13px] text-stone-500 leading-relaxed mt-1.5">{passo.texto}</div>

          <div className="h-1 rounded-full bg-painel-papel mt-4 overflow-hidden" aria-hidden="true">
            <div
              className="h-full bg-painel-acento rounded-full transition-all duration-300"
              style={{ width: `${((indice + 1) / passos.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 mt-4">
            <button
              type="button"
              onClick={() => irPara(indice - 1, -1)}
              disabled={indice === 0}
              className="h-10 px-4 rounded-full text-[12px] font-semibold text-painel-tinta border border-painel-borda hover:border-painel-tinta/30 disabled:opacity-0 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              Voltar
            </button>
            <button
              ref={botaoPrincipal}
              type="button"
              onClick={() => irPara(indice + 1, 1)}
              className="h-10 px-5 rounded-full text-[12px] font-semibold bg-painel-acento text-white shadow-[0_10px_20px_-12px_rgba(189,107,66,0.9)] hover:brightness-95 transition-all cursor-pointer"
            >
              {indice === 0 ? 'Começar' : ultimo ? 'Entendi, vamos lá' : 'Próximo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
