'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { SorteioResumo, mensagemDeErro } from '../lib/contemplacao';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

export default function PainelAdminSaaS() {
  const router = useRouter();
  // 🔄 Sistema expandido para 4 abas estilo SaaS
  const [abaAtiva, setAbaAtiva] = useState<'visao' | 'lojas' | 'sorteio' | 'cadastro'>('visao');
  
  // 🏪 Conexões SaaS: Lojas e Faturamento Global
  const [lojasPendentes, setLojasPendentes] = useState<any[]>([]);
  const [loadingLojas, setLoadingLojas] = useState(false);
  const [metricasSaaS, setMetricasSaaS] = useState({
    totalClientes: 0,
    totalLojasAtivas: 0,
    totalClubesAndamento: 0,
    faturamentoGlobal: 0.0
  });

  // Seus Estados Originais para a Execução do Sorteio
  const [grupoSorteioId, setGrupoSorteioId] = useState('');
  const [listaGrupos, setListaGrupos] = useState<any[]>([]);
  const [dataCorteSorteio, setDataCorteSorteio] = useState('');
  const [sorteiosDoGrupo, setSorteiosDoGrupo] = useState<SorteioResumo[]>([]);
  const [erroSorteio, setErroSorteio] = useState('');
  const [loadingSorteio, setLoadingSorteio] = useState(false);

  // Seus Estados Originais para o Cadastro de Novo Grupo
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [valorParcela, setValorParcela] = useState('');
  const [duracaoMeses, setDuracaoMeses] = useState('');
  const [qtdMaxCotas, setQtdMaxCotas] = useState('');
  const [sucessoGrupo, setSucessoGrupo] = useState('');
  const [erroGrupo, setErroGrupo] = useState('');
  const [loadingGrupo, setLoadingGrupo] = useState(false);

  // 📡 Conexão 1: Carrega faturamento e métricas globais do ecossistema SaaS
  useEffect(() => {
    if (abaAtiva === 'visao') {
      fetch(`${API_URL}/api/admin/metricas-globais`)
        .then((res) => res.json())
        .then((data) => setMetricasSaaS(data))
        .catch((err) => console.error('Erro ao buscar métricas SaaS:', err));
    }
  }, [abaAtiva]);

  // Grupos de todas as lojas, para o sorteio ser agendado escolhendo o nome do
  // grupo em vez de exigir o id numerico decorado.
  useEffect(() => {
    if (abaAtiva === 'sorteio') {
      fetch(`${API_URL}/api/grupos`)
        .then((res) => res.json())
        .then((data) => setListaGrupos(Array.isArray(data) ? data : []))
        .catch(() => setListaGrupos([]));
    }
  }, [abaAtiva]);

  // 📡 Conexão 2: Carrega inquilinos (lojas) aguardando ativação na plataforma
  useEffect(() => {
    if (abaAtiva === 'lojas') {
      setLoadingLojas(true);
      fetch(`${API_URL}/api/admin/lojas/pendentes`)
        .then((res) => res.json())
        .then((data) => {
          setLojasPendentes(data);
          setLoadingLojas(false);
        })
        .catch((err) => {
          console.error('Erro ao buscar lojistas pendentes:', err);
          setLoadingLojas(false);
        });
    }
  }, [abaAtiva]);

  // ⚡ Conexão 3: Homologar/Ativar Loja Parceira no ecossistema
  const handleAprovarLoja = async (lojaId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/lojas/${lojaId}/aprovar`, {
        method: 'PUT'
      });
      if (!res.ok) throw new Error('Não foi possível ativar esta loja.');
      
      alert('🏪 Loja integrada e habilitada a criar seus próprios clubes!');
      setLojasPendentes(prev => prev.filter(loja => loja.id !== lojaId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Sorteio em duas fases: agendar congela a lista, apurar le a Loteria Federal.
  // A rota instantanea anterior continua no backend, mas não deixa registro
  // conferivel - por isso o painel deixou de usa-la.
  const carregarSorteios = async (grupoId: string) => {
    if (!grupoId) { setSorteiosDoGrupo([]); return; }
    try {
      const res = await fetch(`${API_URL}/api/sorteios/grupo/${grupoId}`);
      if (!res.ok) return;
      const dados = await res.json();
      setSorteiosDoGrupo(Array.isArray(dados) ? dados : []);
    } catch {
      // lista vazia já comunica que não ha o que mostrar
    }
  };

  const agendarSorteio = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSorteio('');
    setLoadingSorteio(true);

    try {
      const res = await fetch(`${API_URL}/api/sorteios/agendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupoId: Number(grupoSorteioId),
          dataCorte: dataCorteSorteio || undefined,
        }),
      });

      const dados = await res.json().catch(() => null);
      if (!res.ok) throw new Error(dados?.erro || 'Falha ao agendar o sorteio.');

      await carregarSorteios(grupoSorteioId);
    } catch (err) {
      setErroSorteio(mensagemDeErro(err, 'Falha ao agendar o sorteio.'));
    } finally {
      setLoadingSorteio(false);
    }
  };

  const apurarSorteio = async (sorteioId: number) => {
    setErroSorteio('');
    setLoadingSorteio(true);
    try {
      const res = await fetch(`${API_URL}/api/sorteios/${sorteioId}/apurar`, { method: 'POST' });
      const dados = await res.json().catch(() => null);
      if (!res.ok) throw new Error(dados?.erro || 'Falha ao apurar.');

      await carregarSorteios(grupoSorteioId);
    } catch (err) {
      setErroSorteio(mensagemDeErro(err, 'Falha ao apurar o sorteio.'));
    } finally {
      setLoadingSorteio(false);
    }
  };

  // 🏪 SEU DISPARO DE CRIAÇÃO DE NOVO GRUPO ORIGINAL
  const criarGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroGrupo('');
    setSucessoGrupo('');
    setLoadingGrupo(true);

    try {
      const res = await fetch(`${API_URL}/api/grupos/criar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeGrupo,
          valorParcela: parseFloat(valorParcela),
          duracaoMeses: parseInt(duracaoMeses),
          quantidadeMaxCotas: parseInt(qtdMaxCotas)
        })
      });

      if (!res.ok) {
        throw new Error('Erro técnico ao salvar o grupo de compras no banco.');
      }

      setSucessoGrupo(`Grupo "${nomeGrupo}" lançado no sistema com sucesso!`);
      setNomeGrupo('');
      setValorParcela('');
      setDuracaoMeses('');
      setQtdMaxCotas('');

    } catch (err: any) {
      setErroGrupo(err.message);
    } finally {
      setLoadingGrupo(false);
    }
  };

  return (
    <div className="min-h-screen bg-avle-bege flex flex-col items-center p-4 pb-24 text-avle-texto select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200/60 flex flex-col transition-all duration-300">
        
        {/* Cabeçalho administrativo SaaS */}
        <div className="bg-stone-900 p-6 text-center border-b border-stone-800">
          <span className="text-[10px] font-extrabold text-white bg-avle-terracotta px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
            🛡️ Central Master SaaS
          </span>
          <h2 className="text-white text-lg font-bold mt-3">Infraestrutura AVLE</h2>
        </div>

        {/* Sub-Navegação Operacional de Abas */}
        <div className="grid grid-cols-4 border-b border-stone-100 bg-stone-50/50 text-center">
          <button type="button" onClick={() => setAbaAtiva('visao')} className={`py-3 font-bold text-[10px] uppercase tracking-wider transition-all ${abaAtiva === 'visao' ? 'text-avle-terracotta border-b-2 border-avle-terracotta bg-white' : 'text-stone-400'}`}>Painel</button>
          <button type="button" onClick={() => setAbaAtiva('lojas')} className={`py-3 font-bold text-[10px] uppercase tracking-wider transition-all ${abaAtiva === 'lojas' ? 'text-avle-terracotta border-b-2 border-avle-terracotta bg-white' : 'text-stone-400'}`}>Lojas</button>
          <button type="button" onClick={() => setAbaAtiva('sorteio')} className={`py-3 font-bold text-[10px] uppercase tracking-wider transition-all ${abaAtiva === 'sorteio' ? 'text-avle-terracotta border-b-2 border-avle-terracotta bg-white' : 'text-stone-400'}`}>Sorteios</button>
          <button type="button" onClick={() => setAbaAtiva('cadastro')} className={`py-3 font-bold text-[10px] uppercase tracking-wider transition-all ${abaAtiva === 'cadastro' ? 'text-avle-terracotta border-b-2 border-avle-terracotta bg-white' : 'text-stone-400'}`}>Grupos</button>
        </div>

        <div className="p-6">
          
          {/* ---------------- ABA A: VISÃO GLOBAL SAAS ---------------- */}
          {abaAtiva === 'visao' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-stone-400 leading-relaxed">Faturamento financeiro consolidado e volume operacional da sua infraestrutura.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <span className="text-[9px] block font-bold text-stone-400 uppercase">Faturamento Geral</span>
                  <span className="text-base font-black text-emerald-600">R$ {metricasSaaS.faturamentoGlobal.toFixed(2)}</span>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <span className="text-[9px] block font-bold text-stone-400 uppercase">Clientes Totais</span>
                  <span className="text-base font-black text-stone-800">{metricasSaaS.totalClientes}</span>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <span className="text-[9px] block font-bold text-stone-400 uppercase">Lojas Ativas</span>
                  <span className="text-base font-black text-stone-800">{metricasSaaS.totalLojasAtivas}</span>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <span className="text-[9px] block font-bold text-stone-400 uppercase">Clubes Rodando</span>
                  <span className="text-base font-black text-stone-800">{metricasSaaS.totalClubesAndamento}</span>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- ABA B: HOMOLOGAÇÃO DE INQUILINOS (LOJAS) ---------------- */}
          {abaAtiva === 'lojas' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-stone-400 leading-relaxed">Cadastros novos aguardando sua liberação comercial para operar.</p>
              
              {loadingLojas ? (
                <p className="text-center text-xs text-stone-400 py-6">Consultando banco relacional...</p>
              ) : lojasPendentes.length === 0 ? (
                <p className="text-center text-xs font-bold text-stone-400 py-6">🤝 Nenhuma loja aguardando aprovação.</p>
              ) : (
                lojasPendentes.map((loja) => (
                  <div key={loja.id} className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-3 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                    <div className="text-xs">
                      <h4 className="font-bold text-stone-800 text-sm">{loja.nome}</h4>
                      <p className="text-stone-400">CNPJ: {loja.cpf} | Email: {loja.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAprovarLoja(loja.id)}
                      className="w-full bg-avle-verde text-white font-bold py-1.5 rounded-xl text-[10px] tracking-wider transition-all active:scale-95"
                    >
                      HOMOLOGAR PARCEIRO ✓
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ---------------- ABA C: SEU MOTOR DE SORTEIOS ORIGINAL ---------------- */}
          {abaAtiva === 'sorteio' && (
            <div className="space-y-5 animate-fade-in">
              <p className="text-xs text-stone-400 leading-relaxed">
                O agendamento congela a lista de cotas aptas e grava o hash dela. A contemplada sai do concurso da
                Loteria Federal seguinte a data de corte, então o resultado pode ser conferido por qualquer pessoa e
                não depende de confiar no sistema.
              </p>

              <form onSubmit={agendarSorteio} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Grupo de Compras</label>
                  <select
                    value={grupoSorteioId}
                    onChange={(e) => { setGrupoSorteioId(e.target.value); carregarSorteios(e.target.value); }}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50 cursor-pointer"
                    required
                  >
                    <option value="">Selecione o grupo</option>
                    {listaGrupos.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome}{g.lojaNome ? ` · ${g.lojaNome}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Data de corte</label>
                  <input
                    type="date"
                    value={dataCorteSorteio}
                    onChange={(e) => setDataCorteSorteio(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Em branco usa hoje. A apuração pega o primeiro concurso a partir dessa data.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loadingSorteio}
                  className="w-full bg-avle-verde text-white font-bold py-3 rounded-xl text-xs tracking-wider shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {loadingSorteio ? 'PROCESSANDO...' : 'CONGELAR LISTA E AGENDAR'}
                </button>
              </form>

              {erroSorteio && <div className="p-3.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold border border-rose-100">{erroSorteio}</div>}

              {sorteiosDoGrupo.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">Sorteios do grupo</h4>
                  {sorteiosDoGrupo.map((s) => (
                    <div key={s.codigoAuditoria} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                          s.status === 'APURADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : s.status === 'CANCELADO' ? 'bg-stone-100 text-stone-500 border-stone-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>{s.status}</span>
                        <span className="text-[11px] font-mono font-bold text-avle-terracotta tracking-wider">{s.codigoAuditoria}</span>
                      </div>

                      <div className="text-xs text-stone-600 space-y-0.5">
                        <p><strong>Participantes:</strong> {s.quantidadeParticipantes}</p>
                        <p><strong>Concurso:</strong> {s.concursoLoteria ?? 'a definir'} · previsto para {s.dataPrevistaConcurso}</p>
                        {s.contempladaNome && (
                          <p className="text-emerald-700 font-bold">Contemplada: {s.contempladaNome} (cota #{s.cotaContempladaId})</p>
                        )}
                      </div>

                      {s.status === 'AGENDADO' && (
                        <button
                          type="button"
                          onClick={() => apurarSorteio(s.id)}
                          disabled={loadingSorteio}
                          className="w-full bg-avle-terracotta text-white font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider disabled:opacity-50"
                        >
                          Apurar agora
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------------- ABA D: SEU CADASTRO DE NOVO GRUPO ORIGINAL ---------------- */}
          {abaAtiva === 'cadastro' && (
            <div className="space-y-5 animate-fade-in">
              <p className="text-xs text-stone-400 leading-relaxed">Configure as regras financeiras de um novo clube de compras. O QR Code de adesão será gerado baseado nestes dados.</p>

              <form onSubmit={criarGrupo} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Nome do Clube/Produto</label>
                  <input type="text" placeholder="Ex: Clube do iPhone 15 Pro" value={nomeGrupo} onChange={(e) => setNomeGrupo(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm bg-stone-50" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Valor Parcela (R$)</label>
                    <input type="number" step="0.01" placeholder="350.00" value={valorParcela} onChange={(e) => setValorParcela(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm bg-stone-50" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Duração (Meses)</label>
                    <input type="number" placeholder="12" value={duracaoMeses} onChange={(e) => setDuracaoMeses(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm bg-stone-50" required />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Limite Máximo de Participantes (Cotas)</label>
                  <input type="number" placeholder="Ex: 10" value={qtdMaxCotas} onChange={(e) => setQtdMaxCotas(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm bg-stone-50" required />
                </div>

                <button type="submit" disabled={loadingGrupo} className="w-full bg-avle-terracotta text-white font-bold py-3 rounded-xl text-xs tracking-wider shadow-sm transition-all active:scale-95 disabled:opacity-50 mt-4">
                  {loadingGrupo ? 'SALVANDO NO MYSQL...' : '🚀 LANÇAR NOVO CLUBE'}
                </button>
              </form>

              {sucessoGrupo && <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-100 text-center">{sucessoGrupo}</div>}
              {erroGrupo && <div className="p-3.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold border border-rose-100 text-center">{erroGrupo}</div>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}