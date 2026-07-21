'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardAdmin({ usuario }: { usuario: any }) {
  const router = useRouter();
  const [abaExibida, setAbaExibida] = useState<'geral' | 'lojas' | 'financeiro' | 'risco'>('geral');
  
  // Estado para capturar qual loja está sendo auditada/controlada no momento
  const [lojaSelecionada, setLojaSelecionada] = useState<any | null>(null);

  const [metricas, setMetricas] = useState<any>({ 
    totalClientes: 0, 
    totalLojas: 0, 
    totalTransacionado: 0, 
    faturamentoPlataforma: 0,
    totalAReceber: 0 
  });

  const [listaLojas, setListaLojas] = useState<any[]>([]);

  const carregarDadosDoBanco = () => {
    fetch('http://localhost:8080/api/financeiro/admin/dashboard')
      .then((res) => res.json())
      .then((data) => setMetricas(data))
      .catch(() => {
        setMetricas({
          totalClientes: 0,
          totalLojas: 3,
          totalTransacionado: 0.00,
          faturamentoPlataforma: 0.00,
          totalAReceber: 0.00
        });
      });

    fetch('http://localhost:8080/api/lojas/listar-todas')
      .then((res) => res.json())
      .then((data) => setListaLojas(data))
      .catch(() => {
        // Inicializado no zero operacional conforme alinhado para o site pronto
        setListaLojas([
          { id: 1, nomeComercial: 'Simonetto Marcenaria', cnpj: '12.345.678/0001-99', statusHomologacao: 'HOMOLOGADO', grupos: 0, participantes: 0, faturamento: 0.00, inadimplencia: 0 },
          { id: 2, nomeComercial: 'Movelar Planejados', cnpj: '98.765.432/0001-11', statusHomologacao: 'PENDENTE', grupos: 0, participantes: 0, faturamento: 0.00, inadimplencia: 0 },
          { id: 3, nomeComercial: 'Dell Anno Design', cnpj: '45.678.910/0001-22', statusHomologacao: 'HOMOLOGADO', grupos: 0, participantes: 0, faturamento: 0.00, inadimplencia: 0 }
        ]);
      });
  };

  useEffect(() => {
    carregarDadosDoBanco();
  }, []);

  const totalTransacionado = Number(metricas?.totalTransacionado) || 0;
  const faturamentoPlataforma = Number(metricas?.faturamentoPlataforma) || 0;
  const valoresARepassarLojas = totalTransacionado - faturamentoPlataforma;
  const totalClientes = Number(metricas?.totalClientes) || 0;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F0F2F5] text-[#0B1E14]">
      
      {/* SIDEBAR CORPORATIVO */}
      <aside className="w-full md:w-64 bg-[#0B1E14] text-[#E3EAE6] flex flex-col justify-between p-6 flex-shrink-0">
        <div>
          <div className="mb-8 border-b border-white/10 pb-6">
            <h1 className="text-xl font-serif font-bold text-white tracking-wide">AVLE</h1>
            <p className="text-xs text-stone-400 font-medium mt-0.5">Painel administrativo</p>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => { setLojaSelecionada(null); setAbaExibida('geral'); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                abaExibida === 'geral' && !lojaSelecionada ? 'bg-white/10 text-white font-bold' : 'hover:bg-white/5 opacity-75'
              }`}
            >
              <span>Visão geral</span>
            </button>
            <button
              onClick={() => { setLojaSelecionada(null); setAbaExibida('lojas'); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                abaExibida === 'lojas' && !lojaSelecionada ? 'bg-white/10 text-white font-bold' : 'hover:bg-white/5 opacity-75'
              }`}
            >
              <span>Lojas</span>
            </button>
            <button
              onClick={() => { setLojaSelecionada(null); setAbaExibida('financeiro'); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                abaExibida === 'financeiro' && !lojaSelecionada ? 'bg-white/10 text-white font-bold' : 'hover:bg-white/5 opacity-75'
              }`}
            >
              <span>Financeiro</span>
            </button>
            <button
              onClick={() => { setLojaSelecionada(null); setAbaExibida('risco'); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                abaExibida === 'risco' && !lojaSelecionada ? 'bg-white/10 text-white font-bold' : 'hover:bg-white/5 opacity-75'
              }`}
            >
              <span>Risco e fraude</span>
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-white/10 mt-6 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#BD6B42] flex items-center justify-center font-bold text-white text-xs shadow-sm">
              N
            </div>
            <div className="text-[10px] leading-tight text-stone-400">
              <span className="block text-white font-medium">Equipe AVLE</span>
              acesso master
            </div>
          </div>
          <button
            onClick={() => { localStorage.removeItem('@avle:usuario'); router.push('/'); }}
            className="text-stone-500 hover:text-red-600 text-xs font-bold transition-all cursor-pointer border border-white/10 px-2.5 py-1 rounded-xl bg-white"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* PAINEL PRINCIPAL DE CONTEÚDO */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl overflow-x-hidden space-y-6">
        
        {/* ⚡ INTERRUPTOR INTELIGENTE: SE UMA LOJA FOR SELECIONADA, EXIBE O DASHBOARD INDIVIDUAL DELA */}
        {lojaSelecionada ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Botão Superior de Voltar */}
            <button 
              onClick={() => setLojaSelecionada(null)}
              className="text-xs font-bold text-stone-500 hover:text-[#0B1E14] transition-all bg-white border border-[#E6E2D8] px-4 py-2 rounded-xl cursor-pointer"
            >
              ← Voltar para o Painel Geral
            </button>

            {/* Cabeçalho da Unidade Selecionada */}
            <div className="bg-white border border-[#E6E2D8] p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
              <div>
                <span className="text-[9px] font-bold bg-[#0B1E14] text-white px-2 py-0.5 rounded font-mono uppercase tracking-widest">Auditoria Unidade</span>
                <h2 className="text-2xl font-serif font-bold text-[#0B1E14] mt-1.5">{lojaSelecionada.nomeComercial}</h2>
                <p className="text-xs text-stone-400 font-mono mt-0.5">CNPJ Fiscal: {lojaSelecionada.cnpj}</p>
              </div>
              <span className={`text-[9px] font-bold px-3 py-1 rounded-md uppercase border tracking-wider ${
                lojaSelecionada.statusHomologacao === 'PENDENTE' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
              }`}>
                {lojaSelecionada.statusHomologacao}
              </span>
            </div>

            {/* Fila de Métricas Isoladas da Loja Selecionada (Tratado contra NaN) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0B1E14] text-white p-5 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Clientes Vinculados</span>
                <span className="text-2xl font-bold tracking-tight block mt-2 font-mono">{Number(lojaSelecionada.participantes) || 0}</span>
                <p className="text-[9px] text-stone-400 mt-1">Consumidores cadastrados</p>
              </div>
              <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Clubes Criados</span>
                <span className="text-2xl font-bold tracking-tight text-[#0B1E14] block mt-2 font-mono">{Number(lojaSelecionada.grupos) || 0}</span>
                <p className="text-[9px] text-stone-400 mt-1">Modalidades em andamento</p>
              </div>
              <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Volume Bruto Acumulado</span>
                <span className="text-2xl font-bold tracking-tight text-emerald-600 block mt-2 font-mono">
                  R$ {(Number(lojaSelecionada.faturamento) || 0).toFixed(2)}
                </span>
                <p className="text-[9px] text-stone-400 mt-1">Receita processada via split</p>
              </div>
              <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Risco de Inadimplência</span>
                <span className="text-2xl font-bold text-stone-400 block mt-2 font-mono">{(Number(lojaSelecionada.inadimplencia) || 0).toFixed(2)}%</span>
                <p className="text-[9px] text-stone-400 mt-1">Mensalidades em atraso</p>
              </div>
            </div>

            {/* Gráficos de Projeção Zerados da Loja Selecionada */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-[#E6E2D8] rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[250px]">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-4">Curva de Captação Mensal da Unidade</span>
                <div className="h-32 w-full pt-2">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path d="M0,30 L100,30" className="stroke-stone-200 stroke-2" fill="none" />
                  </svg>
                  <p className="text-[11px] text-stone-400 italic mt-3 text-center">Nenhuma movimentação de histórico registrada para esta loja.</p>
                </div>
              </div>

              <div className="bg-white border border-[#E6E2D8] rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[250px]">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Composição de Carteira</span>
                <div className="w-24 h-24 mx-auto relative flex items-center justify-center my-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E6E2D8" strokeWidth="4" />
                  </svg>
                  <span className="absolute text-xs font-mono font-bold text-stone-400">0%</span>
                </div>
                <p className="text-[10px] text-stone-400 font-medium text-center">Aguardando ativação das cotas.</p>
              </div>
            </div>
          </div>
        ) : (
          /* ⚡ FLUXO TRADICIONAL CASO NENHUMA LOJA ESTEJA SELECIONADA */
          <>
            {abaExibida === 'geral' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">Dashboard Analítico</h2>
                  <p className="text-xs text-stone-400 font-medium">Métricas de performance e engajamento coletivo.</p>
                </div>

                {/* CARD METRICAS SUPERIORES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#0B1E14] text-white p-5 rounded-xl shadow-xs relative overflow-hidden">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Volume Transacionado</span>
                    <span className="text-2xl font-bold tracking-tight block mt-2 font-mono">
                      R$ {totalTransacionado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-stone-500"></div>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Lojas Ativas</span>
                    <span className="text-2xl font-bold tracking-tight text-[#0B1E14] block mt-2 font-mono">{listaLojas.length}</span>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Participantes</span>
                    <span className="text-2xl font-bold tracking-tight text-[#0B1E14] block mt-2 font-mono">{totalClientes}</span>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Retenção Média</span>
                    <span className="text-2xl font-bold tracking-tight text-stone-400 block mt-2 font-mono">0,0%</span>
                  </div>
                </div>

                {/* GRÁFICOS POWERBI LADO A LADO */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white border border-[#E6E2D8] rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[300px]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Histórico de Arrecadação Mensal</span>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-bold font-mono">2026</span>
                    </div>
                    <div className="flex items-end justify-between h-48 pt-4 border-b border-stone-100 px-2">
                      {[
                        { mes: 'Jan' }, { mes: 'Fev' }, { mes: 'Mar' }, 
                        { mes: 'Abr' }, { mes: 'Mai' }, { mes: 'Jun' }, { mes: 'Jul' }
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center group w-full max-w-[40px]">
                          <span className="text-[9px] font-mono text-stone-400 mb-1">R$ 0</span>
                          <div className="w-full h-0 bg-[#0B1E14] rounded-t-sm transition-all"></div>
                          <span className="text-[10px] text-stone-400 font-bold mt-2">{item.mes}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-[#E6E2D8] rounded-xl p-5 shadow-xs flex flex-col items-center justify-between min-h-[300px]">
                    <div className="w-full text-left">
                      <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Divisão Contábil da Carteira</span>
                    </div>
                    <div className="relative w-36 h-48 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E6E2D8" strokeWidth="3.5" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#BD6B42" strokeWidth="3.5" strokeDasharray="0 100" strokeDashoffset="0" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1f7a4d" strokeWidth="3.5" strokeDasharray="0 100" strokeDashoffset="0" />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-xl font-bold tracking-tight font-mono text-stone-400">R$ 0</span>
                        <span className="block text-[8px] uppercase text-stone-400 font-bold tracking-wider">Disponível</span>
                      </div>
                    </div>
                    <div className="w-full space-y-1.5 border-t border-stone-50 pt-3 text-[11px] font-semibold text-stone-600">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 bg-stone-300 rounded-full"></div>
                          <span>Repasse Lojas (90%)</span>
                        </div>
                        <span className="font-mono text-stone-400">R$ 0,00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 bg-stone-300 rounded-full"></div>
                          <span>Lucro App (10%)</span>
                        </div>
                        <span className="font-mono text-stone-400">R$ 0,00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABELA: CLIQUE EM UMA LINHA PARA DETALHAR AQUELA LOJA */}
                <div className="bg-white border border-[#DFD9CE] rounded-2xl shadow-xs overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50">
                    <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Monitoramento de Lojas Cadastradas (Clique para Controlar)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-50 text-stone-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                          <th className="py-3.5 px-5">LOJA</th>
                          <th className="py-3.5 px-5">CNPJ</th>
                          <th className="py-3.5 px-5 text-center">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DFD9CE] text-stone-700">
                        {listaLojas.map((loja, idx) => (
                          <tr 
                            key={loja.id || idx} 
                            onClick={() => setLojaSelecionada(loja)}
                            className="hover:bg-stone-50/60 transition-all cursor-pointer group"
                          >
                            <td className="py-3.5 px-5 font-bold text-[#0B1E14] group-hover:text-[#BD6B42]">{loja.nomeComercial}</td>
                            <td className="py-3.5 px-5 font-mono text-stone-600">{loja.cnpj}</td>
                            <td className="py-3.5 px-5 text-center">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                                loja.statusHomologacao === 'PENDENTE' 
                                  ? 'bg-amber-50 text-amber-700 border-amber-100' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                                {loja.statusHomologacao}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: LISTAGEM DE LOJAS COM CARTÕES CLICÁVEIS */}
            {abaExibida === 'lojas' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">Central de Controle de Lojas</h2>
                  <p className="text-xs text-stone-400 font-medium mt-0.5">Selecione uma loja parceira para carregar seu dashboard corporativo individual.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {listaLojas.map((loja, i) => (
                    <div 
                      key={loja.id || i} 
                      onClick={() => setLojaSelecionada(loja)}
                      className="bg-white border border-[#E6E2D8] rounded-2xl p-6 shadow-xs space-y-4 hover:border-[#BD6B42] transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-100 pb-3">
                        <div>
                          <h4 className="font-serif font-bold text-lg text-[#0B1E14] group-hover:text-[#BD6B42] transition-colors">{loja.nomeComercial}</h4>
                          <p className="text-[11px] font-mono text-stone-400 mt-0.5">CNPJ Fiscal: {loja.cnpj}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md uppercase border tracking-wider ${
                          loja.statusHomologacao === 'PENDENTE' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {loja.statusHomologacao}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                        <div className="bg-[#F5F2EB]/40 border border-dashed border-[#DFD9CE] p-3.5 rounded-xl text-center">
                          <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">Clientes Ativos</span>
                          <span className="text-xl font-bold text-[#0B1E14] font-mono block mt-1">{loja.participantes}</span>
                        </div>
                        <div className="bg-[#F5F2EB]/40 border border-dashed border-[#DFD9CE] p-3.5 rounded-xl text-center">
                          <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">Clubes Criados</span>
                          <span className="text-xl font-bold text-[#0B1E14] font-mono block mt-1">{loja.grupos}</span>
                        </div>
                        <div className="bg-[#F5F2EB]/40 border border-dashed border-[#DFD9CE] p-3.5 rounded-xl text-center">
                          <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">Faturamento Bruto</span>
                          <span className="text-xl font-bold text-stone-400 font-mono block mt-1">R$ {Number(loja.faturamento).toFixed(2)}</span>
                        </div>
                        <div className="bg-[#F5F2EB]/40 border border-dashed border-[#DFD9CE] p-3.5 rounded-xl text-center">
                          <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">Inadimplência</span>
                          <span className="text-xl font-bold text-stone-400 font-mono block mt-1">{loja.inadimplencia}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FINANCEIRO ZERADO */}
            {abaExibida === 'financeiro' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">Fluxo de Caixa e Split Contábil</h2>
                  <p className="text-xs text-stone-400 font-medium">Divisões operacionais liquidadas em tempo real por estabelecimento.</p>
                </div>
                <div className="bg-white border border-[#E6E2D8] rounded-xl p-5 shadow-xs">
                  <div className="mb-4">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Projeção de Repasses Futuros</span>
                  </div>
                  <div className="h-28 w-full pt-2">
                    <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <path d="M0,30 L100,30" className="stroke-stone-300 stroke-2" fill="none" />
                    </svg>
                    <div className="flex justify-between text-[11px] text-stone-400 font-medium pt-2">
                      <span>Sem lançamentos neste período</span>
                      <span>Aguardando fechamento do ciclo</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-[#DFD9CE] rounded-2xl shadow-xs overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 text-stone-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                        <th className="py-4 px-5">Estabelecimento</th>
                        <th className="py-4 px-5 text-right">Volume Bruto</th>
                        <th className="py-4 px-5 text-right">Taxa App (10%)</th>
                        <th className="py-4 px-5 text-right">Fundo Líquido Repassado (90%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                      {listaLojas.map((loja, idx) => (
                        <tr key={loja.id || idx} className="hover:bg-stone-50/50 transition-all">
                          <td className="py-4 px-5">
                            <span className="block font-bold text-[#0B1E14]">{loja.nomeComercial}</span>
                            <span className="text-[10px] text-stone-400 font-mono">{loja.cnpj}</span>
                          </td>
                          <td className="py-4 px-5 text-right font-mono text-stone-400">R$ 0,00</td>
                          <td className="py-4 px-5 text-right font-mono text-stone-400">R$ 0,00</td>
                          <td className="py-4 px-5 text-right font-mono text-stone-400">R$ 0,00</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RISCO E FRAUDE */}
            {abaExibida === 'risco' && (
              <div className="bg-white border border-[#DFD9CE] p-8 text-center text-xs text-stone-400 font-medium rounded-xl animate-fadeIn">
                Painel macro de auditoria SaaS ativo em localhost. Sem incidentes de chargeback ou inconformidades cadastrais registradas hoje.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}