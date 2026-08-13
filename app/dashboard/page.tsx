'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import TelaCarregamento from './components/TelaCarregamento';

const API_URL = 'https://api.avle.com.br';

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

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

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

  const [cep, setCep] = useState('');
  const [faturamento, setFaturamento] = useState('');
  const [walletIdInput, setWalletIdInput] = useState(''); 
  const [bancoCodigo, setBancoCodigo] = useState('001'); 
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [contaDigito, setContaDigito] = useState('');
  const [tipoConta, setTipoConta] = useState('CORRENTE');
  
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [modalTermosAberto, setModalTermosAberto] = useState(false);

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [modoLayout, setModoLayout] = useState<'mobile' | 'site'>('mobile');

  useEffect(() => {
    fetch(`${API_URL}/api/health`, { method: 'GET' }).catch(() => {});
    const intervaloPing = setInterval(() => {
      fetch(`${API_URL}/api/health`, { method: 'GET' }).catch(() => {});
    }, 120000);
    return () => clearInterval(intervaloPing);
  }, []);

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

  const handleIdentificadorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    if (/^\d/.test(valor) || valor.startsWith('(')) {
      setIdentificadorLogin(aplicarMascaraTelefone(valor));
    } else {
      setIdentificadorLogin(valor);
    }
  };

  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const loginLimpo = identificadorLogin.replace(/\D/g, '');
  const isLoginEmailValido = regexEmail.test(identificadorLogin);
  const isLoginTelefoneValido = loginLimpo.length >= 10 && loginLimpo.length <= 11;
  const loginValido = isLoginEmailValido || isLoginTelefoneValido;

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

  const formularioValido = isLogin
    ? loginValido && senha.length > 0
    : emailCadastroValidoOuVazio &&
      telefoneCadastroValidoSeLoja &&
      senhaForte &&
      nome.trim() !== '' &&
      tamanhoDocumentoValido &&
      cepValidoSeLoja &&
      faturamentoValidoSeLoja &&
      dadosBancariosValidosSeLoja &&
      (tipoUsuario === 'LOJA' ? aceitouTermos : true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    setStatusConexao('CONECTANDO...');
    setCarregando(true);

    if (!formularioValido) {
      setMensagem({ tipo: 'erro', texto: 'Por favor, preencha todos os campos obrigatorios corretamente!' });
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
            if (identificadorLogin.includes('@')) {
               bodyPayload = { email: identificadorLogin.trim(), senha };
            } else {
               bodyPayload = { telefone: identificadorLogin.replace(/\D/g, ''), senha };
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
          setMensagem({ tipo: 'erro', texto: 'Sua conta ainda nao foi verificada.' });
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
          router.push('/dashboard');
          return;
        } else {
          setMensagem({ tipo: 'sucesso', texto: 'Conta cadastrada com sucesso!' });
          setTimeout(() => {
            setIsLogin(true);
            setNome(''); setCpf(''); setEmailCadastro(''); setTelefoneCadastro(''); setCep('');
            setFaturamento(''); setWalletIdInput(''); setAgencia(''); setConta('');
            setContaDigito(''); setSenha(''); setAceitouTermos(false);
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
          texto: 'Nao foi possivel conectar ao servidor. Verifique sua conexao e tente novamente.',
        });
        setCarregando(false);
      }
    }
  };

  const handleConfirmarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    setCarregando(true);

    const isTelefone = !identificadorLogin.includes('@');
    const payload = isTelefone 
        ? { telefone: identificadorLogin.replace(/\D/g, ''), codigo: codigoOtp } 
        : { email: identificadorLogin.trim(), codigo: codigoOtp };

    try {
      const resposta = await fetch(`${API_URL}/api/usuarios/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resposta.ok) {
        const textoErro = await resposta.text();
        throw new Error(textoErro || 'Codigo de verificacao incorreto ou expirado.');
      }

      setMensagem({ tipo: 'sucesso', texto: 'Conta ativada com sucesso! Faca seu login agora.' });
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

    const isTelefone = !identificadorLogin.includes('@');

    if (!isLoginEmailValido && !isTelefone) {
      setMensagem({ tipo: 'erro', texto: 'Por favor, insira um e-mail ou telefone valido.' });
      setCarregando(false);
      return;
    }

    const payload = isTelefone 
        ? { telefone: identificadorLogin.replace(/\D/g, '') } 
        : { email: identificadorLogin.trim() };

    try {
      const resposta = await fetch(`${API_URL}/api/auth/esqueceu-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resposta.ok) throw new Error('Dados nao localizados no ecossistema AVLE.');

      setMensagem({ tipo: 'sucesso', texto: 'Codigo de redefinicao enviado!' });

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
      setMensagem({ tipo: 'erro', texto: 'O codigo precisa ter 6 digitos e a nova senha precisa ser forte.' });
      setCarregando(false);
      return;
    }

    const isTelefone = !identificadorLogin.includes('@');
    const payload = isTelefone 
        ? { telefone: identificadorLogin.replace(/\D/g, ''), codigo: codigoOtp, novaSenha } 
        : { email: identificadorLogin.trim(), codigo: codigoOtp, novaSenha };

    try {
      const resposta = await fetch(`${API_URL}/api/auth/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resposta.ok) throw new Error('Codigo incorreto, expirado ou ja utilizado.');

      setMensagem({ tipo: 'sucesso', texto: 'Sua senha foi redefinida com sucesso! Faca seu login.' });

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
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            modoLayout === 'mobile' ? 'bg-[#0B1E14] text-white shadow-md' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Vista Mobile
        </button>
        <button
          type="button"
          onClick={() => setModoLayout('site')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
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
            "Onde suas escolhas criam raizes e geram frutos."
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
                  setAceitouTermos(false);
                }}
                className={`flex-1 py-4 font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
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
                  setAceitouTermos(false);
                }}
                className={`flex-1 py-4 font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Verificacao de Conta</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Insira o codigo verificador enviado para: <br />
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
                    Codigo de Confirmacao (6 digitos)
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
                  className="w-full text-stone-400 hover:text-stone-700 text-center font-bold text-xs py-1 cursor-pointer"
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Recuperacao de Acesso</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Informe seu e-mail ou telefone cadastrado. Enviaremos um codigo token para criar uma nova senha.
                  </p>
                </div>
                {mensagem.texto && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold ${
                      mensagem.tipo === 'sucesso'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
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
                  {carregando ? 'ENVIANDO...' : 'Enviar Codigo Verificador'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEsqueceuSenha(false)}
                  className="w-full text-stone-400 hover:text-stone-700 text-center font-bold text-xs py-1 cursor-pointer"
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
                  <p className="text-xs text-stone-400 mt-1">Insira o token de 6 digitos recebido.</p>
                </div>
                {mensagem.texto && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold ${
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
                    Token (6 digitos)
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
                      className="absolute right-3 top-2.5 text-stone-400 font-bold hover:text-stone-700 cursor-pointer"
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
                  className="w-full text-stone-400 text-center font-bold text-xs py-1 cursor-pointer"
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
                            setAceitouTermos(false);
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
                            setAceitouTermos(false);
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
                        {tipoUsuario === 'LOJA' ? 'Nome / Razao Social da Loja *' : 'Nome Completo *'}
                      </label>
                      <input
                        type="text"
                        placeholder={tipoUsuario === 'LOJA' ? 'Nome/Razao Social da Loja' : 'Ex: Joao Silva'}
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
                          {tipoUsuario === 'LOJA' ? 'CNPJ (Apenas numeros) *' : 'CPF (Apenas numeros) *'}
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
                          {tipoUsuario === 'LOJA' ? 'Telefone / WhatsApp da Loja *' : 'Telefone / Celular'}
                        </label>
                        {tipoUsuario === 'LOJA' && telefoneCadastroLimpo.length > 0 && (
                          <span className={`text-[10px] font-bold ${telefoneCadastroLimpo.length >= 10 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {telefoneCadastroLimpo.length >= 10 ? '✓ Valido' : '✗ Minimo 10 digitos'}
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
                            <span className="text-stone-400 font-normal">Obrigatorio</span>
                          </label>
                          <input
                            type="text"
                            value={walletIdInput}
                            onChange={(e) => setWalletIdInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-xs bg-white h-[40px] font-mono"
                            disabled={carregando}
                          />
                          <p className="text-[9px] text-stone-400 mt-1">
                            * Se voce nao possui conta no Asaas, o sistema criara sua subconta integrada automaticamente ao finalizar o cadastro.
                          </p>
                        </div>

                        <div className="pt-2 border-t border-stone-200">
                          <p className="text-[10px] font-bold uppercase text-[#0B1E14] mb-2">
                            Conta Bancaria para Receber Vendas
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
                                <option value="341">341 - Itau Unibanco</option>
                                <option value="104">104 - Caixa Economica</option>
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
                                  Agencia *
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
                                  Digito *
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
                                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all cursor-pointer ${
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
                                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all cursor-pointer ${
                                    tipoConta === 'POUPANCA'
                                      ? 'bg-[#0B1E14] text-white border-[#0B1E14]'
                                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  Poupanca
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isLogin && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold uppercase text-stone-500">
                          E-mail ou Telefone com DDD *
                        </label>
                        {identificadorLogin.length > 0 && (
                          <span className={`text-[10px] font-bold ${loginValido ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {loginValido ? '✓ Valido' : '✗ Invalido'}
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

                {!isLogin && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold uppercase text-stone-500">
                          {tipoUsuario === 'LOJA' ? 'E-mail *' : 'E-mail'}
                        </label>
                        {emailCadastro.length > 0 && (
                          <span className={`text-[10px] font-bold ${emailCadastroValido ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {emailCadastroValido ? '✓ Valido' : '✗ Invalido'}
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
                        className="text-[10px] text-[#BD6B42] hover:underline font-bold cursor-pointer"
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
                      className="absolute right-3 top-2.5 text-stone-400 font-bold hover:text-stone-700 cursor-pointer"
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
                        <span>Minimo de 8 caracteres</span>
                      </div>
                      <div
                        className={`flex items-center space-x-1.5 transition-colors ${
                          temMaiuscula ? 'text-emerald-600 font-bold' : 'text-stone-400'
                        }`}
                      >
                        <span>{temMaiuscula ? '✓' : '○'}</span>
                        <span>Pelo menos uma letra maiuscula</span>
                      </div>
                      <div
                        className={`flex items-center space-x-1.5 transition-colors ${
                          temNumero ? 'text-emerald-600 font-bold' : 'text-stone-400'
                        }`}
                      >
                        <span>{temNumero ? '✓' : '○'}</span>
                        <span>Pelo menos um numero</span>
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

                {!isLogin && tipoUsuario === 'LOJA' && (
                  <div className="flex items-start space-x-3 p-3 bg-stone-50 border border-stone-200/60 rounded-xl mt-2 animate-fade-in">
                    <input
                      type="checkbox"
                      id="termos-loja"
                      checked={aceitouTermos}
                      onChange={(e) => setAceitouTermos(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#0B1E14] cursor-pointer"
                      disabled={carregando}
                    />
                    <label htmlFor="termos-loja" className="text-[10px] text-stone-500 leading-relaxed cursor-pointer select-none">
                      Declaro que li e concordo com os{' '}
                      <button 
                        type="button" 
                        onClick={(e) => { e.preventDefault(); setModalTermosAberto(true); }} 
                        className="text-[#BD6B42] font-bold underline hover:text-[#0B1E14] transition-colors cursor-pointer"
                      >
                        Termos de Uso e o Contrato de Parceria
                      </button>{' '}
                      da AVLE. Compreendo que as operacoes estao sujeitas a auditoria de compliance.
                    </label>
                  </div>
                )}

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
      {modalTermosAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeIn text-left">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-stone-100">
              <div>
                <h3 className="text-base font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Contrato de Parceria e Termos de Uso</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Leia atentamente as condicoes operacionais e juridicas da plataforma AVLE.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setModalTermosAberto(false)} 
                className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer px-2"
              >
                X
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 text-xs text-stone-600 space-y-4 leading-relaxed bg-stone-50/30">
              <p className="font-bold text-stone-800">1. DO OBJETO</p>
              <p>Este documento estabelece as condicoes gerais para a utilizacao da infraestrutura tecnologica da AVLE pela LOJA PARCEIRA cadastrada, visando a gestao de clubes de compras e o split automatico de pagamentos.</p>
              
              <p className="font-bold text-stone-800 mt-4">2. DO REPASSE E SPLIT DE PAGAMENTOS</p>
              <p>Fica acordado que a plataforma AVLE retera automaticamente o percentual de 10% (dez por cento) sobre o valor de cada mensalidade transacionada via Gateway de Pagamento, a titulo de licenca de uso do software, sendo os 90% (noventa por cento) restantes repassados a subconta da LOJA PARCEIRA.</p>

              <p className="font-bold text-stone-800 mt-4">3. DA RESPONSABILIDADE SOLIDARIA</p>
              <p>A LOJA PARCEIRA assume integral responsabilidade civil e consumerista sobre a entrega dos produtos aos clientes contemplados no prazo estabelecido, bem como sobre a absorcao de eventuais taxas de chargeback geradas por contestacoes.</p>

              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl mt-6">
                <strong>Nota:</strong> O documento contratual final em formato PDF sera disponibilizado neste espaco assim que aprovado pela assessoria juridica. O aceite digital no formulario possui validade legal e vincula o CNPJ/CPF cadastrado a estas diretrizes.
              </div>
            </div>

            <div className="p-4 border-t border-stone-100 flex justify-end bg-stone-50 rounded-b-2xl">
              <button 
                type="button" 
                onClick={() => { 
                  setModalTermosAberto(false); 
                  setAceitouTermos(true); 
                }} 
                className="px-6 py-2.5 bg-[#0B1E14] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider cursor-pointer hover:bg-opacity-90 transition-all shadow-sm"
              >
                Li e Aceito as Condicoes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckoutForm({ valor, cotaId, onSuccess, fecharModal }: { valor: number; cotaId: number; onSuccess: () => void; fecharModal: () => void }) {
  const [metodo, setMetodo] = useState<'pix' | 'recorrente' | 'credito_total' | 'debito'>('pix');
  const [dadosPix, setDadosPix] = useState<{ paymentUrl: string } | null>(null);
  const [carregandoPix, setCarregandoPix] = useState(false);

  const [numeroCartao, setNumeroCartao] = useState('');
  const [nomeImpresso, setNomeImpresso] = useState('');
  const [validade, setValidade] = useState('');
  const [ccv, setCcv] = useState('');
  const [processando, setProcessando] = useState(false);
  const [mensagemCartao, setMensagemCartao] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    if (!cotaId || metodo !== 'pix') return;
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
      .catch(() => {})
      .finally(() => setCarregandoPix(false));
  }, [valor, cotaId, metodo]);

  const handlePagamentoCartao = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessando(true);
    setMensagemCartao(null);

    const mesAno = validade.split('/');
    if (mesAno.length !== 2 || mesAno[0].length !== 2 || mesAno[1].length !== 2) {
      setMensagemCartao({ tipo: 'erro', texto: 'Data de validade invalida. Use o formato MM/AA.' });
      setProcessando(false);
      return;
    }

    const endpoint = metodo === 'recorrente' ? '/api/pagamentos/assinatura-cartao' : '/api/pagamentos/cartao-unico';
    const tipoCobranca = metodo === 'credito_total' ? 'CREDIT_CARD' : 'DEBIT_CARD';

    const payload = metodo === 'recorrente' ? {
      cotaId,
      valor,
      numeroCartao: numeroCartao.replace(/\D/g, ''),
      nomeImpressoCartao: nomeImpresso.toUpperCase(),
      mesValidade: mesAno[0],
      anoValidade: '20' + mesAno[1],
      ccv: ccv.replace(/\D/g, '')
    } : {
      cotaId,
      valor,
      tipoCobranca,
      numeroCartao: numeroCartao.replace(/\D/g, ''),
      nomeImpressoCartao: nomeImpresso.toUpperCase(),
      mesValidade: mesAno[0],
      anoValidade: '20' + mesAno[1],
      ccv: ccv.replace(/\D/g, '')
    };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const erroMsg = await res.text();
        throw new Error(erroMsg || 'Falha ao processar o cartão.');
      }

      setMensagemCartao({ tipo: 'sucesso', texto: 'Pagamento processado com sucesso!' });
      setTimeout(() => {
        onSuccess();
        fecharModal();
      }, 2000);
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

  return (
    <div className="space-y-5 text-[#0B1E14]">
      <div className="grid grid-cols-4 gap-1 bg-stone-100 p-1 rounded-xl text-[9px] font-bold uppercase tracking-wider">
        <button type="button" onClick={() => setMetodo('pix')} className={`py-2 rounded-lg transition-colors cursor-pointer ${metodo === 'pix' ? 'bg-[#0B1E14] text-white shadow' : 'text-stone-500'}`}>Pix</button>
        <button type="button" onClick={() => setMetodo('recorrente')} className={`py-2 rounded-lg transition-colors cursor-pointer ${metodo === 'recorrente' ? 'bg-[#0B1E14] text-white shadow' : 'text-stone-500'}`}>Mensal</button>
        <button type="button" onClick={() => setMetodo('credito_total')} className={`py-2 rounded-lg transition-colors cursor-pointer ${metodo === 'credito_total' ? 'bg-[#0B1E14] text-white shadow' : 'text-stone-500'}`}>Crédito</button>
        <button type="button" onClick={() => setMetodo('debito')} className={`py-2 rounded-lg transition-colors cursor-pointer ${metodo === 'debito' ? 'bg-[#0B1E14] text-white shadow' : 'text-stone-500'}`}>Débito</button>
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
                onSuccess();
                fecharModal();
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
              <span>Seu limite <strong>não será bloqueado no valor total</strong>. O sistema cobrará apenas o valor da parcela mensalmente.</span>
            ) : metodo === 'credito_total' ? (
              <span>Transação de cartão de crédito à vista com repasse imediato via split.</span>
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