'use client';

import { useEffect, useState } from 'react';
import EnvioDeCobrancasWhatsapp from './EnvioDeCobrancasWhatsapp';
import PainelDeAvisosFlutuante from './PainelDeAvisosFlutuante';
import {
  Avatar, BarraSuperior, BotaoDaConta, BotaoRedondo, CabecalhoDaPagina, ItemDeNavegacao,
  TrilhoDeNavegacao,
} from './Casca';
import { ContaAvleDoAdmin, PaginaContaAvle } from './ContaAvle';
import {
  ArteDaMarca, BarrasMini, BlocoDeAdicionar, BlocoDoDetalhe, BlocosDeValor, BotaoDeCanto,
  BotaoEscuro, CartaoIndicador, FaixaDeNumeros, ItemDoPainel, LinhaMini, PainelEscuro,
  Variacao, numeroCurto, realCurto, sigla, variacao,
} from './Indicadores';
import { useRouter } from 'next/navigation';
import { apiFetch, encerrarSessao } from '../../lib/api';
import { useHistoricoDoPainel } from '../../lib/historico';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

export default function DashboardAdmin({ usuario }: { usuario: any }) {
  const router = useRouter();
  const [abaExibida, setAbaExibida] = useState<'geral' | 'lojas' | 'financeiro' | 'cobranca' | 'conta'>('geral');

  const [lojaSelecionada, setLojaSelecionada] = useState<any | null>(null);
  // Painel escuro da tela inicial: o recorte das lojas e qual esta no detalhe.
  const [abaLojasInicio, setAbaLojasInicio] = useState<'todas' | 'areceber'>('todas');
  const [lojaEmFoco, setLojaEmFoco] = useState<number | null>(null);
  const [limiteInput, setLimiteInput] = useState<number>(1);

  const [metricas, setMetricas] = useState<any>({
    totalClientes: 0,
    totalLojas: 0,
    totalTransacionado: 0,
    faturamentoPlataforma: 0,
    totalAReceber: 0,
  });

  const [listaLojas, setListaLojas] = useState<any[]>([]);

  // Split consolidado: separa a taxa ja recolhida pelo Asaas da que ficou a
  // receber porque a loja deu baixa manual e o dinheiro nao passou pela
  // plataforma.
  const [split, setSplit] = useState<any | null>(null);

  // Fonte unica do painel: totais, crescimento, lojas e movimentacao recente.
  const [visaoGeral, setVisaoGeral] = useState<any | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processandoStatus, setProcessandoStatus] = useState(false);

  const carregarDadosDoBanco = async () => {
    setCarregando(true);

    try {
      const resMetricas = await apiFetch(`${API_URL}/api/financeiro/admin/dashboard`);
      if (resMetricas.ok) {
        const data = await resMetricas.json();
        setMetricas(data);
      }
    } catch (erro) {
    }

    try {
      const resVisao = await apiFetch(`${API_URL}/api/admin/visao-geral`);
      if (resVisao.ok) setVisaoGeral(await resVisao.json());
    } catch (erro) {
      // A tela segue com o que ja tiver; os blocos tratam ausencia de dado.
    }

    try {
      const resSplit = await apiFetch(`${API_URL}/api/financeiro/admin/split`);
      if (resSplit.ok) setSplit(await resSplit.json());
    } catch (erro) {
      // O painel continua util sem o consolidado; os cards apenas nao aparecem.
    }

    try {
      const resLojas = await apiFetch(`${API_URL}/api/lojas/listar-todas`);
      if (resLojas.ok) {
        const data = await resLojas.json();
        if (Array.isArray(data)) {
          const lojasTratadas = data.map((loja: any) => ({
            ...loja,
            nomeComercial: loja.nomeComercial || loja.nome_comercial || loja.nome || 'Loja Cadastrada',
            cnpj: loja.cnpj || 'Sem CNPJ',
            statusHomologacao: loja.statusHomologacao || 'HOMOLOGADO',
            limiteGruposAtivos: loja.limiteGruposAtivos || 1,
            grupos: loja.grupos || 0,
            participantes: loja.participantes || 0,
            faturamento: Number(loja.faturamento) || 0,
            volumeBruto: Number(loja.volumeBruto) || Number(loja.totalTransacionado) || 0,
            inadimplencia: Number(loja.inadimplencia) || 0,
          }));
          setListaLojas(lojasTratadas);

          if (lojaSelecionada) {
            const lojaAtualizada = lojasTratadas.find((l) => l.id === lojaSelecionada.id);
            if (lojaAtualizada) {
              setLojaSelecionada(lojaAtualizada);
              setLimiteInput(lojaAtualizada.limiteGruposAtivos);
            }
          }
        }
      }
    } catch (erro) {
      setListaLojas([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDadosDoBanco();
  }, []);

  useEffect(() => {
    if(lojaSelecionada) {
       setLimiteInput(lojaSelecionada.limiteGruposAtivos || 1);
    }
  }, [lojaSelecionada]);

  const alterarStatusLoja = async (lojaId: number, novoStatus: string) => {
    setProcessandoStatus(true);
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/status-homologacao`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (!res.ok) throw new Error();

      await carregarDadosDoBanco();
      alert(`Status da loja alterado com sucesso!`);
    } catch (err) {
      alert('Falha ao atualizar o status da loja. Verifique o servidor.');
    } finally {
      setProcessandoStatus(false);
    }
  };

  const alterarLimiteGrupos = async (lojaId: number, limite: number) => {
    setProcessandoStatus(true);
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/limite-grupos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limite }),
      });

      if (!res.ok) throw new Error();

      await carregarDadosDoBanco();
      alert(`Limite de grupos atualizado com sucesso!`);
    } catch (err) {
      alert('Falha ao atualizar o limite. Verifique o servidor.');
    } finally {
      setProcessandoStatus(false);
    }
  };

  const totalTransacionado = Number(metricas?.totalTransacionado) || 0;
  const totalClientes = Number(metricas?.totalClientes) || 0;

  // A contagem de lojas mora no próprio item da navegação: era a única
  // informação que a barra lateral antiga carregava além do nome da seção.
  const secoesDoAdmin: ItemDeNavegacao[] = [
    { id: 'geral',      rotulo: 'Início',          icone: 'inicio' },
    { id: 'lojas',      rotulo: 'Lojas',           icone: 'lojas', contador: listaLojas.length },
    { id: 'financeiro', rotulo: 'Financeiro',      icone: 'financeiro' },
    { id: 'cobranca',   rotulo: 'Cobrança do mês', icone: 'cobranca' },
  ];

  const irParaSecao = (id: string) => {
    setLojaSelecionada(null);
    setAbaExibida(id as any);
  };

  // Voltar do navegador desce um nível: da ficha da loja para a lista, da
  // lista para a seção anterior. Antes saía do painel administrativo inteiro.
  useHistoricoDoPainel(
    { aba: abaExibida, loja: lojaSelecionada?.id ?? null },
    (alvo) => {
      setAbaExibida((alvo.aba as typeof abaExibida) || 'geral');
      if (!alvo.loja) {
        setLojaSelecionada(null);
        return;
      }
      const loja = listaLojas.find((l) => l.id === alvo.loja);
      setLojaSelecionada(loja ?? null);
    },
  );

  return (
    <div className="flex flex-col min-h-screen fundo-painel text-[#0B1E14]">
      <BarraSuperior
        itens={secoesDoAdmin}
        ativo={lojaSelecionada ? '' : abaExibida}
        aoEscolher={irParaSecao}
        detalhe="Equipe AVLE · acesso master"
        acoes={
          <>
            <BotaoDaConta
              ativo={!lojaSelecionada && abaExibida === 'conta'}
              aoClicar={() => irParaSecao('conta')}
            />
            <BotaoRedondo
              icone="atualizar"
              rotulo={carregando ? 'Atualizando...' : 'Atualizar números'}
              desabilitado={carregando}
              aoClicar={carregarDadosDoBanco}
            />
            <BotaoRedondo
              icone="sair"
              rotulo="Sair"
              perigo
              aoClicar={async () => {
                await encerrarSessao();
                router.push('/');
              }}
            />
          </>
        }
        identidade={<Avatar nome="Equipe AVLE" />}
      />

      <TrilhoDeNavegacao
        soCelular
        itens={secoesDoAdmin}
        ativo={lojaSelecionada ? '' : abaExibida}
        aoEscolher={irParaSecao}
        aoSair={async () => {
          await encerrarSessao();
          router.push('/');
        }}
      />

      {/* A movimentacao so vira coluna ao lado a partir de 1536px: abaixo
          disso ela roubaria a largura que os quatro cartoes de cima precisam,
          e desce para depois do conteudo. */}
      <div className="flex-1 w-full max-w-[1800px] mx-auto flex flex-col 2xl:flex-row min-w-0">
      {/* No celular a barra do rodape e fixa: quem fica por ultimo na tela
          precisa da folga para o ultimo botao nao ficar embaixo dela. */}
      <main className={`flex-1 p-4 sm:p-6 lg:px-8 md:pt-8 overflow-x-hidden space-y-6 min-w-0 md:pb-10 ${
        abaExibida === 'geral' && !lojaSelecionada ? 'pb-6' : 'pb-28'
      }`}>
        <CabecalhoDaPagina
          titulo={lojaSelecionada
            ? lojaSelecionada.nomeComercial
            : secoesDoAdmin.find((s) => s.id === abaExibida)?.rotulo ?? (abaExibida === 'conta' ? 'Conta AVLE' : abaExibida)}
          descricao={`Painel administrativo · ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
          aoVoltar={
            lojaSelecionada
              ? () => setLojaSelecionada(null)
              : abaExibida !== 'geral' ? () => irParaSecao('geral') : undefined
          }
          acoes={abaExibida === 'geral' && !lojaSelecionada && (
            <button
              onClick={carregarDadosDoBanco}
              disabled={carregando}
              className="bg-painel-acento text-white px-5 h-11 rounded-full text-[13px] font-semibold shadow-[0_10px_20px_-12px_rgba(189,107,66,0.9)] hover:brightness-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {carregando ? 'Atualizando...' : 'Atualizar números'}
            </button>
          )}
        />

        {lojaSelecionada ? (
          <div className="space-y-6 animate-fadeIn">
            <button
              onClick={() => setLojaSelecionada(null)}
              className="text-xs font-bold text-stone-500 hover:text-[#0B1E14] transition-all bg-white border border-[#E6E2D8] px-4 py-2 rounded-full cursor-pointer"
            >
              Voltar para o Painel Geral
            </button>

            <div className="cartao-avle p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[9px] font-bold bg-[#0B1E14] text-white px-2 py-0.5 rounded font-mono uppercase tracking-widest">
                  Auditoria Unidade
                </span>
                <h2 className="text-2xl font-serif font-bold text-[#0B1E14] mt-1.5">
                  {lojaSelecionada.nomeComercial}
                </h2>
                <p className="text-xs text-stone-400 font-mono mt-0.5">CNPJ Fiscal: {lojaSelecionada.cnpj}</p>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`text-[9px] font-bold px-3 py-1.5 rounded-md uppercase border tracking-wider mr-2 ${
                    lojaSelecionada.statusHomologacao === 'PENDENTE'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : lojaSelecionada.statusHomologacao === 'BLOQUEADO' ||
                        lojaSelecionada.statusHomologacao === 'AUDITORIA_CHARGEBACK'
                      ? 'bg-rose-50 text-rose-700 border-rose-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}
                >
                  {lojaSelecionada.statusHomologacao}
                </span>

                <button
                  disabled={processandoStatus}
                  onClick={() => alterarStatusLoja(lojaSelecionada.id, 'APROVADO')}
                  className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg text-[10px] uppercase hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                >
                  Aprovar
                </button>
                <button
                  disabled={processandoStatus}
                  onClick={() => alterarStatusLoja(lojaSelecionada.id, 'BLOQUEADO')}
                  className="px-3 py-1.5 bg-rose-700 text-white font-bold rounded-lg text-[10px] uppercase hover:bg-rose-800 disabled:opacity-50 cursor-pointer"
                >
                  Bloquear
                </button>
              </div>
            </div>

            {(() => {
              // Posicao financeira desta unidade. Fica na ficha porque e aqui que
              // a decisao de cobrar acontece: ver a divida na lista geral nao
              // ajuda quem ja abriu a loja para tratar dela.
              const dados = split?.lojas?.find((l: any) => l.lojaId === lojaSelecionada.id);
              if (!dados) return null;

              const aReceber = Number(dados.taxaAReceber) || 0;

              return (
                <div className="cartao-avle overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#E6E2D8] bg-stone-50/50">
                    <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Posição do split</h3>
                    <p className="text-[10px] text-stone-400 font-medium">
                      Divisão de {split.percentualAvle}% para a AVLE e {split.percentualLoja}% para a unidade.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#E6E2D8]">
                    <div className="p-5">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Faturamento bruto</span>
                      <span className="text-lg font-bold font-mono text-[#0B1E14] block mt-1">
                        R$ {Number(dados.faturamentoBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="p-5">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">AVLE ({split.percentualAvle}%)</span>
                      <span className="text-lg font-bold font-mono text-emerald-700 block mt-1">
                        R$ {Number(dados.taxaAvle).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="p-5">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Unidade ({split.percentualLoja}%)</span>
                      <span className="text-lg font-bold font-mono text-stone-600 block mt-1">
                        R$ {Number(dados.repasseLoja).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className={`p-5 ${aReceber > 0 ? 'bg-amber-50' : ''}`}>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Deve à AVLE</span>
                      <span className={`text-lg font-bold font-mono block mt-1 ${aReceber > 0 ? 'text-amber-800' : 'text-stone-300'}`}>
                        R$ {aReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {aReceber > 0 && (
                    <div className="px-6 py-4 border-t border-[#E6E2D8] bg-amber-50/60">
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        Esta unidade registrou <strong>R$ {Number(dados.brutoBaixaManual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> em baixas
                        manuais. Esse dinheiro foi recebido no balcão e não passou pelo Asaas, então os
                        {' '}{split.percentualAvle}% não foram retidos automaticamente: são
                        {' '}<strong>R$ {aReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> a cobrar da unidade.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* A Conta AVLE desta loja, como a loja ve, mas sem o saque: o
                dinheiro e dela. E daqui que o admin conecta a conta do Asaas
                de uma loja que ainda nao conectou. */}
            <div className="space-y-3">
              <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">Conta AVLE da loja</h3>
              <PaginaContaAvle
                key={lojaSelecionada.id}
                lojaId={lojaSelecionada.id}
                podeSacar={false}
                mostrarAviso={(titulo, texto) => window.alert(`${titulo}\n\n${texto}`)}
              />
            </div>

            <div className="cartao-avle p-6">
              <h3 className="text-sm font-bold text-[#0B1E14] uppercase tracking-wider mb-4">Controle de Expansao de Negocio</h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="w-full sm:w-1/3">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5 tracking-wider">Limite de Clubes Ativos Simultâneos</label>
                  <input
                    type="number"
                    min="0"
                    value={limiteInput}
                    onChange={(e) => setLimiteInput(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl bg-stone-50 h-[42px] text-sm font-medium focus:outline-none focus:border-[#BD6B42] transition-colors"
                  />
                </div>
                <button
                  disabled={processandoStatus}
                  onClick={() => alterarLimiteGrupos(lojaSelecionada.id, limiteInput)}
                  className="px-6 h-[42px] bg-[#0B1E14] text-white font-bold rounded-full text-[10px] uppercase tracking-wider hover:bg-opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  Aplicar Limite
                </button>
              </div>
              <p className="text-[10px] text-stone-400 mt-3 leading-relaxed">
                Define a quantidade máxima de clubes ou grupos de compras que esta loja tem permissao para manter operando simultaneamente na plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="cartao-avle-destaque p-5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Clientes Vinculados
                </span>
                <span className="text-2xl font-bold tracking-tight block mt-2 font-mono">
                  {Number(lojaSelecionada.participantes) || 0}
                </span>
                <p className="text-[9px] text-stone-400 mt-1">Consumidores cadastrados</p>
              </div>
              <div className="cartao-avle p-5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Clubes Criados
                </span>
                <span className="text-2xl font-bold tracking-tight text-[#0B1E14] block mt-2 font-mono">
                  {Number(lojaSelecionada.grupos) || 0}
                </span>
                <p className="text-[9px] text-stone-400 mt-1">Modalidades em andamento</p>
              </div>
              <div className="cartao-avle p-5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Volume Transacionado Pix
                </span>
                <span className="text-2xl font-bold tracking-tight text-emerald-600 block mt-2 font-mono">
                  R$ {(Number(lojaSelecionada.volumeBruto) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[9px] text-stone-400 mt-1">Receita real processada via split</p>
              </div>
              <div className="cartao-avle p-5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Risco de Inadimplencia
                </span>
                <span className="text-2xl font-bold text-stone-400 block mt-2 font-mono">
                  {(Number(lojaSelecionada.inadimplencia) || 0).toFixed(2)}%
                </span>
                <p className="text-[9px] text-stone-400 mt-1">Mensalidades em atraso</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="cartao-avle lg:col-span-2 p-5 flex flex-col justify-between min-h-[250px]">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-4">
                  Curva de Captação Mensal da Unidade
                </span>
                <div className="h-32 w-full pt-2">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path d="M0,30 L100,30" className="stroke-stone-200 stroke-2" fill="none" />
                  </svg>
                  <p className="text-[11px] text-stone-400 italic mt-3 text-center">Histórico consolidado em tempo real.</p>
                </div>
              </div>

              <div className="cartao-avle p-5 flex flex-col justify-between min-h-[250px]">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                  Composição de Carteira
                </span>
                <div className="w-24 h-24 mx-auto relative flex items-center justify-center my-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E6E2D8" strokeWidth="4" />
                  </svg>
                  <span className="absolute text-xs font-mono font-bold text-stone-400">100%</span>
                </div>
                <p className="text-[10px] text-stone-400 font-medium text-center">Operação ativa.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {abaExibida === 'geral' && (() => {
              const v = visaoGeral;
              const dinheiro = (n: any) =>
                `R$ ${(Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

              // Quanto da taxa de 10% ja foi efetivamente recolhida. Enquanto o
              // pagamento nao passa pela plataforma, o split nao acontece e o
              // valor fica em aberto com a loja.
              const taxaTotal = Number(v?.taxaAvle) || 0;
              const aReceber = Number(v?.taxaAReceber) || 0;
              const recolhido = Math.max(0, taxaTotal - aReceber);
              const pctRecolhido = taxaTotal > 0 ? (recolhido / taxaTotal) * 100 : 0;

              const crescimento: any[] = v?.crescimento ?? [];
              const lojas: any[] = v?.lojas ?? [];
              const volumeTotal = Number(v?.faturamentoBruto) || 0;

              const recortes = {
                todas: lojas,
                areceber: lojas.filter((l) => Number(l.taxaAReceber) > 0),
              };
              const lojasDoPainel = recortes[abaLojasInicio];
              const emFoco = lojasDoPainel.find((l) => l.id === lojaEmFoco) ?? lojasDoPainel[0] ?? null;

              // A ficha espera o objeto da listagem de lojas, que tem status e
              // limite; o consolidado so tem os numeros.
              const abrirFicha = (l: any) =>
                setLojaSelecionada(listaLojas.find((x) => x.id === l.id) ?? { ...l, nomeComercial: l.nome });

              return (
              <div className="space-y-6 animate-fadeIn">

                {/* ── Os quatro cartões de cima ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <CartaoIndicador
                    titulo="Volume transacionado"
                    icone="financeiro"
                    tom="acento"
                    valor={dinheiro(v?.faturamentoBruto)}
                    nota={<span className="text-[11px] text-stone-400">somando todas as lojas</span>}
                  >
                    <ArteDaMarca />
                  </CartaoIndicador>

                  <CartaoIndicador
                    titulo="Clientes"
                    icone="clientes"
                    valor={v?.totalClientes ?? 0}
                    nota={
                      <span className="text-[11px] text-stone-400">
                        {(v?.clientesNoMes ?? 0) > 0
                          ? <><span className="font-semibold text-emerald-700">+{v?.clientesNoMes}</span> neste mês</>
                          : 'nenhum novo neste mês'}
                      </span>
                    }
                  >
                    <BarrasMini
                      dados={crescimento.map((c) => ({
                        rotulo: c.mes,
                        valor: Number(c.clientes) || 0,
                        dica: `${c.mes}: ${c.clientes ?? 0} cliente(s) e ${c.lojas ?? 0} loja(s)`,
                      }))}
                    />
                  </CartaoIndicador>

                  <CartaoIndicador
                    titulo="Quem entrou na AVLE"
                    icone="lojas"
                    tom="positivo"
                    valor={v?.totalPessoas ?? 0}
                    unidade="pessoas"
                    nota={<Variacao valor={variacao(crescimento.map((c) => Number(c.acumulado) || 0))} />}
                  >
                    <LinhaMini
                      dados={crescimento.map((c) => ({ rotulo: c.mes, valor: Number(c.acumulado) || 0 }))}
                      formatar={(n) => `${n} no total`}
                    />
                  </CartaoIndicador>

                  <CartaoIndicador
                    titulo={`Receita AVLE · ${v?.percentualAvle ?? 10}%`}
                    canto={<BotaoDeCanto rotulo="Ver financeiro" aoClicar={() => irParaSecao('financeiro')} />}
                    valor={dinheiro(taxaTotal)}
                    nota={
                      <span className="text-[11px] text-stone-400">
                        <span className="font-semibold text-emerald-700">{pctRecolhido.toFixed(0)}%</span> recolhido
                        automaticamente
                      </span>
                    }
                  >
                    <BlocosDeValor
                      // O bloco tem uns 70px: "R$ 131,8 mil" nao cabe numa
                      // linha, entao o "R$" vai para o rotulo.
                      blocos={[
                        { rotulo: 'Recolhido, R$', valor: numeroCurto(recolhido), dica: dinheiro(recolhido) },
                        { rotulo: 'A receber das lojas, R$', valor: numeroCurto(aReceber), destaque: true, dica: dinheiro(aReceber) },
                        { rotulo: 'Repassado às lojas, R$', valor: numeroCurto(v?.repasseLojas), dica: dinheiro(v?.repasseLojas) },
                      ]}
                      acao={{ rotulo: 'Cobrança do mês', aoClicar: () => irParaSecao('cobranca') }}
                    />
                  </CartaoIndicador>
                </div>

                {/* ── Números miúdos da plataforma ── */}
                <FaixaDeNumeros
                  titulo="Plataforma"
                  itens={[
                    {
                      rotulo: 'Lojas parceiras',
                      valor: v?.totalLojas ?? 0,
                      nota: (v?.lojasNoMes ?? 0) > 0 ? `+${v?.lojasNoMes} neste mês` : 'nenhuma nova neste mês',
                    },
                    { rotulo: 'Grupos', valor: v?.totalGrupos ?? 0 },
                    { rotulo: 'Cotas', valor: v?.totalCotas ?? 0 },
                    { rotulo: 'Repassado às lojas', valor: dinheiro(v?.repasseLojas) },
                    {
                      rotulo: 'A receber das lojas',
                      valor: dinheiro(aReceber),
                      tom: aReceber > 0 ? 'alerta' : undefined,
                      // O valor a cobrar vem de baixa manual: a cliente pagou na
                      // loja e o dinheiro nao passou pelo Asaas, entao a taxa
                      // nao foi retida no ato.
                      nota: aReceber > 0 ? 'de baixa manual, fora do Asaas' : undefined,
                    },
                  ]}
                />

                {/* ── Lojas: lista e detalhe ── */}
                <PainelEscuro
                  titulo="Lojas parceiras"
                  abas={[
                    { id: 'todas', rotulo: 'Todas', contador: recortes.todas.length },
                    { id: 'areceber', rotulo: 'A receber', contador: recortes.areceber.length },
                  ]}
                  abaAtiva={abaLojasInicio}
                  aoTrocarAba={(id) => setAbaLojasInicio(id as typeof abaLojasInicio)}
                  canto={<BotaoEscuro icone="lojas" rotulo="Ver todas as lojas" aoClicar={() => irParaSecao('lojas')} />}
                  lista={
                    lojasDoPainel.length === 0 ? (
                      <p className="text-[12px] text-white/45 px-3 py-8 text-center">
                        {lojas.length === 0 ? 'Nenhuma loja cadastrada.' : 'Nenhuma loja neste recorte.'}
                      </p>
                    ) : (
                      lojasDoPainel.map((l) => (
                        <ItemDoPainel
                          key={l.id}
                          sigla={sigla(l.nome)}
                          titulo={l.nome}
                          subtitulo={l.cnpj}
                          selo={Number(l.taxaAReceber) > 0 ? 'a receber' : `${l.clientes ?? 0} clientes`}
                          valor={realCurto(l.faturamentoBruto)}
                          ativo={emFoco?.id === l.id}
                          aoEscolher={() => setLojaEmFoco(l.id)}
                        />
                      ))
                    )
                  }
                  detalhe={
                    !emFoco ? (
                      <div className="h-full min-h-[240px] rounded-[24px] bg-white/[0.04] flex items-center justify-center text-center p-6">
                        <p className="text-[13px] text-white/60">As lojas aparecem aqui assim que se cadastrarem.</p>
                      </div>
                    ) : (
                      <div className="h-full rounded-[24px] bg-avle-verde p-5 flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="min-w-0">
                            <span className="block text-[11px] text-white/50">Loja parceira</span>
                            <span className="block text-[22px] font-semibold tracking-tight truncate mt-1.5">{emFoco.nome}</span>
                          </div>
                          <div>
                            <span className="block text-[11px] text-white/50">CNPJ</span>
                            <span className="block text-[13px] font-semibold mt-1.5 tabular-nums">{emFoco.cnpj || '—'}</span>
                          </div>
                          <div>
                            <span className="block text-[11px] text-white/50">Participação no volume</span>
                            <span className="block text-[17px] font-semibold mt-1.5 tabular-nums">
                              {volumeTotal > 0 ? ((Number(emFoco.faturamentoBruto) || 0) / volumeTotal * 100).toFixed(1) : '0'}%
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <BlocoDoDetalhe rotulo="Volume" valor={dinheiro(emFoco.faturamentoBruto)} aoClicar={() => abrirFicha(emFoco)} />
                          <BlocoDoDetalhe rotulo="Receita AVLE" valor={dinheiro(emFoco.taxaAvle)} aoClicar={() => abrirFicha(emFoco)} />
                          <BlocoDoDetalhe
                            rotulo="A receber"
                            valor={dinheiro(emFoco.taxaAReceber)}
                            nota={Number(emFoco.taxaAReceber) > 0 ? 'baixa manual, fora do Asaas' : 'nada em aberto'}
                            aoClicar={() => abrirFicha(emFoco)}
                          />
                          <BlocoDeAdicionar icone="seta" rotulo="Abrir ficha da loja" aoClicar={() => abrirFicha(emFoco)} />
                        </div>

                        <div className="mt-auto rounded-[18px] bg-black/15 p-4 flex flex-wrap items-center gap-x-8 gap-y-3">
                          <div>
                            <span className="block text-[10px] text-white/50">Clientes</span>
                            <span className="block text-[14px] font-semibold tabular-nums mt-0.5">{emFoco.clientes ?? 0}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-white/50">Grupos</span>
                            <span className="block text-[14px] font-semibold tabular-nums mt-0.5">{emFoco.grupos ?? 0}</span>
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            <BotaoEscuro icone="cobranca" rotulo="Cobrança do mês" aoClicar={() => irParaSecao('cobranca')} />
                            <button
                              type="button"
                              onClick={() => abrirFicha(emFoco)}
                              className="h-10 px-5 rounded-full bg-white text-painel-tinta text-[12px] font-semibold hover:bg-painel-papel transition-colors cursor-pointer"
                            >
                              Abrir ficha
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  }
                />
              </div>
              );
            })()}

            {abaExibida === 'lojas' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">Central de Controle de Lojas</h2>
                  <p className="text-xs text-stone-400 font-medium mt-0.5">
                    Selecione uma loja parceira para carregar seu dashboard corporativo individual.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {carregando ? (
                    <div className="bg-white p-8 text-center text-stone-400 text-xs border rounded-2xl">
                      Carregando lojas...
                    </div>
                  ) : listaLojas.length === 0 ? (
                    <div className="bg-white p-8 text-center text-stone-400 text-xs border rounded-2xl">
                      Nenhuma loja encontrada no banco de dados.
                    </div>
                  ) : (
                    listaLojas.map((loja, i) => (
                      <div
                        key={loja.id || i}
                        onClick={() => setLojaSelecionada(loja)}
                        className="cartao-avle p-6 space-y-4 hover:border-[#BD6B42] transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-100 pb-3">
                          <div>
                            <h4 className="font-serif font-bold text-lg text-[#0B1E14] group-hover:text-[#BD6B42] transition-colors">
                              {loja.nomeComercial}
                            </h4>
                            <p className="text-[11px] font-mono text-stone-400 mt-0.5">CNPJ Fiscal: {loja.cnpj} | Limite Permitido: {loja.limiteGruposAtivos || 1}</p>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2.5 py-1 rounded-md uppercase border tracking-wider ${
                              loja.statusHomologacao === 'PENDENTE'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : loja.statusHomologacao === 'BLOQUEADO' ||
                                  loja.statusHomologacao === 'AUDITORIA_CHARGEBACK'
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}
                          >
                            {loja.statusHomologacao}
                          </span>
                        </div>

                        {(() => {
                          // Os numeros vem do consolidado, e nao da listagem de
                          // lojas: aquela rota nao devolve contagem nem valor, e
                          // os quatro cards apareciam zerados em toda unidade.
                          const d = (visaoGeral?.lojas ?? []).find((x: any) => x.id === loja.id);
                          const real = (n: any) => Number(n) || 0;

                          return (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                              <div className="bg-[#F5F2EB]/50 border border-[#E6E2D8] p-4 rounded-xl">
                                <span className="text-[9px] text-stone-400 font-bold block uppercase tracking-widest">Clientes</span>
                                <span className="text-xl font-bold text-[#0B1E14] font-mono block mt-1.5">{real(d?.clientes)}</span>
                              </div>
                              <div className="bg-[#F5F2EB]/50 border border-[#E6E2D8] p-4 rounded-xl">
                                <span className="text-[9px] text-stone-400 font-bold block uppercase tracking-widest">Grupos</span>
                                <span className="text-xl font-bold text-[#0B1E14] font-mono block mt-1.5">{real(d?.grupos)}</span>
                              </div>
                              <div className="bg-[#F5F2EB]/50 border border-[#E6E2D8] p-4 rounded-xl">
                                <span className="text-[9px] text-stone-400 font-bold block uppercase tracking-widest">Volume</span>
                                <span className="text-xl font-bold text-[#0B1E14] font-mono block mt-1.5">
                                  R$ {real(d?.faturamentoBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="bg-[#F5F2EB]/50 border border-[#E6E2D8] p-4 rounded-xl">
                                <span className="text-[9px] text-stone-400 font-bold block uppercase tracking-widest">Receita AVLE</span>
                                <span className="text-xl font-bold text-emerald-700 font-mono block mt-1.5">
                                  R$ {real(d?.taxaAvle).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {abaExibida === 'conta' && !lojaSelecionada && (
              <ContaAvleDoAdmin
                aoAbrirLoja={(id) => {
                  const loja = listaLojas.find((l) => l.id === id);
                  if (loja) setLojaSelecionada(loja);
                }}
              />
            )}

            {abaExibida === 'cobranca' && !lojaSelecionada && (
              <div>
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-[#0B1E14]">Cobrança do mês</h2>
                  <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
                    Quem cobra é a AVLE, e não as lojas. Cada botão abre o WhatsApp com a mensagem
                    escrita — confira e envie. As mensagens saem do número conectado nesta máquina,
                    então use o WhatsApp da AVLE.
                  </p>
                </div>
                <EnvioDeCobrancasWhatsapp />
              </div>
            )}

            {abaExibida === 'financeiro' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B1E14]">Fluxo de Caixa e Split Contábil</h2>
                  <p className="text-xs text-stone-400 font-medium">
                    Divisão de 10% para a AVLE e 90% para a loja, sobre cada entrada registrada.
                  </p>
                </div>

                {split && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="cartao-avle p-5">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Faturamento bruto</span>
                      <span className="text-2xl font-bold font-mono text-[#0B1E14] block mt-1">
                        R$ {Number(split.faturamentoBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-stone-400">base de cálculo do split</span>
                    </div>

                    <div className="cartao-avle p-5">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        AVLE · {split.percentualAvle}%
                      </span>
                      <span className="text-2xl font-bold font-mono text-emerald-700 block mt-1">
                        R$ {Number(split.taxaAvleTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-stone-400">taxa de administração total</span>
                    </div>

                    <div className="cartao-avle p-5">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        Lojas · {split.percentualLoja}%
                      </span>
                      <span className="text-2xl font-bold font-mono text-stone-600 block mt-1">
                        R$ {Number(split.repasseLojaTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-stone-400">repasse às unidades</span>
                    </div>

                    <div className={`rounded-2xl p-5 shadow-xs border ${
                      Number(split.taxaAReceber) > 0
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-[#DFD9CE]'
                    }`}>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">A receber das lojas</span>
                      <span className={`text-2xl font-bold font-mono block mt-1 ${
                        Number(split.taxaAReceber) > 0 ? 'text-amber-800' : 'text-stone-400'
                      }`}>
                        R$ {Number(split.taxaAReceber).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {Number(split.taxaAReceber) > 0
                          ? 'baixa manual: dinheiro não passou pela plataforma'
                          : 'nada pendente'}
                      </span>
                    </div>
                  </div>
                )}

                {split && Number(split.taxaAReceber) > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      <strong>R$ {Number(split.brutoBaixaManual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> entraram por baixa manual, ou seja,
                      a cliente pagou direto na loja e o valor não passou pelo Asaas. Como o split só acontece dentro do
                      pagamento, os <strong>{split.percentualAvle}%</strong> desse montante não foram recolhidos e
                      seguem como crédito da AVLE contra as unidades, listado abaixo.
                    </p>
                  </div>
                )}
                <div className="cartao-avle overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 text-stone-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#DFD9CE]">
                        <th className="py-4 px-5">Estabelecimento</th>
                        <th className="py-4 px-5 text-right">Faturamento bruto</th>
                        <th className="py-4 px-5 text-right">AVLE (10%)</th>
                        <th className="py-4 px-5 text-right">Loja (90%)</th>
                        <th className="py-4 px-5 text-right">A receber</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFD9CE] text-stone-700 font-medium">
                      {listaLojas.map((loja, idx) => {
                        // Prefere os numeros do consolidado, que separam a taxa ja
                        // recolhida da pendente. Sem ele, cai no calculo antigo
                        // sobre o volume bruto conhecido pela lista de lojas.
                        const doSplit = split?.lojas?.find((l: any) => l.lojaId === loja.id);
                        const bruto = Number(doSplit?.faturamentoBruto ?? loja.volumeBruto) || 0;
                        const taxaApp = Number(doSplit?.taxaAvle ?? bruto * 0.10);
                        const repasseLoja = Number(doSplit?.repasseLoja ?? bruto * 0.90);
                        const aReceber = Number(doSplit?.taxaAReceber ?? 0);

                        return (
                          <tr key={loja.id || idx} className="hover:bg-stone-50/50 transition-all">
                            <td className="py-4 px-5">
                              <span className="block font-bold text-[#0B1E14]">{loja.nomeComercial}</span>
                              <span className="text-[10px] text-stone-400 font-mono">{loja.cnpj}</span>
                            </td>
                            <td className="py-4 px-5 text-right font-mono font-bold text-[#0B1E14]">
                              R$ {bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-5 text-right font-mono text-emerald-700 font-bold">
                              R$ {taxaApp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-5 text-right font-mono text-stone-600 font-bold">
                              R$ {repasseLoja.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className={`py-4 px-5 text-right font-mono font-bold ${
                              aReceber > 0 ? 'text-amber-700' : 'text-stone-300'
                            }`}>
                              R$ {aReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Movimentacao recente. Fica fora do <main> para acompanhar a rolagem em
          tela grande e cair para baixo do conteudo no celular. */}
      {abaExibida === 'geral' && !lojaSelecionada && (
        <aside className="w-full 2xl:w-80 flex-shrink-0 px-4 sm:px-6 lg:px-8 pb-28 md:pb-10 2xl:pt-8 2xl:pl-0 space-y-5">
          <div className="cartao-avle overflow-hidden 2xl:sticky 2xl:top-8">
            <div className="px-5 py-4 border-b border-[#E6E2D8]">
              <h3 className="text-xs font-bold text-[#0B1E14] uppercase tracking-wider">Movimentação</h3>
              <p className="text-[10px] text-stone-400">o que aconteceu por último na plataforma</p>
            </div>

            <div className="divide-y divide-[#EFEAE1] max-h-[32rem] overflow-y-auto">
              {(visaoGeral?.atividades ?? []).length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-stone-400 italic">Nada registrado ainda.</p>
              ) : (
                (visaoGeral?.atividades ?? []).map((a: any, i: number) => {
                  // A cor separa o tipo de evento sem precisar de rotulo extra.
                  const cor =
                    a.tipo === 'LOJA' ? 'bg-[#BD6B42]' :
                    a.tipo === 'SORTEIO' ? 'bg-amber-500' :
                    a.tipo === 'GRUPO' ? 'bg-emerald-600' : 'bg-[#0B1E14]';

                  const quando = a.quando ? new Date(a.quando) : null;
                  const minutos = quando ? Math.floor((Date.now() - quando.getTime()) / 60000) : null;
                  const relativo =
                    minutos === null ? '' :
                    minutos < 60 ? `há ${Math.max(1, minutos)} min` :
                    minutos < 1440 ? `há ${Math.floor(minutos / 60)} h` :
                    quando!.toLocaleDateString('pt-BR');

                  return (
                    <div key={i} className="px-5 py-3.5 flex gap-3 hover:bg-stone-50/60 transition-colors">
                      <span className={`w-2 h-2 rounded-full ${cor} mt-1.5 flex-shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-[#0B1E14] leading-tight">{a.titulo}</p>
                        <p className="text-[11px] text-stone-500 truncate">{a.detalhe}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">{relativo}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      )}
      </div>
      <PainelDeAvisosFlutuante />
    </div>
  );
}