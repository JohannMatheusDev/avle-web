'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

export default function CadastroConvite({ params }: { params: { id: string } }) {
  const router = useRouter();
  const lojaId = params.id;
  
  const [lojaNome, setLojaNome] = useState<string>('Carregando...');
  const [lojaValida, setLojaValida] = useState<boolean>(true);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/lojas/${lojaId}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setLojaNome(data.nomeComercial || 'Loja Parceira');
      })
      .catch(() => {
        setLojaValida(false);
      });
  }, [lojaId]);

  const aplicarMascaraCpf = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    return apenasNumeros
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const aplicarMascaraTelefone = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    if (apenasNumeros.length <= 2) return apenasNumeros;
    if (apenasNumeros.length <= 6) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
    if (apenasNumeros.length <= 10) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`;
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);

    const payload = {
      nome,
      email: email.trim() === '' ? null : email,
      cpf: cpf.replace(/\D/g, ''),
      telefone: telefone.replace(/\D/g, ''),
      senha,
      tipoUsuario: 'CLIENTE',
      lojaId: Number(lojaId)
    };

    try {
      const res = await fetch(`${API_URL}/api/usuarios/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const erroTxt = await res.text();
        throw new Error(erroTxt || 'Falha ao realizar cadastro.');
      }

      setMensagem({ tipo: 'sucesso', texto: 'Cadastro realizado com sucesso! Redirecionando para login...' });
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!lojaValida) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-rose-100">
           <h2 className="text-xl font-bold text-rose-700 mb-2">Convite Invalido</h2>
           <p className="text-sm text-stone-500">A loja que voce esta tentando acessar nao existe ou o link expirou.</p>
           <button onClick={() => router.push('/')} className="mt-6 px-6 py-2 bg-[#0B1E14] text-white font-bold rounded-xl text-xs uppercase tracking-wider">Ir para o inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 font-sans text-[#0B1E14]">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="text-3xl font-serif font-bold tracking-tight text-[#0B1E14]">AVLE</h1>
          <div className="mt-4 inline-block bg-white px-4 py-2 rounded-full shadow-sm border border-stone-200">
             <span className="text-xs text-stone-500 font-medium">Convite especial da unidade: </span>
             <strong className="text-sm font-bold text-[#BD6B42] ml-1">{lojaNome}</strong>
          </div>
        </div>

        <div className="bg-white border border-[#DFD9CE] rounded-2xl p-6 md:p-8 shadow-xl animate-fadeIn">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#0B1E14]">Crie sua conta</h2>
            <p className="text-xs text-stone-500 mt-1">Preencha seus dados para acessar o catalogo e planos estruturados da loja.</p>
          </div>

          <form onSubmit={handleCadastro} className="space-y-4">
            
            {mensagem && (
              <div className={`p-3 text-xs font-bold rounded-xl ${mensagem.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {mensagem.texto}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Nome Completo</label>
              <input 
                type="text" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#BD6B42]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">CPF (Apenas numeros)</label>
              <input 
                type="text" 
                value={cpf}
                onChange={(e) => setCpf(aplicarMascaraCpf(e.target.value))}
                required
                placeholder="000.000.000-00"
                className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#BD6B42]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                 <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">E-mail (Opcional)</label>
                 <input 
                   type="email" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#BD6B42]"
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">WhatsApp (Opcional)</label>
                 <input 
                   type="text" 
                   value={telefone}
                   onChange={(e) => setTelefone(aplicarMascaraTelefone(e.target.value))}
                   placeholder="(00) 00000-0000"
                   className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#BD6B42]"
                 />
               </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Criar Senha Segura</label>
              <input 
                type="password" 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="Minimo 6 caracteres"
                className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#BD6B42]"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 mt-2 bg-[#0B1E14] text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-md"
            >
              {loading ? 'Processando...' : 'Finalizar Cadastro'}
            </button>
            
          </form>
        </div>
        
        <p className="text-center text-[10px] text-stone-400 mt-6 font-medium">
          Ao se cadastrar, voce concorda com os termos de servico da plataforma AVLE.
        </p>

      </div>
    </div>
  );
}