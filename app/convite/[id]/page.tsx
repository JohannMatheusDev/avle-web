'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import gsap from 'gsap';
import { apiFetch } from '../../lib/api';
import TelaCarregamento from '../../dashboard/components/TelaCarregamento';
import EntradaPorCodigo from '../../components/EntradaPorCodigo';
import TextoDosTermos from '../../components/TextoDosTermos';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

export default function CadastroConvite() {
  const router = useRouter();
  const params = useParams();
  const slugDaLoja = decodeURIComponent(params.id as string);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const [lojaNome, setLojaNome] = useState<string>('Carregando...');
  const [lojaIdNum, setLojaIdNum] = useState<number | null>(null);
  const [logoDaLoja, setLogoDaLoja] = useState<string | null>(null);
  const [lojaValida, setLojaValida] = useState<boolean>(true);

  // A abertura da marca, a mesma da entrada pelo site. O convite e por onde a
  // maioria das clientes conhece a AVLE, entao era justamente a porta que
  // estava entrando sem ela.
  //
  // Comeca em null, e nao em false, porque a resposta mora no sessionStorage e
  // ele so existe no navegador: chutar false renderizaria o formulario no
  // servidor e trocaria pelo video depois, com um piscar feio.
  const [mostrandoIntro, setMostrandoIntro] = useState<boolean | null>(null);

  // Enquanto a loja do link nao chegou. Vale a pena existir separado de
  // lojaValida: sem isso a pagina abria o formulario inteiro com "Carregando..."
  // no lugar do nome da loja, e dava para comecar a preencher antes de o id da
  // loja existir - cadastro enviado ali ficava sem loja.
  const [carregandoLoja, setCarregandoLoja] = useState(true);


  // Quem chega pelo link da loja quase sempre ainda não tem conta: o convite
  // abre no cadastro, e quem já tem troca para entrar.
  const [aba, setAba] = useState<'cadastrar' | 'entrar'>('cadastrar');

  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [modalTermosAberto, setModalTermosAberto] = useState(false);


  useEffect(() => {
    // Mesma chave da home: quem ja viu a abertura nesta visita nao ve de novo
    // ao trocar de tela.
    setMostrandoIntro(sessionStorage.getItem('@avle:splash-visualizado') !== 'true');
  }, []);

  const encerrarIntro = () => {
    sessionStorage.setItem('@avle:splash-visualizado', 'true');
    setMostrandoIntro(false);
  };

  // NOVIDADE: A busca agora compara o NOME do link com a lista de lojas!
  useEffect(() => {
    if (!slugDaLoja) return;

    // Extrai o ID numérico que está no começo do parâmetro (Ex: "2-dona-kika" vira "2")
    const idExtraido = slugDaLoja.split('-')[0];

    if (!idExtraido || isNaN(Number(idExtraido))) {
      setLojaValida(false);
      return;
    }

    // Busca diretamente pelo ID oficial da loja no Java
    apiFetch(`${API_URL}/api/lojas/${idExtraido}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setLojaNome(data.nomeComercial || data.nome || 'Loja parceira');
        setLojaIdNum(data.id);
        setLogoDaLoja(data.logo || null);
        
        // Salva com segurança o ID correto
        sessionStorage.setItem('@avle:convite_loja_id', data.id.toString());
        sessionStorage.setItem('@avle:abrir_cadastro', 'true');
      })
      .catch(() => {
        setLojaValida(false);
      })
      // Roda em paralelo com o video de abertura, e nao depois dele: assim os
      // segundos da marca cobrem a espera da API em vez de somar com ela.
      .finally(() => {
        setCarregandoLoja(false);
      });
  }, [slugDaLoja]);

  useEffect(() => {
    apiFetch(`${API_URL}/api/health`, { method: 'GET' }).catch(() => {});
    const intervaloPing = setInterval(() => {
      apiFetch(`${API_URL}/api/health`, { method: 'GET' }).catch(() => {});
    }, 120000);
    return () => clearInterval(intervaloPing);
  }, []);

  useEffect(() => {
    if (!lojaValida) return;
    // Animar por tras do video gastaria a entrada do cartao onde ninguem ve.
    if (mostrandoIntro !== false) return;
    if (carregandoLoja) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      [path1Ref.current, path2Ref.current].forEach((path) => {
        if (path) {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
          tl.to(path, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' }, 0.2);
        }
      });

      if (glowRef.current) {
        tl.fromTo(
          glowRef.current,
          { scale: 0.3, opacity: 0 },
          { scale: 1, opacity: 0.12, duration: 1.8 },
          0
        );
      }

      if (cardRef.current) {
        tl.fromTo(
          cardRef.current,
          { opacity: 0, y: 40, rotateX: 8 },
          { opacity: 1, y: 0, rotateX: 0, duration: 1 },
          0.5
        );
      }

      gsap.to('.gsap-leaf-particle', {
        y: '-=20',
        rotation: '+=25',
        duration: 'random(3.5, 5.5)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: { amount: 2, from: 'random' },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [lojaValida, mostrandoIntro, carregandoLoja]);


  // Antes de o navegador dizer se a abertura ja foi vista, so o fundo. E um
  // quadro, e nao uma espera: sem ele o formulario apareceria por um instante
  // para ser coberto pelo video logo em seguida.
  if (mostrandoIntro === null) {
    return <div className="min-h-screen fundo-painel" />;
  }

  if (mostrandoIntro) {
    // Com o pular ligado, ao contrario da home. Aqui a pessoa veio de um link
    // para se cadastrar, e prender dez segundos de video na frente de quem tem
    // pressa custa cadastro.
    return <TelaCarregamento onFinalizado={encerrarIntro} permitirPular />;
  }

  // A loja do link ainda nao chegou. Aparece quando a API acorda devagar, que e
  // exatamente quando a pessoa precisa saber que a pagina esta viva.
  if (carregandoLoja) {
    return (
      <div className="min-h-screen fundo-painel flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#0B1E14] rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse">
            <span className="text-[#F5F2EB] font-black text-2xl">AV</span>
          </div>
          <p className="text-sm font-bold text-[#0B1E14]">Preparando seu convite</p>
          <p className="text-xs text-stone-500 mt-1">Isso leva alguns segundos no primeiro acesso.</p>
        </div>
      </div>
    );
  }

  if (!lojaValida) {
    return (
      <div className="min-h-screen fundo-painel flex items-center justify-center p-4">
        <div className="cartao-avle p-8 max-w-md w-full text-center">
           <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <span className="text-rose-600 font-bold text-2xl">!</span>
           </div>
           <h2 className="text-xl font-bold text-rose-700 mb-2">Convite inválido</h2>
           <p className="text-sm text-stone-500">A loja que você está tentando acessar não existe, ou o link expirou.</p>
           <button onClick={() => router.push('/')} className="mt-6 px-6 py-3 bg-[#0B1E14] text-white font-bold rounded-full text-xs uppercase tracking-wider cursor-pointer hover:bg-opacity-90">Ir para o início</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen fundo-painel flex flex-col justify-center items-center p-4 text-[#0B1E14] relative select-none overflow-hidden transition-all duration-500"
    >
      <div ref={glowRef} className="absolute w-[550px] h-[550px] bg-[#BD6B42] rounded-full blur-[140px] pointer-events-none -z-10" />

      <svg className="absolute inset-0 w-full h-full pointer-events-none -z-10 opacity-20" viewBox="0 0 1000 1000" fill="none">
        <path ref={path1Ref} d="M 100,900 C 300,700 350,400 500,500 C 650,600 700,300 900,100" stroke="#0B1E14" strokeWidth="2.5" strokeLinecap="round" />
        <path ref={path2Ref} d="M 200,950 C 400,800 450,550 500,500 C 550,450 750,200 850,50" stroke="#BD6B42" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="500" cy="500" r="230" stroke="#0B1E14" strokeWidth="0.8" strokeDasharray="6 6" />
      </svg>

      <div className="absolute inset-0 pointer-events-none -z-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="gsap-leaf-particle absolute w-2 h-2 rounded-full bg-[#BD6B42]/40 blur-[0.5px]" style={{ top: `${18 + i * 13}%`, left: `${10 + i * 14}%` }} />
        ))}
      </div>

      <div
        ref={cardRef}
        className="w-full max-w-md min-h-[660px] flex-col md:max-w-4xl md:min-h-[640px] md:flex-row cartao-avle overflow-hidden flex transition-all duration-500 ease-in-out hover:shadow-2xl"
      >
        <div className="w-full md:w-1/2 md:rounded-r-3xl bg-[#0B1E14] p-8 text-center flex flex-col items-center justify-center group transition-all duration-500">
          <div className="w-16 h-16 bg-[#F5F2EB] rounded-full flex items-center justify-center mb-3 shadow-md transition-transform duration-500 ease-out group-hover:rotate-12 group-hover:scale-105">
            <span className="text-[#0B1E14] font-black text-2xl">AV</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-wide">AVLE</h1>
          <p className="text-stone-300 text-sm mt-1">Seu clube de compras planejado</p>
          
          <div className="mt-8 pt-6 border-t border-stone-700/50 flex flex-col items-center">
             <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-2">Convite exclusivo</span>
             {/* A marca de quem convidou vem antes do nome: quem recebe o link
                 reconhece a loja pela imagem antes de ler qualquer coisa. */}
             {logoDaLoja && (
               <img
                 src={logoDaLoja}
                 alt={lojaNome}
                 className="mb-2 h-14 max-w-[9rem] object-contain"
               />
             )}
             <h3 className="text-[#BD6B42] text-sm font-bold tracking-wide">{lojaNome}</h3>
          </div>
        </div>

        <div className="w-full p-2 md:w-1/2 md:p-4 flex flex-col transition-all duration-500 overflow-y-auto max-h-[85vh]">
          <div className="flex gap-1 p-1 m-3 rounded-full bg-[#F3F3F0]">
            {([
              { id: 'cadastrar', rotulo: 'Criar conta' },
              { id: 'entrar', rotulo: 'Já tenho conta' },
            ] as const).map((opcao) => (
              <button
                key={opcao.id}
                type="button"
                onClick={() => setAba(opcao.id)}
                className={`flex-1 py-3 font-bold text-[11px] uppercase tracking-wider rounded-full transition-all duration-200 cursor-pointer ${
                  aba === opcao.id ? 'text-white bg-[#0B1E14] shadow-sm' : 'text-stone-500 hover:text-[#0B1E14]'
                }`}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>

          <div className="p-6 pt-3">
            <EntradaPorCodigo
              key={aba}
              lojaId={lojaIdNum}
              inicio={aba}
              aceitouTermos={aceitouTermos}
              aoMudarAceite={setAceitouTermos}
              aoVerTermos={() => setModalTermosAberto(true)}
              textoDosTermos="Regulamento Geral e a Política de Privacidade da AVLE, e o regulamento da loja"
            />
          </div>
        </div>
      </div>

      {/* Os termos da AVLE e o regulamento da loja juntos, porque a caixinha
          do cadastro aceita os dois. Antes o modal mostrava só o PDF da loja,
          e a cliente aceitava termos da AVLE que nunca tinha visto. */}
      {modalTermosAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60] animate-fadeIn text-left">
          <div className="bg-white border border-[#DFD9CE] sm:rounded-2xl rounded-t-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-stone-100">
              <div>
                <h3 className="text-base font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Termos e regulamento</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Loja: {lojaNome}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalTermosAberto(false)}
                aria-label="Fechar"
                className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer px-2"
              >
                X
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-stone-50/30">
              <div className="p-5 text-sm text-stone-600 leading-relaxed">
                <p className="text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-3">Regulamento Geral e Política de Privacidade da AVLE</p>
                <TextoDosTermos />
              </div>
              {lojaIdNum && (
                <div className="border-t border-stone-100">
                  <p className="px-5 pt-4 text-[10px] uppercase tracking-wider font-bold text-stone-500">Regulamento da loja</p>
                  <iframe
                    src={`${API_URL}/api/lojas/${lojaIdNum}/regras`}
                    className="w-full h-[50vh] border-none"
                    title="Regulamento da loja"
                  />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-stone-100 flex justify-end bg-stone-50 sm:rounded-b-2xl gap-3">
              <button
                type="button"
                onClick={() => setModalTermosAberto(false)}
                className="px-6 py-2.5 border border-stone-200 text-stone-600 font-bold rounded-xl text-[10px] uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-all shadow-sm"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTermosAberto(false);
                  setAceitouTermos(true);
                }}
                className="px-6 py-2.5 bg-[#0B1E14] text-white font-bold rounded-full text-[10px] uppercase tracking-wider cursor-pointer hover:bg-opacity-90 transition-all shadow-sm"
              >
                Li e aceito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
