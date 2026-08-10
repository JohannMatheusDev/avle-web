'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import TelaCarregamento from './dashboard/components/TelaCarregamento';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

export default function Home() {
  const [status, setStatus] = useState<'inicial' | 'intro' | 'login'>('inicial');
  const [deveAnimar, setDeveAnimar] = useState(false);

  useEffect(() => {
    const jaVisualizou = sessionStorage.getItem('@avle:splash-visualizado');

    if (jaVisualizou === 'true') {
      setStatus('login');
      setDeveAnimar(false);
    } else {
      setStatus('intro');
      setDeveAnimar(true);
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

      <div
        className={
          status !== 'login'
            ? 'opacity-0 scale-95 pointer-events-none fixed'
            : deveAnimar
              ? 'transition-all duration-1000 transform opacity-100 scale-100'
              : 'opacity-100 scale-100'
        }
      >
        <Autenticacao />
      </div>
    </>
  );
}

function Autenticacao() {
  const router = useRouter();

  // Elementos do GSAP
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  // Estados da interface
  const [isLogin, setIsLogin] = useState(true);
  const [isVerificando, setIsVerificando] = useState(false);
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
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // CAMPOS ADICIONAIS PARA LOJA
  const [cep, setCep] = useState('');
  const [faturamento, setFaturamento] = useState('');
  const [walletIdInput, setWalletIdInput] = useState(''); 
  const [bancoCodigo, setBancoCodigo] = useState('001'); 
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [contaDigito, setContaDigito] = useState('');
  const [tipoConta, setTipoConta] = useState('CORRENTE');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [modoLayout, setModoLayout] = useState<'mobile' | 'site'>('mobile');

  useEffect(() => {
    fetch(`${API_URL}/api/health`, { method: 'GET' }).catch(() => {});
    const intervaloPing = setInterval(() => {
      fetch(`${API_URL}/api/health`, { method: 'GET' }).catch(() => {});
    }, 120000);
    return () => clearInterval(intervaloPing);
  }, []);

  // GSAP - Animações sutis
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      [path1Ref.current, path2Ref.current].forEach((path) => {
        if (path) {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
          tl.to(path, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' }, 0.2);
        }
      });

      if (glowRef.current) {
        tl.fromTo(
          glowRef.current,
          { scale: 0.3, opacity: 0 },
          { scale: 1, opacity: 0.12, duration: 1.8 },
          0
        );
      }

      if (cardRef.current) {
        tl.fromTo(
          cardRef.current,
          { opacity: 0, y: 40, rotateX: 8 },
          { opacity: 1, y: 0, rotateX: 0, duration: 1 },
          0.5
        );
      }

      gsap.to('.gsap-leaf-particle', {
        y: '-=20',
        rotation: '+=25',
        duration: 'random(3.5, 5.5)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: { amount: 2, from: 'random' },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [modoLayout]);

  // Máscaras de Input
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

  // Lógica dinâmica para o campo de Login (Email vs Telefone)
  const handleIdentificadorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    // Se o usuário começar a digitar números, aplicamos a máscara de telefone
    if (/^\d/.test(valor) || valor.startsWith('(')) {
      setIdentificadorLogin(aplicarMascaraTelefone(valor));
    } else {
      // Caso contrário, tratamos como e-mail e permitimos a digitação livre
      setIdentificadorLogin(valor);
    }
  };

  // Validações
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Validação Login
  const loginLimpo = identificadorLogin.replace(/\D/g, '');
  const isLoginEmailValido = regexEmail.test(identificadorLogin);
  const isLoginTelefoneValido = loginLimpo.length >= 10 && loginLimpo.length <= 11;
  const loginValido = isLoginEmailValido || isLoginTelefoneValido;

  // Validação Cadastro
  const emailCadastroValido = regexEmail.test(emailCadastro);
  const emailCadastroPreenchido = emailCadastro.trim().length > 0;
  const emailCadastroValidoOuVazio = tipoUsuario === 'LOJA' ? emailCadastroValido : !emailCadastroPreenchido || emailCadastroValido;

  const temMaiuscula = /[A-Z]/.test(senha);
  const temNumero = /[0-9]/.test(senha);
  const temCaracterEspecial = /[^A-Za-z0-9]/.test(senha);
  const tamanhoMinimo = senha.length >= 8;
  const senhaForte = temMaiuscula && temNumero && temCaracterEspecial && tamanhoMinimo;

  const temMaiusculaNova = /[A-Z]/.test(novaSenha);
  const temNumeroNova = /[0-9]/.test(novaSenha);
  const temCaracterEspecialNova = /[^A-Za-z0-9]/.test(novaSenha);
  const tamanhoMinimoNova = novaSenha.length >= 8;
  const novaSenhaForte = temMaiusculaNova && temNumeroNova && temCaracterEspecialNova && tamanhoMinimoNova;

  const tamanhoDocumentoValido = cpf.length === (tipoUsuario === 'LOJA' ? 14 : 11);
  
  const telefoneCadastroLimpo = telefoneCadastro.replace(/\D/g, '');
  const telefoneCadastroValidoSeLoja = tipoUsuario === 'LOJA' ? telefoneCadastroLimpo.length >= 10 : true;

  const cepLimpo = cep.replace(/\D/g, '');
  const cepValidoSeLoja = tipoUsuario === 'LOJA' ? cepLimpo.length === 8 : true;
  const faturamentoValidoSeLoja = tipoUsuario === 'LOJA' ? faturamento.trim().length > 0 : true;
  const dadosBancariosValidosSeLoja =
    tipoUsuario === 'LOJA'
      ? agencia.trim().length >= 3 && conta.trim().length >= 4 && contaDigito.trim().length >= 1
      : true;

  // Habilita o botão baseando-se no estado (Login vs Cadastro)
  const formularioValido = isLogin
    ? loginValido && senha.length > 0
    : emailCadastroValidoOuVazio &&
      telefoneCadastroValidoSeLoja &&
      senhaForte &&
      nome.trim() !== '' &&
      tamanhoDocumentoValido &&
      cepValidoSeLoja &&
      faturamentoValidoSeLoja &&
      dadosBancariosValidosSeLoja;

  // LOGIN TRANSPARENTE COM RETRY SILENCIOSO
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
            // Se for login e só tiver números (telefone), envia na chave correta
            if (/^\d+$/.test(identificadorLogin.replace(/\D/g, ''))) {
               bodyPayload = { telefone: identificadorLogin.replace(/\D/g, ''), senha };
            } else {
               bodyPayload = { email: identificadorLogin, senha };
            }
        } else {
            bodyPayload = {
              nome,
              email: emailCadastro.trim() !== '' ? emailCadastro : null,
              cpf,
              senha,
              tipoUsuario,
              telefone: telefoneCadastroLimpo !== '' ? telefoneCadastroLimpo : null,
              cep: tipoUsuario === 'LOJA' ? cepLimpo : null,
              faturamento: tipoUsuario === 'LOJA' ? faturamentoNumerico : null,
              walletId: tipoUsuario === 'LOJA' && walletIdInput.trim() !== '' ? walletIdInput.trim() : null,
              dadosBancarios:
                tipoUsuario === 'LOJA'
                  ? { bancoCodigo, agencia, conta, contaDigito, tipoConta }
                  : null,
            };
        }

        const resposta = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (resposta.status === 403) {
          setMensagem({ tipo: 'erro', texto: 'Sua conta ainda não foi verificada.' });
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

        // SUCESSO!
        if (isLogin) {
          const dadosUsuario = await resposta.json();
          localStorage.setItem('@avle:usuario', JSON.stringify(dadosUsuario));
          router.push('/dashboard');
          return;
        } else {
          setMensagem({ tipo: 'sucesso', texto: 'Conta cadastrada com sucesso!' });
          setTimeout(() => {
            setIsLogin(true);
            setNome(''); setCpf(''); setEmailCadastro(''); setTelefoneCadastro(''); setCep('');
            setFaturamento(''); setWalletIdInput(''); setAgencia(''); setConta('');
            setContaDigito(''); setSenha('');
            setMensagem({ tipo: '', texto: '' });
          }, 1500);
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

  const handleConfirmarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    setCarregando(true);

    // O código OTP assumirá que estamos verificando o identificador usado no login
    const isTelefone = /^\d+$/.test(identificadorLogin.replace(/\D/g, ''));
    const payload = isTelefone 
        ? { telefone: identificadorLogin.replace(/\D/g, ''), codigo: codigoOtp } 
        : { email: identificadorLogin, codigo: codigoOtp };

    try {
      const resposta = await fetch(`${API_URL}/api/usuarios/verificar`, {
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

  const handleSolicitarRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    setCarregando(true);

    const isTelefone = /^\d+$/.test(identificadorLogin.replace(/\D/g, ''));

    if (!isLoginEmailValido && !isTelefone) {
      setMensagem({ tipo: 'erro', texto: 'Por favor, insira um e-mail ou telefone válido.' });
      setCarregando(false);
      return;
    }

    const payload = isTelefone 
        ? { telefone: identificadorLogin.replace(/\D/g, '') } 
        : { email: identificadorLogin };

    try {
      const resposta = await fetch(`${API_URL}/api/auth/esqueceu-senha`, {
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

    const isTelefone = /^\d+$/.test(identificadorLogin.replace(/\D/g, ''));
    const payload = isTelefone 
        ? { telefone: identificadorLogin.replace(/\D/g, ''), codigo: codigoOtp, novaSenha } 
        : { email: identificadorLogin, codigo: codigoOtp, novaSenha };

    try {
      const resposta = await fetch(`${API_URL}/api/auth/redefinir-senha`, {
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
    <div
      ref={containerRef}
      className="min-h-screen bg-[#F5F2EB] flex flex-col justify-center items-center p-4 text-[#0B1E14] relative select-none overflow-hidden transition-all duration-500"
    >
      <div ref={glowRef} className="absolute w-[550px] h-[550px] bg-[#BD6B42] rounded-full blur-[140px] pointer-events-none -z-10" />

      <svg className="absolute inset-0 w-full h-full pointer-events-none -z-10 opacity-20" viewBox="0 0 1000 1000" fill="none">
        <path ref={path1Ref} d="M 100,900 C 300,700 350,400 500,500 C 650,600 700,300 900,100" stroke="#0B1E14" strokeWidth="2.5" strokeLinecap="round" />
        <path ref={path2Ref} d="M 200,950 C 400,800 450,550 500,500 C 550,450 750,200 850,50" stroke="#BD6B42" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="500" cy="500" r="230" stroke="#0B1E14" strokeWidth="0.8" strokeDasharray="6 6" />
      </svg>

      <div className="absolute inset-0 pointer-events-none -z-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="gsap-leaf-particle absolute w-2 h-2 rounded-full bg-[#BD6B42]/40 blur-[0.5px]" style={{ top: `${18 + i * 13}%`, left: `${10 + i * 14}%` }} />
        ))}
      </div>

      <div className="mb-6 bg-stone-200/80 p-1 rounded-2xl flex space-x-1 border border-stone-300 shadow-inner z-50">
        <button
          type="button"
          onClick={() => setModoLayout('mobile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            modoLayout === 'mobile' ? 'bg-[#0B1E14] text-white shadow-md' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Vista Mobile
        </button>
        <button
          type="button"
          onClick={() => setModoLayout('site')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            modoLayout === 'site' ? 'bg-[#0B1E14] text-white shadow-md' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Vista Site
        </button>
      </div>

      <div
        ref={cardRef}
        className={`w-full bg-white rounded-3xl shadow-xl border border-stone-200/60 overflow-hidden flex transition-all duration-500 ease-in-out hover:shadow-2xl ${
          modoLayout === 'site' ? 'max-w-4xl min-h-[640px] flex-row' : 'max-w-md min-h-[660px] flex-col'
        }`}
      >
        <div
          className={`bg-[#0B1E14] p-8 text-center flex flex-col items-center justify-center group transition-all duration-500 ${
            modoLayout === 'site' ? 'w-1/2 rounded-r-3xl' : 'w-full'
          }`}
        >
          <div className="w-16 h-16 bg-[#F5F2EB] rounded-full flex items-center justify-center mb-3 shadow-md transition-transform duration-500 ease-out group-hover:rotate-12 group-hover:scale-105">
            <span className="text-[#0B1E14] font-black text-2xl">AV</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-wide">AVLE</h1>
          <p className="text-stone-300 text-sm mt-1">Seu clube de compras planejado</p>
          <p className="text-[#BD6B42] text-xs italic mt-3 max-w-xs">
            "Onde suas escolhas de consumo criam raízes e geram frutos."
          </p>
        </div>

        <div
          className={`flex flex-col justify-between transition-all duration-500 overflow-y-auto max-h-[85vh] ${
            modoLayout === 'site' ? 'w-1/2 p-4' : 'w-full p-2'
          }`}
        >
          {!isVerificando && !isEsqueceuSenha && !isResetandoSenha && (
            <div className="flex border-b border-stone-100 bg-stone-50/50">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setMensagem({ tipo: '', texto: '' });
                }}
                className={`flex-1 py-4 font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                  isLogin ? 'text-[#BD6B42] border-b-2 border-[#BD6B42] bg-white' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Acessar Conta
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setMensagem({ tipo: '', texto: '' });
                  setTipoUsuario('CLIENTE');
                }}
                className={`flex-1 py-4 font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                  !isLogin ? 'text-[#BD6B42] border-b-2 border-[#BD6B42] bg-white' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Nova Conta
              </button>
            </div>
          )}

          {isVerificando && (
            <form onSubmit={handleConfirmarCodigo} className="p-6 flex-1 flex flex-col justify-between space-y-4 text-left">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Verificação de Conta</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Insira o código verificador enviado para: <br />
                    <strong className="text-[#BD6B42] font-semibold">{identificadorLogin}</strong>
                  </p>
                </div>
                {mensagem.texto && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold border ${
                      mensagem.tipo === 'sucesso'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {mensagem.texto}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                    Código de Confirmação (6 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={codigoOtp}
                    onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center font-mono font-bold tracking-[0.3em] px-4 py-2 border rounded-xl bg-stone-50 h-[42px] text-sm focus:outline-none focus:border-[#0B1E14]"
                    required
                    disabled={carregando}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <button
                  type="submit"
                  disabled={codigoOtp.length !== 6 || carregando}
                  className={`w-full py-3.5 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md ${
                    codigoOtp.length === 6 && !carregando
                      ? 'bg-[#BD6B42] hover:scale-[1.01] cursor-pointer'
                      : 'bg-stone-300 cursor-not-allowed shadow-none opacity-50'
                  }`}
                >
                  {carregando ? 'PROCESSANDO...' : 'Confirmar e Ativar Conta'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsVerificando(false)}
                  className="w-full text-stone-400 hover:text-stone-700 text-center font-bold text-xs py-1"
                >
                  Cancelar e voltar
                </button>
              </div>
            </form>
          )}

          {isEsqueceuSenha && (
            <form onSubmit={handleSolicitarRecuperacao} className="p-6 flex-1 flex flex-col justify-between space-y-6 text-left">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Recuperação de Acesso</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Informe seu e-mail ou telefone cadastrado. Enviaremos um código token para criar uma nova senha.
                  </p>
                </div>
                {mensagem.texto && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold ${
                      mensagem.tipo === 'sucesso'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {mensagem.texto}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">E-mail ou Telefone com DDD</label>
                  <input
                    type="text"
                    placeholder="seu@email.com ou (45) 99999-9999"
                    value={identificadorLogin}
                    onChange={handleIdentificadorChange}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-sm bg-stone-50 h-[46px]"
                    required
                    disabled={carregando}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full py-3.5 bg-[#0B1E14] text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer hover:scale-[1.01] disabled:opacity-55"
                >
                  {carregando ? 'ENVIANDO...' : 'Enviar Código Verificador'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEsqueceuSenha(false)}
                  className="w-full text-stone-400 hover:text-stone-700 text-center font-bold text-xs py-1"
                >
                  Voltar ao Login
                </button>
              </div>
            </form>
          )}

          {isResetandoSenha && (
            <form onSubmit={handleSalvarNovaSenha} className="p-6 flex-1 flex flex-col justify-between space-y-4 text-left">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Criar Nova Senha</h3>
                  <p className="text-xs text-stone-400 mt-1">Insira o token de 6 dígitos recebido.</p>
                </div>
                {mensagem.texto && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold ${
                      mensagem.tipo === 'sucesso'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {mensagem.texto}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                    Token (6 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={codigoOtp}
                    onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center font-mono font-bold tracking-[0.3em] px-4 py-2 border rounded-xl bg-stone-50 h-[42px] text-sm focus:outline-none focus:border-[#0B1E14]"
                    required
                    disabled={carregando}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-500">Nova Senha</label>
                    {novaSenha.length > 0 && (
                      <span className={`text-[10px] font-bold ${novaSenhaForte ? 'text-emerald-600' : 'text-stone-400'}`}>
                        {novaSenhaForte ? 'Forte' : 'Fraca'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={mostrarNovaSenha ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-stone-50 text-sm h-[42px] focus:outline-none focus:border-[#0B1E14]"
                      required
                      disabled={carregando}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                      className="absolute right-3 top-2.5 text-stone-400 font-bold hover:text-stone-700"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <button
                  type="submit"
                  disabled={codigoOtp.length !== 6 || !novaSenhaForte || carregando}
                  className="w-full py-3.5 bg-[#BD6B42] text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 hover:scale-[1.01] transition-all"
                >
                  {carregando ? 'PROCESSANDO...' : 'Redefinir e Gravar Senha'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsResetandoSenha(false)}
                  className="w-full text-stone-400 text-center font-bold text-xs py-1"
                >
                  Desistir
                </button>
              </div>
            </form>
          )}

          {!isVerificando && !isEsqueceuSenha && !isResetandoSenha && (
            <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col justify-between text-left space-y-4">
              <div className="space-y-4">
                {mensagem.texto && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-bold text-center border ${
                      mensagem.tipo === 'sucesso'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {mensagem.texto}
                  </div>
                )}
                {!isLogin && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1.5 tracking-wider">
                        Tipo de Conta *
                      </label>
                      <div className="relative grid grid-cols-2 p-1 bg-stone-100 rounded-2xl border border-stone-200/80">
                        <div
                          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#0B1E14] rounded-xl shadow-md transition-all duration-300 ease-in-out ${
                            tipoUsuario === 'CLIENTE' ? 'left-1' : 'left-[calc(50%+3px)]'
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setTipoUsuario('CLIENTE');
                            setCpf('');
                            setTelefoneCadastro('');
                            setEmailCadastro('');
                          }}
                          className={`relative z-10 py-2.5 px-2 rounded-xl text-xs font-bold transition-colors duration-300 flex flex-col items-center justify-center text-center cursor-pointer ${
                            tipoUsuario === 'CLIENTE' ? 'text-white' : 'text-stone-500 hover:text-stone-800'
                          }`}
                          disabled={carregando}
                        >
                          <span>Sou Cliente</span>
                          <span
                            className={`text-[9px] font-normal mt-0.5 transition-colors duration-300 ${
                              tipoUsuario === 'CLIENTE' ? 'text-stone-300' : 'text-stone-400'
                            }`}
                          >
                            Quero participar de clubes
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTipoUsuario('LOJA');
                            setCpf('');
                            setTelefoneCadastro('');
                            setEmailCadastro('');
                          }}
                          className={`relative z-10 py-2.5 px-2 rounded-xl text-xs font-bold transition-colors duration-300 flex flex-col items-center justify-center text-center cursor-pointer ${
                            tipoUsuario === 'LOJA' ? 'text-white' : 'text-stone-500 hover:text-stone-800'
                          }`}
                          disabled={carregando}
                        >
                          <span>Sou Loja</span>
                          <span
                            className={`text-[9px] font-normal mt-0.5 transition-colors duration-300 ${
                              tipoUsuario === 'LOJA' ? 'text-stone-300' : 'text-stone-400'
                            }`}
                          >
                            Quero gerenciar clientes
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                        {tipoUsuario === 'LOJA' ? 'Nome / Razão Social da Loja *' : 'Nome Completo *'}
                      </label>
                      <input
                        type="text"
                        placeholder={tipoUsuario === 'LOJA' ? 'Nome/Razão Social da Loja' : 'Ex: João Silva'}
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] focus:ring-2 focus:ring-[#0B1E14]/5 text-sm bg-stone-50 h-[46px]"
                        required
                        disabled={carregando}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold uppercase text-stone-500">
                          {tipoUsuario === 'LOJA' ? 'CNPJ (Apenas números) *' : 'CPF (Apenas números) *'}
                        </label>
                        {cpf.length > 0 && (
                          <span className={`text-[10px] font-bold ${tamanhoDocumentoValido ? 'text-emerald-600' : 'text-stone-400'}`}>
                            {tipoUsuario === 'LOJA' ? `${cpf.length}/14` : `${cpf.length}/11`}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        maxLength={tipoUsuario === 'LOJA' ? 14 : 11}
                        placeholder={tipoUsuario === 'LOJA' ? '00000000000000' : '00000000000'}
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] focus:ring-2 focus:ring-[#0B1E14]/5 text-sm bg-stone-50 h-[46px]"
                        required
                        disabled={carregando}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold uppercase text-stone-500">
                          {tipoUsuario === 'LOJA' ? 'Telefone / WhatsApp da Loja *' : 'Telefone / Celular (Opcional)'}
                        </label>
                        {tipoUsuario === 'LOJA' && telefoneCadastroLimpo.length > 0 && (
                          <span className={`text-[10px] font-bold ${telefoneCadastroLimpo.length >= 10 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {telefoneCadastroLimpo.length >= 10 ? '✓ Válido' : '✗ Mínimo 10 dígitos'}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="(42) 99999-9999"
                        value={telefoneCadastro}
                        onChange={(e) => setTelefoneCadastro(aplicarMascaraTelefone(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] focus:ring-2 focus:ring-[#0B1E14]/5 text-sm bg-stone-50 h-[46px]"
                        required={tipoUsuario === 'LOJA'}
                        disabled={carregando}
                      />
                    </div>
                    {tipoUsuario === 'LOJA' && (
                      <div className="space-y-3 p-3.5 bg-stone-50/80 border border-stone-200 rounded-2xl transition-all duration-300">
                        <p className="text-[10px] font-bold uppercase text-[#BD6B42] tracking-wider">
                          Dados da Loja 
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                              CEP do Estabelecimento *
                            </label>
                            <input
                              type="text"
                              maxLength={9}
                              placeholder="85010-250"
                              value={cep}
                              onChange={(e) => setCep(aplicarMascaraCep(e.target.value))}
                              className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-xs bg-white h-[40px]"
                              required
                              disabled={carregando}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                              Faturamento Mensal *
                            </label>
                            <input
                              type="text"
                              placeholder="R$ 10.000,00"
                              value={faturamento}
                              onChange={(e) => setFaturamento(aplicarMascaraMoeda(e.target.value))}
                              className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-xs bg-white h-[40px]"
                              required
                              disabled={carregando}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1 flex justify-between">
                            <span>Wallet ID Asaas</span>
                            <span className="text-stone-400 font-normal">Opcional</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Deixe em branco para criar automaticamente"
                            value={walletIdInput}
                            onChange={(e) => setWalletIdInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-xs bg-white h-[40px] font-mono"
                            disabled={carregando}
                          />
                          <p className="text-[9px] text-stone-400 mt-1">
                            * Se você não possui conta no Asaas, o sistema criará sua subconta integrada automaticamente ao finalizar o cadastro.
                          </p>
                        </div>

                        <div className="pt-2 border-t border-stone-200">
                          <p className="text-[10px] font-bold uppercase text-[#0B1E14] mb-2">
                            Conta Bancária para Receber Vendas
                          </p>

                          <div className="space-y-2">
                            <div>
                              <label className="block text-[9px] font-bold uppercase text-stone-500 mb-1">
                                Banco *
                              </label>
                              <select
                                value={bancoCodigo}
                                onChange={(e) => setBancoCodigo(e.target.value)}
                                className="w-full h-[38px] px-2 bg-white border border-stone-200 rounded-xl text-stone-700 font-semibold text-xs focus:outline-none focus:border-[#0B1E14]"
                              >
                                <option value="001">001 - Banco do Brasil</option>
                                <option value="237">237 - Bradesco</option>
                                <option value="341">341 - Itaú Unibanco</option>
                                <option value="104">104 - Caixa Econômica</option>
                                <option value="033">033 - Santander</option>
                                <option value="260">260 - Nubank</option>
                                <option value="077">077 - Banco Inter</option>
                                <option value="212">212 - Banco Original</option>
                                <option value="336">336 - C6 Bank</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[9px] font-bold uppercase text-stone-500 mb-1">
                                  Agência *
                                </label>
                                <input
                                  type="text"
                                  placeholder="0001"
                                  value={agencia}
                                  onChange={(e) => setAgencia(e.target.value.replace(/\D/g, ''))}
                                  className="w-full px-2 py-1.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-xs bg-white h-[38px]"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] font-bold uppercase text-stone-500 mb-1">
                                  Conta *
                                </label>
                                <input
                                  type="text"
                                  placeholder="12345"
                                  value={conta}
                                  onChange={(e) => setConta(e.target.value.replace(/\D/g, ''))}
                                  className="w-full px-2 py-1.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-xs bg-white h-[38px]"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] font-bold uppercase text-stone-500 mb-1">
                                  Dígito *
                                </label>
                                <input
                                  type="text"
                                  maxLength={2}
                                  placeholder="0"
                                  value={contaDigito}
                                  onChange={(e) => setContaDigito(e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-xs bg-white h-[38px]"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold uppercase text-stone-500 mb-1">
                                Tipo de Conta *
                              </label>
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setTipoConta('CORRENTE')}
                                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${
                                    tipoConta === 'CORRENTE'
                                      ? 'bg-[#0B1E14] text-white border-[#0B1E14]'
                                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  Corrente
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTipoConta('POUPANCA')}
                                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${
                                    tipoConta === 'POUPANCA'
                                      ? 'bg-[#0B1E14] text-white border-[#0B1E14]'
                                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  Poupança
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 🟢 CAMPO DE LOGIN UNIFICADO (E-mail ou Telefone) */}
                {isLogin && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold uppercase text-stone-500">
                          E-mail ou Telefone com DDD *
                        </label>
                        {identificadorLogin.length > 0 && (
                          <span className={`text-[10px] font-bold ${loginValido ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {loginValido ? '✓ Válido' : '✗ Inválido'}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="seu@email.com ou (45) 99999-9999"
                        value={identificadorLogin}
                        onChange={handleIdentificadorChange}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] focus:ring-2 focus:ring-[#0B1E14]/5 text-sm bg-stone-50 h-[46px]"
                        required
                        disabled={carregando}
                      />
                    </div>
                )}

                {/* Campo E-mail apenas para Cadastro */}
                {!isLogin && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold uppercase text-stone-500">
                          {tipoUsuario === 'LOJA' ? 'E-mail *' : 'E-mail (Opcional)'}
                        </label>
                        {emailCadastro.length > 0 && (
                          <span className={`text-[10px] font-bold ${emailCadastroValido ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {emailCadastroValido ? '✓ Válido' : '✗ Inválido'}
                          </span>
                        )}
                      </div>
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        value={emailCadastro}
                        onChange={(e) => setEmailCadastro(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] focus:ring-2 focus:ring-[#0B1E14]/5 text-sm bg-stone-50 h-[46px]"
                        required={tipoUsuario === 'LOJA'}
                        disabled={carregando}
                      />
                    </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-500">Senha de Acesso *</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEsqueceuSenha(true);
                          setMensagem({ tipo: '', texto: '' });
                        }}
                        className="text-[10px] text-[#BD6B42] hover:underline font-bold"
                        disabled={carregando}
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-stone-50 focus:outline-none focus:border-[#0B1E14] text-sm h-[42px]"
                      required
                      disabled={carregando}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-2.5 text-stone-400 font-bold hover:text-stone-700"
                      disabled={carregando}
                    >
                      Ver
                    </button>
                  </div>

                  {!isLogin && senha.length > 0 && (
                    <div className="mt-2.5 p-3 bg-stone-50 border border-stone-200/60 rounded-xl space-y-1.5 text-[11px] font-medium animate-fade-in text-left">
                      <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Estrutura da Senha:</p>
                      <div
                        className={`flex items-center space-x-1.5 transition-colors ${
                          senha.length >= 8 ? 'text-emerald-600 font-bold' : 'text-stone-400'
                        }`}
                      >
                        <span>{senha.length >= 8 ? '✓' : '○'}</span>
                        <span>Mínimo de 8 caracteres</span>
                      </div>
                      <div
                        className={`flex items-center space-x-1.5 transition-colors ${
                          temMaiuscula ? 'text-emerald-600 font-bold' : 'text-stone-400'
                        }`}
                      >
                        <span>{temMaiuscula ? '✓' : '○'}</span>
                        <span>Pelo menos uma letra maiúscula</span>
                      </div>
                      <div
                        className={`flex items-center space-x-1.5 transition-colors ${
                          temNumero ? 'text-emerald-600 font-bold' : 'text-stone-400'
                        }`}
                      >
                        <span>{temNumero ? '✓' : '○'}</span>
                        <span>Pelo menos um número</span>
                      </div>
                      <div
                        className={`flex items-center space-x-1.5 transition-colors ${
                          temCaracterEspecial ? 'text-emerald-600 font-bold' : 'text-stone-400'
                        }`}
                      >
                        <span>{temCaracterEspecial ? '✓' : '○'}</span>
                        <span>Pelo menos um caractere especial (!@#$...)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!formularioValido || carregando}
                className="w-full mt-6 py-3.5 bg-[#0B1E14] text-white font-bold rounded-xl tracking-wide uppercase transition-all disabled:opacity-50 cursor-pointer text-xs shadow-md hover:bg-[#08170f]"
              >
                {carregando ? statusConexao : isLogin ? 'Entrar no Sistema' : 'Criar minha Conta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}