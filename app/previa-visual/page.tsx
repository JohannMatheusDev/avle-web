'use client';

import { useState } from 'react';
import {
  CabecalhoDoPainel, Identidade, ItemDeNavegacao, TrilhoDeNavegacao,
} from '../dashboard/components/Casca';

/**
 * Prévia do visual dos painéis, sem precisar entrar na conta.
 *
 * Os painéis só abrem com sessão, o que torna impossível olhar uma mudança de
 * aparência sem logar em cada perfil. Esta rota monta os mesmos blocos com
 * números de exemplo, para conferir cor, tipografia e espaçamento.
 *
 * Os dados aqui são inventados e ficam marcados como exemplo na tela — nenhum
 * deles vem da API.
 */

const SECOES_LOJA: ItemDeNavegacao[] = [
  { id: 'inicio', rotulo: 'Início', icone: 'inicio' },
  { id: 'clientes', rotulo: 'Clientes', icone: 'clientes' },
  { id: 'aprovacoes', rotulo: 'Aprovações', icone: 'aprovacoes', contador: 54, urgente: true },
  { id: 'fila', rotulo: 'Fila de Espera', icone: 'fila' },
  { id: 'grupos', rotulo: 'Grupos', icone: 'grupos' },
  { id: 'sorteios', rotulo: 'Sorteios / Entrega', icone: 'sorteios' },
];

const PARTICIPANTES = [
  { nome: 'Maria Oliveira', cota: '14', grupo: 'Casa Nova', pagas: 7, situacao: 'Em dia', valor: 'R$ 909,30' },
  { nome: 'Joana Ribeiro', cota: '03', grupo: 'Casa Nova', pagas: 8, situacao: 'Contemplada', valor: 'R$ 1.039,20' },
  { nome: 'Cláudia Nunes', cota: '21', grupo: 'Sala Completa', pagas: 2, situacao: 'Em atraso', valor: 'R$ 259,80' },
  { nome: 'Rita Bueno', cota: '07', grupo: 'Casa Nova', pagas: 12, situacao: 'Quitada', valor: 'R$ 1.558,80' },
];

export default function PreviaVisual() {
  const [aba, setAba] = useState('inicio');

  return (
    <div className="fundo-painel min-h-screen flex">
      <TrilhoDeNavegacao
        itens={SECOES_LOJA}
        ativo={aba}
        aoEscolher={setAba}
        aoSair={() => {}}
        itemDeConfiguracao={{ id: 'configuracoes', rotulo: 'Configurações', icone: 'configuracoes' }}
        sigla="A"
      />

      <main className="flex-1 min-w-0 px-5 sm:px-8 py-8 pb-28 md:pb-8 space-y-6">
        <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#BD6B42] bg-white/60 rounded-full px-3 py-1.5">
          Prévia de visual · números de exemplo
        </div>

        <CabecalhoDoPainel
          etiqueta="Painel da loja"
          titulo="Bom dia, Caza Liz"
          descricao="Veja o que está acontecendo nos seus grupos hoje."
          acoes={
            <>
              <button className="bg-white border border-[#DFD9CE] text-[#0B1E14] px-4 py-2.5 rounded-full text-xs font-bold">
                Emitir cobrança
              </button>
              <button className="bg-[#BD6B42] text-white px-4 py-2.5 rounded-full text-xs font-bold">
                + Novo grupo
              </button>
            </>
          }
          identidade={<Identidade nome="Caza Liz Móveis" detalhe="Painel da loja" />}
        />

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="cartao-avle-destaque p-6 lg:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Recebido este mês</span>
            <span className="block text-4xl font-bold font-mono mt-3 tracking-tight">R$ 12.480,00</span>
            <span className="inline-flex items-center gap-1.5 bg-black/10 text-[11px] font-bold px-2.5 py-1 rounded-full mt-4">
              38 parcelas pagas
            </span>
            <div className="flex gap-2 mt-5">
              <button className="bg-[#0B1E14] text-white px-4 py-2.5 rounded-full text-xs font-bold flex-1">Ver extrato</button>
              <button className="bg-white border border-[#DFD9CE] text-[#0B1E14] px-4 py-2.5 rounded-full text-xs font-bold flex-1">Sacar</button>
            </div>
          </div>

          <div className="cartao-avle p-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Próximo vencimento</span>
            <span className="block text-3xl font-bold font-mono mt-3">07/10/2026</span>
            <p className="text-xs text-stone-500 mt-2">5º dia útil do mês · feriados excluídos</p>
            <div className="mt-5 pt-5 border-t border-[#E8E4DA] grid grid-cols-2 gap-4">
              <div>
                <span className="block text-2xl font-bold font-mono">204</span>
                <span className="text-[11px] text-stone-500">clientes ativas</span>
              </div>
              <div>
                <span className="block text-2xl font-bold font-mono">12</span>
                <span className="text-[11px] text-stone-500">grupos abertos</span>
              </div>
            </div>
          </div>

          <div className="cartao-avle p-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Sorteio de outubro</span>
            <span className="block text-3xl font-bold font-mono mt-3">10/10</span>
            <p className="text-xs text-stone-500 mt-2">Loteria Federal · concurso 6.180</p>
            <div className="mt-5 space-y-2">
              {['Casa Nova', 'Sala Completa', 'Quarto Planejado'].map((g) => (
                <div key={g} className="cartao-avle-liso px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B1E14]">{g}</span>
                  <span className="text-[11px] text-stone-500">aguardando</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cartao-avle p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-[#0B1E14]">Participantes</h3>
            <span className="text-[11px] text-stone-500">4 de 204</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E4DA]">
                {['Cliente', 'Cota', 'Grupo', 'Parcelas', 'Situação', 'Pago'].map((c) => (
                  <th key={c} className="text-left text-[10px] uppercase tracking-widest text-stone-400 font-bold pb-3">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PARTICIPANTES.map((p) => (
                <tr key={p.cota} className="border-b border-[#E6E2D8]">
                  <td className="py-3.5 font-medium text-[#0B1E14]">{p.nome}</td>
                  <td className="text-stone-500 font-mono">{p.cota}</td>
                  <td className="text-stone-500">{p.grupo}</td>
                  <td>
                    <div className="flex items-end gap-[3px] h-5">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-[3px] rounded-sm ${i < p.pagas ? 'bg-[#BD6B42] h-4' : 'bg-[#DFD9CE] h-2'}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      p.situacao === 'Em atraso' ? 'bg-rose-50 text-rose-700'
                      : p.situacao === 'Contemplada' ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'}`}>
                      {p.situacao}
                    </span>
                  </td>
                  <td className="font-mono font-bold text-[#0B1E14]">{p.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
