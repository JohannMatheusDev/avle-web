'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  cpfValido,
  identificadorLoginValido,
  requisitosSenha,
  senhaForte as avaliarSenhaForte,
  somenteDigitos,
  telefoneValido,
} from './lib/validacao';
import TelaCarregamento from './dashboard/components/TelaCarregamento';
import { apiFetch } from './lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

export default function Home() {
  const [status, setStatus] = useState<'inicial' | 'intro' | 'login'>('inicial');

  useEffect(() => {
    const jaVisualizou = sessionStorage.getItem('@avle:splash-visualizado');

    if (jaVisualizou === 'true') {
      setStatus('login');
    } else {
      setStatus('intro');
    }
  }, []);

  const handleFinalizarCarregamento = () => {
    sessionStorage.setItem('@avle:splash-visualizado', 'true');
    setStatus('login');
  };

  if (status === 'inicial') {
    return <div className="min-h-screen bg-[#F5F2EB]" />;
  }

  return (
    <>
      {status === 'intro' && <TelaCarregamento onFinalizado={handleFinalizarCarregamento} />}

      <div className={status !== 'login' ? 'hidden' : 'block'}>
        <Autenticacao />
      </div>
    </>
  );
}

function Autenticacao() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [isVerificando, setIsVerificando] = useState(false);

  // Entrada sem senha: a pessoa pede um codigo e o troca pela sessao.
  const [isLoginPorCodigo, setIsLoginPorCodigo] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [destinoCodigo, setDestinoCodigo] = useState('');
  const [codigoAcesso, setCodigoAcesso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [statusConexao, setStatusConexao] = useState('CONECTANDO...');

  const [isEsqueceuSenha, setIsEsqueceuSenha] = useState(false);
  const [isResetandoSenha, setIsResetandoSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);

  const [tipoUsuario, setTipoUsuario] = useState('CLIENTE');
  
  const [identificadorLogin, setIdentificadorLogin] = useState(''); 
  const [emailCadastro, setEmailCadastro] = useState('');
  const [telefoneCadastro, setTelefoneCadastro] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  // Para onde o codigo de verificacao foi. Antes era o telefone; agora e o
  // e-mail, que e o canal por onde o codigo sai de fato.
  const [emailVerificacao, setEmailVerificacao] = useState('');
  const [reenviandoCodigo, setReenviandoCodigo] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  const [cep, setCep] = useState('');
  const [faturamento, setFaturamento] = useState('');
  const [walletIdInput, setWalletIdInput] = useState(''); 
  
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [modalTermosAberto, setModalTermosAberto] = useState(false);
  
  // CORREÇÃO: Variável unificada para controlar a visualização da senha no login/cadastro
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [lembrarSenha, setLembrarSenha] = useState(false);

  // "Lembrar de mim" guarda apenas o e-mail ou telefone usado para entrar, nunca
  // a senha: preenche o campo na próxima visita sem deixar credencial gravada no
  // aparelho, que pode ser compartilhado. Antes o checkbox era enviado no
  // payload do login e o servidor simplesmente ignorava, então não fazia nada.
  useEffect(() => {
    const identificadorGuardado = localStorage.getItem('@avle:identificador_lembrado');
    if (identificadorGuardado) {
      setIdentificadorLogin(identificadorGuardado);
      setLembrarSenha(true);
    }
  }, []);

  useEffect(() => {
    const querCadastro = sessionStorage.getItem('@avle:abrir_cadastro');
    if (querCadastro === 'true') {
      setIsLogin(false);
      setTipoUsuario('CLIENTE');
      sessionStorage.removeItem('@avle:abrir_cadastro');
    }
  }, []);

  useEffect(() => {
    apiFetch(`${API_URL}/api/health`, { method: 'GET' }).catch(() => {});
    const intervaloPing = setInterval(() => {
      apiFetch(`${API_URL}/api/health`, { method: 'GET' }).catch(() => {});
    }, 120000);
    return () => clearInterval(intervaloPing);
  }, []);

  const aplicarMascaraTelefone = (valor: string) => {
    const v = valor.replace(/\D/g, '');
    if (v.length <= 2) return v;
    if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7, 11)}`;
  };

  const aplicarMascaraCep = (valor: string) => {
    const v = valor.replace(/\D/g, '');
    if (v.length <= 5) return v;
    return `${v.slice(0, 5)}-${v.slice(5, 8)}`;
  };

  const aplicarMascaraMoeda = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    if (!apenasNumeros) return '';
    const valorNumerico = (parseFloat(apenasNumeros) / 100).toFixed(2);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(valorNumerico));
  };

  // Sem mascara de propósito. Telefone e CPF comecam os dois com digito e tem
  // os mesmos onze, entao mascarar como telefone tornava impossivel digitar um
  // CPF: (09) 20302-0926 nao e nada. O servidor limpa a pontuacao e procura nos
  // dois campos, entao a pessoa pode digitar do jeito que lembrar.
  const handleIdentificadorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdentificadorLogin(e.target.value);
  };

  const handleBuscarCnpj = async () => {
    const cnpjLimpo = cpf.replace(/\D/g, '');
    
    if (tipoUsuario !== 'LOJA' || cnpjLimpo.length !== 14) return;

    setCarregando(true);
    setStatusConexao('CONSULTANDO RECEITA FEDERAL...');
    setMensagem({ tipo: '', texto: '' });

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      
      if (!res.ok) throw new Error('CNPJ inválido ou não encontrado na base de dados.');
      
      const data = await res.json();
      
      if (data.descricao_situacao_cadastral !== 'ATIVA') {
        throw new Error(`CNPJ Inválido: A situação da empresa consta como ${data.descricao_situacao_cadastral}.`);
      }

      setNome(data.razao_social || data.nome_fantasia || '');
      if (data.cep) setCep(aplicarMascaraCep(data.cep.toString()));
      if (data.ddd_telefone_1) setTelefoneCadastro(aplicarMascaraTelefone(data.ddd_telefone_1.toString()));
      
      setMensagem({ tipo: 'sucesso', texto: 'Empresa validada e ativa na Receita Federal!' });
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message });
      setCpf(''); 
      setNome('');
    } finally {
      setCarregando(false);
    }
  };

  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const loginValido = identificadorLoginValido(identificadorLogin);

  const emailCadastroValido = regexEmail.test(emailCadastro.trim());
  const emailCadastroPreenchido = emailCadastro.trim().length > 0;
  // O e-mail e o unico canal por onde o codigo de acesso e a recuperacao de
  // senha saem. Cadastro sem ele cria conta que so entra com senha e nao tem
  // como recuperar nada se a pessoa esquecer.
  const emailCadastroValidoOuVazio = emailCadastroValido;

  const { tamanhoMinimo, temMaiuscula, temNumero, temCaracterEspecial } = requisitosSenha(senha);
  const senhaForte = avaliarSenhaForte(senha);

  const novaSenhaForte = avaliarSenhaForte(novaSenha);

  // A loja usa este mesmo campo para o CNPJ, que tem outra regra; os dígitos
  // verificadores so são conferidos no CPF do cliente.
  const tamanhoDocumentoValido = tipoUsuario === 'LOJA' ? cpf.length === 14 : cpfValido(cpf);

  const telefoneCadastroLimpo = somenteDigitos(telefoneCadastro);
  // E-mail e telefone sao exigidos de todo mundo. O e-mail leva o codigo de
  // acesso e a recuperacao de senha; o telefone e como a loja fala com a
  // cliente. Conta sem os dois nasce sem caminho de contato nenhum.
  const telefoneCadastroValidoSeLoja = telefoneValido(telefoneCadastroLimpo);

  const cepLimpo = cep.replace(/\D/g, '');
  const cepValidoSeLoja = tipoUsuario === 'LOJA' ? cepLimpo.length === 8 : true;
  const faturamentoValidoSeLoja = tipoUsuario === 'LOJA' ? faturamento.trim().length > 0 : true;

  const formularioValido = isLogin
    ? loginValido && senha.length > 0
    : emailCadastroValidoOuVazio &&
      telefoneCadastroValidoSeLoja &&
      senhaForte &&
      nome.trim() !== '' &&
      tamanhoDocumentoValido &&
      cepValidoSeLoja &&
      faturamentoValidoSeLoja &&
      (tipoUsuario === 'LOJA' ? aceitouTermos : true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    setStatusConexao('CONECTANDO...');
    setCarregando(true);

    if (!formularioValido) {
      setMensagem({ tipo: 'erro', texto: 'Por favor, preencha todos os campos obrigatórios corretamente!' });
      setCarregando(false);
      return;
    }

    if (!isLogin && tipoUsuario === 'LOJA') {
      if (walletIdInput.trim() === '') {
        setMensagem({
          tipo: 'erro',
          texto: 'Informe o Wallet ID da conta Asaas da loja. Crie a conta em asaas.com, abra Perfil e copie o Wallet ID.',
        });
        setCarregando(false);
        return;
      }
      if (!walletIdInput.trim().startsWith('wal_')) {
        setMensagem({ 
          tipo: 'erro', 
          texto: 'O Wallet ID do Asaas começa com "wal_". Confira em Perfil, dentro da conta Asaas da loja.' 
        });
        setCarregando(false);
        return;
      }
    }

    const maxTentativas = 4;

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const endpoint = isLogin ? `${API_URL}/api/auth/login` : `${API_URL}/api/usuarios/cadastro`;
        const faturamentoNumerico = faturamento
          ? parseFloat(faturamento.replace(/[^\d,]/g, '').replace(',', '.'))
          : null;

        let bodyPayload: any = {};

        if (isLogin) {
            bodyPayload = { identificador: identificadorLogin.trim(), senha };
        } else {
            const conviteLojaId = sessionStorage.getItem('@avle:convite_loja_id');
            
            bodyPayload = {
              nome,
              email: emailCadastro.trim() !== '' ? emailCadastro : null,
              cpf,
              senha,
              tipoUsuario,
              telefone: telefoneCadastroLimpo !== '' ? telefoneCadastroLimpo : null,
              cep: tipoUsuario === 'LOJA' ? cepLimpo : null,
              faturamento: tipoUsuario === 'LOJA' ? faturamentoNumerico : null,
              walletId: tipoUsuario === 'LOJA' ? walletIdInput.trim() : null,
              lojaId: tipoUsuario === 'CLIENTE' && conviteLojaId ? Number(conviteLojaId) : null,
            };
        }

        const resposta = await apiFetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (resposta.status === 403) {
          const detalhe = await resposta.json().catch(() => null);
          if (detalhe?.email) setEmailVerificacao(detalhe.email);
          setMensagem({
            tipo: 'erro',
            texto: detalhe?.emailMascarado
              ? `Confirme o código enviado para ${detalhe.emailMascarado}.`
              : 'Sua conta ainda não foi verificada.',
          });
          setIsVerificando(true);
          setCarregando(false);
          return;
        }

        if (resposta.status >= 400 && resposta.status < 500) {
          const textoErro = await resposta.text();
          throw new Error(textoErro || (isLogin ? 'E-mail, telefone ou senha incorretos!' : 'Erro ao realizar cadastro.'));
        }

        if (!resposta.ok) {
          throw new Error('SERVER_STARTING');
        }

        if (isLogin) {
          const dadosUsuario = await resposta.json();
          localStorage.setItem('@avle:usuario', JSON.stringify(dadosUsuario));

          if (lembrarSenha) {
            localStorage.setItem('@avle:identificador_lembrado', identificadorLogin.trim());
          } else {
            localStorage.removeItem('@avle:identificador_lembrado');
          }

          router.push('/dashboard');
          return;
        } else {
          const retorno = await resposta.json().catch(() => null);
          sessionStorage.removeItem('@avle:convite_loja_id');

          if (retorno?.verificacaoPendente) {
            // O número fica guardado porque os campos são limpos logo abaixo e a
            // tela do código precisa saber de qual conta se trata.
            setEmailVerificacao(retorno.email || emailCadastro.trim());
            setMensagem({
              tipo: 'sucesso',
              texto: `Cadastro realizado! Enviamos um código para ${retorno.emailMascarado || 'o seu e-mail'}.`,
            });
            setIsVerificando(true);
          } else {
            setMensagem({ tipo: 'sucesso', texto: 'Conta cadastrada com sucesso!' });
            setTimeout(() => {
              setIsLogin(true);
              setMensagem({ tipo: '', texto: '' });
            }, 1500);
          }

          setNome(''); setCpf(''); setEmailCadastro(''); setTelefoneCadastro(''); setCep('');
          setFaturamento(''); setWalletIdInput(''); setSenha(''); setAceitouTermos(false);
          setCarregando(false);
          return;
        }
      } catch (erro: any) {
        clearTimeout(timeoutId);
        const msg = erro.message || '';

        if (msg !== 'SERVER_STARTING' && !msg.includes('Failed to fetch') && !msg.includes('NetworkError') && erro.name !== 'TypeError' && erro.name !== 'AbortError') {
          setMensagem({ tipo: 'erro', texto: msg });
          setCarregando(false);
          return;
        }

        if (tentativa < maxTentativas) {
          setStatusConexao('ACORDANDO SERVIDOR SEGURO...');
          await new Promise((resolve) => setTimeout(resolve, 3000)); 
          continue;
        }

        setMensagem({
          tipo: 'erro',
          texto: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
        });
        setCarregando(false);
      }
    }
  };

  // Quem acabou de se cadastrar nunca preencheu o campo de login, então o
  // telefone guardado no cadastro e quem identifica a conta na verificação.
  const identificarContaEmVerificacao = (codigo?: string) => {
    const base: Record<string, string> = {};
    if (codigo !== undefined) base.codigo = codigo;

    if (emailVerificacao) {
      return { ...base, email: emailVerificacao };
    }
    return { ...base, identificador: identificadorLogin.trim() };
  };

  const handleReenviarCodigo = async () => {
    setReenviandoCodigo(true);
    setMensagem({ tipo: '', texto: '' });
    try {
      const resposta = await apiFetch(`${API_URL}/api/usuarios/reenviar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(identificarContaEmVerificacao()),
      });

      const retorno = await resposta.json().catch(() => null);
      if (!resposta.ok) throw new Error(retorno?.erro || 'Não foi possível reenviar o código agora.');

      setMensagem({
        tipo: 'sucesso',
        texto: `Novo código enviado para ${retorno?.emailMascarado || 'o seu e-mail'}.`,
      });
    } catch (erro) {
      setMensagem({
        tipo: 'erro',
        texto: erro instanceof Error ? erro.message : 'Falha ao reenviar o código.',
      });
    } finally {
      setReenviandoCodigo(false);
    }
  };

  const handleConfirmarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    setCarregando(true);

    const payload = identificarContaEmVerificacao(codigoOtp);

    try {
      const resposta = await apiFetch(`${API_URL}/api/usuarios/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resposta.ok) {
        const textoErro = await resposta.text();
        throw new Error(textoErro || 'Código de verificação incorreto ou expirado.');
      }

      setMensagem({ tipo: 'sucesso', texto: 'Conta ativada com sucesso! Faça seu login agora.' });
      setIsVerificando(false);
      setIsLogin(true);
      setSenha('');
      setCodigoOtp('');
    } catch (erro: any) {
      setMensagem({ tipo: 'erro', texto: erro.message });
    } finally {
      setCarregando(false);
    }
  };

  // Pede o codigo de uso unico. O identificador e o mesmo campo do login, entao
  // quem ja digitou o e-mail nao precisa digitar de novo.
  const handlePedirCodigoAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const resposta = await apiFetch(`${API_URL}/api/auth/codigo/solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: identificadorLogin.trim() }),
      });

      const retorno = await resposta.json().catch(() => null);
      if (!resposta.ok) throw new Error(retorno?.erro || 'Não foi possível enviar o código agora.');

      setDestinoCodigo(retorno?.destinoMascarado || '');
      setCodigoEnviado(true);
      setMensagem({ tipo: 'sucesso', texto: `Código enviado para ${retorno?.destinoMascarado || 'o seu contato cadastrado'}.` });
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: erro instanceof Error ? erro.message : 'Não foi possível enviar o código agora.' });
    } finally {
      setCarregando(false);
    }
  };

  const handleEntrarComCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const resposta = await apiFetch(`${API_URL}/api/auth/codigo/entrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: identificadorLogin.trim(), codigo: codigoAcesso }),
      });

      const retorno = await resposta.json().catch(() => null);
      if (!resposta.ok) throw new Error(retorno?.erro || 'Código incorreto ou expirado.');

      localStorage.setItem('@avle:usuario', JSON.stringify(retorno));
      router.push('/dashboard');
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: erro instanceof Error ? erro.message : 'Código incorreto ou expirado.' });
      setCarregando(false);
    }
  };

  const voltarAoLogin = () => {
    setIsLoginPorCodigo(false);
    setCodigoEnviado(false);
    setCodigoAcesso('');
    setDestinoCodigo('');
    setMensagem({ tipo: '', texto: '' });
  };

  const handleSolicitarRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    setCarregando(true);

    if (!loginValido) {
      setMensagem({ tipo: 'erro', texto: 'Informe um e-mail, telefone ou CPF válido.' });
      setCarregando(false);
      return;
    }

    const payload = { identificador: identificadorLogin.trim() };

    try {
      const resposta = await apiFetch(`${API_URL}/api/auth/esqueceu-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resposta.ok) throw new Error('Dados não localizados no ecossistema AVLE.');

      setMensagem({ tipo: 'sucesso', texto: 'Código de redefinição enviado!' });

      setTimeout(() => {
        setIsEsqueceuSenha(false);
        setIsResetandoSenha(true);
        setCodigoOtp('');
        setMensagem({ tipo: '', texto: '' });
      }, 1500);
    } catch (erro: any) {
      setMensagem({ tipo: 'erro', texto: erro.message });
    } finally {
      setCarregando(false);
    }
  };

  const handleSalvarNovaSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    setCarregando(true);

    if (codigoOtp.length !== 6 || !novaSenhaForte) {
      setMensagem({ tipo: 'erro', texto: 'O código precisa ter 6 dígitos e a nova senha precisa ser forte.' });
      setCarregando(false);
      return;
    }


    const payload = { identificador: identificadorLogin.trim(), codigo: codigoOtp, novaSenha };

    try {
      const resposta = await apiFetch(`${API_URL}/api/auth/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resposta.ok) throw new Error('Código incorreto, expirado ou já utilizado.');

      setMensagem({ tipo: 'sucesso', texto: 'Sua senha foi redefinida com sucesso! Faça seu login.' });

      setTimeout(() => {
        setIsResetandoSenha(false);
        setIsLogin(true);
        setSenha('');
        setNovaSenha('');
        setCodigoOtp('');
        setMensagem({ tipo: '', texto: '' });
      }, 2000);
    } catch (erro: any) {
      setMensagem({ tipo: 'erro', texto: erro.message });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex flex-col lg:flex-row font-sans overflow-hidden">
      
      <div className="hidden lg:flex w-1/2 bg-[#0B1E14] relative items-center justify-center overflow-hidden flex-col p-12">
        <div className="absolute w-[600px] h-[600px] bg-[#BD6B42] rounded-full blur-[140px] opacity-10 pointer-events-none" />
        
        <div className="z-10 text-center flex flex-col items-center">
          {/* A arvore solta no fundo, sem circulo: ela ja e a marca, e espremer
              um desenho de galhos finos dentro de 128px so o transformava em
              borrao. O painel ja e verde, entao a versao clara se apoia nele. */}
          <img
            src="/arvore-clara.png"
            alt="AVLE"
            className="w-[22rem] max-w-[80%] mb-6 drop-shadow-2xl"
          />
          <h1 className="text-white text-5xl font-bold tracking-widest font-serif mb-4">AVLE</h1>
          <p className="text-[#BD6B42] text-lg italic mt-2 max-w-sm font-medium">
            "Onde suas escolhas criam raizes e geram frutos."
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#F5F2EB] p-4 sm:p-8 lg:p-12 relative min-h-screen overflow-y-auto">
        
        <div className="lg:hidden absolute top-6 left-0 right-0 flex flex-col items-center justify-center z-0 opacity-[0.13] pointer-events-none">
           <img src="/arvore-escura.png" alt="" className="w-64 max-w-[70%]" />
        </div>

        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-stone-200/60 flex flex-col z-10 relative">
          
          <div className="flex flex-col p-6 sm:p-8">
            {!isVerificando && !isEsqueceuSenha && !isResetandoSenha && !isLoginPorCodigo && (
              <div className="flex border-b border-stone-100 bg-stone-50/50 mb-6 rounded-xl overflow-hidden shadow-inner">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setMensagem({ tipo: '', texto: '' }); setAceitouTermos(false); }}
                  className={`flex-1 py-3.5 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    isLogin ? 'text-white bg-[#BD6B42]' : 'text-stone-400 hover:text-stone-600 bg-transparent'
                  }`}
                >
                  Acessar Conta
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setMensagem({ tipo: '', texto: '' }); setTipoUsuario('CLIENTE'); setAceitouTermos(false); }}
                  className={`flex-1 py-3.5 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    !isLogin ? 'text-white bg-[#BD6B42]' : 'text-stone-400 hover:text-stone-600 bg-transparent'
                  }`}
                >
                  Nova Conta
                </button>
              </div>
            )}

            {isVerificando && (
              <form onSubmit={handleConfirmarCodigo} className="flex flex-col space-y-4 text-left">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Verificação de Conta</h3>
                    <p className="text-xs text-stone-400 mt-1">Insira o código enviado por e-mail para: <br /><strong className="text-[#BD6B42] font-semibold">{emailVerificacao || identificadorLogin}</strong></p>
                  </div>
                  {mensagem.texto && (
                    <div className={`p-3 rounded-xl text-xs font-bold border ${mensagem.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                      {mensagem.texto}
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Código de Confirmação</label>
                    <input type="text" maxLength={6} placeholder="000000" value={codigoOtp} onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))} className="w-full text-center font-mono font-bold tracking-[0.3em] px-4 py-2 border rounded-xl bg-stone-50 h-[46px] text-sm focus:outline-none focus:border-[#0B1E14]" required disabled={carregando} />
                  </div>
                  <div className="space-y-2 mt-4">
                  <button type="submit" disabled={codigoOtp.length !== 6 || carregando} className={`w-full py-3.5 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md ${codigoOtp.length === 6 && !carregando ? 'bg-[#BD6B42] cursor-pointer' : 'bg-stone-300 cursor-not-allowed opacity-50'}`}>
                    {carregando ? 'PROCESSANDO...' : 'Confirmar e Ativar'}
                  </button>
                  <button type="button" onClick={handleReenviarCodigo} disabled={reenviandoCodigo || carregando} className="w-full text-[#BD6B42] hover:underline text-center font-bold text-xs py-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline">
                    {reenviandoCodigo ? 'Reenviando...' : 'Não recebi o código. Reenviar'}
                  </button>
                  <button type="button" onClick={() => setIsVerificando(false)} className="w-full text-stone-400 hover:text-stone-700 text-center font-bold text-xs py-2 cursor-pointer">Cancelar e voltar</button>
                </div>
              </form>
            )}

            {isLoginPorCodigo && (
              <form onSubmit={codigoEnviado ? handleEntrarComCodigo : handlePedirCodigoAcesso} className="flex flex-col space-y-6 text-left">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Entrar com Código</h3>
                    <p className="text-xs text-stone-400 mt-1">
                      {codigoEnviado
                        ? `Digite o código de 6 dígitos enviado para ${destinoCodigo || 'o seu contato cadastrado'}.`
                        : 'Informe seu e-mail ou telefone e enviamos um código de acesso. Não precisa de senha.'}
                    </p>
                  </div>

                  {mensagem.texto && (
                    <div className={`p-3 rounded-xl text-xs font-bold border ${mensagem.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                      {mensagem.texto}
                    </div>
                  )}

                  {!codigoEnviado ? (
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">E-mail ou Telefone</label>
                      <input type="text" placeholder="E-mail, telefone ou CPF" value={identificadorLogin} onChange={handleIdentificadorChange} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-sm bg-stone-50 h-[46px]" required disabled={carregando} />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Código de Acesso</label>
                      <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={codigoAcesso} onChange={(e) => setCodigoAcesso(e.target.value.replace(/\D/g, ''))} className="w-full text-center font-mono font-bold tracking-[0.3em] px-4 py-2 border rounded-xl bg-stone-50 h-[46px] text-sm focus:outline-none focus:border-[#0B1E14]" required disabled={carregando} autoFocus />
                      <button type="button" onClick={handlePedirCodigoAcesso} disabled={carregando} className="text-[10px] text-[#BD6B42] hover:underline font-bold cursor-pointer mt-2 disabled:opacity-50">
                        Não recebi o código. Enviar outro
                      </button>
                    </div>
                  )}

                  <div className="space-y-2 mt-4">
                    <button type="submit" disabled={carregando} className="w-full py-3.5 bg-[#0B1E14] text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer hover:scale-[1.01] disabled:opacity-55">
                      {carregando ? 'AGUARDE...' : codigoEnviado ? 'Entrar' : 'Enviar Código'}
                    </button>
                    <button type="button" onClick={voltarAoLogin} className="w-full text-stone-400 hover:text-stone-700 text-center font-bold text-xs py-2 cursor-pointer">Voltar ao Login</button>
                  </div>
              </form>
            )}

            {isEsqueceuSenha && (
              <form onSubmit={handleSolicitarRecuperacao} className="flex flex-col space-y-6 text-left">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Recuperação de Acesso</h3>
                    <p className="text-xs text-stone-400 mt-1">Informe seu e-mail ou telefone cadastrado para receber o token.</p>
                  </div>
                  {mensagem.texto && (
                    <div className={`p-3 rounded-xl text-xs font-bold border ${mensagem.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                      {mensagem.texto}
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">E-mail ou Telefone</label>
                    <input type="text" placeholder="E-mail, telefone ou CPF" value={identificadorLogin} onChange={handleIdentificadorChange} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-sm bg-stone-50 h-[46px]" required disabled={carregando} />
                  </div>
                  <div className="space-y-2 mt-4">
                  <button type="submit" disabled={carregando} className="w-full py-3.5 bg-[#0B1E14] text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer hover:scale-[1.01] disabled:opacity-55">
                    {carregando ? 'ENVIANDO...' : 'Enviar Código'}
                  </button>
                  <button type="button" onClick={() => setIsEsqueceuSenha(false)} className="w-full text-stone-400 hover:text-stone-700 text-center font-bold text-xs py-2 cursor-pointer">Voltar ao Login</button>
                </div>
              </form>
            )}

            {isResetandoSenha && (
              <form onSubmit={handleSalvarNovaSenha} className="flex flex-col space-y-4 text-left">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Criar Nova Senha</h3>
                    <p className="text-xs text-stone-400 mt-1">Insira o token de 6 dígitos recebido.</p>
                  </div>
                  {mensagem.texto && (
                    <div className={`p-3 rounded-xl text-xs font-bold border ${mensagem.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                      {mensagem.texto}
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Token (6 dígitos)</label>
                    <input type="text" maxLength={6} placeholder="000000" value={codigoOtp} onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))} className="w-full text-center font-mono font-bold tracking-[0.3em] px-4 py-2 border rounded-xl bg-stone-50 h-[46px] text-sm focus:outline-none focus:border-[#0B1E14]" required disabled={carregando} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold uppercase text-stone-500">Nova Senha</label>
                    </div>
                    <div className="relative">
                      <input type={mostrarNovaSenha ? 'text' : 'password'} placeholder="••••••••" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="w-full px-4 py-3 border rounded-xl bg-stone-50 text-sm h-[46px] focus:outline-none focus:border-[#0B1E14]" required disabled={carregando} />
                      <button type="button" onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)} className="absolute right-4 top-3 text-stone-400 font-bold hover:text-stone-700 cursor-pointer">Ver</button>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                  <button type="submit" disabled={codigoOtp.length !== 6 || !novaSenhaForte || carregando} className="w-full py-3.5 bg-[#BD6B42] text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-all">
                    {carregando ? 'PROCESSANDO...' : 'Redefinir Senha'}
                  </button>
                  <button type="button" onClick={() => setIsResetandoSenha(false)} className="w-full text-stone-400 text-center font-bold text-xs py-2 cursor-pointer">Desistir</button>
                </div>
              </form>
            )}

            {!isVerificando && !isEsqueceuSenha && !isResetandoSenha && !isLoginPorCodigo && (
              <form onSubmit={handleSubmit} className="flex flex-col text-left space-y-4">
                  {mensagem.texto && (
                    <div className={`p-3.5 rounded-xl text-xs font-bold text-center border ${mensagem.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                      {mensagem.texto}
                    </div>
                  )}
                  
                  {!isLogin && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1.5 tracking-wider">Tipo de Conta *</label>
                        
                        <div className="relative flex p-1 bg-stone-100 rounded-2xl border border-stone-200/80 overflow-hidden">
                          <div 
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#0B1E14] rounded-xl shadow-md transition-transform duration-500 ease-in-out transform-gpu ${
                              tipoUsuario === 'CLIENTE' ? 'translate-x-0' : 'translate-x-full'
                            }`} 
                          />
                          <button 
                            type="button" 
                            onClick={() => { setTipoUsuario('CLIENTE'); setCpf(''); setTelefoneCadastro(''); setEmailCadastro(''); setAceitouTermos(false); setMensagem({ tipo: '', texto: '' }); }} 
                            className={`relative z-10 flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-colors duration-500 cursor-pointer ${tipoUsuario === 'CLIENTE' ? 'text-white' : 'text-stone-500 hover:text-stone-800'}`} 
                            disabled={carregando}
                          >
                            Sou Cliente
                          </button>
                          <button 
                            type="button" 
                            onClick={() => { setTipoUsuario('LOJA'); setCpf(''); setTelefoneCadastro(''); setEmailCadastro(''); setAceitouTermos(false); setMensagem({ tipo: '', texto: '' }); }} 
                            className={`relative z-10 flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-colors duration-500 cursor-pointer ${tipoUsuario === 'LOJA' ? 'text-white' : 'text-stone-500 hover:text-stone-800'}`} 
                            disabled={carregando}
                          >
                            Sou Loja
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold uppercase text-stone-500">
                            {tipoUsuario === 'LOJA' ? 'CNPJ (Validação Automática) *' : 'CPF (Apenas números) *'}
                          </label>
                          {cpf.length > 0 && (
                            <span className={`text-[10px] font-bold ${tamanhoDocumentoValido ? 'text-emerald-600' : 'text-stone-400'}`}>
                              {tipoUsuario === 'LOJA' ? `${cpf.length}/14` : `${cpf.length}/11`}
                            </span>
                          )}
                        </div>
                        <input type="text" maxLength={tipoUsuario === 'LOJA' ? 14 : 11} placeholder={tipoUsuario === 'LOJA' ? '00000000000000' : '00000000000'} value={cpf} onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))} onBlur={handleBuscarCnpj} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-sm bg-stone-50 h-[46px]" required disabled={carregando} />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                          {tipoUsuario === 'LOJA' ? 'Nome / Razão Social da Loja *' : 'Nome Completo *'}
                        </label>
                        <input type="text" placeholder={tipoUsuario === 'LOJA' ? 'Será preenchido pela Receita' : 'Ex: João Silva'} value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-sm bg-stone-50 h-[46px]" required disabled={carregando || (tipoUsuario === 'LOJA')} />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold uppercase text-stone-500">
                            {tipoUsuario === 'LOJA' ? 'Telefone / WhatsApp da Loja *' : 'Telefone / Celular *'}
                          </label>
                          {tipoUsuario === 'LOJA' && telefoneCadastroLimpo.length > 0 && (
                            <span className={`text-[10px] font-bold ${telefoneCadastroLimpo.length >= 10 ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {telefoneCadastroLimpo.length >= 10 ? '✓ Válido' : '✗ Mínimo 10 dígitos'}
                            </span>
                          )}
                        </div>
                        <input type="text" placeholder="(42) 99999-9999" value={telefoneCadastro} onChange={(e) => setTelefoneCadastro(aplicarMascaraTelefone(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-sm bg-stone-50 h-[46px]" required disabled={carregando} />
                      </div>
                      
                      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${tipoUsuario === 'LOJA' ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                        <div className="space-y-3 p-4 bg-stone-50/80 border border-stone-200 rounded-2xl shadow-inner">
                          <p className="text-[10px] font-bold uppercase text-[#BD6B42] tracking-wider mb-2">Dados da Loja</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">CEP Base *</label>
                              <input type="text" maxLength={9} placeholder="85010-250" value={cep} onChange={(e) => setCep(aplicarMascaraCep(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-xs bg-white h-[42px]" required={tipoUsuario === 'LOJA'} disabled={carregando} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Faturamento *</label>
                              <input type="text" placeholder="R$ 10.000,00" value={faturamento} onChange={(e) => setFaturamento(aplicarMascaraMoeda(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-xs bg-white h-[42px]" required={tipoUsuario === 'LOJA'} disabled={carregando} />
                            </div>
                          </div>
                          <div className="pt-1">
                            <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1 flex justify-between"><span>Wallet ID Asaas *</span></label>
                            <input type="text" value={walletIdInput} onChange={(e) => setWalletIdInput(e.target.value)} placeholder="wal_000000000000" className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-xs bg-white h-[42px] font-mono" required disabled={carregando} />
                            <p className="text-[10px] text-stone-500 mt-1.5 leading-relaxed">
                              É para esta carteira que vão os 90% de cada pagamento. Crie a conta em{' '}
                              <a href="https://www.asaas.com" target="_blank" rel="noreferrer" className="text-[#BD6B42] font-bold hover:underline">asaas.com</a>
                              , abra <strong>Perfil</strong> e copie o Wallet ID.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isLogin && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold uppercase text-stone-500">E-mail ou Telefone com DDD *</label>
                        </div>
                        <input type="text" placeholder="E-mail, telefone ou CPF" value={identificadorLogin} onChange={handleIdentificadorChange} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-sm bg-stone-50 h-[46px]" required disabled={carregando} />
                      </div>
                  )}

                  {!isLogin && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold uppercase text-stone-500">E-mail *</label>
                        </div>
                        <input type="email" placeholder="seu@email.com" value={emailCadastro} onChange={(e) => setEmailCadastro(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-sm bg-stone-50 h-[46px]" required disabled={carregando} />
                      </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold uppercase text-stone-500">Senha de Acesso *</label>
                      {isLogin && (
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => { setIsLoginPorCodigo(true); setMensagem({ tipo: '', texto: '' }); }} className="text-[10px] text-stone-500 hover:text-[#0B1E14] hover:underline font-bold cursor-pointer" disabled={carregando}>Entrar com código</button>
                          <span className="text-[10px] text-stone-300">|</span>
                          <button type="button" onClick={() => { setIsEsqueceuSenha(true); setMensagem({ tipo: '', texto: '' }); }} className="text-[10px] text-[#BD6B42] hover:underline font-bold cursor-pointer" disabled={carregando}>Esqueceu a senha?</button>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      {/* CORREÇÃO: Utilizando o estado 'mostrarSenha' que agora alterna corretamente */}
                      <input type={mostrarSenha ? 'text' : 'password'} placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full px-4 py-3 border rounded-xl bg-stone-50 focus:outline-none focus:border-[#0B1E14] text-sm h-[46px]" required disabled={carregando} />
                      <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-4 top-3 text-stone-400 font-bold hover:text-stone-700 cursor-pointer text-xs" disabled={carregando}>VER</button>
                    </div>

                    {isLogin && (
                      <div className="flex items-center mt-3 ml-1 space-x-2">
                        <input
                          type="checkbox"
                          id="lembrar-senha"
                          checked={lembrarSenha}
                          onChange={(e) => setLembrarSenha(e.target.checked)}
                          className="w-4 h-4 accent-[#0B1E14] cursor-pointer"
                          disabled={carregando}
                        />
                        <label htmlFor="lembrar-senha" className="text-[10px] text-stone-500 font-bold uppercase cursor-pointer select-none tracking-wider">
                          Lembrar de mim
                        </label>
                      </div>
                    )}

                    {!isLogin && senha.length > 0 && (
                      <div className="mt-2.5 p-3 bg-stone-50 border border-stone-200/60 rounded-xl space-y-1.5 text-[11px] font-medium animate-fade-in text-left">
                        <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Estrutura da Senha:</p>
                        <div className={`flex items-center space-x-1.5 transition-colors ${tamanhoMinimo ? 'text-emerald-600 font-bold' : 'text-stone-400'}`}>
                          <span>{tamanhoMinimo ? '✓' : '○'}</span>
                          <span>Mínimo de 8 caracteres</span>
                        </div>
                        <div className={`flex items-center space-x-1.5 transition-colors ${temMaiuscula ? 'text-emerald-600 font-bold' : 'text-stone-400'}`}>
                          <span>{temMaiuscula ? '✓' : '○'}</span>
                          <span>Pelo menos uma letra maiuscula</span>
                        </div>
                        <div className={`flex items-center space-x-1.5 transition-colors ${temNumero ? 'text-emerald-600 font-bold' : 'text-stone-400'}`}>
                          <span>{temNumero ? '✓' : '○'}</span>
                          <span>Pelo menos um número</span>
                        </div>
                        <div className={`flex items-center space-x-1.5 transition-colors ${temCaracterEspecial ? 'text-emerald-600 font-bold' : 'text-stone-400'}`}>
                          <span>{temCaracterEspecial ? '✓' : '○'}</span>
                          <span>Pelo menos um caractere especial (!@#$...)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isLogin && (
                    <div className="flex items-start space-x-3 p-3 bg-stone-50 border border-stone-200/60 rounded-xl mt-2 animate-fade-in">
                      <input type="checkbox" id="termos-loja" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#0B1E14] cursor-pointer" disabled={carregando} />
                      <label htmlFor="termos-loja" className="text-[10px] text-stone-500 leading-relaxed cursor-pointer select-none">
                        Declaro que li e concordo com os{' '}
                        <button type="button" onClick={(e) => { e.preventDefault(); setModalTermosAberto(true); }} className="text-[#BD6B42] font-bold underline cursor-pointer">Termos de Uso</button>{' '}da AVLE.
                      </label>
                    </div>
                  )}

                <button type="submit" disabled={!formularioValido || carregando} className="w-full mt-6 py-4 bg-[#0B1E14] text-white font-bold rounded-xl tracking-wide uppercase transition-all disabled:opacity-50 cursor-pointer text-xs shadow-md hover:bg-[#08170f]">
                  {carregando ? statusConexao : isLogin ? 'Entrar no Sistema' : 'Finalizar Cadastro'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      
      {modalTermosAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeIn text-left">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-stone-100">
              <h3 className="text-base font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Contrato de Parceria</h3>
              <button type="button" onClick={() => setModalTermosAberto(false)} className="text-stone-400 font-bold px-2 cursor-pointer">X</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-xs text-stone-600 space-y-4 leading-relaxed bg-stone-50/30">
              <p className="font-bold text-stone-800">1. DO OBJETO</p>
              <p>Este documento estabelece as condições gerais para a utilização da AVLE pela LOJA PARCEIRA.</p>
              <p className="font-bold text-stone-800 mt-4">2. DO REPASSE E SPLIT DE PAGAMENTOS</p>
              <p>Fica acordado que a plataforma AVLE reterá automaticamente o percentual de 10% sobre cada transação.</p>
            </div>
            <div className="p-4 border-t flex justify-end gap-3 bg-stone-50 rounded-b-2xl">
              <button type="button" onClick={() => setModalTermosAberto(false)} className="px-6 py-2.5 border text-stone-600 font-bold rounded-xl text-[10px] uppercase cursor-pointer">Fechar</button>
              <button type="button" onClick={() => { setModalTermosAberto(false); setAceitouTermos(true); }} className="px-6 py-2.5 bg-[#0B1E14] text-white font-bold rounded-xl text-[10px] uppercase cursor-pointer">Aceitar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}