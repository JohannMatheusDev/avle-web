'use client';

import { useEffect, useState, useRef } from 'react';
import { CardContemplacao, EtapaTrilha, mensagemDeErro } from '../../lib/contemplacao';
import { aplicarMascaraCep } from '../../lib/validacao';
import { SENHA_PADRAO_INICIAL } from '../../lib/constantes';
import { proximoVencimento, proximoSorteio, formatarData, diasAte } from '../../lib/datas';
import { grupoDisponivel } from '../../lib/grupos';
import { useRouter } from 'next/navigation';
import { apiFetch, encerrarSessao } from '../../lib/api';
import { useHistoricoDoPainel } from '../../lib/historico';
import {
  CabecalhoDoPainel, Icone, Identidade, ItemDeNavegacao, PilulasDeSecao, TrilhoDeNavegacao,
} from './Casca';
import { PassoDoTour, useTour } from './Tour';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

export default function DashboardCliente({ usuario: usuarioInicial }: { usuario: any }) {
  const router = useRouter();

  const [usuario, setUsuario] = useState(usuarioInicial);

  const [nomeInput, setNomeInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [cpfInput, setCpfInput] = useState('');
  const [telefoneInput, setTelefoneInput] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  const [senhaAtualInput, setSenhaAtualInput] = useState('');
  const [novaSenhaInput, setNovaSenhaInput] = useState('');
  const [confirmarNovaSenhaInput, setConfirmarNovaSenhaInput] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [statusSalvarSenha, setStatusSalvarSenha] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);

  const [abaAtiva, setAbaAtiva] = useState<'inicio' | 'extrato' | 'regras' | 'ajuda' | 'perfil'>('inicio');
  const [saldoPoupanca, setSaldoPoupanca] = useState<number>(0);
  const [modalCheckoutAberto, setModalCheckoutAberto] = useState(false);
  const [entrandoNoGrupo, setEntrandoNoGrupo] = useState(false);

  // Cota recem-criada cuja primeira parcela ainda nao foi paga. Enquanto ela
  // existe, o checkout fica por cima do painel e nao aceita ser fechado: a
  // entrada no grupo passou a ser "entrar e pagar", e nao "entrar e a loja
  // corre atras depois". Fica guardada no navegador porque fechar a aba no
  // meio do Pix nao pode virar uma cota sem pagamento nenhum.
  const [cotaAguardandoPrimeiraParcela, setCotaAguardandoPrimeiraParcela] = useState<number | null>(null);

  const [nivelVisao, setNivelVisao] = useState<'lojas' | 'grupos' | 'dashboard'>('lojas');

  // Qual lista de grupos esta aberta. Nulo enquanto a cliente nao escolheu, e
  // ai a tela decide sozinha: quem ja tem plano abre nos planos dela.
  const [abaGrupos, setAbaGrupos] = useState<'meus' | 'disponiveis' | null>(null);

  // A gaveta de menu do celular deixou de existir junto com a barra lateral
  // verde: a navegacao agora e a barra fixa no rodape, sempre visivel, sem
  // estado para abrir e fechar e sem cobrir o plano da cliente ao abrir.
  const [lojaEmFoco, setLojaEmFoco] = useState<any | null>(null);
  const [gruposDaLoja, setGruposDaLoja] = useState<any[]>([]);
  const [carregandoGrupos, setCarregandoGrupos] = useState(false);
  // Falha ao buscar os grupos, dita como falha. Antes ela virava lista vazia
  // e a tela dizia "nenhum grupo com vaga" - a cliente desistia de uma loja
  // que tinha grupo aberto.
  const [erroGrupos, setErroGrupos] = useState(false);

  const [lojas, setLojas] = useState<any[]>([]);
  const [erroConexao, setErroConexao] = useState(false);

  const [acessosLoja, setAcessosLoja] = useState<any[]>([]);

  // Fila de espera por loja: em qual delas esta cliente ja pediu vaga e em que
  // posicao. Carregado junto dos acessos, no mesmo formato de lista por loja.
  const [filasEspera, setFilasEspera] = useState<any[]>([]);
  const [processandoFila, setProcessandoFila] = useState(false);
  const [modalAcessoAberto, setModalAcessoAberto] = useState(false);
  const [lojaParaAcesso, setLojaParaAcesso] = useState<any | null>(null);
  const [solicitandoAcesso, setSolicitandoAcesso] = useState(false);

  const [modalAdesao, setModalAdesao] = useState<{ aberto: boolean; grupo: any | null }>({ aberto: false, grupo: null });

  const [clubesAtivos, setClubesAtivos] = useState<any[]>([]);
  // O plano aberto e a loja em foco só voltam depois do refresh quando as
  // duas listas já chegaram.
  const [clubesCarregados, setClubesCarregados] = useState(false);
  const [lojasCarregadas, setLojasCarregadas] = useState(false);
  const [clubeAtualSelecionado, setClubeAtualSelecionado] = useState<any | null>(null);
  const [grupoSelecionado, setGrupoSelecionado] = useState<any | null>(null);
  const [lojaSelecionada, setLojaSelecionada] = useState<any | null>(null);

  // Trilha pos-sorteio. Cada card e uma cota contemplada desta cliente.
  const [cardsContemplacao, setCardsContemplacao] = useState<CardContemplacao[]>([]);
  const [salvandoEtapa, setSalvandoEtapa] = useState(false);
  const [modalProduto, setModalProduto] = useState<{ aberto: boolean; cotaId: number | null }>({ aberto: false, cotaId: null });
  const [produtoEscolhido, setProdutoEscolhido] = useState('');

  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [statusSalvar, setStatusSalvar] = useState<'sucesso' | 'erro' | null>(null);

  const [notificacao, setNotificacao] = useState<{ aberto: boolean; titulo: string; mensagem: string; isError?: boolean }>({ aberto: false, titulo: '', mensagem: '', isError: false });

  const conviteProcessado = useRef(false);

  // NOVIDADE: Estado que define se o cliente está "Trancado" em uma loja específica
  const [lojaBloqueadaId, setLojaBloqueadaId] = useState<number | null>(usuarioInicial?.lojaId || usuarioInicial?.loja?.id || null);

  const totalObjetivo = grupoSelecionado ? Number(grupoSelecionado.valorParcela) * Number(grupoSelecionado.duracaoMeses) : 0;
  const valorMensalidade = grupoSelecionado ? Number(grupoSelecionado.valorParcela) : 0;

  const [dataVencimentoCota, setDataVencimentoCota] = useState('');
  const [diasRestantesVencimento, setDiasRestantesVencimento] = useState(0);
  const [exibirBannerAlerta, setExibirBannerAlerta] = useState(false);

  const percentual = totalObjetivo > 0 ? Math.min(Math.round((saldoPoupanca / totalObjetivo) * 100), 100) : 0;

  let etapaAtual = 1;
  if (saldoPoupanca > 0 && saldoPoupanca < totalObjetivo) {
    etapaAtual = 2;
  } else if (saldoPoupanca >= totalObjetivo) {
    etapaAtual = 4;
  }

  const mostrarAviso = (titulo: string, mensagem: string, isError: boolean = false) => {
    setNotificacao({ aberto: true, titulo, mensagem, isError });
  };

  const obterNomeLoja = (item: any) => {
    if (!item) return 'Loja parceira';
    if (typeof item === 'string' && item.trim().length > 0) return item;
    const objLoja = item.loja || item.grupo?.loja || item;
    const nome = objLoja.nomeComercial || objLoja.nome_comercial || objLoja.nome || objLoja.nomeLoja || objLoja.razaoSocial || item.nomeComercial || item.nome_comercial || item.nome;
    if (nome && typeof nome === 'string' && nome.trim().length > 0) return nome.trim();
    return item.grupo?.nome || item.nomeGrupo || 'Loja parceira';
  };

  const aplicarMascaraTelefone = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    if (apenasNumeros.length <= 2) return apenasNumeros;
    if (apenasNumeros.length <= 6) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
    if (apenasNumeros.length <= 10) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`;
  };

  const aplicarMascaraCpfCnpj = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    if (apenasNumeros.length <= 11) {
      return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "$1.$2.$3-$4");
    }
    return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, "$1.$2.$3/$4-$5");
  };

  useEffect(() => {
    const venc = proximoVencimento();
    const dias = diasAte(venc);
    setDiasRestantesVencimento(dias);
    setDataVencimentoCota(formatarData(venc));
    setExibirBannerAlerta(dias <= 3);
  }, [abaAtiva]);

  const buscarContemplacoes = async (fallbackUserId?: number) => {
    const userId = fallbackUserId || usuario?.id;
    if (!userId) return;

    try {
      const res = await apiFetch(`${API_URL}/api/contemplacoes/cliente/${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      setCardsContemplacao(Array.isArray(data) ? data : []);
    } catch {
      // Sem contemplação a tela segue igual; não vale bloquear o painel por isso.
    }
  };

  const avancarEtapa = async (cotaId: number, rota: string, corpo?: Record<string, unknown>) => {
    setSalvandoEtapa(true);
    try {
      const res = await apiFetch(`${API_URL}/api/contemplacoes/${cotaId}/${rota}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo || {}),
      });

      const retorno = await res.json().catch(() => null);
      if (!res.ok) throw new Error(retorno?.erro || 'Não foi possível concluir esta etapa.');

      setCardsContemplacao((atual) =>
        atual.map((card) => (card.cotaId === cotaId ? retorno : card))
      );
      return true;
    } catch (erro) {
      setNotificacao({
        aberto: true,
        titulo: 'Não foi possível avançar',
        mensagem: mensagemDeErro(erro, 'Tente novamente em instantes.'),
        isError: true,
      });
      return false;
    } finally {
      setSalvandoEtapa(false);
    }
  };

  const confirmarProduto = async () => {
    if (!modalProduto.cotaId || produtoEscolhido.trim() === '') return;
    const ok = await avancarEtapa(modalProduto.cotaId, 'produto', { produto: produtoEscolhido.trim() });
    if (ok) {
      setModalProduto({ aberto: false, cotaId: null });
      setProdutoEscolhido('');
    }
  };

  const buscarCarteiraDeClubes = async (forcedId?: number, fallbackUserId?: number) => {
    const userId = fallbackUserId || usuario?.id;
    if (!userId) return;

    try {
      const res = await apiFetch(`${API_URL}/api/usuarios/${userId}/clubes-ativos`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const chaveArmazenamento = `@avle:cotas_${userId}`;
        const cotasSalvasStr = localStorage.getItem(chaveArmazenamento);
        const idsAtuais = data.map((c: any) => c.cotaId);

        if (cotasSalvasStr) {
          const cotasSalvas = JSON.parse(cotasSalvasStr);
          const removidos = cotasSalvas.filter((id: number) => !idsAtuais.includes(id));
          
          if (removidos.length > 0) {
             mostrarAviso('Participação cancelada', 'A administração da loja encerrou a sua participação em um dos grupos de compras. O seu histórico vinculado a esta cota foi fechado.', true);
             
             if (clubeAtualSelecionado && removidos.includes(clubeAtualSelecionado.cotaId)) {
                 if (lojaBloqueadaId) {
                     setNivelVisao('grupos');
                 } else {
                     setNivelVisao('lojas');
                 }
                 setClubeAtualSelecionado(null);
                 setGrupoSelecionado(null);
                 setLojaSelecionada(null);
             }
          }
        }
        
        localStorage.setItem(chaveArmazenamento, JSON.stringify(idsAtuais));
        setClubesAtivos(data);
      }
    } catch {
      setClubesAtivos([]);
    } finally {
      setClubesCarregados(true);
    }
  };

  const buscarAcessosLoja = async (userId: number) => {
    try {
      const res = await apiFetch(`${API_URL}/api/usuarios/${userId}/acessos-loja`);
      const data = await res.json();
      if (Array.isArray(data)) setAcessosLoja(data);
    } catch (err) {}
  };

  // Entra na fila da loja em foco. So e oferecido quando nao ha nenhum grupo
  // aberto, então a cliente nunca escolhe fila tendo vaga disponivel.
  const handleEntrarNaFila = async () => {
    const userId = usuario?.id;
    const lojaId = lojaEmFoco?.id;
    if (!userId || !lojaId) return;

    setProcessandoFila(true);

    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/fila-espera`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: userId }),
      });

      if (!res.ok) throw new Error();

      await buscarFilasEspera(userId);
      mostrarAviso(
        'Você entrou na fila',
        'Assim que a loja abrir uma vaga, ela convoca quem está esperando pela ordem de chegada.',
        false
      );
    } catch (err) {
      mostrarAviso('Erro', 'Não foi possível entrar na fila de espera agora. Tente novamente em instantes.', true);
    } finally {
      setProcessandoFila(false);
    }
  };

  const handleSairDaFila = async (filaId: number) => {
    const userId = usuario?.id;
    const lojaId = lojaEmFoco?.id;
    if (!userId || !lojaId) return;

    setProcessandoFila(true);

    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/fila-espera/${filaId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await buscarFilasEspera(userId);
    } catch (err) {
      mostrarAviso('Erro', 'Não foi possível sair da fila de espera agora. Tente novamente em instantes.', true);
    } finally {
      setProcessandoFila(false);
    }
  };

  const buscarFilasEspera = async (userId: number) => {
    try {
      const res = await apiFetch(`${API_URL}/api/usuarios/${userId}/fila-espera`);
      const data = await res.json();
      if (Array.isArray(data)) setFilasEspera(data);
    } catch (err) {}
  };

  useEffect(() => {
    let currentUserId = usuario?.id;
    let currentUser = usuario;

    if (!currentUserId) {
      const usuarioLogado = localStorage.getItem('@avle:usuario');
      if (usuarioLogado) {
        currentUser = JSON.parse(usuarioLogado);
        setUsuario(currentUser);
        currentUserId = currentUser.id;
        if (currentUser.lojaId) setLojaBloqueadaId(currentUser.lojaId);
      }
    }

    if (currentUserId) {
      buscarCarteiraDeClubes(undefined, currentUserId);
      buscarContemplacoes(currentUserId);
      buscarAcessosLoja(currentUserId); 
      buscarFilasEspera(currentUserId);

      apiFetch(`${API_URL}/api/usuarios/${currentUserId}`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          if (data) {
            setNomeInput(data.nome || '');
            setEmailInput(data.email || '');
            setTelefoneInput(data.telefone ? aplicarMascaraTelefone(data.telefone) : '');
            setFotoPerfil(data.fotoPerfil || null);
            const documento = data.cpf || data.cpfCnpj || data.cpf_cnpj || data.documento || '';
            setCpfInput(documento ? aplicarMascaraCpfCnpj(documento) : '');
            
            if (data.lojaId) setLojaBloqueadaId(data.lojaId);
          }
        })
        .catch(() => {})
        .finally(() => setCarregandoDados(false));
    }

    apiFetch(`${API_URL}/api/lojas/listar-todas`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
            setLojas(data);
            
            const lojaVinculadaId = currentUser?.lojaId || currentUser?.loja?.id;
            const convitePendente = sessionStorage.getItem('@avle:convite_loja_id');
            
            // LÓGICA DE ISOLAMENTO: O cliente fica PRESO na loja do convite
            if (convitePendente) {
               const lojaDoConvite = data.find((l: any) => l.id.toString() === convitePendente);
               if (lojaDoConvite) {
                  setLojaBloqueadaId(lojaDoConvite.id); // Tranca a loja no sistema
                  
                  // Atualiza o banco do navegador para garantir que o isolamento persista após o reload
                  if (currentUser && !currentUser.lojaId) {
                      const userComLoja = { ...currentUser, lojaId: lojaDoConvite.id };
                      setUsuario(userComLoja);
                      localStorage.setItem('@avle:usuario', JSON.stringify(userComLoja));
                  }

                  setLojaEmFoco(lojaDoConvite);
                  if (!abriuGrupoDireto.current) setNivelVisao('grupos');
                  buscarGruposDaLoja(lojaDoConvite.id);
               }
               sessionStorage.removeItem('@avle:convite_loja_id');
               conviteProcessado.current = true; 
            }
            else if (lojaVinculadaId && !conviteProcessado.current) {
                const lojaDaPessoa = data.find((l: any) => l.id === lojaVinculadaId);
                if (lojaDaPessoa) {
                    setLojaBloqueadaId(lojaDaPessoa.id);
                    setLojaEmFoco(lojaDaPessoa);
                    if (!abriuGrupoDireto.current) setNivelVisao('grupos');
                    buscarGruposDaLoja(lojaVinculadaId);
                }
            }
        } else {
            setLojas([]);
        }
        setErroConexao(false);
      })
      .catch(() => {
        setLojas([]);
        setErroConexao(true);
      })
      .finally(() => {
        setLojasCarregadas(true);
      });
  }, [usuario?.id]);

  /** Os grupos da loja para a vitrine, com a falha tratada como falha. */
  const buscarGruposDaLoja = (lojaId: number) => {
    setCarregandoGrupos(true);
    setErroGrupos(false);
    apiFetch(`${API_URL}/api/grupos/loja/${lojaId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const grupos = await res.json();
        setGruposDaLoja(Array.isArray(grupos) ? grupos : []);
      })
      .catch(() => {
        setGruposDaLoja([]);
        setErroGrupos(true);
      })
      .finally(() => setCarregandoGrupos(false));
  };

  const entrarNaLoja = (loja: any) => {
    setLojaEmFoco(loja);
    setNivelVisao('grupos');
    buscarGruposDaLoja(loja.id);
  };

  /**
   * Abre a loja. Ver os planos nao depende mais de aprovacao.
   *
   * A analise que a loja faz e de credito, e ela so tem sentido depois do
   * sorteio, quando ha uma compra concreta para avaliar. Esperar um "sim" para
   * apenas olhar a vitrine travava a cliente sem nada a decidir do outro lado.
   *
   * A loja continua podendo bloquear quem ja entrou, e esse caso segue barrado
   * aqui.
   */
  const handleAbrirLoja = async (loja: any) => {
    const acesso = acessosLoja.find(a => a.lojaId === loja.id);
    const statusAcesso = acesso ? acesso.status : 'NAO_SOLICITADO';

    if (statusAcesso === 'REJEITADO' || statusAcesso === 'BLOQUEADO') {
      mostrarAviso(
        'Acesso bloqueado',
        'Este estabelecimento não liberou o seu acesso aos grupos de compras. Fale com a loja para entender o motivo.',
        true,
      );
      return;
    }

    // Primeira vez nesta loja: o vinculo e criado e ela entra na mesma acao.
    // Registros antigos que ficaram como PENDENTE tambem passam direto - a
    // espera que eles representavam nao existe mais.
    if (statusAcesso === 'NAO_SOLICITADO') {
      try {
        await apiFetch(`${API_URL}/api/lojas/${loja.id}/solicitar-acesso`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuarioId: usuario?.id }),
        });
        buscarAcessosLoja(usuario?.id);
      } catch {
        // Sem o vinculo ela ainda ve os planos; o vinculo se resolve na
        // proxima visita, e travar a navegacao aqui seria pior.
      }
    }

    entrarNaLoja(loja);
  };

  const handleSolicitarAcesso = async () => {
    if (!lojaParaAcesso) return;
    setSolicitandoAcesso(true);
    try {
       const res = await apiFetch(`${API_URL}/api/lojas/${lojaParaAcesso.id}/solicitar-acesso`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuarioId: usuario?.id })
       });
       
       if(res.ok) {
          mostrarAviso('Solicitação enviada', 'A caixa de mensagens da loja foi notificada para realizar a análise de crédito. O processo costuma ser rápido.', false);
          buscarAcessosLoja(usuario?.id);
          buscarFilasEspera(usuario?.id);
          setModalAcessoAberto(false);
       } else {
          mostrarAviso('Erro', 'Não foi possível enviar a solicitação no momento.', true);
       }
    } catch(e) {
       mostrarAviso('Erro de conexão', 'Erro ao conectar ao servidor ao solicitar acesso.', true);
    } finally {
       setSolicitandoAcesso(false);
    }
  };

  const handleAbrirGrupo = async (grupo: any, cotaExistente: any) => {
    if (cotaExistente) {
       setClubeAtualSelecionado(cotaExistente);
       setGrupoSelecionado(cotaExistente.grupo);
       setLojaSelecionada(cotaExistente.loja);
       setSaldoPoupanca(Number(cotaExistente.saldoPoupanca) || 0);
       setNivelVisao('dashboard');
    } else {
       setModalAdesao({ aberto: true, grupo });
    }
  };

  const confirmarAdesaoNoGrupo = async () => {
      const grupo = modalAdesao.grupo;
      if (entrandoNoGrupo) return;
      // A confirmação fica aberta, com "Entrando…", até o servidor responder:
      // fechar na hora deixava a tela parada por segundos na rede do celular,
      // e parecia que o botão não tinha feito nada.
      setEntrandoNoGrupo(true);

      try {
         const res = await apiFetch(`${API_URL}/api/usuarios/${usuario?.id}/vincular-clube`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ lojaId: Number(lojaEmFoco?.id), grupoId: Number(grupo?.id) })
         });
         
         // O motivo da recusa vem do servidor e e o que a cliente precisa
         // ler: "grupo lotado" pede outro grupo, "sem autorizacao" pede falar
         // com a loja. Antes todos viravam o mesmo "tente novamente".
         if (!res.ok) {
           const texto = await res.text().catch(() => '');
           let motivo = texto;
           try { motivo = JSON.parse(texto)?.erro ?? texto; } catch { /* texto puro */ }
           // Lotou entre ela abrir o grupo e confirmar: a vitrine se atualiza
           // e, sem outro grupo com vaga, a fila de espera aparece na tela.
           if (/lota[cç][aã]o/i.test(motivo)) {
             if (lojaEmFoco?.id) buscarGruposDaLoja(lojaEmFoco.id);
             setAbaGrupos('disponiveis');
             mostrarAviso(
               'Esse grupo acabou de lotar',
               'Alguém ocupou a última vaga agora. Escolha outro grupo com vaga ou entre na fila de espera da loja, que aparece nesta tela quando não há vaga.',
               true,
             );
             return;
           }
           mostrarAviso('Não deu para entrar no grupo', motivo || 'Tente de novo em instantes.', true);
           return;
         }
         
         const resClubes = await apiFetch(`${API_URL}/api/usuarios/${usuario?.id}/clubes-ativos`);
         const dataClubes = await resClubes.json();
         setClubesAtivos(dataClubes);
         
         const novaCota = dataClubes.find((c: any) => c.grupo?.id === grupo.id);
         if (!novaCota) {
           mostrarAviso(
             'Não deu para abrir o seu plano',
             'A entrada foi registrada, mas o plano ainda não apareceu. Atualize a página em instantes; se continuar assim, fale com a loja.',
             true,
           );
           return;
         }
         if (novaCota) {
            setClubeAtualSelecionado(novaCota);
            setGrupoSelecionado(novaCota.grupo);
            setLojaSelecionada(novaCota.loja);
            setSaldoPoupanca(Number(novaCota.saldoPoupanca) || 0);
            setNivelVisao('dashboard');

            // Entrar no grupo passou a incluir pagar a primeira parcela. O
            // servidor ja emite essa cobranca junto com a entrada; o que
            // faltava era a tela levar a cliente ate ela. Antes a cota nascia
            // sem ninguem pagar nada e sobrava para a loja cobrar no dedo, uma
            // a uma, pelo WhatsApp.
            marcarPrimeiraParcelaPendente(novaCota.cotaId);
            setModalCheckoutAberto(true);
         }
      } catch {
         mostrarAviso('Não deu para entrar no grupo', 'Não conseguimos falar com o servidor. Confira a conexão e tente de novo.', true);
      } finally {
         setEntrandoNoGrupo(false);
         setModalAdesao({ aberto: false, grupo: null });
      }
  };

  const chaveDaPrimeiraParcela = (userId?: number) => `@avle:primeira_parcela_${userId ?? usuario?.id}`;

  const marcarPrimeiraParcelaPendente = (cotaId: number) => {
    setCotaAguardandoPrimeiraParcela(cotaId);
    try {
      localStorage.setItem(chaveDaPrimeiraParcela(), String(cotaId));
    } catch {
      // Navegador sem armazenamento: o pagamento continua obrigatório nesta
      // visita, só não sobrevive a fechar a aba.
    }
  };

  const encerrarPrimeiraParcelaPendente = () => {
    setCotaAguardandoPrimeiraParcela(null);
    setModalCheckoutAberto(false);
    try {
      localStorage.removeItem(chaveDaPrimeiraParcela());
    } catch {
      // Sem armazenamento não há o que limpar.
    }
  };

  /**
   * Devolve a cliente ao pagamento que ela deixou pela metade.
   *
   * Fechar a aba no meio do Pix não pode virar uma cota dentro do grupo sem
   * pagamento nenhum: é exatamente o caso que fazia a loja cobrar manualmente
   * depois. Quem manda é o saldo vindo do servidor - assim que a primeira
   * parcela cai, a trava sai sozinha, sem depender de a cliente avisar.
   */
  useEffect(() => {
    const userId = usuario?.id;
    if (!userId || clubesAtivos.length === 0) return;

    // Quem manda é o servidor: ele diz qual cota entrou pelo painel e ainda
    // não pagou nada, e isso vale em qualquer aparelho. O navegador só guarda
    // a cota recém-criada até a primeira leitura do servidor chegar.
    const pelaApi = clubesAtivos.find((c: any) => c.aguardandoPrimeiraParcela === true);
    let pendente: string | null = null;
    try {
      pendente = localStorage.getItem(chaveDaPrimeiraParcela(userId));
    } catch {
      // Sem armazenamento, vale só o que o servidor disse.
    }
    if (!pelaApi && !pendente) return;

    const cotaId = pelaApi ? Number(pelaApi.cotaId) : Number(pendente);
    const cota = clubesAtivos.find((c: any) => c.cotaId === cotaId);

    // Cota que sumiu (a loja desfez a participação): não há mais o que cobrar.
    if (!cota) {
      encerrarPrimeiraParcelaPendente();
      return;
    }

    // Pagou: a trava sai e ela vai para a lista dos grupos de que faz parte,
    // e não fica presa dentro do grupo. Dali ela toca no grupo para abrir o
    // plano, como faz em qualquer outra visita.
    if (Number(cota.saldoPoupanca) > 0) {
      encerrarPrimeiraParcelaPendente();
      setClubeAtualSelecionado(null);
      setGrupoSelecionado(null);
      setAbaAtiva('inicio');
      setAbaGrupos('meus');
      const loja = lojas.find((l: any) => l.id === cota.loja?.id) ?? cota.loja;
      if (loja?.id) entrarNaLoja(loja);
      else setNivelVisao('grupos');
      mostrarAviso(
        'Pagamento confirmado',
        `Você já faz parte do ${cota.grupo?.nome || 'grupo'}. Toque nele em Meus planos para ver o seu plano.`,
        false,
      );
      return;
    }

    setCotaAguardandoPrimeiraParcela(cotaId);
    setClubeAtualSelecionado(cota);
    setGrupoSelecionado(cota.grupo);
    setLojaSelecionada(cota.loja);
    setSaldoPoupanca(Number(cota.saldoPoupanca) || 0);
    setNivelVisao('dashboard');
    setModalCheckoutAberto(true);
  }, [clubesAtivos, usuario?.id]);

  // Quem confirma o Pix é o banco, e ele avisa o servidor, não a tela. Sem
  // esta consulta de tempos em tempos a cliente pagaria e continuaria olhando
  // o QR Code, sem entender que já podia seguir.
  // Antes de reler a carteira, pede ao servidor para perguntar ao Asaas se a
  // cobrança já foi paga: assim a tela libera mesmo que o aviso do Asaas
  // (o webhook) não chegue.
  const conferirPagamentoNoAsaas = async (cotaId?: number | null) => {
    if (cotaId) {
      try {
        await apiFetch(`${API_URL}/api/pagamentos/conferir/${cotaId}`, { method: 'POST' });
      } catch {
        // Sem a conferência, vale o que o webhook já tiver gravado.
      }
    }
    await buscarCarteiraDeClubes();
  };

  useEffect(() => {
    if (cotaAguardandoPrimeiraParcela == null) return;
    const relogio = setInterval(() => { conferirPagamentoNoAsaas(cotaAguardandoPrimeiraParcela); }, 8_000);
    return () => clearInterval(relogio);
  }, [cotaAguardandoPrimeiraParcela]);

  /**
   * Relê o saldo no servidor depois de uma tentativa de pagamento.
   *
   * Antes a tela somava a parcela sozinha assim que a cliente abria o checkout.
   * Isso mostrava como pago o que ainda estava em aberto - e quem desistia no
   * meio via um saldo que não existia. Quem credita é a confirmação do banco;
   * aqui a tela só pergunta como ficou.
   */
  const atualizarSaldoAposPagamento = async () => {
    const userId = usuario?.id;
    if (!userId) return;

    try {
      const res = await apiFetch(`${API_URL}/api/usuarios/${userId}/clubes-ativos`);
      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data)) return;

      setClubesAtivos(data);
      const cotaAberta = data.find((c: any) => c.cotaId === clubeAtualSelecionado?.cotaId);
      if (cotaAberta) setSaldoPoupanca(Number(cotaAberta.saldoPoupanca) || 0);
    } catch {
      // Sem rede: o saldo continua o que era, que e a verdade conhecida.
    }
  };

  /**
   * Encolhe a foto antes de enviar.
   *
   * A foto vai para o banco como texto na propria linha do usuario, e o que
   * saia daqui era o arquivo inteiro da camera: 2 MB de JPEG viram quase
   * 2,7 MB depois do base64, que e o formato em que ele viaja e e guardado.
   * Isso pesa em tudo - no envio pela rede da cliente, na linha do banco e em
   * cada vez que o perfil e lido de volta.
   *
   * 512 pixels no maior lado da conta para um avatar de 96 px em tela retina,
   * e o resultado fica perto de 60 KB. A imagem e recortada no centro para
   * sair quadrada, que e como ela aparece na tela - assim o corte acontece
   * uma vez aqui, e nao a cada exibicao.
   */
  const encolherImagem = (arquivo: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
      leitor.onloadend = () => {
        const imagem = new Image();
        imagem.onerror = () => reject(new Error('O arquivo não é uma imagem válida.'));
        imagem.onload = () => {
          const LADO = 512;
          const corte = Math.min(imagem.width, imagem.height);
          const tela = document.createElement('canvas');
          tela.width = LADO;
          tela.height = LADO;

          const pincel = tela.getContext('2d');
          if (!pincel) { reject(new Error('Seu navegador não conseguiu preparar a imagem.')); return; }

          pincel.drawImage(
            imagem,
            (imagem.width - corte) / 2, (imagem.height - corte) / 2, corte, corte,
            0, 0, LADO, LADO,
          );
          resolve(tela.toDataURL('image/jpeg', 0.85));
        };
        imagem.src = leitor.result as string;
      };
      leitor.readAsDataURL(arquivo);
    });

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      mostrarAviso('Formato inválido', 'Apenas arquivos de imagem.', true);
      return;
    }
    if (arquivo.size > 10 * 1024 * 1024) {
      mostrarAviso('Arquivo muito grande', 'A imagem deve ter no máximo 10 MB.', true);
      return;
    }

    try {
      const imagemPronta = await encolherImagem(arquivo);

      const res = await apiFetch(`${API_URL}/api/usuarios/${usuario?.id}/foto`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotoPerfil: imagemPronta }),
      });

      // O motivo vem do servidor em vez de virar "nao foi possivel": foto que
      // nao salva e problema que a pessoa nao consegue contornar sozinha, e
      // sem o motivo ela tenta de novo com a mesma imagem.
      if (!res.ok) {
        const corpo = await res.text().catch(() => '');
        let motivo = '';
        try { motivo = JSON.parse(corpo)?.erro || ''; } catch { motivo = corpo; }
        throw new Error(motivo || 'Não foi possível salvar sua foto de perfil.');
      }

      setFotoPerfil(imagemPronta);
      const localUser = localStorage.getItem('@avle:usuario');
      if (localUser) {
        const parsed = JSON.parse(localUser);
        parsed.fotoPerfil = imagemPronta;
        localStorage.setItem('@avle:usuario', JSON.stringify(parsed));
      }
      mostrarAviso('Foto salva', 'Sua foto de perfil foi atualizada.', false);
    } catch (err) {
      mostrarAviso('Erro', mensagemDeErro(err, 'Não foi possível salvar sua foto de perfil.'), true);
    } finally {
      // Sem isto, escolher o mesmo arquivo de novo depois de um erro nao
      // dispara o evento e parece que o botao parou de funcionar.
      e.target.value = '';
    }
  };

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoPerfil(true);
    setStatusSalvar(null);

    const localUserStorage = localStorage.getItem('@avle:usuario');
    const parsedUser = localUserStorage ? JSON.parse(localUserStorage) : null;
    const userId = usuario?.id || parsedUser?.id;

    if (!userId) {
      setStatusSalvar('erro');
      setSalvandoPerfil(false);
      return;
    }

    try {
      const res = await apiFetch(`${API_URL}/api/usuarios/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeInput,
          email: emailInput,
          telefone: telefoneInput.replace(/\D/g, '')
        }),
      });

      if (!res.ok) throw new Error();

      const usuarioAtualizado = { ...usuario, nome: nomeInput, email: emailInput, telefone: telefoneInput.replace(/\D/g, '') };
      setUsuario(usuarioAtualizado);
      localStorage.setItem('@avle:usuario', JSON.stringify(usuarioAtualizado));
      setStatusSalvar('sucesso');
    } catch (err) {
      setStatusSalvar('erro');
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusSalvarSenha(null);

    if (novaSenhaInput !== confirmarNovaSenhaInput) {
      setStatusSalvarSenha({ tipo: 'erro', mensagem: 'As senhas não coincidem.' });
      return;
    }
    if (novaSenhaInput.length < 6) {
      setStatusSalvarSenha({ tipo: 'erro', mensagem: 'Mínimo de 6 caracteres.' });
      return;
    }

    setSalvandoSenha(true);
    const userId = usuario?.id || JSON.parse(localStorage.getItem('@avle:usuario') || '{}').id;

    try {
      const res = await apiFetch(`${API_URL}/api/usuarios/${userId}/alterar-senha`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual: senhaAtualInput, novaSenha: novaSenhaInput })
      });

      if (!res.ok) throw new Error();

      setStatusSalvarSenha({ tipo: 'sucesso', mensagem: 'Sua senha foi alterada com sucesso!' });
      setSenhaAtualInput('');
      setNovaSenhaInput('');
      setConfirmarNovaSenhaInput('');
    } catch (err: any) {
      setStatusSalvarSenha({ tipo: 'erro', mensagem: 'Falha ao alterar senha.' });
    } finally {
      setSalvandoSenha(false);
    }
  };

  const handleMudarClubeEmExibicao = (clube: any) => {
    setClubeAtualSelecionado(clube);
    setGrupoSelecionado(clube.grupo);
    setLojaSelecionada(clube.loja);
    setSaldoPoupanca(Number(clube.saldoPoupanca) || 0);
    setNivelVisao('dashboard');
  };

  // O painel sempre abre no Inicio, com todos os planos dela, e e dali que ela
  // entra no grupo que quiser. Antes, com um plano so, o painel abria direto
  // dentro dele - e a cliente que tinha acabado de entrar num segundo grupo
  // perdia de vista que tinha dois. O botao de pagar de cada plano ja fica no
  // topo do Inicio, entao pagar continua a um toque.
  //
  // A unica excecao e a primeira parcela em aberto: ai o pagamento abre
  // sozinho, pela regra de entrar e pagar na hora (efeito acima).
  const abriuGrupoDireto = useRef(false);

  // Variável que diz se o painel deve ser isolado
  const isClienteAmarrado = !!lojaBloqueadaId;

  const secoesDaCliente: ItemDeNavegacao[] = [
    { id: 'inicio',  rotulo: isClienteAmarrado ? 'Meus planos' : 'Rede de lojas', icone: isClienteAmarrado ? 'planos' : 'lojas' },
    { id: 'extrato', rotulo: 'Histórico',   icone: 'historico' },
    { id: 'regras',  rotulo: 'Regulamento', icone: 'regras' },
    { id: 'ajuda',   rotulo: 'Suporte',     icone: 'ajuda' },
  ];
  const perfilDaCliente: ItemDeNavegacao = { id: 'perfil', rotulo: 'Meu perfil', icone: 'perfil' };

  // Voltar para "início" tem que devolver a cliente ao nível certo: quem está
  // presa a uma loja não tem rede de lojas para ver, e cair na lista vazia
  // parecia que o plano dela tinha sumido.
  const irParaSecao = (id: string) => {
    setAbaAtiva(id as any);
    if (id === 'inicio') {
      setNivelVisao(isClienteAmarrado || lojaEmFoco ? 'grupos' : 'lojas');
    }
    setStatusSalvar(null);
    setStatusSalvarSenha(null);
  };

  // O voltar do navegador desfaz um passo da navegação, e não a visita inteira.
  // Quem entrava na loja, abria o plano e apertava voltar era jogada para fora
  // do painel - no celular, onde voltar é um gesto de borda usado o tempo todo,
  // isso acontecia sem querer várias vezes por visita.
  useHistoricoDoPainel(
    {
      aba: abaAtiva,
      nivel: nivelVisao,
      loja: lojaEmFoco?.id ?? null,
      cota: clubeAtualSelecionado?.cotaId ?? null,
    },
    (alvo) => {
      setAbaAtiva(alvo.aba as typeof abaAtiva);
      if (alvo.aba !== 'inicio') return;

      if (alvo.nivel === 'dashboard' && alvo.cota) {
        const clube = clubesAtivos.find((c: any) => c.cotaId === alvo.cota);
        if (clube) {
          handleMudarClubeEmExibicao(clube);
          return;
        }
      }

      if (alvo.nivel === 'grupos' && alvo.loja) {
        // A loja vem da lista já carregada; se ela ainda não chegou, a que
        // está em foco serve, porque é dela que a cliente acabou de sair.
        const loja = lojas.find((l: any) => l.id === alvo.loja)
          ?? (lojaEmFoco?.id === alvo.loja ? lojaEmFoco : null);
        if (loja) {
          entrarNaLoja(loja);
          return;
        }
      }

      setNivelVisao(isClienteAmarrado ? 'grupos' : 'lojas');
    },
    clubesCarregados && lojasCarregadas,
  );

  const primeiroNome = (usuario?.nome || '').trim().split(' ')[0];

  // O passo a passo do painel da cliente. Passo cujo elemento nao existe para
  // ela - quem ainda nao tem plano nao tem botao de pagar - e pulado.
  const passosDoTour: PassoDoTour[] = [
    {
      secao: 'inicio',
      titulo: primeiroNome ? `Olá, ${primeiroNome}! Este é o seu painel` : 'Este é o seu painel na AVLE',
      texto: 'Aqui você paga as parcelas, acompanha os seus planos e vê os sorteios. Leva menos de um minuto para conhecer.',
    },
    {
      alvo: 'navegacao',
      titulo: 'O menu',
      texto: 'Seus planos, o histórico do que você já pagou, o regulamento da loja e o suporte.',
    },
    {
      alvo: 'abas-planos',
      titulo: 'Seus planos e os grupos com vaga',
      texto: 'Em "Meus planos" ficam os grupos de que você participa. Em "Grupos disponíveis", os da loja que ainda têm vaga para entrar.',
    },
    {
      alvo: 'cartao-plano',
      titulo: 'O detalhe do plano',
      texto: 'Toque no plano para pagar a parcela do mês, que vence todo 5º dia útil, e ver quanto você já pagou, as parcelas e o sorteio.',
    },
    {
      alvo: 'secao-extrato',
      titulo: 'Histórico',
      texto: 'Todos os pagamentos que você já fez, com a data e o valor de cada um.',
    },
    {
      alvo: 'secao-regras',
      titulo: 'Regulamento',
      texto: 'As regras do clube de compras da sua loja, para consultar quando quiser.',
    },
    {
      alvo: 'secao-ajuda',
      titulo: 'Suporte',
      texto: 'Teve alguma dúvida ou problema com o pagamento? Fale com a AVLE por aqui.',
    },
    {
      alvo: 'secao-perfil',
      titulo: 'Meu perfil',
      texto: 'Seus dados, foto e senha. Mantenha o celular sempre certo: é por ele que a AVLE avisa da parcela.',
    },
    {
      secao: 'inicio',
      alvo: 'rever-tour',
      titulo: 'Pronto!',
      texto: 'Quando quiser ver este passo a passo de novo, é só tocar aqui.',
    },
  ];
  const tour = useTour({
    chave: `@avle:tour:cliente:v1:${usuario?.id}`,
    passos: passosDoTour,
    aoIrParaSecao: irParaSecao,
    pronto: !carregandoDados,
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-[#0B1E14] fundo-painel">

      <TrilhoDeNavegacao
        itens={secoesDaCliente}
        ativo={abaAtiva}
        aoEscolher={irParaSecao}
        aoSair={async () => { await encerrarSessao(); router.push('/'); }}
        itemDeConfiguracao={perfilDaCliente}
      />

      {/* `pb-28` no celular reserva a altura da barra de navegação fixa: sem
          isso ela cobria o botão de pagar, que é o fim de quase toda visita. */}
      <main className="flex-1 p-4 md:py-8 md:pr-8 md:pl-2 max-w-7xl overflow-x-hidden space-y-6 pb-28 md:pb-8">

        <CabecalhoDoPainel
          etiqueta={`AVLE · ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
          titulo={primeiroNome ? `Olá, ${primeiroNome}` : 'Meu painel'}
          acoes={
            <button
              type="button"
              data-tour="rever-tour"
              onClick={tour.abrir}
              aria-label="Rever o passo a passo"
              title="Rever o passo a passo"
              className="w-11 h-11 rounded-full bg-white border border-painel-borda text-painel-tinta flex items-center justify-center hover:border-painel-tinta/30 transition-colors cursor-pointer"
            >
              <Icone nome="ajuda" />
            </button>
          }
          identidade={
            <Identidade
              nome={usuario?.nome || 'Painel da cliente'}
              detalhe={usuario?.email}
              foto={fotoPerfil}
              aoClicar={() => irParaSecao('perfil')}
            />
          }
          pilulas={
            <PilulasDeSecao
              itens={secoesDaCliente}
              ativo={abaAtiva}
              aoEscolher={irParaSecao}
            />
          }
        />


        {abaAtiva === 'inicio' && (
          <div className="animate-fadeIn">

            {/* Ser sorteada e a coisa mais importante que acontece com a cliente,
                então o card vem antes de tudo na aba inicial. */}
            {cardsContemplacao.map((card) => (
              <div
                key={card.cotaId}
                className={`mb-6 rounded-2xl overflow-hidden shadow-lg border text-left ${
                  card.aguardandoEncerramento ? 'border-amber-200' : 'border-[#0B1E14]/10'
                }`}
              >
                <div className={`px-6 py-5 ${card.aguardandoEncerramento ? 'bg-amber-50' : 'bg-[#0B1E14]'}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${
                        card.aguardandoEncerramento ? 'text-amber-700' : 'text-[#BD6B42]'
                      }`}>
                        {card.aguardandoEncerramento ? 'Contemplação registrada' : 'Você foi contemplada'}
                      </span>
                      <h3 className={`text-lg font-bold tracking-tight ${
                        card.aguardandoEncerramento ? 'text-amber-900' : 'text-white'
                      }`}>
                        {card.grupoNome}
                      </h3>
                      {card.dataContemplacao && (
                        <p className={`text-[11px] mt-1 font-mono ${
                          card.aguardandoEncerramento ? 'text-amber-700/70' : 'text-stone-400'
                        }`}>
                          Sorteio de {new Date(card.dataContemplacao).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    {!card.aguardandoEncerramento && (
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-lg whitespace-nowrap">
                        Etapa {card.posicaoAtual} de {card.totalEtapas}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white px-6 py-5 space-y-5">
                  {/* Trilha das etapas */}
                  <div className="flex items-start gap-1 overflow-x-auto pb-1">
                    {card.trilha?.map((passo: EtapaTrilha, indice: number) => (
                      <div key={passo.etapa} className="flex-1 min-w-[86px]">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                            passo.concluida ? 'bg-emerald-600 text-white'
                              : passo.atual ? 'bg-[#BD6B42] text-white ring-4 ring-[#BD6B42]/15'
                              : 'bg-stone-200 text-stone-400'
                          }`}>
                            {passo.concluida ? '✓' : passo.posicao}
                          </div>
                          {indice < card.trilha.length - 1 && (
                            <div className={`h-0.5 flex-1 ${passo.concluida ? 'bg-emerald-600' : 'bg-stone-200'}`} />
                          )}
                        </div>
                        <p className={`text-[9px] mt-2 leading-tight pr-2 ${
                          passo.atual ? 'font-bold text-[#0B1E14]' : 'text-stone-400 font-medium'
                        }`}>
                          {passo.titulo}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    card.aguardandoEncerramento
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-[#F5F2EB] border-[#DFD9CE]'
                  }`}>
                    <p className="text-xs font-bold text-[#0B1E14] mb-1">{card.etapaTitulo}</p>
                    <p className="text-[11px] text-stone-500 leading-relaxed">{card.etapaDescricao}</p>

                    {card.aguardandoEncerramento && card.motivoReprovacaoCredito && (
                      <p className="text-[11px] text-amber-800 mt-2 leading-relaxed">
                        <strong>Motivo informado pela loja:</strong> {card.motivoReprovacaoCredito}
                      </p>
                    )}

                    {card.produtoEscolhido && (
                      <p className="text-[11px] text-stone-600 mt-2">
                        <strong>Produto escolhido:</strong> {card.produtoEscolhido}
                      </p>
                    )}
                  </div>

                  {card.acaoDoCliente === 'ESCOLHER_PRODUTO' && (
                    <button
                      type="button"
                      onClick={() => { setModalProduto({ aberto: true, cotaId: card.cotaId }); setProdutoEscolhido(''); }}
                      className="w-full py-3 bg-[#BD6B42] text-white font-bold rounded-full text-[11px] uppercase tracking-wider hover:bg-[#A95A33] transition-all cursor-pointer shadow-sm"
                    >
                      Escolher meu produto
                    </button>
                  )}

                  {/* O código de auditoria e o que permite conferir o sorteio por
                      fora do sistema, sem depender da palavra da loja. */}
                  {card.sorteio && (
                    <div className="border-t border-[#DFD9CE] pt-4 text-[10px] text-stone-400 leading-relaxed">
                      <p className="font-bold text-stone-500 uppercase tracking-wider mb-1">Comprovante do sorteio</p>
                      <p>
                        Código <span className="font-mono font-bold text-[#0B1E14]">{card.sorteio.codigoAuditoria}</span>
                        {card.sorteio.concursoLoteria && (
                          <> · apurado pelo concurso <strong>{card.sorteio.concursoLoteria}</strong> da Loteria Federal</>
                        )}
                        {card.sorteio.quantidadeParticipantes && (
                          <> · {card.sorteio.quantidadeParticipantes} participantes concorrendo</>
                        )}
                      </p>
                      <p className="mt-1">
                        O resultado foi definido por um número público, sorteado depois de a lista de participantes
                        ser fechada. Qualquer pessoa pode refazer a conta com este código.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {nivelVisao === 'lojas' && !isClienteAmarrado && (
              <div className="space-y-6 text-left">
                <div className="border-b border-[#DFD9CE] pb-5">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                    AVLE · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">Rede de lojas parceiras</h2>
                  <p className="text-xs text-stone-400 mt-1">Explore os estabelecimentos credenciados e acesse seus clubes de compras.</p>
                </div>

                {lojas.length === 0 && !erroConexao ? (
                  <div className="cartao-avle border-dashed p-8 text-center text-xs text-stone-400 font-medium">
                    Nenhuma loja parceira cadastrada na plataforma ainda.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {lojas.map(loja => {
                        const acesso = acessosLoja.find(a => a.lojaId === loja.id);
                        const statusAcesso = acesso ? acesso.status : 'NAO_SOLICITADO';

                        const cotasNestaLoja = clubesAtivos.filter(c => c.grupo?.loja?.id === loja.id || c.loja?.id === loja.id);
                        const quantidadeCotantes = cotasNestaLoja.length;

                        let corBorda = 'border-[#DFD9CE] hover:border-[#BD6B42]/50 hover:shadow-md bg-white';
                        let labelStatus = 'Ver estabelecimento';
                        let labelColor = 'text-stone-400';

                        if (statusAcesso === 'APROVADO' || statusAcesso === 'PENDENTE') {
                            corBorda = 'border-emerald-600 bg-emerald-50/20 shadow-sm';
                            labelStatus = quantidadeCotantes > 0 ? `${quantidadeCotantes} clube(s) ativo(s)` : 'Acesso liberado';
                            labelColor = 'text-emerald-700 font-bold';
                        } else if (statusAcesso === 'REJEITADO' || statusAcesso === 'BLOQUEADO') {
                            corBorda = 'border-rose-300 bg-rose-50/20 shadow-sm opacity-80';
                            labelStatus = 'Bloqueado';
                            labelColor = 'text-rose-600';
                        }

                        return (
                           <div
                             key={loja.id}
                             onClick={() => {
                               if (statusAcesso !== 'BLOQUEADO') {
                                 handleAbrirLoja(loja);
                               } else {
                                 mostrarAviso('Acesso restrito', 'O seu acesso a este estabelecimento está suspenso no momento. Entre em contato com a loja para mais informações.', true);
                               }
                             }}
                             className={`rounded-2xl p-5 cursor-pointer flex flex-col items-center justify-center text-center space-y-3 transition-all hover:-translate-y-1 hover:shadow-md border-t-2 border ${corBorda}`}
                           >
                             <div className="w-14 h-14 rounded-xl flex items-center justify-center font-serif font-bold text-xl bg-[#0B1E14] text-white shadow-sm">
                               {obterNomeLoja(loja).substring(0, 2).toUpperCase()}
                             </div>
                             <div className="w-full">
                               <h3 className="text-sm font-bold text-[#0B1E14] truncate w-full">{obterNomeLoja(loja)}</h3>
                               <span className={`inline-block mt-1.5 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${labelColor}`}>
                                 {labelStatus}
                               </span>
                             </div>
                           </div>
                        )
                    })}
                  </div>
                )}
              </div>
            )}

            {nivelVisao === 'grupos' && lojaEmFoco && (
              <div className="space-y-6 text-left animate-fadeIn">
                
                {/* O Botão some automaticamente se a loja for fechada via convite */}
                {!isClienteAmarrado && (
                  <button
                    onClick={() => setNivelVisao('lojas')}
                    className="text-[10px] font-bold text-stone-500 hover:text-[#0B1E14] uppercase tracking-wider flex items-center gap-2 transition-colors bg-white border border-[#E6E2D8] px-4 py-2 rounded-full cursor-pointer shadow-xs w-fit"
                  >
                    ← Voltar para a rede de lojas
                  </button>
                )}

                {/* So os grupos: a cliente veio pelo convite de uma loja e nao
                    precisa da vitrine dela. O regulamento e o WhatsApp da loja
                    ficam nas abas Regulamento e Suporte. */}
                {carregandoGrupos ? (
                   <div className="py-12 text-center text-xs font-bold text-stone-400 animate-pulse">Carregando os grupos da loja...</div>
                ) : erroGrupos ? (
                   <div className="cartao-avle p-8 text-center space-y-4">
                      <p className="text-[15px] text-[#0B1E14] font-semibold">Não conseguimos carregar os grupos agora</p>
                      <p className="text-[13px] text-stone-500 leading-relaxed">A loja tem grupos, mas a conexão falhou. Tente de novo em instantes.</p>
                      <button
                        type="button"
                        onClick={() => lojaEmFoco && buscarGruposDaLoja(lojaEmFoco.id)}
                        className="h-12 px-6 rounded-full bg-[#0B1E14] text-white text-[14px] font-semibold cursor-pointer"
                      >
                        Tentar de novo
                      </button>
                   </div>
                ) : (() => {
                   // Um grupo encerrado ou lotado sai da vitrine, mas continua visivel
                   // se a cliente ja tem cota nele: caso contrario ela perderia o acesso
                   // ao painel do próprio clube.
                   const temCota = (grupo: any) => clubesAtivos.some((c) => c.grupo?.id === grupo.id);

                   // Duas listas separadas: o que ela ja tem e o que ela pode
                   // entrar. Misturadas, o plano dela ficava perdido no meio de
                   // uma vitrine que so interessa a quem esta procurando grupo.
                   const meusGrupos = gruposDaLoja.filter(temCota);
                   const gruposParaEntrar = gruposDaLoja.filter((g) => !temCota(g) && grupoDisponivel(g));
                   const gruposVisiveis = [...meusGrupos, ...gruposParaEntrar];

                   const abaAtual = abaGrupos ?? (meusGrupos.length > 0 ? 'meus' : 'disponiveis');
                   const listaDaAba = abaAtual === 'meus' ? meusGrupos : gruposParaEntrar;
                   const minhaFila = filasEspera.find((f) => f.lojaId === lojaEmFoco?.id);

                   // A fila é por loja: vale tanto quando todos os grupos lotaram
                   // quanto para quem já tem um plano e quer outro, sem vaga.
                   const blocoDaFila = (
                      <>
                        {minhaFila ? (
                               <>
                                  <p className="text-xs text-stone-500 leading-relaxed max-w-md mx-auto">
                                     Você já está na fila de espera desta loja
                                     {typeof minhaFila.posicao === 'number' ? (
                                        <> na <strong className="text-[#0B1E14]">{minhaFila.posicao}ª posição</strong></>
                                     ) : null}
                                     . Assim que a loja abrir um novo grupo, ela convoca quem está esperando pela ordem de chegada.
                                  </p>
                                  <button
                                     onClick={() => handleSairDaFila(minhaFila.id)}
                                     disabled={processandoFila}
                                     className="text-[10px] font-bold text-stone-500 hover:text-rose-600 uppercase tracking-wider underline transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                     {processandoFila ? 'Processando...' : 'Sair da fila de espera'}
                                  </button>
                               </>
                            ) : (
                               <>
                                  <p className="text-xs text-stone-500 leading-relaxed max-w-md mx-auto">
                                     No momento não há cota disponível para entrar. Você pode entrar na fila de espera:
                                     assim que a loja abrir um novo grupo, você é chamada pela ordem de chegada.
                                  </p>
                                  <button
                                     onClick={handleEntrarNaFila}
                                     disabled={processandoFila}
                                     className="bg-[#0B1E14] text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-opacity-90 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                                  >
                                     {processandoFila ? 'Entrando...' : 'Entrar na fila de espera'}
                                  </button>
                               </>
                            )}
                      </>
                   );

                   if (gruposDaLoja.length === 0) {
                      return (
                         <div className="bg-stone-50 border border-dashed border-[#DFD9CE] rounded-2xl p-8 text-center text-xs text-stone-400 font-medium">
                            Este estabelecimento ainda não lançou nenhum grupo de compras na plataforma.
                         </div>
                      );
                   }

                   if (gruposVisiveis.length === 0) {
                      return (
                         <div className="cartao-avle p-8 text-center space-y-4">
                            <span className="inline-block text-[9px] font-black text-[#BD6B42] bg-[#F5F2EB] px-3 py-1 rounded-full uppercase tracking-widest border border-[#DFD9CE]">
                               Grupos preenchidos
                            </span>
                            <h3 className="text-base font-serif font-bold text-[#0B1E14]">
                               Todos os grupos desta loja já estão preenchidos
                            </h3>

                            {blocoDaFila}
                         </div>
                      );
                   }

                   return (
                   <div className="pt-2">
                   <div data-tour="abas-planos" className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-5 w-fit">
                      <button
                        type="button"
                        onClick={() => setAbaGrupos('meus')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          abaAtual === 'meus' ? 'bg-[#0B1E14] text-white shadow' : 'text-stone-500 hover:text-[#0B1E14]'
                        }`}
                      >
                        Meus planos{meusGrupos.length > 0 ? ` · ${meusGrupos.length}` : ''}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAbaGrupos('disponiveis')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          abaAtual === 'disponiveis' ? 'bg-[#0B1E14] text-white shadow' : 'text-stone-500 hover:text-[#0B1E14]'
                        }`}
                      >
                        Grupos disponíveis{gruposParaEntrar.length > 0 ? ` · ${gruposParaEntrar.length}` : ''}
                      </button>
                   </div>

                   {listaDaAba.length === 0 ? (
                      abaAtual === 'meus' ? (
                        <div className="bg-stone-50 border border-dashed border-[#DFD9CE] rounded-2xl p-8 text-center text-xs text-stone-400 font-medium">
                          Você ainda não participa de nenhum grupo desta loja. Veja os grupos disponíveis ao lado.
                        </div>
                      ) : (
                        <div className="cartao-avle p-8 text-center space-y-4">
                          <h3 className="text-base font-serif font-bold text-[#0B1E14]">Nenhum grupo com vaga aberta nesta loja no momento</h3>
                          {blocoDaFila}
                        </div>
                      )
                   ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {listaDaAba.slice().sort((a, b) => a.id - b.id).map((grupo, indiceDoGrupo) => {
                         const cotaExistente = clubesAtivos.find(c => c.grupo?.id === grupo.id);
                         const isAtivo = !!cotaExistente;
                         
                         return (
                            <button
                              type="button"
                              key={grupo.id}
                              data-tour={indiceDoGrupo === 0 ? 'cartao-plano' : undefined}
                              onClick={() => handleAbrirGrupo(grupo, cotaExistente)}
                              className={`text-left rounded-[24px] p-5 flex flex-col gap-4 min-h-[210px] transition-all cursor-pointer active:scale-[0.99] ${
                                 isAtivo
                                   ? 'bg-white ring-2 ring-[#BD6B42] shadow-sm'
                                   : 'bg-white ring-1 ring-[#E8E4DA] hover:ring-[#0B1E14]/25 hover:shadow-md'
                              }`}
                            >
                               {(() => {
                                  // O que a cliente precisa para decidir, na ordem em que
                                  // ela pergunta: quanto por mes, por quanto tempo, e se
                                  // ainda cabe gente. "Lote #12" nao respondia nada disso.
                                  const maximo = Number(grupo.quantidadeMaxCotas) || 0;
                                  const ocupadas = Number(grupo.cotasOcupadas) || 0;
                                  const vagas = Math.max(0, maximo - ocupadas);
                                  const pct = maximo > 0 ? Math.min(100, (ocupadas / maximo) * 100) : 0;
                                  const poucas = !isAtivo && maximo > 0 && vagas > 0 && vagas <= 3;
                                  const valor = Number(grupo.valorParcela) || 0;
                                  const dinheiro = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                  return (
                                    <>
                                      <div className="flex items-start justify-between gap-3">
                                        <h3 style={{ fontWeight: 600 }} className="text-[17px] text-[#0B1E14] leading-snug">{grupo.nome}</h3>
                                        <span className={`flex-shrink-0 h-7 px-3 rounded-full text-[11px] font-semibold flex items-center ${
                                          isAtivo ? 'bg-[#BD6B42] text-white' : poucas ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                                        }`}>
                                          {isAtivo ? 'Seu plano' : maximo > 0 ? (poucas ? `Últimas ${vagas} vagas` : `${vagas} vagas`) : 'Aberto'}
                                        </span>
                                      </div>

                                      <div>
                                        <span className="block text-[26px] font-semibold tracking-tight text-[#0B1E14] tabular-nums leading-none">{dinheiro(valor)}</span>
                                        <span className="block text-[13px] text-stone-500 mt-1.5">
                                          por mês · {grupo.duracaoMeses} {Number(grupo.duracaoMeses) === 1 ? 'mês' : 'meses'}
                                          {valor > 0 && Number(grupo.duracaoMeses) > 0 && <> · total {dinheiro(valor * Number(grupo.duracaoMeses))}</>}
                                        </span>
                                      </div>

                                      {maximo > 0 && (
                                        <div>
                                          <div className="h-1.5 rounded-full bg-[#F5F2EB] overflow-hidden">
                                            <div className="h-full rounded-full bg-[#0B1E14]" style={{ width: `${pct}%` }} />
                                          </div>
                                          <span className="block text-[11px] text-stone-400 mt-1.5">{ocupadas} de {maximo} participantes</span>
                                        </div>
                                      )}

                                      <span className={`mt-auto h-12 rounded-full text-[14px] font-semibold flex items-center justify-center transition-colors ${
                                        isAtivo ? 'bg-[#0B1E14] text-white' : 'bg-[#BD6B42] text-white'
                                      }`}>
                                        {isAtivo ? 'Ver meu plano' : 'Entrar no grupo'}
                                      </span>
                                    </>
                                  );
                               })()}
                            </button>
                         )
                      })}
                   </div>
                   )}
                   </div>
                   );
                })()}
              </div>
            )}

            {nivelVisao === 'dashboard' && clubeAtualSelecionado && (
              <div className="space-y-6 animate-fadeIn text-left">
                <button
                  onClick={() => setNivelVisao('grupos')}
                  className="text-[11px] font-bold text-stone-500 hover:text-[#0B1E14] uppercase tracking-wider flex items-center gap-1 transition-colors bg-white border border-[#E6E2D8] px-4 py-2 rounded-full cursor-pointer shadow-xs w-fit"
                >
                  ← Voltar para os clubes
                </button>

                <div className="border-b border-[#DFD9CE] pb-5">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                    {obterNomeLoja(lojaSelecionada)} · Cota <span className="font-mono">#{clubeAtualSelecionado?.cotaId}</span> · {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">{grupoSelecionado?.nome}</h2>
                  <span className="inline-block mt-1 text-[9px] font-black text-[#BD6B42] bg-[#F5F2EB] px-3 py-1 rounded-full uppercase tracking-widest border border-[#DFD9CE]">
                    Painel de acompanhamento
                  </span>
                </div>

                {etapaAtual === 4 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                    <span className="block text-[9px] font-black uppercase tracking-widest text-emerald-700 mb-1">
                      Plano quitado
                    </span>
                    <p className="text-xs text-emerald-800">
                      Não há parcela em aberto nesta cota. Nada a pagar por aqui.
                    </p>
                  </div>
                )}

                {/* ── Datas fixas ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`flex items-center justify-between px-5 py-3.5 rounded-xl border ${
                    diasRestantesVencimento <= 3
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-white border-[#E6E2D8]'
                  }`}>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Próximo vencimento</p>
                      <p className={`text-base font-black font-mono mt-0.5 ${diasRestantesVencimento <= 3 ? 'text-amber-700' : 'text-[#0B1E14]'}`}>
                        {dataVencimentoCota || '--/--'}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">5º dia útil do mês · feriados excluídos</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className={`text-2xl font-black font-mono ${diasRestantesVencimento <= 3 ? 'text-amber-600' : 'text-[#BD6B42]'}`}>
                        {diasRestantesVencimento}d
                      </span>
                      <p className="text-[9px] text-stone-400 uppercase tracking-wider">restantes</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3.5 rounded-xl border bg-white border-[#E6E2D8]">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Próximo sorteio</p>
                      <p className="text-base font-black font-mono mt-0.5 text-[#0B1E14]">
                        {formatarData(proximoSorteio())}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">dia 10 de cada mês · Loteria Federal</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className="text-2xl font-black font-mono text-emerald-600">
                        {diasAte(proximoSorteio())}d
                      </span>
                      <p className="text-[9px] text-stone-400 uppercase tracking-wider">restantes</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="cartao-avle-destaque p-5 relative overflow-hidden">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-3">Saldo de poupança</span>
                    <span className="text-3xl font-bold tracking-tight block font-mono leading-none">R$ {(saldoPoupanca).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-[10px] text-stone-500 mt-2 block">acumulado na cota</span>
                  </div>
                  <div className="cartao-avle border-t-2 border-t-[#0B1E14] p-5 flex flex-col">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-3">Vigência do plano</span>
                    <span className="text-3xl font-bold text-[#0B1E14] font-mono leading-none">{grupoSelecionado?.duracaoMeses || 0}</span>
                    <span className="text-[10px] text-stone-400 mt-2">meses de sorteios</span>
                  </div>
                  <div className={`p-5 rounded-xl shadow-sm flex flex-col border-t-2 ${
                    etapaAtual >= 3 ? 'bg-emerald-50 border border-emerald-200 border-t-emerald-500' : 'bg-white border border-[#E6E2D8] border-t-[#0B1E14]'
                  }`}>
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-3">Fase do contrato</span>
                    <span className={`text-3xl font-bold font-mono leading-none ${etapaAtual >= 3 ? 'text-emerald-600' : 'text-[#0B1E14]'}`}>
                      0{etapaAtual}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-2">aptidão coletiva</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="cartao-avle lg:col-span-2 p-5 flex flex-col justify-between min-h-[260px]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Histórico de quitação da cota</span>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-bold font-mono">Evolução</span>
                    </div>
                    <div className="flex items-end justify-between h-40 pt-4 border-b border-stone-100 px-2">
                      {['Mês 1', 'Mês 2', 'Mês 3', 'Mês 4', 'Mês 5', 'Mês 6', 'Mês 7'].map((mes, i) => {
                        const parcelaQuitada = saldoPoupanca >= (valorMensalidade * (i + 1));
                        return (
                          <div key={i} className="flex flex-col items-center w-full max-w-[40px]">
                            <span className="text-[8px] font-mono text-stone-400 mb-1">R$ {parcelaQuitada ? valorMensalidade : 0}</span>
                            <div className={`w-full rounded-t-sm transition-all ${parcelaQuitada ? 'bg-[#0B1E14] h-24' : 'bg-stone-100 h-2'}`}></div>
                            <span className="text-[10px] text-stone-400 font-bold mt-2 whitespace-nowrap">{mes}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="cartao-avle p-5 flex flex-col items-center justify-between min-h-[260px]">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block w-full text-left">Progresso do objetivo</span>
                    <div className="relative w-32 h-32 flex items-center justify-center my-auto">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E6E2D8" strokeWidth="4" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#BD6B42" strokeWidth="4" strokeDasharray={`${percentual} ${100 - percentual}`} strokeDashoffset="0" className="transition-all duration-500" />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-xl font-bold tracking-tight font-mono text-[#0B1E14]">{percentual}%</span>
                        <span className="block text-[8px] uppercase text-stone-400 font-bold tracking-wider">Concluído</span>
                      </div>
                    </div>
                    <div className="w-full text-center border-t border-stone-50 pt-3 text-[11px] font-semibold text-stone-500">
                      Meta coletiva do círculo: <span className="font-mono text-[#0B1E14] font-bold">R$ {(totalObjetivo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="cartao-avle overflow-hidden">
                  <div className="px-5 py-4 border-b bg-stone-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1E14]">Régua de vencimentos e aportes efetuados</h3>
                    {etapaAtual !== 4 && (
                      <button
                        onClick={() => setModalCheckoutAberto(true)}
                        className="bg-[#0B1E14] text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-opacity-90 cursor-pointer shadow-xs"
                      >
                        Pagar parcela
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[420px]">
                    <thead>
                      <tr className="bg-stone-50 text-stone-400 font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                        <th className="py-3.5 px-5">CICLO</th>
                        <th className="py-3.5 px-5">DESCRIÇÃO</th>
                        <th className="py-3.5 px-5 text-right">VALOR REQUERIDO</th>
                        <th className="py-3.5 px-5 text-center">SITUAÇÃO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                      {saldoPoupanca === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-stone-400 italic font-medium">Nenhum aporte financeiro registrado nesta cota contratual ainda.</td></tr>
                      ) : (
                        Array.from({ length: Math.ceil(saldoPoupanca / valorMensalidade) }).map((_, index) => (
                          <tr key={index} className="hover:bg-stone-50/50 transition-all">
                            <td className="py-3.5 px-5 text-stone-400">Parcela 0{index + 1}</td>
                            <td className="py-3.5 px-5 text-[#0B1E14] font-bold">Aporte mensal coletivo</td>
                            <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-700">R$ {(valorMensalidade).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-3.5 px-5 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[9px] uppercase tracking-wider">
                                Liquidado
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

          </div>
        )}

        {abaAtiva === 'extrato' && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div>
              <h2 className="text-xl font-bold text-[#0B1E14]">Histórico financeiro consolidado</h2>
              <p className="text-xs text-stone-400 mt-1">Extrato detalhado de cada aporte e parcela liquidada em todas as suas unidades ativas.</p>
            </div>
            <div className="cartao-avle overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[520px]">
                <thead>
                  <tr className="bg-stone-50 text-stone-400 font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                    <th className="py-3.5 px-5">LOJA PARCEIRA</th>
                    <th className="py-3.5 px-5">PLANO / IDENTIFICAÇÃO</th>
                    <th className="py-3.5 px-5 text-right">VOLUME APORTADO</th>
                    <th className="py-3.5 px-5 text-center">STATUS DIGITAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                  {clubesAtivos.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-stone-400 italic">Nenhuma cota vinculada a esta conta ainda.</td></tr>
                  ) : (
                    clubesAtivos.flatMap((clube) => {
                      const vMensalidade = Number(clube.grupo.valorParcela) || 0;
                      const sPoupanca = Number(clube.saldoPoupanca) || 0;
                      const parcelasPagas = vMensalidade > 0 ? Math.ceil(sPoupanca / vMensalidade) : 0;

                      if (parcelasPagas === 0) return [];

                      return Array.from({ length: parcelasPagas }).map((_, index) => ({
                        lojaNome: obterNomeLoja(clube.loja),
                        grupoNome: clube.grupo.nome,
                        cotaId: clube.cotaId,
                        parcela: index + 1,
                        valor: vMensalidade,
                      }));
                    }).map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50 transition-all">
                        <td className="py-3.5 px-5 text-[#0B1E14] font-bold">{item.lojaNome}</td>
                        <td className="py-3.5 px-5 text-stone-500">{item.grupoNome} (parcela #0{item.parcela})</td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-700">R$ {(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3.5 px-5 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[9px] uppercase">
                            Liquidado
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

        {abaAtiva === 'regras' && (
          <div className="cartao-avle p-6 space-y-4 text-xs text-stone-600 leading-relaxed animate-fadeIn text-left max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-[#0B1E14] font-serif uppercase tracking-wide">Regulamento AVLE</h3>
              <p className="text-stone-400 mt-1">Confira as diretrizes da comunidade estruturada de compras programadas de móveis e decorações.</p>
            </div>

            <p className="bg-stone-50 p-3 rounded-xl border border-dashed text-stone-500">
              Compra Planejada: A AVLE não atua como consórcio tradicional ou fundo financeiro. Trata-se de uma comunidade estruturada de compras programadas de móveis e decorações corporativas ou residenciais.
            </p>

            {(lojaSelecionada || lojaEmFoco) ? (
              <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-[#0B1E14] uppercase text-[11px]">Termos específicos da unidade</h4>
                  <p className="text-stone-400 text-[10px] mt-0.5">Regulamento de termos contratuais enviado por: <strong>{obterNomeLoja(lojaSelecionada || lojaEmFoco)}</strong></p>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(`${API_URL}/api/lojas/${(lojaSelecionada || lojaEmFoco).id}/regras`, '_blank')}
                  className="px-4 py-2.5 bg-[#0B1E14] text-white font-bold rounded-full text-[10px] uppercase tracking-wider hover:bg-opacity-90 cursor-pointer transition-all"
                >
                  Visualizar contrato em PDF
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-stone-400 italic pt-2">
                Acesse um dos seus clubes ativos ou visualize as lojas na aba inicial para habilitar a visualização do documento de termos específicos em PDF.
              </p>
            )}
          </div>
        )}

        {abaAtiva === 'perfil' && (
          <div className="space-y-6 max-w-2xl text-left animate-fadeIn">
            <div className="cartao-avle p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Meus dados cadastrais</h2>
                <p className="text-xs text-stone-400 mt-1">Gerencie suas informações de conta salvas na plataforma e sincronizadas com o gateway do Asaas.</p>
              </div>

              <div className="flex items-center space-x-4 border-b border-stone-100 pb-5">
                <div className="relative group w-20 h-20 rounded-full overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center flex-shrink-0 shadow-xs">
                  {fotoPerfil ? (
                    <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-stone-400 font-mono">
                      {nomeInput ? nomeInput.substring(0,2).toUpperCase() : 'AV'}
                    </span>
                  )}
                  <label htmlFor="perfil-foto-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[9px] font-bold uppercase tracking-wider text-center p-1">
                    Alterar
                  </label>
                  <input id="perfil-foto-upload" type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-stone-500">Foto de perfil</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">Selecione uma imagem quadrada de até 2 MB nos formatos comuns de imagem.</p>
                </div>
              </div>

              <form onSubmit={handleSalvarPerfil} className="space-y-5 text-xs">
                {statusSalvar === 'sucesso' && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl">
                    Alterações gravadas com sucesso no sistema!
                  </div>
                )}
                {statusSalvar === 'erro' && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 font-bold rounded-xl">
                    Não foi possível salvar as alterações. Tente novamente mais tarde.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">Nome completo</label>
                    <input
                      type="text"
                      value={nomeInput}
                      onChange={(e) => setNomeInput(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-stone-50 h-[42px] text-sm font-medium focus:outline-none focus:border-[#BD6B42] transition-colors"
                      required
                      disabled={carregandoDados || salvandoPerfil}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">E-mail de notificação</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-stone-50 h-[42px] text-sm font-medium focus:outline-none focus:border-[#BD6B42] transition-colors"
                      required
                      disabled={carregandoDados || salvandoPerfil}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">Telefone / celular</label>
                    <input
                      type="text"
                      value={telefoneInput}
                      onChange={(e) => setTelefoneInput(aplicarMascaraTelefone(e.target.value))}
                      placeholder="(45) 99999-9999"
                      className="w-full px-3 py-2 border rounded-xl bg-stone-50 h-[42px] text-sm font-medium focus:outline-none focus:border-[#BD6B42] transition-colors"
                      required
                      disabled={carregandoDados || salvandoPerfil}
                    />
                  </div>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-dashed border-stone-200 space-y-2 max-w-sm">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                    <span>CPF / CNPJ do titular</span>
                    <span className="text-xs text-[#0B1E14]" title="Informação imutável por segurança contratual">Protegido</span>
                  </label>
                  <input
                    type="text"
                    value={carregandoDados ? "Aguardando carregamento do perfil..." : (cpfInput || "Sem documento cadastrado")}
                    disabled
                    placeholder="Aguardando carregamento do perfil..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-100 text-stone-500 h-[40px] text-sm font-mono cursor-not-allowed font-bold"
                  />
                  <p className="text-[10px] text-stone-400 leading-relaxed pt-1">
                    Este documento está atrelado às faturas e regras de sorteio coletivo. Alterações cadastrais exigem auditoria direta com o administrador.
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    type="submit"
                    disabled={carregandoDados || salvandoPerfil}
                    className="px-6 py-3 bg-[#0B1E14] text-white font-bold rounded-full shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-opacity-90 disabled:opacity-50 transition-all"
                  >
                    {salvandoPerfil ? 'Salvando...' : 'Salvar novas informações'}
                  </button>
                </div>
              </form>
            </div>

            <div className="cartao-avle p-6 md:p-8 space-y-5">
              <div>
                <h3 className="text-base font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Segurança da conta e alteração de senha</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Se você utilizou uma senha temporária/padrão fornecida pelo estabelecimento no seu primeiro cadastro, atualize-a abaixo por uma senha pessoal.
                </p>
              </div>

              <form onSubmit={handleAlterarSenha} className="space-y-4 text-xs">
                {statusSalvarSenha?.tipo === 'sucesso' && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl">
                    {statusSalvarSenha.mensagem}
                  </div>
                )}
                {statusSalvarSenha?.tipo === 'erro' && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 font-bold rounded-xl">
                    {statusSalvarSenha.mensagem}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">Senha atual (ou senha padrão inicial)</label>
                  <input
                    type="password"
                    placeholder={`Digite sua senha atual ou ${SENHA_PADRAO_INICIAL}`}
                    value={senhaAtualInput}
                    onChange={(e) => setSenhaAtualInput(e.target.value)}
                    className="w-full max-w-md px-3 py-2 border rounded-xl bg-stone-50 h-[42px] text-sm font-medium focus:outline-none focus:border-[#BD6B42] transition-colors"
                    required
                    disabled={salvandoSenha}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">Nova senha</label>
                    <input
                      type="password"
                      placeholder="Mínimo de 6 caracteres"
                      value={novaSenhaInput}
                      onChange={(e) => setNovaSenhaInput(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-stone-50 h-[42px] text-sm font-medium focus:outline-none focus:border-[#BD6B42] transition-colors"
                      required
                      disabled={salvandoSenha}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">Confirmar nova senha</label>
                    <input
                      type="password"
                      placeholder="Repita a nova senha"
                      value={confirmarNovaSenhaInput}
                      onChange={(e) => setConfirmarNovaSenhaInput(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-stone-50 h-[42px] text-sm font-medium focus:outline-none focus:border-[#BD6B42] transition-colors"
                      required
                      disabled={salvandoSenha}
                    />
                  </div>
                </div>

                <div className="flex justify-start pt-2 border-t border-stone-100">
                  <button
                    type="submit"
                    disabled={salvandoSenha}
                    className="px-6 py-3 bg-[#BD6B42] text-white font-bold rounded-full shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-[#A95A33] disabled:opacity-50 transition-all"
                  >
                    {salvandoSenha ? 'Processando...' : 'Atualizar minha senha'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {abaAtiva === 'ajuda' && (
          <div className="cartao-avle p-6 space-y-6 animate-fadeIn text-left max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-[#0B1E14] font-serif uppercase tracking-wide">Central de atendimento e suporte</h3>
              <p className="text-stone-400 mt-1">Escolha o canal de atendimento ideal para resolver a sua dúvida ou problema rapidamente.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#0B1E14]/10 text-[#0B1E14] uppercase">Suporte do site</span>
                  <h4 className="font-bold text-[#0B1E14] text-xs mt-2 uppercase">Atendimento técnico</h4>
                  <p className="text-stone-400 text-[11px] mt-1 leading-relaxed">Para dúvidas sobre acesso à conta, faturas Pix, dificuldades de navegação, atualização de dados pessoais ou instabilidades no sistema.</p>
                </div>
                <div className="pt-2 border-t border-stone-200/60">
                  <p className="text-stone-500 font-bold text-xs font-mono mb-2">(42) 98411-7768</p>
                  <button
                    type="button"
                    onClick={() => window.open('https://wa.me/5542984117768', '_blank')}
                    className="w-full text-center py-2.5 bg-[#0B1E14] text-white font-bold rounded-lg text-[10px] uppercase tracking-wider hover:bg-opacity-90 transition-all cursor-pointer"
                  >
                    Chamar suporte técnico
                  </button>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
                {lojaSelecionada || lojaEmFoco ? (
                  <>
                    <div>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#BD6B42]/10 text-[#BD6B42] uppercase">Suporte da loja</span>
                      <h4 className="font-bold text-[#0B1E14] text-xs mt-2 uppercase truncate max-w-[180px]">{obterNomeLoja(lojaSelecionada || lojaEmFoco)}</h4>
                      <p className="text-stone-400 text-[11px] mt-1 leading-relaxed">Para tratar diretamente sobre especificações de produtos, datas de assembleias locais, andamento de entregas ou retiradas de mercadorias.</p>
                    </div>
                    <div className="pt-2 border-t border-stone-200/60">
                      <p className="text-stone-500 font-bold text-xs font-mono mb-2">
                        {(lojaSelecionada || lojaEmFoco).telefone ? aplicarMascaraTelefone((lojaSelecionada || lojaEmFoco).telefone) : 'Contato no estabelecimento'}
                      </p>
                      <button
                        type="button"
                        disabled={!(lojaSelecionada || lojaEmFoco).telefone}
                        onClick={() => {
                          if ((lojaSelecionada || lojaEmFoco).telefone) {
                            window.open(`https://wa.me/55${(lojaSelecionada || lojaEmFoco).telefone.replace(/\D/g, '')}`, '_blank');
                          }
                        }}
                        className="w-full text-center py-2.5 bg-[#BD6B42] text-white font-bold rounded-lg text-[10px] uppercase tracking-wider hover:bg-opacity-90 transition-all cursor-pointer disabled:opacity-40"
                      >
                        {(lojaSelecionada || lojaEmFoco).telefone ? 'Falar com o atendimento' : 'Telefone não cadastrado'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-center p-4">
                    <p className="text-[11px] text-stone-400 font-medium italic leading-relaxed">Acesse um de seus clubes ou selecione uma loja na página inicial para visualizar as opções de contato direto.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {modalAdesao.aberto && modalAdesao.grupo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] animate-fadeIn text-left">
            <div className="cartao-avle w-full max-w-md shadow-2xl overflow-hidden">
                <div className="bg-[#0B1E14] p-5 text-white">
                    <h3 className="font-serif font-bold text-lg uppercase tracking-wide">Confirmar participação</h3>
                    <p className="text-[10px] text-stone-300 mt-1">Revise os detalhes contratuais da cota antes de prosseguir.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Clube vinculado</span>
                            <span className="text-xs font-bold text-[#0B1E14]">{modalAdesao.grupo.nome}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Valor da mensalidade</span>
                            <span className="text-xs font-bold font-mono text-[#BD6B42]">R$ {(Number(modalAdesao.grupo.valorParcela)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Duração do contrato</span>
                            <span className="text-xs font-bold text-[#0B1E14]">{modalAdesao.grupo.duracaoMeses} meses</span>
                        </div>
                    </div>

                    {/* O pagamento vem logo depois, sem saída: ela precisa saber
                        disso aqui, antes de confirmar, e não descobrir na tela seguinte. */}
                    <div className="rounded-xl bg-painel-tinta text-white p-4">
                        <p className="text-[12px] font-semibold">
                            Ao confirmar, você entra no grupo e paga agora a 1ª parcela de{' '}
                            R$ {(Number(modalAdesao.grupo.valorParcela)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
                        </p>
                        <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                            O seu painel do grupo libera assim que o pagamento for confirmado.
                        </p>
                    </div>

                    <div className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        <span className="text-blue-500 mt-0.5 text-xs font-bold">INFO</span>
                        <p className="text-[10px] text-stone-600 leading-relaxed">
                            Antes de confirmar a sua participação, é obrigatória a leitura do{' '}
                            <button onClick={() => window.open(`${API_URL}/api/lojas/${lojaEmFoco?.id}/regras`, '_blank')} className="text-blue-600 font-bold underline cursor-pointer">regulamento operacional da loja</button>. Ao entrar no grupo, você concorda legalmente com todos os termos estabelecidos pelo estabelecimento.
                        </p>
                    </div>
                </div>
                <div className="p-5 border-t border-stone-100 bg-stone-50 flex gap-3">
                    <button onClick={() => setModalAdesao({ aberto: false, grupo: null })} disabled={entrandoNoGrupo} className="flex-1 py-3 border border-stone-200 text-stone-500 font-bold rounded-full text-[10px] uppercase hover:bg-stone-100 transition-colors cursor-pointer">Cancelar</button>
                    <button onClick={confirmarAdesaoNoGrupo} disabled={entrandoNoGrupo} className="flex-1 py-3 bg-[#0B1E14] text-white font-bold rounded-full shadow-sm text-[10px] uppercase hover:bg-opacity-90 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait">{entrandoNoGrupo ? 'Entrando…' : 'Entrar e pagar a 1ª parcela'}</button>
                </div>
            </div>
        </div>
      )}

      {modalAcessoAberto && lojaParaAcesso && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-fadeIn text-left">
          <div className="cartao-avle w-full max-w-md p-6 space-y-5 shadow-xl">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Autorização de acesso</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Estabelecimento: {obterNomeLoja(lojaParaAcesso)}</p>
              </div>
              <button onClick={() => setModalAcessoAberto(false)} className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer px-2">X</button>
            </div>
            
            <div className="text-xs text-stone-600 leading-relaxed space-y-4">
                <p>Para visualizar os planos disponíveis e registrar cotas na <strong>{obterNomeLoja(lojaParaAcesso)}</strong>, o estabelecimento exige uma análise de crédito prévia do seu CPF.</p>
                
                <div className="bg-stone-50 border border-dashed border-stone-300 p-4 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Dados enviados para consulta:</p>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-[#0B1E14]">{usuario?.nome}</span>
                        <span className="font-mono font-bold text-[#0B1E14]">{usuario?.cpf ? aplicarMascaraCpfCnpj(usuario.cpf) : 'Não informado'}</span>
                    </div>
                </div>

                <p className="text-[11px] text-stone-500 italic">Ao confirmar, a loja receberá seus dados para consulta junto aos órgãos de proteção ao crédito (SPC/Serasa). Assim que aprovado, o catálogo será liberado.</p>
            </div>

            <div className="flex space-x-3 pt-3 border-t border-stone-100 w-full">
              <button 
                type="button" 
                onClick={() => setModalAcessoAberto(false)} 
                className="flex-1 py-3 border border-[#DFD9CE] rounded-full text-stone-500 font-bold hover:bg-stone-50 transition-colors cursor-pointer text-xs uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSolicitarAcesso}
                disabled={solicitandoAcesso}
                className="flex-1 py-3 bg-[#0B1E14] text-white font-bold rounded-full shadow-sm text-xs uppercase tracking-wider cursor-pointer hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                {solicitandoAcesso ? 'Enviando...' : 'Solicitar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalProduto.aberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="cartao-avle w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Escolha do produto</h3>
              <button
                type="button"
                onClick={() => setModalProduto({ aberto: false, cotaId: null })}
                className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer"
              >
                X
              </button>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed bg-stone-50 p-3 rounded-xl border border-dashed">
              Informe o produto que deseja retirar. A loja confere a disponibilidade antes de separar o pedido.
            </p>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">Produto desejado</label>
              <input
                type="text"
                value={produtoEscolhido}
                onChange={(e) => setProdutoEscolhido(e.target.value)}
                placeholder="Ex.: Geladeira Frost Free 400L"
                className="w-full h-[42px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm focus:outline-none focus:border-[#BD6B42]"
              />
            </div>

            <div className="flex space-x-2 pt-2 border-t w-full">
              <button
                type="button"
                onClick={() => setModalProduto({ aberto: false, cotaId: null })}
                className="flex-1 py-2.5 border rounded-full text-stone-500 font-bold text-xs transition-colors hover:bg-stone-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarProduto}
                disabled={salvandoEtapa || produtoEscolhido.trim() === ''}
                className="flex-1 py-2.5 bg-[#BD6B42] text-white font-bold rounded-full shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-[#A95A33] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvandoEtapa ? 'Salvando...' : 'Confirmar escolha'}
              </button>
            </div>
          </div>
        </div>
      )}


      {notificacao.aberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[90] text-left animate-fadeIn">
          <div className="cartao-avle w-full max-w-md p-6 space-y-4 shadow-2xl border-t-4" style={{ borderTopColor: notificacao.isError ? '#be123c' : '#047857' }}>
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

      {modalCheckoutAberto && (() => {
        // Entrada no grupo: o checkout não tem X nem fecha por fora. A vaga já
        // é dela, mas a primeira parcela sai agora - é o que tira da loja a
        // cobrança manual de quem acabou de entrar.
        const obrigatorio = cotaAguardandoPrimeiraParcela != null;
        return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-left overflow-y-auto">
          <div className="cartao-avle w-full max-w-md p-6 space-y-4 shadow-xl my-auto">
            <div className="flex justify-between items-start border-b pb-3 gap-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">
                  {obrigatorio ? 'Primeira parcela do seu plano' : 'Ambiente de checkout seguro'}
                </h3>
                {obrigatorio && (
                  <p className="text-[11px] text-stone-500 leading-relaxed mt-1">
                    A sua vaga em <strong>{grupoSelecionado?.nome || 'seu clube'}</strong> está
                    registrada. Conclua o pagamento para começar a valer.
                  </p>
                )}
              </div>
              {!obrigatorio && (
                <button onClick={() => setModalCheckoutAberto(false)} className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer">X</button>
              )}
            </div>
            <CheckoutForm
              valorMensalidade={valorMensalidade}
              valorTotalRestante={totalObjetivo - saldoPoupanca}
              cotaId={clubeAtualSelecionado?.cotaId || clubeAtualSelecionado?.id || clubeAtualSelecionado?.numeroCota}
              onSuccess={atualizarSaldoAposPagamento}
              fecharModal={() => setModalCheckoutAberto(false)}
              obrigatorio={obrigatorio}
            />
            {obrigatorio && (
              <div className="pt-3 border-t border-stone-100 text-center space-y-2">
                <button
                  type="button"
                  onClick={() => conferirPagamentoNoAsaas(cotaAguardandoPrimeiraParcela)}
                  className="text-[10px] font-bold text-[#0B1E14] uppercase tracking-wider hover:underline cursor-pointer"
                >
                  Já paguei · conferir agora
                </button>
                {/* Saída honesta: sem ela, quem não vai pagar hoje ficaria
                    presa na tela sem nem conseguir sair da conta. */}
                <button
                  type="button"
                  onClick={async () => { await encerrarSessao(); router.push('/'); }}
                  className="block w-full text-[10px] font-bold text-stone-400 uppercase tracking-wider hover:text-stone-600 cursor-pointer"
                >
                  Sair da conta e pagar depois
                </button>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {tour.elemento}
    </div>
  );
}

function CheckoutForm({ 
  valorMensalidade, 
  valorTotalRestante, 
  cotaId, 
  onSuccess, 
  fecharModal,
  obrigatorio = false,
}: { 
  valorMensalidade: number; 
  valorTotalRestante: number; 
  cotaId: number; 
  onSuccess: () => Promise<void> | void; 
  fecharModal: () => void;
  /**
   * Pagamento da entrada no grupo, que não pode ser adiado fechando a tela.
   * Sem isto o checkout oferece "Fechar" em todo lugar, e fechar aqui
   * significaria ficar no grupo sem ter pago nada.
   */
  obrigatorio?: boolean;
}) {
  const [metodo, setMetodo] = useState<'pix' | 'credito_total' | 'debito'>('pix');
  // O QR e o copia e cola vem junto da cobranca. Mostrar aqui dentro evita
  // mandar a cliente para uma pagina de fora so para ler um codigo que ja
  // temos - e e o que faz este checkout ser nosso, e nao um redirecionamento.
  const [dadosPix, setDadosPix] = useState<{
    paymentUrl?: string;
    payload?: string;
    encodedImage?: string;
  } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);
  const [carregandoPix, setCarregandoPix] = useState(false);
  // Contador de tentativas de gerar o Pix. Quando o pagamento e obrigatorio
  // nao da para mandar a pessoa fechar e voltar depois: a saida dela dali e
  // pedir a cobranca de novo.
  const [tentativaDePix, setTentativaDePix] = useState(0);

  const [numeroCartao, setNumeroCartao] = useState('');
  const [nomeImpresso, setNomeImpresso] = useState('');
  const [validade, setValidade] = useState('');
  const [ccv, setCcv] = useState('');
  // O Asaas confere o endereco do titular com a operadora. Antes o backend
  // mandava um CEP fixo para todo mundo, e a transacao era recusada.
  const [cep, setCep] = useState('');
  const [numeroEndereco, setNumeroEndereco] = useState('');
  const [complemento, setComplemento] = useState('');
  const [processando, setProcessando] = useState(false);
  const [mensagemCartao, setMensagemCartao] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const valorCobrado = metodo === 'credito_total' ? valorTotalRestante : valorMensalidade;

  useEffect(() => {
    if (!cotaId || metodo !== 'pix') return;
    setCarregandoPix(true);
    apiFetch(`${API_URL}/api/pagamentos/gerar-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor: valorCobrado, cotaId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setDadosPix(data))
      .catch(() => {})
      .finally(() => setCarregandoPix(false));
  }, [valorCobrado, cotaId, metodo, tentativaDePix]);

  const handlePagamentoCartao = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessando(true);
    setMensagemCartao(null);

    const mesAno = validade.split('/');
    if (mesAno.length !== 2 || mesAno[0].length !== 2 || mesAno[1].length !== 2) {
      setMensagemCartao({ tipo: 'erro', texto: 'Data de validade inválida. Use o formato MM/AA.' });
      setProcessando(false);
      return;
    }

    // Sempre cobranca avulsa. A assinatura do Asaas saiu daqui porque ela
    // cobra em dia fixo do mes - o dia em que a cliente assinou - e o contrato
    // promete o quinto dia util. Quem cuida da recorrencia agora e o lote
    // mensal, sem a cliente precisar assinar nada.
    const endpoint = '/api/pagamentos/cartao-unico';
    const tipoCobranca = metodo === 'credito_total' ? 'CREDIT_CARD' : 'DEBIT_CARD';

    const payload = {
      cotaId,
      valor: valorCobrado,
      tipoCobranca,
      numeroCartao: numeroCartao.replace(/\D/g, ''),
      nomeImpressoCartao: nomeImpresso.toUpperCase(),
      mesValidade: mesAno[0],
      anoValidade: '20' + mesAno[1],
      ccv: ccv.replace(/\D/g, ''),
      cep: cep.replace(/\D/g, ''),
      numeroEndereco,
      complemento
    };

    try {
      const res = await apiFetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const erroMsg = await res.text();
        throw new Error(erroMsg || 'Falha ao processar o cartão.');
      }

      setMensagemCartao({
        tipo: 'sucesso',
        texto: 'Cobrança enviada ao banco. O saldo atualiza assim que ele confirmar.',
      });
      setAguardandoConfirmacao(true);
      onSuccess();
    } catch (err: any) {
      setMensagemCartao({ tipo: 'erro', texto: err.message });
    } finally {
      setProcessando(false);
    }
  };

  const mascaraValidade = (val: string) => {
    const v = val.replace(/\D/g, '');
    if (v.length >= 3) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  // A tela de espera toma o lugar do formulario depois que a cobranca sai. Ela
  // e o unico lugar honesto para dizer o que aconteceu: a cobranca existe, o
  // pagamento ainda nao foi confirmado, e o saldo so muda quando for.
  if (aguardandoConfirmacao) {
    return (
      <div className="space-y-5 text-[#0B1E14] text-center py-4">
        <div>
          <span className="inline-block text-[9px] font-black text-[#BD6B42] bg-[#F5F2EB] px-3 py-1 rounded-full uppercase tracking-widest border border-[#DFD9CE]">
            Aguardando confirmação
          </span>
          <h4 className="text-sm font-bold mt-3">A sua cobrança foi gerada</h4>
          <p className="text-xs text-stone-500 leading-relaxed mt-2 max-w-xs mx-auto">
            Assim que o banco confirmar o pagamento, o valor entra no seu saldo automaticamente.
            No Pix isso costuma levar poucos minutos.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={async () => {
              await onSuccess();
              // Na entrada do grupo quem fecha e a confirmacao do pagamento,
              // nao este botao: fechar aqui deixaria a cota sem a primeira
              // parcela, que e o caso que esta tela existe para impedir.
              if (!obrigatorio) fecharModal();
            }}
            className="w-full py-3.5 bg-[#0B1E14] text-white font-bold text-[10px] rounded-full uppercase tracking-wider cursor-pointer"
          >
            Já paguei · conferir meu saldo
          </button>
          {!obrigatorio && (
            <button
              type="button"
              onClick={fecharModal}
              className="w-full py-3 border border-[#DFD9CE] text-stone-500 font-bold text-[10px] rounded-full uppercase tracking-wider cursor-pointer hover:bg-stone-50"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-[#0B1E14]">
      <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl text-[9px] font-bold uppercase tracking-wider">
        <button type="button" onClick={() => setMetodo('pix')} className={`py-2 rounded-lg transition-colors cursor-pointer ${metodo === 'pix' ? 'bg-[#0B1E14] text-white shadow' : 'text-stone-500'}`}>Pix</button>
        <button type="button" onClick={() => setMetodo('credito_total')} className={`py-2 rounded-lg transition-colors cursor-pointer ${metodo === 'credito_total' ? 'bg-[#0B1E14] text-white shadow' : 'text-stone-500'}`}>Quitar</button>
        <button type="button" onClick={() => setMetodo('debito')} className={`py-2 rounded-lg transition-colors cursor-pointer ${metodo === 'debito' ? 'bg-[#0B1E14] text-white shadow' : 'text-stone-500'}`}>Débito</button>
      </div>

      <div className="flex justify-between items-center bg-stone-50 border border-stone-200 p-3 rounded-xl">
         <span className="text-[10px] font-bold uppercase text-stone-500">Valor a ser cobrado:</span>
         <span className="text-sm font-mono font-bold text-[#BD6B42]">
           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorCobrado)}
         </span>
      </div>

      {metodo === 'pix' && (
        <div className="space-y-4 pt-2">
          {carregandoPix ? (
            <div className="p-5 bg-stone-50 border border-dashed border-[#DFD9CE] rounded-2xl min-h-[120px] flex items-center justify-center">
              <span className="animate-pulse font-bold text-stone-400 text-xs">Preparando o seu Pix...</span>
            </div>
          ) : dadosPix?.payload ? (
            <>
              {dadosPix.encodedImage && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${dadosPix.encodedImage}`}
                    alt="QR Code do Pix para pagar a parcela"
                    className="cartao-avle w-44 h-44 p-2"
                  />
                </div>
              )}

              <div>
                <p className="text-[9px] font-bold uppercase text-stone-500 mb-1 tracking-wider">Pix copia e cola</p>
                <p className="font-mono text-[10px] leading-relaxed text-stone-600 bg-stone-50 border border-stone-200 rounded-xl p-3 break-all max-h-24 overflow-y-auto">
                  {dadosPix.payload}
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(dadosPix.payload || '');
                    setCopiado(true);
                    // Abrir o banco nao e pagar. Quem confirma e o webhook,
                    // quando o dinheiro entra de verdade.
                    setAguardandoConfirmacao(true);
                    setTimeout(() => setCopiado(false), 2500);
                  } catch {
                    setCopiado(false);
                  }
                }}
                className="w-full py-3.5 bg-[#0B1E14] text-white font-bold rounded-full tracking-wide cursor-pointer uppercase text-[10px] transition-opacity"
              >
                {copiado ? 'Código copiado!' : 'Copiar código Pix'}
              </button>

              <p className="text-[10px] text-stone-400 text-center leading-relaxed">
                Abra o aplicativo do seu banco, escolha Pix e cole o código. Confira que o
                recebedor é a AVLE antes de confirmar.
              </p>
            </>
          ) : (
            <div className="p-5 bg-stone-50 border border-dashed border-[#DFD9CE] rounded-2xl text-center space-y-3">
              <span className="block font-semibold text-rose-500 text-xs leading-relaxed">
                {obrigatorio
                  ? 'Não foi possível preparar o Pix agora. Tente de novo em instantes.'
                  : 'Não foi possível preparar o Pix agora. Feche e tente de novo em instantes.'}
              </span>
              <button
                type="button"
                onClick={() => setTentativaDePix((n) => n + 1)}
                className="px-5 py-2.5 bg-[#0B1E14] text-white font-bold rounded-full text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Gerar o Pix de novo
              </button>
            </div>
          )}
        </div>
      )}

      {metodo !== 'pix' && (
        <form onSubmit={handlePagamentoCartao} className="space-y-3 pt-2 text-left text-xs">
          <div className="bg-[#F5F2EB] p-3 rounded-xl text-center text-[10px] text-[#BD6B42] font-medium leading-relaxed border border-[#DFD9CE]">
            {metodo === 'credito_total' ? (
              <span>Quitação do plano: <strong>R$ {(valorCobrado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> à vista no seu limite, com repasse imediato à loja.</span>
            ) : (
              <span>Transação de cartão de débito com liquidação instantânea.</span>
            )}
          </div>

          {mensagemCartao && (
            <div className={`p-3 text-[10px] font-bold rounded-xl border text-center ${mensagemCartao.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              {mensagemCartao.texto}
            </div>
          )}

          <div>
            <label className="block text-[9px] font-bold uppercase text-stone-500 mb-1">Número do cartão</label>
            <input 
              type="text" 
              maxLength={19}
              value={numeroCartao}
              onChange={(e) => setNumeroCartao(e.target.value)}
              className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#BD6B42]"
              required
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase text-stone-500 mb-1">Nome impresso no cartão</label>
            <input 
              type="text" 
              value={nomeImpresso}
              onChange={(e) => setNomeImpresso(e.target.value)}
              className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#BD6B42]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase text-stone-500 mb-1">Validade (MM/AA)</label>
              <input 
                type="text" 
                placeholder="MM/AA"
                maxLength={5}
                value={validade}
                onChange={(e) => setValidade(mascaraValidade(e.target.value))}
                className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-center focus:outline-none focus:border-[#BD6B42]"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-stone-500 mb-1">CVV</label>
              <input 
                type="text" 
                maxLength={4}
                value={ccv}
                onChange={(e) => setCcv(e.target.value.replace(/\D/g, ''))}
                className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-center focus:outline-none focus:border-[#BD6B42]"
                required
              />
            </div>
          </div>

          <p className="text-[9px] text-stone-400 leading-relaxed pt-1">
            O endereço abaixo é o da fatura do cartão. O banco confere estes dados na hora de
            aprovar a compra.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase text-stone-500 mb-1">CEP</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="85015-300"
                maxLength={9}
                value={cep}
                onChange={(e) => setCep(aplicarMascaraCep(e.target.value))}
                className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#BD6B42]"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-stone-500 mb-1">Número</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="742"
                maxLength={10}
                value={numeroEndereco}
                onChange={(e) => setNumeroEndereco(e.target.value)}
                className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#BD6B42]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase text-stone-500 mb-1">Complemento (opcional)</label>
            <input
              type="text"
              placeholder="Apto 31, bloco B"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#BD6B42]"
            />
          </div>

          <button 
            type="submit" 
            disabled={processando}
            className="w-full h-12 mt-4 bg-[#BD6B42] text-white font-bold rounded-full text-[10px] uppercase tracking-wider hover:bg-[#A95A33] transition-all disabled:opacity-50 cursor-pointer shadow-md"
          >
            {processando ? 'Processando...' : 'Confirmar pagamento'}
          </button>
        </form>
      )}
    </div>
  );
}