'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [isLogin, setIsLogin] = useState(true);
  const [isVerificando, setIsVerificando] = useState(false); 
  const [carregando, setCarregando] = useState(false); 
  
  const [isEsqueceuSenha, setIsEsqueceuSenha] = useState(false);
  const [isResetandoSenha, setIsResetandoSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);

  const [tipoUsuario, setTipoUsuario] = useState('CLIENTE'); 
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState(''); 
  const [codigoOtp, setCodigoOtp] = useState(''); 
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [modoLayout, setModoLayout] = useState<'mobile' | 'site'>('mobile');

  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValido = regexEmail.test(email);

  // Validação flexível: Obrigatório para LOJA, Opcional para CLIENTE
  const emailPreenchido = email.trim().length > 0;
  const emailValidoOuVazio = tipoUsuario === 'LOJA' 
    ? emailValido 
    : (!emailPreenchido || emailValido);

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

  const formularioValido = isLogin 
    ? (emailValido && senha.length > 0)
    : (emailValidoOuVazio && telefoneValidoSeLoja && senhaForte && nome.trim() !== '' && tamanhoDocumentoValido);

  const aplicarMascaraTelefone = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    if (apenasNumeros.length <= 2) return apenasNumeros;
    if (apenasNumeros.length <= 6) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
    if (apenasNumeros.length <= 10) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`;
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
        const resposta = await fetch(`${API_URL}/api/usuarios/cadastro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            nome, 
            email: email.trim() !== '' ? email : null, 
            cpf, 
            senha, 
            tipoUsuario, 
            telefone: telefoneLimpo !== '' ? telefoneLimpo : null 
          }),
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
        body: JSON.stringify({ email })
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
        body: JSON.stringify({ email, codigo: codigoOtp, novaSenha })
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
    <div className="min-h-screen bg-[#F5F2EB] flex flex-col justify-center items-center p-4 text-[#0B1E14] relative select-none transition-all duration-500">
      
      <div className="mb-6 bg-stone-200/80 p-1 rounded-2xl flex space-x-1 border border-stone-300 shadow-inner z-50">
        <button type="button" onClick={() => setModoLayout('mobile')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${modoLayout === 'mobile' ? 'bg-[#0B1E14] text-white shadow-md' : 'text-stone-500 hover:text-stone-700'}`}>Vista Mobile</button>
        <button type="button" onClick={() => setModoLayout('site')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${modoLayout === 'site' ? 'bg-[#0B1E14] text-white shadow-md' : 'text-stone-500 hover:text-stone-700'}`}>Vista Site</button>
      </div>

      <div className={`w-full bg-white rounded-3xl shadow-xl overflow-hidden flex transition-all duration-500 ease-in-out border border-stone-200/60 hover:shadow-2xl ${modoLayout === 'site' ? 'max-w-4xl min-h-[600px] flex-row' : 'max-w-md min-h-[660px] flex-col'}`}>
        
        <div className={`bg-[#0B1E14] p-8 text-center flex flex-col items-center justify-center group transition-all duration-500 ${modoLayout === 'site' ? 'w-1/2 rounded-r-3xl' : 'w-full'}`}>
          <div className="w-16 h-16 bg-[#F5F2EB] rounded-full flex items-center justify-center mb-3 shadow-md transition-transform duration-500 ease-out group-hover:rotate-12 group-hover:scale-105">
            <span className="text-[#0B1E14] font-black text-2xl">AV</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-wide">AVLE</h1>
          <p className="text-stone-300 text-sm mt-1">Seu clube de compras planejado</p>
        </div>

        <div className={`flex flex-col justify-between transition-all duration-500 ${modoLayout === 'site' ? 'w-1/2 p-4' : 'w-full'}`}>
          
          {!isVerificando && !isEsqueceuSenha && !isResetandoSenha && (
            <div className="flex border-b border-stone-100 bg-stone-50/50">
              <button type="button" onClick={() => { setIsLogin(true); setMensagem({ tipo: '', texto: '' }); }} className={`flex-1 py-4 font-bold text-xs uppercase tracking-wider transition-all duration-200 ${isLogin ? 'text-[#BD6B42] border-b-2 border-[#BD6B42] bg-white' : 'text-stone-400 hover:text-stone-600'}`}>Acessar Conta</button>
              <button type="button" onClick={() => { setIsLogin(false); setMensagem({ tipo: '', texto: '' }); setTipoUsuario('CLIENTE'); }} className={`flex-1 py-4 font-bold text-xs uppercase tracking-wider transition-all duration-200 ${!isLogin ? 'text-[#BD6B42] border-b-2 border-[#BD6B42] bg-white' : 'text-stone-400 hover:text-stone-600'}`}>Nova Conta</button>
            </div>
          )}

          {isVerificando && (
            <form onSubmit={handleConfirmarCodigo} className="p-6 flex-1 flex flex-col justify-between space-y-4 animate-fade-in text-left">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Verificação de Conta</h3>
                  <p className="text-xs text-stone-400 mt-1">Insira o código verificador de 6 dígitos enviado para o e-mail: <br /><strong className="text-[#BD6B42] font-semibold">{email}</strong></p>
                </div>
                {mensagem.texto && <div className={`p-3 rounded-xl text-xs font-bold border ${mensagem.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{mensagem.texto}</div>}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Código de Confirmação (6 dígitos)</label>
                  <input type="text" maxLength={6} placeholder="000000" value={codigoOtp} onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))} className="w-full text-center font-mono font-bold tracking-[0.3em] px-4 py-2 border rounded-xl bg-stone-50 h-[42px] text-sm focus:outline-none focus:border-[#0B1E14]" required disabled={carregando} />
                </div>
              </div>
              <div className="space-y-2">
                <button type="submit" disabled={codigoOtp.length !== 6 || carregando} className={`w-full py-3.5 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md ${codigoOtp.length === 6 && !carregando ? 'bg-[#BD6B42] hover:scale-[1.01] cursor-pointer' : 'bg-stone-300 cursor-not-allowed shadow-none opacity-50'}`}>
                  {carregando ? 'PROCESSANDO...' : 'Confirmar e Ativar Conta'}
                </button>
                <button type="button" onClick={() => { setIsVerificando(false); setMensagem({ tipo: '', texto: '' }); }} className="w-full text-stone-400 hover:text-stone-700 text-center font-bold text-xs py-1" disabled={carregando}>Cancelar e voltar</button>
              </div>
            </form>
          )}

          {isEsqueceuSenha && (
            <form onSubmit={handleSolicitarRecuperacao} className="p-6 flex-1 flex flex-col justify-between space-y-6 animate-fade-in text-left max-w-md">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Recuperação de Acesso</h3>
                  <p className="text-xs text-stone-400 mt-1">Informe seu e-mail cadastrado. Enviaremos um código token de autenticação de 6 dígitos para criar uma nova senha.</p>
                </div>
                {mensagem.texto && <div className={`p-3 rounded-xl text-xs font-bold ${mensagem.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{mensagem.texto}</div>}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">E-mail Registrado</label>
                  <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] text-sm bg-stone-50 h-[46px]" required disabled={carregando} />
                </div>
              </div>
              <div className="space-y-2">
                <button type="submit" disabled={carregando} className="w-full py-3.5 bg-[#0B1E14] text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer hover:scale-[1.01] disabled:opacity-55">
                  {carregando ? 'ENVIANDO...' : 'Enviar Código Verificador'}
                </button>
                <button type="button" onClick={() => { setIsEsqueceuSenha(false); setMensagem({ tipo: '', texto: '' }); }} className="w-full text-stone-400 hover:text-stone-700 text-center font-bold text-xs py-1" disabled={carregando}>Voltar ao Login</button>
              </div>
            </form>
          )}

          {isResetandoSenha && (
            <form onSubmit={handleSalvarNovaSenha} className="p-6 flex-1 flex flex-col justify-between space-y-4 animate-fade-in text-left">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">Criar Nova Senha</h3>
                  <p className="text-xs text-stone-400 mt-1">Insira o token de 6 números que chegou em seu e-mail e defina sua nova credencial forte.</p>
                </div>
                {mensagem.texto && <div className={`p-3 rounded-xl text-xs font-bold ${mensagem.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{mensagem.texto}</div>}
                
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Token de Verificação (6 dígitos)</label>
                  <input type="text" maxLength={6} placeholder="000000" value={codigoOtp} onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))} className="w-full text-center font-mono font-bold tracking-[0.3em] px-4 py-2 border rounded-xl bg-stone-50 h-[42px] text-sm focus:outline-none focus:border-[#0B1E14]" required disabled={carregando} />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-500">Nova Senha</label>
                    {novaSenha.length > 0 && <span className={`text-[10px] font-bold ${novaSenhaForte ? 'text-emerald-600' : 'text-stone-400'}`}>{novaSenhaForte ? 'Forte' : 'Fraca'}</span>}
                  </div>
                  <div className="relative">
                    <input type={mostrarNovaSenha ? 'text' : 'password'} placeholder="••••••••" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-stone-50 text-sm h-[42px] focus:outline-none focus:border-[#0B1E14]" required disabled={carregando} />
                    <button type="button" onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)} className="absolute right-3 top-2.5 text-stone-400 font-bold hover:text-stone-700" disabled={carregando}>Ver</button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <button type="submit" disabled={codigoOtp.length !== 6 || !novaSenhaForte || carregando} className="w-full py-3.5 bg-[#BD6B42] text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 hover:scale-[1.01] transition-all">
                  {carregando ? 'PROCESSANDO...' : 'Redefinir e Gravar Senha'}
                </button>
                <button type="button" onClick={() => { setIsResetandoSenha(false); setIsLogin(true); setMensagem({ tipo: '', texto: '' }); }} className="w-full text-stone-400 text-center font-bold text-xs py-1" disabled={carregando}>Desistir</button>
              </div>
            </form>
          )}

          {!isVerificando && !isEsqueceuSenha && !isResetandoSenha && (
            <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col justify-between text-left">
              <div className="space-y-4">
                {mensagem.texto && <div className={`p-3.5 rounded-xl text-xs font-bold text-center border ${mensagem.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{mensagem.texto}</div>}
                
                {!isLogin && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1.5 tracking-wider">Tipo de Conta *</label>
                      <div className="relative">
                        <select value={tipoUsuario} onChange={(e) => { setTipoUsuario(e.target.value); setCpf(''); setTelefone(''); setEmail(''); }} className="w-full h-[42px] px-3.5 bg-[#F5F2EB] border border-[#DFD9CE] rounded-xl text-[#0B1E14] font-bold text-xs cursor-pointer appearance-none focus:outline-none focus:border-[#BD6B42] pr-10 transition-colors" disabled={carregando}>
                          <option value="CLIENTE">Sou Cliente (Quero participar de clubes)</option>
                          <option value="LOJA">Sou Loja (Quero gerenciar meus clientes)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-stone-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">{tipoUsuario === 'LOJA' ? 'Nome / Razão Social da Loja *' : 'Nome Completo *'}</label>
                      <input type="text" placeholder={tipoUsuario === 'LOJA' ? "Ex: Caza Liz Decor" : "Ex: João Silva"} value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] focus:ring-2 focus:ring-[#0B1E14]/5 text-sm bg-stone-50 h-[46px]" required disabled={carregando} />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold uppercase text-stone-500">{tipoUsuario === 'LOJA' ? 'CNPJ (Apenas números) *' : 'CPF (Apenas números) *'}</label>
                        {cpf.length > 0 && <span className={`text-[10px] font-bold ${tamanhoDocumentoValido ? 'text-emerald-600' : 'text-stone-400'}`}>{tipoUsuario === 'LOJA' ? `${cpf.length}/14` : `${cpf.length}/11`}</span>}
                      </div>
                      <input type="text" maxLength={tipoUsuario === 'LOJA' ? 14 : 11} placeholder={tipoUsuario === 'LOJA' ? "00000000000000" : "00000000000"} value={cpf} onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] focus:ring-2 focus:ring-[#0B1E14]/5 text-sm bg-stone-50 h-[46px]" required disabled={carregando} />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold uppercase text-stone-500">{tipoUsuario === 'LOJA' ? 'Telefone / WhatsApp da Loja *' : 'Telefone / Celular (Opcional)'}</label>
                        {tipoUsuario === 'LOJA' && telefoneLimpo.length > 0 && (
                          <span className={`text-[10px] font-bold ${telefoneLimpo.length >= 10 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {telefoneLimpo.length >= 10 ? '✓ Válido' : '✗ Mínimo 10 dígitos'}
                          </span>
                        )}
                      </div>
                      <input type="text" placeholder="(42) 99999-9999" value={telefone} onChange={(e) => setTelefone(aplicarMascaraTelefone(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] focus:ring-2 focus:ring-[#0B1E14]/5 text-sm bg-stone-50 h-[46px]" required={tipoUsuario === 'LOJA'} disabled={carregando} />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-500">{isLogin || tipoUsuario === 'LOJA' ? 'E-mail *' : 'E-mail (Opcional)'}</label>
                    {email.length > 0 && <span className={`text-[10px] font-bold ${emailValido ? 'text-emerald-600' : 'text-rose-500'}`}>{emailValido ? '✓ Válido' : '✗ Inválido'}</span>}
                  </div>
                  <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0B1E14] focus:ring-2 focus:ring-[#0B1E14]/5 text-sm bg-stone-50 h-[46px]" required={isLogin || tipoUsuario === 'LOJA'} disabled={carregando} />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-500">Senha de Acesso *</label>
                    {isLogin && (
                      <button type="button" onClick={() => { setIsEsqueceuSenha(true); setMensagem({ tipo: '', texto: '' }); }} className="text-[10px] text-[#BD6B42] hover:underline font-bold" disabled={carregando}>
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input type={mostrarSenha ? 'text' : 'password'} placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-stone-50 focus:outline-none focus:border-[#0B1E14] text-sm h-[42px]" required disabled={carregando} />
                    <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-2.5 text-stone-400 font-bold hover:text-stone-700" disabled={carregando}>Ver</button>
                  </div>

                  {!isLogin && senha.length > 0 && (
                    <div className="mt-2.5 p-3 bg-stone-50 border border-stone-200/60 rounded-xl space-y-1.5 text-[11px] font-medium animate-fade-in text-left">
                      <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Estrutura da Senha:</p>
                      <div className={`flex items-center space-x-1.5 transition-colors ${senha.length >= 8 ? 'text-emerald-600 font-bold' : 'text-stone-400'}`}>
                        <span>{senha.length >= 8 ? '✓' : '○'}</span>
                        <span>Mínimo de 8 caracteres</span>
                      </div>
                      <div className={`flex items-center space-x-1.5 transition-colors ${temMaiuscula ? 'text-emerald-600 font-bold' : 'text-stone-400'}`}>
                        <span>{temMaiuscula ? '✓' : '○'}</span>
                        <span>Pelo menos uma letra maiúscula</span>
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
              </div>

              <button type="submit" disabled={!formularioValido || carregando} className="w-full mt-6 py-3.5 bg-[#0B1E14] text-white font-bold rounded-xl tracking-wide uppercase transition-all disabled:opacity-50 cursor-pointer text-xs">
                {carregando ? 'CARREGANDO...' : (isLogin ? 'Entrar no Sistema' : 'Criar minha Conta')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}