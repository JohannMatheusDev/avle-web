'use client';

/**
 * Quem começou o cadastro e parou no meio, para a loja ou a AVLE ligar.
 *
 * O cadastro pelo celular cria a conta já na primeira tela, antes do código,
 * justamente para esta lista existir: quem digitou CPF, nome e celular e
 * desistiu deixa o contato. Antes a desistência não deixava rastro.
 *
 * O contato é um por um, pelo WhatsApp de quem atende. Não há envio em massa
 * aqui de propósito: mensagem para muita gente de uma vez precisa de ensaio e
 * conferência, e isso já existe na cobrança.
 */

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

type Linha = {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
  loja?: string;
  dataCadastro?: string;
  etapa: 'NAO_CONFIRMOU_CODIGO' | 'NAO_ESCOLHEU_GRUPO' | 'NAO_PAGOU_ENTRADA' | 'FALTA_ENDERECO';
  etapaTexto: string;
};

const ETAPAS: { id: Linha['etapa'] | 'TODAS'; rotulo: string }[] = [
  { id: 'TODAS', rotulo: 'Todas' },
  { id: 'NAO_CONFIRMOU_CODIGO', rotulo: 'Não confirmou o código' },
  { id: 'NAO_ESCOLHEU_GRUPO', rotulo: 'Sem grupo' },
  { id: 'NAO_PAGOU_ENTRADA', rotulo: 'Não pagou a entrada' },
  { id: 'FALTA_ENDERECO', rotulo: 'Falta o endereço' },
];

const MENSAGEM: Record<Linha['etapa'], string> = {
  NAO_CONFIRMOU_CODIGO: 'vi que você começou o seu cadastro e não chegou a confirmar o código. Posso te ajudar a terminar?',
  NAO_ESCOLHEU_GRUPO: 'vi que você criou a sua conta e ainda não escolheu um grupo. Posso te ajudar a escolher?',
  NAO_PAGOU_ENTRADA: 'vi que você escolheu um grupo e a primeira parcela ficou em aberto. Posso te ajudar com o pagamento?',
  FALTA_ENDERECO: 'falta só o seu endereço no cadastro para a loja poder liberar o seu produto. Pode completar pelo app?',
};

export default function CadastrosIncompletos({ caminho, mostrarLoja = false, nomeDeQuemFala }: {
  /** De onde vem a lista: a da loja ou a da AVLE. */
  caminho: string;
  /** Na lista da AVLE, de qual loja é cada pessoa. */
  mostrarLoja?: boolean;
  /** Quem assina a mensagem do WhatsApp ("Aqui é a ..."). */
  nomeDeQuemFala: string;
}) {
  const [lista, setLista] = useState<Linha[] | null>(null);
  const [filtro, setFiltro] = useState<Linha['etapa'] | 'TODAS'>('TODAS');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = async () => {
    setCarregando(true);
    setErro('');
    try {
      const r = await apiFetch(caminho);
      if (!r.ok) throw new Error();
      setLista(await r.json());
    } catch {
      setErro('Não foi possível carregar a lista agora.');
    } finally {
      setCarregando(false);
    }
  };

  const visiveis = (lista ?? []).filter((l) => filtro === 'TODAS' || l.etapa === filtro);
  const contagem = (id: Linha['etapa'] | 'TODAS') =>
    id === 'TODAS' ? (lista ?? []).length : (lista ?? []).filter((l) => l.etapa === id).length;

  const linkDoWhatsapp = (l: Linha) => {
    const numero = (l.telefone || '').replace(/\D/g, '');
    if (numero.length < 10) return null;
    const primeiro = (l.nome || '').trim().split(/\s+/)[0] || '';
    const texto = `Olá, ${primeiro}! Aqui é a ${nomeDeQuemFala}. ${MENSAGEM[l.etapa]}`;
    return `https://wa.me/55${numero}?text=${encodeURIComponent(texto)}`;
  };

  return (
    <div className="cartao-avle p-6 mb-6 space-y-4 text-left">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 style={{ fontWeight: 600 }} className="text-[16px] text-painel-tinta">Cadastros que pararam no meio</h3>
          <p className="text-[12px] text-stone-500 mt-1 max-w-xl leading-relaxed">
            Quem começou e não terminou: não confirmou o código, não escolheu grupo, não pagou a entrada ou não
            informou o endereço. Quem parou há pouco vem primeiro. Toque em chamar para falar com a pessoa.
          </p>
          {mostrarLoja && (
            // Muitas conversas novas em pouco tempo já suspenderam o número
            // da AVLE uma vez, mesmo com cada mensagem clicada à mão.
            <p className="text-[11px] text-amber-700 mt-1 max-w-xl leading-relaxed">
              Chame poucas pessoas por vez, espalhadas no dia. Muitas conversas novas em pouco tempo já suspenderam
              o número da AVLE uma vez.
            </p>
          )}
        </div>
        <button type="button" onClick={carregar} disabled={carregando}
          className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
          {carregando ? 'Carregando…' : lista ? 'Atualizar' : 'Ver a lista'}
        </button>
      </div>

      {erro && <p className="text-[12px] text-rose-600">{erro}</p>}

      {lista && (
        <div className="flex flex-wrap gap-2">
          {ETAPAS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setFiltro(e.id)}
              aria-pressed={filtro === e.id}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer border ${
                filtro === e.id ? 'bg-painel-tinta text-white border-transparent' : 'bg-white text-stone-600 border-stone-200'
              }`}
            >
              {e.rotulo} · {contagem(e.id)}
            </button>
          ))}
        </div>
      )}

      {lista && visiveis.length === 0 && <p className="text-[12px] text-stone-400">Ninguém nesta situação.</p>}

      {visiveis.length > 0 && (
        <ul className="divide-y divide-stone-100">
          {visiveis.map((l) => {
            const link = linkDoWhatsapp(l);
            return (
              <li key={l.id} className="py-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[12rem]">
                  <p className="text-[13px] font-semibold text-painel-tinta">{l.nome}</p>
                  <p className="text-[11px] text-stone-500">
                    {l.etapaTexto}
                    {l.dataCadastro ? ` · desde ${new Date(l.dataCadastro).toLocaleDateString('pt-BR')}` : ''}
                    {mostrarLoja && l.loja ? ` · ${l.loja}` : ''}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {l.telefone || 'sem celular'}{l.email ? ` · ${l.email}` : ''}
                  </p>
                </div>
                {link && (
                  <a href={link} target="_blank" rel="noreferrer"
                    className="h-9 px-4 inline-flex items-center rounded-full border border-stone-200 text-[12px] font-semibold text-painel-tinta hover:bg-painel-papel">
                    Chamar no WhatsApp
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
