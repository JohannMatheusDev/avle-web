'use client';

import { useState } from 'react';
import DocumentoJuridico from './DocumentoJuridico';
import { contratoDoLojista, formatarPercentual, politicaDeRepasses } from './preencher';

/** O que o servidor devolve do contrato de uma loja (ContratoDoLojista.dados). */
export type DadosDoContrato = {
  lojaId: number;
  nomeComercial: string;
  razaoSocial: string;
  cnpj: string;
  enderecoSede?: string | null;
  emailContato?: string | null;
  telefoneContato?: string | null;
  percentualAvle: number;
  versao: string;
  exigido: boolean;
  aceito: boolean;
  aceitoEm?: string | null;
  aceitoPor?: string | null;
  aceitoIp?: string | null;
};

/**
 * O contrato AVLE x Lojista com o Anexo II, preenchidos com os dados da loja.
 *
 * Usado no convite (antes do aceite), na página da loja e na do admin. A
 * versão vem do servidor: a loja que aceitou a 1.1 continua vendo a 1.1 mesmo
 * depois de existir uma versão nova.
 */
export default function ContratoDoLojista({ dados, alturaMaxima }: { dados: DadosDoContrato; alturaMaxima?: string }) {
  const [aba, setAba] = useState<'contrato' | 'anexo'>('contrato');
  const contrato = contratoDoLojista(
    { razaoSocial: dados.razaoSocial, cnpj: dados.cnpj, enderecoSede: dados.enderecoSede, percentualAvle: Number(dados.percentualAvle) },
    dados.versao,
  );
  const anexo = politicaDeRepasses(Number(dados.percentualAvle));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        {([
          { id: 'contrato', rotulo: 'Contrato' },
          { id: 'anexo', rotulo: 'Anexo II · Política de Repasses' },
        ] as const).map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setAba(o.id)}
            aria-pressed={aba === o.id}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border cursor-pointer ${
              aba === o.id ? 'bg-[#0B1E14] text-white border-transparent' : 'bg-white text-stone-600 border-stone-200'
            }`}
          >
            {o.rotulo}
          </button>
        ))}
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto px-3 py-1.5 rounded-full text-[11px] font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
        >
          Baixar em PDF
        </button>
      </div>

      <div className="rounded-2xl border border-[#DFD9CE] bg-white p-5 overflow-y-auto print:max-h-none print:overflow-visible print:border-0"
        style={alturaMaxima ? { maxHeight: alturaMaxima } : undefined}>
        {/* Na impressão saem os dois, um depois do outro: quem baixa o PDF
            leva o contrato inteiro, com o anexo que o integra. */}
        <div className={aba === 'contrato' ? '' : 'hidden print:block'}>
          <DocumentoJuridico texto={contrato} />
        </div>
        <div className={aba === 'anexo' ? '' : 'hidden print:block print:pt-8'}>
          <DocumentoJuridico texto={anexo} />
        </div>

        <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] text-stone-600 leading-relaxed">
          <p className="font-bold text-[#0B1E14] uppercase tracking-wide text-[10px] mb-1">Registro do aceite</p>
          <p>Remuneração da AVLE neste contrato: {formatarPercentual(Number(dados.percentualAvle))} de cada parcela.</p>
          {dados.aceito ? (
            <p>
              Aceito eletronicamente em {dados.aceitoEm ? new Date(dados.aceitoEm).toLocaleString('pt-BR') : '—'}
              {dados.aceitoPor ? ` por ${dados.aceitoPor}` : ''}
              {dados.aceitoIp ? `, a partir do endereço de rede ${dados.aceitoIp}` : ''}, versão {dados.versao}, conforme a
              cláusula 15.11.
            </p>
          ) : (
            <p>Ainda não aceito. Versão {dados.versao}.</p>
          )}
        </div>
      </div>
    </div>
  );
}
