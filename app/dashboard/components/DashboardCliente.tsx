'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Configuração da URL da API vinda do .env.local
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

export default function DashboardCliente({ usuario: usuarioInicial }: { usuario: any }) {
  const router = useRouter();
  
  const [usuario, setUsuario] = useState(usuarioInicial);
  
  const [nomeInput, setNomeInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [cpfInput, setCpfInput] = useState('');
  const [telefoneInput, setTelefoneInput] = useState(''); 
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  // Estados para Alteração de Senha
  const [senhaAtualInput, setSenhaAtualInput] = useState('');
  const [novaSenhaInput, setNovaSenhaInput] = useState('');
  const [confirmarNovaSenhaInput, setConfirmarNovaSenhaInput] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [statusSalvarSenha, setStatusSalvarSenha] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);

  const [abaAtiva, setAbaAtiva] = useState<'inicio' | 'extrato' | 'regras' | 'ajuda' | 'perfil'>('inicio');
  const [saldoPoupanca, setSaldoPoupanca] = useState<number>(0);
  const [modalCheckoutAberto, setModalCheckoutAberto] = useState(false);

  const [lojas, setLojas] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  
  const [lojaSelecionada, setLojaSelecionada] = useState<any | null>(null);
  const [grupoSelecionado, setGrupoSelecionado] = useState<any | null>(null);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false);
  const [erroConexao, setErroConexao] = useState(false);

  const [dropdownLojaAberto, setDropdownLojaAberto] = useState(false);

  const [clubesAtivos, setClubesAtivos] = useState<any[]>([]);
  const [clubeAtualSelecionado, setClubeAtualSelecionado] = useState<any | null>(null);

  const [exibindoPaginaClube, setExibindoPaginaClube] = useState(false);

  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true); 
  const [statusSalvar, setStatusSalvar] = useState<'sucesso' | 'erro' | null>(null);

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

  // 🚀 Função para tratar e obter o Nome Comercial da Loja com segurança
  const obterNomeLoja = (lojaObj: any) => {
    if (!lojaObj) return 'Loja Parceira';
    const nome = lojaObj.nomeComercial || lojaObj.nome || lojaObj.nomeLoja || lojaObj.razaoSocial || lojaObj.nome_comercial;
    if (nome && nome.trim().length > 0 && !nome.toLowerCase().includes('unidade parceira')) {
      return nome;
    }
    return `Loja #${lojaObj.id || ''}`;
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
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    let ano = hoje.getFullYear();
    let mes = hoje.getMonth() + 1;

    if (diaAtual > 10) {
      mes += 1;
      if (mes > 12) { mes = 1; ano += 1; }
    }

    const dataVencimento = new Date(ano, mes - 1, 10);
    const diffTime = dataVencimento.getTime() - hoje.getTime();
    const diasCalculados = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    setDiasRestantesVencimento(diasCalculados);
    setDataVencimentoCota(`10/${mes < 10 ? '0' + mes : mes}/${ano}`);

    if ([1, 5, 8, 9, 10].includes(diaAtual) && diaAtual <= 10) {
      setExibirBannerAlerta(true);
    } else {
      setExibirBannerAlerta(false);
    }
  }, [abaAtiva]);

  const buscarCarteiraDeClubes = (forcedId?: number, fallbackUserId?: number) => {
    const userId = fallbackUserId || usuario?.id;
    if (!userId) return;

    fetch(`${API_URL}/api/usuarios/${userId}/clubes-ativos`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setClubesAtivos(data);
          if (data.length > 0) {
            const clubeParaFocar = forcedId ? data.find(c => c.grupo.id === forcedId) || data[0] : data[0];
            setClubeAtualSelecionado(clubeParaFocar);
            setLojaSelecionada(clubeParaFocar.loja);
            setGrupoSelecionado(clubeParaFocar.grupo);
            setSaldoPoupanca(Number(clubeParaFocar.saldoPoupanca) || 0);
          } else {
            setClubeAtualSelecionado(null);
            setLojaSelecionada(null);
            setGrupoSelecionado(null);
            setSaldoPoupanca(0);
          }
        }
      })
      .catch(() => {
        setClubesAtivos([]);
      });
  };

  const handleMudarClubeEmExibicao = (clube: any) => {
    setClubeAtualSelecionado(clube);
    setLojaSelecionada(clube.loja);
    setGrupoSelecionado(clube.grupo);
    setSaldoPoupanca(Number(clube.saldoPoupanca) || 0);
    setExibindoPaginaClube(true); 
  };

  useEffect(() => {
    let currentUserId = usuario?.id;

    if (!currentUserId) {
      const usuarioLogado = localStorage.getItem('@avle:usuario');
      if (usuarioLogado) {
        const user = JSON.parse(usuarioLogado);
        setUsuario(user);
        currentUserId = user.id;
      }
    }

    if (currentUserId) {
      buscarCarteiraDeClubes(undefined, currentUserId);

      fetch(`${API_URL}/api/usuarios/${currentUserId}`)
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
          }
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setCarregandoDados(false); 
        });
    }

    // Busca com fallback resiliente para lista de lojas
    fetch(`${API_URL}/api/lojas/listar-todas`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setLojas(data);
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

  const handleSelecionarLojaCustom = (loja: any) => {
    setLojaSelecionada(loja);
    setDropdownLojaAberto(false);
    setGrupos([]);
    setCarregandoOpcoes(true);

    fetch(`${API_URL}/api/grupos/loja/${loja.id}`)
      .then((res) => res.json())
      .then((data) => setGrupos(data))
      .catch(() => setGrupos([]))
      .finally(() => setCarregandoOpcoes(false));
  };

  const handlePersistirClubeNoBanco = async (grupo: any) => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios/${usuario?.id}/vincular-clube`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lojaId: Number(lojaSelecionada?.id),
          grupoId: Number(grupo?.id)
        })
      });

      if (!res.ok) throw new Error();
      buscarCarteiraDeClubes(grupo.id); 
    } catch {
      console.error('Falha ao registrar vinculo da cota.');
    }
  };

  const atualizarSaldoAposPagamento = () => {
    setSaldoPoupanca((prev) => prev + valorMensalidade);
    setClubesAtivos(prev => prev.map(c => 
      c.cotaId === clubeAtualSelecionado?.cotaId 
        ? { ...c, saldoPoupanca: c.saldoPoupanca + valorMensalidade } 
        : c
    ));
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const arquivo = e.target.files[0];
      
      if (!arquivo.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      if (arquivo.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB.');
        return;
      }

      const leitor = new FileReader();
      leitor.onloadend = async () => {
        const base64String = leitor.result as string;

        try {
          const res = await fetch(`${API_URL}/api/usuarios/${usuario?.id}/foto`, {
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
          console.error(err);
          alert("Não foi possível salvar sua foto de perfil.");
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
      const res = await fetch(`${API_URL}/api/usuarios/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome: nomeInput, 
          email: emailInput, 
          telefone: telefoneInput.replace(/\D/g, '') 
        }),
      });
      
      if (!res.ok) throw new Error();

      const usuarioAtualizado = { 
        ...usuario, 
        nome: nomeInput, 
        email: emailInput, 
        telefone: telefoneInput.replace(/\D/g, '') 
      };
      setUsuario(usuarioAtualizado);
      localStorage.setItem('@avle:usuario', JSON.stringify(usuarioAtualizado));
      setStatusSalvar('sucesso');
    } catch (err) {
      console.error(err);
      setStatusSalvar('erro');
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusSalvarSenha(null);

    if (novaSenhaInput !== confirmarNovaSenhaInput) {
      setStatusSalvarSenha({ tipo: 'erro', mensagem: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    if (novaSenhaInput.length < 6) {
      setStatusSalvarSenha({ tipo: 'erro', mensagem: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    setSalvandoSenha(true);

    const localUserStorage = localStorage.getItem('@avle:usuario');
    const parsedUser = localUserStorage ? JSON.parse(localUserStorage) : null;
    const userId = usuario?.id || parsedUser?.id;

    if (!userId) {
      setStatusSalvarSenha({ tipo: 'erro', mensagem: 'Usuário não identificado.' });
      setSalvandoSenha(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/usuarios/${userId}/alterar-senha`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senhaAtual: senhaAtualInput,
          novaSenha: novaSenhaInput
        })
      });

      if (!res.ok) {
        const textoErro = await res.text();
        throw new Error(textoErro || 'Erro ao alterar a senha.');
      }

      setStatusSalvarSenha({ tipo: 'sucesso', mensagem: 'Sua senha foi alterada com sucesso!' });
      setSenhaAtualInput('');
      setNovaSenhaInput('');
      setConfirmarNovaSenhaInput('');
    } catch (err: any) {
      setStatusSalvarSenha({ tipo: 'erro', mensagem: err.message || 'Falha ao alterar senha.' });
    } finally {
      setSalvandoSenha(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-[#0B1E14] bg-[#F0F2F5]">
      
      <aside className="w-full md:w-64 bg-[#0B1E14] text-[#E3EAE6] flex flex-col justify-between p-6 flex-shrink-0">
        <div>
          <div className="flex flex-col items-center text-center pb-6 border-b border-white/10 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#EFEAE2] flex items-center justify-center overflow-hidden font-bold text-xl text-[#0B1E14] shadow-md cursor-pointer hover:scale-105 transition-all" onClick={() => { setAbaAtiva('perfil'); setExibindoPaginaClube(false); setStatusSalvar(null); setStatusSalvarSenha(null); }}>
              {fotoPerfil ? (
                <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                usuario?.nome ? usuario.nome.substring(0,2).toUpperCase() : 'AV'
              )}
            </div>
            <h3 className="text-white font-bold text-sm tracking-wide mt-3 uppercase">{usuario?.nome || 'Painel Cliente'}</h3>
            <p className="text-[11px] text-stone-400 truncate max-w-[180px] mt-0.5">{usuario?.email}</p>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'inicio', label: 'Home / Meus Clubes' },
              { id: 'extrato', label: 'Histórico Geral' },
              { id: 'regras', label: 'Regulamento' },
              { id: 'ajuda', label: 'Suporte' }
            ].map((aba) => (
              <button
                key={aba.id}
                onClick={() => { setAbaAtiva(aba.id as any); if(aba.id !== 'inicio') setExibindoPaginaClube(false); setStatusSalvar(null); setStatusSalvarSenha(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  abaAtiva === aba.id ? 'bg-white/10 text-white font-bold' : 'hover:bg-white/5 opacity-75'
                }`}
              >
                {aba.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
          <button onClick={() => { setAbaAtiva('perfil'); setExibindoPaginaClube(false); setStatusSalvar(null); setStatusSalvarSenha(null); }} className={`hover:text-white transition-all font-semibold cursor-pointer ${abaAtiva === 'perfil' ? 'text-white underline' : 'text-stone-400'}`}>Configurações</button>
          <button onClick={() => { localStorage.removeItem('@avle:usuario'); router.push('/'); }} className="text-stone-400 hover:text-red-400 font-bold cursor-pointer">Sair</button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 max-w-7xl overflow-x-hidden space-y-6">
        
        {abaAtiva === 'inicio' && (
          <div className="space-y-6 animate-fadeIn">
            
            {!exibindoPaginaClube ? (
              <div className="space-y-6 text-left">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wide text-stone-400">Meus Clubes Ativos</h2>
                  <p className="text-xs text-stone-400">Clique em qualquer comunidade de compras abaixo para acessar a pagina interna sucessiva.</p>
                </div>

                {clubesAtivos.length === 0 ? (
                  <div className="bg-white border border-dashed border-[#DFD9CE] rounded-2xl p-8 text-center text-xs text-stone-400 font-medium">
                    Você ainda não está participando de nenhum clube. Selecione um estabelecimento abaixo para começar!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clubesAtivos.map((clube) => {
                      const objTotal = Number(clube.grupo.valorParcela) * Number(clube.grupo.duracaoMeses);
                      const perc = objTotal > 0 ? Math.min(Math.round((clube.saldoPoupanca / objTotal) * 100), 100) : 0;
                      return (
                        <div
                          key={clube.cotaId}
                          onClick={() => handleMudarClubeEmExibicao(clube)}
                          className="bg-white border border-[#DFD9CE] rounded-2xl p-5 shadow-xs hover:border-[#BD6B42] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-serif font-bold text-base text-[#0B1E14] group-hover:text-[#BD6B42] transition-colors">{clube.grupo.nome}</h3>
                              <p className="text-[10px] font-mono text-stone-400 mt-0.5">Loja: <strong className="text-stone-600 font-bold">{obterNomeLoja(clube.loja)}</strong></p>
                            </div>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-stone-50 border text-stone-500">
                              Cota #0{clube.cotaId}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-stone-400">
                              <span>Progresso</span>
                              <span>{perc}%</span>
                            </div>
                            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-[#BD6B42] h-full transition-all" style={{ width: `${perc}%` }}></div>
                            </div>
                          </div>

                          <div className="text-[10px] text-[#BD6B42] font-bold uppercase tracking-wider text-right group-hover:translate-x-1 transition-transform">
                            Acessar Pagina do Clube
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="border-t border-[#DFD9CE] pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* BLOCO: DESCOBRIR OUTRA LOJA PARCEIRA */}
                  <div className="bg-white border border-[#DFD9CE] rounded-xl p-5 shadow-xs space-y-3 relative">
                    <label className="block text-[10px] text-stone-400 font-bold uppercase tracking-wide">Descobrir Outra Loja Parceira</label>
                    
                    <button 
                      type="button" 
                      onClick={() => setDropdownLojaAberto(!dropdownLojaAberto)} 
                      className="w-full h-[42px] px-3 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl flex items-center justify-between text-[#0B1E14] font-bold text-xs cursor-pointer hover:border-[#BD6B42] transition-colors"
                    >
                      <span className="truncate">
                        {lojaSelecionada ? obterNomeLoja(lojaSelecionada) : 'Selecione uma loja...'}
                      </span>
                      <span className="text-[10px] text-stone-400 underline">Filtrar</span>
                    </button>

                    {dropdownLojaAberto && (
                      <div className="absolute left-0 right-0 top-[80px] bg-white border border-[#DFD9CE] rounded-xl max-h-48 overflow-y-auto divide-y divide-[#DFD9CE] shadow-lg z-30">
                        {lojas.length === 0 ? (
                          <div className="px-3 py-2.5 text-xs text-stone-400 italic">
                            Nenhuma loja encontrada.
                          </div>
                        ) : (
                          lojas.map((l: any) => {
                            const nomeExibicao = obterNomeLoja(l);
                            return (
                              <button 
                                key={l.id} 
                                type="button" 
                                onClick={() => handleSelecionarLojaCustom(l)} 
                                className="w-full text-left px-3 py-2.5 text-xs text-[#0B1E14] hover:bg-[#F5F2EB] transition-all font-bold block"
                              >
                                {nomeExibicao}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {lojaSelecionada && (
                    <div className="md:col-span-2 bg-white border border-[#DFD9CE] rounded-xl p-5 shadow-xs space-y-3 animate-fadeIn">
                      <label className="block text-[10px] text-stone-400 font-bold uppercase tracking-wide">Planos Disponiveis (Toque para Entrar no Grupo)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {grupos.map((g: any) => {
                          const jaPossuiCota = clubesAtivos.some(c => c.grupo.id === g.id);
                          return (
                            <button key={g.id} type="button" onClick={() => handlePersistirClubeNoBanco(g)} className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between gap-1 cursor-pointer ${jaPossuiCota ? 'border-emerald-600 bg-emerald-50/40' : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'}`}>
                              <div className="flex justify-between w-full font-bold">
                                <span className="truncate">{g.nome}</span>
                                <span className="text-[#BD6B42]">R$ {Number(g.valorParcela).toFixed(2)}</span>
                              </div>
                              <div className="text-[10px] flex justify-between w-full font-medium text-stone-400">
                                <span>Vigencia: {g.duracaoMeses} Meses</span>
                                {jaPossuiCota && <span className="text-emerald-700 font-bold">Ja participando</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              
              <div className="space-y-6 animate-fadeIn text-left">
                <button 
                  onClick={() => setExibindoPaginaClube(false)}
                  className="text-xs font-bold text-stone-500 hover:text-[#0B1E14] bg-white border border-[#E6E2D8] px-4 py-2 rounded-xl cursor-pointer shadow-xs transition-all"
                >
                  Voltar para Meus Clubes
                </button>

                <div className="bg-white border border-[#DFD9CE] p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#BD6B42] uppercase bg-[#F5F2EB] px-2 py-1 rounded">Visualizacao do Plano Ativo</span>
                    <h2 className="text-xl font-serif font-bold text-[#0B1E14] mt-1.5">{grupoSelecionado?.nome}</h2>
                    <p className="text-xs text-stone-400 mt-0.5">Estabelecimento: <strong className="text-stone-700 font-bold">{obterNomeLoja(lojaSelecionada)}</strong> | Cota: #0{clubeAtualSelecionado?.cotaId}</p>
                  </div>
                  {clubesAtivos.length > 1 && (
                    <button 
                      onClick={() => setExibindoPaginaClube(false)}
                      className="text-[10px] uppercase font-bold border px-3 py-2 bg-stone-50 rounded-xl text-stone-500 hover:text-[#BD6B42]"
                    >
                      Alternar de Grupo
                    </button>
                  )}
                </div>

                {grupoSelecionado && etapaAtual !== 4 && exibirBannerAlerta && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      Aviso: Sua proxima parcela vence in <strong>{dataVencimentoCota}</strong> (restam {diasRestantesVencimento} dias). Mantenha sua cota ativa para os sorteios.
                    </p>
                    <button onClick={() => setModalCheckoutAberto(true)} className="px-4 py-2 bg-amber-950 text-white text-[11px] font-bold rounded-lg uppercase tracking-wide whitespace-nowrap">
                      Regularizar Cota
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#0B1E14] text-white p-5 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Saldo Poupanca Individual</span>
                    <span className="text-2xl font-bold tracking-tight block mt-2 font-mono">R$ {saldoPoupanca.toFixed(2)}</span>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Vencimento da Parcela</span>
                    <span className="text-2xl font-bold text-[#BD6B42] block mt-2 font-mono">{dataVencimentoCota || '--/--'}</span>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Vigencia de Sorteios</span>
                    <span className="text-2xl font-bold text-[#0B1E14] block mt-2 font-mono">{grupoSelecionado?.duracaoMeses || 0} Meses</span>
                  </div>
                  <div className="bg-white border border-[#E6E2D8] p-5 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Aptidao Coletiva</span>
                    <span className="text-2xl font-bold text-emerald-600 block mt-2 uppercase tracking-wide text-sm font-semibold">Fase 0{etapaAtual}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white border border-[#E6E2D8] rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[260px]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Historico de Quitacao da Cota</span>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-bold font-mono">Evolucao</span>
                    </div>
                    <div className="flex items-end justify-between h-40 pt-4 border-b border-stone-100 px-2">
                      {['Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6', 'Mes 7'].map((mes, i) => {
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
                      Meta Coletiva: <span className="font-mono text-[#0B1E14] font-bold">R$ {totalObjetivo.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#DFD9CE] rounded-xl shadow-xs overflow-hidden">
                  <div className="px-5 py-4 border-b bg-stone-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1E14]">Regua de Vencimentos desta Cota</h3>
                    {etapaAtual !== 4 && (
                      <button 
                        onClick={() => setModalCheckoutAberto(true)}
                        className="bg-[#0B1E14] text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-opacity-90"
                      >
                        Liquidar Parcela via Pix
                      </button>
                    )}
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 text-stone-400 font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                        <th className="py-3.5 px-5">VENCIMENTO</th>
                        <th className="py-3.5 px-5">DESCRIÇÃO</th>
                        <th className="py-3.5 px-5 text-right">VALOR REQUERIDO</th>
                        <th className="py-3.5 px-5 text-center">SITUAÇÃO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                      {saldoPoupanca === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-stone-400 italic">Nenhum aporte registrado nesta conta ainda.</td></tr>
                      ) : (
                        Array.from({ length: Math.ceil(saldoPoupanca / valorMensalidade) }).map((_, index) => (
                          <tr key={index} className="hover:bg-stone-50/50 transition-all">
                            <td className="py-3.5 px-5 text-stone-400">{dataVencimentoCota}</td>
                            <td className="py-3.5 px-5 text-[#0B1E14] font-bold">Mensalidade Coletiva (Parcela 0{index + 1})</td>
                            <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-700">R$ {valorMensalidade.toFixed(2)}</td>
                            <td className="py-3.5 px-5 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[9px] uppercase">
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
              <table className="w-full text-left text-xs border-collapse">
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
        )}

        {abaAtiva === 'regras' && (
          <div className="bg-white border border-[#DFD9CE] rounded-xl p-6 space-y-4 text-xs text-stone-600 leading-relaxed animate-fadeIn text-left max-w-2xl shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-[#0B1E14] font-serif uppercase tracking-wide">Regulamento AVLE</h3>
              <p className="text-stone-400 mt-1">Confira as diretrizes da comunidade estruturada de compras programadas de móveis e decorações.</p>
            </div>
            
            <p className="bg-stone-50 p-3 rounded-xl border border-dashed text-stone-500">
              * Compra Planejada: A AVLE nao atua como consorcio tradicional ou fundo financeiro. Trata-se de uma comunidade estruturada de compras programadas de moveis e decoracoes corporativas ou residenciais.
            </p>

            {lojaSelecionada ? (
              <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-[#0B1E14] uppercase text-[11px]">Termos Específicos da Unidade</h4>
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
                * Acesse um dos seus clubes ativos na aba inicial para habilitar a visualização do documento de termos específicos em PDF desta unidade parceira.
              </p>
            )}
          </div>
        )}

        {abaAtiva === 'perfil' && (
          <div className="space-y-6 max-w-2xl text-left animate-fadeIn">
            
            {/* CARTÃO 1: DADOS CADASTRAIS */}
            <div className="bg-white border border-[#DFD9CE] rounded-2xl p-6 md:p-8 space-y-6 shadow-xs">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Meus Dados Cadastrais</h2>
                <p className="text-xs text-stone-400 mt-1">Gerencie suas informacoes de conta salvas na plataforma e sincronizadas com o gateway do Asaas.</p>
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
                  <p className="text-[11px] text-stone-400 mt-0.5">Selecione uma imagem quadrada de ate 2MB nos formatos comuns de imagem.</p>
                </div>
              </div>

              <form onSubmit={handleSalvarPerfil} className="space-y-5 text-xs">
                {statusSalvar === 'sucesso' && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl">
                    Alteracoes gravadas com sucesso no sistema!
                  </div>
                )}
                {statusSalvar === 'erro' && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 font-bold rounded-xl">
                    Não foi possível salvar as alterações. Tente novamente mais tarde.
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
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">E-mail de Notificacao</label>
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
                    <span className="text-xs text-[#0B1E14]" title="Informacao imutavel por seguranca contratual">Protegido</span>
                  </label>
                  <input 
                    type="text" 
                    value={carregandoDados ? "Aguardando carregamento do perfil..." : (cpfInput || "Sem documento cadastrado")} 
                    disabled
                    placeholder="Aguardando carregamento do perfil..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-100 text-stone-500 h-[40px] text-sm font-mono cursor-not-allowed font-bold" 
                  />
                  <p className="text-[10px] text-stone-400 leading-relaxed pt-1">
                    * Este documento esta atrelado as faturas e regras de sorteio coletivo. Alteracoes cadastrais exigem auditoria direta com o administrador.
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button 
                    type="submit" 
                    disabled={carregandoDados || salvandoPerfil}
                    className="px-6 py-3 bg-[#0B1E14] text-white font-bold rounded-xl shadow-sm text-[10px] uppercase tracking-wider cursor-pointer hover:bg-opacity-90 disabled:opacity-50 transition-all"
                  >
                    {salvandoPerfil ? 'Salvando...' : 'Salvar Novas Informacoes'}
                  </button>
                </div>
              </form>
            </div>

            {/* CARTÃO 2: ALTERAÇÃO DE SENHA */}
            <div className="bg-white border border-[#DFD9CE] rounded-2xl p-6 md:p-8 space-y-5 shadow-xs">
              <div>
                <h3 className="text-base font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Segurança da Conta & Alteração de Senha</h3>
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
                  <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">Senha Atual (ou Senha Padrão Inicial)</label>
                  <input 
                    type="password" 
                    placeholder="Digite sua senha atual ou Avle123"
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
              
              {/* 1. SUPORTE DA PLATAFORMA (TÉCNICO / SITE) */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#0B1E14]/10 text-[#0B1E14] uppercase">
                    Suporte do Site
                  </span>
                  <h4 className="font-bold text-[#0B1E14] text-xs mt-2 uppercase">Atendimento Técnico</h4>
                  <p className="text-stone-400 text-[11px] mt-1 leading-relaxed">
                    Para dúvidas sobre acesso à conta, faturas Pix, dificuldades de navegação, atualização de dados pessoais ou instabilidades no sistema.
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-200/60">
                  <p className="text-stone-500 font-bold text-xs font-mono mb-2">(42) 98411-7768</p>
                  <button 
                    type="button"
                    onClick={() => window.open('https://wa.me/5542984117768', '_blank')}
                    className="w-full text-center py-2.5 bg-[#0B1E14] text-white font-bold rounded-lg text-[10px] uppercase tracking-wider hover:bg-opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Chamar Suporte Técnico
                  </button>
                </div>
              </div>

              {/* 2. SUPORTE DA LOJA PARCEIRA */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
                {lojaSelecionada ? (
                  <>
                    <div>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#BD6B42]/10 text-[#BD6B42] uppercase">
                        Suporte da Loja
                      </span>
                      <h4 className="font-bold text-[#0B1E14] text-xs mt-2 uppercase truncate max-w-[180px]">
                        {obterNomeLoja(lojaSelecionada)}
                      </h4>
                      <p className="text-stone-400 text-[11px] mt-1 leading-relaxed">
                        Para tratar diretamente sobre especificações de produtos, datas de assembleias locais, andamento de entregas ou retiradas de mercadorias.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-stone-200/60">
                      <p className="text-stone-500 font-bold text-xs font-mono mb-2">
                        {lojaSelecionada.telefone ? aplicarMascaraTelefone(lojaSelecionada.telefone) : 'Contato no estabelecimento'}
                      </p>
                      <button 
                        type="button"
                        disabled={!lojaSelecionada.telefone}
                        onClick={() => {
                          if (lojaSelecionada.telefone) {
                            const numLimpo = lojaSelecionada.telefone.replace(/\D/g, '');
                            window.open(`https://wa.me/55${numLimpo}`, '_blank');
                          }
                        }}
                        className="w-full text-center py-2.5 bg-[#BD6B42] text-white font-bold rounded-lg text-[10px] uppercase tracking-wider hover:bg-opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {lojaSelecionada.telefone ? 'Falar com Atendimento' : 'Telefone não cadastrado'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-center p-4">
                    <p className="text-[11px] text-stone-400 font-medium italic leading-relaxed">
                      Acesse um de seus clubes ativos na página inicial para visualizar as opções de contato direto e suporte da loja parceira correspondente.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>

      {modalCheckoutAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Ambiente de Checkout Secure</h3>
              <button onClick={() => setModalCheckoutAberto(false)} className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer">X</button>
            </div>
            <CheckoutForm 
              valor={valorMensalidade} 
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

function CheckoutForm({ valor, cotaId, onSuccess, fecharModal }: { valor: number; cotaId: number; onSuccess: () => void; fecharModal: () => void }) {
  const [dadosPix, setDadosPix] = useState<{ paymentUrl: string } | null>(null);
  const [carregandoPix, setCarregandoPix] = useState(false);

  useEffect(() => {
    if (!cotaId) return;
    setCarregandoPix(true);
    fetch(`${API_URL}/api/pagamentos/gerar-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor, cotaId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setDadosPix(data))
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setCarregandoPix(false));
  }, [valor, cotaId]);

  return (
    <div className="space-y-5 text-[#0B1E14]">
      <div className="bg-[#F5F2EB] p-3 rounded-xl text-center text-xs font-bold border border-[#DFD9CE]">
        Fatura Instantanea via PIX
      </div>
      <div className="text-center space-y-4 pt-2">
        <div className="p-5 bg-stone-50 border border-dashed border-[#DFD9CE] rounded-2xl text-center text-xs min-h-[100px] flex items-center justify-center">
          {carregandoPix ? (
            <span className="animate-pulse block font-bold text-stone-400">Gerando link de checkout seguro...</span>
          ) : dadosPix?.paymentUrl ? (
            <div className="space-y-1.5">
              <p className="text-[11px] text-emerald-700 font-bold">Processamento concluido com sucesso!</p>
              <p className="text-[10px] text-stone-400 font-medium">Clique no botao abaixo para abrir o ambiente de pagamento seguro e concluir o seu Pix.</p>
            </div>
          ) : (
            <span className="block font-semibold text-rose-500 leading-relaxed">
              Nao foi possivel gerar a sua faturamento Pix neste momento. Por favor, tente novamente em instantes ou entre em contato com o nosso suporte.
            </span>
          )}
        </div>
        
        <button 
          type="button" 
          disabled={!dadosPix?.paymentUrl} 
          onClick={() => { 
            if (dadosPix?.paymentUrl) { 
              window.open(dadosPix.paymentUrl, '_blank');
              onSuccess(); 
              fecharModal();
            } 
          }} 
          className="w-full py-3.5 bg-[#0B1E14] text-white font-bold text-xs rounded-xl tracking-wide cursor-pointer uppercase text-[10px] disabled:opacity-40 transition-opacity"
        >
          {carregandoPix ? 'Processando...' : 'Ir para o Pagamento Seguro'}
        </button>
      </div>
    </div>
  );
}