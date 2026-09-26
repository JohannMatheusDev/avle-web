'use client';

/**
 * Escolha de grupo em lista, no lugar do `<select>` nativo.
 *
 * O select abria a lista desenhada pelo sistema operacional - cinza, fonte do
 * sistema, só o nome do grupo -, a única parte do painel fora do visual da
 * AVLE. E só o nome não bastava: para decidir qual grupo sortear, a loja
 * precisa ver quantas cotas estão preenchidas e se o grupo ainda está aberto.
 *
 * Segue o padrão de listbox: setas andam, Enter escolhe, Esc fecha, e o foco
 * volta para o botão.
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { grupoEncerrado, vagasDoGrupo } from '../../lib/grupos';
import { Icone } from './Casca';
import { real, sigla } from './Indicadores';

type GrupoDaLista = {
  id: number;
  nome: string;
  valorParcela: number;
  quantidadeMaxCotas: number;
  cotasOcupadas?: number;
  duracaoMeses?: number;
  status?: string;
};

function situacao(g: GrupoDaLista) {
  if (grupoEncerrado(g)) return { rotulo: 'Encerrado', classe: 'bg-stone-100 text-stone-500' };
  const vagas = vagasDoGrupo(g);
  if (vagas === 0) return { rotulo: 'Lotado', classe: 'bg-amber-50 text-amber-800' };
  return {
    rotulo: vagas === null ? 'Aberto' : `${vagas} vaga${vagas === 1 ? '' : 's'}`,
    classe: 'bg-emerald-50 text-emerald-700',
  };
}

export function SeletorDeGrupo({
  grupos,
  valor,
  aoEscolher,
  tour,
}: {
  grupos: GrupoDaLista[];
  valor: string;
  aoEscolher: (id: string) => void;
  tour?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [realce, setRealce] = useState(0);
  const caixa = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const idDaLista = useId();

  // Encerrados por último: sorteio de grupo encerrado é raro, e eles
  // empurravam para baixo os grupos em andamento.
  const ordenados = useMemo(
    () => [...grupos].sort((a, b) => Number(grupoEncerrado(a)) - Number(grupoEncerrado(b))),
    [grupos],
  );
  const termo = busca.trim().toLowerCase();
  const visiveis = termo ? ordenados.filter((g) => g.nome.toLowerCase().includes(termo)) : ordenados;
  const escolhido = grupos.find((g) => String(g.id) === valor) ?? null;

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [aberto]);

  // Ao abrir, o realce começa no grupo já escolhido.
  const abrir = () => {
    const i = ordenados.findIndex((g) => String(g.id) === valor);
    setBusca('');
    setRealce(i >= 0 ? i : 0);
    setAberto(true);
  };

  useEffect(() => {
    lista.current?.querySelector<HTMLElement>(`[data-indice="${realce}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [realce]);

  const escolher = (g: GrupoDaLista) => {
    aoEscolher(String(g.id));
    setAberto(false);
    setBusca('');
    botao.current?.focus();
  };

  const tecla = (e: React.KeyboardEvent) => {
    if (!aberto) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); setAberto(false); botao.current?.focus(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setRealce((r) => Math.min(r + 1, visiveis.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setRealce((r) => Math.max(r - 1, 0)); }
    if (e.key === 'Enter' && visiveis[realce]) { e.preventDefault(); escolher(visiveis[realce]); }
  };

  return (
    <div ref={caixa} className="relative w-full sm:w-[340px]" onKeyDown={tecla} data-tour={tour}>
      <button
        ref={botao}
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={idDaLista}
        className={`w-full flex items-center gap-3 rounded-[18px] px-3 min-h-[52px] py-2 text-left transition-colors cursor-pointer ${
          aberto ? 'bg-white ring-2 ring-painel-acento/50' : 'bg-painel-papel ring-1 ring-painel-borda hover:ring-painel-tinta/25'
        }`}
      >
        {escolhido ? (
          <>
            <span className="w-9 h-9 rounded-full bg-painel-tinta text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
              {sigla(escolhido.nome)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-painel-tinta truncate">{escolhido.nome}</span>
              <span className="block text-[11px] text-stone-400 truncate">
                {Number(escolhido.cotasOcupadas ?? 0)}/{escolhido.quantidadeMaxCotas} cotas · {real(escolhido.valorParcela)} por mês
              </span>
            </span>
          </>
        ) : (
          <>
            <span className="w-9 h-9 rounded-full bg-white ring-1 ring-painel-borda text-painel-acento flex items-center justify-center flex-shrink-0">
              <Icone nome="grupos" className="w-4 h-4" />
            </span>
            <span className="flex-1 text-[13px] text-stone-500">Escolha o grupo do sorteio</span>
          </>
        )}
        <svg viewBox="0 0 24 24" className={`w-4 h-4 text-stone-400 flex-shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {aberto && (
        <div className="absolute left-0 right-0 top-full mt-2 z-40 bg-white rounded-[22px] p-2 ring-1 ring-painel-borda shadow-[0_24px_48px_-20px_rgba(11,30,20,0.45)] animate-fadeIn">
          {grupos.length > 6 && (
            <div className="px-1 pb-2">
              <input
                autoFocus
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setRealce(0); }}
                placeholder="Buscar grupo pelo nome"
                aria-label="Buscar grupo pelo nome"
                className="w-full h-10 px-4 bg-painel-papel rounded-full text-[12px] text-painel-tinta placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-painel-acento/40"
              />
            </div>
          )}

          <ul ref={lista} id={idDaLista} role="listbox" aria-label="Grupos da loja" className="max-h-[320px] overflow-y-auto space-y-1">
            {visiveis.length === 0 && (
              <li className="px-3 py-6 text-center text-[12px] text-stone-400">
                {grupos.length === 0 ? 'Nenhum grupo criado ainda.' : 'Nenhum grupo com esse nome.'}
              </li>
            )}
            {visiveis.map((g, i) => {
              const s = situacao(g);
              const ehEscolhido = String(g.id) === valor;
              const realcado = i === realce;
              return (
                <li
                  key={g.id}
                  role="option"
                  aria-selected={ehEscolhido}
                  data-indice={i}
                  onMouseEnter={() => setRealce(i)}
                  onClick={() => escolher(g)}
                  className={`flex items-center gap-3 rounded-[16px] px-3 py-2.5 cursor-pointer transition-colors ${
                    ehEscolhido ? 'bg-painel-tinta text-white' : realcado ? 'bg-painel-papel' : ''
                  }`}
                >
                  <span className={`w-9 h-9 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0 ${
                    ehEscolhido ? 'bg-painel-acento text-white' : 'bg-painel-papel text-painel-tinta ring-1 ring-painel-borda'
                  }`}>
                    {sigla(g.nome)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[13px] font-semibold truncate ${ehEscolhido ? 'text-white' : 'text-painel-tinta'}`}>{g.nome}</span>
                    <span className={`block text-[11px] truncate ${ehEscolhido ? 'text-white/60' : 'text-stone-400'}`}>
                      #{g.id} · {Number(g.cotasOcupadas ?? 0)}/{g.quantidadeMaxCotas} cotas · {real(g.valorParcela)} por mês
                    </span>
                  </span>
                  <span className={`h-6 px-2.5 rounded-full text-[10px] font-semibold flex items-center whitespace-nowrap flex-shrink-0 ${
                    ehEscolhido ? 'bg-white/15 text-white' : s.classe
                  }`}>
                    {s.rotulo}
                  </span>
                  {ehEscolhido && (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-painel-acento flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
