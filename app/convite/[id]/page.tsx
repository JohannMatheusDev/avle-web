'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import gsap from 'gsap';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

export default function CadastroConvite() {
  const router = useRouter();
  const params = useParams();
  const slugDaLoja = decodeURIComponent(params.id as string);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const [lojaNome, setLojaNome] = useState<string>('Carregando...');
  const [lojaIdNum, setLojaIdNum] = useState<number | null>(null);
  const [lojaValida, setLojaValida] = useState<boolean>(true);

  const [isLogin, setIsLogin] = useState(false);
  const [isVerificando, setIsVerificando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [statusConexao, setStatusConexao] = useState('CONECTANDO...');

  const [isEsqueceuSenha, setIsEsqueceuSenha] = useState(false);
  const [isResetandoSenha, setIsResetandoSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);

  const [identificadorLogin, setIdentificadorLogin] = useState(''); 
  const [emailCadastro, setEmailCadastro] = useState('');
  const [telefoneCadastro, setTelefoneCadastro] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [modalTermosAberto, setModalTermosAberto] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [modoLayout, setModoLayout] = useState<'mobile' | 'site'>('mobile');

  // NOVIDADE: A busca agora compara o NOME do link com a lista de lojas!
  useEffect(() => {
    if (!slugDaLoja) return;

    // Extrai o ID numérico que está no começo do parâmetro (Ex: "2-dona-kika" vira "2")
    const idExtraido = slugDaLoja.split('-')[0];

    if (!idExtraido || isNaN(Number(idExtraido))) {
      setLojaValida(false);
      return;
    }

    // Busca diretamente pelo ID oficial da loja no Java
    fetch(`${API_URL}/api/lojas/${idExtraido}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setLojaNome(data.nomeComercial || data.nome || 'Loja Parceira');
        setLojaIdNum(data.id);
        
        // Salva com segurança o ID correto
        sessionStorage.setItem('@avle:convite_loja_id', data.id.toString());
        sessionStorage.setItem('@avle:abrir_cadastro', 'true');
      })
      .catch(() => {
        setLojaValida(false);
      });
  }, [slugDaLoja]);

  useEffect(() => {
    fetch(`${API_URL}/api/health`, { method: 'GET' }).catch(() => {});
    const intervaloPing = setInterval(() => {
      fetch(`${API_URL}/api/health`, { method: 'GET' }).catch(() => {});
    }, 120000);
    return () => clearInterval(intervaloPing);
  }, []);

  useEffect(() => {
    if (!lojaValida) return;

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
  }, [modoLayout, lojaValida]);

  const aplicarMascaraTelefone = (valor: string) => {
    const v = valor.replace(/\D/g, '');
    if (v.length <= 2) return v;
    if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7, 11)}`;
  };

  const aplicarMascaraCpf = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    return apenasNumeros
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
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
  const emailCadastroValidoOuVazio = !emailCadastroPreenchido || emailCadastroValido;

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

  const tamanhoDocumentoValido = cpf.length === 11;
  
  const formularioValido = isLogin
    ? loginValido && senha.length > 0
    : emailCadastroValidoOuVazio &&
      senhaForte &&
      nome.trim() !== '' &&
      tamanhoDocumentoValido &&
      aceitouTermos;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    setStatusConexao('CONECTANDO...');
    setCarregando(true);

    if (!lojaIdNum) {
      setMensagem({ tipo: 'erro', texto: 'Falha na identificacao da loja. Recarregue a pagina.' });
      setCarregando(false);
      return;
    }

    if (!formularioValido) {
      setMensagem({ tipo: 'erro', texto: 'Por favor, preencha todos os campos obrigatorios corretamente e aceite os termos!' });
      setCarregando(false);
      return;
    }

    const maxTentativas = 4;

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const endpoint = isLogin ? `${API_URL}/api/auth/login` : `${API_URL}/api/usuarios/cadastro`;

        let bodyPayload: any = {};

        if (isLogin) {
            if (identificadorLogin.includes('@')) {
               bodyPayload = { email: identificadorLogin.trim(), senha };
            } else {
               bodyPayload = { telefone: identificadorLogin.replace(/\D/g, ''), senha };
            }
        } else {
            const telefoneCadastroLimpo = telefoneCadastro.replace(/\D/g, '');
            bodyPayload = {
              nome,
              email: emailCadastro.trim() !== '' ? emailCadastro : null,
              cpf,
              senha,
              tipoUsuario: 'CLIENTE',
              telefone: telefoneCadastroLimpo !== '' ? telefoneCadastroLimpo : null,
              lojaId: lojaIdNum
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
          setMensagem({ tipo: 'sucesso', texto: 'Conta cadastrada com sucesso! Faca o seu login.' });
          setTimeout(() => {
            setIsLogin(true);
            setNome(''); setCpf(''); setEmailCadastro(''); setTelefoneCadastro('');
            setSenha(''); setAceitouTermos(false);
            setMensagem({ tipo: '', texto: '' });
          }, 2000);
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

  if (!lojaValida) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-rose-100">
           <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <span className="text-rose-600 font-bold text-2xl">!</span>
           </div>
           <h2 className="text-xl font-bold text-rose-700 mb-2">Convite Invalido</h2>
           <p className="text-sm text-stone-500">A loja que voce esta tentando acessar nao existe, ou o link expirou.</p>
           <button onClick={() => router.push('/')} className="mt-6 px-6 py-3 bg-[#0B1E14] text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer hover:bg-opacity-90">Ir para o inicio</button>
        </div>
      </div>
    );
  }

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
          
          <div className="mt-8 pt-6 border-t border-stone-700/50">
             <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">Convite Exclusivo</span>
             <h3 className="text-[#BD6B42] text-sm font-bold tracking-wide">{lojaNome}</h3>
          </div>
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
                  <div className="space-y-4 animate-fade-in">
                    
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Joao Silva"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] focus:ring-2 focus:ring-[#0B1E14]/5 text-sm bg-stone-50 h-[46px]"
                        required
                        disabled={carregando}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div>
                         <div className="flex justify-between items-center mb-1">
                           <label className="block text-[10px] font-bold uppercase text-stone-500">
                             CPF *
                           </label>
                         </div>
                         <input
                           type="text"
                           maxLength={14}
                           placeholder="000.000.000-00"
                           value={cpf}
                           onChange={(e) => setCpf(aplicarMascaraCpf(e.target.value))}
                           className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] focus:ring-2 focus:ring-[#0B1E14]/5 text-sm bg-stone-50 h-[46px]"
                           required
                           disabled={carregando}
                         />
                       </div>

                       <div>
                         <div className="flex justify-between items-center mb-1">
                           <label className="block text-[10px] font-bold uppercase text-stone-500">
                             E-mail (Opcional)
                           </label>
                         </div>
                         <input
                           type="email"
                           placeholder="seu@email.com"
                           value={emailCadastro}
                           onChange={(e) => setEmailCadastro(e.target.value)}
                           className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] focus:ring-2 focus:ring-[#0B1E14]/5 text-sm bg-stone-50 h-[46px]"
                           disabled={carregando}
                         />
                       </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                        Telefone / WhatsApp (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="(42) 99999-9999"
                        value={telefoneCadastro}
                        onChange={(e) => setTelefoneCadastro(aplicarMascaraTelefone(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] focus:ring-2 focus:ring-[#0B1E14]/5 text-sm bg-stone-50 h-[46px]"
                        disabled={carregando}
                      />
                    </div>
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
                      onClick={() => setMostrarNovaSenha(!mostrarSenha)}
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

                {!isLogin && (
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
                        Termos de Uso e o Contrato da Loja
                      </button>{' '}
                      hospedada na plataforma AVLE.
                    </label>
                  </div>
                )}

              </div>

              <button
                type="submit"
                disabled={!formularioValido || carregando}
                className="w-full mt-6 py-3.5 bg-[#0B1E14] text-white font-bold rounded-xl tracking-wide uppercase transition-all disabled:opacity-50 cursor-pointer text-xs shadow-md hover:bg-[#08170f]"
              >
                {carregando ? statusConexao : isLogin ? 'Entrar no Sistema' : 'Finalizar Cadastro'}
              </button>
            </form>
          )}
        </div>
      </div>
      
      {modalTermosAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeIn text-left">
          <div className="bg-white border border-[#DFD9CE] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-stone-100">
              <div>
                <h3 className="text-base font-serif font-bold text-[#0B1E14] uppercase tracking-wide">Contrato de Adesao</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Loja: {lojaNome}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setModalTermosAberto(false)} 
                className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer px-2"
              >
                X
              </button>
            </div>
            
            <div className="p-0 overflow-hidden flex-1 bg-stone-50/30 flex flex-col">
              {lojaIdNum && (
                <iframe
                   src={`${API_URL}/api/lojas/${lojaIdNum}/regras`}
                   className="w-full h-[50vh] sm:h-[60vh] border-none"
                   title="Contrato da Loja"
                />
              )}
            </div>

            <div className="p-4 border-t border-stone-100 flex justify-end bg-stone-50 rounded-b-2xl gap-3">
              <button 
                type="button" 
                onClick={() => setModalTermosAberto(false)} 
                className="px-6 py-2.5 border border-stone-200 text-stone-600 font-bold rounded-xl text-[10px] uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-all shadow-sm"
              >
                Fechar
              </button>
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