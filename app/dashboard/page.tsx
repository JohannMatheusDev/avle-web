'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardAdmin from './components/DashboardAdmin';
import DashboardLoja from './components/DashboardLoja';
import DashboardCliente from './components/DashboardCliente';
import DashboardAfiliado from './components/DashboardAfiliado';
import BoasVindasTermos from './components/BoasVindasTermos';
import { escolherPainel, painelEscolhido, type Painel } from '../lib/painelDaAfiliada';

export default function DashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [painel, setPainel] = useState<Painel>('cliente');

  useEffect(() => {
    
    const usuarioSalvo = localStorage.getItem('@avle:usuario');

    if (!usuarioSalvo) {
      router.push('/');
      return;
    }

    try {
      setUsuario(JSON.parse(usuarioSalvo));
      setPainel(painelEscolhido());
    } catch (error) {
      localStorage.removeItem('@avle:usuario');
      router.push('/');
      return;
    }
    
    setCarregando(false);
  }, [router]);

  if (carregando) {
    return (
      <div className="min-h-screen fundo-painel flex items-center justify-center">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 animate-pulse">
          Carregando ambiente seguro...
        </p>
      </div>
    );
  }

  const tipo = usuario?.tipoUsuario?.toUpperCase();

  const trocarDePainel = (p: Painel) => {
    escolherPainel(p);
    setPainel(p);
    window.scrollTo(0, 0);
  };

  // As boas-vindas ficam por cima do painel que a pessoa ja veria, e nao no
  // lugar dele. Assim o aceite nao depende de acertar uma tela intermediaria
  // para cada tipo de usuario, e quem ja aceitou nao ve nada.
  //
  // So a cliente recebe. Os termos falam de pagar parcela e concorrer a
  // contemplacao; na loja, a tela travava o painel pedindo aceite de
  // compromissos que nao sao dela.
  const comBoasVindas = (conteudo: React.ReactNode) => (
    <>
      {conteudo}
      <BoasVindasTermos nome={usuario?.nome} />
    </>
  );

  switch (tipo) {
    case 'ADMIN':
      return <DashboardAdmin usuario={usuario} />;
    
    case 'LOJA':
    // O colaborador usa o painel da loja, sem o que é só da loja mãe.
    case 'COLABORADOR':
      return <DashboardLoja usuario={usuario} />;
    
    // A afiliada também é cliente e alterna entre os dois painéis: o da
    // cliente é por onde ela mostra como o clube funciona.
    case 'CLIENTE':
      if (usuario.afiliada && painel === 'afiliada') {
        return <DashboardAfiliado usuario={usuario} aoAbrirPainelDaCliente={() => trocarDePainel('cliente')} />;
      }
      return comBoasVindas(
        <DashboardCliente
          usuario={usuario}
          aoAbrirPainelDaAfiliada={usuario.afiliada ? () => trocarDePainel('afiliada') : undefined}
        />,
      );

    // Sessão guardada antes de a afiliada virar cliente. O próximo login já
    // chega como CLIENTE.
    case 'AFILIADO':
      return <DashboardAfiliado usuario={usuario} />;
    
    default:
      console.error("Tipo de usuário inválido:", tipo);
      localStorage.removeItem('@avle:usuario');
      router.push('/');
      return null;
  }
}