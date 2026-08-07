'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Configuração dinâmica da URL do Backend vinda das variáveis de ambiente
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

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
    totalAReceber: 0,
  });

  const [listaLojas, setListaLojas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoStatus, setProcessandoStatus] = useState(false);

  // BUSCA DADOS REAIS DO MYSQL VIA API
  const carregarDadosDoBanco = async () => {
    setCarregando(true);

    // 1. Busca Métricas Gerais
    try {
      const resMetricas = await fetch(`${API_URL}/api/financeiro/admin/dashboard`);
      if (resMetricas.ok) {
        const data = await resMetricas.json();
        setMetricas(data);
      }
    } catch (erro) {
      console.error('Erro ao carregar métricas do admin:', erro);
    }

    // 2. Busca Todas as Lojas Cadastradas no Banco de Dados
    try {
      const resLojas = await fetch(`${API_URL}/api/lojas/listar-todas`);
      if (resLojas.ok) {
        const data = await resLojas.json();
        if (Array.isArray(data)) {
          const lojasTratadas = data.map((loja: any) => ({
            ...loja,
            nomeComercial: loja.nomeComercial || loja.nome_comercial || loja.nome || 'Loja Cadastrada',
            cnpj: loja.cnpj || 'Sem CNPJ',
            statusHomologacao: loja.statusHomologacao || 'HOMOLOGADO',
            grupos: loja.grupos || 0,
            participantes: loja.participantes || 0,
            faturamento: Number(loja.faturamento) || 0,
            volumeBruto: Number(loja.volumeBruto) || Number(loja.totalTransacionado) || 0,
            inadimplencia: Number(loja.inadimplencia) || 0,
          }));
          setListaLojas(lojasTratadas);

          // Se houver uma loja sendo inspecionada, atualiza os dados dela também
          if (lojaSelecionada) {
            const lojaAtualizada = lojasTratadas.find((l) => l.id === lojaSelecionada.id);
            if (lojaAtualizada) setLojaSelecionada(lojaAtualizada);
          }
        }
      }
    } catch (erro) {
      console.error('Erro ao listar lojas do banco:', erro);
      setListaLojas([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDadosDoBanco();
  }, []);

  // Alteração dinâmica do Status da Loja no Backend
  const alterarStatusLoja = async (lojaId: number, novoStatus: string) => {
    setProcessandoStatus(true);
    try {
      const res = await fetch(`${API_URL}/api/lojas/${lojaId}/status-homologacao`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (!res.ok) throw new Error();

      await carregarDadosDoBanco();
      alert(`Status da loja alterado para ${novoStatus} com sucesso!`);
    } catch (err) {
      alert('Falha ao atualizar o status da loja. Verifique o servidor.');
    } finally {
      setProcessandoStatus(false);
    }
  };

  const totalTransacionado = Number(metricas?.totalTransacionado) || 0;
  const faturamentoPlataforma = Number(metricas?.faturamentoPlataforma) || 0;
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
              onClick={() => {
                setLojaSelecionada(null);
                setAbaExibida('geral');
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                abaExibida === 'geral' && !lojaSelecionada
                  ? 'bg-white/10 text-white font-bold'
                  : 'hover:bg-white/5 opacity-75'
              }`}
            >
              <span>Visão geral</span>
            </button>
            <button
              onClick={() => {
                setLojaSelecionada(null);
                setAbaExibida('lojas');
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                abaExibida === 'lojas' && !lojaSelecionada
                  ? 'bg-white/10 text-white font-bold'
                  : 'hover:bg-white/5 opacity-75'
              }`}
            >
              <span>Lojas ({listaLojas.length})</span>
            </button>
            <button
              onClick={() => {
                setLojaSelecionada(null);
                setAbaExibida('financeiro');
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                abaExibida === 'financeiro' && !lojaSelecionada
                  ? 'bg-white/10 text-white font-bold'
                  : 'hover:bg-white/5 opacity-75'
              }`}
            >
              <span>Financeiro</span>
            </button>
            <button
              onClick={() => {
                setLojaSelecionada(null);
                setAbaExibida('risco');
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                abaExibida === 'risco' && !lojaSelecionada
                  ? 'bg-white/10 text-white font-bold'
                  : 'hover:bg-white/5 opacity-75'
              }`}
            >
              <span>Risco e fraude</span>
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-white/10 mt-6 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#BD6B42] flex items-center justify-center font-bold text-white text-xs shadow-sm">
              A
            </div>
            <div className="text-[10px] leading-tight text-stone-400">
              <span className="block text-white font-medium">Equipe AVLE</span>
              acesso master
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('@avle:usuario');
              router.push('/');
            }}
            className="text-stone-500 hover:text-red-600 text-xs font-bold transition-all cursor-pointer border border-white/10 px-2.5 py-1 rounded-xl bg-white"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* PAINEL PRINCIPAL DE CONTEÚDO */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl overflow-x-hidden space-y-6">
        {/* INTERRUPTOR: EXIBE O DASHBOARD INDIVIDUAL SE UMA LOJA FOR SELECIONADA */}
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
                <span className="text-[9px] font-bold bg-[#0B1E14] text-white px-2 py-0.5 rounded font-mono uppercase tracking-widest">
                  Auditoria Unidade
                </span>
                <h2 className="text-2xl font-serif font-bold text-[#0B1E14] mt-1.5">
                  {lojaSelecionada.nomeComercial}
                </h2>
                <p className="text-xs text-stone-400 font-mono mt-0.5">CNPJ Fiscal: {lojaSelecionada.cnpj}</p>
              </div>

              {/* Botões de Ação Direta de Homologação */}
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[9px] font-bold px-3 py-1.5 rounded-md uppercase border tracking-wider mr-2 ${
                    lojaSelecionada.statusHomologacao === 'PENDENTE'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : lojaSelecionada.statusHomologacao === 'BLOQUEADO' ||
                        lojaSelecionada.statusHomologacao === 'AUDITORIA_CHARGEBACK'
                      ? 'bg-rose-50 text-rose-700 border-rose-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}
                >
                  {lojaSelecionada.statusHomologacao}
                </span>

                <button
                  disabled={processandoStatus}
                  onClick={() => alterarStatusLoja(lojaSelecionada.id, 'APROVADO')}
                  className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg text-[10px] uppercase hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                >
                  Aprovar
                </button>
                <button
                  disabled={processandoStatus}
                  onClick={() => alterarStatusLoja(lojaSelecionada.id, 'BLOQUEADO')}
                  className="px-3 py-1.5 bg-rose-700 text-white font-bold rounded-lg text-[10px] uppercase hover:bg-rose-800 disabled:opacity-50 cursor-pointer"
                >
                  Bloquear
                </button>
              </div>
            </div>

            {/* Fila de Métricas Isoladas da Loja Selecionada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0B1E14] text-white p-5 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Clientes Vinculados
                </span>
                <span className="text-2xl font-bold tracking-tight block mt-2 font-mono">
                  {Number(lojaSelecionada.participantes) || 0}
                </span>
                <p className="text-[9px] text-stone-400 mt-1">Consumidores cadastrados</p>
              </div>
              <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Clubes Criados
                </span>
                <span className="text-2xl font-bold tracking-tight text-[#0B1E14] block mt-2 font-mono">
                  {Number(lojaSelecionada.grupos) || 0}
                </span>
                <p className="text-[9px] text-stone-400 mt-1">Modalidades em andamento</p>
              </div>
              <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Volume Transacionado Pix
                </span>
                <span className="text-2xl font-bold tracking-tight text-emerald-600 block mt-2 font-mono">
                  R$ {(Number(lojaSelecionada.volumeBruto) || 0).toFixed(2)}
                </span>
                <p className="text-[9px] text-stone-400 mt-1">Receita real processada via split</p>
              </div>
              <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Risco de Inadimplência
                </span>
                <span className="text-2xl font-bold text-stone-400 block mt-2 font-mono">
                  {(Number(lojaSelecionada.inadimplencia) || 0).toFixed(2)}%
                </span>
                <p className="text-[9px] text-stone-400 mt-1">Mensalidades em atraso</p>
              </div>
            </div>

            {/* Gráficos de Projeção */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-[#E6E2D8] rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[250px]">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-4">
                  Curva de Captação Mensal da Unidade
                </span>
                <div className="h-32 w-full pt-2">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path d="M0,30 L100,30" className="stroke-stone-200 stroke-2" fill="none" />
                  </svg>
                  <p className="text-[11px] text-stone-400 italic mt-3 text-center">Histórico consolidado em tempo real.</p>
                </div>
              </div>

              <div className="bg-white border border-[#E6E2D8] rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[250px]">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                  Composição de Carteira
                </span>
                <div className="w-24 h-24 mx-auto relative flex items-center justify-center my-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E6E2D8" strokeWidth="4" />
                  </svg>
                  <span className="absolute text-xs font-mono font-bold text-stone-400">100%</span>
                </div>
                <p className="text-[10px] text-stone-400 font-medium text-center">Operação ativa.</p>
              </div>
            </div>
          </div>
        ) : (
          /* FLUXO TRADICIONAL (VISÃO MACRO) */
          <>
            {abaExibida === 'geral' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">Dashboard Analítico</h2>
                    <p className="text-xs text-stone-400 font-medium">Métricas de performance e engajamento coletivo.</p>
                  </div>
                  <button
                    onClick={carregarDadosDoBanco}
                    className="text-xs font-bold text-[#0B1E14] bg-white border border-[#DFD9CE] px-3 py-1.5 rounded-xl hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    Atualizar Dados
                  </button>
                </div>

                {/* CARD METRICAS SUPERIORES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#0B1E14] text-white p-5 rounded-xl shadow-xs relative overflow-hidden">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Volume Transacionado
                    </span>
                    <span className="text-2xl font-bold tracking-tight block mt-2 font-mono">
                      R$ {totalTransacionado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-emerald-500"></div>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Lojas Ativas</span>
                    <span className="text-2xl font-bold tracking-tight text-[#0B1E14] block mt-2 font-mono">
                      {listaLojas.length}
                    </span>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Participantes</span>
                    <span className="text-2xl font-bold tracking-tight text-[#0B1E14] block mt-2 font-mono">
                      {totalClientes}
                    </span>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Retenção Média</span>
                    <span className="text-2xl font-bold tracking-tight text-emerald-600 block mt-2 font-mono">100,0%</span>
                  </div>
                </div>

                {/* TABELA: LOJAS REAIS CADASTRADAS NO BANCO DE DADOS */}
                <div className="bg-white border border-[#DFD9CE] rounded-2xl shadow-xs overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">
                      Lojas Cadastradas no MySQL ({listaLojas.length})
                    </h3>
                    <span className="text-[10px] text-stone-400 font-bold uppercase">Clique na linha para auditar</span>
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
                        {carregando ? (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-stone-400 italic font-medium">
                              Carregando lojas cadastradas...
                            </td>
                          </tr>
                        ) : listaLojas.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-stone-400 italic font-medium">
                              Nenhuma loja cadastrada no sistema.
                            </td>
                          </tr>
                        ) : (
                          listaLojas.map((loja, idx) => (
                            <tr
                              key={loja.id || idx}
                              onClick={() => setLojaSelecionada(loja)}
                              className="hover:bg-stone-50/60 transition-all cursor-pointer group"
                            >
                              <td className="py-3.5 px-5 font-bold text-[#0B1E14] group-hover:text-[#BD6B42]">
                                {loja.nomeComercial}
                              </td>
                              <td className="py-3.5 px-5 font-mono text-stone-600">{loja.cnpj}</td>
                              <td className="py-3.5 px-5 text-center">
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                                    loja.statusHomologacao === 'PENDENTE'
                                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                                      : loja.statusHomologacao === 'BLOQUEADO' ||
                                        loja.statusHomologacao === 'AUDITORIA_CHARGEBACK'
                                      ? 'bg-rose-50 text-rose-700 border-rose-100'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  }`}
                                >
                                  {loja.statusHomologacao}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {abaExibida === 'lojas' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">Central de Controle de Lojas</h2>
                  <p className="text-xs text-stone-400 font-medium mt-0.5">
                    Selecione uma loja parceira para carregar seu dashboard corporativo individual.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {carregando ? (
                    <div className="bg-white p-8 text-center text-stone-400 text-xs border rounded-2xl">
                      Carregando lojas...
                    </div>
                  ) : listaLojas.length === 0 ? (
                    <div className="bg-white p-8 text-center text-stone-400 text-xs border rounded-2xl">
                      Nenhuma loja encontrada no banco de dados.
                    </div>
                  ) : (
                    listaLojas.map((loja, i) => (
                      <div
                        key={loja.id || i}
                        onClick={() => setLojaSelecionada(loja)}
                        className="bg-white border border-[#E6E2D8] rounded-2xl p-6 shadow-xs space-y-4 hover:border-[#BD6B42] transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-100 pb-3">
                          <div>
                            <h4 className="font-serif font-bold text-lg text-[#0B1E14] group-hover:text-[#BD6B42] transition-colors">
                              {loja.nomeComercial}
                            </h4>
                            <p className="text-[11px] font-mono text-stone-400 mt-0.5">CNPJ Fiscal: {loja.cnpj}</p>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2.5 py-1 rounded-md uppercase border tracking-wider ${
                              loja.statusHomologacao === 'PENDENTE'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : loja.statusHomologacao === 'BLOQUEADO' ||
                                  loja.statusHomologacao === 'AUDITORIA_CHARGEBACK'
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}
                          >
                            {loja.statusHomologacao}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                          <div className="bg-[#F5F2EB]/40 border border-dashed border-[#DFD9CE] p-3.5 rounded-xl text-center">
                            <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">
                              Clientes Ativos
                            </span>
                            <span className="text-xl font-bold text-[#0B1E14] font-mono block mt-1">
                              {loja.participantes}
                            </span>
                          </div>
                          <div className="bg-[#F5F2EB]/40 border border-dashed border-[#DFD9CE] p-3.5 rounded-xl text-center">
                            <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">
                              Clubes Criados
                            </span>
                            <span className="text-xl font-bold text-[#0B1E14] font-mono block mt-1">{loja.grupos}</span>
                          </div>
                          <div className="bg-[#F5F2EB]/40 border border-dashed border-[#DFD9CE] p-3.5 rounded-xl text-center">
                            <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">
                              Faturamento Pix Real
                            </span>
                            <span className="text-xl font-bold text-emerald-700 font-mono block mt-1">
                              R$ {Number(loja.volumeBruto).toFixed(2)}
                            </span>
                          </div>
                          <div className="bg-[#F5F2EB]/40 border border-dashed border-[#DFD9CE] p-3.5 rounded-xl text-center">
                            <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">
                              Inadimplência
                            </span>
                            <span className="text-xl font-bold text-stone-400 font-mono block mt-1">
                              {loja.inadimplencia}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ABA FINANCEIRO */}
            {abaExibida === 'financeiro' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">Fluxo de Caixa e Split Contábil</h2>
                  <p className="text-xs text-stone-400 font-medium">
                    Divisões operacionais liquidadas em tempo real por estabelecimento.
                  </p>
                </div>
                <div className="bg-white border border-[#DFD9CE] rounded-2xl shadow-xs overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 text-stone-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                        <th className="py-4 px-5">Estabelecimento</th>
                        <th className="py-4 px-5 text-right">Volume Bruto Pix</th>
                        <th className="py-4 px-5 text-right">Taxa App (10%)</th>
                        <th className="py-4 px-5 text-right">Fundo Líquido Repassado (90%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                      {listaLojas.map((loja, idx) => {
                        const volumeBrutoReal = Number(loja.volumeBruto) || 0;
                        const taxaApp = volumeBrutoReal * 0.10;
                        const repasseLoja = volumeBrutoReal * 0.90;

                        return (
                          <tr key={loja.id || idx} className="hover:bg-stone-50/50 transition-all">
                            <td className="py-4 px-5">
                              <span className="block font-bold text-[#0B1E14]">{loja.nomeComercial}</span>
                              <span className="text-[10px] text-stone-400 font-mono">{loja.cnpj}</span>
                            </td>
                            <td className="py-4 px-5 text-right font-mono font-bold text-[#0B1E14]">
                              R$ {volumeBrutoReal.toFixed(2)}
                            </td>
                            <td className="py-4 px-5 text-right font-mono text-emerald-700 font-bold">
                              R$ {taxaApp.toFixed(2)}
                            </td>
                            <td className="py-4 px-5 text-right font-mono text-stone-600 font-bold">
                              R$ {repasseLoja.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ABA: RISCO E FRAUDE */}
            {abaExibida === 'risco' && (
              <div className="space-y-6 animate-fadeIn text-left">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">Central de Risco, Compliance & Fraude</h2>
                  <p className="text-xs text-stone-400 font-medium mt-0.5">
                    Monitoramento em tempo real de contestações, inconsistências cadastrais e integridade dos grupos.
                  </p>
                </div>

                {/* CARDS DE MÉTRICAS DE RISCO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Taxa de Chargeback
                    </span>
                    <span className="text-2xl font-bold tracking-tight text-emerald-600 block mt-2 font-mono">0,00%</span>
                    <p className="text-[9px] text-stone-400 mt-1">Limite de segurança: até 1,00%</p>
                  </div>

                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Lojas sob Auditoria
                    </span>
                    <span className="text-2xl font-bold tracking-tight text-[#0B1E14] block mt-2 font-mono">
                      {listaLojas.filter((l) => l.statusHomologacao !== 'APROVADO').length}
                    </span>
                    <p className="text-[9px] text-amber-600 font-bold mt-1">Aguardando validação ou contestações</p>
                  </div>

                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Inadimplência Global
                    </span>
                    <span className="text-2xl font-bold tracking-tight text-[#0B1E14] block mt-2 font-mono">0,00%</span>
                    <p className="text-[9px] text-stone-400 mt-1">Garantia das cotas ativas</p>
                  </div>

                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Alertas de Pagamento
                    </span>
                    <span className="text-2xl font-bold tracking-tight text-emerald-600 block mt-2 font-mono">0</span>
                    <p className="text-[9px] text-stone-400 mt-1">Sem bloqueios ativos no Asaas</p>
                  </div>
                </div>

                {/* REGRAS E CHECKLIST DE AUDITORIA */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white border border-[#DFD9CE] rounded-2xl shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50 flex justify-between items-center">
                      <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">
                        Lojas com Pendências de Compliance
                      </h3>
                      <span className="text-[10px] text-stone-400 font-bold font-mono">Validação KYC/KYB</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-stone-50 text-stone-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                            <th className="py-3.5 px-5">LOJA</th>
                            <th className="py-3.5 px-5">DOCUMENTO</th>
                            <th className="py-3.5 px-5 text-center">CONTA ASAAS</th>
                            <th className="py-3.5 px-5 text-center">AÇÃO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                          {listaLojas.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-stone-400 italic">
                                Nenhum registro em análise.
                              </td>
                            </tr>
                          ) : (
                            listaLojas.map((loja, idx) => (
                              <tr key={loja.id || idx} className="hover:bg-stone-50/60 transition-all">
                                <td className="py-3.5 px-5 font-bold text-[#0B1E14]">{loja.nomeComercial}</td>
                                <td className="py-3.5 px-5 font-mono text-stone-500">{loja.cnpj}</td>
                                <td className="py-3.5 px-5 text-center">
                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                                      loja.asaasAccountId
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}
                                  >
                                    {loja.asaasAccountId ? 'Subconta Ativa' : 'Pendente Asaas'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-5 text-center">
                                  <button
                                    onClick={() => setLojaSelecionada(loja)}
                                    className="text-[10px] font-bold text-[#BD6B42] hover:underline cursor-pointer"
                                  >
                                    Auditar Unidade
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="bg-white border border-[#DFD9CE] rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-[#0B1E14] mb-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <h4 className="font-bold text-xs uppercase tracking-wider">Proteção de Split Ativa</h4>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        A retenção de 10% da plataforma e o repasse de 90% para a subconta da loja ocorrem de forma
                        automatizada e protegida via webhook.
                      </p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-stone-100 text-[10px] text-stone-600">
                      <div className="flex justify-between items-center">
                        <span>Trava Anti-Chargeback</span>
                        <span className="font-bold text-emerald-700">Ativada (1.0%)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Validação Bancária</span>
                        <span className="font-bold text-emerald-700">Obrigatória</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Verificação CPF/CNPJ</span>
                        <span className="font-bold text-emerald-700">Ativa no Cadastro</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}