'use client';

import { useEffect, useState } from 'react';
import { EscolhaConsentimento, gravarConsentimento, lerConsentimento } from '../lib/consentimento';

export default function AvisoCookies() {
  // Comeca escondido e so aparece depois de montar: ler localStorage durante a
  // renderizacao do servidor quebraria a hidratacao, e piscar o banner para
  // quem ja respondeu seria pior que nao ter banner.
  const [visivel, setVisivel] = useState(false);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);

  useEffect(() => {
    if (lerConsentimento() === null) setVisivel(true);
  }, []);

  const responder = (escolha: EscolhaConsentimento) => {
    gravarConsentimento(escolha);
    setVisivel(false);
  };

  if (!visivel) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de privacidade e cookies"
      className="fixed bottom-0 left-0 right-0 z-[200] p-4 sm:p-6 animate-avle-subir"
    >
      <div className="max-w-3xl mx-auto bg-white border border-[#DFD9CE] rounded-2xl shadow-lg overflow-hidden">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#0B1E14]">
              Privacidade e armazenamento
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              A AVLE guarda no seu navegador apenas o necessário para manter você conectada e lembrar a loja
              parceira em que você entrou. Não usamos cookies de publicidade nem compartilhamos sua navegação
              com terceiros.
            </p>
          </div>

          {detalhesAbertos && (
            <div className="bg-stone-50 border border-dashed border-[#DFD9CE] rounded-xl p-4 space-y-3 text-[11px] text-stone-600 leading-relaxed">
              <div>
                <p className="font-bold text-[#0B1E14] uppercase tracking-wider text-[10px] mb-1">
                  Essencial · sempre ativo
                </p>
                <p>
                  Sessão de acesso e vínculo com a loja parceira. Sem esses dados você seria desconectada a cada
                  página, por isso eles não podem ser desligados enquanto você usa a plataforma. Saem do aparelho
                  quando você clica em Sair.
                </p>
              </div>
              <div>
                <p className="font-bold text-[#0B1E14] uppercase tracking-wider text-[10px] mb-1">
                  Opcional · depende da sua escolha
                </p>
                <p>
                  Medição de uso para melhorar a plataforma. <strong>No momento a AVLE não utiliza nenhum</strong>,
                  então recusar não muda nada para você hoje. A escolha fica registrada e vale para o caso de
                  passarmos a usar.
                </p>
              </div>
              <p className="pt-1 border-t border-[#DFD9CE]">
                Você pode mudar de ideia depois limpando os dados do site no seu navegador. Para pedir acesso ou
                exclusão dos seus dados, fale com a loja parceira em que você está cadastrada.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pt-1">
            <button
              type="button"
              onClick={() => setDetalhesAbertos(!detalhesAbertos)}
              className="text-[10px] font-bold uppercase tracking-wider text-stone-500 hover:text-[#0B1E14] hover:underline cursor-pointer text-left"
            >
              {detalhesAbertos ? 'Ocultar detalhes' : 'Ver o que é guardado'}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => responder('rejeitado')}
                className="flex-1 sm:flex-none px-5 py-2.5 border border-stone-200 rounded-xl text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Rejeitar opcionais
              </button>
              <button
                type="button"
                onClick={() => responder('aceito')}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-[#0B1E14] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-opacity-90 transition-all shadow-sm cursor-pointer"
              >
                Aceitar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
