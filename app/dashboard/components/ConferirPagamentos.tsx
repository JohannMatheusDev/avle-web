'use client';

/**
 * Confere no Asaas as cobranças em aberto e dá baixa nas que já foram pagas.
 * Primeiro o ensaio, que mostra quem seria baixado; depois a baixa. O servidor
 * também faz isso sozinho de hora em hora, das 8h às 22h.
 */

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

type Linha = { cliente?: string; cotaId?: number; valor?: number; competencia?: string; cobranca: string };
type Resultado = {
  ensaio: boolean;
  cobrancasEmAberto: number;
  pagasNoAsaas: number;
  creditadas?: number;
  erros: number;
  baixadas: Linha[];
  problemas?: string[];
};

const mes = (c?: string) =>
  c ? new Date(`${c}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '';

export default function ConferirPagamentos() {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  const conferir = async (ensaio: boolean) => {
    if (!ensaio && !window.confirm(`Dar baixa nas ${resultado?.pagasNoAsaas ?? ''} cobrança(s) que o Asaas diz que foram pagas?`)) return;
    setOcupado(true);
    setErro('');
    try {
      const r = await apiFetch(`/api/admin/conferir-pagamentos?ensaio=${ensaio}`, { method: 'POST' });
      if (!r.ok) throw new Error('Não foi possível conferir agora.');
      setResultado(await r.json());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível conferir agora.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="cartao-avle p-6 mb-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 style={{ fontWeight: 600 }} className="text-[16px] text-painel-tinta">Pagamentos sem baixa</h3>
          <p className="text-[12px] text-stone-500 mt-1 max-w-xl leading-relaxed">
            Pergunta ao Asaas por cada cobrança em aberto e mostra as que já foram pagas. A baixa só acontece quando o
            Asaas confirma. O sistema também faz isso sozinho de hora em hora, das 8h às 22h.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => conferir(true)} disabled={ocupado}
            className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
            {ocupado ? 'Conferindo no Asaas…' : 'Conferir no Asaas'}
          </button>
          {resultado?.ensaio && resultado.pagasNoAsaas > 0 && (
            <button type="button" onClick={() => conferir(false)} disabled={ocupado}
              className="h-10 px-5 rounded-full bg-painel-acento text-white text-[12px] font-semibold disabled:opacity-50 cursor-pointer">
              Dar baixa em {resultado.pagasNoAsaas}
            </button>
          )}
        </div>
      </div>

      {erro && <p className="text-[12px] text-rose-600">{erro}</p>}

      {resultado && (
        <div className="space-y-2">
          <p className="text-[13px] text-painel-tinta">
            {resultado.ensaio
              ? <><strong>{resultado.pagasNoAsaas}</strong> de {resultado.cobrancasEmAberto} cobrança(s) em aberto já foram pagas no Asaas.</>
              : <><strong>{resultado.creditadas ?? 0}</strong> parcela(s) receberam a baixa.</>}
            {resultado.erros > 0 && <span className="text-rose-600"> {resultado.erros} não puderam ser conferidas.</span>}
          </p>
          {resultado.baixadas.length > 0 && (
            <div className="divide-y divide-painel-borda">
              {resultado.baixadas.map((l) => (
                <div key={`${l.cobranca}-${l.cotaId}`} className="py-2 flex flex-wrap items-center justify-between gap-2 text-[12px]">
                  <span className="text-painel-tinta font-semibold">{l.cliente ?? 'Cliente'} <span className="text-stone-400 font-normal">· cota #{l.cotaId}{l.competencia ? ` · ${mes(l.competencia)}` : ''}</span></span>
                  <span className="tabular-nums text-emerald-700 font-semibold">
                    R$ {Number(l.valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}
          {resultado.problemas && resultado.problemas.length > 0 && (
            <details>
              <summary className="text-[12px] font-semibold text-stone-500 cursor-pointer">O que não pôde ser conferido</summary>
              <ul className="text-[11px] text-stone-500 mt-1 space-y-0.5 break-words">
                {resultado.problemas.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
