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
    return <div className="min-h-screen bg-[#0A130F]" />;
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

  const [isEsqueceuSenha, setIsEsqueceuSenha] = useState(false);
  const [isResetandoSenha, setIsResetandoSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);

  // Dados Básicos
  const [tipoUsuario, setTipoUsuario] = useState('CLIENTE');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // 🟢 NOVOS CAMPOS EXIGIDOS PARA LOJA (COMPLIANCE ASAAS)
  const [cep, setCep] = useState('');
  const [faturamento, setFaturamento] = useState('');
  const [bancoCodigo, setBancoCodigo] = useState('001'); // Padrão Banco do Brasil
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [contaDigito, setContaDigito] = useState('');
  const [tipoConta, setTipoConta] = useState('CORRENTE');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [modoLayout, setModoLayout] = useState<'mobile' | 'site'>('mobile');

  // GSAP - Animações de entrada e ambiente
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Animação de traço das raízes da Árvore AVLE
      [path1Ref.current, path2Ref.current].forEach((path) => {
        if (path) {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
          tl.to(path, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' }, 0.2);
        }
      });

      // Brilho orgânico do fundo
      if (glowRef.current) {
        tl.fromTo(
          glowRef.current,
          { scale: 0.3, opacity: 0 },
          { scale: 1, opacity: 0.2, duration: 1.8 },
          0
        );
      }

      // Animação 3D do Card
      if (cardRef.current) {
        tl.fromTo(
          cardRef.current,
          { opacity: 0, y: 50, rotateX: 10 },
          { opacity: 1, y: 0, rotateX: 0, duration: 1 },
          0.6
        );
      }

      // Flutuação das partículas ao fundo
      gsap.to('.gsap-leaf-particle', {
        y: '-=25',
        rotation: '+=30',
        duration: 'random(3, 5)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: { amount: 2, from: 'random' },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [modoLayout]);

  // Validações
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValido = regexEmail.test(email);
  const emailPreenchido = email.trim().length > 0;
  const emailValidoOuVazio = tipoUsuario === 'LOJA' ? emailValido : !emailPreenchido || emailValido;

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
  const telefoneLimpo = telefone.replace(/\D/g, '');
  const telefoneValidoSeLoja = tipoUsuario === 'LOJA' ? telefoneLimpo.length >= 10 : true;

  // Validações específicas da Loja
  const cepLimpo = cep.replace(/\D/g, '');
  const cepValidoSeLoja = tipoUsuario === 'LOJA' ? cepLimpo.length === 8 : true;
  const faturamentoValidoSeLoja = tipoUsuario === 'LOJA' ? faturamento.trim().length > 0 : true;
  const dadosBancariosValidosSeLoja =
    tipoUsuario === 'LOJA'
      ? agencia.trim().length >= 3 && conta.trim().length >= 4 && contaDigito.trim().length >= 1
      : true;

  const formularioValido = isLogin
    ? emailValido && senha.length > 0
    : emailValidoOuVazio &&
      telefoneValidoSeLoja &&
      senhaForte &&
      nome.trim() !== '' &&
      tamanhoDocumentoValido &&
      cepValidoSeLoja &&
      faturamentoValidoSeLoja &&
      dadosBancariosValidosSeLoja;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    setCarregando(true);

    if (!formularioValido) {
      setMensagem({ tipo: 'erro', texto: 'Por favor, preencha todos os campos obrigatórios corretamente!' });
      setCarregando(false);
      return;
    }

    try {
      if (isLogin) {
        const resposta = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha }),
        });

        if (resposta.status === 403) {
          setMensagem({ tipo: 'erro', texto: 'Sua conta ainda não foi verificada.' });
          setIsVerificando(true);
          return;
        }

        if (!resposta.ok) throw new Error('E-mail ou senha incorretos!');

        const dadosUsuario = await resposta.json();
        localStorage.setItem('@avle:usuario', JSON.stringify(dadosUsuario));
        router.push('/dashboard');
      } else {
        // Formata o faturamento para enviar como número decimal limpo ao backend
        const faturamentoNumerico = faturamento
          ? parseFloat(faturamento.replace(/[^\d,]/g, '').replace(',', '.'))
          : null;

        const payload = {
          nome,
          email: email.trim() !== '' ? email : null,
          cpf,
          senha,
          tipoUsuario,
          telefone: telefoneLimpo !== '' ? telefoneLimpo : null,
          // 🟢 Dados adicionais para homologação de subconta no Asaas se for LOJA
          cep: tipoUsuario === 'LOJA' ? cepLimpo : null,
          faturamento: tipoUsuario === 'LOJA' ? faturamentoNumerico : null,
          dadosBancarios:
            tipoUsuario === 'LOJA'
              ? {
                  bancoCodigo,
                  agencia,
                  conta,
                  contaDigito,
                  tipoConta,
                }
              : null,
        };

        const resposta = await fetch(`${API_URL}/api/usuarios/cadastro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!resposta.ok) {
          const textoErro = await resposta.text();
          throw new Error(textoErro || 'Erro ao realizar cadastro.');
        }

        setMensagem({ tipo: 'sucesso', texto: 'Conta cadastrada com sucesso!' });

        setTimeout(() => {
          setIsLogin(true);
          setNome('');
          setCpf('');
          setEmail('');
          setTelefone('');
          setCep('');
          setFaturamento('');
          setAgencia('');
          setConta('');
          setContaDigito('');
          setSenha('');
          setMensagem({ tipo: '', texto: '' });
        }, 1500);
      }
    } catch (erro: any) {
      setMensagem({ tipo: 'erro', texto: erro.message });
    } finally {
      setCarregando(false);
    }
  };

  const handleConfirmarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    setCarregando(true);

    try {
      const resposta = await fetch(`${API_URL}/api/usuarios/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo: codigoOtp }),
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

    if (!emailValido) {
      setMensagem({ tipo: 'erro', texto: 'Por favor, insira um e-mail válido.' });
      setCarregando(false);
      return;
    }

    try {
      const resposta = await fetch(`${API_URL}/api/auth/esqueceu-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!resposta.ok) throw new Error('E-mail não localizado no ecossistema AVLE.');

      setMensagem({ tipo: 'sucesso', texto: 'Código de redefinição enviado para o seu e-mail!' });

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

    try {
      const resposta = await fetch(`${API_URL}/api/auth/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo: codigoOtp, novaSenha }),
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
      className="min-h-screen bg-[#0A130F] flex flex-col justify-center items-center p-4 text-[#F8F5EE] relative select-none overflow-hidden transition-all duration-500"
    >
      {/* Glow de Fundo Animado com GSAP */}
      <div
        ref={glowRef}
        className="absolute w-[600px] h-[600px] bg-[#2EE59D] rounded-full blur-[160px] pointer-events-none -z-10"
      />

      {/* SVG da Árvore AVLE (Anéis de Crescimento e Raízes) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none -z-10 opacity-25"
        viewBox="0 0 1000 1000"
        fill="none"
      >
        <path
          ref={path1Ref}
          d="M 100,900 C 300,700 350,400 500,500 C 650,600 700,300 900,100"
          stroke="#2EE59D"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          ref={path2Ref}
          d="M 200,950 C 400,800 450,550 500,500 C 550,450 750,200 850,50"
          stroke="#D4AF37"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="500" cy="500" r="220" stroke="#2EE59D" strokeWidth="0.8" strokeDasharray="6 6" />
      </svg>

      {/* Partículas Flutuantes de Folhas/Sementes */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="gsap-leaf-particle absolute w-2 h-2 rounded-full bg-[#D4AF37]/50 blur-[1px]"
            style={{ top: `${20 + i * 12}%`, left: `${12 + i * 15}%` }}
          />
        ))}
      </div>

      {/* Alternador de Visualização */}
      <div className="mb-6 bg-[#0B1914]/80 p-1 rounded-2xl flex space-x-1 border border-[#D4AF37]/20 shadow-lg z-50 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setModoLayout('mobile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            modoLayout === 'mobile' ? 'bg-[#2EE59D] text-[#0A130F] shadow-md' : 'text-[#F8F5EE]/60 hover:text-white'
          }`}
        >
          Vista Mobile
        </button>
        <button
          type="button"
          onClick={() => setModoLayout('site')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            modoLayout === 'site' ? 'bg-[#2EE59D] text-[#0A130F] shadow-md' : 'text-[#F8F5EE]/60 hover:text-white'
          }`}
        >
          Vista Site
        </button>
      </div>

      {/* Card Principal de Autenticação */}
      <div
        ref={cardRef}
        className={`w-full bg-[#0B1914]/70 backdrop-blur-xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex transition-all duration-500 ease-in-out border border-[#D4AF37]/20 ${
          modoLayout === 'site' ? 'max-w-4xl min-h-[640px] flex-row' : 'max-w-md min-h-[660px] flex-col'
        }`}
      >
        {/* Painel Esquerdo da Marca */}
        <div
          className={`bg-gradient-to-b from-[#0A130F] to-[#0B1914] p-8 text-center flex flex-col items-center justify-center border-r border-[#D4AF37]/10 group transition-all duration-500 ${
            modoLayout === 'site' ? 'w-1/2' : 'w-full'
          }`}
        >
          <div className="w-16 h-16 bg-[#2EE59D]/10 border border-[#2EE59D]/40 rounded-full flex items-center justify-center mb-4 shadow-lg transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105">
            <span className="text-[#2EE59D] font-black text-2xl tracking-tighter">AV</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-[#F8F5EE] via-[#2EE59D] to-[#D4AF37] bg-clip-text text-transparent">
            AVLE
          </h1>
          <p className="text-[#F8F5EE]/70 text-xs mt-2 uppercase tracking-widest font-semibold">
            Clube de Compras Planejado
          </p>
          <p className="text-[#D4AF37]/80 text-[11px] italic mt-3 max-w-xs">
            "Onde suas escolhas de consumo criam raízes e geram frutos."
          </p>
        </div>

        {/* Form Container */}
        <div
          className={`flex flex-col justify-between transition-all duration-500 overflow-y-auto max-h-[85vh] ${
            modoLayout === 'site' ? 'w-1/2 p-6' : 'w-full p-2'
          }`}
        >
          {!isVerificando && !isEsqueceuSenha && !isResetandoSenha && (
            <div className="flex border-b border-[#2EE59D]/10 bg-[#0A130F]/40 rounded-t-2xl">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setMensagem({ tipo: '', texto: '' });
                }}
                className={`flex-1 py-4 font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                  isLogin
                    ? 'text-[#2EE59D] border-b-2 border-[#2EE59D] bg-[#0B1914]/80'
                    : 'text-[#F8F5EE]/40 hover:text-white'
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
                  !isLogin
                    ? 'text-[#2EE59D] border-b-2 border-[#2EE59D] bg-[#0B1914]/80'
                    : 'text-[#F8F5EE]/40 hover:text-white'
                }`}
              >
                Nova Conta
              </button>
            </div>
          )}

          {/* Estado: Verificação OTP */}
          {isVerificando && (
            <form onSubmit={handleConfirmarCodigo} className="p-6 flex-1 flex flex-col justify-between space-y-4 text-left">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#2EE59D]">Verificação de Conta</h3>
                  <p className="text-xs text-[#F8F5EE]/60 mt-1">
                    Insira o código verificador enviado para: <br />
                    <strong className="text-[#D4AF37]">{email}</strong>
                  </p>
                </div>
                {mensagem.texto && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold border ${
                      mensagem.tipo === 'sucesso'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                        : 'bg-rose-950/80 text-rose-400 border-rose-800'
                    }`}
                  >
                    {mensagem.texto}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#F8F5EE]/60 mb-1">
                    Código (6 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={codigoOtp}
                    onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center font-mono font-bold tracking-[0.3em] px-4 py-2 border border-[#2EE59D]/30 rounded-xl bg-[#0A130F]/90 text-white h-[42px] text-sm focus:outline-none focus:border-[#2EE59D]"
                    required
                    disabled={carregando}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <button
                  type="submit"
                  disabled={codigoOtp.length !== 6 || carregando}
                  className="w-full py-3.5 bg-gradient-to-r from-[#2EE59D] to-[#1bc281] text-[#0A130F] font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                >
                  {carregando ? 'PROCESSANDO...' : 'Confirmar e Ativar Conta'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsVerificando(false)}
                  className="w-full text-[#F8F5EE]/50 hover:text-white text-center font-bold text-xs py-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Estado: Esqueceu Senha */}
          {isEsqueceuSenha && (
            <form onSubmit={handleSolicitarRecuperacao} className="p-6 flex-1 flex flex-col justify-between space-y-6 text-left">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#2EE59D]">Recuperação de Acesso</h3>
                  <p className="text-xs text-[#F8F5EE]/60 mt-1">
                    Informe seu e-mail cadastrado para receber o token de redefinição.
                  </p>
                </div>
                {mensagem.texto && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold border ${
                      mensagem.tipo === 'sucesso'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                        : 'bg-rose-950/80 text-rose-400 border-rose-800'
                    }`}
                  >
                    {mensagem.texto}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#F8F5EE]/60 mb-1">E-mail Registrado</label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#2EE59D]/30 focus:outline-none focus:border-[#2EE59D] text-sm bg-[#0A130F]/90 text-white h-[46px]"
                    required
                    disabled={carregando}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full py-3.5 bg-gradient-to-r from-[#2EE59D] to-[#1bc281] text-[#0A130F] font-bold rounded-xl text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {carregando ? 'ENVIANDO...' : 'Enviar Código Verificador'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEsqueceuSenha(false)}
                  className="w-full text-[#F8F5EE]/50 hover:text-white text-center font-bold text-xs py-1"
                >
                  Voltar ao Login
                </button>
              </div>
            </form>
          )}

          {/* Estado: Redefinir Senha */}
          {isResetandoSenha && (
            <form onSubmit={handleSalvarNovaSenha} className="p-6 flex-1 flex flex-col justify-between space-y-4 text-left">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#2EE59D]">Criar Nova Senha</h3>
                  <p className="text-xs text-[#F8F5EE]/60 mt-1">Insira o token recebido e defina a nova credencial.</p>
                </div>
                {mensagem.texto && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold border ${
                      mensagem.tipo === 'sucesso'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                        : 'bg-rose-950/80 text-rose-400 border-rose-800'
                    }`}
                  >
                    {mensagem.texto}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#F8F5EE]/60 mb-1">
                    Token (6 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={codigoOtp}
                    onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center font-mono font-bold tracking-[0.3em] px-4 py-2 border border-[#2EE59D]/30 rounded-xl bg-[#0A130F]/90 text-white h-[42px] text-sm focus:outline-none focus:border-[#2EE59D]"
                    required
                    disabled={carregando}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold uppercase text-[#F8F5EE]/60">Nova Senha</label>
                    {novaSenha.length > 0 && (
                      <span className={`text-[10px] font-bold ${novaSenhaForte ? 'text-[#2EE59D]' : 'text-[#F8F5EE]/40'}`}>
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
                      className="w-full px-3 py-2 border border-[#2EE59D]/30 rounded-xl bg-[#0A130F]/90 text-white text-sm h-[42px] focus:outline-none focus:border-[#2EE59D]"
                      required
                      disabled={carregando}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                      className="absolute right-3 top-2.5 text-[#F8F5EE]/50 text-xs font-bold"
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
                  className="w-full py-3.5 bg-gradient-to-r from-[#2EE59D] to-[#1bc281] text-[#0A130F] font-bold rounded-xl text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {carregando ? 'PROCESSANDO...' : 'Redefinir Senha'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsResetandoSenha(false)}
                  className="w-full text-[#F8F5EE]/50 hover:text-white text-center font-bold text-xs py-1"
                >
                  Desistir
                </button>
              </div>
            </form>
          )}

          {/* Form Principal: Login / Cadastro */}
          {!isVerificando && !isEsqueceuSenha && !isResetandoSenha && (
            <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col justify-between text-left space-y-4">
              <div className="space-y-3">
                {mensagem.texto && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold text-center border ${
                      mensagem.tipo === 'sucesso'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                        : 'bg-rose-950/80 text-rose-400 border-rose-800'
                    }`}
                  >
                    {mensagem.texto}
                  </div>
                )}

                {/* Seção Exclusiva de Cadastro */}
                {!isLogin && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#F8F5EE]/60 mb-1">
                        Tipo de Conta *
                      </label>
                      <select
                        value={tipoUsuario}
                        onChange={(e) => {
                          setTipoUsuario(e.target.value);
                          setCpf('');
                          setTelefone('');
                          setEmail('');
                        }}
                        className="w-full h-[42px] px-3.5 bg-[#0A130F] border border-[#2EE59D]/30 rounded-xl text-white font-bold text-xs cursor-pointer focus:outline-none focus:border-[#2EE59D]"
                        disabled={carregando}
                      >
                        <option value="CLIENTE">Sou Cliente (Quero participar de clubes)</option>
                        <option value="LOJA">Sou Loja (Quero gerenciar meus clientes)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#F8F5EE]/60 mb-1">
                        {tipoUsuario === 'LOJA' ? 'Razão Social / Nome Fantasia *' : 'Nome Completo *'}
                      </label>
                      <input
                        type="text"
                        placeholder={tipoUsuario === 'LOJA' ? 'Ex: Caza Liz Decor' : 'Ex: João Silva'}
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#2EE59D]/20 focus:outline-none focus:border-[#2EE59D] text-sm bg-[#0A130F]/90 text-white h-[42px]"
                        required
                        disabled={carregando}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold uppercase text-[#F8F5EE]/60">
                          {tipoUsuario === 'LOJA' ? 'CNPJ (Apenas números) *' : 'CPF (Apenas números) *'}
                        </label>
                        {cpf.length > 0 && (
                          <span className={`text-[10px] font-bold ${tamanhoDocumentoValido ? 'text-[#2EE59D]' : 'text-[#F8F5EE]/40'}`}>
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
                        className="w-full px-4 py-2.5 rounded-xl border border-[#2EE59D]/20 focus:outline-none focus:border-[#2EE59D] text-sm bg-[#0A130F]/90 text-white h-[42px]"
                        required
                        disabled={carregando}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold uppercase text-[#F8F5EE]/60">
                          {tipoUsuario === 'LOJA' ? 'Telefone / WhatsApp da Loja *' : 'Telefone / Celular (Opcional)'}
                        </label>
                        {tipoUsuario === 'LOJA' && telefoneLimpo.length > 0 && (
                          <span className={`text-[10px] font-bold ${telefoneLimpo.length >= 10 ? 'text-[#2EE59D]' : 'text-rose-400'}`}>
                            {telefoneLimpo.length >= 10 ? '✓ Válido' : '✗ Mínimo 10 dígitos'}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="(42) 99999-9999"
                        value={telefone}
                        onChange={(e) => setTelefone(aplicarMascaraTelefone(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#2EE59D]/20 focus:outline-none focus:border-[#2EE59D] text-sm bg-[#0A130F]/90 text-white h-[42px]"
                        required={tipoUsuario === 'LOJA'}
                        disabled={carregando}
                      />
                    </div>

                    {/* 🟢 NOVOS CAMPOS EXCLUSIVOS SE FOR LOJA */}
                    {tipoUsuario === 'LOJA' && (
                      <div className="space-y-3 p-3 bg-[#0A130F]/80 border border-[#D4AF37]/30 rounded-2xl">
                        <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-wider">
                          Dados da Loja (Homologação Asaas)
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-[#F8F5EE]/60 mb-1">
                              CEP do Estabelecimento *
                            </label>
                            <input
                              type="text"
                              maxLength={9}
                              placeholder="85010-250"
                              value={cep}
                              onChange={(e) => setCep(aplicarMascaraCep(e.target.value))}
                              className="w-full px-3 py-2 rounded-xl border border-[#2EE59D]/20 focus:outline-none focus:border-[#2EE59D] text-xs bg-[#0A130F] text-white h-[38px]"
                              required
                              disabled={carregando}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-[#F8F5EE]/60 mb-1">
                              Faturamento Mensal *
                            </label>
                            <input
                              type="text"
                              placeholder="R$ 10.000,00"
                              value={faturamento}
                              onChange={(e) => setFaturamento(aplicarMascaraMoeda(e.target.value))}
                              className="w-full px-3 py-2 rounded-xl border border-[#2EE59D]/20 focus:outline-none focus:border-[#2EE59D] text-xs bg-[#0A130F] text-white h-[38px]"
                              required
                              disabled={carregando}
                            />
                          </div>
                        </div>

                        {/* Dados Bancários para Recebimento/Split */}
                        <div className="pt-2 border-t border-[#D4AF37]/20">
                          <p className="text-[10px] font-bold uppercase text-[#2EE59D] mb-2">
                            Conta Bancária para Receber Vendas (Split)
                          </p>

                          <div className="space-y-2">
                            <div>
                              <label className="block text-[9px] font-bold uppercase text-[#F8F5EE]/60 mb-1">
                                Banco *
                              </label>
                              <select
                                value={bancoCodigo}
                                onChange={(e) => setBancoCodigo(e.target.value)}
                                className="w-full h-[36px] px-2 bg-[#0A130F] border border-[#2EE59D]/20 rounded-lg text-white font-semibold text-xs focus:outline-none focus:border-[#2EE59D]"
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
                                <label className="block text-[9px] font-bold uppercase text-[#F8F5EE]/60 mb-1">
                                  Agência *
                                </label>
                                <input
                                  type="text"
                                  placeholder="0001"
                                  value={agencia}
                                  onChange={(e) => setAgencia(e.target.value.replace(/\D/g, ''))}
                                  className="w-full px-2 py-1.5 rounded-lg border border-[#2EE59D]/20 focus:outline-none focus:border-[#2EE59D] text-xs bg-[#0A130F] text-white h-[36px]"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] font-bold uppercase text-[#F8F5EE]/60 mb-1">
                                  Conta *
                                </label>
                                <input
                                  type="text"
                                  placeholder="12345"
                                  value={conta}
                                  onChange={(e) => setConta(e.target.value.replace(/\D/g, ''))}
                                  className="w-full px-2 py-1.5 rounded-lg border border-[#2EE59D]/20 focus:outline-none focus:border-[#2EE59D] text-xs bg-[#0A130F] text-white h-[36px]"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] font-bold uppercase text-[#F8F5EE]/60 mb-1">
                                  Dígito *
                                </label>
                                <input
                                  type="text"
                                  maxLength={2}
                                  placeholder="0"
                                  value={contaDigito}
                                  onChange={(e) => setContaDigito(e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-[#2EE59D]/20 focus:outline-none focus:border-[#2EE59D] text-xs bg-[#0A130F] text-white h-[36px]"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold uppercase text-[#F8F5EE]/60 mb-1">
                                Tipo de Conta *
                              </label>
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setTipoConta('CORRENTE')}
                                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${
                                    tipoConta === 'CORRENTE'
                                      ? 'bg-[#2EE59D] text-[#0A130F] border-[#2EE59D]'
                                      : 'bg-[#0A130F] text-white border-[#2EE59D]/20'
                                  }`}
                                >
                                  Corrente
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTipoConta('POUPANCA')}
                                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${
                                    tipoConta === 'POUPANCA'
                                      ? 'bg-[#2EE59D] text-[#0A130F] border-[#2EE59D]'
                                      : 'bg-[#0A130F] text-white border-[#2EE59D]/20'
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

                {/* E-mail e Senha */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold uppercase text-[#F8F5EE]/60">
                      {isLogin || tipoUsuario === 'LOJA' ? 'E-mail *' : 'E-mail (Opcional)'}
                    </label>
                    {email.length > 0 && (
                      <span className={`text-[10px] font-bold ${emailValido ? 'text-[#2EE59D]' : 'text-rose-400'}`}>
                        {emailValido ? '✓ Válido' : '✗ Inválido'}
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#2EE59D]/20 focus:outline-none focus:border-[#2EE59D] text-sm bg-[#0A130F]/90 text-white h-[42px]"
                    required={isLogin || tipoUsuario === 'LOJA'}
                    disabled={carregando}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold uppercase text-[#F8F5EE]/60">Senha de Acesso *</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setIsEsqueceuSenha(true)}
                        className="text-[10px] text-[#D4AF37] hover:underline font-bold"
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
                      className="w-full px-3 py-2 border border-[#2EE59D]/20 rounded-xl bg-[#0A130F]/90 text-white text-sm h-[42px] focus:outline-none focus:border-[#2EE59D]"
                      required
                      disabled={carregando}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-2.5 text-[#F8F5EE]/50 text-xs font-bold"
                      disabled={carregando}
                    >
                      Ver
                    </button>
                  </div>

                  {!isLogin && senha.length > 0 && (
                    <div className="mt-2.5 p-2.5 bg-[#0A130F]/80 border border-[#2EE59D]/20 rounded-xl space-y-1 text-[10px] font-medium text-left">
                      <p className="font-bold uppercase text-[#F8F5EE]/50 mb-1">Requisitos da Senha:</p>
                      <p className={senha.length >= 8 ? 'text-[#2EE59D] font-bold' : 'text-[#F8F5EE]/40'}>
                        {senha.length >= 8 ? '✓' : '○'} Mínimo de 8 caracteres
                      </p>
                      <p className={temMaiuscula ? 'text-[#2EE59D] font-bold' : 'text-[#F8F5EE]/40'}>
                        {temMaiuscula ? '✓' : '○'} Pelo menos uma letra maiúscula
                      </p>
                      <p className={temNumero ? 'text-[#2EE59D] font-bold' : 'text-[#F8F5EE]/40'}>
                        {temNumero ? '✓' : '○'} Pelo menos um número
                      </p>
                      <p className={temCaracterEspecial ? 'text-[#2EE59D] font-bold' : 'text-[#F8F5EE]/40'}>
                        {temCaracterEspecial ? '✓' : '○'} Pelo menos um caractere especial
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!formularioValido || carregando}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-[#2EE59D] to-[#1bc281] text-[#0A130F] font-extrabold rounded-xl tracking-wider uppercase transition-all hover:shadow-[0_0_25px_rgba(46,229,157,0.4)] disabled:opacity-40 cursor-pointer text-xs"
              >
                {carregando ? 'CARREGANDO...' : isLogin ? 'Entrar no Sistema' : 'Criar minha Conta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}