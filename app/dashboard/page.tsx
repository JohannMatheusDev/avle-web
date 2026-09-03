'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardAdmin from './components/DashboardAdmin';
import DashboardLoja from './components/DashboardLoja';
import DashboardCliente from './components/DashboardCliente';
import BoasVindasTermos from './components/BoasVindasTermos';

export default function DashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    
    const usuarioSalvo = localStorage.getItem('@avle:usuario');

    if (!usuarioSalvo) {
      router.push('/');
      return;
    }

    try {
      setUsuario(JSON.parse(usuarioSalvo));
    } catch (error) {
      localStorage.removeItem('@avle:usuario');
      router.push('/');
      return;
    }
    
    setCarregando(false);
  }, [router]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 animate-pulse">
          Carregando ambiente seguro...
        </p>
      </div>
    );
  }

  const tipo = usuario?.tipoUsuario?.toUpperCase();

  // As boas-vindas ficam por cima do painel que a pessoa ja veria, e nao no
  // lugar dele. Assim o aceite nao depende de acertar uma tela intermediaria
  // para cada tipo de usuario, e quem ja aceitou nao ve nada.
  const comBoasVindas = (painel: React.ReactNode) => (
    <>
      {painel}
      <BoasVindasTermos nome={usuario?.nome} />
    </>
  );

  switch (tipo) {
    case 'ADMIN':
      return <DashboardAdmin usuario={usuario} />;
    
    case 'LOJA':
      return comBoasVindas(<DashboardLoja usuario={usuario} />);
    
    case 'CLIENTE':
      return comBoasVindas(<DashboardCliente usuario={usuario} />);
    
    default:
      console.error("Tipo de usuário inválido:", tipo);
      localStorage.removeItem('@avle:usuario');
      router.push('/');
      return null;
  }
}