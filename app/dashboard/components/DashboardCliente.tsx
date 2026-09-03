'use client';

import { useEffect, useState, useRef } from 'react';
import { CardContemplacao, EtapaTrilha, mensagemDeErro } from '../../lib/contemplacao';
import { aplicarMascaraCep } from '../../lib/validacao';
import { SENHA_PADRAO_INICIAL } from '../../lib/constantes';
import { proximoVencimento, proximoSorteio, formatarData, diasAte } from '../../lib/datas';
import { grupoDisponivel } from '../../lib/grupos';
import { useRouter } from 'next/navigation';
import { apiFetch, encerrarSessao } from '../../lib/api';

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

  const [nivelVisao, setNivelVisao] = useState<'lojas' | 'grupos' | 'dashboard'>('lojas');

  // Qual lista de grupos esta aberta. Nulo enquanto a cliente nao escolheu, e
  // ai a tela decide sozinha: quem ja tem plano abre nos planos dela.
  const [abaGrupos, setAbaGrupos] = useState<'meus' | 'disponiveis' | null>(null);

  // No celular o menu vira gaveta. A barra lateral inteira ocupava a primeira
  // tela inteira antes de qualquer conteudo aparecer, e a cliente abria o painel
  // vendo menu em vez de ver o proprio plano.
  const [menuAberto, setMenuAberto] = useState(false);
  const [lojaEmFoco, setLojaEmFoco] = useState<any | null>(null);
  const [gruposDaLoja, setGruposDaLoja] = useState<any[]>([]);
  const [carregandoGrupos, setCarregandoGrupos] = useState(false);

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
    if (!item) return 'Loja Parceira';
    if (typeof item === 'string' && item.trim().length > 0) return item;
    const objLoja = item.loja || item.grupo?.loja || item;
    const nome = objLoja.nomeComercial || objLoja.nome_comercial || objLoja.nome || objLoja.nomeLoja || objLoja.razaoSocial || item.nomeComercial || item.nome_comercial || item.nome;
    if (nome && typeof nome === 'string' && nome.trim().length > 0) return nome.trim();
    return item.grupo?.nome || item.nomeGrupo || 'Loja Parceira';
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
             mostrarAviso('Participação Cancelada', 'A administração da loja encerrou a sua participação em um dos grupos de compras. O seu histórico vinculado a esta cota foi fechado.', true);
             
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
                  setCarregandoGrupos(true);
                  
                  apiFetch(`${API_URL}/api/grupos/loja/${lojaDoConvite.id}`)
                     .then((res) => res.json())
                     .then((grupos) => setGruposDaLoja(Array.isArray(grupos) ? grupos : []))
                     .catch(() => setGruposDaLoja([]))
                     .finally(() => setCarregandoGrupos(false));
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
                    setCarregandoGrupos(true);
                    
                    apiFetch(`${API_URL}/api/grupos/loja/${lojaVinculadaId}`)
                        .then((res) => res.json())
                        .then((grupos) => setGruposDaLoja(Array.isArray(grupos) ? grupos : []))
                        .catch(() => setGruposDaLoja([]))
                        .finally(() => setCarregandoGrupos(false));
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
      });
  }, [usuario?.id]);

  const entrarNaLoja = (loja: any) => {
    setLojaEmFoco(loja);
    setNivelVisao('grupos');
    setCarregandoGrupos(true);
    setGruposDaLoja([]);

    apiFetch(`${API_URL}/api/grupos/loja/${loja.id}`)
      .then((res) => res.json())
      .then((data) => setGruposDaLoja(Array.isArray(data) ? data : []))
      .catch(() => setGruposDaLoja([]))
      .finally(() => setCarregandoGrupos(false));
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
          mostrarAviso('Solicitação Enviada', 'A caixa de mensagens da loja foi notificada para realizar a análise de crédito. O processo costuma ser rápido.', false);
          buscarAcessosLoja(usuario?.id);
          buscarFilasEspera(usuario?.id);
          setModalAcessoAberto(false);
       } else {
          mostrarAviso('Erro', 'Não foi possível enviar a solicitação no momento.', true);
       }
    } catch(e) {
       mostrarAviso('Erro de Conexão', 'Erro ao conectar ao servidor ao solicitar acesso.', true);
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
      setModalAdesao({ aberto: false, grupo: null });

      try {
         const res = await apiFetch(`${API_URL}/api/usuarios/${usuario?.id}/vincular-clube`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ lojaId: Number(lojaEmFoco?.id), grupoId: Number(grupo?.id) })
         });
         
         if (!res.ok) throw new Error();
         
         const resClubes = await apiFetch(`${API_URL}/api/usuarios/${usuario?.id}/clubes-ativos`);
         const dataClubes = await resClubes.json();
         setClubesAtivos(dataClubes);
         
         const novaCota = dataClubes.find((c: any) => c.grupo.id === grupo.id);
         if (novaCota) {
            setClubeAtualSelecionado(novaCota);
            setGrupoSelecionado(novaCota.grupo);
            setLojaSelecionada(novaCota.loja);
            setSaldoPoupanca(Number(novaCota.saldoPoupanca) || 0);
            setNivelVisao('dashboard'); 
         }
      } catch {
         mostrarAviso('Erro de Adesão', 'Falha ao registrar vínculo no clube. Tente novamente.', true);
      }
  };

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

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const arquivo = e.target.files[0];
      if (!arquivo.type.startsWith('image/')) { mostrarAviso('Formato Inválido', 'Apenas arquivos de imagem.', true); return; }
      if (arquivo.size > 2 * 1024 * 1024) { mostrarAviso('Arquivo Muito Grande', 'A imagem deve ter no máximo 2MB.', true); return; }

      const leitor = new FileReader();
      leitor.onloadend = async () => {
        const base64String = leitor.result as string;
        try {
          const res = await apiFetch(`${API_URL}/api/usuarios/${usuario?.id}/foto`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fotoPerfil: base64String }),
          });
          if (!res.ok) throw new Error();
          setFotoPerfil(base64String);
          const localUser = localStorage.getItem('@avle:usuario');
          if (localUser) {
            const parsed = JSON.parse(localUser);
            parsed.fotoPerfil = base64String;
            localStorage.setItem('@avle:usuario', JSON.stringify(parsed));
          }
        } catch (err) {
          mostrarAviso('Erro', 'Não foi possível salvar sua foto de perfil.', true);
        }
      };
      leitor.readAsDataURL(arquivo);
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

  // Quem ja tem plano nao deveria precisar navegar para pagar. Antes a cliente
  // caia na lista de lojas ou de grupos e so encontrava o botao de pagar depois
  // de dois cliques - e quem nao esta acostumada com painel simplesmente nao
  // achava. Com um plano so, o painel abre dentro dele.
  //
  // Roda uma vez por sessao: sem isso, quem clicasse em "voltar para os clubes"
  // seria arrastada de volta para dentro do grupo e ficaria presa.
  const aberturaAutomaticaFeita = useRef(false);

  // Separado do de cima de proposito: este marca que a tela realmente entrou no
  // grupo. A busca das lojas termina depois e manda a cliente para a lista de
  // grupos; sem saber que ja entramos, ela jogaria a cliente para fora do
  // painel que acabou de abrir.
  const abriuGrupoDireto = useRef(false);

  useEffect(() => {
    if (aberturaAutomaticaFeita.current) return;
    if (clubesAtivos.length === 0) return;

    aberturaAutomaticaFeita.current = true;

    // Com mais de um plano a escolha e dela: abrir um por conta propria
    // esconderia os outros. Nesse caso o atalho de pagamento fica na lista.
    if (clubesAtivos.length > 1) return;

    abriuGrupoDireto.current = true;
    handleMudarClubeEmExibicao(clubesAtivos[0]);
  }, [clubesAtivos]);

  // Variável que diz se o painel deve ser isolado
  const isClienteAmarrado = !!lojaBloqueadaId;

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-[#0B1E14] bg-[#F0F2F5]">

      <header className="md:hidden sticky top-0 z-30 bg-[#0B1E14] text-white flex items-center gap-3 px-4 py-3 shadow-md">
        <button
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <span className="block w-6 h-0.5 bg-current rounded-full" />
          <span className="block w-6 h-0.5 bg-current rounded-full mt-1.5" />
          <span className="block w-6 h-0.5 bg-current rounded-full mt-1.5" />
        </button>
        <span className="flex-1 text-xs font-bold uppercase tracking-wider truncate">
          {usuario?.nome || 'Painel'}
        </span>
        <button
          onClick={() => { setAbaAtiva('perfil'); setStatusSalvar(null); setStatusSalvarSenha(null); }}
          className="w-9 h-9 rounded-full bg-[#EFEAE2] text-[#0B1E14] flex items-center justify-center overflow-hidden font-bold text-[11px] shrink-0 cursor-pointer"
        >
          {fotoPerfil ? (
            <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
          ) : (
            usuario?.nome ? usuario.nome.substring(0, 2).toUpperCase() : 'AV'
          )}
        </button>
      </header>

      {menuAberto && (
        <div
          onClick={() => setMenuAberto(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-40 animate-fadeIn"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-[#0B1E14] text-[#E3EAE6] flex flex-col justify-between p-6 flex-shrink-0 overflow-y-auto transition-transform duration-200 md:transition-none ${
          menuAberto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          <div className="flex flex-col items-center text-center pb-6 border-b border-white/10 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#EFEAE2] flex items-center justify-center overflow-hidden font-bold text-xl text-[#0B1E14] shadow-md cursor-pointer hover:scale-105 transition-all" onClick={() => { setMenuAberto(false); setAbaAtiva('perfil'); setStatusSalvar(null); setStatusSalvarSenha(null); }}>
              {fotoPerfil ? (
                <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                usuario?.nome ? usuario.nome.substring(0,2).toUpperCase() : 'AV'
              )}
            </div>
            <h3 className="text-white font-bold text-sm tracking-wide mt-3 uppercase">{usuario?.nome || 'Painel Cliente'}</h3>
            <p className="text-[11px] text-stone-400 truncate max-w-[180px] mt-0.5">{usuario?.email}</p>
          </div>

          <nav className="space-y-0.5 mt-2">
            {[
              { id: 'inicio', label: isClienteAmarrado ? 'Meus Planos' : 'Rede de Lojas' },
              { id: 'extrato', label: 'Histórico' },
              { id: 'regras', label: 'Regulamento' },
              { id: 'ajuda', label: 'Suporte' }
            ].map((aba) => {
              const isActive = abaAtiva === aba.id;
              return (
                <button
                  key={aba.id}
                  onClick={() => {
                    setMenuAberto(false);
                    setAbaAtiva(aba.id as any);
                    if (aba.id === 'inicio') {
                      if (isClienteAmarrado || lojaEmFoco) {
                        setNivelVisao('grupos');
                      } else {
                        setNivelVisao('lojas');
                      }
                    }
                    setStatusSalvar(null);
                    setStatusSalvarSenha(null);
                  }}
                  className={`w-full text-left py-2.5 text-[11px] font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer flex items-center gap-3 border-l-2 ${
                    isActive
                      ? 'border-[#BD6B42] text-white bg-white/5 pl-5 pr-4'
                      : 'border-transparent text-stone-500 hover:text-stone-300 hover:border-white/20 pl-4 pr-4 hover:pl-5'
                  }`}
                >
                  {aba.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
          <button
            onClick={() => { setMenuAberto(false); setAbaAtiva('perfil'); setStatusSalvar(null); setStatusSalvarSenha(null); }}
            className={`text-[11px] font-bold tracking-widest uppercase transition-all cursor-pointer border-l-2 pl-3 py-1 ${
              abaAtiva === 'perfil' ? 'border-[#BD6B42] text-white' : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            Configurações
          </button>
          <button
            onClick={async () => { await encerrarSessao(); router.push('/'); }}
            className="text-stone-500 hover:text-red-400 text-[10px] font-bold cursor-pointer transition-all tracking-wider uppercase"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 max-w-7xl overflow-x-hidden space-y-6">

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
                      className="w-full py-3 bg-[#BD6B42] text-white font-bold rounded-xl text-[11px] uppercase tracking-wider hover:bg-[#A95A33] transition-all cursor-pointer shadow-sm"
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

            {/* Atalho de pagamento para quem tem mais de um plano e por isso nao
                cai direto dentro de um deles. Fica antes das listas porque e a
                unica coisa que a cliente precisa achar sem procurar. */}
            {nivelVisao !== 'dashboard' && clubesAtivos.length > 0 && (
              <div className="mb-6 space-y-3">
                {clubesAtivos.map((clube) => (
                  <div
                    key={clube.cotaId}
                    className="bg-[#0B1E14] text-white rounded-2xl p-5 shadow-lg border-t-2 border-t-[#BD6B42] flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <span className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">
                        Parcela deste mês
                      </span>
                      <span className="block text-3xl font-bold font-mono leading-none">
                        R$ {(Number(clube.grupo?.valorParcela) || 0).toFixed(2)}
                      </span>
                      <span className="block text-[11px] text-stone-400 mt-1.5 truncate">
                        {clube.grupo?.nome || 'Meu plano'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleMudarClubeEmExibicao(clube)}
                      className="bg-[#BD6B42] text-white px-6 py-4 rounded-xl text-sm font-bold uppercase tracking-wider hover:brightness-110 active:brightness-95 transition-all cursor-pointer shadow-md w-full sm:w-auto"
                    >
                      Pagar parcela
                    </button>
                  </div>
                ))}
              </div>
            )}

            {nivelVisao === 'lojas' && !isClienteAmarrado && (
              <div className="space-y-6 text-left">
                <div className="border-b border-[#DFD9CE] pb-5">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                    AVLE · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">Rede de Lojas Parceiras</h2>
                  <p className="text-xs text-stone-400 mt-1">Explore os estabelecimentos credenciados e acesse seus clubes de compras.</p>
                </div>

                {lojas.length === 0 && !erroConexao ? (
                  <div className="bg-white border border-dashed border-[#DFD9CE] rounded-2xl p-8 text-center text-xs text-stone-400 font-medium">
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
                        let labelStatus = 'Ver Estabelecimento';
                        let labelColor = 'text-stone-400';

                        if (statusAcesso === 'APROVADO' || statusAcesso === 'PENDENTE') {
                            corBorda = 'border-emerald-600 bg-emerald-50/20 shadow-sm';
                            labelStatus = quantidadeCotantes > 0 ? `${quantidadeCotantes} Clube(s) Ativo(s)` : 'Acesso Liberado';
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
                                 mostrarAviso('Acesso Restrito', 'O seu acesso a este estabelecimento está suspenso no momento. Entre em contato com a loja para mais informações.', true);
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
                    className="text-[10px] font-bold text-stone-500 hover:text-[#0B1E14] uppercase tracking-wider flex items-center gap-2 transition-colors bg-white border border-[#E6E2D8] px-4 py-2 rounded-xl cursor-pointer shadow-xs w-fit"
                  >
                    ← Voltar para Rede de Lojas
                  </button>
                )}

                <div className="bg-white border border-[#DFD9CE] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0B1E14] flex items-center justify-center font-serif font-bold text-white text-3xl shrink-0 shadow-lg">
                    {obterNomeLoja(lojaEmFoco).substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B1E14]">{obterNomeLoja(lojaEmFoco)}</h2>
                      <span className="bg-[#EFEAE2] text-[#BD6B42] border border-[#DFD9CE] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Unidade Oficial</span>
                    </div>
                    <p className="text-xs text-stone-500 mb-4 max-w-2xl leading-relaxed">
                      Bem-vindo à página oficial desta loja. Aqui você pode visualizar todos os clubes de compras disponíveis, consultar o regulamento contratual e gerenciar suas faturas ativas.
                    </p>
                    
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-stone-100">
                      <div className="flex items-center gap-1.5 text-xs text-stone-600">
                         <span className="font-bold text-stone-400 uppercase text-[9px] tracking-wider">Contato:</span>
                         {lojaEmFoco?.telefone ? aplicarMascaraTelefone(lojaEmFoco.telefone) : 'Não informado'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-600">
                         <span className="font-bold text-stone-400 uppercase text-[9px] tracking-wider">E-mail:</span>
                         {lojaEmFoco?.email || 'Não informado'}
                      </div>
                      {lojaEmFoco?.cnpj && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-600">
                           <span className="font-bold text-stone-400 uppercase text-[9px] tracking-wider">CNPJ:</span>
                           {aplicarMascaraCpfCnpj(lojaEmFoco.cnpj)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
                    <button 
                      onClick={() => window.open(`${API_URL}/api/lojas/${lojaEmFoco.id}/regras`, '_blank')}
                      className="w-full bg-[#0B1E14] text-white px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-opacity-90 transition-all shadow-sm cursor-pointer text-center"
                    >
                      Ler Regulamento
                    </button>
                    {lojaEmFoco?.telefone && (
                      <button 
                        onClick={() => window.open(`https://wa.me/55${lojaEmFoco.telefone.replace(/\D/g, '')}`, '_blank')}
                        className="w-full bg-stone-100 text-[#0B1E14] border border-stone-200 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-stone-200 transition-all shadow-sm cursor-pointer text-center"
                      >
                        Suporte no WhatsApp
                      </button>
                    )}
                  </div>
                </div>

                {carregandoGrupos ? (
                   <div className="py-12 text-center text-xs font-bold text-stone-400 animate-pulse">Consultando planos no servidor...</div>
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

                   if (gruposDaLoja.length === 0) {
                      return (
                         <div className="bg-stone-50 border border-dashed border-[#DFD9CE] rounded-2xl p-8 text-center text-xs text-stone-400 font-medium">
                            Este estabelecimento ainda não lançou nenhum grupo de compras na plataforma.
                         </div>
                      );
                   }

                   if (gruposVisiveis.length === 0) {
                      return (
                         <div className="bg-white border border-[#DFD9CE] rounded-2xl p-8 text-center space-y-4 shadow-sm">
                            <span className="inline-block text-[9px] font-black text-[#BD6B42] bg-[#F5F2EB] px-3 py-1 rounded-full uppercase tracking-widest border border-[#DFD9CE]">
                               Grupos preenchidos
                            </span>
                            <h3 className="text-base font-serif font-bold text-[#0B1E14]">
                               Todos os grupos desta loja já estão preenchidos
                            </h3>

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
                                     className="bg-[#0B1E14] text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-opacity-90 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                                  >
                                     {processandoFila ? 'Entrando...' : 'Entrar na fila de espera'}
                                  </button>
                               </>
                            )}
                         </div>
                      );
                   }

                   return (
                   <div className="pt-2">
                   <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-5 w-fit">
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
                      <div className="bg-stone-50 border border-dashed border-[#DFD9CE] rounded-2xl p-8 text-center text-xs text-stone-400 font-medium">
                        {abaAtual === 'meus'
                          ? 'Você ainda não participa de nenhum grupo desta loja. Veja os grupos disponíveis ao lado.'
                          : 'Nenhum grupo com vaga aberta nesta loja no momento.'}
                      </div>
                   ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {listaDaAba.slice().sort((a, b) => a.id - b.id).map(grupo => {
                         const cotaExistente = clubesAtivos.find(c => c.grupo?.id === grupo.id);
                         const isAtivo = !!cotaExistente;
                         
                         return (
                            <div 
                              key={grupo.id}
                              onClick={() => handleAbrirGrupo(grupo, cotaExistente)}
                              className={`rounded-2xl p-5 border cursor-pointer flex flex-col justify-between min-h-[160px] transition-all group hover:-translate-y-1 hover:shadow-md ${
                                 isAtivo ? 'bg-white border-[#BD6B42] shadow-sm' : 'bg-stone-50/50 border-[#DFD9CE] hover:border-stone-300 hover:bg-white'
                              }`}
                            >
                               <div className="flex justify-between items-start w-full mb-4">
                                  <div>
                                     <span className="text-[9px] bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded text-stone-500 font-mono font-bold mb-2 inline-block">Lote #{grupo.id}</span>
                                     <h3 className={`font-serif font-bold text-base leading-tight pr-2 transition-colors ${isAtivo ? 'text-[#0B1E14]' : 'text-stone-700 group-hover:text-[#0B1E14]'}`}>
                                        {grupo.nome}
                                     </h3>
                                  </div>
                               </div>
                               
                               <div className="flex justify-between items-end w-full border-t border-stone-200/60 pt-3">
                                  <div className="flex flex-col">
                                     <span className="text-[10px] text-stone-500 font-medium">Vigência: {grupo.duracaoMeses} Meses</span>
                                  </div>
                                  <span className={`text-lg font-bold font-mono ${isAtivo ? 'text-[#BD6B42]' : 'text-stone-500 group-hover:text-[#0B1E14]'}`}>
                                     R$ {Number(grupo.valorParcela).toFixed(2)}
                                  </span>
                               </div>

                               {isAtivo ? (
                                  <div className="mt-4 pt-3 border-t border-[#BD6B42]/20 w-full text-center text-[10px] font-bold text-[#BD6B42] uppercase tracking-wider group-hover:bg-[#BD6B42] group-hover:text-white rounded-lg transition-colors py-1">
                                     Acessar Dashboard
                                  </div>
                               ) : (
                                  <div className="mt-4 pt-3 border-t border-stone-200 w-full text-center text-[10px] font-bold text-stone-400 uppercase tracking-wider group-hover:text-[#0B1E14] transition-colors py-1">
                                     Participar do Clube
                                  </div>
                               )}
                            </div>
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
                  className="text-[11px] font-bold text-stone-500 hover:text-[#0B1E14] uppercase tracking-wider flex items-center gap-1 transition-colors bg-white border border-[#E6E2D8] px-4 py-2 rounded-xl cursor-pointer shadow-xs w-fit"
                >
                  ← Voltar para os Clubes
                </button>

                <div className="border-b border-[#DFD9CE] pb-5">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                    {obterNomeLoja(lojaSelecionada)} · Cota <span className="font-mono">#{clubeAtualSelecionado?.cotaId}</span> · {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">{grupoSelecionado?.nome}</h2>
                  <span className="inline-block mt-1 text-[9px] font-black text-[#BD6B42] bg-[#F5F2EB] px-3 py-1 rounded-full uppercase tracking-widest border border-[#DFD9CE]">
                    Painel de Acompanhamento
                  </span>
                </div>

                {/* Pagar e o que a cliente vem fazer aqui, entao e a primeira
                    coisa da tela. Antes o botao ficava no cabecalho de uma
                    tabela la embaixo, depois de dois blocos de cartoes e dois
                    graficos - no celular, quatro telas de rolagem abaixo. */}
                {etapaAtual !== 4 ? (
                  <div className="bg-[#0B1E14] text-white rounded-2xl p-5 sm:p-6 shadow-lg border-t-2 border-t-[#BD6B42]">
                    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                      <div>
                        <span className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">
                          Parcela deste mês
                        </span>
                        <span className="text-4xl font-bold font-mono leading-none block">
                          R$ {valorMensalidade.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">
                          Vence em
                        </span>
                        <span className="text-xl font-bold font-mono leading-none block">
                          {dataVencimentoCota || '--/--'}
                        </span>
                        <span
                          className={`block text-[10px] font-bold mt-1 ${
                            diasRestantesVencimento < 0
                              ? 'text-rose-400'
                              : diasRestantesVencimento <= 3
                                ? 'text-amber-400'
                                : 'text-stone-400'
                          }`}
                        >
                          {diasRestantesVencimento < 0
                            ? `${Math.abs(diasRestantesVencimento)} dia${Math.abs(diasRestantesVencimento) === 1 ? '' : 's'} em atraso`
                            : diasRestantesVencimento === 0
                              ? 'vence hoje'
                              : `faltam ${diasRestantesVencimento} dia${diasRestantesVencimento === 1 ? '' : 's'}`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setModalCheckoutAberto(true)}
                      className="w-full bg-[#BD6B42] text-white py-4 rounded-xl text-sm font-bold uppercase tracking-wider hover:brightness-110 active:brightness-95 transition-all cursor-pointer shadow-md"
                    >
                      Pagar parcela
                    </button>
                    <p className="text-[10px] text-stone-400 text-center mt-2.5">
                      Pix ou cartão · o comprovante entra no seu histórico
                    </p>
                  </div>
                ) : (
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
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Próximo Vencimento</p>
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
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Próximo Sorteio</p>
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
                  <div className="bg-[#0B1E14] text-white p-5 rounded-xl shadow-sm relative overflow-hidden border-t-2 border-t-[#BD6B42]">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-3">Saldo de Poupança</span>
                    <span className="text-3xl font-bold tracking-tight block font-mono leading-none">R$ {saldoPoupanca.toFixed(2)}</span>
                    <span className="text-[10px] text-stone-500 mt-2 block">acumulado na cota</span>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] border-t-2 border-t-[#0B1E14] p-5 rounded-xl shadow-sm flex flex-col">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-3">Vigência do Plano</span>
                    <span className="text-3xl font-bold text-[#0B1E14] font-mono leading-none">{grupoSelecionado?.duracaoMeses || 0}</span>
                    <span className="text-[10px] text-stone-400 mt-2">meses de sorteios</span>
                  </div>
                  <div className={`p-5 rounded-xl shadow-sm flex flex-col border-t-2 ${
                    etapaAtual >= 3 ? 'bg-emerald-50 border border-emerald-200 border-t-emerald-500' : 'bg-white border border-[#E6E2D8] border-t-[#0B1E14]'
                  }`}>
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-3">Fase do Contrato</span>
                    <span className={`text-3xl font-bold font-mono leading-none ${etapaAtual >= 3 ? 'text-emerald-600' : 'text-[#0B1E14]'}`}>
                      0{etapaAtual}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-2">aptidao coletiva</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white border border-[#E6E2D8] rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[260px]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Histórico de Quitação da Cota</span>
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

                  <div className="bg-white border border-[#E6E2D8] rounded-xl p-5 shadow-xs flex flex-col items-center justify-between min-h-[260px]">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block w-full text-left">Progresso do Objetivo</span>
                    <div className="relative w-32 h-32 flex items-center justify-center my-auto">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E6E2D8" strokeWidth="4" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#BD6B42" strokeWidth="4" strokeDasharray={`${percentual} ${100 - percentual}`} strokeDashoffset="0" className="transition-all duration-500" />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-xl font-bold tracking-tight font-mono text-[#0B1E14]">{percentual}%</span>
                        <span className="block text-[8px] uppercase text-stone-400 font-bold tracking-wider">Concluido</span>
                      </div>
                    </div>
                    <div className="w-full text-center border-t border-stone-50 pt-3 text-[11px] font-semibold text-stone-500">
                      Meta Coletiva do Circulo: <span className="font-mono text-[#0B1E14] font-bold">R$ {totalObjetivo.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#DFD9CE] rounded-xl shadow-xs overflow-hidden">
                  <div className="px-5 py-4 border-b bg-stone-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1E14]">Regua de Vencimentos e Aportes Efetuados</h3>
                    {etapaAtual !== 4 && (
                      <button
                        onClick={() => setModalCheckoutAberto(true)}
                        className="bg-[#0B1E14] text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-opacity-90 cursor-pointer shadow-xs"
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
                            <td className="py-3.5 px-5 text-[#0B1E14] font-bold">Aporte Mensal Coletivo</td>
                            <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-700">R$ {valorMensalidade.toFixed(2)}</td>
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
              <h2 className="text-xl font-bold text-[#0B1E14]">Histórico Financeiro Consolidado</h2>
              <p className="text-xs text-stone-400 mt-1">Extrato detalhado de cada aporte e parcela liquidada em todas as suas unidades ativas.</p>
            </div>
            <div className="bg-white border border-[#DFD9CE] rounded-xl shadow-xs overflow-hidden">
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
                        <td className="py-3.5 px-5 text-stone-500">{item.grupoNome} (Parcela #0{item.parcela})</td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-700">R$ {item.valor.toFixed(2)}</td>
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
          <div className="bg-white border border-[#DFD9CE] rounded-xl p-6 space-y-4 text-xs text-stone-600 leading-relaxed animate-fadeIn text-left max-w-2xl shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-[#0B1E14] font-serif uppercase tracking-wide">Regulamento AVLE</h3>
              <p className="text-stone-400 mt-1">Confira as diretrizes da comunidade estruturada de compras programadas de móveis e decorações.</p>
            </div>

            <p className="bg-stone-50 p-3 rounded-xl border border-dashed text-stone-500">
              Compra Planejada: A AVLE nao atua como consorcio tradicional ou fundo financeiro. Trata-se de uma comunidade estruturada de compras programadas de moveis e decoracoes corporativas ou residenciais.
            </p>

            {lojaSelecionada ? (
              <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-[#0B1E14] uppercase text-[11px]">Termos Especificos da Unidade</h4>
                  <p className="text-stone-400 text-[10px] mt-0.5">Regulamento de termos contratuais enviado por: <strong>{obterNomeLoja(lojaSelecionada)}</strong></p>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(`${API_URL}/api/lojas/${lojaSelecionada.id}/regras`, '_blank')}
                  className="px-4 py-2.5 bg-[#0B1E14] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider hover:bg-opacity-90 cursor-pointer transition-all"
                >
                  Visualizar Contrato PDF
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-stone-400 italic pt-2">
                Acesse um dos seus clubes ativos ou visualize as lojas na aba inicial para habilitar a visualização do documento de termos especificos em PDF.
              </p>
            )}
          </div>
        )}

        {abaAtiva === 'perfil' && (
          <div className="space-y-6 max-w-2xl text-left animate-fadeIn">
            <div className="bg-white border border-[#DFD9CE] rounded-2xl p-6 md:p-8 space-y-6 shadow-xs">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Meus Dados Cadastrais</h2>
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
                  <h4 className="text-xs font-bold uppercase text-stone-500">Foto de Perfil</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">Selecione uma imagem quadrada de até 2MB nos formatos comuns de imagem.</p>
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
                    Não foi possível salvar as alteracoes. Tente novamente mais tarde.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">Nome Completo</label>
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
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">E-mail de Notificação</label>
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
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">Telefone / Celular</label>
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
                    <span>CPF / CNPJ do Titular</span>
                    <span className="text-xs text-[#0B1E14]" title="Informação imutavel por segurança contratual">Protegido</span>
                  </label>
                  <input
                    type="text"
                    value={carregandoDados ? "Aguardando carregamento do perfil..." : (cpfInput || "Sem documento cadastrado")}
                    disabled
                    placeholder="Aguardando carregamento do perfil..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-100 text-stone-500 h-[40px] text-sm font-mono cursor-not-allowed font-bold"
                  />
                  <p className="text-[10px] text-stone-400 leading-relaxed pt-1">
                    Este documento esta atrelado as faturas e regras de sorteio coletivo. Alterações cadastrais exigem auditoria direta com o administrador.
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    type="submit"
                    disabled={carregandoDados || salvandoPerfil}
                    className="px-6 py-3 bg-[#0B1E14] text-white font-bold rounded-xl shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-opacity-90 disabled:opacity-50 transition-all"
                  >
                    {salvandoPerfil ? 'Salvando...' : 'Salvar Novas Informações'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white border border-[#DFD9CE] rounded-2xl p-6 md:p-8 space-y-5 shadow-xs">
              <div>
                <h3 className="text-base font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Segurança da Conta e Alteração de Senha</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Se você utilizou uma senha temporaria/padrão fornecida pelo estabelecimento no seu primeiro cadastro, atualize-a abaixo por uma senha pessoal.
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
                  <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">Senha Atual (ou Senha Padrão Inicial)</label>
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
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">Nova Senha</label>
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
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">Confirmar Nova Senha</label>
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
                    className="px-6 py-3 bg-[#BD6B42] text-white font-bold rounded-xl shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-[#A95A33] disabled:opacity-50 transition-all"
                  >
                    {salvandoSenha ? 'Processando...' : 'Atualizar Minha Senha'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {abaAtiva === 'ajuda' && (
          <div className="bg-white border border-[#DFD9CE] rounded-xl p-6 space-y-6 animate-fadeIn text-left max-w-2xl shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-[#0B1E14] font-serif uppercase tracking-wide">Central de Atendimento e Suporte</h3>
              <p className="text-stone-400 mt-1">Escolha o canal de atendimento ideal para resolver a sua dúvida ou problema rapidamente.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#0B1E14]/10 text-[#0B1E14] uppercase">Suporte do Site</span>
                  <h4 className="font-bold text-[#0B1E14] text-xs mt-2 uppercase">Atendimento Tecnico</h4>
                  <p className="text-stone-400 text-[11px] mt-1 leading-relaxed">Para duvidas sobre acesso a conta, faturas Pix, dificuldades de navegação, atualização de dados pessoais ou instabilidades no sistema.</p>
                </div>
                <div className="pt-2 border-t border-stone-200/60">
                  <p className="text-stone-500 font-bold text-xs font-mono mb-2">(42) 98411-7768</p>
                  <button
                    type="button"
                    onClick={() => window.open('https://wa.me/5542984117768', '_blank')}
                    className="w-full text-center py-2.5 bg-[#0B1E14] text-white font-bold rounded-lg text-[10px] uppercase tracking-wider hover:bg-opacity-90 transition-all cursor-pointer"
                  >
                    Chamar Suporte Tecnico
                  </button>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
                {lojaSelecionada || lojaEmFoco ? (
                  <>
                    <div>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#BD6B42]/10 text-[#BD6B42] uppercase">Suporte da Loja</span>
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
                        {(lojaSelecionada || lojaEmFoco).telefone ? 'Falar com Atendimento' : 'Telefone não cadastrado'}
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
            <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="bg-[#0B1E14] p-5 text-white">
                    <h3 className="font-serif font-bold text-lg uppercase tracking-wide">Confirmar Participação</h3>
                    <p className="text-[10px] text-stone-300 mt-1">Revise os detalhes contratuais da cota antes de prosseguir.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Clube Vinculado</span>
                            <span className="text-xs font-bold text-[#0B1E14]">{modalAdesao.grupo.nome}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Valor da Mensalidade</span>
                            <span className="text-xs font-bold font-mono text-[#BD6B42]">R$ {Number(modalAdesao.grupo.valorParcela).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Duração do Contrato</span>
                            <span className="text-xs font-bold text-[#0B1E14]">{modalAdesao.grupo.duracaoMeses} Meses</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        <span className="text-blue-500 mt-0.5 text-xs font-bold">INFO</span>
                        <p className="text-[10px] text-stone-600 leading-relaxed">
                            Antes de confirmar a sua participação, e obrigatória a leitura do{' '}
                            <button onClick={() => window.open(`${API_URL}/api/lojas/${lojaEmFoco?.id}/regras`, '_blank')} className="text-blue-600 font-bold underline cursor-pointer">Regulamento Operacional da Loja</button>. Ao entrar no grupo, voce concorda legalmente com todos os termos estabelecidos pelo estabelecimento.
                        </p>
                    </div>
                </div>
                <div className="p-5 border-t border-stone-100 bg-stone-50 flex gap-3">
                    <button onClick={() => setModalAdesao({ aberto: false, grupo: null })} className="flex-1 py-3 border border-stone-200 text-stone-500 font-bold rounded-xl text-[10px] uppercase hover:bg-stone-100 transition-colors cursor-pointer">Cancelar</button>
                    <button onClick={confirmarAdesaoNoGrupo} className="flex-1 py-3 bg-[#0B1E14] text-white font-bold rounded-xl shadow-sm text-[10px] uppercase hover:bg-opacity-90 transition-all cursor-pointer">Aceitar e Participar</button>
                </div>
            </div>
        </div>
      )}

      {modalAcessoAberto && lojaParaAcesso && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-fadeIn text-left">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Autorização de Acesso</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Estabelecimento: {obterNomeLoja(lojaParaAcesso)}</p>
              </div>
              <button onClick={() => setModalAcessoAberto(false)} className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer px-2">X</button>
            </div>
            
            <div className="text-xs text-stone-600 leading-relaxed space-y-4">
                <p>Para visualizar os planos disponíveis e registrar cotas na <strong>{obterNomeLoja(lojaParaAcesso)}</strong>, o estabelecimento exige uma análise de crédito previa do seu CPF.</p>
                
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
                className="flex-1 py-3 border border-[#DFD9CE] rounded-xl text-stone-500 font-bold hover:bg-stone-50 transition-colors cursor-pointer text-xs uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSolicitarAcesso}
                disabled={solicitandoAcesso}
                className="flex-1 py-3 bg-[#0B1E14] text-white font-bold rounded-xl shadow-sm text-xs uppercase tracking-wider cursor-pointer hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                {solicitandoAcesso ? 'Enviando...' : 'Solicitar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalProduto.aberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
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
                placeholder="Ex: Geladeira Frost Free 400L"
                className="w-full h-[42px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-sm focus:outline-none focus:border-[#BD6B42]"
              />
            </div>

            <div className="flex space-x-2 pt-2 border-t w-full">
              <button
                type="button"
                onClick={() => setModalProduto({ aberto: false, cotaId: null })}
                className="flex-1 py-2.5 border rounded-xl text-stone-500 font-bold text-xs transition-colors hover:bg-stone-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarProduto}
                disabled={salvandoEtapa || produtoEscolhido.trim() === ''}
                className="flex-1 py-2.5 bg-[#BD6B42] text-white font-bold rounded-xl shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-[#A95A33] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvandoEtapa ? 'Salvando...' : 'Confirmar escolha'}
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

      {modalCheckoutAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Ambiente de Checkout Secure</h3>
              <button onClick={() => setModalCheckoutAberto(false)} className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer">X</button>
            </div>
            <CheckoutForm
              valorMensalidade={valorMensalidade}
              valorTotalRestante={totalObjetivo - saldoPoupanca}
              cotaId={clubeAtualSelecionado?.cotaId || clubeAtualSelecionado?.id || clubeAtualSelecionado?.numeroCota}
              onSuccess={atualizarSaldoAposPagamento}
              fecharModal={() => setModalCheckoutAberto(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}

function CheckoutForm({ 
  valorMensalidade, 
  valorTotalRestante, 
  cotaId, 
  onSuccess, 
  fecharModal 
}: { 
  valorMensalidade: number; 
  valorTotalRestante: number; 
  cotaId: number; 
  onSuccess: () => Promise<void> | void; 
  fecharModal: () => void 
}) {
  const [metodo, setMetodo] = useState<'pix' | 'recorrente' | 'credito_total' | 'debito'>('pix');
  const [dadosPix, setDadosPix] = useState<{ paymentUrl: string } | null>(null);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);
  const [carregandoPix, setCarregandoPix] = useState(false);

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
  }, [valorCobrado, cotaId, metodo]);

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

    const endpoint = metodo === 'recorrente' ? '/api/pagamentos/assinatura-cartao' : '/api/pagamentos/cartao-unico';
    const tipoCobranca = metodo === 'credito_total' ? 'CREDIT_CARD' : 'DEBIT_CARD';

    const payload = metodo === 'recorrente' ? {
      cotaId,
      valor: valorCobrado,
      numeroCartao: numeroCartao.replace(/\D/g, ''),
      nomeImpressoCartao: nomeImpresso.toUpperCase(),
      mesValidade: mesAno[0],
      anoValidade: '20' + mesAno[1],
      ccv: ccv.replace(/\D/g, '')
    } : {
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
              fecharModal();
            }}
            className="w-full py-3.5 bg-[#0B1E14] text-white font-bold text-[10px] rounded-xl uppercase tracking-wider cursor-pointer"
          >
            Já paguei · Conferir meu saldo
          </button>
          <button
            type="button"
            onClick={fecharModal}
            className="w-full py-3 border border-[#DFD9CE] text-stone-500 font-bold text-[10px] rounded-xl uppercase tracking-wider cursor-pointer hover:bg-stone-50"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-[#0B1E14]">
      <div className="grid grid-cols-4 gap-1 bg-stone-100 p-1 rounded-xl text-[9px] font-bold uppercase tracking-wider">
        <button type="button" onClick={() => setMetodo('pix')} className={`py-2 rounded-lg transition-colors cursor-pointer ${metodo === 'pix' ? 'bg-[#0B1E14] text-white shadow' : 'text-stone-500'}`}>Pix</button>
        <button type="button" onClick={() => setMetodo('recorrente')} className={`py-2 rounded-lg transition-colors cursor-pointer ${metodo === 'recorrente' ? 'bg-[#0B1E14] text-white shadow' : 'text-stone-500'}`}>Mensal</button>
        <button type="button" onClick={() => setMetodo('credito_total')} className={`py-2 rounded-lg transition-colors cursor-pointer ${metodo === 'credito_total' ? 'bg-[#0B1E14] text-white shadow' : 'text-stone-500'}`}>Crédito</button>
        <button type="button" onClick={() => setMetodo('debito')} className={`py-2 rounded-lg transition-colors cursor-pointer ${metodo === 'debito' ? 'bg-[#0B1E14] text-white shadow' : 'text-stone-500'}`}>Débito</button>
      </div>

      <div className="flex justify-between items-center bg-stone-50 border border-stone-200 p-3 rounded-xl">
         <span className="text-[10px] font-bold uppercase text-stone-500">Valor a ser cobrado:</span>
         <span className="text-sm font-mono font-bold text-[#BD6B42]">
           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorCobrado)}
         </span>
      </div>

      {metodo === 'pix' && (
        <div className="text-center space-y-4 pt-2">
          <div className="p-5 bg-stone-50 border border-dashed border-[#DFD9CE] rounded-2xl text-center text-xs min-h-[100px] flex items-center justify-center">
            {carregandoPix ? (
              <span className="animate-pulse block font-bold text-stone-400">Gerando link de checkout seguro...</span>
            ) : dadosPix?.paymentUrl ? (
              <div className="space-y-1.5">
                <p className="text-[11px] text-emerald-700 font-bold">Cobrança gerada no Asaas!</p>
                <p className="text-[10px] text-stone-400 font-medium">Clique no botão abaixo para concluir o Pix.</p>
              </div>
            ) : (
              <span className="block font-semibold text-rose-500 leading-relaxed">Não foi possível gerar a fatura. Tente novamente.</span>
            )}
          </div>

          <button
            type="button"
            disabled={!dadosPix?.paymentUrl}
            onClick={() => {
              if (dadosPix?.paymentUrl) {
                window.open(dadosPix.paymentUrl, '_blank');
                // Abrir a tela do banco nao e pagar. A cliente volta para ca e
                // confere quando quiser; quem confirma e o banco.
                setAguardandoConfirmacao(true);
              }
            }}
            className="w-full py-3.5 bg-[#0B1E14] text-white font-bold text-xs rounded-xl tracking-wide cursor-pointer uppercase text-[10px] disabled:opacity-40 transition-opacity"
          >
            {carregandoPix ? 'Processando...' : 'Pagar via Pix Seguro'}
          </button>
        </div>
      )}

      {metodo !== 'pix' && (
        <form onSubmit={handlePagamentoCartao} className="space-y-3 pt-2 text-left text-xs">
          <div className="bg-[#F5F2EB] p-3 rounded-xl text-center text-[10px] text-[#BD6B42] font-medium leading-relaxed border border-[#DFD9CE]">
            {metodo === 'recorrente' ? (
              <span>Seu limite <strong>não será bloqueado no valor total</strong>. O sistema cobrará R$ {valorCobrado.toFixed(2)} mensalmente.</span>
            ) : metodo === 'credito_total' ? (
              <span>Transação à vista consumindo <strong>R$ {valorCobrado.toFixed(2)}</strong> do seu limite com repasse imediato à loja.</span>
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
            <label className="block text-[9px] font-bold uppercase text-stone-500 mb-1">Número do Cartão</label>
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
            <label className="block text-[9px] font-bold uppercase text-stone-500 mb-1">Nome Impresso no Cartão</label>
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
            className="w-full h-12 mt-4 bg-[#BD6B42] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider hover:bg-[#A95A33] transition-all disabled:opacity-50 cursor-pointer shadow-md"
          >
            {processando ? 'Processando...' : metodo === 'recorrente' ? 'Ativar Assinatura Mensal' : 'Confirmar Pagamento'}
          </button>
        </form>
      )}
    </div>
  );
}