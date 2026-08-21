'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, encerrarSessao } from '../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

export default function DashboardAdmin({ usuario }: { usuario: any }) {
  const router = useRouter();
  const [abaExibida, setAbaExibida] = useState<'geral' | 'lojas' | 'financeiro' | 'risco'>('geral');

  const [lojaSelecionada, setLojaSelecionada] = useState<any | null>(null);
  const [limiteInput, setLimiteInput] = useState<number>(1);

  const [metricas, setMetricas] = useState<any>({
    totalClientes: 0,
    totalLojas: 0,
    totalTransacionado: 0,
    faturamentoPlataforma: 0,
    totalAReceber: 0,
  });

  const [listaLojas, setListaLojas] = useState<any[]>([]);

  // Split consolidado: separa a taxa ja recolhida pelo Asaas da que ficou a
  // receber porque a loja deu baixa manual e o dinheiro nao passou pela
  // plataforma.
  const [split, setSplit] = useState<any | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processandoStatus, setProcessandoStatus] = useState(false);

  const carregarDadosDoBanco = async () => {
    setCarregando(true);

    try {
      const resMetricas = await apiFetch(`${API_URL}/api/financeiro/admin/dashboard`);
      if (resMetricas.ok) {
        const data = await resMetricas.json();
        setMetricas(data);
      }
    } catch (erro) {
    }

    try {
      const resSplit = await apiFetch(`${API_URL}/api/financeiro/admin/split`);
      if (resSplit.ok) setSplit(await resSplit.json());
    } catch (erro) {
      // O painel continua util sem o consolidado; os cards apenas nao aparecem.
    }

    try {
      const resLojas = await apiFetch(`${API_URL}/api/lojas/listar-todas`);
      if (resLojas.ok) {
        const data = await resLojas.json();
        if (Array.isArray(data)) {
          const lojasTratadas = data.map((loja: any) => ({
            ...loja,
            nomeComercial: loja.nomeComercial || loja.nome_comercial || loja.nome || 'Loja Cadastrada',
            cnpj: loja.cnpj || 'Sem CNPJ',
            statusHomologacao: loja.statusHomologacao || 'HOMOLOGADO',
            limiteGruposAtivos: loja.limiteGruposAtivos || 1,
            grupos: loja.grupos || 0,
            participantes: loja.participantes || 0,
            faturamento: Number(loja.faturamento) || 0,
            volumeBruto: Number(loja.volumeBruto) || Number(loja.totalTransacionado) || 0,
            inadimplencia: Number(loja.inadimplencia) || 0,
          }));
          setListaLojas(lojasTratadas);

          if (lojaSelecionada) {
            const lojaAtualizada = lojasTratadas.find((l) => l.id === lojaSelecionada.id);
            if (lojaAtualizada) {
              setLojaSelecionada(lojaAtualizada);
              setLimiteInput(lojaAtualizada.limiteGruposAtivos);
            }
          }
        }
      }
    } catch (erro) {
      setListaLojas([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDadosDoBanco();
  }, []);

  useEffect(() => {
    if(lojaSelecionada) {
       setLimiteInput(lojaSelecionada.limiteGruposAtivos || 1);
    }
  }, [lojaSelecionada]);

  const alterarStatusLoja = async (lojaId: number, novoStatus: string) => {
    setProcessandoStatus(true);
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/status-homologacao`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (!res.ok) throw new Error();

      await carregarDadosDoBanco();
      alert(`Status da loja alterado com sucesso!`);
    } catch (err) {
      alert('Falha ao atualizar o status da loja. Verifique o servidor.');
    } finally {
      setProcessandoStatus(false);
    }
  };

  const alterarLimiteGrupos = async (lojaId: number, limite: number) => {
    setProcessandoStatus(true);
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/limite-grupos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limite }),
      });

      if (!res.ok) throw new Error();

      await carregarDadosDoBanco();
      alert(`Limite de grupos atualizado com sucesso!`);
    } catch (err) {
      alert('Falha ao atualizar o limite. Verifique o servidor.');
    } finally {
      setProcessandoStatus(false);
    }
  };

  const totalTransacionado = Number(metricas?.totalTransacionado) || 0;
  const totalClientes = Number(metricas?.totalClientes) || 0;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F0F2F5] text-[#0B1E14]">
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
            onClick={async () => {
              await encerrarSessao();
              router.push('/');
            }}
            className="text-stone-500 hover:text-red-600 text-xs font-bold transition-all cursor-pointer border border-white/10 px-2.5 py-1 rounded-xl bg-white"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 max-w-7xl overflow-x-hidden space-y-6">
        {lojaSelecionada ? (
          <div className="space-y-6 animate-fadeIn">
            <button
              onClick={() => setLojaSelecionada(null)}
              className="text-xs font-bold text-stone-500 hover:text-[#0B1E14] transition-all bg-white border border-[#E6E2D8] px-4 py-2 rounded-xl cursor-pointer"
            >
              Voltar para o Painel Geral
            </button>

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

            {(() => {
              // Posicao financeira desta unidade. Fica na ficha porque e aqui que
              // a decisao de cobrar acontece: ver a divida na lista geral nao
              // ajuda quem ja abriu a loja para tratar dela.
              const dados = split?.lojas?.find((l: any) => l.lojaId === lojaSelecionada.id);
              if (!dados) return null;

              const aReceber = Number(dados.taxaAReceber) || 0;

              return (
                <div className="bg-white border border-[#E6E2D8] rounded-2xl shadow-xs overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#E6E2D8] bg-stone-50/50">
                    <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Posição do split</h3>
                    <p className="text-[10px] text-stone-400 font-medium">
                      Divisão de {split.percentualAvle}% para a AVLE e {split.percentualLoja}% para a unidade.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#E6E2D8]">
                    <div className="p-5">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Faturamento bruto</span>
                      <span className="text-lg font-bold font-mono text-[#0B1E14] block mt-1">
                        R$ {Number(dados.faturamentoBruto).toFixed(2)}
                      </span>
                    </div>
                    <div className="p-5">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">AVLE ({split.percentualAvle}%)</span>
                      <span className="text-lg font-bold font-mono text-emerald-700 block mt-1">
                        R$ {Number(dados.taxaAvle).toFixed(2)}
                      </span>
                    </div>
                    <div className="p-5">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Unidade ({split.percentualLoja}%)</span>
                      <span className="text-lg font-bold font-mono text-stone-600 block mt-1">
                        R$ {Number(dados.repasseLoja).toFixed(2)}
                      </span>
                    </div>
                    <div className={`p-5 ${aReceber > 0 ? 'bg-amber-50' : ''}`}>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Deve à AVLE</span>
                      <span className={`text-lg font-bold font-mono block mt-1 ${aReceber > 0 ? 'text-amber-800' : 'text-stone-300'}`}>
                        R$ {aReceber.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {aReceber > 0 && (
                    <div className="px-6 py-4 border-t border-[#E6E2D8] bg-amber-50/60">
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        Esta unidade registrou <strong>R$ {Number(dados.brutoBaixaManual).toFixed(2)}</strong> em baixas
                        manuais. Esse dinheiro foi recebido no balcão e não passou pelo Asaas, então os
                        {' '}{split.percentualAvle}% não foram retidos automaticamente: são
                        {' '}<strong>R$ {aReceber.toFixed(2)}</strong> a cobrar da unidade.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="bg-white border border-[#E6E2D8] p-6 rounded-2xl shadow-xs">
              <h3 className="text-sm font-bold text-[#0B1E14] uppercase tracking-wider mb-4">Controle de Expansao de Negocio</h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="w-full sm:w-1/3">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">Limite de Clubes Ativos Simultâneos</label>
                  <input
                    type="number"
                    min="0"
                    value={limiteInput}
                    onChange={(e) => setLimiteInput(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl bg-stone-50 h-[42px] text-sm font-medium focus:outline-none focus:border-[#BD6B42] transition-colors"
                  />
                </div>
                <button
                  disabled={processandoStatus}
                  onClick={() => alterarLimiteGrupos(lojaSelecionada.id, limiteInput)}
                  className="px-6 h-[42px] bg-[#0B1E14] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider hover:bg-opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  Aplicar Limite
                </button>
              </div>
              <p className="text-[10px] text-stone-400 mt-3 leading-relaxed">
                Define a quantidade máxima de clubes ou grupos de compras que esta loja tem permissao para manter operando simultaneamente na plataforma.
              </p>
            </div>

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
                  Risco de Inadimplencia
                </span>
                <span className="text-2xl font-bold text-stone-400 block mt-2 font-mono">
                  {(Number(lojaSelecionada.inadimplencia) || 0).toFixed(2)}%
                </span>
                <p className="text-[9px] text-stone-400 mt-1">Mensalidades em atraso</p>
              </div>
            </div>

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
          <>
            {abaExibida === 'geral' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">Dashboard Analitico</h2>
                    <p className="text-xs text-stone-400 font-medium">Métricas de performance e engajamento coletivo.</p>
                  </div>
                  <button
                    onClick={carregarDadosDoBanco}
                    className="text-xs font-bold text-[#0B1E14] bg-white border border-[#DFD9CE] px-3 py-1.5 rounded-xl hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    Atualizar Dados
                  </button>
                </div>

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
                          <th className="py-3.5 px-5 text-center">LIMITE ATUAL</th>
                          <th className="py-3.5 px-5 text-center">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DFD9CE] text-stone-700">
                        {carregando ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-stone-400 italic font-medium">
                              Carregando lojas cadastradas...
                            </td>
                          </tr>
                        ) : listaLojas.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-stone-400 italic font-medium">
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
                              <td className="py-3.5 px-5 text-center font-mono font-bold text-[#0B1E14]">
                                {loja.limiteGruposAtivos || 1}
                              </td>
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
                            <p className="text-[11px] font-mono text-stone-400 mt-0.5">CNPJ Fiscal: {loja.cnpj} | Limite Permitido: {loja.limiteGruposAtivos || 1}</p>
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
                              Inadimplencia
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

            {abaExibida === 'financeiro' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">Fluxo de Caixa e Split Contábil</h2>
                  <p className="text-xs text-stone-400 font-medium">
                    Divisão de 10% para a AVLE e 90% para a loja, sobre cada entrada registrada.
                  </p>
                </div>

                {split && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-[#DFD9CE] rounded-2xl p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Faturamento bruto</span>
                      <span className="text-2xl font-bold font-mono text-[#0B1E14] block mt-1">
                        R$ {Number(split.faturamentoBruto).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-stone-400">base de cálculo do split</span>
                    </div>

                    <div className="bg-white border border-[#DFD9CE] rounded-2xl p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        AVLE · {split.percentualAvle}%
                      </span>
                      <span className="text-2xl font-bold font-mono text-emerald-700 block mt-1">
                        R$ {Number(split.taxaAvleTotal).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-stone-400">taxa de administração total</span>
                    </div>

                    <div className="bg-white border border-[#DFD9CE] rounded-2xl p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        Lojas · {split.percentualLoja}%
                      </span>
                      <span className="text-2xl font-bold font-mono text-stone-600 block mt-1">
                        R$ {Number(split.repasseLojaTotal).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-stone-400">repasse às unidades</span>
                    </div>

                    <div className={`rounded-2xl p-5 shadow-xs border ${
                      Number(split.taxaAReceber) > 0
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-[#DFD9CE]'
                    }`}>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">A receber das lojas</span>
                      <span className={`text-2xl font-bold font-mono block mt-1 ${
                        Number(split.taxaAReceber) > 0 ? 'text-amber-800' : 'text-stone-400'
                      }`}>
                        R$ {Number(split.taxaAReceber).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {Number(split.taxaAReceber) > 0
                          ? 'baixa manual: dinheiro não passou pela plataforma'
                          : 'nada pendente'}
                      </span>
                    </div>
                  </div>
                )}

                {split && Number(split.taxaAReceber) > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      <strong>R$ {Number(split.brutoBaixaManual).toFixed(2)}</strong> entraram por baixa manual, ou seja,
                      a cliente pagou direto na loja e o valor não passou pelo Asaas. Como o split só acontece dentro do
                      pagamento, os <strong>{split.percentualAvle}%</strong> desse montante não foram recolhidos e
                      seguem como crédito da AVLE contra as unidades, listado abaixo.
                    </p>
                  </div>
                )}
                <div className="bg-white border border-[#DFD9CE] rounded-2xl shadow-xs overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 text-stone-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                        <th className="py-4 px-5">Estabelecimento</th>
                        <th className="py-4 px-5 text-right">Faturamento bruto</th>
                        <th className="py-4 px-5 text-right">AVLE (10%)</th>
                        <th className="py-4 px-5 text-right">Loja (90%)</th>
                        <th className="py-4 px-5 text-right">A receber</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                      {listaLojas.map((loja, idx) => {
                        // Prefere os numeros do consolidado, que separam a taxa ja
                        // recolhida da pendente. Sem ele, cai no calculo antigo
                        // sobre o volume bruto conhecido pela lista de lojas.
                        const doSplit = split?.lojas?.find((l: any) => l.lojaId === loja.id);
                        const bruto = Number(doSplit?.faturamentoBruto ?? loja.volumeBruto) || 0;
                        const taxaApp = Number(doSplit?.taxaAvle ?? bruto * 0.10);
                        const repasseLoja = Number(doSplit?.repasseLoja ?? bruto * 0.90);
                        const aReceber = Number(doSplit?.taxaAReceber ?? 0);

                        return (
                          <tr key={loja.id || idx} className="hover:bg-stone-50/50 transition-all">
                            <td className="py-4 px-5">
                              <span className="block font-bold text-[#0B1E14]">{loja.nomeComercial}</span>
                              <span className="text-[10px] text-stone-400 font-mono">{loja.cnpj}</span>
                            </td>
                            <td className="py-4 px-5 text-right font-mono font-bold text-[#0B1E14]">
                              R$ {bruto.toFixed(2)}
                            </td>
                            <td className="py-4 px-5 text-right font-mono text-emerald-700 font-bold">
                              R$ {taxaApp.toFixed(2)}
                            </td>
                            <td className="py-4 px-5 text-right font-mono text-stone-600 font-bold">
                              R$ {repasseLoja.toFixed(2)}
                            </td>
                            <td className={`py-4 px-5 text-right font-mono font-bold ${
                              aReceber > 0 ? 'text-amber-700' : 'text-stone-300'
                            }`}>
                              R$ {aReceber.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {abaExibida === 'risco' && (
              <div className="space-y-6 animate-fadeIn text-left">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">Central de Risco, Compliance e Fraude</h2>
                  <p className="text-xs text-stone-400 font-medium mt-0.5">
                    Monitoramento em tempo real de contestações, inconsistencias cadastrais e integridade dos grupos.
                  </p>
                </div>

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
                      Inadimplencia Global
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white border border-[#DFD9CE] rounded-2xl shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50 flex justify-between items-center">
                      <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">
                        Lojas com Pendencias de Compliance
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
                        <span>Validação Bancaria</span>
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