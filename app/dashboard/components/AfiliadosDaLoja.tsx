'use client';

/**
 * A aba Afiliados da loja: o link para quem quer divulgar a loja se cadastrar
 * como afiliada, e a lista de afiliadas com o que cada uma trouxe. A loja pode
 * desligar uma afiliada: o link dela para de marcar clientes novas.
 *
 * Desligar pede confirmação num cartão da casa, com o motivo escrito pela loja.
 * O motivo não é burocracia: ele vai inteiro para o painel da afiliada, que
 * fica sabendo por que o link dela parou. Só depois de confirmado é que o
 * desligamento acontece. O histórico (indicações e comissões já geradas) fica,
 * por isso a lista continua mostrando quem foi desligada, e a loja pode
 * reativar.
 */

import { useCallback, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '../../lib/api';

type Afiliada = {
  afiliadoId: number; nome: string; email?: string; telefone?: string; codigo: string; ativo: boolean; criadoEm: string;
  clientesIndicados: number; clientesQuePagaram: number; parcelasPagas: number;
  totalGanho: number; aReceber: number; aDefinir: number;
  /** Preenchidos pela API quando a loja desliga. A afiliada vê o mesmo texto. */
  motivoDesligamento?: string | null; desligadaEm?: string | null;
};

/** Atalhos para o motivo: um toque escreve, e a loja ajusta o texto. */
const MOTIVOS = [
  'Parou de divulgar a loja.',
  'Pediu para sair do programa de afiliadas.',
  'Divulgou de um jeito diferente do que foi combinado.',
  'A parceria chegou ao fim.',
];

const MINIMO_DO_MOTIVO = 10;

const reais = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const data = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '');

export default function AfiliadosDaLoja({ lojaId, nomeLoja, ehColaborador }: { lojaId: number; nomeLoja: string; ehColaborador: boolean }) {
  const [lista, setLista] = useState<Afiliada[] | null>(null);
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [desligando, setDesligando] = useState<Afiliada | null>(null);
  const [motivo, setMotivo] = useState('');

  const slug = nomeLoja.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const linkDeCadastro = typeof window !== 'undefined' ? `${window.location.origin}/afiliados/${lojaId}-${slug || 'loja'}` : '';

  const carregar = useCallback(async () => {
    try {
      const r = await apiFetch(`${API_URL}/api/afiliados/loja/${lojaId}`);
      if (!r.ok) throw new Error();
      setLista(await r.json());
    } catch {
      setAviso('Não foi possível carregar as afiliadas.');
      setLista([]);
    }
  }, [lojaId]);

  // A primeira carga sai depois da renderização: chamada direto no efeito, o
  // estado mudaria em cascata (regra do React).
  useEffect(() => {
    const t = setTimeout(carregar, 0);
    return () => clearTimeout(t);
  }, [carregar]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(linkDeCadastro);
      setAviso('Link copiado. Mande para quem vai divulgar a loja.');
    } catch {
      setAviso('Não deu para copiar. Selecione o link e copie.');
    }
  };

  // Desligar e reativar passam pela mesma rota; só o desligamento leva motivo.
  const mudarSituacao = async (a: Afiliada, ativo: boolean, motivoEscrito?: string) => {
    setOcupado(a.afiliadoId);
    try {
      const r = await apiFetch(`${API_URL}/api/afiliados/loja/${lojaId}/${a.afiliadoId}/ativo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ativo ? { ativo } : { ativo, motivo: motivoEscrito }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.erro || 'Não foi possível alterar.');
      setAviso(d.mensagem || (ativo ? `${a.nome} voltou a divulgar a loja.` : `${a.nome} foi desligada. Ela vê o motivo no painel dela.`));
      setDesligando(null);
      setMotivo('');
      await carregar();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não foi possível alterar.');
    } finally {
      setOcupado(null);
    }
  };

  const abrirDesligamento = (a: Afiliada) => {
    setMotivo('');
    setAviso('');
    setDesligando(a);
  };

  const motivoServe = motivo.trim().length >= MINIMO_DO_MOTIVO;

  return (
    <div className="space-y-6">
      <div className="cartao-avle p-6 space-y-3">
        <h3 style={{ fontWeight: 600 }} className="text-[16px] text-painel-tinta">Link para novas afiliadas</h3>
        <p className="text-[12px] text-stone-500 max-w-xl leading-relaxed">
          Mande este link para quem vai divulgar a loja (influenciadoras, parceiras). Ela se cadastra, aceita os termos
          e recebe um link de indicação só dela. Cada parcela paga por quem entrar pelo link dela gera uma comissão.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-[220px] px-4 py-2.5 rounded-full bg-painel-papel text-[12px] text-painel-tinta break-all">{linkDeCadastro}</code>
          <button type="button" onClick={copiar}
            className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde cursor-pointer">
            Copiar link
          </button>
        </div>
        {aviso && <p className="text-[12px] text-painel-tinta">{aviso}</p>}
      </div>

      <div className="cartao-avle p-6">
        <h3 style={{ fontWeight: 600 }} className="text-[16px] text-painel-tinta mb-3">Afiliadas</h3>
        {lista === null ? (
          <p className="text-[12px] text-stone-400 animate-pulse">Carregando…</p>
        ) : lista.length === 0 ? (
          <p className="text-[12px] text-stone-400">Nenhuma afiliada ainda. Mande o link acima para quem vai divulgar a loja.</p>
        ) : (
          <div className="divide-y divide-painel-borda">
            {lista.map((a) => (
              <div key={a.afiliadoId} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 text-[12px] text-stone-500">
                  <p className="text-[13px] font-semibold text-painel-tinta">
                    {a.nome}
                    {!a.ativo && <span className="ml-2 text-[10px] font-bold uppercase text-rose-700">desligada</span>}
                  </p>
                  <p>{[a.email, a.telefone].filter(Boolean).join(' · ')} · código {a.codigo}</p>
                  <p className="text-painel-tinta">
                    {a.clientesIndicados} entraram · {a.clientesQuePagaram} pagaram · {a.parcelasPagas} parcela(s) ·{' '}
                    comissão {reais(a.totalGanho)}{a.aDefinir > 0 ? ` (+${a.aDefinir} a definir)` : ''}
                  </p>
                  {!a.ativo && a.motivoDesligamento && (
                    <p className="mt-1 text-stone-500">
                      Motivo{a.desligadaEm ? ` (${data(a.desligadaEm)})` : ''}: {a.motivoDesligamento}
                    </p>
                  )}
                </div>
                {!ehColaborador && (
                  <button type="button" onClick={() => (a.ativo ? abrirDesligamento(a) : mudarSituacao(a, true))}
                    disabled={ocupado === a.afiliadoId}
                    className="h-9 px-4 rounded-full border border-painel-borda text-[12px] font-semibold text-painel-tinta hover:bg-stone-50 disabled:opacity-50 cursor-pointer">
                    {a.ativo ? 'Desligar' : 'Reativar'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {desligando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn"
          role="dialog" aria-modal="true" aria-label={`Desligar ${desligando.nome}`}>
          <div className="cartao-avle w-full max-w-md p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <div>
              <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">Desligar {desligando.nome}</h3>
              <p className="text-[12px] text-stone-500 mt-1">Afiliada desde {data(desligando.criadoEm)} · código {desligando.codigo}</p>
            </div>

            <p className="text-[12px] text-stone-600 leading-relaxed">
              O link dela para de marcar clientes novas e as próximas parcelas não geram comissão. As{' '}
              {desligando.clientesIndicados} indicação(ões) e as comissões já geradas continuam registradas, e você pode
              reativar depois.
            </p>

            <div className="space-y-2">
              <label htmlFor="motivo-desligamento" className="block text-[12px] font-semibold text-painel-tinta">
                Motivo do desligamento
              </label>
              <p className="text-[11px] text-stone-500">{desligando.nome.split(' ')[0]} vai ler este texto no painel dela.</p>
              <div className="flex flex-wrap gap-1.5">
                {MOTIVOS.map((m) => (
                  <button key={m} type="button" onClick={() => setMotivo(m)}
                    className={`px-3 py-1.5 rounded-full border text-[11px] cursor-pointer ${
                      motivo === m ? 'border-painel-tinta bg-painel-tinta text-white' : 'border-painel-borda text-stone-600 hover:bg-stone-50'
                    }`}>
                    {m.replace(/\.$/, '')}
                  </button>
                ))}
              </div>
              <textarea id="motivo-desligamento" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3}
                placeholder="Escreva o motivo com as suas palavras."
                className="w-full border border-painel-borda rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-painel-acento resize-none" />
              {!motivoServe && motivo.trim() !== '' && (
                <p className="text-[11px] text-stone-500">Escreva pelo menos {MINIMO_DO_MOTIVO} caracteres.</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setDesligando(null); setMotivo(''); }}
                className="flex-1 py-2.5 border rounded-full text-stone-500 font-semibold text-[12px] hover:bg-stone-50 cursor-pointer">
                Voltar
              </button>
              <button type="button" disabled={!motivoServe || ocupado === desligando.afiliadoId}
                onClick={() => mudarSituacao(desligando, false, motivo.trim())}
                className="flex-1 py-2.5 bg-rose-700 text-white font-semibold rounded-full text-[12px] hover:bg-rose-800 disabled:opacity-40 cursor-pointer">
                {ocupado === desligando.afiliadoId ? 'Desligando…' : 'Desligar afiliada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
