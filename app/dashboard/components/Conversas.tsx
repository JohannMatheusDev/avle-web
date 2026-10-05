'use client';

/**
 * As conversas do WhatsApp da AVLE, no painel. A AVLE vê todas; a loja vê as
 * das clientes dela - o servidor decide quem vê o quê. Responder vale nas 24
 * horas depois da última mensagem da cliente, que é a regra do WhatsApp.
 *
 * No celular, a lista e a conversa aberta se revezam na mesma tela.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../lib/api';

type Resumo = {
  telefone: string;
  nome: string;
  lojas: string[];
  ehCliente: boolean;
  ultima?: string;
  ultimaDirecao: 'ENTRADA' | 'SAIDA';
  quando?: string;
  naoLidas: number;
  janelaAberta: boolean;
};

type Midia = { tipo: 'image' | 'audio' | 'video' | 'document' | 'sticker'; mime?: string; nome?: string };

type Mensagem = {
  id: number;
  direcao: 'ENTRADA' | 'SAIDA';
  texto?: string;
  midia?: Midia;
  status?: string;
  erro?: string;
  autor?: string;
  quando?: string;
};

type Aberta = {
  telefone: string;
  nome: string;
  lojas: string[];
  ehCliente: boolean;
  janelaAberta: boolean;
  mensagens: Mensagem[];
};

const hora = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const hoje = new Date();
  return d.toDateString() === hoje.toDateString()
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const telefoneLegivel = (t: string) => (t.length === 11 ? `(${t.slice(0, 2)}) ${t.slice(2, 7)}-${t.slice(7)}` : t);

const SITUACAO: Record<string, string> = { sent: 'Enviada', delivered: 'Entregue', read: 'Lida', failed: 'Não entregue' };

/**
 * O arquivo que a cliente mandou. Vem pelo servidor, com a sessão, e vira um
 * endereço local do navegador - a Meta só entrega o arquivo com o token dela.
 */
function ArquivoDaMensagem({ telefone, mensagemId, midia }: { telefone: string; mensagemId: number; midia: Midia }) {
  const [url, setUrl] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let ativo = true;
    let criada: string | null = null;
    apiFetch(`/api/conversas/${telefone}/midia/${mensagemId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        criada = URL.createObjectURL(await r.blob());
        if (ativo) setUrl(criada);
      })
      .catch(() => { if (ativo) setFalhou(true); });
    return () => { ativo = false; if (criada) URL.revokeObjectURL(criada); };
  }, [telefone, mensagemId]);

  if (falhou) return <span className="block text-[11px] italic opacity-70">O arquivo não abriu. A Meta guarda por até 30 dias.</span>;
  if (!url) return <span className="block text-[11px] opacity-60">Carregando o arquivo…</span>;

  if (midia.tipo === 'image' || midia.tipo === 'sticker') {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element -- endereço local do navegador, fora do otimizador */}
        <img src={url} alt={midia.tipo === 'sticker' ? 'Figurinha' : 'Foto enviada pela cliente'}
          className={`rounded-xl ${midia.tipo === 'sticker' ? 'w-28' : 'max-h-72 w-auto'} object-contain`} />
      </a>
    );
  }
  if (midia.tipo === 'audio') return <audio controls src={url} className="max-w-full" />;
  if (midia.tipo === 'video') return <video controls src={url} className="rounded-xl max-h-72 max-w-full" />;
  return (
    <a href={url} download={midia.nome || 'documento'}
      className="inline-flex items-center gap-2 underline underline-offset-2 font-semibold">
      Baixar {midia.nome || 'documento'}
    </a>
  );
}

export default function Conversas({ ehAdmin, aoContarNaoLidas }: { ehAdmin: boolean; aoContarNaoLidas?: (n: number) => void }) {
  const [lista, setLista] = useState<Resumo[] | null>(null);
  const [aberta, setAberta] = useState<Aberta | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const fim = useRef<HTMLDivElement>(null);
  const abertaRef = useRef<string | null>(null);

  const carregarLista = useCallback(async () => {
    try {
      const r = await apiFetch('/api/conversas');
      if (!r.ok) return;
      const dados: Resumo[] = await r.json();
      setLista(dados);
      aoContarNaoLidas?.(dados.reduce((s, c) => s + (c.naoLidas || 0), 0));
    } catch {
      // Sem a lista agora, a próxima volta tenta de novo.
    }
  }, [aoContarNaoLidas]);

  const abrir = useCallback(async (telefone: string) => {
    try {
      const r = await apiFetch(`/api/conversas/${telefone}`);
      if (!r.ok) return;
      const dados: Aberta = await r.json();
      abertaRef.current = telefone;
      setAberta(dados);
      setLista((l) => l?.map((c) => (c.telefone === telefone ? { ...c, naoLidas: 0 } : c)) ?? null);
    } catch {
      // Fica a conversa que estava.
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial das conversas
    carregarLista();
    // Mensagem nova aparece sozinha: a lista e a conversa aberta se atualizam a cada 10 segundos.
    const t = setInterval(() => {
      carregarLista();
      if (abertaRef.current) abrir(abertaRef.current);
    }, 10000);
    return () => clearInterval(t);
  }, [carregarLista, abrir]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'end' });
  }, [aberta?.mensagens.length]);

  const responder = async () => {
    if (!aberta || !texto.trim()) return;
    setEnviando(true);
    setErro('');
    try {
      const r = await apiFetch(`/api/conversas/${aberta.telefone}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      const dados = await r.json().catch(() => ({}));
      if (!r.ok || !dados.enviado) throw new Error(dados.erro || 'Não foi possível enviar.');
      setTexto('');
      await abrir(aberta.telefone);
      carregarLista();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível enviar.');
    } finally {
      setEnviando(false);
    }
  };

  const fechar = () => {
    abertaRef.current = null;
    setAberta(null);
    setErro('');
  };

  const filtradas = (lista ?? []).filter((c) => {
    const q = busca.trim().toLowerCase();
    return !q || c.nome.toLowerCase().includes(q) || c.telefone.includes(q.replace(/\D/g, '') || '~');
  });

  return (
    <div className="cartao-avle overflow-hidden grid md:grid-cols-[minmax(260px,340px)_1fr] min-h-[560px]">
      {/* A lista */}
      <div className={`border-r border-painel-borda flex flex-col min-w-0 ${aberta ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-painel-borda space-y-2">
          <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">Conversas do WhatsApp</h3>
          <p className="text-[11px] text-stone-500 leading-relaxed">
            {ehAdmin
              ? 'Tudo o que as clientes respondem no número da AVLE.'
              : 'O que as suas clientes respondem no número da AVLE. A resposta sai com o nome da loja na frente.'}
          </p>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou número"
            className="w-full h-10 px-4 bg-painel-papel ring-1 ring-painel-borda rounded-full text-[13px] text-painel-tinta focus:outline-none focus:ring-2 focus:ring-painel-acento/50" />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-painel-borda">
          {lista === null && <p className="p-4 text-[12px] text-stone-400">Carregando…</p>}
          {lista !== null && filtradas.length === 0 && (
            <p className="p-4 text-[12px] text-stone-400">
              {lista.length === 0 ? 'Nenhuma cliente respondeu ainda.' : 'Nada com essa busca.'}
            </p>
          )}
          {filtradas.map((c) => (
            <button key={c.telefone} type="button" onClick={() => abrir(c.telefone)}
              className={`w-full text-left px-4 py-3 hover:bg-stone-50 cursor-pointer ${aberta?.telefone === c.telefone ? 'bg-painel-papel' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[13px] truncate ${c.naoLidas > 0 ? 'font-bold text-painel-tinta' : 'font-semibold text-painel-tinta'}`}>{c.nome}</span>
                <span className="text-[11px] text-stone-400 whitespace-nowrap">{hora(c.quando)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-[12px] text-stone-500 truncate">
                  {c.ultimaDirecao === 'SAIDA' ? 'Você: ' : ''}{c.ultima}
                </span>
                {c.naoLidas > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-painel-acento text-white text-[11px] font-bold flex items-center justify-center">
                    {c.naoLidas}
                  </span>
                )}
              </div>
              {ehAdmin && (
                <span className="block text-[11px] text-stone-400 truncate mt-0.5">
                  {c.ehCliente ? c.lojas.join(', ') || 'Sem loja' : 'Número sem cadastro'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* A conversa aberta */}
      <div className={`flex-col min-w-0 ${aberta ? 'flex' : 'hidden md:flex'}`}>
        {!aberta ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-[13px] text-stone-400 text-center">Escolha uma conversa para ler e responder.</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-painel-borda flex items-center gap-3">
              <button type="button" onClick={fechar} aria-label="Voltar para a lista"
                className="md:hidden h-9 w-9 rounded-full border border-painel-borda text-painel-tinta cursor-pointer">←</button>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-painel-tinta truncate">{aberta.nome}</p>
                <p className="text-[11px] text-stone-400 truncate">
                  {telefoneLegivel(aberta.telefone)}{aberta.lojas.length > 0 ? ` · ${aberta.lojas.join(', ')}` : ''}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-painel-papel max-h-[60vh] md:max-h-[520px]">
              {aberta.mensagens.map((m) => (
                <div key={m.id} className={`flex ${m.direcao === 'SAIDA' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                    m.direcao === 'SAIDA' ? 'bg-painel-tinta text-white rounded-br-md' : 'bg-white text-painel-tinta ring-1 ring-painel-borda rounded-bl-md'}`}>
                    {m.midia && (
                      <span className="block mb-1">
                        <ArquivoDaMensagem telefone={aberta.telefone} mensagemId={m.id} midia={m.midia} />
                      </span>
                    )}
                    {/* Sem legenda, o nome do tipo ("Foto", "Áudio") já está no arquivo. */}
                    {!(m.midia && ['Foto', 'Áudio', 'Vídeo', 'Figurinha'].includes(m.texto ?? '')) && m.texto}
                    <span className={`block text-[10px] mt-1 ${m.direcao === 'SAIDA' ? 'text-white/60' : 'text-stone-400'}`}>
                      {m.autor ? `${m.autor} · ` : ''}{hora(m.quando)}
                      {m.direcao === 'SAIDA' && m.status ? ` · ${SITUACAO[m.status] ?? m.status}` : ''}
                    </span>
                    {m.status === 'failed' && m.erro && (
                      <span className="block text-[10px] mt-0.5 text-rose-200">{m.erro}</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={fim} />
            </div>

            <div className="p-3 border-t border-painel-borda space-y-2">
              {aberta.janelaAberta ? (
                <div className="flex gap-2 items-end">
                  <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2}
                    placeholder="Escreva a resposta"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); responder(); } }}
                    className="flex-1 border border-painel-borda rounded-2xl px-3.5 py-2.5 text-[16px] md:text-[13px] focus:outline-none focus:border-painel-acento resize-none" />
                  <button type="button" onClick={responder} disabled={enviando || !texto.trim()}
                    className="h-11 px-5 rounded-full bg-painel-tinta text-white text-[13px] font-semibold hover:bg-avle-verde disabled:opacity-40 cursor-pointer">
                    {enviando ? 'Enviando…' : 'Enviar'}
                  </button>
                </div>
              ) : (
                <p className="text-[12px] text-amber-800 leading-relaxed">
                  Passaram 24 horas desde a última mensagem da cliente. O WhatsApp só deixa responder quando ela
                  escrever de novo.
                </p>
              )}
              {erro && <p className="text-[12px] text-rose-600 break-words">{erro}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
