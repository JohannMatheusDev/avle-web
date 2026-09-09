'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

type Aviso = {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  valor: number | null;
  lida: boolean;
  quando: string | null;
};

/**
 * Os avisos de entrada de dinheiro, no sino do cabeçalho.
 *
 * Existe porque saber que uma cliente pagou exigia abrir a ficha dela. Quem
 * pagava à noite ou no fim de semana só era notado no dia seguinte, e a baixa
 * lançada por uma pessoa não chegava a quem estava atendendo do outro lado.
 *
 * A checagem é a cada minuto, e não em tempo real: a diferença entre saber
 * agora e saber daqui a um minuto não muda nada para quem atende, e uma
 * conexão aberta o dia inteiro custaria muito mais do que resolve.
 */
export default function CentralDeAvisos({ tema = 'claro' }: { tema?: 'claro' | 'escuro' }) {
  const [aberto, setAberto] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);

  const buscar = useCallback(async () => {
    const r = await apiFetch('/api/notificacoes?quantidade=30');
    if (!r.ok) throw new Error('sem avisos');
    return r.json();
  }, []);

  useEffect(() => {
    let ativo = true;
    const carregar = () =>
      buscar()
        .then((d) => {
          if (!ativo) return;
          setAvisos(d.avisos ?? []);
          setNaoLidas(Number(d.naoLidas) || 0);
        })
        .catch(() => {});

    carregar();
    const relogio = setInterval(carregar, 60000);
    return () => {
      ativo = false;
      clearInterval(relogio);
    };
  }, [buscar]);

  const marcarTodas = async () => {
    // A tela muda antes da resposta: quem clicou já sabe que leu, e esperar a
    // rede para riscar o contador faz o botão parecer quebrado.
    setNaoLidas(0);
    setAvisos((atuais) => atuais.map((a) => ({ ...a, lida: true })));
    await apiFetch('/api/notificacoes/marcar-todas', { method: 'POST' }).catch(() => {});
  };

  const abrir = () => {
    setAberto((estava) => !estava);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={abrir}
        aria-label={naoLidas > 0 ? `${naoLidas} avisos não lidos` : 'Avisos'}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
          tema === 'escuro'
            ? 'border-white/15 bg-white/5 hover:bg-white/10'
            : 'border-[#DFD9CE] bg-white hover:bg-stone-50'
        }`}
      >
        <span className="text-sm">🔔</span>
        {naoLidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#BD6B42] px-1 font-mono text-[9px] font-bold text-white">
            {naoLidas > 99 ? '99' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <>
          {/* Fecha ao clicar fora, sem prender o clique de quem só quis sair. */}
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />

          <div className="absolute right-0 bottom-full z-50 mb-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#DFD9CE] bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-[#DFD9CE] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Entradas recentes
              </p>
              {naoLidas > 0 && (
                <button
                  type="button"
                  onClick={marcarTodas}
                  className="text-[10px] font-bold uppercase tracking-wider text-[#BD6B42] cursor-pointer hover:underline"
                >
                  Marcar lidas
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {avisos.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs italic text-stone-400">
                  Nenhuma entrada por enquanto. Os pagamentos aparecem aqui assim que caem.
                </p>
              ) : (
                <ul className="divide-y divide-[#DFD9CE]">
                  {avisos.map((a) => (
                    <li
                      key={a.id}
                      className={`px-4 py-3 ${a.lida ? 'bg-white' : 'bg-[#BD6B42]/5'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-[#0B1E14]">
                            {a.titulo}
                            <span className="ml-1.5 font-mono text-[9px] font-normal uppercase tracking-wider text-stone-400">
                              {a.tipo === 'ENTRADA_ASAAS' ? 'Asaas' : 'pela loja'}
                            </span>
                          </p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-stone-600">
                            {a.mensagem}
                          </p>
                          {a.quando && (
                            <p className="mt-1 font-mono text-[9px] text-stone-400">{a.quando}</p>
                          )}
                        </div>
                        {!a.lida && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#BD6B42]" />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
