'use client';

import { useState } from 'react';
import DocumentoJuridico from '../documentos/DocumentoJuridico';
import { politicaDePrivacidade, regulamentoGeral } from '../documentos/preencher';

/**
 * Os termos que a cliente aceita: o Regulamento Geral e a Política de
 * Privacidade oficiais da AVLE, inteiros.
 *
 * Aparece em dois momentos: no cadastro, atrás da caixinha "li e aceito", e
 * nas boas-vindas de quem ainda não aceitou esta versão. Antes era um resumo
 * escrito para o app; o resumo dava a entender que era o termo, e o termo de
 * verdade nunca era mostrado. O aviso do cartão fica por cima porque é a
 * dúvida que mais aparece no balcão.
 */
export default function TextoDosTermos() {
  const [aberto, setAberto] = useState<'regulamento' | 'privacidade' | null>('regulamento');

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-500">
        A parcela é paga mês a mês, por Pix ou boleto: participar <strong>não consome o limite do seu cartão de crédito</strong>.
        As condições do seu grupo (valor, duração e a remuneração da AVLE) ficam no Termo de Adesão, que você aceita ao entrar no grupo.
      </p>

      {([
        { id: 'regulamento', titulo: 'Regulamento Geral', texto: regulamentoGeral },
        { id: 'privacidade', titulo: 'Política de Privacidade', texto: politicaDePrivacidade },
      ] as const).map((doc) => (
        <div key={doc.id} className="border border-[#DFD9CE] rounded-2xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setAberto(aberto === doc.id ? null : doc.id)}
            aria-expanded={aberto === doc.id}
            className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-stone-50"
          >
            <span className="text-xs font-bold text-[#0B1E14]">{doc.titulo}</span>
            <span className="text-[11px] text-stone-400 font-bold">{aberto === doc.id ? 'Fechar' : 'Ler'}</span>
          </button>
          {aberto === doc.id && (
            <div className="px-4 pb-4 max-h-[50vh] overflow-y-auto border-t border-stone-100 pt-3">
              <DocumentoJuridico texto={doc.texto()} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
