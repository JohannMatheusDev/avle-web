'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; 

interface Grupo {
  id: number;
  nome: string;
  valorParcela: number;
  duracaoMeses: number;
  quantidadeMaxCotas: number;
}

export default function DashboardLoja({ usuario }: { usuario: any }) {
  const router = useRouter();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';
  
  const [abaLoja, setAbaLoja] = useState<'geral' | 'grupos' | 'sorteios' | 'financeiro' | 'relatorios' | 'configuracoes'>('geral');
  const [obrigacoesFuturas, setObrigacoesFuturas] = useState<number>(0);
  const [idOperacao, setIdOperacao] = useState('Nenhuma');
  const [grupoSorteioId, setGrupoSorteioId] = useState('');
  const [loadingSorteio, setLoadingSorteio] = useState(false);

  const [grupoSelecionado, setGrupoSelecionado] = useState<Grupo | null>(null);
  const [participantesDoGrupo, setParticipantesDoGrupo] = useState<any[]>([]);

  const [listaGrupos, setListaGrupos] = useState<Grupo[]>([]);
  const [modalNovoGrupoAberto, setModalNovoGrupoAberto] = useState(false);
  const [modalSaqueAberto, setModalSaqueAberto] = useState(false);
  
  const [chavePix, setChavePix] = useState('');

  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null);
  const [enviandoPdf, setEnviandoPdf] = useState(false);

  const [totalClientes, setTotalClientes] = useState<number>(0);

  const [notificacao, setNotificacao] = useState<{
    aberto: boolean;
    titulo: string;
    mensagem: string;
    isError?: boolean;
  }>({ aberto: false, titulo: '', mensagem: '', isError: false });

  const mostrarAviso = (titulo: string, mensagem: string, isError: boolean = false) => {
    setNotificacao({ aberto: true, titulo, mensagem, isError });
  };
  
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [valorParcela, setValorParcela] = useState('');
  const [duracaoMeses, setDuracaoMeses] = useState('24');
  const [maxCotas, setMaxCotas] = useState('40');

  const [dadosFinanceiros, setDadosFinanceiros] = useState<any>({
    recebidoEsteMes: 0.00, 
    aReceberContemplados: 0.00, 
    emNegociacao: 0.00, 
    acordosAtivos: 0, 
    repasses: []
  });

  const [dadosRelatorios, setDadosRelatorios] = useState<any>({
    marginEsteMes: 0.00, 
    marginAcumulada: 0.00, 
    cohort: [], 
    auditoria: []
  });

  const carregarGruposDoBanco = () => {
    fetch(`${API_URL}/api/grupos/loja/${usuario?.lojaId || 1}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          setListaGrupos(data);
        } else {
          setListaGrupos([]);
        }
      })
      .catch(() => {
        setListaGrupos([]);
      });
  };

  const carregarDadosFinanceiros = () => {
    fetch(`${API_URL}/api/financeiro/obrigacoes/loja/${usuario?.lojaId || 1}`)
      .then(res => res.ok ? res.json() : 0)
      .then(valor => setObrigacoesFuturas(Number(valor) || 0))
      .catch(() => setObrigacoesFuturas(0.00));

    fetch(`${API_URL}/api/financeiro/loja/${usuario?.lojaId || 1}/resumo`)
      .then(res => res.ok ? res.json() : { recebidoEsteMes: 0, aReceberContemplados: 0, emNegociacao: 0, acordosAtivos: 0, repasses: [] })
      .then(data => {
        setDadosFinanceiros(data);
      })
      .catch(() => {});
  };

  const carregarContagemClientes = (lojaId: number) => {
    fetch(`${API_URL}/api/lojas/${lojaId}/clientes/contagem`)
      .then((res) => res.ok ? res.json() : { totalClientes: 0 })
      .then((data) => {
        setTotalClientes(Number(data.totalClientes) || 0);
      })
      .catch(() => {
        setTotalClientes(0);
      });
  };

  const recarregarParticipantesDoGrupo = () => {
    if (!grupoSelecionado) return;
    fetch(`${API_URL}/api/usuarios/comunidade/${grupoSelecionado.id}/participantes`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) setParticipantesDoGrupo(data);
      })
      .catch(() => setParticipantesDoGrupo([]));
  };

  useEffect(() => {
    const lojaId = usuario?.lojaId || 1;
    carregarGruposDoBanco();
    carregarDadosFinanceiros();
    carregarContagemClientes(lojaId);

    fetch(`${API_URL}/api/financeiro/loja/${lojaId}/relatorios`)
      .then(res => res.ok ? res.json() : { marginEsteMes: 0, marginAcumulada: 0, cohort: [], auditoria: [] })
      .then(data => setDadosRelatorios(data))
      .catch(() => {});
  }, [usuario?.lojaId]);

  useEffect(() => {
    if (grupoSelecionado) {
      recarregarParticipantesDoGrupo();
    }
  }, [grupoSelecionado]);

  const handleCriarGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        nome: nomeGrupo, 
        valorParcela: parseFloat(valorParcela), 
        duracaoMeses: parseInt(duracaoMeses), 
        quantidadeMaxCotas: parseInt(maxCotas), 
        lojaId: usuario?.lojaId || 1 
      };
      
      const res = await fetch(`${API_URL}/api/grupos/criar`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      
      if (!res.ok) {
        throw new Error('Falha ao registrar novo clube de compras.');
      }
      
      mostrarAviso('Sucesso Comercial', 'Clube de Compras lançado com sucesso!', false);
      setNomeGrupo(''); 
      setValorParcela(''); 
      setModalNovoGrupoAberto(false);
      carregarGruposDoBanco();
    } catch (err: any) { 
      mostrarAviso('Erro Operacional', err.message, true); 
    }
  };

  const ejecutarSorteioLoja = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSorteio(true);
    try {
      const res = await fetch(`${API_URL}/api/usuarios/sorteios/executar/${grupoSorteioId}`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('Nenhum participante adimplente apto encontrado neste ciclo.');
      }
      
      const data = await res.json();
      if (data.cotaPremiadaId) {
        setIdOperacao(data.cotaPremiadaId.toString());
      }
      
      mostrarAviso(
        'Sorteio Homologado', 
        `Contemplado: ${data.vencedorNome}\nContrato da Cota Alvo: #${data.cotaPremiadaId}\n\nAs notificações foram disparadas e o painel de liberação foi atualizado para esta cota.`, 
        false
      );
      setGrupoSorteioId('');
      if (grupoSelecionado) recarregarParticipantesDoGrupo();
    } catch (err: any) { 
      mostrarAviso('Apuração Suspensa', err.message, true); 
    } finally { 
      setLoadingSorteio(false); 
    }
  };

  const ejecutarFluxoEntrega = async (endpoint: string, query: string = '') => {
    if (idOperacao === 'Nenhuma') {
      mostrarAviso('Ação Bloqueada', 'Por favor, selecione uma cota na tabela de integrantes ou realize um sorteio antes de emitir a liberação.', true);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/usuarios/entregas/${idOperacao}/${endpoint}${query}`, { method: 'PUT' });
      if (!res.ok) throw new Error('Falha ao atualizar o status operacional no sistema.');
      mostrarAviso('Fluxo Atualizado', 'Status de controle logístico atualizado com sucesso!', false);
      if (grupoSelecionado) recarregarParticipantesDoGrupo();
    } catch (err: any) { 
      mostrarAviso('Erro de Conexão', err.message, true); 
    }
  };

  const handleSelecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        mostrarAviso('Formato Inválido', 'Apenas arquivos em formato PDF são aceitos.', true);
        setArquivoPdf(null);
        return;
      }
      setArquivoPdf(file);
    }
  };

  const handleEnviarPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivoPdf) {
      mostrarAviso('Campo Requerido', 'Selecione um arquivo PDF antes de enviar.', true);
      return;
    }

    setEnviandoPdf(true);
    const formData = new FormData();
    formData.append('file', arquivoPdf);

    try {
      const res = await fetch(`${API_URL}/api/lojas/${usuario?.lojaId || 1}/regras`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Não foi possível salvar o documento de regras.');
      }

      mostrarAviso('Regulamento Salvo', 'Regulamento contratual em PDF registrado com sucesso para esta loja!', false);
      setArquivoPdf(null);
    } catch (err: any) {
      mostrarAviso('Erro de Salvamento', err.message, true);
    } finally {
      setEnviandoPdf(false);
    }
  };

  const recebidoEsteMes = Number(dadosFinanceiros?.recebidoEsteMes) || 0;
  const aReceberContemplados = Number(dadosFinanceiros?.aReceberContemplados) || 0;

  const totalParticipantesValidos = Array.isArray(participantesDoGrupo) ? participantesDoGrupo.length : 0;
  const totalGruposValidos = Array.isArray(listaGrupos) ? listaGrupos.length : 0;

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-[#0B1E14] bg-[#F0F2F5]">
      <aside className="w-full md:w-64 bg-[#0B1E14] text-[#E3EAE6] flex flex-col justify-between p-6 flex-shrink-0">
        <div>
          <div className="mb-8 border-b border-white/10 pb-6">
            <h1 className="text-xl font-serif font-bold text-white tracking-wide">AVLE</h1>
            <p className="text-xs text-stone-400 font-medium mt-0.5">
              {usuario?.lojaNome || 'Unidade Administrativa'}
            </p>
          </div>
          
          <nav className="space-y-1">
            {[
              { id: 'geral', label: 'Visão geral' },
              { id: 'grupos', label: 'Grupos' },
              { id: 'sorteios', label: 'Sorteios / Entrega' },
              { id: 'financeiro', label: 'Financeiro' },
              { id: 'relatorios', label: 'Relatórios' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setGrupoSelecionado(null); setAbaLoja(tab.id as any); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  abaLoja === tab.id && !grupoSelecionado ? 'bg-white/10 text-white font-bold' : 'hover:bg-white/5 opacity-75'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="pt-4 border-t border-white/10 text-xs text-stone-400 flex justify-between items-center">
          <button 
            onClick={() => { setGrupoSelecionado(null); setAbaLoja('configuracoes'); }} 
            className={`hover:text-white transition-all font-semibold cursor-pointer bg-transparent border-none ${abaLoja === 'configuracoes' ? 'text-white underline' : 'text-stone-400'}`}
          >
            Configurações
          </button>
          <button 
            onClick={() => { localStorage.removeItem('@avle:usuario'); window.location.href = '/'; }} 
            className="text-stone-400 hover:text-red-400 text-xs font-bold transition-all cursor-pointer border border-white/10 px-2.5 py-1 rounded-xl bg-transparent hover:bg-white/5"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 max-w-7xl overflow-x-hidden space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#DFD9CE] pb-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#0B1E14] capitalize">
              {grupoSelecionado ? `Ficha Detalhada: ${grupoSelecionado.nome}` : (abaLoja === 'geral' ? 'Visão geral comercial' : abaLoja === 'configuracoes' ? 'Configurações da Loja' : abaLoja)}
            </h2>
            <p className="text-xs text-stone-400 font-medium">Gestão de cotas, faturamento da unidade e controle de entregas.</p>
          </div>
          {!grupoSelecionado && (abaLoja === 'geral' || abaLoja === 'grupos') && (
            <button onClick={() => setModalNovoGrupoAberto(true)} className="bg-[#BD6B42] text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-sm hover:bg-[#A95A33] transition-all cursor-pointer">Novo grupo</button>
          )}
        </div>

        {grupoSelecionado ? (
          <div className="space-y-6 animate-fadeIn">
            <button onClick={() => setGrupoSelecionado(null)} className="text-xs font-bold text-stone-500 hover:text-[#0B1E14] transition-all bg-white border border-[#E6E2D8] px-4 py-2 rounded-xl cursor-pointer shadow-xs"> Voltar para a Listagem</button>

            <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">ID do Grupo</span>
                <span className="text-base font-bold text-[#0B1E14] font-mono block mt-1">#{grupoSelecionado.id}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">Mensalidade</span>
                <span className="text-base font-bold text-emerald-700 font-mono block mt-1">R$ {Number(grupoSelecionado.valorParcela).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">Vigência</span>
                <span className="text-base font-bold text-[#0B1E14] font-mono block mt-1">{grupoSelecionado.duracaoMeses} M</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">Cotas Preenchidas</span>
                <span className="text-base font-bold text-[#BD6B42] font-mono block mt-1">{totalParticipantesValidos} / {grupoSelecionado.quantidadeMaxCotas}</span>
              </div>
            </div>

            <div className="bg-white border border-[#DFD9CE] rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50 flex justify-between items-center">
                <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Mapeamento de Integrantes (Selecione uma linha para liberar o fluxo de entrega)</h3>
                {idOperacao !== 'Nenhuma' && <span className="text-xs bg-[#BD6B42] text-white px-3 py-1 rounded-lg font-mono font-bold">Cota Alvo: #{idOperacao}</span>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 text-stone-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                      <th className="py-3.5 px-5 text-center">Nº DA COTA</th>
                      <th className="py-3.5 px-5">PARTICIPANTE</th>
                      <th className="py-3.5 px-5 text-right">SALDO QUITADO</th>
                      <th className="py-3.5 px-5 text-right">VALOR COBERTO (RISCO LOJA)</th>
                      <th className="py-3.5 px-5 text-center">STATUS DE ENTREGA / OPERAÇÃO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                    {totalParticipantesValidos === 0 ? (
                      <tr><td colSpan={5} className="py-6 text-center text-stone-400 italic">Nenhum participante vinculado a este grupo ainda.</td></tr>
                    ) : (
                      participantesDoGrupo.map((part) => {
                        const isSelecionado = idOperacao === part.numeroCota.toString();
                        return (
                          <tr key={part.id} onClick={() => setIdOperacao(part.numeroCota.toString())} className={`transition-all cursor-pointer ${isSelecionado ? 'bg-amber-50/70 hover:bg-amber-100/70 font-bold' : 'hover:bg-stone-50/60'}`}>
                            <td className="py-3.5 px-5 text-center font-mono font-bold text-[#BD6B42]">#0{part.numeroCota}</td>
                            <td className="py-3.5 px-5">
                              <span className="block font-bold text-[#0B1E14]">{part.nome}</span>
                              <span className="text-[10px] text-stone-400 font-mono">{part.email}</span>
                            </td>
                            <td className="py-3.5 px-5 text-right font-mono text-emerald-700">R$ {Number(part.saldoPoupanca).toFixed(2)}</td>
                            <td className="py-3.5 px-5 text-right font-mono text-rose-700">R$ {Number(part.custoFinanciadoLoja).toFixed(2)}</td>
                            <td className="py-3.5 px-5 text-center">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                                part.statusEntrega === 'AGUARDANDO_SORTEIO' ? 'bg-stone-50 text-stone-500 border-stone-200' :
                                part.statusEntrega === 'CONTEMPLADO_NO_PRAZO' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                part.statusEntrega === 'PRODUTO_SELECIONADO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                part.statusEntrega === 'CREDITO_REJEITADO' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                part.statusEntrega === 'PREPARANDO_ENVIO' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                part.statusEntrega === 'ENVIADO_OU_RETIRADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                'bg-stone-50 text-stone-500 border-stone-200'
                              }`}>{part.statusEntrega ? part.statusEntrega.replace(/_/g, ' ') : 'AGUARDANDO SORTEIO'}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <>
            {abaLoja === 'geral' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#0B1E14] text-white p-5 rounded-xl shadow-xs relative overflow-hidden">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Faturamento (90%)</span>
                    <span className="text-2xl font-bold tracking-tight block mt-2 font-mono">R$ {recebidoEsteMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-stone-500"></div>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Clientes Cadastrados</span>
                    <span className="text-2xl font-bold tracking-tight text-[#0B1E14] font-mono mt-1">{totalClientes}</span>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Clubes Criados</span>
                    <span className="text-2xl font-bold tracking-tight text-[#0B1E14] font-mono mt-1">{totalGruposValidos}</span>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Taxa Inadimplência</span>
                    <span className="text-2xl font-bold text-stone-400 font-mono mt-1">0,0%</span>
                  </div>
                </div>
              </div>
            )}

            {abaLoja === 'grupos' && (
              <div className="space-y-4 animate-fadeIn text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listaGrupos.map((grupo) => (
                    <div 
                      key={grupo.id} 
                      onClick={() => setGrupoSelecionado(grupo)}
                      className="bg-white border border-[#DFD9CE] rounded-2xl p-5 shadow-xs hover:border-[#BD6B42] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif font-bold text-base text-[#0B1E14] group-hover:text-[#BD6B42] transition-colors">{grupo.nome}</h3>
                          <p className="text-[10px] font-mono text-stone-400 mt-0.5">Duração: {grupo.duracaoMeses} Meses</p>
                        </div>
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-stone-50 border text-stone-500">
                          ID #{grupo.id}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t pt-3">
                        <span className="text-stone-400 font-medium">Parcela: <strong className="text-[#0B1E14]">R$ {grupo.valorParcela.toFixed(2)}</strong></span>
                        <span className="text-[10px] text-[#BD6B42] font-bold uppercase tracking-wider">Ver Participantes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {abaLoja === 'sorteios' && (
              <div className="bg-white border border-[#DFD9CE] p-6 rounded-2xl space-y-6 shadow-xs animate-fadeIn">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Painel de Contemplação e Liberação</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">Dispare a apuração de cotas do grupo digitando o identificador correspondente.</p>
                </div>
                <form onSubmit={ejecutarSorteioLoja} className="flex space-x-2">
                  <input type="number" placeholder="ID do Grupo" value={grupoSorteioId} onChange={(e) => setGrupoSorteioId(e.target.value)} className="w-32 px-3 py-2 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-xs font-mono" required />
                  <button type="submit" disabled={loadingSorteio} className="bg-[#0B1E14] text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer disabled:opacity-50 uppercase tracking-wider">{loadingSorteio ? 'Processando...' : 'Rodar Sorteio'}</button>
                </form>
                <div className="border-t border-stone-100 pt-4 space-y-3">
                  <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-xl border border-dashed">
                    <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide block">Controles Operacionais de Despacho</span>
                    <span className="text-[10px] bg-[#0B1E14] text-white px-3 py-1 rounded-md font-mono font-bold">CONTRATO ALVO: {idOperacao === 'Nenhuma' ? 'Nenhum' : `#${idOperacao}`}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-bold uppercase">
                    <button onClick={() => ejecutarFluxoEntrega('avaliar-credito', '?aprovado=true')} className="p-2.5 bg-[#0B1E14] text-white rounded-xl shadow-xs cursor-pointer hover:bg-opacity-90">Aprovar Crédito</button>
                    <button onClick={() => ejecutarFluxoEntrega('avaliar-credito', '?aprovado=false')} className="p-2.5 bg-rose-50 text-rose-700 border-rose-100 rounded-xl shadow-xs cursor-pointer hover:bg-rose-100">Rejeitar Crédito</button>
                    <button onClick={() => ejecutarFluxoEntrega('concluir')} className="p-2.5 bg-[#BD6B42] text-white rounded-xl shadow-xs cursor-pointer hover:bg-[#A95A33]">Finalizar Entrega</button>
                  </div>
                </div>
              </div>
            )}

            {abaLoja === 'financeiro' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-[#DFD9CE] p-5 rounded-2xl shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 block mb-1">SALDO LÍQUIDO DISPONÍVEL (90%)</span>
                      <span className="text-xl font-bold text-emerald-600">R$ {recebidoEsteMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <button onClick={() => setModalSaqueAberto(true)} className="mt-4 bg-[#0B1E14] text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-opacity-90 cursor-pointer transition-all w-full">Transferir para Conta Bancária</button>
                  </div>

                  <div className="bg-white border border-[#DFD9CE] p-5 rounded-2xl shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#BD6B42] block mb-1">CAPITAL AVANÇADO (RISCO DA LOJA)</span>
                      <span className="text-xl font-bold text-[#BD6B42]">R$ {aReceberContemplados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-2 leading-relaxed border-t pt-2 border-dashed">*Aporte em Haver:* Valor referente a produtos entregues a clientes contemplados. A loja assume o custo contratual imediato e detém o direito de recebimento das parcelas futuras.</p>
                  </div>

                  <div className="bg-white border border-[#DFD9CE] p-5 rounded-2xl shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 block mb-1">CUMPRIMENTO DE ACORDOS</span>
                      <span className="text-xl font-bold text-stone-600">Ativos</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-2 leading-relaxed border-t pt-2 border-dashed">Garantia jurídica de alienação fiduciaria ou contrato assinado para resguardo do capital avançado.</p>
                  </div>
                </div>

                <div className="bg-white border border-[#DFD9CE] p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1E14]">Domicílio Bancário Homologado</h4>
                    <p className="text-xs text-stone-500">Configure a chave Pix da sua empresa onde os resgates do Abacatepay serão liquidados.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                    <input 
                      type="text" 
                      placeholder="Insira seu CNPJ, Telefone ou Chave Aleatória" 
                      value={chavePix}
                      onChange={(e) => setChavePix(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-xs font-mono focus:outline-none focus:border-[#BD6B42]" 
                    />
                    <button 
                      onClick={async () => {
                        if (!chavePix.trim()) { mostrarAviso('Campo Obrigatório', 'Por favor, digite uma chave PIX válida.', true); return; }
                        try {
                          const res = await fetch(`${API_URL}/api/financeiro/loja/${usuario?.lojaId || 1}/configurar-pix`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chavePix: chavePix })
                          });
                          
                          if (!res.ok) throw new Error('Erro ao salvar as informações.');
                          mostrarAviso('Vínculo Concluído', 'Chave PIX vinculada e homologada com sucesso para saques do Abacatepay!', false);
                        } catch {
                          mostrarAviso('Erro de Conexão', 'Falha ao conectar com o sistema para salvar a chave.', true);
                        }
                      }}
                      className="bg-[#0B1E14] text-white text-[10px] font-bold px-6 py-2.5 rounded-xl cursor-pointer uppercase tracking-wider hover:bg-opacity-90 transition-all sm:w-auto w-full"
                    >
                      Vincular Conta
                    </button>
                  </div>
                </div>
              </div>
            )}

            {abaLoja === 'configuracoes' && (
              <div className="bg-white border border-[#DFD9CE] rounded-2xl p-6 md:p-8 space-y-6 text-left max-w-xl animate-fadeIn">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#0B1E14] uppercase tracking-wide">Regulamento Operacional da Loja</h3>
                  <p className="text-stone-400 text-xs mt-1 leading-relaxed">
                    Envie os termos de contrato e políticas específicas para a sua comunidade de compras planejadas. Cada estabelecimento atua com total independência jurídica.
                  </p>
                </div>

                <form onSubmit={handleEnviarPdf} className="space-y-4 text-xs">
                  <div className="border border-dashed border-[#DFD9CE] rounded-xl p-5 bg-stone-50/50 flex flex-col items-center justify-center">
                    <input 
                      type="file" 
                      accept="application/pdf"
                      onChange={handleSelecionarArquivo}
                      className="hidden"
                      id="loja-pdf-upload"
                    />
                    <label 
                      htmlFor="loja-pdf-upload"
                      className="px-4 py-2.5 bg-stone-200 text-[#0B1E14] font-bold rounded-lg cursor-pointer hover:bg-stone-300 transition-colors inline-block text-center"
                    >
                      Selecionar PDF
                    </label>
                    <span className="text-[10px] text-stone-400 mt-2 font-mono text-center block max-w-xs truncate">
                      {arquivoPdf ? arquivoPdf.name : 'Nenhum regulamento PDF selecionado para envio.'}
                    </span>
                  </div>

                  <button 
                    type="submit" 
                    disabled={!arquivoPdf || enviandoPdf}
                    className="w-full py-3.5 bg-[#0B1E14] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider cursor-pointer disabled:opacity-50 hover:bg-opacity-95 transition-all"
                  >
                    {enviandoPdf ? 'Processando e Gravando...' : 'Salvar Regulamento Contratual'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </main>

      {modalNovoGrupoAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Lançar Novo Grupo de Compras</h3>
              <button onClick={() => setModalNovoGrupoAberto(false)} className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer">X</button>
            </div>
            <form onSubmit={handleCriarGrupo} className="space-y-3.5 text-xs text-[#0B1E14]">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Nome Comercial do Grupo</label>
                <input 
                  type="text" 
                  value={nomeGrupo}
                  onChange={(e) => setNomeGrupo(e.target.value)}
                  className="w-full h-[40px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm focus:outline-none focus:border-[#BD6B42]"
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Valor da Parcela Mensal (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={valorParcela}
                  onChange={(e) => setValorParcela(e.target.value)}
                  className="w-full h-[40px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm font-mono focus:outline-none focus:border-[#BD6B42]"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Duração total (Meses)</label>
                  <input 
                    type="number" 
                    value={duracaoMeses}
                    onChange={(e) => setDuracaoMeses(e.target.value)}
                    className="w-full h-[40px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm font-mono focus:outline-none focus:border-[#BD6B42]"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Quantidade Máxima de Cotas</label>
                  <input 
                    type="number" 
                    value={maxCotas}
                    onChange={(e) => setMaxCotas(e.target.value)}
                    className="w-full h-[40px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm font-mono focus:outline-none focus:border-[#BD6B42]"
                    required 
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-2 border-t w-full">
                <button type="button" onClick={() => setModalNovoGrupoAberto(false)} className="flex-1 py-2.5 border rounded-xl text-stone-500 font-bold transition-colors hover:bg-stone-50">Cancelar</button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0B1E14] text-white font-bold rounded-xl shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-opacity-90 transition-all font-bold"
                >
                  Registrar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalSaqueAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Solicitar Resgate de Saldo</h3>
              <button onClick={() => setModalSaqueAberto(false)} className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer">X</button>
            </div>
            <div className="space-y-3.5 text-xs">
              <p className="text-stone-500 bg-stone-50 p-3 rounded-xl border border-dashed leading-relaxed">
                O saldo disponível acumulado das suas vendas líquidas (90%) será transferido da sua conta digital Abacatepay de forma totalmente segura diretamente para a sua Chave Pix corporativa cadastrada no sistema.
              </p>
              
              <div className="bg-stone-50 p-3 rounded-xl border flex justify-between items-center text-xs">
                <span className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">Valor a ser resgatado:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">R$ {recebidoEsteMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex space-x-2 pt-2 border-t w-full">
                <button type="button" onClick={() => setModalSaqueAberto(false)} className="flex-1 py-2.5 border rounded-xl text-stone-500 font-bold">Cancelar</button>
                <button 
                  type="button" 
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_URL}/api/financeiro/loja/${usuario?.lojaId || 1}/solicitar-saque`, {
                        method: 'POST'
                      });
                      
                      if (!res.ok) {
                        const textoErro = await res.text();
                        throw new Error(textoErro || 'Falha ao processar resgate de saldo.');
                      }
                      
                      const data = await res.json();
                      mostrarAviso(
                        'Resgate Homologado', 
                        `Mensagem: ${data.mensagem}\n\nValor Sacado: R$ ${data.valorSacado}\nDestino Pix: ${data.chavePixDestino}\nID de Transferência: ${data.comprovanteId}`, 
                        false
                      );
                      setModalSaqueAberto(false);
                      carregarDadosFinanceiros();
                    } catch (err: any) {
                      mostrarAviso('Erro no Resgate', err.message, true);
                    }
                  }}
                  className="flex-1 py-2.5 bg-emerald-700 text-white font-bold rounded-xl shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-emerald-800 transition-all font-bold"
                >
                  Confirmar Resgate Pix
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {notificacao.aberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border-t-4" style={{ borderTopColor: notificacao.isError ? '#be123c' : '#047857' }}>
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className={`text-xs font-serif font-bold uppercase tracking-wider ${notificacao.isError ? 'text-rose-700' : 'text-emerald-800'}`}>{notificacao.titulo}</h3>
              <button onClick={() => setNotificacao({ ...notificacao, aberto: false })} className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer">X</button>
            </div>
            <div className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap font-medium">{notificacao.mensagem}</div>
            <div className="pt-3 border-t flex justify-end">
              <button onClick={() => setNotificacao({ ...notificacao, aberto: false })} className={`px-5 py-2 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider cursor-pointer shadow-sm transition-all ${notificacao.isError ? 'bg-rose-700 hover:bg-rose-800' : 'bg-[#0B1E14] hover:bg-opacity-90'}`}>Entendido</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}