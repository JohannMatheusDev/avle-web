'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardContemplacao, CotaElegivel, SorteioResumo, mensagemDeErro } from '../../lib/contemplacao';
import { proximoVencimento, proximoSorteio, formatarData, diasAte } from '../../lib/datas';
import { grupoDisponivel, grupoEncerrado, vagasDoGrupo } from '../../lib/grupos';
import { apiFetch, encerrarSessao } from '../../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, Legend,
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

const TENTATIVAS_POR_SECAO = 3;
const ESPERA_ENTRE_TENTATIVAS_MS = 2500;

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Grupo {
  id: number;
  nome: string;
  valorParcela: number;
  duracaoMeses: number;
  quantidadeMaxCotas: number;
  status?: 'ABERTO' | 'ENCERRADO';
  cotasOcupadas?: number;
  // Enviadas pela API. O inicio cai para a data de criacao quando a loja ainda
  // nao informou, e o termino sai do inicio mais a duracao contratada.
  dataInicio?: string | null;
  dataTermino?: string | null;
}

interface ItemFilaEspera {
  id: number;
  clienteId: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  cpf: string | null;
  criadoEm: string | null;
}

interface ClienteDisponivel {
  id: number;
  nome: string;
  email: string | null;
  cpf: string | null;
  telefone: string | null;
  statusAcesso: string;
  ultimoGrupo: string;
  jaNoGrupo: boolean;
  cotaId: number | null;
}

interface ClienteRecusado {
  clienteId: number;
  nome: string;
  motivo: string;
}

interface ResumoFinanceiro {
  recebidoEsteMes: number;
  aReceberContemplados: number;
  emNegociacao: number;
  acordosAtivos: number;
  repasses: unknown[];
}

export default function DashboardLoja({ usuario }: { usuario: any }) {
  const router = useRouter();
  
  const [abaLoja, setAbaLoja] = useState<'geral' | 'clientes' | 'aprovacoes' | 'fila' | 'grupos' | 'sorteios' | 'financeiro' | 'relatorios' | 'configuracoes'>('geral');
  const [obrigacoesFuturas, setObrigacoesFuturas] = useState<number>(0);
  const [idOperacao, setIdOperacao] = useState('Nenhuma');
  const [grupoSorteioId, setGrupoSorteioId] = useState('');

  const [grupoSelecionado, setGrupoSelecionado] = useState<Grupo | null>(null);
  const [participantesDoGrupo, setParticipantesDoGrupo] = useState<any[]>([]);

  const [listaGrupos, setListaGrupos] = useState<Grupo[]>([]);
  const [listaClientesLoja, setListaClientesLoja] = useState<any[]>([]);
  const [modalNovoGrupoAberto, setModalNovoGrupoAberto] = useState(false);

  // Cadastro da propria loja, editavel na aba de configuracoes.
  const [dadosLoja, setDadosLoja] = useState<any | null>(null);
  const [carregandoDadosLoja, setCarregandoDadosLoja] = useState(false);
  const [salvandoDadosLoja, setSalvandoDadosLoja] = useState(false);

  const [modalNovoClienteAberto, setModalNovoClienteAberto] = useState(false);
  const [nomeCliente, setNomeCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [cpfCliente, setCpfCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [processandoCliente, setProcessandoCliente] = useState(false);

  const [modalAddParticipantesAberto, setModalAddParticipantesAberto] = useState(false);
  const [clientesDisponiveis, setClientesDisponiveis] = useState<ClienteDisponivel[]>([]);
  const [vagasDisponiveis, setVagasDisponiveis] = useState(0);
  const [carregandoDisponiveis, setCarregandoDisponiveis] = useState(false);
  const [erroDisponiveis, setErroDisponiveis] = useState('');
  const [buscaClienteGrupo, setBuscaClienteGrupo] = useState('');
  const [clientesSelecionados, setClientesSelecionados] = useState<number[]>([]);
  const [salvandoParticipantes, setSalvandoParticipantes] = useState(false);

  const [dataCorteSorteio, setDataCorteSorteio] = useState('');
  const [sorteiosDoGrupo, setSorteiosDoGrupo] = useState<SorteioResumo[]>([]);
  const [elegiveisDoGrupo, setElegiveisDoGrupo] = useState<CotaElegivel[]>([]);
  const [contemplacoesEmCurso, setContemplacoesEmCurso] = useState<CardContemplacao[]>([]);
  const [processandoSorteio, setProcessandoSorteio] = useState(false);
  const [modalReprovaCredito, setModalReprovaCredito] = useState<{ aberto: boolean; cotaId: number | null }>({ aberto: false, cotaId: null });
  const [motivoReprovaCredito, setMotivoReprovaCredito] = useState('');

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

  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);
  const [clienteParaBloquear, setClienteParaBloquear] = useState<any>(null);
  const [motivoBloqueio, setMotivoBloqueio] = useState('');
  const [processandoBloqueio, setProcessandoBloqueio] = useState(false);

  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null);
  const [enviandoPdf, setEnviandoPdf] = useState(false);

  const [totalClientes, setTotalClientes] = useState<number>(0);
  const [historicoTransacoes, setHistoricoTransacoes] = useState<any[]>([]);
  const [taxaChurn, setTaxaChurn] = useState<number>(0);
  const [nomeLojaReal, setNomeLojaReal] = useState<string>('');

  // Falhas de carregamento por seção, exibidas no topo do painel. Sem isso uma
  // API fora do ar aparece como "nenhum registro", que e indistinguível de vazio.
  const [errosApi, setErrosApi] = useState<Record<string, string>>({});

  const [notificacao, setNotificacao] = useState<{
    aberto: boolean;
    titulo: string;
    mensagem: string;
    isError?: boolean;
  }>({ aberto: false, titulo: '', mensagem: '', isError: false });

  // Fila de espera: clientes que pediram vaga quando nao havia grupo aberto.
  // A loja convoca manualmente, escolhendo em qual grupo a pessoa entra.
  const [filaEspera, setFilaEspera] = useState<ItemFilaEspera[]>([]);
  const [modalConvocar, setModalConvocar] = useState<{ aberto: boolean; item: ItemFilaEspera | null }>({ aberto: false, item: null });
  const [grupoDestinoConvocacao, setGrupoDestinoConvocacao] = useState('');
  const [processandoFilaId, setProcessandoFilaId] = useState<number | null>(null);
  const [registrandoEntregaId, setRegistrandoEntregaId] = useState<number | null>(null);

  // Liberado pela AVLE por loja. Enquanto for falso, a tela nem oferece o
  // lancamento manual: o caminho normal e o sorteio auditavel.
  const [permiteSorteioManual, setPermiteSorteioManual] = useState(false);
  const [modalManual, setModalManual] = useState<{
    aberto: boolean;
    tipo: 'sorteio' | 'entrega' | 'correcao' | 'correcao-sorteio';
    cotaId: number | null;
    nome: string;
  }>({ aberto: false, tipo: 'sorteio', cotaId: null, nome: '' });
  const [dataManual, setDataManual] = useState('');
  const [processandoManual, setProcessandoManual] = useState(false);

  // Baixa manual da quitacao de quem ja foi sorteada. Depois de contemplada a
  // cliente segue devendo as parcelas, e parte delas e paga no balcao - dinheiro
  // que nunca passa pela plataforma. Mesma excecao do lancamento manual: so a
  // unidade autorizada ve estes controles.
  const [modalQuitacao, setModalQuitacao] = useState<
    { aberto: boolean; cotaId: number | null; nome: string; sorteada: boolean }
  >({ aberto: false, cotaId: null, nome: '', sorteada: false });
  const [parcelasQuitacao, setParcelasQuitacao] = useState('1');
  const [valorQuitacao, setValorQuitacao] = useState('');
  const [processandoQuitacao, setProcessandoQuitacao] = useState(false);

  // Traz para a carteira uma cliente que ja tem conta mas se cadastrou por fora
  // do link de convite. Sem isto ela nao aparece na lista nem entra em grupo,
  // apesar de conseguir fazer login.
  const [emailNovoCliente, setEmailNovoCliente] = useState('');
  const [vinculandoCliente, setVinculandoCliente] = useState(false);
  // false enquanto o endpoint da fila nao existe neste servidor. Serve para a aba
  // dizer "ainda nao publicada" em vez de "ninguem na fila", que seria mentira.
  const [filaPublicadaNaApi, setFilaPublicadaNaApi] = useState(true);

  // Contempladas aguardando a loja liberar o credito. Era a fila de pedidos de
  // acesso, que chegava antes de existir compra nenhuma para avaliar.
  const [aguardandoCredito, setAguardandoCredito] = useState<any[]>([]);
  const [processandoCreditoId, setProcessandoCreditoId] = useState<number | null>(null);
  const [motivoReprovacao, setMotivoReprovacao] = useState<{ cotaId: number; texto: string } | null>(null);
  const [caixaMensagemAberta, setCaixaMensagemAberta] = useState(false);

  const mostrarAviso = (titulo: string, mensagem: string, isError: boolean = false) => {
    setNotificacao({ aberto: true, titulo, mensagem, isError });
  };
  
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [duracaoMeses, setDuracaoMeses] = useState('24');
  const [maxCotas, setMaxCotas] = useState('40');

  const [dadosFinanceiros, setDadosFinanceiros] = useState<any>({
    recebidoEsteMes: 0.00,
    aReceberContemplados: 0.00,
    emNegociacao: 0.00,
    acordosAtivos: 0,
    repasses: []
  });

  type Analytics = {
    novosPorMes: { mes: string; total: number }[];
    faturamentoPorGrupo: {
      grupoId?: number;
      nome: string;
      total: number;
      faturado?: number;
      previsto?: number;
      cotasOcupadas?: number;
      quantidadeMaxCotas?: number;
    }[];
    totalFaturado: number;
    churnAtual: number;
    churnHistorico: { mes: string; taxa: number; saidas?: number }[];
    clientesQueSairam?: number;
    clientesNaCarteira?: number;
    // Todos opcionais: a API responde o painel zerado quando alguma consulta
    // falha, e a tela precisa continuar de pe com o campo ausente.
    clientesAtivos?: number;
    clientesAtivosEmGrupo?: number;
    clientesAtivosSemGrupo?: number;
    sorteadasEmGruposAtivos?: number;
    cotasPreenchidas?: number;
    cotasTotais?: number;
    valorProdutosRetirados?: number;
    valorUpsell?: number;
    retiradasSemValorInformado?: number;
    faturamentoMensal?: { mes: string; competencia: string; total: number }[];
    faturamentoMesAtual?: number;
  };
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [periodoClientes, setPeriodoClientes] = useState<1 | 6 | 12>(12);
  const [paginaClientes, setPaginaClientes] = useState(1);
  const CLIENTES_POR_PAGINA = 10;


  const [buscaCliente, setBuscaCliente] = useState('');

  const [fichaCliente, setFichaCliente] = useState<{
    aberta: boolean;
    carregando: boolean;
    nome: string;
    dados: any | null;
  }>({ aberta: false, carregando: false, nome: '', dados: null });

  const [modalDataInicio, setModalDataInicio] = useState<{ aberto: boolean; valor: string; salvando: boolean }>({
    aberto: false,
    valor: '',
    salvando: false,
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

  // Numero da cliente dentro desta loja. Tres digitos porque a loja le e fala
  // esse numero em voz alta, e "cliente 7" fica dificil de conferir numa lista.
  const numeroDaCliente = (n: unknown) =>
    n == null ? null : `#${String(n).padStart(3, '0')}`;

  const lerMensagemErro = async (res: Response) => {
    const texto = await res.text();
    try {
      return JSON.parse(texto).erro ?? texto;
    } catch {
      return texto || `Erro ${res.status}`;
    }
  };

  const registrarErro = useCallback((secao: string, mensagem: string) => {
    console.error(`[${secao}]`, mensagem);
    setErrosApi((prev) => ({ ...prev, [secao]: mensagem }));
  }, []);

  const limparErro = useCallback((secao: string) => {
    setErrosApi((prev) => {
      if (!(secao in prev)) return prev;
      const resto = { ...prev };
      delete resto[secao];
      return resto;
    });
  }, []);

  const buscarJson = useCallback(async <T,>(secao: string, url: string, fallback: T): Promise<T> => {
    let ultimaFalha = 'Não foi possível conectar ao servidor.';

    for (let tentativa = 1; tentativa <= TENTATIVAS_POR_SECAO; tentativa++) {
      try {
        const res = await apiFetch(url);
        if (res.ok) {
          limparErro(secao);
          return await res.json();
        }
        ultimaFalha = await lerMensagemErro(res);
        if (res.status < 500) break;
      } catch {
        ultimaFalha = 'Não foi possível conectar ao servidor.';
      }

      if (tentativa < TENTATIVAS_POR_SECAO) {
        await esperar(ESPERA_ENTRE_TENTATIVAS_MS * tentativa);
      }
    }

    registrarErro(secao, ultimaFalha);
    return fallback;
  }, [registrarErro, limparErro]);

  const carregarGruposDoBanco = async () => {
    const lojaId = usuario?.lojaId || usuario?.id;
    const data = await buscarJson<Grupo[]>('Grupos', `${API_URL}/api/grupos/loja/${lojaId}`, []);
    setListaGrupos(Array.isArray(data) ? data : []);
  };

  const carregarDadosFinanceiros = async () => {
    const lojaId = usuario?.lojaId || usuario?.id;

    const [obrigacoes, resumo, transacoes, churn] = await Promise.all([
      buscarJson<number>('Obrigações futuras', `${API_URL}/api/financeiro/obrigacoes/loja/${lojaId}`, 0),
      buscarJson<ResumoFinanceiro>('Resumo financeiro', `${API_URL}/api/financeiro/loja/${lojaId}/resumo`, { recebidoEsteMes: 0, aReceberContemplados: 0, emNegociacao: 0, acordosAtivos: 0, repasses: [] }),
      buscarJson<unknown[]>('Histórico de transações', `${API_URL}/api/financeiro/lojas/${lojaId}/transacoes`, []),
      buscarJson<{ taxaChurn: number }>('Métricas de churn', `${API_URL}/api/lojas/${lojaId}/metricas-churn`, { taxaChurn: 0 }),
    ]);

    setObrigacoesFuturas(Number(obrigacoes) || 0);
    setDadosFinanceiros(resumo);
    setHistoricoTransacoes(Array.isArray(transacoes) ? transacoes : []);
    setTaxaChurn(Number(churn?.taxaChurn) || 0);
  };

  const carregarContagemClientes = async (lojaId: number) => {
    const data = await buscarJson<{ totalClientes: number }>('Contagem de clientes', `${API_URL}/api/usuarios/lojas/${lojaId}/clientes/contagem`, { totalClientes: 0 });
    setTotalClientes(Number(data?.totalClientes) || 0);
  };

  const carregarAnalytics = async () => {
    const lojaId = usuario?.lojaId || usuario?.id;
    const data = await buscarJson<Analytics | null>('Analytics', `${API_URL}/api/analytics/loja/${lojaId}`, null);
    if (data) setAnalytics(data);
  };

  const carregarListaClientesDaLoja = async () => {
    const lojaId = usuario?.lojaId || usuario?.id;
    const data = await buscarJson<unknown[]>('Lista de clientes', `${API_URL}/api/usuarios/lojas/${lojaId}/clientes`, []);
    if (Array.isArray(data)) setListaClientesLoja(data);
  };

  /**
   * Abre a ficha da cliente a partir da tabela de integrantes do grupo.
   *
   * Recebe o nome junto do id para o cabecalho aparecer imediatamente, enquanto
   * o restante dos dados ainda esta vindo: a lista ja sabe o nome, e mostrar um
   * cartao em branco por meio segundo passa a impressao de que travou.
   */
  /**
   * A ficha refeita com o que a tela ja tem em maos.
   *
   * A listagem de integrantes ja traz saldo, sorteio e entrega de cada
   * participante, e o grupo aberto tem o valor da parcela e a duracao. Da para
   * remontar quase toda a ficha daqui sem pedir nada ao servidor.
   *
   * Serve para quando a rota da ficha nao existe no ar - o backend sobe em
   * outro momento que o painel, entao a tela nova conversa com a API antiga
   * durante um tempo. Mostrar o que se sabe e melhor do que um erro vermelho
   * por cima de dados que estao ali.
   */
  const fichaMontadaLocalmente = (usuarioId: number) => {
    const participante = participantesDoGrupo.find((p) => p.usuarioId === usuarioId);
    if (!participante) return null;

    const valorParcela = Number(grupoSelecionado?.valorParcela) || 0;
    const duracao = Number(grupoSelecionado?.duracaoMeses) || 0;
    const saldo = Number(participante.saldoPoupanca) || 0;
    const total = valorParcela * duracao;
    const pagas = valorParcela > 0 ? Math.floor(saldo / valorParcela) : 0;

    return {
      parcial: true,
      id: usuarioId,
      nome: participante.nome,
      email: participante.email,
      numeroCliente: participante.numeroCliente ?? null,
      temCota: true,
      cotaId: participante.numeroCota,
      grupoNome: grupoSelecionado?.nome,
      valorParcela,
      saldoPago: saldo,
      valorTotalPlano: total,
      parcelasPagas: pagas,
      parcelasTotal: duracao,
      parcelasRestantes: Math.max(0, duracao - pagas),
      percentualPago: total > 0 ? (saldo * 100) / total : 0,
      faltaPagar: Math.max(0, total - saldo),

      // Dizer "em dia" ou "em atraso" exige a mesma conta que o servidor faz.
      // Refazer aqui por cima criaria uma segunda versao da verdade, entao a
      // tela assume que nao sabe.
      situacao: 'INDEFINIDA',
      foiSorteada: participante.foiSorteada,
      dataContemplacao: participante.dataContemplacao,
      dataEntrega: participante.dataEntrega,
      statusEntrega: participante.statusEntrega,
      outrosGrupos: Math.max(0, (Number(participante.qtdGrupos) || 1) - 1),
      transacoes: [],
      planos: [],
    };
  };

  const abrirFichaDoCliente = async (usuarioId: number | undefined, nome: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!usuarioId) return;

    setFichaCliente({ aberta: true, carregando: true, nome, dados: null });

    // A ficha e sempre lida no contexto do grupo aberto: a pergunta da loja e
    // como esta cliente esta neste plano, e nao quem ela e no cadastro.
    let dados: any = null;
    try {
      const res = await apiFetch(`${API_URL}/api/usuarios/${usuarioId}/ficha/${grupoSelecionado?.id}`);
      if (res.ok) dados = await res.json();
    } catch {
      // Sem rede ou sem a rota: o caminho de baixo resolve.
    }

    if (!dados) dados = fichaMontadaLocalmente(usuarioId);

    // A ficha nao registra falha de secao: ela tem plano B, e o aviso vermelho
    // no topo da tela diria que os numeros do grupo estao zerados, o que nao e
    // verdade.
    limparErro('Ficha do cliente');
    setFichaCliente({ aberta: true, carregando: false, nome, dados });
  };

  const abrirEdicaoDataInicio = () => {
    if (!grupoSelecionado) return;
    // Preenche com a data que a tela ja mostra, para corrigir o dia ser questao
    // de trocar um numero em vez de digitar tudo de novo.
    const atual = grupoSelecionado.dataInicio ? grupoSelecionado.dataInicio.slice(0, 10) : '';
    setModalDataInicio({ aberto: true, valor: atual, salvando: false });
  };

  const salvarDataInicioDoGrupo = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!grupoSelecionado || !modalDataInicio.valor) return;

    setModalDataInicio((prev) => ({ ...prev, salvando: true }));
    try {
      const res = await apiFetch(`${API_URL}/api/grupos/${grupoSelecionado.id}/data-inicio`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataInicio: modalDataInicio.valor }),
      });

      if (!res.ok) {
        mostrarAviso('Não foi possível salvar', await lerMensagemErro(res), true);
        return;
      }

      const salvo = await res.json();
      setGrupoSelecionado({ ...grupoSelecionado, dataInicio: salvo.dataInicio, dataTermino: salvo.dataTermino });
      setModalDataInicio({ aberto: false, valor: '', salvando: false });
      // A listagem tambem mostra as datas, entao recarrega para nao ficar
      // exibindo a antiga ao voltar da ficha do grupo.
      carregarGruposDoBanco();
      mostrarAviso('Datas Atualizadas', 'O início do grupo foi registrado e o término já foi recalculado.', false);
    } catch {
      mostrarAviso('Não foi possível salvar', 'Não foi possível conectar ao servidor.', true);
    } finally {
      setModalDataInicio((prev) => ({ ...prev, salvando: false }));
    }
  };

  const vincularClientePorEmail = async () => {
    const lojaId = usuario?.lojaId || usuario?.id;
    const email = emailNovoCliente.trim();
    if (!email) {
      mostrarAviso('E-mail Necessário', 'Informe o e-mail da cliente.', true);
      return;
    }

    setVinculandoCliente(true);
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error(await lerMensagemErro(res) || 'Falha ao adicionar a cliente.');

      const dados = await res.json();
      setEmailNovoCliente('');
      await carregarListaClientesDaLoja();
      mostrarAviso(dados.vinculoCriado ? 'Cliente Adicionada' : 'Já Cadastrada', dados.mensagem, !dados.vinculoCriado);
    } catch (err) {
      mostrarAviso('Erro', mensagemDeErro(err, 'Falha ao adicionar a cliente.'), true);
    } finally {
      setVinculandoCliente(false);
    }
  };

  const carregarSolicitacoesAcesso = async () => {
    const lojaId = usuario?.lojaId || usuario?.id;
    const data = await buscarJson<unknown[]>(
      'Aguardando análise de crédito',
      `${API_URL}/api/contemplacoes/loja/${lojaId}/aguardando-credito`,
      [],
    );
    if (Array.isArray(data)) setAguardandoCredito(data);
  };

  // Convoca alguem da fila para um grupo especifico. O vinculo em si e feito
  // pelo servidor, que revalida a vaga antes de gravar: entre a tela carregar
  // e a loja clicar, a ultima cota pode ter sido preenchida por outro caminho.
  const handleConvocarDaFila = async () => {
    const item = modalConvocar.item;
    const grupoId = Number(grupoDestinoConvocacao);

    if (!item || !grupoId) {
      mostrarAviso('Seleção Necessária', 'Escolha em qual grupo de compras esta cliente vai entrar.', true);
      return;
    }

    setProcessandoFilaId(item.id);

    try {
      const lojaId = usuario?.lojaId || usuario?.id;
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/fila-espera/${item.id}/convocar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupoId }),
      });

      if (!res.ok) throw new Error(await lerMensagemErro(res) || 'Falha ao convocar a cliente da fila.');

      setModalConvocar({ aberto: false, item: null });
      setGrupoDestinoConvocacao('');
      await Promise.all([carregarFilaEspera(), carregarGruposDoBanco()]);
      mostrarAviso('Cliente Convocada', `${item.nome} entrou no grupo de compras e saiu da fila de espera.`, false);
    } catch (err) {
      mostrarAviso('Erro', mensagemDeErro(err, 'Falha ao convocar a cliente da fila.'), true);
    } finally {
      setProcessandoFilaId(null);
    }
  };

  const handleRemoverDaFila = async (item: ItemFilaEspera) => {
    setProcessandoFilaId(item.id);

    try {
      const lojaId = usuario?.lojaId || usuario?.id;
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/fila-espera/${item.id}`, { method: 'DELETE' });

      if (!res.ok) throw new Error(await lerMensagemErro(res) || 'Falha ao remover a cliente da fila.');

      await carregarFilaEspera();
      mostrarAviso('Removida da Fila', `${item.nome} saiu da fila de espera desta unidade.`, false);
    } catch (err) {
      mostrarAviso('Erro', mensagemDeErro(err, 'Falha ao remover a cliente da fila.'), true);
    } finally {
      setProcessandoFilaId(null);
    }
  };

  // Registra a retirada do produto. A data e gravada pelo servidor, entao a tela
  // recarrega a lista em vez de adivinhar o valor que foi salvo.
  const handleRegistrarEntrega = async (cotaId: number, evento: React.MouseEvent) => {
    evento.stopPropagation();
    setRegistrandoEntregaId(cotaId);

    try {
      const res = await apiFetch(`${API_URL}/api/entregas/${cotaId}/registrar-entrega`, { method: 'PUT' });
      if (!res.ok) throw new Error(await lerMensagemErro(res) || 'Falha ao registrar a retirada.');

      await recarregarParticipantesDoGrupo();
      mostrarAviso('Retirada Registrada', 'A data da entrega foi gravada e aparece no painel da cliente.', false);
    } catch (err) {
      mostrarAviso('Erro', mensagemDeErro(err, 'Falha ao registrar a retirada.'), true);
    } finally {
      setRegistrandoEntregaId(null);
    }
  };

  const abrirLancamentoManual = (tipo: 'sorteio' | 'entrega' | 'correcao' | 'correcao-sorteio', cotaId: number, nome: string, evento: React.MouseEvent, dataAtual?: string | null) => {
    evento.stopPropagation();
    setModalManual({ aberto: true, tipo, cotaId, nome });
    // Na correcao o campo ja abre com a data gravada: quem corrige esta
    // ajustando um dia ou dois, nao redigitando do zero.
    setDataManual(dataAtual ? dataAtual.slice(0, 10) : '');
  };

  const abrirQuitacaoManual = (cotaId: number, nome: string, sorteada: boolean, evento: React.MouseEvent) => {
    evento.stopPropagation();
    setModalQuitacao({ aberto: true, cotaId, nome, sorteada });
    setParcelasQuitacao('1');
    setValorQuitacao('');
  };

  // Valor em reais vence a quantidade de parcelas quando os dois vem
  // preenchidos: quem digitou um valor exato quis aquele valor, e o campo de
  // parcelas fica com o "1" que ja vem por padrao.
  const confirmarQuitacaoManual = async () => {
    const { cotaId, sorteada } = modalQuitacao;
    if (!cotaId) return;

    const valor = Number(valorQuitacao.replace(',', '.'));
    const usaValor = valorQuitacao.trim() !== '' && !Number.isNaN(valor) && valor > 0;
    const parcelas = parseInt(parcelasQuitacao, 10);

    if (!usaValor && (Number.isNaN(parcelas) || parcelas <= 0)) {
      mostrarAviso('Valor Necessário', 'Informe a quantidade de parcelas ou um valor em reais.', true);
      return;
    }

    setProcessandoQuitacao(true);
    try {
      // Quem ja foi sorteada entra pela trilha de contemplacao, que devolve o
      // card com o saldo devedor; quem ainda nao foi usa o aporte comum. Um
      // botao so na tela, dois caminhos no servidor - a loja nao precisa saber
      // qual e qual para lancar o dinheiro que recebeu no balcao.
      const alvo = sorteada
        ? `${API_URL}/api/contemplacoes/${cotaId}/quitacao-manual`
        : `${API_URL}/api/entregas/${cotaId}/pagamento-manual`;

      const res = await apiFetch(alvo, {
        method: sorteada ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usaValor ? { valorCustomizado: valor } : { quantidadeParcelas: parcelas }),
      });

      if (!res.ok) throw new Error(await lerMensagemErro(res) || 'Falha ao lançar a baixa.');

      setModalQuitacao({ aberto: false, cotaId: null, nome: '', sorteada: false });
      await recarregarParticipantesDoGrupo();
      carregarDadosFinanceiros();

      if (sorteada) {
        const card: CardContemplacao = await res.json();
        mostrarAviso(
          card.quitada ? 'Cota Quitada' : 'Baixa Efetuada',
          card.quitada
            ? 'O plano desta cliente está quitado. A data do lançamento foi gravada pelo servidor.'
            : `Lançado. Falta R$ ${Number(card.saldoDevedor ?? 0).toFixed(2)} para quitar.`,
          false
        );
      } else {
        mostrarAviso('Baixa Efetuada', 'Valor lançado na poupança desta cota.', false);
      }
    } catch (err) {
      mostrarAviso('Erro de Lançamento', mensagemDeErro(err, 'Falha ao lançar a baixa.'), true);
    } finally {
      setProcessandoQuitacao(false);
    }
  };

  // Lancamento retroativo: serve para registrar o que ja aconteceu fora do
  // sistema. Sem data informada, o servidor usa o dia de hoje.
  const confirmarLancamentoManual = async () => {
    const { tipo, cotaId } = modalManual;
    if (!cotaId) return;

    setProcessandoManual(true);
    try {
      const alvo = tipo === 'sorteio'
        ? `${API_URL}/api/sorteios/registro-manual`
        : tipo === 'correcao-sorteio'
          ? `${API_URL}/api/sorteios/${cotaId}/corrigir-data-contemplacao`
          : tipo === 'correcao'
            ? `${API_URL}/api/entregas/${cotaId}/corrigir-data-entrega`
            : `${API_URL}/api/entregas/${cotaId}/registrar-entrega`;

      if ((tipo === 'correcao' || tipo === 'correcao-sorteio') && !dataManual) {
        mostrarAviso('Data Necessária',
          tipo === 'correcao-sorteio' ? 'Informe a data correta do sorteio.' : 'Informe a data correta da entrega.',
          true);
        setProcessandoManual(false);
        return;
      }

      const res = await apiFetch(alvo, {
        method: tipo === 'sorteio' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tipo === 'sorteio'
          ? { cotaId, data: dataManual || undefined }
          : { data: dataManual || undefined }),
      });

      if (!res.ok) throw new Error(await lerMensagemErro(res) || 'Falha ao registrar.');

      setModalManual({ aberto: false, tipo: 'sorteio', cotaId: null, nome: '' });
      await recarregarParticipantesDoGrupo();
      mostrarAviso(
        tipo === 'sorteio' ? 'Contemplação Registrada'
          : tipo === 'correcao' || tipo === 'correcao-sorteio' ? 'Data Corrigida' : 'Retirada Registrada',
        tipo === 'sorteio'
          ? 'Lançada no histórico e marcada como registro manual, sem apuração auditável.'
          : tipo === 'correcao-sorteio'
            ? 'A data do sorteio foi ajustada, na cota e no registro do histórico.'
            : tipo === 'correcao'
              ? 'A data da entrega foi ajustada e já aparece no painel da cliente.'
              : 'A data da entrega foi gravada e aparece no painel da cliente.',
        false
      );
    } catch (err) {
      mostrarAviso('Erro', mensagemDeErro(err, 'Falha ao registrar.'), true);
    } finally {
      setProcessandoManual(false);
    }
  };

  const carregarFilaEspera = async () => {
    const lojaId = usuario?.lojaId || usuario?.id;
    const url = `${API_URL}/api/lojas/${lojaId}/fila-espera`;

    // Uma requisicao so: 404 aqui quer dizer endpoint ainda nao publicado, e nao
    // falha de carregamento. Os demais erros seguem pelo buscarJson, que avisa o
    // operador no topo do painel.
    try {
      const res = await apiFetch(url);

      if (res.status === 404) {
        setFilaPublicadaNaApi(false);
        setFilaEspera([]);
        limparErro('Fila de espera');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setFilaPublicadaNaApi(true);
        setFilaEspera(Array.isArray(data) ? (data as ItemFilaEspera[]) : []);
        limparErro('Fila de espera');
        return;
      }
    } catch {
      // Rede fora do ar: cai no buscarJson abaixo, que faz as tentativas e avisa.
    }

    setFilaPublicadaNaApi(true);
    const data = await buscarJson<unknown[]>('Fila de espera', url, []);
    if (Array.isArray(data)) setFilaEspera(data as ItemFilaEspera[]);
  };

  const recarregarParticipantesDoGrupo = async () => {
    if (!grupoSelecionado) return;
    const data = await buscarJson<unknown[]>('Participantes do grupo', `${API_URL}/api/usuarios/comunidade/${grupoSelecionado.id}/participantes`, []);
    if (Array.isArray(data)) setParticipantesDoGrupo(data);
  };

  useEffect(() => {
    const lojaId = usuario?.lojaId || usuario?.id;
    
    buscarJson<{ nomeComercial?: string; permiteSorteioManual?: boolean } | null>('Dados da loja', `${API_URL}/api/lojas/${lojaId}`, null)
      .then(data => {
         setPermiteSorteioManual(Boolean(data?.permiteSorteioManual));
         if(data && data.nomeComercial) {
            setNomeLojaReal(data.nomeComercial);
         }
      });

    carregarGruposDoBanco();
    carregarDadosFinanceiros();
    carregarContagemClientes(lojaId);
    carregarSolicitacoesAcesso();
    carregarFilaEspera();
    carregarListaClientesDaLoja();
    carregarAnalytics();

    const intervaloNotificacoes = setInterval(carregarSolicitacoesAcesso, 15000);
    return () => clearInterval(intervaloNotificacoes);
  }, [usuario?.lojaId, usuario?.id]);

  useEffect(() => {
    if (grupoSelecionado) recarregarParticipantesDoGrupo();
  }, [grupoSelecionado]);

  const handleCopiarLinkConvite = () => {
    const lojaId = usuario?.lojaId || usuario?.id || 1;
    const nomeBruto = nomeLojaReal || usuario?.lojaNome || usuario?.nome || 'loja';
    const slugFormatado = nomeBruto.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const link = `${window.location.origin}/convite/${lojaId}-${slugFormatado}`;
    
    navigator.clipboard.writeText(link).then(() => {
      mostrarAviso('Link Copiado', 'O link exclusivo da sua loja foi copiado com sucesso!', false);
    }).catch(() => {
      mostrarAviso('Erro', 'Não foi possível copiar o link automaticamente.', true);
    });
  };

  /**
   * Decide o credito de uma contemplada.
   *
   * Reprovar nao tira a contemplacao dela: a cota vai para "aguardando
   * encerramento" e a cliente retira no fim do plano. Por isso o motivo e
   * exigido - e ele que a cliente le no painel dela para entender o que
   * aconteceu.
   */
  const handleAnalisarCredito = async (cotaId: number, aprovado: boolean, motivo?: string) => {
     if (!aprovado && !motivo?.trim()) {
        setMotivoReprovacao({ cotaId, texto: '' });
        return;
     }

     setProcessandoCreditoId(cotaId);
     try {
        const res = await apiFetch(`${API_URL}/api/contemplacoes/${cotaId}/credito`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ aprovado, motivo: motivo?.trim() || null }),
        });

        if (res.ok) {
           mostrarAviso(
              aprovado ? 'Crédito liberado' : 'Crédito não liberado',
              aprovado
                 ? 'A cliente já pode escolher o produto no painel dela.'
                 : 'A contemplação continua registrada: ela retira no encerramento do grupo.',
              !aprovado,
           );
           setMotivoReprovacao(null);
           carregarSolicitacoesAcesso();
           carregarDadosFinanceiros();
        } else {
           mostrarAviso('Erro de Sistema', await lerMensagemErro(res), true);
        }
     } catch (e) {
        mostrarAviso('Sem Conexão', 'Não foi possível conectar ao servidor.', true);
     } finally {
        setProcessandoCreditoId(null);
     }
  };

  const handleAbrirBloqueio = (cliente: any) => {
     setClienteParaBloquear(cliente);
     setMotivoBloqueio('');
     setModalBloqueioAberto(true);
  };

  const confirmarBloqueioCliente = async (e: React.SyntheticEvent<HTMLFormElement>) => {
     e.preventDefault();
     setProcessandoBloqueio(true);
     const lojaId = usuario?.lojaId || usuario?.id;
     try {
        const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/clientes/${clienteParaBloquear.id}/bloquear`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ motivo: motivoBloqueio })
        });

        if (!res.ok) {
           const textoErro = await res.text();
           throw new Error(textoErro || 'Falha ao bloquear cliente.');
        }

        mostrarAviso('Cliente Removido', 'O acesso deste cliente à sua loja foi bloqueado e o motivo gravado no histórico corporativo com sucesso.', false);
        setModalBloqueioAberto(false);
        carregarListaClientesDaLoja();
        carregarContagemClientes(lojaId);
     } catch(err: any) {
        mostrarAviso('Erro ao Remover', err.message, true);
     } finally {
        setProcessandoBloqueio(false);
     }
  };

  const handleRemoverParticipanteDoGrupo = (cotaId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalExclusao({
      aberto: true,
      tipo: 'participante',
      idTarget: cotaId,
      titulo: 'Remover Participante',
      mensagem: 'Tem certeza que deseja remover este participante do grupo? A cota será zerada e o histórico de participação neste clube será cancelado permanentemente.'
    });
  };

  const handleExcluirGrupo = (grupoId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalExclusao({
      aberto: true,
      tipo: 'grupo',
      idTarget: grupoId,
      titulo: 'Excluir Grupo de Compras',
      mensagem: 'Tem certeza que deseja excluir este grupo de compras? Esta ação não pode ser desfeita e removerá todas as cotas e recebimentos futuros atrelados a ele.'
    });
  };

  const confirmarExclusao = async () => {
    const { tipo, idTarget } = modalExclusao;
    setModalExclusao({ ...modalExclusao, aberto: false }); 

    if (tipo === 'participante') {
      try {
        const res = await apiFetch(`${API_URL}/api/cotas/${idTarget}`, { method: 'DELETE' });
        if (!res.ok) {
          const textoErro = await res.text();
          throw new Error(textoErro || 'Falha ao remover participante.');
        }

        mostrarAviso('Participante Removido', 'O cliente foi desligado deste grupo de compras com sucesso.', false);
        
        if (idOperacao === idTarget.toString()) {
          setIdOperacao('Nenhuma');
        }

        recarregarParticipantesDoGrupo();
        carregarContagemClientes(usuario?.lojaId || usuario?.id);
        carregarDadosFinanceiros(); 
      } catch (err: any) {
        mostrarAviso('Erro ao Remover', err.message, true);
      }
    } else if (tipo === 'grupo') {
      try {
        const res = await apiFetch(`${API_URL}/api/grupos/${idTarget}`, { method: 'DELETE' });
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

  // A lista sai do próprio grupo (e não de listaClientesLoja) porque so o servidor
  // sabe quem já ocupa cota nele e quantas vagas ainda restam.
  const carregarClientesDisponiveis = async (grupoId: number) => {
    setCarregandoDisponiveis(true);
    setErroDisponiveis('');
    try {
      const res = await apiFetch(`${API_URL}/api/grupos/${grupoId}/clientes-disponiveis`);
      if (!res.ok) throw new Error(await lerMensagemErro(res));

      const data = await res.json();
      setClientesDisponiveis(Array.isArray(data?.clientes) ? data.clientes : []);
      setVagasDisponiveis(Number(data?.vagasDisponiveis) || 0);
    } catch (err) {
      setClientesDisponiveis([]);
      setVagasDisponiveis(0);
      setErroDisponiveis(err instanceof Error && err.message
        ? err.message
        : 'Não foi possível carregar os clientes da sua unidade.');
    } finally {
      setCarregandoDisponiveis(false);
    }
  };

  const handleAbrirAdicaoParticipantes = () => {
    if (!grupoSelecionado) return;
    setClientesSelecionados([]);
    setBuscaClienteGrupo('');
    setModalAddParticipantesAberto(true);
    carregarClientesDisponiveis(grupoSelecionado.id);
  };

  const alternarSelecaoCliente = (clienteId: number) => {
    setClientesSelecionados((atual) =>
      atual.includes(clienteId) ? atual.filter((id) => id !== clienteId) : [...atual, clienteId]
    );
  };

  const handleAdicionarParticipantes = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!grupoSelecionado || clientesSelecionados.length === 0) return;

    setSalvandoParticipantes(true);
    try {
      const res = await apiFetch(`${API_URL}/api/grupos/${grupoSelecionado.id}/participantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteIds: clientesSelecionados })
      });

      if (!res.ok) throw new Error(await lerMensagemErro(res));

      const data = await res.json();
      const incluidos = Array.isArray(data?.adicionados) ? data.adicionados.length : 0;
      const recusados: ClienteRecusado[] = Array.isArray(data?.ignorados) ? data.ignorados : [];

      // A API avalia cliente a cliente, então a seleção pode entrar so em parte.
      // O detalhe de quem ficou de fora precisa chegar ao operador.
      const detalhe = recusados.length > 0
        ? `\n\nNao incluidos:\n${recusados.map((r) => `- ${r.nome}: ${r.motivo}`).join('\n')}`
        : '';

      mostrarAviso(
        incluidos > 0 ? 'Participantes Adicionados' : 'Nenhuma Inclusao Realizada',
        `${data?.mensagem || ''}${detalhe}`,
        incluidos === 0
      );

      if (incluidos > 0) {
        setModalAddParticipantesAberto(false);
        recarregarParticipantesDoGrupo();
        carregarListaClientesDaLoja();
        carregarContagemClientes(usuario?.lojaId || usuario?.id);
      } else {
        // Modal segue aberto para corrigir a seleção, mas com a lista atualizada.
        setClientesSelecionados([]);
        carregarClientesDisponiveis(grupoSelecionado.id);
      }
    } catch (err) {
      mostrarAviso(
        'Erro ao Adicionar',
        err instanceof Error && err.message ? err.message : 'Não foi possível salvar os participantes.',
        true
      );
    } finally {
      setSalvandoParticipantes(false);
    }
  };

  const handleCadastrarCliente = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcessandoCliente(true);
    const lojaId = usuario?.lojaId || usuario?.id;
    try {
      const payload = {
        nome: nomeCliente, email: emailCliente,
        cpf: cpfCliente.replace(/\D/g, ''), telefone: telefoneCliente.replace(/\D/g, ''),
        lojaId: lojaId
      };

      const res = await apiFetch(`${API_URL}/api/usuarios/cadastrar-cliente`, {
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
        `${data.mensagem}\n\nLogin / E-mail: ${data.email || 'Não informado'}\nSenha Padrão Inicial: ${data.senhaPadrao}\n\nA cliente já pode acessar o Dashboard do Cliente utilizando estas credenciais ou o próprio CPF caso o email esteja em branco.`, 
        false
      );

      setNomeCliente(''); setEmailCliente(''); setCpfCliente(''); setTelefoneCliente('');
      setModalNovoClienteAberto(false);
      carregarContagemClientes(lojaId);
      carregarListaClientesDaLoja();
    } catch (err: any) {
      mostrarAviso('Erro de Cadastro', err.message, true);
    } finally {
      setProcessandoCliente(false);
    }
  };

  const handleCriarGrupo = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const lojaId = usuario?.lojaId || usuario?.id;
    const meses = parseInt(duracaoMeses);
    const total = parseFloat(valorTotal);
    if (!meses || meses <= 0 || !total || total <= 0) {
      mostrarAviso('Dados Inválidos', 'Informe um valor total e duração válidos.', true);
      return;
    }
    const parcela = parseFloat((total / meses).toFixed(2));
    try {
      const payload = {
        nome: nomeGrupo, valorTotal: total, valorParcela: parcela,
        duracaoMeses: meses, quantidadeMaxCotas: parseInt(maxCotas),
        lojaId: lojaId
      };

      const res = await apiFetch(`${API_URL}/api/grupos/criar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const erroServidor = await res.text();
        throw new Error(erroServidor || 'Falha ao registrar novo clube de compras.');
      }

      mostrarAviso('Sucesso Comercial', 'Clube de Compras lançado com sucesso!', false);
      setNomeGrupo(''); setValorTotal('');
      setModalNovoGrupoAberto(false);
      carregarGruposDoBanco();
    } catch (err: any) {
      mostrarAviso('Erro Operacional', err.message, true);
    }
  };

  const handleLancarPagamentoManual = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (idOperacao === 'Nenhuma') {
      mostrarAviso('Seleção Necessária', 'Selecione uma cota na tabela antes de lançar o pagamento.', true);
      return;
    }

    setProcessandoPagamentoManual(true);
    try {
      const res = await apiFetch(`${API_URL}/api/entregas/${idOperacao}/pagamento-manual`, {
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

  const carregarPainelDeSorteio = async (grupoId: string) => {
    if (!grupoId) {
      setSorteiosDoGrupo([]); setElegiveisDoGrupo([]); setContemplacoesEmCurso([]);
      return;
    }

    const [sorteios, elegiveis, participantes] = await Promise.all([
      buscarJson<SorteioResumo[]>('Sorteios do grupo', `${API_URL}/api/sorteios/grupo/${grupoId}`, []),
      buscarJson<CotaElegivel[]>('Cotas elegiveis', `${API_URL}/api/sorteios/grupo/${grupoId}/elegiveis`, []),
      buscarJson<{ numeroCota: number }[]>('Participantes do grupo', `${API_URL}/api/usuarios/comunidade/${grupoId}/participantes`, []),
    ]);

    setSorteiosDoGrupo(Array.isArray(sorteios) ? sorteios : []);
    setElegiveisDoGrupo(Array.isArray(elegiveis) ? elegiveis : []);

    // O card de cada contemplada vem por cota; quem nunca foi sorteada devolve
    // 204/erro e simplesmente não entra na lista.
    const cards = await Promise.all(
      (Array.isArray(participantes) ? participantes : []).map(async (p) => {
        try {
          const res = await apiFetch(`${API_URL}/api/contemplacoes/cota/${p.numeroCota}`);
          if (!res.ok) return null;
          return (await res.json()) as CardContemplacao;
        } catch {
          return null;
        }
      })
    );
    setContemplacoesEmCurso(cards.filter((c): c is CardContemplacao => c !== null));
  };

  const agendarSorteio = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!grupoSorteioId) return;

    setProcessandoSorteio(true);
    try {
      const res = await apiFetch(`${API_URL}/api/sorteios/agendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupoId: Number(grupoSorteioId),
          dataCorte: dataCorteSorteio || undefined,
        }),
      });

      const retorno = await res.json().catch(() => null);
      if (!res.ok) throw new Error(retorno?.erro || 'Falha ao agendar o sorteio.');

      mostrarAviso(
        'Sorteio Agendado',
        `Lista congelada com ${retorno.quantidadeParticipantes} participantes.\n\n` +
        `Apuração pelo concurso ${retorno.concursoLoteria ?? '(a definir)'} da Loteria Federal, ` +
        `previsto para ${retorno.dataPrevistaConcurso}.\n\n` +
        `Código de auditoria: ${retorno.codigoAuditoria}\n\n` +
        'A partir de agora a lista não muda mais. O resultado sai sozinho após o concurso.',
        false
      );
      carregarPainelDeSorteio(grupoSorteioId);
    } catch (err) {
      mostrarAviso('Não foi possível agendar', mensagemDeErro(err, 'Falha ao agendar o sorteio.'), true);
    } finally {
      setProcessandoSorteio(false);
    }
  };

  const apurarSorteio = async (sorteioId: number) => {
    setProcessandoSorteio(true);
    try {
      const res = await apiFetch(`${API_URL}/api/sorteios/${sorteioId}/apurar`, { method: 'POST' });
      const retorno = await res.json().catch(() => null);
      if (!res.ok) throw new Error(retorno?.erro || 'Falha ao apurar.');

      mostrarAviso(
        'Sorteio Apurado',
        `Contemplada: ${retorno.contempladaNome}\nCota #${retorno.cotaContempladaId}\n\n` +
        `Concurso ${retorno.concursoLoteria} · número ${retorno.numeroSorteadoFonte}\n` +
        `Código de auditoria: ${retorno.codigoAuditoria}`,
        false
      );
      carregarPainelDeSorteio(grupoSorteioId);
      carregarGruposDoBanco();
    } catch (err) {
      mostrarAviso('Apuração Suspensa', mensagemDeErro(err, 'Falha ao apurar o sorteio.'), true);
    } finally {
      setProcessandoSorteio(false);
    }
  };

  const avancarEtapaContemplacao = async (cotaId: number, rota: string, corpo?: Record<string, unknown>) => {
    setProcessandoSorteio(true);
    try {
      const res = await apiFetch(`${API_URL}/api/contemplacoes/${cotaId}/${rota}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo || {}),
      });
      const retorno = await res.json().catch(() => null);
      if (!res.ok) throw new Error(retorno?.erro || 'Falha ao atualizar a etapa.');

      setContemplacoesEmCurso((atual) => atual.map((c) => (c.cotaId === cotaId ? retorno : c)));
      return true;
    } catch (err) {
      mostrarAviso('Erro na Etapa', mensagemDeErro(err, 'Falha ao atualizar a etapa.'), true);
      return false;
    } finally {
      setProcessandoSorteio(false);
    }
  };

  const confirmarReprovaCredito = async () => {
    if (!modalReprovaCredito.cotaId || motivoReprovaCredito.trim() === '') return;
    const ok = await avancarEtapaContemplacao(modalReprovaCredito.cotaId, 'credito', {
      aprovado: false,
      motivo: motivoReprovaCredito.trim(),
    });
    if (ok) {
      setModalReprovaCredito({ aberto: false, cotaId: null });
      setMotivoReprovaCredito('');
      mostrarAviso('Crédito Reprovado', 'A cliente foi avisada no painel dela e retira o produto quando o grupo encerrar.', false);
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

  const handleEnviarPdf = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!arquivoPdf) {
      mostrarAviso('Campo Requerido', 'Selecione um arquivo PDF antes de enviar.', true);
      return;
    }

    setEnviandoPdf(true);
    const formData = new FormData();
    formData.append('file', arquivoPdf);
    
    const lojaId = usuario?.lojaId || usuario?.id;

    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/regras`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Não foi possível salvar o documento de regras.');
      mostrarAviso('Regulamento Salvo', 'Regulamento contratual em PDF registrado com sucesso para esta loja!', false);
      setArquivoPdf(null);
    } catch (err: any) {
      mostrarAviso('Erro de Salvamento', err.message, true);
    } finally {
      setEnviandoPdf(false);
    }
  };

  const carregarDadosDaLoja = async () => {
    const lojaId = usuario?.lojaId || usuario?.id;
    if (!lojaId) return;

    setCarregandoDadosLoja(true);
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/dados`);
      if (!res.ok) throw new Error(await lerMensagemErro(res));
      setDadosLoja(await res.json());
    } catch (err: any) {
      mostrarAviso('Erro ao carregar', err.message || 'Não foi possível ler os dados da loja.', true);
    } finally {
      setCarregandoDadosLoja(false);
    }
  };

  // Busca uma vez, ao abrir a aba. Recarregar a cada visita descartaria o que a
  // pessoa digitou e ainda nao salvou.
  useEffect(() => {
    if (abaLoja === 'configuracoes' && dadosLoja === null && !carregandoDadosLoja) {
      carregarDadosDaLoja();
    }
  }, [abaLoja]);

  const alterarCampoDaLoja = (campo: string, valor: string) =>
    setDadosLoja((atual: any) => ({ ...(atual ?? {}), [campo]: valor }));

  const handleSalvarDadosDaLoja = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const lojaId = usuario?.lojaId || usuario?.id;
    if (!lojaId || !dadosLoja) return;

    setSalvandoDadosLoja(true);
    try {
      // Só os campos editáveis. CNPJ e status de homologação vêm na mesma
      // resposta para a loja consultar, mas quem os altera é a AVLE.
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeComercial: dadosLoja.nomeComercial,
          telefone: dadosLoja.telefone,
          cep: dadosLoja.cep,
          chavePix: dadosLoja.chavePix,
          faturamento: dadosLoja.faturamento,
          bancoCodigo: dadosLoja.bancoCodigo,
          agencia: dadosLoja.agencia,
          conta: dadosLoja.conta,
          contaDigito: dadosLoja.contaDigito,
          tipoConta: dadosLoja.tipoConta,
          asaasWalletId: dadosLoja.asaasWalletId,
        }),
      });
      if (!res.ok) throw new Error(await lerMensagemErro(res));

      setDadosLoja(await res.json());
      mostrarAviso('Dados salvos', 'O cadastro da sua loja foi atualizado.', false);
    } catch (err: any) {
      mostrarAviso('Não foi possível salvar', err.message || 'Tente novamente.', true);
    } finally {
      setSalvandoDadosLoja(false);
    }
  };

  // Faturamento de um grupo especifico. O analytics ja traz o consolidado por
  // grupo, entao a ficha e o card leem daqui em vez de refazer a conta - duas
  // contas separadas para o mesmo numero acabam divergindo.
  const faturamentoDoGrupo = (grupoId?: number) =>
    (analytics?.faturamentoPorGrupo ?? []).find((g) => g.grupoId === grupoId);

  const recebidoEsteMes = Number(dadosFinanceiros?.recebidoEsteMes) || 0;
  const aReceberContemplados = Number(dadosFinanceiros?.aReceberContemplados) || 0;
  const totalParticipantesValidos = Array.isArray(participantesDoGrupo) ? participantesDoGrupo.length : 0;
  const totalGruposValidos = Array.isArray(listaGrupos) ? listaGrupos.length : 0;

  const termoBuscaCliente = buscaClienteGrupo.trim().toLowerCase();
  const clientesDisponiveisFiltrados = clientesDisponiveis.filter((c) => {
    if (!termoBuscaCliente) return true;
    return `${c.nome || ''} ${c.email || ''} ${c.cpf || ''}`.toLowerCase().includes(termoBuscaCliente);
  });
  // Trava a seleção na quantidade de vagas para o operador não montar um envio
  // que o servidor recusaria pela metade.
  const limiteSelecaoAtingido = clientesSelecionados.length >= vagasDisponiveis;

  const clientesAtivos = listaClientesLoja.filter(c => c.statusAcesso !== 'BLOQUEADO' && c.statusAcesso !== 'REJEITADO');
  const clientesBloqueados = listaClientesLoja.filter(c => c.statusAcesso === 'BLOQUEADO' || c.statusAcesso === 'REJEITADO');

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-[#0B1E14] bg-[#F0F2F5] relative">
      
      <aside className="w-full md:w-64 bg-[#0B1E14] text-[#E3EAE6] flex flex-col justify-between p-6 flex-shrink-0">
        <div>
          <div className="mb-8 border-b border-white/10 pb-6">
            <h1 className="text-xl font-serif font-bold text-white tracking-wide">AVLE</h1>
            <p className="text-xs text-stone-400 font-medium mt-0.5">
              {nomeLojaReal || usuario?.lojaNome || 'Unidade Administrativa'}
            </p>
          </div>
          
          <nav className="space-y-0.5 mt-2">
            {[
              { id: 'geral',      label: 'Visão Geral' },
              { id: 'clientes',   label: 'Clientes' },
              { id: 'aprovacoes', label: 'Aprovações' },
              { id: 'fila',       label: 'Fila de Espera' },
              { id: 'grupos',     label: 'Grupos' },
              { id: 'sorteios',   label: 'Sorteios / Entrega' },
              { id: 'financeiro', label: 'Financeiro' },
              { id: 'relatorios', label: 'Relatórios' }
            ].map((tab) => {
              const isActive = abaLoja === tab.id && !grupoSelecionado;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setGrupoSelecionado(null); setAbaLoja(tab.id as any); }}
                  className={`w-full text-left py-2.5 text-[11px] font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer flex justify-between items-center border-l-2 ${
                    isActive
                      ? 'border-[#BD6B42] text-white bg-white/5 pl-5 pr-4'
                      : 'border-transparent text-stone-500 hover:text-stone-300 hover:border-white/20 pl-4 pr-4 hover:pl-5'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.id === 'aprovacoes' && aguardandoCredito.length > 0 && (
                    <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md animate-pulse">
                      {aguardandoCredito.length}
                    </span>
                  )}
                  {tab.id === 'fila' && filaEspera.length > 0 && (
                    <span className="bg-[#BD6B42] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      {filaEspera.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
          <button
            onClick={() => { setGrupoSelecionado(null); setAbaLoja('configuracoes'); }}
            className={`text-[11px] font-bold tracking-widest uppercase transition-all cursor-pointer border-l-2 pl-3 py-1 ${
              abaLoja === 'configuracoes' ? 'border-[#BD6B42] text-white' : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            Configurações
          </button>
          <button
            onClick={async () => { await encerrarSessao(); window.location.href = '/'; }}
            className="text-stone-500 hover:text-red-400 text-[10px] font-bold transition-all cursor-pointer tracking-wider uppercase"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 max-w-7xl overflow-x-hidden space-y-6">
        {Object.keys(errosApi).length > 0 && (
          <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-1.5">
            <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest">
              Falha ao carregar dados do servidor
            </p>
            {Object.entries(errosApi).map(([secao, mensagem]) => (
              <p key={secao} className="text-xs text-red-800 break-words">
                <span className="font-semibold">{secao}:</span> {mensagem}
              </p>
            ))}
            <p className="text-[10px] text-red-600 pt-1">
              Os números abaixo podem estar zerados ou incompletos. Isso não significa ausência de registros.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#DFD9CE] pb-5">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
              AVLE · {nomeLojaReal || 'Unidade'} · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">
              {grupoSelecionado
                ? `Ficha: ${grupoSelecionado.nome}`
                : abaLoja === 'geral'        ? 'Visão Geral Comercial'
                : abaLoja === 'clientes'     ? 'Registro de Clientes'
                : abaLoja === 'configuracoes'? 'Configurações da Loja'
                : abaLoja === 'aprovacoes'   ? 'Central de Aprovações'
                : abaLoja === 'sorteios'     ? 'Sorteios e Entregas'
                : abaLoja === 'financeiro'   ? 'Financeiro / Extrato'
                : abaLoja === 'relatorios'   ? 'Relatórios de Performance'
                : abaLoja === 'fila'         ? 'Fila de Espera'
                : abaLoja === 'grupos'       ? 'Grupos de Compras'
                : abaLoja}
            </h2>
          </div>
          
          {!grupoSelecionado && (abaLoja === 'geral' || abaLoja === 'grupos' || abaLoja === 'aprovacoes' || abaLoja === 'clientes') && (
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={handleCopiarLinkConvite} 
                className="bg-white border border-stone-200 text-[#0B1E14] px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-sm hover:bg-stone-50 transition-all cursor-pointer"
              >
                Copiar Link da Loja
              </button>
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
              <div className="flex items-center gap-2">
                <button
                   type="button"
                   onClick={handleAbrirAdicaoParticipantes}
                   className="text-xs font-bold text-white bg-[#BD6B42] hover:bg-[#A95A33] transition-all border border-[#BD6B42] px-4 py-2 rounded-xl cursor-pointer shadow-xs"
                >
                  + Adicionar Cliente
                </button>
                <button 
                   onClick={(e) => handleExcluirGrupo(grupoSelecionado.id, e)} 
                   className="text-xs font-bold text-rose-700 hover:text-white hover:bg-rose-700 transition-all bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl cursor-pointer shadow-xs"
                >
                  Excluir Grupo
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
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
                <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">Faturado</span>
                <span className="text-base font-bold text-emerald-700 font-mono block mt-1">
                  R$ {(faturamentoDoGrupo(grupoSelecionado.id)?.faturado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">Previsto</span>
                <span className="text-base font-bold text-stone-500 font-mono block mt-1">
                  R$ {(faturamentoDoGrupo(grupoSelecionado.id)?.previsto ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">Cotas Preenchidas</span>
                <span className="text-base font-bold text-[#BD6B42] font-mono block mt-1">{totalParticipantesValidos} / {grupoSelecionado.quantidadeMaxCotas}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">Início</span>
                <span className="text-base font-bold text-[#0B1E14] font-mono block mt-1">
                  {grupoSelecionado.dataInicio
                    ? new Date(grupoSelecionado.dataInicio).toLocaleDateString('pt-BR')
                    : '—'}
                </span>
                <button
                  type="button"
                  onClick={abrirEdicaoDataInicio}
                  className="text-[9px] font-bold text-stone-500 hover:underline cursor-pointer uppercase tracking-wider mt-0.5"
                >
                  {grupoSelecionado.dataInicio ? 'Corrigir' : 'Informar'}
                </button>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">Término</span>
                <span className="text-base font-bold text-[#0B1E14] font-mono block mt-1">
                  {grupoSelecionado.dataTermino
                    ? new Date(grupoSelecionado.dataTermino).toLocaleDateString('pt-BR')
                    : '—'}
                </span>
                <span className="text-[9px] text-stone-400 block mt-0.5">início + {grupoSelecionado.duracaoMeses} meses</span>
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
                      <th className="py-3.5 px-5 text-center">STATUS</th>
                      <th className="py-3.5 px-5 text-center">ENTREGA</th>
                      <th className="py-3.5 px-5 text-right">SALDO QUITADO</th>
                      <th className="py-3.5 px-5 text-right">VALOR COBERTO (RISCO)</th>
                      <th className="py-3.5 px-5 text-center">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                    {totalParticipantesValidos === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center">
                          <p className="text-stone-400 italic mb-3">Nenhum participante vinculado a este grupo ainda.</p>
                          <button
                            type="button"
                            onClick={handleAbrirAdicaoParticipantes}
                            className="px-4 py-2 bg-[#0B1E14] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider hover:bg-opacity-90 transition-all cursor-pointer shadow-xs"
                          >
                            + Adicionar Cliente
                          </button>
                        </td>
                      </tr>
                    ) : (
                      participantesDoGrupo.map((part) => {
                        const isSelecionado = idOperacao === part.numeroCota.toString();
                        return (
                          <tr key={part.id} onClick={() => setIdOperacao(part.numeroCota.toString())} className={`transition-all cursor-pointer ${isSelecionado ? 'bg-amber-50/70 hover:bg-amber-100/70 font-bold' : 'hover:bg-stone-50/60'}`}>
                            <td className="py-3.5 px-5 text-center font-mono font-bold text-[#BD6B42]">#0{part.numeroCota}</td>
                            <td className="py-3.5 px-5">
                              <button
                                type="button"
                                onClick={(e) => abrirFichaDoCliente(part.usuarioId, part.nome, e)}
                                className="block text-left font-bold text-[#0B1E14] hover:text-[#BD6B42] hover:underline cursor-pointer"
                              >
                                {part.nome}
                              </button>
                              <span className="text-[10px] text-stone-400 font-mono">
                                {part.numeroCliente != null && (
                                  <span className="text-stone-500 font-bold mr-2">
                                    {numeroDaCliente(part.numeroCliente)}
                                  </span>
                                )}
                                {part.email}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-center">
                              {part.foiSorteada ? (
                                <>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border bg-amber-50 text-amber-700 border-amber-200">
                                    Sorteada
                                  </span>
                                  {part.dataContemplacao && (
                                    <span className="block text-[9px] text-stone-400 font-mono mt-1">
                                      {new Date(part.dataContemplacao).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                  {part.dataContemplacao && (
                                    <button
                                      type="button"
                                      onClick={(e) => abrirLancamentoManual('correcao-sorteio', part.id, part.nome, e, part.dataContemplacao)}
                                      className="block mx-auto mt-1 text-[9px] font-bold text-stone-500 hover:underline cursor-pointer uppercase tracking-wider"
                                    >
                                      Corrigir data
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => abrirQuitacaoManual(part.id, part.nome, true, e)}
                                    className="block mx-auto mt-1.5 text-[9px] font-bold text-[#BD6B42] hover:underline cursor-pointer uppercase tracking-wider"
                                  >
                                    Baixa manual
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border bg-stone-50 text-stone-500 border-stone-200">
                                    Aguardando sorteio
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => abrirLancamentoManual('sorteio', part.id, part.nome, e)}
                                    className="block mx-auto mt-1.5 text-[9px] font-bold text-[#BD6B42] hover:underline cursor-pointer uppercase tracking-wider"
                                  >
                                    Lançar sorteio
                                  </button>
                                </>
                              )}
                            </td>

                            <td className="py-3.5 px-5 text-center">
                              {part.dataEntrega ? (
                                <>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
                                    Entregue
                                  </span>
                                  <span className="block text-[9px] text-stone-500 font-mono mt-1">
                                    {new Date(part.dataEntrega).toLocaleDateString('pt-BR')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => abrirLancamentoManual('correcao', part.id, part.nome, e, part.dataEntrega)}
                                    className="block mx-auto mt-1 text-[9px] font-bold text-stone-500 hover:underline cursor-pointer uppercase tracking-wider"
                                  >
                                    Corrigir data
                                  </button>
                                </>
                              ) : part.foiSorteada ? (
                                <button
                                  type="button"
                                  onClick={(e) => permiteSorteioManual
                                    ? abrirLancamentoManual('entrega', part.id, part.nome, e)
                                    : handleRegistrarEntrega(part.id, e)}
                                  disabled={registrandoEntregaId === part.id}
                                  className="px-2.5 py-1 bg-[#0B1E14] text-white font-bold rounded-lg text-[9px] uppercase tracking-wider hover:bg-opacity-90 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                                >
                                  {registrandoEntregaId === part.id ? 'Gravando...' : 'Registrar retirada'}
                                </button>
                              ) : (
                                <span className="text-[10px] text-stone-300">—</span>
                              )}
                            </td>

                            <td className="py-3.5 px-5 text-right font-mono text-emerald-700">R$ {Number(part.saldoPoupanca).toFixed(2)}</td>
                            <td className="py-3.5 px-5 text-right font-mono text-rose-700">R$ {Number(part.custoFinanciadoLoja).toFixed(2)}</td>
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
            {abaLoja === 'geral' && (() => {
              const venc = proximoVencimento();
              const sort = proximoSorteio();
              const diasVenc = diasAte(venc);
              const diasSort = diasAte(sort);
              return (
              <div className="space-y-6 animate-fadeIn">

                {/* ── Banner de datas fixas ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`flex items-center justify-between px-5 py-3.5 rounded-xl border ${
                    diasVenc <= 3
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-white border-[#E6E2D8]'
                  }`}>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Próximo Vencimento</p>
                      <p className={`text-base font-black font-mono mt-0.5 ${diasVenc <= 3 ? 'text-amber-700' : 'text-[#0B1E14]'}`}>
                        {formatarData(venc)}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">5º dia útil do mês · feriados excluídos</p>
                    </div>
                    <div className={`text-right flex-shrink-0 ml-4`}>
                      <span className={`text-2xl font-black font-mono ${diasVenc <= 3 ? 'text-amber-600' : 'text-[#BD6B42]'}`}>
                        {diasVenc}d
                      </span>
                      <p className="text-[9px] text-stone-400 uppercase tracking-wider">restantes</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-5 py-3.5 rounded-xl border bg-white border-[#E6E2D8]">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Próximo Sorteio</p>
                      <p className="text-base font-black font-mono mt-0.5 text-[#0B1E14]">
                        {formatarData(sort)}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">dia 10 de cada mês · Loteria Federal</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className="text-2xl font-black font-mono text-emerald-600">{diasSort}d</span>
                      <p className="text-[9px] text-stone-400 uppercase tracking-wider">restantes</p>
                    </div>
                  </div>
                </div>

                {/* ── KPI cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#0B1E14] text-white p-5 rounded-xl shadow-sm relative overflow-hidden">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Faturamento Total</span>
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mt-0.5 flex-shrink-0"></div>
                    </div>
                    <span className="text-3xl font-bold tracking-tight block font-mono leading-none">
                      R$ {(analytics?.totalFaturado ?? recebidoEsteMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-stone-500 mt-2 block">receita líquida acumulada</span>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-sm flex flex-col">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-3">Clientes Ativos</span>
                    <span className="text-3xl font-bold tracking-tight text-[#0B1E14] font-mono leading-none">{totalClientes}</span>
                    <span className="text-[10px] text-stone-400 mt-2">cadastrados na unidade</span>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-sm flex flex-col">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-3">Grupos Ativos</span>
                    <span className="text-3xl font-bold tracking-tight text-[#0B1E14] font-mono leading-none">{totalGruposValidos}</span>
                    <span className="text-[10px] text-stone-400 mt-2">grupos de compras</span>
                  </div>
                </div>

                {/* ── Operação: onde estão as clientes e as cotas ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-sm flex flex-col">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-3">Clientes em Grupo</span>
                    <span className="text-3xl font-bold tracking-tight text-[#0B1E14] font-mono leading-none">
                      {analytics?.clientesAtivosEmGrupo ?? 0}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-2">participando de algum clube</span>
                  </div>

                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-sm flex flex-col">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-3">Clientes sem Grupo</span>
                    <span className="text-3xl font-bold tracking-tight text-[#BD6B42] font-mono leading-none">
                      {analytics?.clientesAtivosSemGrupo ?? 0}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-2">na carteira, fora de clube</span>
                  </div>

                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-sm flex flex-col">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-3">Sorteadas</span>
                    <span className="text-3xl font-bold tracking-tight text-amber-600 font-mono leading-none">
                      {analytics?.sorteadasEmGruposAtivos ?? 0}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-2">contempladas em grupos abertos</span>
                  </div>

                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-sm flex flex-col">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-3">Cotas Preenchidas</span>
                    <span className="text-3xl font-bold tracking-tight text-[#0B1E14] font-mono leading-none">
                      {analytics?.cotasPreenchidas ?? 0}
                      <span className="text-base text-stone-400">/{analytics?.cotasTotais ?? 0}</span>
                    </span>
                    <span className="text-[10px] text-stone-400 mt-2">
                      {(analytics?.cotasTotais ?? 0) > 0
                        ? `${Math.round(((analytics?.cotasPreenchidas ?? 0) / (analytics?.cotasTotais ?? 1)) * 100)}% de ocupação`
                        : 'sem cotas cadastradas'}
                    </span>
                  </div>
                </div>

                {/* ── Saída de produto ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-sm flex flex-col">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-3">Produtos Retirados</span>
                    <span className="text-2xl font-bold tracking-tight text-[#0B1E14] font-mono leading-none">
                      R$ {(analytics?.valorProdutosRetirados ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {/* O aviso e a diferenca entre um numero conferido e um
                        estimado pelo plano. Sem ele, a loja tomaria decisao
                        achando que o valor foi somado produto a produto. */}
                    {(analytics?.retiradasSemValorInformado ?? 0) > 0 ? (
                      <span className="text-[10px] text-amber-700 mt-2 leading-snug">
                        {analytics?.retiradasSemValorInformado} retirada
                        {(analytics?.retiradasSemValorInformado ?? 0) !== 1 ? 's' : ''} ainda sem preço informado ·
                        valor estimado pelo plano
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 mt-2">valor conferido produto a produto</span>
                    )}
                  </div>

                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-sm flex flex-col">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-3">UpSell</span>
                    <span className="text-2xl font-bold tracking-tight text-[#BD6B42] font-mono leading-none">
                      R$ {(analytics?.valorUpsell ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-2">
                      {(analytics?.valorUpsell ?? 0) > 0
                        ? 'levado acima do plano contratado'
                        : 'depende do preço informado na retirada'}
                    </span>
                  </div>

                </div>

                {/* ── Linha 2: gráfico de clientes + churn histórico ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  {/* Novos clientes por mês */}
                  <div className="lg:col-span-2 bg-white border border-[#E6E2D8] rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Novos Clientes</h3>
                        <p className="text-[10px] text-stone-400 mt-0.5">cadastros por mês na unidade</p>
                      </div>
                      <div className="flex gap-1">
                        {([1, 6, 12] as const).map(p => (
                          <button
                            key={p}
                            onClick={() => setPeriodoClientes(p)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              periodoClientes === p
                                ? 'bg-[#0B1E14] text-white'
                                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                            }`}
                          >
                            {p === 1 ? '1M' : p === 6 ? '6M' : '12M'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={(analytics?.novosPorMes ?? []).slice(-(periodoClientes))}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                        barSize={periodoClientes === 1 ? 40 : periodoClientes === 6 ? 28 : 18}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE8" vertical={false} />
                        <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#78716C', fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#78716C' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ fontSize: 11, border: '1px solid #DFD9CE', borderRadius: 8, boxShadow: '0 2px 8px #0001' }}
                          formatter={(v) => [v ?? 0, 'Novos clientes']}
                        />
                        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                          {(analytics?.novosPorMes ?? []).slice(-periodoClientes).map((_, i, arr) => (
                            <Cell
                              key={i}
                              fill={i === arr.length - 1 ? '#BD6B42' : '#0B1E14'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Churn histórico */}
                  <div className="bg-white border border-[#E6E2D8] rounded-xl p-5 shadow-sm flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Evolução do Churn</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">clientes que saíram da carteira</p>
                    </div>
                    <div className="flex items-end gap-2 mb-3">
                      <span className={`text-4xl font-black font-mono leading-none ${(analytics?.churnAtual ?? 0) > 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {(analytics?.churnAtual ?? 0).toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-stone-400 mb-1">
                        {analytics?.clientesQueSairam ?? 0} de {analytics?.clientesNaCarteira ?? 0} clientes
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart
                        data={analytics?.churnHistorico ?? []}
                        margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE8" vertical={false} />
                        <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#78716C', fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#78716C' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ fontSize: 11, border: '1px solid #DFD9CE', borderRadius: 8 }}
                          formatter={(v, _nome, item) => {
                            const saidas = Number(item?.payload?.saidas ?? 0);
                            return [`${Number(v ?? 0).toFixed(1)}%  ·  ${saidas} saída${saidas === 1 ? '' : 's'}`, 'Churn'];
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="taxa"
                          stroke={(analytics?.churnAtual ?? 0) > 10 ? '#E11D48' : '#10B981'}
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: (analytics?.churnAtual ?? 0) > 10 ? '#E11D48' : '#10B981' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* ── Faturamento mês a mês ── */}
                <div className="bg-white border border-[#E6E2D8] rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Faturamento Mensal</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">receita líquida recebida por mês · últimos 12 meses</p>
                    </div>
                    <span className="text-lg font-black font-mono text-emerald-700">
                      R$ {(analytics?.faturamentoMesAtual ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {(analytics?.faturamentoMensal ?? []).length === 0 ? (
                    <div className="flex items-center justify-center h-36 text-xs text-stone-400 italic">
                      Nenhuma transação registrada ainda.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={analytics?.faturamentoMensal ?? []}
                        margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
                        barSize={18}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE8" vertical={false} />
                        <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#78716C', fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#78716C' }} axisLine={false} tickLine={false}
                          tickFormatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: 11, border: '1px solid #DFD9CE', borderRadius: 8 }}
                          formatter={(v) => [`R$ ${Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
                        />
                        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                          {(analytics?.faturamentoMensal ?? []).map((_, i, arr) => (
                            <Cell key={i} fill={i === arr.length - 1 ? '#BD6B42' : '#0B1E14'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

              </div>
              );
            })()}

            {abaLoja === 'clientes' && (() => {
              // Compara sem acento e sem caixa: quem procura "leticia" precisa
              // achar "Letícia", senao a busca so serve para quem digita o nome
              // exatamente como foi cadastrado.
              const normalizar = (texto: string) =>
                texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

              const termo = normalizar(buscaCliente);
              const clientesFiltrados = termo
                ? clientesAtivos.filter((c) => normalizar(String(c.nome ?? '')).includes(termo))
                : clientesAtivos;

              const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / CLIENTES_POR_PAGINA));
              const paginaSegura = Math.min(paginaClientes, totalPaginas);
              const clientesPagina = clientesFiltrados.slice(
                (paginaSegura - 1) * CLIENTES_POR_PAGINA,
                paginaSegura * CLIENTES_POR_PAGINA
              );
              return (
              <div className="space-y-6 animate-fadeIn text-left">
                  <div className="bg-white border border-[#DFD9CE] rounded-xl shadow-xs overflow-hidden">
                      <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                              <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Clientes da Unidade</h3>
                              <p className="text-[10px] text-stone-400 font-medium">
                                {termo
                                  ? `${clientesFiltrados.length} de ${clientesAtivos.length} cliente${clientesAtivos.length !== 1 ? 's' : ''}`
                                  : `${clientesAtivos.length} cliente${clientesAtivos.length !== 1 ? 's' : ''}`} · página {paginaSegura} de {totalPaginas}
                              </p>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            <div className="relative">
                              <input
                                type="search"
                                placeholder="buscar por nome"
                                value={buscaCliente}
                                onChange={(e) => {
                                  setBuscaCliente(e.target.value);
                                  // Volta para a primeira pagina: filtrar deixando
                                  // a pagina 5 selecionada mostraria uma tabela
                                  // vazia com resultado existindo atras.
                                  setPaginaClientes(1);
                                }}
                                className="h-[34px] pl-8 pr-3 bg-white border border-[#DFD9CE] rounded-lg text-xs focus:outline-none focus:border-[#BD6B42] w-full sm:w-64"
                              />
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs pointer-events-none">⌕</span>
                            </div>
                            <input
                              type="email"
                              placeholder="e-mail de quem já tem conta"
                              value={emailNovoCliente}
                              onChange={(e) => setEmailNovoCliente(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') vincularClientePorEmail(); }}
                              className="h-[34px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-lg text-xs font-mono focus:outline-none focus:border-[#BD6B42] w-full sm:w-64"
                            />
                            <button
                              type="button"
                              onClick={vincularClientePorEmail}
                              disabled={vinculandoCliente}
                              className="bg-[#0B1E14] text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-opacity-90 transition-all cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap"
                            >
                              {vinculandoCliente ? 'Adicionando...' : '+ Adicionar'}
                            </button>
                          </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="sticky top-0 bg-stone-50 z-10 shadow-sm">
                            <tr className="text-stone-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                              <th className="py-3 px-5 w-16">Nº</th>
                              <th className="py-3 px-5">CLIENTE</th>
                              <th className="py-3 px-5">DOCUMENTO</th>
                              <th className="py-3 px-5">ÚLTIMO GRUPO</th>
                              <th className="py-3 px-5 text-center">STATUS DA CONTA</th>
                              <th className="py-3 px-5 text-center">AÇÃO</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                            {clientesFiltrados.length === 0 ? (
                               <tr><td colSpan={6} className="py-6 text-center text-stone-400 italic">
                                 {termo
                                   ? `Nenhum cliente encontrado para "${buscaCliente}".`
                                   : 'Nenhum cliente ativo registrado na sua unidade.'}
                               </td></tr>
                            ) : (
                               clientesPagina.map((cli, idx) => (
                                 <tr key={idx} className="hover:bg-stone-50/60 transition-all">
                                   <td className="py-3 px-5 font-mono font-bold text-[#BD6B42]">
                                     {numeroDaCliente(cli.numeroCliente) ?? '—'}
                                   </td>
                                   <td className="py-3 px-5">
                                     <span className="block font-bold text-[#0B1E14]">{cli.nome}</span>
                                     <span className="text-[10px] text-stone-400">{cli.email || 'Sem e-mail cadastrado'}</span>
                                   </td>
                                   <td className="py-3 px-5 font-mono text-stone-500">
                                     {cli.cpf ? aplicarMascaraCpf(cli.cpf) : 'Não informado'}
                                   </td>
                                   <td className="py-3 px-5 text-stone-500">
                                     {cli.ultimoGrupo || 'Nenhum grupo ativo'}
                                   </td>
                                   <td className="py-3 px-5 text-center">
                                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
                                        APROVADO
                                      </span>
                                   </td>
                                   <td className="py-3 px-5 text-center">
                                      <button onClick={() => handleAbrirBloqueio(cli)} className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer uppercase tracking-wider">
                                         Bloquear
                                      </button>
                                   </td>
                                 </tr>
                               ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Paginação */}
                      {totalPaginas > 1 && (
                        <div className="px-5 py-3 border-t border-[#DFD9CE] bg-stone-50/30 flex items-center justify-between">
                          <span className="text-[10px] text-stone-400 font-medium">
                            Exibindo {(paginaSegura - 1) * CLIENTES_POR_PAGINA + 1}–{Math.min(paginaSegura * CLIENTES_POR_PAGINA, clientesFiltrados.length)} de {clientesFiltrados.length}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setPaginaClientes(p => Math.max(1, p - 1))}
                              disabled={paginaSegura === 1}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#DFD9CE] bg-white text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-sm"
                            >
                              ‹
                            </button>
                            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                              <button
                                key={p}
                                onClick={() => setPaginaClientes(p)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  p === paginaSegura
                                    ? 'bg-[#0B1E14] text-white'
                                    : 'border border-[#DFD9CE] bg-white text-stone-500 hover:bg-stone-100'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                            <button
                              onClick={() => setPaginaClientes(p => Math.min(totalPaginas, p + 1))}
                              disabled={paginaSegura === totalPaginas}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#DFD9CE] bg-white text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-sm"
                            >
                              ›
                            </button>
                          </div>
                        </div>
                      )}
                  </div>

                  {clientesBloqueados.length > 0 && (
                     <div className="bg-white border border-[#DFD9CE] rounded-xl shadow-xs overflow-hidden mt-6">
                        <div className="px-5 py-4 border-b border-[#DFD9CE] bg-rose-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider">Histórico de Exclusões e Bloqueios</h3>
                                <p className="text-[10px] text-rose-600 font-medium">Clientes banidos de participar de novos planos da unidade.</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 bg-stone-50 z-10 shadow-sm">
                              <tr className="text-stone-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                                <th className="py-3 px-5">CLIENTE BANIDO</th>
                                <th className="py-3 px-5">DOCUMENTO</th>
                                <th className="py-3 px-5">ÚLTIMO GRUPO</th>
                                <th className="py-3 px-5">MOTIVO DA EXCLUSAO / BLOQUEIO</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                               {clientesBloqueados.map((cli, idx) => (
                                   <tr key={idx} className="hover:bg-stone-50/60 transition-all opacity-80">
                                     <td className="py-3 px-5">
                                       <span className="block font-bold text-rose-800">{cli.nome}</span>
                                     </td>
                                     <td className="py-3 px-5 font-mono text-stone-500">
                                       {cli.cpf ? aplicarMascaraCpf(cli.cpf) : 'Não informado'}
                                     </td>
                                     <td className="py-3 px-5 text-stone-500">
                                       {cli.ultimoGrupo || 'Nenhum grupo ativo'}
                                     </td>
                                     <td className="py-3 px-5 text-stone-500 italic">
                                        {cli.motivoBloqueio || 'Motivo não registrado no sistema.'}
                                     </td>
                                   </tr>
                               ))}
                            </tbody>
                          </table>
                        </div>
                     </div>
                  )}
              </div>
              );
            })()}

            {abaLoja === 'aprovacoes' && (
              <div className="space-y-6 animate-fadeIn text-left">
                  <div className="bg-white border border-[#DFD9CE] rounded-xl shadow-xs overflow-hidden">
                      <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50">
                          <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Análise de Crédito das Sorteadas</h3>
                          <p className="text-[10px] text-stone-400 font-medium">
                            Clientes que foram contempladas e aguardam você liberar o crédito para escolherem o produto.
                          </p>
                      </div>
                      <div className="p-6">
                         {aguardandoCredito.length === 0 ? (
                            <div className="text-center text-stone-400 text-xs italic py-12 bg-stone-50 rounded-xl border border-dashed">
                               Nenhuma sorteada aguardando análise no momento.
                            </div>
                         ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                               {aguardandoCredito.map((item) => (
                                  <div key={item.cotaId} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm text-left hover:shadow-md transition-shadow">
                                     <div className="flex justify-between items-start mb-3">
                                        <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                          Sorteada · aguardando crédito
                                        </span>
                                        <span className="text-[9px] text-stone-400">
                                          {item.dataContemplacao ? new Date(item.dataContemplacao).toLocaleDateString('pt-BR') : '—'}
                                        </span>
                                     </div>

                                     <h4 className="text-sm font-bold text-[#0B1E14] truncate">{item.clienteNome}</h4>
                                     <p className="text-[10px] text-stone-400 mt-0.5">{item.grupoNome}</p>

                                     <p className="text-xs text-stone-500 font-mono mt-2 bg-stone-50 p-2 rounded-lg border border-stone-100">
                                       CPF: {item.clienteCpf ? aplicarMascaraCpf(item.clienteCpf) : 'Não informado'}
                                     </p>

                                     <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                                       <div>
                                         <span className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider">Já pagou</span>
                                         <span className="font-mono font-bold text-emerald-700">
                                           R$ {(Number(item.saldoPago) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                         </span>
                                       </div>
                                       <div>
                                         <span className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider">Falta pagar</span>
                                         <span className="font-mono font-bold text-[#BD6B42]">
                                           R$ {(Number(item.valorEmRisco) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                         </span>
                                       </div>
                                     </div>

                                     {item.clienteTelefone && (
                                       <a
                                         href={`https://wa.me/55${String(item.clienteTelefone).replace(/\D/g, '')}`}
                                         target="_blank"
                                         rel="noreferrer"
                                         className="block mt-3 text-[10px] font-bold text-[#BD6B42] hover:underline uppercase tracking-wider"
                                       >
                                         Falar no WhatsApp
                                       </a>
                                     )}

                                     <div className="mt-4 flex gap-3 pt-4 border-t border-stone-100">
                                        <button
                                          disabled={processandoCreditoId === item.cotaId}
                                          onClick={() => setMotivoReprovacao({ cotaId: item.cotaId, texto: '' })}
                                          className="flex-1 bg-white text-rose-600 border border-rose-200 text-[10px] font-bold py-2.5 rounded-lg hover:bg-rose-50 transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                                        >
                                           Não liberar
                                        </button>
                                        <button
                                          disabled={processandoCreditoId === item.cotaId}
                                          onClick={() => handleAnalisarCredito(item.cotaId, true)}
                                          className="flex-1 bg-[#0B1E14] text-white text-[10px] font-bold py-2.5 rounded-lg hover:bg-opacity-90 transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-sm"
                                        >
                                           Liberar crédito
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

            {abaLoja === 'fila' && (() => {
              const gruposAbertos = listaGrupos.filter(grupoDisponivel);

              return (
                <div className="space-y-6 animate-fadeIn text-left">
                  <div className="bg-white border border-[#DFD9CE] rounded-xl shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Fila de Espera</h3>
                        <p className="text-[10px] text-stone-400 font-medium">
                          Clientes que pediram vaga enquanto todos os grupos estavam preenchidos, na ordem de chegada.
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full border ${
                        gruposAbertos.length > 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-stone-100 text-stone-500 border-stone-200'
                      }`}>
                        {gruposAbertos.length > 0
                          ? `${gruposAbertos.length} grupo(s) com vaga`
                          : 'Nenhum grupo com vaga'}
                      </span>
                    </div>

                    <div className="p-6">
                      {!filaPublicadaNaApi ? (
                        <div className="text-center text-xs py-12 bg-amber-50 rounded-xl border border-dashed border-amber-200 px-6 space-y-1">
                          <p className="font-bold text-amber-900">Fila de espera ainda não publicada no servidor</p>
                          <p className="text-amber-800">
                            A tela está pronta, mas a API desta funcionalidade ainda não foi publicada. Assim que ela
                            entrar no ar, a fila aparece aqui sozinha.
                          </p>
                        </div>
                      ) : filaEspera.length === 0 ? (
                        <div className="text-center text-stone-400 text-xs italic py-12 bg-stone-50 rounded-xl border border-dashed">
                          Ninguém na fila de espera no momento.
                        </div>
                      ) : (
                        <>
                          {gruposAbertos.length === 0 && (
                            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                              Não há grupo com vaga aberta agora. Lance um novo grupo de compras para poder convocar quem está esperando.
                            </p>
                          )}

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[640px]">
                              <thead>
                                <tr className="text-[9px] text-stone-400 uppercase tracking-widest border-b border-[#DFD9CE]">
                                  <th className="py-3 px-5">Posição</th>
                                  <th className="py-3 px-5">Cliente</th>
                                  <th className="py-3 px-5">Contato</th>
                                  <th className="py-3 px-5">Na fila desde</th>
                                  <th className="py-3 px-5 text-center">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-100">
                                {filaEspera.map((item, indice) => (
                                  <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                                    <td className="py-4 px-5">
                                      <span className="text-sm font-bold font-mono text-[#BD6B42]">{indice + 1}º</span>
                                    </td>
                                    <td className="py-4 px-5">
                                      <span className="block text-xs font-bold text-[#0B1E14]">{item.nome}</span>
                                      <span className="block text-[10px] text-stone-400 font-mono mt-0.5">
                                        {item.cpf ? aplicarMascaraCpf(item.cpf) : 'CPF não informado'}
                                      </span>
                                    </td>
                                    <td className="py-4 px-5 text-[11px] text-stone-600">
                                      <span className="block">{item.telefone ? aplicarMascaraTelefone(item.telefone) : 'Telefone não informado'}</span>
                                      <span className="block text-stone-400">{item.email || 'E-mail não informado'}</span>
                                    </td>
                                    <td className="py-4 px-5 text-[11px] text-stone-500">
                                      {item.criadoEm ? new Date(item.criadoEm).toLocaleDateString('pt-BR') : '—'}
                                    </td>
                                    <td className="py-4 px-5">
                                      <div className="flex gap-2 justify-center">
                                        <button
                                          disabled={processandoFilaId === item.id || gruposAbertos.length === 0}
                                          onClick={() => { setModalConvocar({ aberto: true, item }); setGrupoDestinoConvocacao(''); }}
                                          title={gruposAbertos.length === 0 ? 'Nenhum grupo com vaga disponível' : 'Convocar para um grupo'}
                                          className="bg-[#0B1E14] text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                                        >
                                          Convocar
                                        </button>
                                        <button
                                          disabled={processandoFilaId === item.id}
                                          onClick={() => handleRemoverDaFila(item)}
                                          className="bg-white text-rose-600 border border-rose-200 text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-rose-50 transition-all uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                                        >
                                          Remover
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

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
                      {(() => {
                        const vagas = vagasDoGrupo(grupo);
                        if (grupoEncerrado(grupo)) {
                          return (
                            <span className="text-[9px] font-bold px-2 py-1 rounded-md bg-stone-100 text-stone-500 border border-stone-200 uppercase tracking-wider w-fit">
                              Encerrado · não aparece para novas clientes
                            </span>
                          );
                        }
                        if (vagas === 0) {
                          return (
                            <span className="text-[9px] font-bold px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider w-fit">
                              Lotado · fila de espera ativa
                            </span>
                          );
                        }
                        return (
                          <span className="text-[9px] font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider w-fit">
                            Aberto{vagas === null ? '' : ` · ${vagas} vaga(s)`}
                          </span>
                        );
                      })()}
                      {(() => {
                        const fat = faturamentoDoGrupo(grupo.id);
                        const faturado = Number(fat?.faturado ?? 0);
                        const previsto = Number(fat?.previsto ?? 0);
                        const pct = previsto > 0 ? Math.min(100, (faturado / previsto) * 100) : 0;

                        return (
                          <div className="border-t border-stone-100 pt-3 space-y-1.5">
                            <div className="flex justify-between items-baseline">
                              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Faturado</span>
                              <span className="text-sm font-bold font-mono text-emerald-700">
                                R$ {faturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            {/* A barra compara com o contratado: o numero sozinho
                                nao diz se o grupo esta adiantado ou atrasado. */}
                            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>

                            <div className="flex justify-between items-baseline">
                              <span className="text-[9px] text-stone-400">
                                de R$ {previsto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} previstos
                              </span>
                              <span className="text-[9px] font-bold text-stone-500 font-mono">{pct.toFixed(0)}%</span>
                            </div>
                          </div>
                        );
                      })()}

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
              <div className="space-y-6 animate-fadeIn text-left">

                <div className="bg-white border border-[#DFD9CE] p-6 rounded-2xl space-y-4 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Agendar Sorteio Auditável</h3>

                  <form onSubmit={agendarSorteio} className="flex flex-wrap gap-2 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Grupo</label>
                      {/* appearance-none tira o desenho nativo do navegador, que
                          nao acompanha a altura nem a borda dos demais campos.
                          A seta e desenhada por cima, sem capturar o clique. */}
                      <div className="relative">
                        <select
                          value={grupoSorteioId}
                          onChange={(e) => { setGrupoSorteioId(e.target.value); carregarPainelDeSorteio(e.target.value); }}
                          className="appearance-none w-full min-w-[220px] h-[38px] pl-3 pr-9 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-xs text-[#0B1E14] cursor-pointer focus:outline-none focus:border-[#BD6B42] transition-colors"
                          required
                        >
                          <option value="">Selecione o grupo de compras</option>
                          {listaGrupos.map((grupo) => (
                            <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-stone-400">▼</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Data de corte</label>
                      <input
                        type="date"
                        value={dataCorteSorteio}
                        onChange={(e) => setDataCorteSorteio(e.target.value)}
                        className="h-[38px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-xs font-mono text-[#0B1E14] focus:outline-none focus:border-[#BD6B42]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={processandoSorteio || !grupoSorteioId}
                      className="h-[38px] bg-[#0B1E14] text-white text-[10px] font-bold px-5 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider hover:bg-opacity-90 transition-all shadow-sm"
                    >
                      {processandoSorteio ? 'Processando...' : 'Congelar lista e agendar'}
                    </button>
                  </form>

                  {grupoSorteioId && (
                    <p className="text-[10px] text-stone-400 border-t pt-3">
                      <strong className="text-[#0B1E14]">{elegiveisDoGrupo.length}</strong> cota(s) disputando o próximo sorteio.
                      Cotas já contempladas não voltam a concorrer, mesmo com crédito reprovado.
                    </p>
                  )}
                </div>

                {sorteiosDoGrupo.length > 0 && (
                  <div className="bg-white border border-[#DFD9CE] rounded-2xl shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50">
                      <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Histórico de Sorteios</h3>
                      <p className="text-[10px] text-stone-400">Cada linha pode ser conferida por terceiros pelo código de auditoria.</p>
                    </div>
                    <div className="divide-y divide-[#EFEAE1]">
                      {sorteiosDoGrupo.map((s) => (
                        <div key={s.codigoAuditoria} className="px-5 py-4 flex flex-wrap gap-3 justify-between items-center">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                                s.status === 'APURADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : s.status === 'CANCELADO' ? 'bg-stone-100 text-stone-500 border-stone-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>{s.status}</span>
                              <span className="font-mono text-[11px] font-bold text-[#0B1E14]">{s.codigoAuditoria}</span>
                            </div>
                            <p className="text-[10px] text-stone-400 mt-1">
                              {s.quantidadeParticipantes} participantes · concurso {s.concursoLoteria ?? 'a definir'} ·
                              {' '}previsto para {s.dataPrevistaConcurso}
                              {s.contempladaNome && <> · <strong className="text-[#BD6B42]">{s.contempladaNome}</strong> (cota #{s.cotaContempladaId})</>}
                            </p>
                          </div>
                          {s.status === 'AGENDADO' && (
                            <button
                              type="button"
                              onClick={() => apurarSorteio(s.id)}
                              disabled={processandoSorteio}
                              className="px-4 py-2 bg-[#BD6B42] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider hover:bg-[#A95A33] transition-all cursor-pointer disabled:opacity-50"
                            >
                              Apurar agora
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {contemplacoesEmCurso.length > 0 && (
                  <div className="bg-white border border-[#DFD9CE] rounded-2xl shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50">
                      <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Clientes Sorteadas</h3>
                      <p className="text-[10px] text-stone-400">A cliente age na escolha do produto e na assinatura; as demais etapas são suas.</p>
                    </div>
                    <div className="divide-y divide-[#EFEAE1]">
                      {contemplacoesEmCurso.map((c) => (
                        <div key={c.cotaId} className="px-5 py-4 flex flex-wrap gap-3 justify-between items-center">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#0B1E14] truncate">
                              {c.clienteNome || `Cota #${c.cotaId}`}
                            </p>

                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              <span className="text-[9px] font-mono font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                                Cota #{c.cotaId}
                              </span>
                              {c.dataContemplacao && (
                                <span className="text-[10px] text-stone-500">
                                  Sorteada em {new Date(c.dataContemplacao).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                              {c.clienteTelefone && (
                                <a
                                  href={`https://wa.me/55${c.clienteTelefone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] font-bold text-[#BD6B42] hover:underline"
                                >
                                  {aplicarMascaraTelefone(c.clienteTelefone)}
                                </a>
                              )}
                            </div>

                            <p className="text-[11px] font-bold text-[#0B1E14] mt-1.5">
                              {c.etapaTitulo}
                              {!c.aguardandoEncerramento && (
                                <span className="text-stone-400 font-medium"> ({c.posicaoAtual}/{c.totalEtapas})</span>
                              )}
                            </p>
                            <p className="text-[10px] text-stone-400 mt-0.5">
                              {c.produtoEscolhido ? `Produto: ${c.produtoEscolhido}` : c.etapaDescricao}
                            </p>

                            {c.dataEntrega && (
                              <p className="text-[10px] text-emerald-700 font-bold mt-1">
                                Retirado em {new Date(c.dataEntrega).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {c.etapaAtual === 'ANALISE_CREDITO' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => avancarEtapaContemplacao(c.cotaId, 'credito', { aprovado: true })}
                                  disabled={processandoSorteio}
                                  className="px-3 py-1.5 bg-[#0B1E14] text-white font-bold rounded-lg text-[10px] uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                >
                                  Aprovar crédito
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setModalReprovaCredito({ aberto: true, cotaId: c.cotaId }); setMotivoReprovaCredito(''); }}
                                  className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold rounded-lg text-[10px] uppercase tracking-wider cursor-pointer hover:bg-rose-100"
                                >
                                  Reprovar
                                </button>
                              </>
                            )}
                            {c.etapaAtual === 'SEPARACAO' && (
                              <button
                                type="button"
                                onClick={() => avancarEtapaContemplacao(c.cotaId, 'separacao')}
                                disabled={processandoSorteio}
                                className="px-3 py-1.5 bg-[#BD6B42] text-white font-bold rounded-lg text-[10px] uppercase tracking-wider cursor-pointer disabled:opacity-50"
                              >
                                Iniciar separação
                              </button>
                            )}
                            {c.etapaAtual === 'RETIRADA' && !c.concluido && (
                              <button
                                type="button"
                                onClick={() => avancarEtapaContemplacao(c.cotaId, 'retirada')}
                                disabled={processandoSorteio}
                                className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider cursor-pointer disabled:opacity-50"
                              >
                                Confirmar retirada
                              </button>
                            )}
                            {c.concluido && (
                              <span className="text-[9px] font-bold px-2 py-1 rounded-md uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
                                Entregue
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                      <span className="text-[10px] font-bold text-[#BD6B42] block mb-1">CAPITAL AVANÇADO (RISCO DA LOJA)</span>
                      <span className="text-xl font-bold text-[#BD6B42]">R$ {aReceberContemplados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-2 leading-relaxed border-t pt-2 border-dashed">Aporte em Haver: Valor referente a produtos entregues a clientes contemplados. A loja assume o custo contratual imediato e detém o direito de recebimento das parcelas futuras.</p>
                  </div>

                  <div className="bg-white border border-[#DFD9CE] p-5 rounded-2xl shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 block mb-1">CUMPRIMENTO DE ACORDOS</span>
                      <span className="text-xl font-bold text-stone-600">Ativos</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-2 leading-relaxed border-t pt-2 border-dashed">Garantia jurídica de alienação fiduciaria ou contrato assinado para resguardo do capital avançado.</p>
                  </div>
                </div>

                <div className="bg-white border border-[#DFD9CE] rounded-xl shadow-xs overflow-hidden mt-6">
                  <div className="px-5 py-4 border-b border-[#DFD9CE] bg-stone-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Histórico de Transações (Livro Razão)</h3>
                    <span className="text-[9px] bg-[#0B1E14] text-white px-2 py-1 rounded font-mono">Atualizado em tempo real</span>
                  </div>
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-stone-50 z-10 shadow-sm">
                        <tr className="text-stone-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                          <th className="py-3 px-5">DATA</th>
                          <th className="py-3 px-5">CLIENTE / REFERÊNCIA</th>
                          <th className="py-3 px-5">TIPO</th>
                          <th className="py-3 px-5 text-right">VALOR BRUTO</th>
                          <th className="py-3 px-5 text-right">TAXA (10%)</th>
                          <th className="py-3 px-5 text-right">LÍQUIDO (LOJA)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                         {historicoTransacoes.length === 0 ? (
                            <tr><td colSpan={6} className="py-6 text-center text-stone-400 italic">Nenhuma transação registrada no sistema ainda.</td></tr>
                         ) : (
                            historicoTransacoes.map((t, idx) => (
                              <tr key={idx} className="hover:bg-stone-50/60 transition-all">
                                <td className="py-3 px-5 text-stone-500 font-mono">{new Date(t.dataTransacao).toLocaleDateString('pt-BR')}</td>
                                <td className="py-3 px-5">
                                  <span className="block font-bold text-[#0B1E14]">{t.nomeCliente || 'Transação Sistema'}</span>
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
              <div className="space-y-6 text-left max-w-xl animate-fadeIn">

              <div className="bg-white border border-[#DFD9CE] rounded-2xl p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#0B1E14] uppercase tracking-wide">Cadastro da Loja</h3>
                  <p className="text-stone-400 text-xs mt-1 leading-relaxed">
                    Estes são os dados que aparecem para as suas clientes e que definem para onde vai a sua parte de cada pagamento.
                  </p>
                </div>

                {carregandoDadosLoja ? (
                  <p className="text-xs text-stone-400 italic py-4">Carregando o cadastro da loja...</p>
                ) : !dadosLoja ? (
                  <p className="text-xs text-rose-600 py-4">Não foi possível carregar o cadastro desta loja.</p>
                ) : (
                  <form onSubmit={handleSalvarDadosDaLoja} className="space-y-5 text-xs">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Nome da Loja</label>
                        <input
                          type="text"
                          value={dadosLoja.nomeComercial ?? ''}
                          onChange={(e) => alterarCampoDaLoja('nomeComercial', e.target.value)}
                          className="w-full border border-[#DFD9CE] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#BD6B42] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Telefone</label>
                        <input
                          type="text"
                          value={dadosLoja.telefone ? aplicarMascaraTelefone(dadosLoja.telefone) : ''}
                          onChange={(e) => alterarCampoDaLoja('telefone', e.target.value)}
                          placeholder="(00) 00000-0000"
                          className="w-full border border-[#DFD9CE] rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:border-[#BD6B42] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">CEP</label>
                        <input
                          type="text"
                          value={dadosLoja.cep ?? ''}
                          onChange={(e) => alterarCampoDaLoja('cep', e.target.value)}
                          placeholder="00000000"
                          className="w-full border border-[#DFD9CE] rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:border-[#BD6B42] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="border-t border-[#DFD9CE] pt-5 space-y-4">
                      <div>
                        <h4 className="text-[11px] font-bold text-[#0B1E14] uppercase tracking-wider">Recebimento</h4>
                        <p className="text-[10px] text-stone-400 mt-0.5">Para onde vão os 90% de cada parcela paga pelas suas clientes.</p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Wallet ID do Asaas</label>
                        <input
                          type="text"
                          value={dadosLoja.asaasWalletId ?? ''}
                          onChange={(e) => alterarCampoDaLoja('asaasWalletId', e.target.value)}
                          placeholder="00000000-0000-0000-0000-000000000000"
                          className="w-full border border-[#DFD9CE] rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:border-[#BD6B42] transition-colors"
                        />
                        <p className="text-[10px] text-stone-400 mt-1.5 leading-relaxed">
                          Está na sua conta do Asaas, em Configurações · Integrações. Sem ele, o sistema não
                          consegue separar a sua parte do pagamento. <strong className="text-stone-500">Confira antes de salvar:
                          um número errado manda o dinheiro para outro lugar.</strong>
                        </p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Chave Pix</label>
                        <input
                          type="text"
                          value={dadosLoja.chavePix ?? ''}
                          onChange={(e) => alterarCampoDaLoja('chavePix', e.target.value)}
                          className="w-full border border-[#DFD9CE] rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:border-[#BD6B42] transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Banco</label>
                          <input type="text" value={dadosLoja.bancoCodigo ?? ''}
                            onChange={(e) => alterarCampoDaLoja('bancoCodigo', e.target.value)}
                            className="w-full border border-[#DFD9CE] rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:border-[#BD6B42]" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Agência</label>
                          <input type="text" value={dadosLoja.agencia ?? ''}
                            onChange={(e) => alterarCampoDaLoja('agencia', e.target.value)}
                            className="w-full border border-[#DFD9CE] rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:border-[#BD6B42]" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Conta</label>
                          <input type="text" value={dadosLoja.conta ?? ''}
                            onChange={(e) => alterarCampoDaLoja('conta', e.target.value)}
                            className="w-full border border-[#DFD9CE] rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:border-[#BD6B42]" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Dígito</label>
                          <input type="text" value={dadosLoja.contaDigito ?? ''}
                            onChange={(e) => alterarCampoDaLoja('contaDigito', e.target.value)}
                            className="w-full border border-[#DFD9CE] rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:border-[#BD6B42]" />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[#DFD9CE] pt-5">
                      <h4 className="text-[11px] font-bold text-[#0B1E14] uppercase tracking-wider mb-3">Definido pela AVLE</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">CNPJ</span>
                          <span className="font-mono text-stone-500">{dadosLoja.cnpj || '—'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Homologação</span>
                          <span className="font-bold text-stone-600">{dadosLoja.statusHomologacao || '—'}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-2.5 leading-relaxed">
                        O CNPJ é a identidade conferida na Receita e usada na sua conta do Asaas. Para corrigir
                        qualquer um destes, fale com a AVLE.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={salvandoDadosLoja}
                      className="w-full py-3.5 bg-[#0B1E14] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider cursor-pointer disabled:opacity-50 hover:bg-opacity-95 transition-all"
                    >
                      {salvandoDadosLoja ? 'Salvando...' : 'Salvar Cadastro'}
                    </button>
                  </form>
                )}
              </div>

              <div className="bg-white border border-[#DFD9CE] rounded-2xl p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#0B1E14] uppercase tracking-wide">Regulamento Operacional da Loja</h3>
                  <p className="text-stone-400 text-xs mt-1 leading-relaxed">
                    Envie os termos de contrato e politicas especificas para a sua comunidade de compras planejadas. Cada estabelecimento atua com total independencia jurídica.
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
                      <h3 className="text-xs font-bold uppercase tracking-wider">Sorteadas aguardando crédito</h3>
                   </div>
                   <button onClick={() => setCaixaMensagemAberta(false)} className="text-stone-400 hover:text-white font-bold px-2 cursor-pointer">X</button>
                </div>

                <div className="p-4 max-h-[400px] overflow-y-auto bg-stone-50/50">
                   {aguardandoCredito.length === 0 ? (
                      <div className="text-center text-stone-400 text-xs italic py-8">
                         Nenhuma sorteada aguardando análise no momento.
                      </div>
                   ) : (
                      <div className="space-y-3">
                         {aguardandoCredito.map((item) => (
                            <div key={item.cotaId} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm text-left">
                               <div className="flex justify-between items-start mb-2">
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Sorteada</span>
                                  <span className="text-[9px] text-stone-400">
                                    {item.dataContemplacao ? new Date(item.dataContemplacao).toLocaleDateString('pt-BR') : '—'}
                                  </span>
                               </div>
                               <p className="text-sm font-bold text-[#0B1E14] truncate">{item.clienteNome}</p>
                               <p className="text-[10px] text-stone-400">{item.grupoNome}</p>
                               <p className="text-xs text-stone-500 font-mono mt-1">
                                 Falta pagar R$ {(Number(item.valorEmRisco) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                               </p>

                               <div className="mt-4 flex gap-2 pt-3 border-t border-stone-100">
                                  <button
                                    disabled={processandoCreditoId === item.cotaId}
                                    onClick={() => handleAnalisarCredito(item.cotaId, true)}
                                    className="flex-1 bg-[#0B1E14] text-white text-[10px] font-bold py-2 rounded-lg hover:bg-opacity-90 transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                                  >
                                     Liberar
                                  </button>
                                  <button
                                    disabled={processandoCreditoId === item.cotaId}
                                    onClick={() => { setCaixaMensagemAberta(false); setMotivoReprovacao({ cotaId: item.cotaId, texto: '' }); }}
                                    className="flex-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold py-2 rounded-lg hover:bg-rose-100 transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                                  >
                                     Não liberar
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
             <img src="/arvore-clara.png" alt="AVLE" className="w-9 opacity-90 group-hover:opacity-100 transition-opacity" />
             
             {aguardandoCredito.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md animate-pulse">
                   {aguardandoCredito.length}
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
                <p className="text-[10px] text-stone-400">Atribuição de credencial de acesso inicial no sistema.</p>
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
                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">E-mail de Notificação / Login (Opcional)</label>
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
                A cliente receberá a senha padrão inicial <strong>Avle123</strong> para realizar o primeiro acesso ao Dashboard do Cliente e podera altera-la posteriormente nas suas configurações.
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
                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Valor Total do Grupo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 2000.00"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
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
              {valorTotal && duracaoMeses && parseFloat(valorTotal) > 0 && parseInt(duracaoMeses) > 0 && (
                <div className="bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Parcela Mensal Calculada</span>
                  <span className="text-lg font-black text-[#0B1E14] font-mono">
                    R$ {(parseFloat(valorTotal) / parseInt(duracaoMeses)).toFixed(2)}
                    <span className="text-[10px] font-normal text-stone-400 ml-1">/ mês</span>
                  </span>
                </div>
              )}
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

      {modalQuitacao.aberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">
                Baixa Manual da Contemplada
              </h3>
              <button
                type="button"
                onClick={() => setModalQuitacao({ aberto: false, cotaId: null, nome: '', sorteada: false })}
                className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer"
              >
                X
              </button>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed bg-stone-50 p-3 rounded-xl border border-dashed">
              <strong className="text-[#0B1E14]">{modalQuitacao.nome}</strong> já foi sorteada e segue pagando as
              parcelas. Use este lançamento para o que foi recebido no balcão, fora da plataforma.
            </p>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">
                Quantidade de parcelas
              </label>
              <input
                type="number"
                min="1"
                value={parcelasQuitacao}
                onChange={(e) => setParcelasQuitacao(e.target.value)}
                disabled={valorQuitacao.trim() !== ''}
                className="w-full h-[42px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm font-mono focus:outline-none focus:border-[#BD6B42] disabled:opacity-40"
              />
              {grupoSelecionado?.valorParcela && valorQuitacao.trim() === '' && (
                <p className="text-[10px] text-stone-400 mt-1 font-mono">
                  Total: R$ {(Number(parcelasQuitacao || 0) * Number(grupoSelecionado.valorParcela)).toFixed(2)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">
                Ou valor exato em reais
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Deixe em branco para usar as parcelas"
                value={valorQuitacao}
                onChange={(e) => setValorQuitacao(e.target.value)}
                className="w-full h-[42px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm font-mono focus:outline-none focus:border-[#BD6B42]"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Preenchido, o valor vence a quantidade de parcelas. Lançamento acima do que falta para quitar é
                recusado pelo servidor.
              </p>
            </div>

            <div className="flex space-x-2 pt-2 border-t w-full">
              <button
                type="button"
                onClick={() => setModalQuitacao({ aberto: false, cotaId: null, nome: '', sorteada: false })}
                className="flex-1 py-2.5 border rounded-xl text-stone-500 font-bold text-xs transition-colors hover:bg-stone-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarQuitacaoManual}
                disabled={processandoQuitacao}
                className="flex-1 py-2.5 bg-[#0B1E14] text-white font-bold rounded-xl shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                {processandoQuitacao ? 'Gravando...' : 'Confirmar Baixa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalManual.aberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">
                {modalManual.tipo === 'sorteio' ? 'Registrar Contemplação'
                  : modalManual.tipo === 'correcao-sorteio' ? 'Corrigir Data do Sorteio'
                  : modalManual.tipo === 'correcao' ? 'Corrigir Data da Entrega' : 'Registrar Retirada'}
              </h3>
              <button
                type="button"
                onClick={() => setModalManual({ aberto: false, tipo: 'sorteio', cotaId: null, nome: '' })}
                className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer"
              >
                X
              </button>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed bg-stone-50 p-3 rounded-xl border border-dashed">
              <strong className="text-[#0B1E14]">{modalManual.nome}</strong>
              {modalManual.tipo === 'sorteio'
                ? ' será marcada como contemplada na data informada. Use apenas para lançar sorteio que já aconteceu fora do sistema.'
                : modalManual.tipo === 'correcao-sorteio'
                  ? ' foi contemplada por lançamento manual. Ajuste abaixo a data correta do sorteio; a atual vem preenchida no campo.'
                  : modalManual.tipo === 'correcao'
                    ? ' já tem a retirada registrada. Ajuste abaixo a data correta; a atual vem preenchida no campo.'
                    : ' terá a retirada registrada na data informada.'}
            </p>

            {modalManual.tipo === 'sorteio' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-[10px] text-amber-900 leading-relaxed">
                  Este lançamento entra no histórico marcado como <strong>registro manual</strong>, sem código de
                  auditoria conferível. Ele não substitui o sorteio pela Loteria Federal, e a cliente consegue
                  distinguir os dois.
                </p>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">
                Data em que ocorreu
              </label>
              <input
                type="date"
                value={dataManual}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDataManual(e.target.value)}
                className="w-full h-[42px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm font-mono focus:outline-none focus:border-[#BD6B42]"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                {modalManual.tipo === 'correcao' || modalManual.tipo === 'correcao-sorteio'
                  ? 'A data é obrigatória na correção. Data futura não é aceita.'
                  : 'Em branco, o sistema usa a data de hoje. Data futura não é aceita.'}
              </p>
            </div>

            <div className="flex space-x-2 pt-2 border-t w-full">
              <button
                type="button"
                onClick={() => setModalManual({ aberto: false, tipo: 'sorteio', cotaId: null, nome: '' })}
                className="flex-1 py-2.5 border rounded-xl text-stone-500 font-bold text-xs transition-colors hover:bg-stone-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarLancamentoManual}
                disabled={processandoManual}
                className="flex-1 py-2.5 bg-[#0B1E14] text-white font-bold rounded-xl shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                {processandoManual
                  ? (modalManual.tipo === 'correcao' || modalManual.tipo === 'correcao-sorteio' ? 'Corrigindo...' : 'Registrando...')
                  : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalConvocar.aberto && modalConvocar.item && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Convocar da Fila</h3>
              <button
                type="button"
                onClick={() => setModalConvocar({ aberto: false, item: null })}
                className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer"
              >
                X
              </button>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed bg-stone-50 p-3 rounded-xl border border-dashed">
              <strong className="text-[#0B1E14]">{modalConvocar.item.nome}</strong> sai da fila de espera e passa a ocupar
              uma cota no grupo escolhido abaixo.
            </p>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Grupo de destino</label>
              <div className="relative">
                <select
                  value={grupoDestinoConvocacao}
                  onChange={(e) => setGrupoDestinoConvocacao(e.target.value)}
                  className="appearance-none w-full h-[42px] pl-3 pr-9 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm text-[#0B1E14] focus:outline-none focus:border-[#BD6B42] cursor-pointer transition-colors"
                >
                  <option value="">Selecione um grupo com vaga</option>
                  {listaGrupos.filter(grupoDisponivel).map((grupo) => {
                    const vagas = vagasDoGrupo(grupo);
                    return (
                      <option key={grupo.id} value={grupo.id}>
                        {grupo.nome}{vagas === null ? '' : ` · ${vagas} vaga(s)`}
                      </option>
                    );
                  })}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-stone-400">▼</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2 border-t w-full">
              <button
                type="button"
                onClick={() => setModalConvocar({ aberto: false, item: null })}
                className="flex-1 py-2.5 border rounded-xl text-stone-500 font-bold text-xs transition-colors hover:bg-stone-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConvocarDaFila}
                disabled={processandoFilaId !== null || grupoDestinoConvocacao === ''}
                className="flex-1 py-2.5 bg-[#0B1E14] text-white font-bold rounded-xl shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processandoFilaId !== null ? 'Convocando...' : 'Confirmar convocação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalReprovaCredito.aberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Reprovar Crédito</h3>
              <button
                type="button"
                onClick={() => setModalReprovaCredito({ aberto: false, cotaId: null })}
                className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer"
              >
                X
              </button>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed bg-stone-50 p-3 rounded-xl border border-dashed">
              A contemplação continua registrada e a cota não volta a concorrer. A cliente retira o produto quando o
              grupo encerrar, e o motivo abaixo aparece no painel dela.
            </p>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Motivo da reprovação</label>
              <textarea
                value={motivoReprovaCredito}
                onChange={(e) => setMotivoReprovaCredito(e.target.value)}
                rows={3}
                placeholder="Ex: restrição ativa em consulta ao birô de crédito"
                className="w-full px-3 py-2 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm focus:outline-none focus:border-[#BD6B42] resize-none"
              />
            </div>

            <div className="flex space-x-2 pt-2 border-t w-full">
              <button
                type="button"
                onClick={() => setModalReprovaCredito({ aberto: false, cotaId: null })}
                className="flex-1 py-2.5 border rounded-xl text-stone-500 font-bold text-xs transition-colors hover:bg-stone-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarReprovaCredito}
                disabled={processandoSorteio || motivoReprovaCredito.trim() === ''}
                className="flex-1 py-2.5 bg-rose-700 text-white font-bold rounded-xl shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-rose-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processandoSorteio ? 'Registrando...' : 'Confirmar reprovação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAddParticipantesAberto && grupoSelecionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Adicionar Clientes ao Grupo</h3>
                <p className="text-[10px] text-stone-400 font-mono">{grupoSelecionado.nome} · {vagasDisponiveis} vaga(s) livre(s)</p>
              </div>
              <button
                type="button"
                onClick={() => setModalAddParticipantesAberto(false)}
                className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer"
              >
                X
              </button>
            </div>

            <form onSubmit={handleAdicionarParticipantes} className="space-y-3.5 text-xs text-[#0B1E14]">
              <input
                type="text"
                value={buscaClienteGrupo}
                onChange={(e) => setBuscaClienteGrupo(e.target.value)}
                placeholder="Buscar por nome, e-mail ou CPF"
                className="w-full h-[40px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm focus:outline-none focus:border-[#BD6B42]"
              />

              {erroDisponiveis && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2.5 text-[11px] font-medium flex items-center justify-between gap-2">
                  <span>{erroDisponiveis}</span>
                  <button
                    type="button"
                    onClick={() => carregarClientesDisponiveis(grupoSelecionado.id)}
                    className="font-bold uppercase text-[10px] underline cursor-pointer whitespace-nowrap"
                  >
                    Tentar de novo
                  </button>
                </div>
              )}

              <div className="border border-[#DFD9CE] rounded-xl max-h-72 overflow-y-auto divide-y divide-[#EFEAE1]">
                {carregandoDisponiveis ? (
                  <p className="py-8 text-center text-stone-400 italic text-[11px]">Carregando clientes da sua unidade...</p>
                ) : clientesDisponiveisFiltrados.length === 0 ? (
                  <p className="py-8 text-center text-stone-400 italic text-[11px]">
                    {clientesDisponiveis.length === 0
                      ? 'Nenhuma cliente cadastrada na sua unidade ainda. Cadastre pelo botão "+ Nova Cliente".'
                      : 'Nenhuma cliente encontrada para esta busca.'}
                  </p>
                ) : (
                  clientesDisponiveisFiltrados.map((cliente) => {
                    const selecionado = clientesSelecionados.includes(cliente.id);
                    // Já no grupo não entra de novo; e sem vaga sobrando so da para
                    // desmarcar quem já foi escolhido.
                    const bloqueado = cliente.jaNoGrupo || (!selecionado && limiteSelecaoAtingido);

                    return (
                      <label
                        key={cliente.id}
                        className={`flex items-center gap-3 px-4 py-3 transition-all ${
                          bloqueado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-stone-50/70'
                        } ${selecionado ? 'bg-amber-50/70' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selecionado}
                          disabled={bloqueado}
                          onChange={() => alternarSelecaoCliente(cliente.id)}
                          className="w-4 h-4 accent-[#BD6B42] cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold text-[#0B1E14] truncate">{cliente.nome}</span>
                          <span className="block text-[10px] text-stone-400 font-mono truncate">
                            {cliente.cpf ? aplicarMascaraCpf(cliente.cpf) : (cliente.email || 'Sem documento informado')}
                          </span>
                        </span>
                        {cliente.jaNoGrupo && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap">
                            Já no grupo
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400">
                <span>{clientesSelecionados.length} selecionada(s)</span>
                {limiteSelecaoAtingido && vagasDisponiveis > 0 && (
                  <span className="text-[#BD6B42]">Limite de vagas atingido</span>
                )}
              </div>

              {vagasDisponiveis === 0 && !carregandoDisponiveis && (
                <div className="bg-stone-50 p-3 rounded-xl border border-dashed text-[10px] text-stone-500 leading-relaxed">
                  Este grupo já atingiu a lotação máxima de {grupoSelecionado.quantidadeMaxCotas} cotas. Remova um participante ou crie um novo grupo para continuar vendendo.
                </div>
              )}

              <div className="flex space-x-2 pt-2 border-t w-full">
                <button
                  type="button"
                  onClick={() => setModalAddParticipantesAberto(false)}
                  className="flex-1 py-2.5 border rounded-xl text-stone-500 font-bold transition-colors hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoParticipantes || clientesSelecionados.length === 0}
                  className="flex-1 py-2.5 bg-[#0B1E14] text-white font-bold rounded-xl shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {salvandoParticipantes ? 'Salvando...' : 'Salvar no Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {fichaCliente.aberta && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

            {(() => {
              const f: any = fichaCliente.dados ?? {};
              const din = (n: any) => `R$ ${(Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              const data = (d: any) => (d ? new Date(d).toLocaleDateString('pt-BR') : null);
              const mesAno = (d: any) =>
                d ? new Date(d).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : null;
              const pct = Number(f.percentualPago) || 0;

              const iniciais = (fichaCliente.nome || '')
                .trim().split(/\s+/).slice(0, 2).map((n: string) => n[0] || '').join('').toUpperCase();

              // A situacao e o que a loja quer saber de relance, entao vira
              // etiqueta colorida em vez de mais uma linha de texto.
              const situacoes: Record<string, { texto: string; cor: string }> = {
                QUITADA:    { texto: 'Plano quitado',  cor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                ADIANTADA:  { texto: 'Adiantada',      cor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                EM_DIA:     { texto: 'Em dia',         cor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                EM_ATRASO:  { texto: 'Em atraso',      cor: 'bg-rose-50 text-rose-700 border-rose-200' },
                INDEFINIDA: { texto: 'Sem referência', cor: 'bg-stone-100 text-stone-500 border-stone-200' },
              };
              const etiqueta = situacoes[f.situacao] ?? situacoes.INDEFINIDA;

              const Campo = ({ rot, children }: { rot: string; children: React.ReactNode }) => (
                <div>
                  <span className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">{rot}</span>
                  <span className="text-stone-700">{children}</span>
                </div>
              );

              const Titulo = ({ children }: { children: React.ReactNode }) => (
                <h4 className="text-[10px] font-bold text-[#0B1E14] uppercase tracking-wider mb-2.5">{children}</h4>
              );

              return (
                <>
                  <div className="flex justify-between items-start gap-4 px-6 pt-6 pb-4 border-b border-[#DFD9CE] bg-[#FAF8F4]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-[#0B1E14] flex items-center justify-center border border-[#DFD9CE]">
                        {f.fotoPerfil ? (
                          <img src={f.fotoPerfil} alt={fichaCliente.nome} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#EFE9DF] font-serif font-bold text-lg">{iniciais || '—'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide truncate">
                          {fichaCliente.nome}
                        </h3>
                        <p className="text-[10px] text-stone-400 font-mono">
                          {f.numeroCliente != null
                            ? `Cliente ${numeroDaCliente(f.numeroCliente)}`
                            : f.id
                              ? `Cliente #${f.id}`
                              : 'Ficha da cliente'}
                          {f.clienteDesde ? ` · desde ${mesAno(f.clienteDesde)}` : ''}
                        </p>
                        {f.temCota && (
                          <span className={`inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border ${etiqueta.cor}`}>
                            {etiqueta.texto}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setFichaCliente({ aberta: false, carregando: false, nome: '', dados: null })}
                      className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer shrink-0"
                    >
                      X
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">
                    {fichaCliente.carregando ? (
                      <p className="text-xs text-stone-400 italic py-6 text-center">Carregando os dados da cliente...</p>
                    ) : !fichaCliente.dados ? (
                      <p className="text-xs text-rose-600 py-6 text-center">Não foi possível carregar a ficha desta cliente.</p>
                    ) : (
                      <>
                        {f.parcial && (
                          <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 leading-relaxed">
                            <strong>Ficha parcial.</strong> O servidor ainda não tem a consulta completa, então
                            estes números foram montados a partir da lista de integrantes. Faltam CPF, telefone,
                            foto, histórico de pagamentos e a conferência de atraso.
                          </div>
                        )}

                        <div>
                          <Titulo>Contato</Titulo>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <Campo rot="Telefone">
                              {f.telefone ? (
                                <a
                                  href={`https://wa.me/55${String(f.telefone).replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-mono text-[#BD6B42] font-bold hover:underline"
                                >
                                  {aplicarMascaraTelefone(f.telefone)}
                                </a>
                              ) : (
                                <span className="text-stone-400">Não informado</span>
                              )}
                            </Campo>
                            <Campo rot="CPF">
                              <span className="font-mono">{f.cpf ? aplicarMascaraCpf(f.cpf) : 'Não informado'}</span>
                            </Campo>
                            <div className="col-span-2">
                              <Campo rot="E-mail">
                                <span className="font-mono break-all">{f.email || 'Não informado'}</span>
                              </Campo>
                            </div>
                          </div>

                          {f.verificacaoPendente && (
                            <p className="mt-3 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                              Cadastro ainda não confirmado: esta cliente não consegue entrar no aplicativo até
                              digitar o código enviado por e-mail.
                            </p>
                          )}
                        </div>

                        {!f.temCota ? (
                          <p className="text-xs text-stone-400 italic border-t border-[#DFD9CE] pt-4">
                            Esta cliente não tem cota neste grupo.
                          </p>
                        ) : (
                          <>
                            <div className="border-t border-[#DFD9CE] pt-4">
                              <Titulo>Pagamento</Titulo>

                              <div className="flex justify-between items-baseline mb-2">
                                <span className="text-2xl font-bold font-mono text-[#0B1E14]">{din(f.saldoPago)}</span>
                                <span className="text-[10px] text-stone-400">de {din(f.valorTotalPlano)}</span>
                              </div>

                              <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden mb-2">
                                <div
                                  className={`h-full rounded-full transition-all ${f.situacao === 'EM_ATRASO' ? 'bg-rose-500' : 'bg-emerald-600'}`}
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>

                              <div className="flex justify-between text-[10px] text-stone-500 mb-4">
                                <span>
                                  <strong className="text-[#0B1E14]">{f.parcelasPagas}</strong> de {f.parcelasTotal} parcelas
                                  {f.valorParcela ? ` de ${din(f.valorParcela)}` : ''}
                                </span>
                                <span>{pct.toFixed(0)}% · falta {din(f.faltaPagar)}</span>
                              </div>

                              {f.parcelasEmAtraso > 0 && (
                                <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 mb-3">
                                  {f.parcelasEmAtraso} parcela{f.parcelasEmAtraso > 1 ? 's' : ''} em atraso · a esta altura
                                  do plano já eram esperadas {f.parcelasEsperadas}
                                </p>
                              )}

                              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                                <Campo rot="Último pagamento">
                                  {f.ultimoPagamentoData ? (
                                    <>
                                      <span className="font-mono">{data(f.ultimoPagamentoData)}</span>
                                      {f.diasSemPagar != null && (
                                        <span className={`block text-[10px] ${f.diasSemPagar > 45 ? 'text-rose-600 font-bold' : 'text-stone-400'}`}>
                                          há {f.diasSemPagar} dia{f.diasSemPagar === 1 ? '' : 's'}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-stone-400">Nenhum</span>
                                  )}
                                </Campo>
                                <Campo rot="Parcelas restantes">
                                  <span className="font-mono">{f.parcelasRestantes ?? '—'}</span>
                                </Campo>
                                <Campo rot="Previsão de quitação">
                                  {f.previsaoQuitacao ? (
                                    <span className="capitalize">{mesAno(f.previsaoQuitacao)}</span>
                                  ) : (
                                    <span className="text-emerald-700 font-bold">Quitado</span>
                                  )}
                                </Campo>
                              </div>
                            </div>

                            <div className="border-t border-[#DFD9CE] pt-4">
                              <Titulo>Plano e contemplação</Titulo>
                              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                                <Campo rot="Sorteio">
                                  {f.foiSorteada ? (
                                    <span className="text-amber-700 font-bold">
                                      Sorteada{f.dataContemplacao ? ` em ${data(f.dataContemplacao)}` : ''}
                                    </span>
                                  ) : (
                                    <span className="text-stone-400">Ainda não sorteada</span>
                                  )}
                                </Campo>
                                <Campo rot="Etapa">{f.etapa || '—'}</Campo>
                                <Campo rot="Cota">
                                  <span className="font-mono">#{f.cotaId}</span>
                                </Campo>
                                <Campo rot="Produto escolhido">{f.produtoEscolhido || '—'}</Campo>
                                <Campo rot="Termo assinado">
                                  {f.termoAssinado ? (
                                    <span className="text-emerald-700 font-bold">
                                      Sim{f.dataAssinaturaTermo ? ` · ${data(f.dataAssinaturaTermo)}` : ''}
                                    </span>
                                  ) : (
                                    <span className="text-stone-400">Não</span>
                                  )}
                                </Campo>
                                <Campo rot="Entrega">
                                  {f.dataEntrega ? (
                                    <span className="font-mono">{data(f.dataEntrega)}</span>
                                  ) : (
                                    <span className="text-stone-400">
                                      {String(f.statusEntrega || '').replace(/_/g, ' ').toLowerCase() || '—'}
                                    </span>
                                  )}
                                </Campo>
                              </div>

                              {f.creditoAprovado === false && (
                                <p className="mt-3 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
                                  Crédito reprovado{f.motivoReprovacaoCredito ? `: ${f.motivoReprovacaoCredito}` : '.'}
                                </p>
                              )}
                            </div>

                            {(f.planos ?? []).length > 0 && (
                              <div className="border-t border-[#DFD9CE] pt-4">
                                <Titulo>Outros planos desta cliente</Titulo>
                                <div className="space-y-1.5">
                                  {(f.planos ?? []).map((p: any) => (
                                    <div key={p.grupoId} className="flex justify-between items-center text-[11px]">
                                      <span className="text-stone-600 truncate pr-3">
                                        {p.grupoNome}
                                        {p.foiSorteada && <span className="text-amber-700 ml-2">sorteada</span>}
                                      </span>
                                      <span className="font-mono text-stone-500 shrink-0">{din(p.saldoPago)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(f.transacoes ?? []).length > 0 && (
                              <div className="border-t border-[#DFD9CE] pt-4">
                                <Titulo>Últimos lançamentos ({f.totalLancamentos})</Titulo>
                                <div className="space-y-1.5">
                                  {(f.transacoes ?? []).slice(0, 8).map((t: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-[11px]">
                                      <span className="text-stone-500">
                                        <span className="font-mono">{data(t.data) || '—'}</span>
                                        <span className="text-stone-400 ml-2">
                                          {String(t.status || '').replace(/_/g, ' ').toLowerCase()}
                                        </span>
                                      </span>
                                      <span className={`font-mono font-bold ${t.entrou ? 'text-emerald-700' : 'text-stone-400 line-through'}`}>
                                        {din(t.valor)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>

                  <div className="px-6 py-4 border-t border-[#DFD9CE] bg-[#FAF8F4]">
                    <button
                      type="button"
                      onClick={() => setFichaCliente({ aberta: false, carregando: false, nome: '', dados: null })}
                      className="w-full py-2.5 border border-[#DFD9CE] rounded-xl text-stone-500 font-bold hover:bg-white transition-colors cursor-pointer text-xs"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {modalDataInicio.aberto && grupoSelecionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Início do Grupo</h3>
                <p className="text-[10px] text-stone-400 font-mono">{grupoSelecionado.nome}</p>
              </div>
              <button
                onClick={() => setModalDataInicio({ aberto: false, valor: '', salvando: false })}
                className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer"
              >
                X
              </button>
            </div>

            <form onSubmit={salvarDataInicioDoGrupo} className="space-y-4 text-xs">
              <p className="text-stone-500 bg-stone-50 p-3 rounded-xl border border-dashed text-[11px] leading-relaxed">
                O dia em que o grupo passou a valer para as participantes, que nem sempre é o dia em que ele foi
                cadastrado aqui. O término é calculado a partir dele e não precisa ser digitado.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={modalDataInicio.valor}
                  onChange={(e) => setModalDataInicio((prev) => ({ ...prev, valor: e.target.value }))}
                  className="w-full h-[42px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm font-bold focus:outline-none focus:border-[#BD6B42]"
                  required
                />
                {modalDataInicio.valor && (
                  <p className="text-[10px] text-emerald-700 font-mono font-bold mt-1.5">
                    Término previsto:{' '}
                    {(() => {
                      // Monta a data em UTC e soma os meses: usar new Date com a
                      // string crua joga o dia para o anterior em fuso negativo,
                      // e o termino apareceria um dia antes do que sera gravado.
                      const [ano, mes, dia] = modalDataInicio.valor.split('-').map(Number);
                      const fim = new Date(Date.UTC(ano, mes - 1, dia));
                      fim.setUTCMonth(fim.getUTCMonth() + Number(grupoSelecionado.duracaoMeses || 0));
                      return fim.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                    })()}
                  </p>
                )}
              </div>

              <div className="flex space-x-2 pt-2 border-t w-full">
                <button
                  type="button"
                  onClick={() => setModalDataInicio({ aberto: false, valor: '', salvando: false })}
                  className="flex-1 py-2.5 border rounded-xl text-stone-500 font-bold hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalDataInicio.salvando}
                  className="flex-1 py-2.5 bg-[#0B1E14] text-white font-bold rounded-xl shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {modalDataInicio.salvando ? 'Gravando...' : 'Salvar Data'}
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
                <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Lançar Pagamento Manual</h3>
                <p className="text-[10px] text-stone-400 font-mono">Cota selecionada: #{idOperacao}</p>
              </div>
              <button onClick={() => setModalPagamentoManualAberto(false)} className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer">X</button>
            </div>

            <form onSubmit={handleLancarPagamentoManual} className="space-y-4 text-xs">
              <p className="text-stone-500 bg-stone-50 p-3 rounded-xl border border-dashed text-[11px] leading-relaxed">
                Utilize esta opção para dar baixa nas parcelas que a participante já pagou presencialmente na loja (dinheiro, PIX direto ou cartão).
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

      {modalBloqueioAberto && clienteParaBloquear && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-rose-100">
                <div className="flex justify-between items-center mb-4 border-b border-stone-100 pb-3">
                    <div>
                        <h3 className="font-bold text-[#0B1E14] text-sm uppercase tracking-wide">Bloquear Cliente</h3>
                        <p className="text-[10px] text-stone-400 mt-0.5">Alvo: {clienteParaBloquear.nome}</p>
                    </div>
                    <button onClick={() => setModalBloqueioAberto(false)} className="text-stone-400 font-bold px-2 cursor-pointer">X</button>
                </div>
                
                <form onSubmit={confirmarBloqueioCliente} className="space-y-4">
                    <p className="text-xs text-stone-500 leading-relaxed bg-stone-50 p-3 rounded-xl border border-dashed">
                        O cliente será impedido de acessar os planos e a vitrine da sua unidade. Para manter o histórico de risco, detalhe o motivo abaixo.
                    </p>
                    
                    <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">Motivo da Exclusao</label>
                        <textarea
                            value={motivoBloqueio}
                            onChange={(e) => setMotivoBloqueio(e.target.value)}
                            required
                            placeholder="Ex: Inadimplencia, Quebra de contrato..."
                            className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-xs min-h-[80px] focus:outline-none focus:border-[#BD6B42] resize-none"
                        ></textarea>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t border-stone-100">
                        <button 
                            type="button"
                            onClick={() => setModalBloqueioAberto(false)} 
                            className="flex-1 py-2.5 bg-white border border-stone-200 text-stone-500 font-bold rounded-xl text-[10px] uppercase hover:bg-stone-50 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={processandoBloqueio}
                            className="flex-1 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-[10px] uppercase hover:bg-rose-700 shadow-md transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {processandoBloqueio ? 'Registrando...' : 'Confirmar Bloqueio'}
                        </button>
                    </div>
                </form>
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

      {/* Reprovar credito exige motivo: a cliente le esse texto no painel dela,
          e "credito nao liberado" sem explicacao vira ligacao para a loja. */}
      {motivoReprovacao && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="border-b pb-3">
              <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Crédito não liberado</h3>
              <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">
                A contemplação dela continua registrada — ela retira o produto no encerramento do grupo.
                O motivo abaixo aparece no painel da cliente.
              </p>
            </div>

            <textarea
              value={motivoReprovacao.texto}
              onChange={(e) => setMotivoReprovacao({ ...motivoReprovacao, texto: e.target.value })}
              rows={3}
              autoFocus
              placeholder="Ex.: restrição encontrada na consulta de crédito."
              className="w-full border border-[#DFD9CE] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#BD6B42] transition-colors resize-none"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMotivoReprovacao(null)}
                className="flex-1 py-2.5 border rounded-xl text-stone-500 font-bold text-[10px] uppercase tracking-wider hover:bg-stone-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!motivoReprovacao.texto.trim() || processandoCreditoId === motivoReprovacao.cotaId}
                onClick={() => handleAnalisarCredito(motivoReprovacao.cotaId, false, motivoReprovacao.texto)}
                className="flex-1 py-2.5 bg-rose-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider hover:bg-rose-800 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
