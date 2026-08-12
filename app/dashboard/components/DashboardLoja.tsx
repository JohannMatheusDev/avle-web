'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

interface Grupo {
  id: number;
  nome: string;
  valorParcela: number;
  duracaoMeses: number;
  quantidadeMaxCotas: number;
}

export default function DashboardLoja({ usuario }: { usuario: any }) {
  const router = useRouter();
  
  const [abaLoja, setAbaLoja] = useState<'geral' | 'clientes' | 'aprovacoes' | 'grupos' | 'sorteios' | 'financeiro' | 'relatorios' | 'configuracoes'>('geral');
  const [obrigacoesFuturas, setObrigacoesFuturas] = useState<number>(0);
  const [idOperacao, setIdOperacao] = useState('Nenhuma');
  const [grupoSorteioId, setGrupoSorteioId] = useState('');
  const [loadingSorteio, setLoadingSorteio] = useState(false);

  const [grupoSelecionado, setGrupoSelecionado] = useState<Grupo | null>(null);
  const [participantesDoGrupo, setParticipantesDoGrupo] = useState<any[]>([]);

  const [listaGrupos, setListaGrupos] = useState<Grupo[]>([]);
  const [listaClientesLoja, setListaClientesLoja] = useState<any[]>([]);
  const [modalNovoGrupoAberto, setModalNovoGrupoAberto] = useState(false);

  const [modalNovoClienteAberto, setModalNovoClienteAberto] = useState(false);
  const [nomeCliente, setNomeCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [cpfCliente, setCpfCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [processandoCliente, setProcessandoCliente] = useState(false);

  const [modalPagamentoManualAberto, setModalPagamentoManualAberto] = useState(false);
  const [qtdParcelasManual, setQtdParcelasManual] = useState('1');
  const [processandoPagamentoManual, setProcessandoPagamentoManual] = useState(false);

  const [modalExclusao, setModalExclusao] = useState<{
    aberto: boolean;
    tipo: 'grupo' | 'participante';
    idTarget: number;
    titulo: string;
    mensagem: string;
  }>({ aberto: false, tipo: 'grupo', idTarget: 0, titulo: '', mensagem: '' });

  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null);
  const [enviandoPdf, setEnviandoPdf] = useState(false);

  const [totalClientes, setTotalClientes] = useState<number>(0);
  const [historicoTransacoes, setHistoricoTransacoes] = useState<any[]>([]);
  const [taxaChurn, setTaxaChurn] = useState<number>(0);

  const [notificacao, setNotificacao] = useState<{
    aberto: boolean;
    titulo: string;
    mensagem: string;
    isError?: boolean;
  }>({ aberto: false, titulo: '', mensagem: '', isError: false });

  const [solicitacoesAcesso, setSolicitacoesAcesso] = useState<any[]>([]);
  const [processandoAcessoId, setProcessandoAcessoId] = useState<number | null>(null);
  const [caixaMensagemAberta, setCaixaMensagemAberta] = useState(false);

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

  const aplicarMascaraTelefone = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    if (apenasNumeros.length <= 2) return apenasNumeros;
    if (apenasNumeros.length <= 6) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
    if (apenasNumeros.length <= 10) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`;
  };

  const aplicarMascaraCpf = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    return apenasNumeros
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const carregarGruposDoBanco = () => {
    fetch(`${API_URL}/api/grupos/loja/${usuario?.lojaId || 1}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) setListaGrupos(data);
        else setListaGrupos([]);
      })
      .catch(() => setListaGrupos([]));
  };

  const carregarDadosFinanceiros = () => {
    const lojaId = usuario?.lojaId || 1;

    fetch(`${API_URL}/api/financeiro/obrigacoes/loja/${lojaId}`)
      .then(res => res.ok ? res.json() : 0)
      .then(valor => setObrigacoesFuturas(Number(valor) || 0))
      .catch(() => setObrigacoesFuturas(0.00));

    fetch(`${API_URL}/api/financeiro/loja/${lojaId}/resumo`)
      .then(res => res.ok ? res.json() : { recebidoEsteMes: 0, aReceberContemplados: 0, emNegociacao: 0, acordosAtivos: 0, repasses: [] })
      .then(data => setDadosFinanceiros(data))
      .catch(() => {});

    fetch(`${API_URL}/api/financeiro/lojas/${lojaId}/transacoes`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setHistoricoTransacoes(Array.isArray(data) ? data : []))
      .catch(() => setHistoricoTransacoes([]));

    fetch(`${API_URL}/api/lojas/${lojaId}/metricas-churn`)
      .then(res => res.ok ? res.json() : { taxaChurn: 0 })
      .then(data => setTaxaChurn(Number(data.taxaChurn) || 0))
      .catch(() => setTaxaChurn(0));
  };

  const carregarContagemClientes = (lojaId: number) => {
    fetch(`${API_URL}/api/usuarios/lojas/${lojaId}/clientes/contagem`)
      .then((res) => res.ok ? res.json() : { totalClientes: 0 })
      .then((data) => setTotalClientes(Number(data.totalClientes) || 0))
      .catch(() => setTotalClientes(0));
  };

  const carregarListaClientesDaLoja = () => {
    const lojaId = usuario?.lojaId || 1;
    fetch(`${API_URL}/api/usuarios/lojas/${lojaId}/clientes`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
         if (Array.isArray(data)) setListaClientesLoja(data);
      })
      .catch(() => setListaClientesLoja([]));
  };

  const carregarSolicitacoesAcesso = () => {
    const lojaId = usuario?.lojaId || 1;
    fetch(`${API_URL}/api/lojas/${lojaId}/solicitacoes-acesso`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
         if(Array.isArray(data)) setSolicitacoesAcesso(data);
      })
      .catch(() => {});
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
    carregarSolicitacoesAcesso(); 
    carregarListaClientesDaLoja();

    const intervaloNotificacoes = setInterval(carregarSolicitacoesAcesso, 15000);
    return () => clearInterval(intervaloNotificacoes);
  }, [usuario?.lojaId]);

  useEffect(() => {
    if (grupoSelecionado) recarregarParticipantesDoGrupo();
  }, [grupoSelecionado]);

  const handleAnalisarAcesso = async (acessoId: number, aprovado: boolean) => {
     setProcessandoAcessoId(acessoId);
     try {
        const res = await fetch(`${API_URL}/api/lojas/acessos/${acessoId}/analise?aprovado=${aprovado}`, { method: 'PUT' });
        if(res.ok) {
           mostrarAviso(
              aprovado ? 'Acesso Liberado' : 'Acesso Rejeitado',
              aprovado ? 'O cliente foi aprovado e agora tem acesso ao catalogo e planos da sua loja.' : 'A solicitacao do cliente foi bloqueada com sucesso.',
              !aprovado
           );
           carregarSolicitacoesAcesso(); 
           carregarContagemClientes(usuario?.lojaId || 1); 
           carregarDadosFinanceiros(); 
           carregarListaClientesDaLoja();
        } else {
           mostrarAviso('Erro de Sistema', 'Falha ao processar analise. Tente novamente.', true);
        }
     } catch(e) {
        mostrarAviso('Sem Conexao', 'Nao foi possivel conectar ao servidor.', true);
     } finally {
        setProcessandoAcessoId(null);
     }
  };

  const handleRemoverParticipanteDoGrupo = (cotaId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalExclusao({
      aberto: true,
      tipo: 'participante',
      idTarget: cotaId,
      titulo: 'Remover Participante',
      mensagem: 'Tem certeza que deseja remover este participante do grupo? A cota sera zerada e o historico de participacao neste clube sera cancelado permanentemente.'
    });
  };

  const handleExcluirGrupo = (grupoId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalExclusao({
      aberto: true,
      tipo: 'grupo',
      idTarget: grupoId,
      titulo: 'Excluir Grupo de Compras',
      mensagem: 'Tem certeza que deseja excluir este grupo de compras? Esta acao nao pode ser desfeita e removera todas as cotas e recebimentos futuros atrelados a ele.'
    });
  };

  const confirmarExclusao = async () => {
    const { tipo, idTarget } = modalExclusao;
    setModalExclusao({ ...modalExclusao, aberto: false }); 

    if (tipo === 'participante') {
      try {
        const res = await fetch(`${API_URL}/api/cotas/${idTarget}`, { method: 'DELETE' });
        if (!res.ok) {
          const textoErro = await res.text();
          throw new Error(textoErro || 'Falha ao remover participante.');
        }

        mostrarAviso('Participante Removido', 'O cliente foi desligado deste grupo de compras com sucesso.', false);
        
        if (idOperacao === idTarget.toString()) {
          setIdOperacao('Nenhuma');
        }

        recarregarParticipantesDoGrupo();
        carregarContagemClientes(usuario?.lojaId || 1);
        carregarDadosFinanceiros(); 
      } catch (err: any) {
        mostrarAviso('Erro ao Remover', err.message, true);
      }
    } else if (tipo === 'grupo') {
      try {
        const res = await fetch(`${API_URL}/api/grupos/${idTarget}`, { method: 'DELETE' });
        if (!res.ok) {
          const textoErro = await res.text();
          throw new Error(textoErro || 'Falha ao excluir grupo.');
        }

        mostrarAviso('Grupo Removido', 'O grupo foi excluido com sucesso do sistema.', false);
        
        if (grupoSelecionado?.id === idTarget) {
          setGrupoSelecionado(null);
        }
        
        carregarGruposDoBanco();
        carregarDadosFinanceiros();
      } catch (err: any) {
        mostrarAviso('Erro ao Excluir', err.message, true);
      }
    }
  };

  const handleCadastrarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessandoCliente(true);
    try {
      const payload = {
        nome: nomeCliente, email: emailCliente,
        cpf: cpfCliente.replace(/\D/g, ''), telefone: telefoneCliente.replace(/\D/g, ''),
        lojaId: usuario?.lojaId || 1
      };

      const res = await fetch(`${API_URL}/api/usuarios/cadastrar-cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const textoErro = await res.text();
        throw new Error(textoErro || 'Falha ao cadastrar cliente no sistema.');
      }

      const data = await res.json();
      mostrarAviso(
        'Cliente Registrada', 
        `${data.mensagem}\n\nLogin / E-mail: ${data.email || 'Nao informado'}\nSenha Padrao Inicial: ${data.senhaPadrao}\n\nA cliente ja pode acessar o Dashboard do Cliente utilizando estas credenciais ou o proprio CPF caso o email esteja em branco.`, 
        false
      );

      setNomeCliente(''); setEmailCliente(''); setCpfCliente(''); setTelefoneCliente('');
      setModalNovoClienteAberto(false);
      carregarContagemClientes(usuario?.lojaId || 1);
      carregarListaClientesDaLoja();
    } catch (err: any) {
      mostrarAviso('Erro de Cadastro', err.message, true);
    } finally {
      setProcessandoCliente(false);
    }
  };

  const handleCriarGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        nome: nomeGrupo, valorParcela: parseFloat(valorParcela), 
        duracaoMeses: parseInt(duracaoMeses), quantidadeMaxCotas: parseInt(maxCotas), 
        lojaId: usuario?.lojaId || 1 
      };
      
      const res = await fetch(`${API_URL}/api/grupos/criar`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      
      if (!res.ok) {
        const erroServidor = await res.text();
        throw new Error(erroServidor || 'Falha ao registrar novo clube de compras.');
      }
      
      mostrarAviso('Sucesso Comercial', 'Clube de Compras lancado com sucesso!', false);
      setNomeGrupo(''); setValorParcela(''); 
      setModalNovoGrupoAberto(false);
      carregarGruposDoBanco();
    } catch (err: any) { 
      mostrarAviso('Erro Operacional', err.message, true); 
    }
  };

  const handleLancarPagamentoManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (idOperacao === 'Nenhuma') {
      mostrarAviso('Selecao Necessaria', 'Selecione uma cota na tabela antes de lancar o pagamento.', true);
      return;
    }

    setProcessandoPagamentoManual(true);
    try {
      const res = await fetch(`${API_URL}/api/entregas/${idOperacao}/pagamento-manual`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantidadeParcelas: parseInt(qtdParcelasManual) })
      });

      if (!res.ok) {
        const textoErro = await res.text();
        throw new Error(textoErro || 'Falha ao registrar pagamento manual.');
      }

      const mensagemSucesso = await res.text();
      mostrarAviso('Baixa Efetuada', mensagemSucesso, false);
      setModalPagamentoManualAberto(false);
      setQtdParcelasManual('1');
      recarregarParticipantesDoGrupo();
      carregarDadosFinanceiros(); 
    } catch (err: any) {
      mostrarAviso('Erro de Lancamento', err.message, true);
    } finally {
      setProcessandoPagamentoManual(false);
    }
  };

  const ejecutarSorteioLoja = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSorteio(true);
    try {
      const res = await fetch(`${API_URL}/api/usuarios/sorteios/executar/${grupoSorteioId}`, { method: 'POST' });
      if (!res.ok) {
        const textoErro = await res.text();
        throw new Error(textoErro || 'Nenhum participante adimplente apto encontrado neste ciclo.');
      }
      
      const data = await res.json();
      if (data.cotaPremiadaId) setIdOperacao(data.cotaPremiadaId.toString());
      
      mostrarAviso('Sorteio Homologado', `Contemplado: ${data.vencedorNome}\nContrato da Cota Alvo: #${data.cotaPremiadaId}\n\nAs notificacoes foram disparadas e o painel de liberacao foi atualizado.`, false);
      setGrupoSorteioId('');
      if (grupoSelecionado) recarregarParticipantesDoGrupo();
    } catch (err: any) { 
      mostrarAviso('Apuracao Suspensa', err.message, true); 
    } finally { 
      setLoadingSorteio(false); 
    }
  };

  const ejecutarFluxoEntrega = async (endpoint: string, query: string = '') => {
    if (idOperacao === 'Nenhuma') {
      mostrarAviso('Acao Bloqueada', 'Por favor, selecione uma cota na tabela de integrantes ou realize um sorteio antes de emitir a liberacao.', true);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/entregas/${idOperacao}/${endpoint}${query}`, { method: 'PUT' });
      if (!res.ok) {
        const textoErro = await res.text();
        throw new Error(textoErro || 'Falha ao atualizar o status operacional no sistema.');
      }
      mostrarAviso('Fluxo Atualizado', 'Status de controle logistico atualizado com sucesso!', false);
      if (grupoSelecionado) recarregarParticipantesDoGrupo();
    } catch (err: any) { 
      mostrarAviso('Erro de Conexao', err.message, true); 
    }
  };

  const handleSelecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        mostrarAviso('Formato Invalido', 'Apenas arquivos em formato PDF sao aceitos.', true);
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
      if (!res.ok) throw new Error('Nao foi possivel salvar o documento de regras.');
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
    <div className="flex flex-col md:flex-row min-h-screen text-[#0B1E14] bg-[#F0F2F5] relative">
      
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
              { id: 'geral', label: 'Visao geral' },
              { id: 'clientes', label: 'Clientes' },
              { id: 'aprovacoes', label: 'Aprovacoes' }, 
              { id: 'grupos', label: 'Grupos' },
              { id: 'sorteios', label: 'Sorteios / Entrega' },
              { id: 'financeiro', label: 'Financeiro / Extrato' },
              { id: 'relatorios', label: 'Relatorios' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setGrupoSelecionado(null); setAbaLoja(tab.id as any); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex justify-between items-center ${
                  abaLoja === tab.id && !grupoSelecionado ? 'bg-white/10 text-white font-bold' : 'hover:bg-white/5 opacity-75'
                }`}
              >
                <span>{tab.label}</span>
                {tab.id === 'aprovacoes' && solicitacoesAcesso.length > 0 && (
                   <span className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md animate-pulse">
                     +{solicitacoesAcesso.length} Novo
                   </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="pt-4 border-t border-white/10 text-xs text-stone-400 flex justify-between items-center">
          <button 
            onClick={() => { setGrupoSelecionado(null); setAbaLoja('configuracoes'); }} 
            className={`hover:text-white transition-all font-semibold cursor-pointer bg-transparent border-none ${abaLoja === 'configuracoes' ? 'text-white underline' : 'text-stone-400'}`}
          >
            Configuracoes
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
              {grupoSelecionado 
                 ? `Ficha Detalhada: ${grupoSelecionado.nome}` 
                 : (abaLoja === 'geral' ? 'Visao geral comercial' 
                    : abaLoja === 'clientes' ? 'Registro de Clientes'
                    : abaLoja === 'configuracoes' ? 'Configuracoes da Loja' 
                    : abaLoja === 'aprovacoes' ? 'Central de Aprovacoes de Credito'
                    : abaLoja)}
            </h2>
            <p className="text-xs text-stone-400 font-medium">Gestao de cotas, faturamento da unidade e controle de entregas.</p>
          </div>
          
          {!grupoSelecionado && (abaLoja === 'geral' || abaLoja === 'grupos' || abaLoja === 'aprovacoes' || abaLoja === 'clientes') && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setModalNovoClienteAberto(true)} 
                className="bg-[#0B1E14] text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-sm hover:bg-opacity-90 transition-all cursor-pointer"
              >
                + Nova Cliente
              </button>
              <button 
                onClick={() => setModalNovoGrupoAberto(true)} 
                className="bg-[#BD6B42] text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-sm hover:bg-[#A95A33] transition-all cursor-pointer"
              >
                + Novo grupo
              </button>
            </div>
          )}
        </div>

        {grupoSelecionado ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <button onClick={() => setGrupoSelecionado(null)} className="text-xs font-bold text-stone-500 hover:text-[#0B1E14] transition-all bg-white border border-[#E6E2D8] px-4 py-2 rounded-xl cursor-pointer shadow-xs"> Voltar para a Listagem</button>
              <button 
                 onClick={(e) => handleExcluirGrupo(grupoSelecionado.id, e)} 
                 className="text-xs font-bold text-rose-700 hover:text-white hover:bg-rose-700 transition-all bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl cursor-pointer shadow-xs"
              >
                Excluir Grupo
              </button>
            </div>

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
                <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">Vigencia</span>
                <span className="text-base font-bold text-[#0B1E14] font-mono block mt-1">{grupoSelecionado.duracaoMeses} M</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">Cotas Preenchidas</span>
                <span className="text-base font-bold text-[#BD6B42] font-mono block mt-1">{totalParticipantesValidos} / {grupoSelecionado.quantidadeMaxCotas}</span>
              </div>
            </div>

            <div className="bg-white border border-[#DFD9CE] rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Mapeamento de Integrantes</h3>
                  <p className="text-[10px] text-stone-400 font-medium">Selecione uma linha para registrar baixas manuais ou liberar entregas.</p>
                </div>
                
                {idOperacao !== 'Nenhuma' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-[#BD6B42] text-white px-3 py-1.5 rounded-lg font-mono font-bold">
                      Cota Alvo: #{idOperacao}
                    </span>
                    <button 
                      onClick={() => setModalPagamentoManualAberto(true)}
                      className="bg-[#0B1E14] text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-opacity-90 transition-all cursor-pointer shadow-xs"
                    >
                      + Baixa Manual
                    </button>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 text-stone-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                      <th className="py-3.5 px-5 text-center">N DA COTA</th>
                      <th className="py-3.5 px-5">PARTICIPANTE</th>
                      <th className="py-3.5 px-5 text-right">SALDO QUITADO</th>
                      <th className="py-3.5 px-5 text-right">VALOR COBERTO (RISCO)</th>
                      <th className="py-3.5 px-5 text-center">STATUS DE ENTREGA</th>
                      <th className="py-3.5 px-5 text-center">ACOES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                    {totalParticipantesValidos === 0 ? (
                      <tr><td colSpan={6} className="py-6 text-center text-stone-400 italic">Nenhum participante vinculado a este grupo ainda.</td></tr>
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
                                part.statusEntrega === 'ENVIADO_OU_RETIRADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                'bg-stone-50 text-stone-500 border-stone-200'
                              }`}>{part.statusEntrega ? part.statusEntrega.replace(/_/g, ' ') : 'AGUARDANDO SORTEIO'}</span>
                            </td>
                            <td className="py-3.5 px-5 text-center">
                              <button
                                type="button"
                                onClick={(e) => handleRemoverParticipanteDoGrupo(part.id, e)}
                                className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg text-[10px] uppercase hover:bg-rose-700 hover:text-white transition-all cursor-pointer shadow-xs"
                              >
                                Remover
                              </button>
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
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Faturamento Atual</span>
                    <span className="text-2xl font-bold tracking-tight block mt-2 font-mono">R$ {recebidoEsteMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
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
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Taxa de Cancelamento (Churn)</span>
                    <span className="text-2xl font-bold tracking-tight text-rose-600 font-mono mt-1">{taxaChurn.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {abaLoja === 'clientes' && (
              <div className="space-y-6 animate-fadeIn text-left">
                  <div className="bg-white border border-[#DFD9CE] rounded-xl shadow-xs overflow-hidden">
                      <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                              <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Clientes da Unidade</h3>
                              <p className="text-[10px] text-stone-400 font-medium">Consumidores registrados diretamente pela loja ou aprovados na plataforma.</p>
                          </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="sticky top-0 bg-stone-50 z-10 shadow-sm">
                            <tr className="text-stone-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                              <th className="py-3 px-5">CLIENTE</th>
                              <th className="py-3 px-5">DOCUMENTO</th>
                              <th className="py-3 px-5">CONTATO</th>
                              <th className="py-3 px-5 text-center">STATUS DA CONTA</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                            {listaClientesLoja.length === 0 ? (
                               <tr><td colSpan={4} className="py-6 text-center text-stone-400 italic">Nenhum cliente registrado na sua unidade ainda.</td></tr>
                            ) : (
                               listaClientesLoja.map((cli, idx) => (
                                 <tr key={idx} className="hover:bg-stone-50/60 transition-all">
                                   <td className="py-3 px-5">
                                     <span className="block font-bold text-[#0B1E14]">{cli.nome}</span>
                                     <span className="text-[10px] text-stone-400">{cli.email || 'Sem e-mail cadastrado'}</span>
                                   </td>
                                   <td className="py-3 px-5 font-mono text-stone-500">
                                     {cli.cpf ? aplicarMascaraCpf(cli.cpf) : 'Nao informado'}
                                   </td>
                                   <td className="py-3 px-5 text-stone-500">
                                     {cli.telefone ? aplicarMascaraTelefone(cli.telefone) : 'Sem telefone'}
                                   </td>
                                   <td className="py-3 px-5 text-center">
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border ${cli.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                        {cli.status}
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

            {abaLoja === 'aprovacoes' && (
              <div className="space-y-6 animate-fadeIn text-left">
                  <div className="bg-white border border-[#DFD9CE] rounded-xl shadow-xs overflow-hidden">
                      <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                              <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Fila de Analise de Credito</h3>
                              <p className="text-[10px] text-stone-400 font-medium">Clientes que solicitaram acesso para visualizar e participar dos seus planos.</p>
                          </div>
                      </div>
                      <div className="p-6">
                         {solicitacoesAcesso.length === 0 ? (
                            <div className="text-center text-stone-400 text-xs italic py-12 bg-stone-50 rounded-xl border border-dashed">
                               Nenhuma solicitacao pendente no momento.
                            </div>
                         ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                               {solicitacoesAcesso.map(sol => (
                                  <div key={sol.id} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm text-left hover:shadow-md transition-shadow">
                                     <div className="flex justify-between items-start mb-3">
                                        <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Pendente SPC/Serasa</span>
                                        <span className="text-[9px] text-stone-400">{new Date(sol.dataSolicitacao).toLocaleDateString('pt-BR')}</span>
                                     </div>
                                     <h4 className="text-sm font-bold text-[#0B1E14] truncate">{sol.clienteNome}</h4>
                                     <p className="text-xs text-stone-500 font-mono mt-1 bg-stone-50 p-2 rounded-lg border border-stone-100">CPF: {sol.clienteCpf ? aplicarMascaraCpf(sol.clienteCpf) : 'Nao informado'}</p>

                                     <div className="mt-5 flex gap-3 pt-4 border-t border-stone-100">
                                        <button disabled={processandoAcessoId === sol.id} onClick={() => handleAnalisarAcesso(sol.id, false)} className="flex-1 bg-white text-rose-600 border border-rose-200 text-[10px] font-bold py-2.5 rounded-lg hover:bg-rose-50 transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer">
                                           Rejeitar
                                        </button>
                                        <button disabled={processandoAcessoId === sol.id} onClick={() => handleAnalisarAcesso(sol.id, true)} className="flex-1 bg-[#0B1E14] text-white text-[10px] font-bold py-2.5 rounded-lg hover:bg-opacity-90 transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-sm">
                                           Aprovar Acesso
                                        </button>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>
                  </div>
              </div>
            )}

            {abaLoja === 'grupos' && (
              <div className="space-y-4 animate-fadeIn text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listaGrupos.map((grupo) => (
                    <div key={grupo.id} onClick={() => setGrupoSelecionado(grupo)} className="bg-white border border-[#DFD9CE] rounded-2xl p-5 shadow-xs hover:border-[#BD6B42] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif font-bold text-base text-[#0B1E14] group-hover:text-[#BD6B42] transition-colors">{grupo.nome}</h3>
                          <p className="text-[10px] font-mono text-stone-400 mt-0.5">Duracao: {grupo.duracaoMeses} Meses</p>
                        </div>
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-stone-50 border text-stone-500">ID #{grupo.id}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t pt-3">
                        <span className="text-stone-400 font-medium">Parcela: <strong className="text-[#0B1E14]">R$ {grupo.valorParcela.toFixed(2)}</strong></span>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={(e) => handleExcluirGrupo(grupo.id, e)} className="text-[10px] text-rose-600 hover:text-rose-800 font-bold uppercase tracking-wider hover:underline z-10">Excluir</button>
                          <span className="text-[10px] text-[#BD6B42] font-bold uppercase tracking-wider">Ver Participantes</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {abaLoja === 'sorteios' && (
              <div className="bg-white border border-[#DFD9CE] p-6 rounded-2xl space-y-6 shadow-xs animate-fadeIn">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Painel de Contemplacao e Liberacao</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">Dispare a apuracao de cotas do grupo digitando o identificador correspondente.</p>
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
                    <button onClick={() => ejecutarFluxoEntrega('avaliar-credito', '?aprovado=true')} className="p-2.5 bg-[#0B1E14] text-white rounded-xl shadow-xs cursor-pointer hover:bg-opacity-90">Aprovar Credito</button>
                    <button onClick={() => ejecutarFluxoEntrega('avaliar-credito', '?aprovado=false')} className="p-2.5 bg-rose-50 text-rose-700 border-rose-100 rounded-xl shadow-xs cursor-pointer hover:bg-rose-100">Rejeitar Credito</button>
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
                      <span className="text-[10px] font-bold text-stone-400 block mb-1">REPASSE DIRETO VIA SPLIT (90%)</span>
                      <span className="text-xl font-bold text-emerald-600">R$ {recebidoEsteMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-3 border-t pt-2 border-dashed leading-relaxed">
                      Split Automatico Asaas: Os 90% sao creditados e liquidados diretamente na subconta bancaria homologada da sua empresa.
                    </p>
                  </div>

                  <div className="bg-white border border-[#DFD9CE] p-5 rounded-2xl shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#BD6B42] block mb-1">CAPITAL AVANCADO (RISCO DA LOJA)</span>
                      <span className="text-xl font-bold text-[#BD6B42]">R$ {aReceberContemplados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-2 leading-relaxed border-t pt-2 border-dashed">Aporte em Haver: Valor referente a produtos entregues a clientes contemplados. A loja assume o custo contratual imediato e detem o direito de recebimento das parcelas futuras.</p>
                  </div>

                  <div className="bg-white border border-[#DFD9CE] p-5 rounded-2xl shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 block mb-1">CUMPRIMENTO DE ACORDOS</span>
                      <span className="text-xl font-bold text-stone-600">Ativos</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-2 leading-relaxed border-t pt-2 border-dashed">Garantia juridica de alienacao fiduciaria ou contrato assinado para resguardo do capital avancado.</p>
                  </div>
                </div>

                <div className="bg-white border border-[#DFD9CE] rounded-xl shadow-xs overflow-hidden mt-6">
                  <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Historico de Transacoes (Livro Razao)</h3>
                    <span className="text-[9px] bg-[#0B1E14] text-white px-2 py-1 rounded font-mono">Atualizado em tempo real</span>
                  </div>
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-stone-50 z-10 shadow-sm">
                        <tr className="text-stone-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                          <th className="py-3 px-5">DATA</th>
                          <th className="py-3 px-5">CLIENTE / REFERENCIA</th>
                          <th className="py-3 px-5">TIPO</th>
                          <th className="py-3 px-5 text-right">VALOR BRUTO</th>
                          <th className="py-3 px-5 text-right">TAXA (10%)</th>
                          <th className="py-3 px-5 text-right">LIQUIDO (LOJA)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                         {historicoTransacoes.length === 0 ? (
                            <tr><td colSpan={6} className="py-6 text-center text-stone-400 italic">Nenhuma transacao registrada no sistema ainda.</td></tr>
                         ) : (
                            historicoTransacoes.map((t, idx) => (
                              <tr key={idx} className="hover:bg-stone-50/60 transition-all">
                                <td className="py-3 px-5 text-stone-500 font-mono">{new Date(t.dataTransacao).toLocaleDateString('pt-BR')}</td>
                                <td className="py-3 px-5">
                                  <span className="block font-bold text-[#0B1E14]">{t.nomeCliente || 'Transacao Sistema'}</span>
                                  <span className="text-[10px] text-stone-400">Cota #{t.cotaId}</span>
                                </td>
                                <td className="py-3 px-5">
                                   <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border ${t.tipo === 'ENTRADA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                     {t.tipo}
                                   </span>
                                </td>
                                <td className="py-3 px-5 text-right font-mono text-[#0B1E14]">R$ {Number(t.valorBruto).toFixed(2)}</td>
                                <td className="py-3 px-5 text-right font-mono text-rose-600">- R$ {Number(t.taxaPlataforma).toFixed(2)}</td>
                                <td className={`py-3 px-5 text-right font-mono font-bold ${t.tipo === 'ENTRADA' ? 'text-emerald-700' : 'text-[#0B1E14]'}`}>
                                   {t.tipo === 'ENTRADA' ? '+' : ''} R$ {Number(t.valorLiquido).toFixed(2)}
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

            {abaLoja === 'configuracoes' && (
              <div className="bg-white border border-[#DFD9CE] rounded-2xl p-6 md:p-8 space-y-6 text-left max-w-xl animate-fadeIn">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#0B1E14] uppercase tracking-wide">Regulamento Operacional da Loja</h3>
                  <p className="text-stone-400 text-xs mt-1 leading-relaxed">
                    Envie os termos de contrato e politicas especificas para a sua comunidade de compras planejadas. Cada estabelecimento atua com total independencia juridica.
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

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          {caixaMensagemAberta && (
             <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-fadeIn transition-all transform origin-bottom-right">
                <div className="bg-[#0B1E14] text-white p-4 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <span className="text-lg">INBOX</span>
                      <h3 className="text-xs font-bold uppercase tracking-wider">Solicitacoes de Acesso</h3>
                   </div>
                   <button onClick={() => setCaixaMensagemAberta(false)} className="text-stone-400 hover:text-white font-bold px-2 cursor-pointer">X</button>
                </div>

                <div className="p-4 max-h-[400px] overflow-y-auto bg-stone-50/50">
                   {solicitacoesAcesso.length === 0 ? (
                      <div className="text-center text-stone-400 text-xs italic py-8">
                         Nenhuma solicitacao pendente no momento.
                      </div>
                   ) : (
                      <div className="space-y-3">
                         {solicitacoesAcesso.map(sol => (
                            <div key={sol.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm text-left">
                               <div className="flex justify-between items-start mb-2">
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Analise de Credito</span>
                                  <span className="text-[9px] text-stone-400">{new Date(sol.dataSolicitacao).toLocaleDateString('pt-BR')}</span>
                               </div>
                               <p className="text-sm font-bold text-[#0B1E14] truncate">{sol.clienteNome}</p>
                               <p className="text-xs text-stone-500 font-mono mt-0.5">CPF: {sol.clienteCpf ? aplicarMascaraCpf(sol.clienteCpf) : 'Nao informado'}</p>

                               <div className="mt-4 flex gap-2 pt-3 border-t border-stone-100">
                                  <button disabled={processandoAcessoId === sol.id} onClick={() => handleAnalisarAcesso(sol.id, true)} className="flex-1 bg-[#0B1E14] text-white text-[10px] font-bold py-2 rounded-lg hover:bg-opacity-90 transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer">
                                     Aprovar
                                  </button>
                                  <button disabled={processandoAcessoId === sol.id} onClick={() => handleAnalisarAcesso(sol.id, false)} className="flex-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold py-2 rounded-lg hover:bg-rose-100 transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer">
                                     Rejeitar
                                  </button>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          )}

          <button
             onClick={() => setCaixaMensagemAberta(!caixaMensagemAberta)}
             className="w-16 h-16 bg-[#0B1E14] rounded-full shadow-2xl flex items-center justify-center border-[3px] border-[#BD6B42] hover:scale-105 transition-transform relative cursor-pointer group"
          >
             <span className="text-white font-serif font-bold text-xl group-hover:text-[#BD6B42] transition-colors">AV</span>
             
             {solicitacoesAcesso.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md animate-pulse">
                   {solicitacoesAcesso.length}
                </span>
             )}
          </button>
      </div>

      {modalNovoClienteAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Cadastrar Nova Cliente</h3>
                <p className="text-[10px] text-stone-400">Atribuicao de credencial de acesso inicial no sistema.</p>
              </div>
              <button onClick={() => setModalNovoClienteAberto(false)} className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer">X</button>
            </div>

            <form onSubmit={handleCadastrarCliente} className="space-y-3.5 text-xs text-[#0B1E14]">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Nome Completo da Cliente</label>
                <input 
                  type="text" 
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  className="w-full h-[40px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm focus:outline-none focus:border-[#BD6B42]"
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">E-mail de Notificacao / Login (Opcional)</label>
                <input 
                  type="email" 
                  value={emailCliente}
                  onChange={(e) => setEmailCliente(e.target.value)}
                  className="w-full h-[40px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm focus:outline-none focus:border-[#BD6B42]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">CPF da Titular</label>
                  <input 
                    type="text" 
                    value={cpfCliente}
                    onChange={(e) => setCpfCliente(aplicarMascaraCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full h-[40px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm font-mono focus:outline-none focus:border-[#BD6B42]"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Telefone / WhatsApp (Opcional)</label>
                  <input 
                    type="text" 
                    value={telefoneCliente}
                    onChange={(e) => setTelefoneCliente(aplicarMascaraTelefone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="w-full h-[40px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm font-mono focus:outline-none focus:border-[#BD6B42]"
                  />
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-dashed text-[10px] text-stone-500 leading-relaxed">
                A cliente recebera a senha padrao inicial <strong>Avle123</strong> para realizar o primeiro acesso ao Dashboard do Cliente e podera altera-la posteriormente nas suas configuracoes.
              </div>

              <div className="flex space-x-2 pt-2 border-t w-full">
                <button type="button" onClick={() => setModalNovoClienteAberto(false)} className="flex-1 py-2.5 border rounded-xl text-stone-500 font-bold transition-colors hover:bg-stone-50 cursor-pointer">Cancelar</button>
                <button 
                  type="submit"
                  disabled={processandoCliente}
                  className="flex-1 py-2.5 bg-[#0B1E14] text-white font-bold rounded-xl shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-opacity-90 transition-all font-bold disabled:opacity-50"
                >
                  {processandoCliente ? 'Cadastrando...' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalNovoGrupoAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Lancar Novo Grupo de Compras</h3>
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
                  <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Duracao total (Meses)</label>
                  <input 
                    type="number" 
                    value={duracaoMeses}
                    onChange={(e) => setDuracaoMeses(e.target.value)}
                    className="w-full h-[40px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm font-mono focus:outline-none focus:border-[#BD6B42]"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Quantidade Maxima de Cotas</label>
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
                <button type="button" onClick={() => setModalNovoGrupoAberto(false)} className="flex-1 py-2.5 border rounded-xl text-stone-500 font-bold transition-colors hover:bg-stone-50 cursor-pointer">Cancelar</button>
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

      {modalPagamentoManualAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Lancar Pagamento Manual</h3>
                <p className="text-[10px] text-stone-400 font-mono">Cota selecionada: #{idOperacao}</p>
              </div>
              <button onClick={() => setModalPagamentoManualAberto(false)} className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer">X</button>
            </div>

            <form onSubmit={handleLancarPagamentoManual} className="space-y-4 text-xs">
              <p className="text-stone-500 bg-stone-50 p-3 rounded-xl border border-dashed text-[11px] leading-relaxed">
                Utilize esta opcao para dar baixa nas parcelas que a participante ja pagou presencialmente na loja (dinheiro, PIX direto ou cartao).
              </p>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">
                  Quantidade de Parcelas a Quitar
                </label>
                <input 
                  type="number" 
                  min="1"
                  max={grupoSelecionado?.duracaoMeses || 48}
                  value={qtdParcelasManual}
                  onChange={(e) => setQtdParcelasManual(e.target.value)}
                  className="w-full h-[42px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm font-bold focus:outline-none focus:border-[#BD6B42]"
                  required 
                />
                {grupoSelecionado && (
                  <p className="text-[10px] text-emerald-700 font-mono font-bold mt-1.5">
                    Valor Total a Injetar: R$ {(Number(qtdParcelasManual) * Number(grupoSelecionado.valorParcela)).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="flex space-x-2 pt-2 border-t w-full">
                <button 
                  type="button" 
                  onClick={() => setModalPagamentoManualAberto(false)} 
                  className="flex-1 py-2.5 border rounded-xl text-stone-500 font-bold hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={processandoPagamentoManual}
                  className="flex-1 py-2.5 bg-[#0B1E14] text-white font-bold rounded-xl shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {processandoPagamentoManual ? 'Gravando...' : 'Confirmar Baixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalExclusao.aberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-rose-100">
                <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600 text-2xl font-serif font-bold">
                        !
                    </div>
                </div>
                <h3 className="text-center font-bold text-[#0B1E14] text-lg mb-2">{modalExclusao.titulo}</h3>
                <p className="text-center text-stone-500 text-xs leading-relaxed mb-6 px-2">{modalExclusao.mensagem}</p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setModalExclusao({ ...modalExclusao, aberto: false })} 
                        className="flex-1 py-3 bg-stone-50 border border-stone-200 text-stone-600 font-bold rounded-xl text-xs hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmarExclusao} 
                        className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 shadow-md transition-colors cursor-pointer"
                    >
                        Sim, Excluir
                    </button>
                </div>
            </div>
        </div>
      )}

      {notificacao.aberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[90] text-left animate-fadeIn">
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