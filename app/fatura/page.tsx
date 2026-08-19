'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

interface Fatura {
  id: number;
  cotaId: number;
  nomeGrupo: string;
  valorTotal: number;
  valorPoupanca: number;
  valorTaxaAdm: number;
  statusPagamento: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  dataVencimento: string;
}

interface DadosPix {
  encodedImage: string;
  payload: string;
  paymentId: string;
}

interface DadosCartao {
  numeroCartao: string;
  nomeImpressoCartao: string;
  mesValidade: string;
  anoValidade: string;
  ccv: string;
}

type Metodo = 'PIX' | 'CREDITO' | 'DEBITO' | null;

const CARTAO_VAZIO: DadosCartao = {
  numeroCartao: '',
  nomeImpressoCartao: '',
  mesValidade: '',
  anoValidade: '',
  ccv: '',
};

export default function Faturas() {
  const router = useRouter();
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);

  const [faturaSelecionada, setFaturaSelecionada] = useState<Fatura | null>(null);
  const [metodo, setMetodo] = useState<Metodo>(null);
  const [dadosPix, setDadosPix] = useState<DadosPix | null>(null);
  const [dadosCartao, setDadosCartao] = useState<DadosCartao>(CARTAO_VAZIO);
  const [processando, setProcessando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const carregarExtrato = async () => {
    const raw = localStorage.getItem('@avle:usuario');
    if (!raw) { router.push('/'); return; }
    const user = JSON.parse(raw);
    try {
      const res = await fetch(`${API_URL}/api/financeiro/extrato/${user.id}`);
      if (res.ok) setFaturas(await res.json());
    } catch (err) {
      console.error('Erro ao buscar extrato:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('@avle:usuario');
    if (!raw) { router.push('/'); return; }
    carregarExtrato();
  }, [router]);

  const abrirModal = (fatura: Fatura) => {
    setFaturaSelecionada(fatura);
    setMetodo(null);
    setDadosPix(null);
    setSucesso(false);
    setDadosCartao(CARTAO_VAZIO);
    setCopiado(false);
  };

  const fecharModal = () => {
    setFaturaSelecionada(null);
    setMetodo(null);
    setDadosPix(null);
    setSucesso(false);
  };

  const handlePagarPix = async (fatura: Fatura) => {
    setMetodo('PIX');
    setProcessando(true);
    try {
      const res = await fetch(`${API_URL}/api/pagamentos/gerar-pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cotaId: fatura.cotaId, valor: fatura.valorTotal }),
      });
      if (!res.ok) throw new Error('Falha ao gerar PIX.');
      const data = await res.json();
      setDadosPix({ encodedImage: data.encodedImage, payload: data.payload, paymentId: data.paymentId });
    } catch {
      alert('Erro ao gerar PIX. Tente novamente.');
      setMetodo(null);
    } finally {
      setProcessando(false);
    }
  };

  const handlePagarCartao = async () => {
    if (!faturaSelecionada) return;
    setProcessando(true);
    try {
      const endpoint = metodo === 'CREDITO'
        ? `${API_URL}/api/pagamentos/assinatura-cartao`
        : `${API_URL}/api/pagamentos/cartao-unico`;

      const body: Record<string, unknown> = {
        cotaId: faturaSelecionada.cotaId,
        valor: faturaSelecionada.valorTotal,
        numeroCartao: dadosCartao.numeroCartao.replace(/\s/g, ''),
        nomeImpressoCartao: dadosCartao.nomeImpressoCartao,
        mesValidade: dadosCartao.mesValidade,
        anoValidade: dadosCartao.anoValidade,
        ccv: dadosCartao.ccv,
      };
      if (metodo === 'DEBITO') body.tipoCobranca = 'DEBIT_CARD';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Erro ao processar cartão.');
      setSucesso(true);
      carregarExtrato();
    } catch {
      alert('Erro ao processar cartão. Verifique os dados e tente novamente.');
    } finally {
      setProcessando(false);
    }
  };

  const cartaoValido =
    dadosCartao.numeroCartao.replace(/\s/g, '').length >= 13 &&
    dadosCartao.nomeImpressoCartao.trim().length > 2 &&
    dadosCartao.mesValidade.length === 2 &&
    dadosCartao.anoValidade.length === 4 &&
    dadosCartao.ccv.length >= 3;

  return (
    <div className="min-h-screen bg-avle-bege text-avle-texto flex flex-col items-center p-4 pb-24">
      <div className="w-full max-w-md flex flex-col space-y-6">

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/60">
          <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Módulo Financeiro</p>
          <h2 className="text-lg font-bold text-avle-verde">Minhas Parcelas</h2>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-sm text-stone-400 py-8">Buscando faturas no banco de dados...</p>
          ) : faturas.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-stone-200/60">
              <span className="text-2xl block mb-2">🍃</span>
              <p className="text-sm text-stone-400">Você ainda não possui faturas. Entre em um clube de compras na aba anterior!</p>
            </div>
          ) : (
            faturas.map((fatura, index) => (
              <div key={fatura.id} className="bg-white rounded-xl p-4 shadow-sm border border-stone-200/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-stone-700">Parcela {String(index + 1).padStart(2, '0')}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      fatura.statusPagamento === 'PAGO'     ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      fatura.statusPagamento === 'ATRASADO' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                                                              'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {fatura.statusPagamento}
                    </span>
                  </div>
                  {fatura.nomeGrupo && (
                    <p className="text-[10px] text-stone-500 font-medium mt-0.5">{fatura.nomeGrupo}</p>
                  )}
                  <p className="text-xs text-stone-400 mt-1">
                    Vence em: {new Date(fatura.dataVencimento).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Poupança: R$ {fatura.valorPoupanca.toFixed(2)} | Taxa: R$ {fatura.valorTaxaAdm.toFixed(2)}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end space-y-2">
                  <span className="text-sm font-black text-stone-800">R$ {fatura.valorTotal.toFixed(2)}</span>
                  {fatura.statusPagamento !== 'PAGO' && (
                    <button
                      onClick={() => abrirModal(fatura)}
                      className="bg-avle-terracotta text-white font-bold px-3 py-1.5 rounded-lg text-[10px] tracking-wider transition-all hover:bg-opacity-90 active:scale-95"
                    >
                      PAGAR
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-avle-verde text-white h-16 rounded-2xl shadow-xl flex items-center justify-around px-6 z-50">
          <button onClick={() => router.push('/dashboard')} className="flex flex-col items-center justify-center space-y-0.5 text-stone-300 hover:text-white transition-colors">
            <span className="text-lg">📋</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Clubes</span>
          </button>
          <button onClick={() => router.push('/fatura')} className="flex flex-col items-center justify-center space-y-0.5 text-avle-terracotta">
            <span className="text-lg">💰</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Faturas</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      {faturaSelecionada && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5">

            {/* Sucesso */}
            {sucesso ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
                <div>
                  <h3 className="text-lg font-bold text-stone-800">Pagamento Registrado!</h3>
                  <p className="text-sm text-stone-500 mt-1">Seu pagamento foi processado com sucesso.</p>
                </div>
                <button onClick={fecharModal} className="w-full bg-avle-verde text-white font-bold py-3 rounded-xl text-sm tracking-wide">
                  FECHAR
                </button>
              </div>

            /* QR Code PIX */
            ) : dadosPix ? (
              <div className="space-y-4 flex flex-col items-center">
                <h3 className="text-base font-bold text-stone-800">Escaneie o QR Code</h3>
                <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${dadosPix.encodedImage}`}
                    alt="QR Code Pix"
                    className="w-48 h-48 rounded-lg"
                  />
                </div>
                <p className="text-[10px] font-black tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase">
                  ⏱ Aguardando Pagamento
                </p>
                <div className="w-full space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-stone-500">Copia e Cola</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      readOnly
                      value={dadosPix.payload}
                      className="w-full px-4 py-3 pr-24 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono overflow-hidden text-ellipsis whitespace-nowrap h-[46px]"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(dadosPix.payload);
                        setCopiado(true);
                        setTimeout(() => setCopiado(false), 3000);
                      }}
                      className={`absolute right-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                        copiado ? 'bg-emerald-600 text-white' : 'bg-avle-verde text-white'
                      }`}
                    >
                      {copiado ? '✓ COPIADO' : 'COPIAR'}
                    </button>
                  </div>
                </div>
                <button onClick={fecharModal} className="text-stone-400 hover:text-stone-600 font-bold text-xs py-1">
                  Fechar
                </button>
              </div>

            /* Seleção de método */
            ) : metodo === null ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-base font-bold text-stone-800">Como deseja pagar?</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Parcela de{' '}
                    <span className="font-bold text-stone-700">R$ {faturaSelecionada.valorTotal.toFixed(2)}</span>
                    {faturaSelecionada.nomeGrupo ? ` · ${faturaSelecionada.nomeGrupo}` : ''}
                  </p>
                </div>

                <button
                  onClick={() => handlePagarPix(faturaSelecionada)}
                  disabled={processando}
                  className="w-full flex items-center space-x-4 p-4 rounded-2xl border-2 border-stone-200 hover:border-avle-verde hover:bg-green-50 transition-all text-left disabled:opacity-50"
                >
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="text-sm font-bold text-stone-800">PIX</p>
                    <p className="text-xs text-stone-400">Pagamento imediato desta parcela</p>
                  </div>
                </button>

                <button
                  onClick={() => setMetodo('CREDITO')}
                  className="w-full flex items-center space-x-4 p-4 rounded-2xl border-2 border-stone-200 hover:border-avle-verde hover:bg-green-50 transition-all text-left"
                >
                  <span className="text-2xl">💳</span>
                  <div>
                    <p className="text-sm font-bold text-stone-800">Cartão de Crédito</p>
                    <p className="text-xs text-stone-400">Débito automático mensal · sem comprometer seu limite</p>
                  </div>
                </button>

                <button
                  onClick={() => setMetodo('DEBITO')}
                  className="w-full flex items-center space-x-4 p-4 rounded-2xl border-2 border-stone-200 hover:border-avle-verde hover:bg-green-50 transition-all text-left"
                >
                  <span className="text-2xl">🏦</span>
                  <div>
                    <p className="text-sm font-bold text-stone-800">Cartão de Débito</p>
                    <p className="text-xs text-stone-400">Cobrança direta na conta corrente</p>
                  </div>
                </button>

                <button onClick={fecharModal} className="w-full text-stone-400 font-bold text-xs py-2">
                  Cancelar
                </button>
              </div>

            /* Formulário de cartão */
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <button onClick={() => setMetodo(null)} className="text-stone-400 hover:text-stone-600 text-sm font-bold leading-none">←</button>
                  <div>
                    <h3 className="text-base font-bold text-stone-800">
                      {metodo === 'CREDITO' ? 'Cartão de Crédito' : 'Cartão de Débito'}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {metodo === 'CREDITO'
                        ? 'Assinatura mensal automática — parcelas debitadas todo mês'
                        : 'Débito direto na conta · R$ ' + faturaSelecionada.valorTotal.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Número do Cartão</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={dadosCartao.numeroCartao}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                        const fmt = raw.match(/.{1,4}/g)?.join(' ') ?? raw;
                        setDadosCartao(d => ({ ...d, numeroCartao: fmt }));
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-avle-verde bg-stone-50 text-sm font-mono h-[46px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Nome Impresso no Cartão</label>
                    <input
                      type="text"
                      placeholder="NOME COMPLETO"
                      value={dadosCartao.nomeImpressoCartao}
                      onChange={e => setDadosCartao(d => ({ ...d, nomeImpressoCartao: e.target.value.toUpperCase() }))}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-avle-verde bg-stone-50 text-sm h-[46px]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Mês</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM"
                        maxLength={2}
                        value={dadosCartao.mesValidade}
                        onChange={e => setDadosCartao(d => ({ ...d, mesValidade: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                        className="w-full px-3 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-avle-verde bg-stone-50 text-sm text-center h-[46px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Ano</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="AAAA"
                        maxLength={4}
                        value={dadosCartao.anoValidade}
                        onChange={e => setDadosCartao(d => ({ ...d, anoValidade: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        className="w-full px-3 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-avle-verde bg-stone-50 text-sm text-center h-[46px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">CVV</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="•••"
                        maxLength={4}
                        value={dadosCartao.ccv}
                        onChange={e => setDadosCartao(d => ({ ...d, ccv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        className="w-full px-3 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-avle-verde bg-stone-50 text-sm text-center h-[46px]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePagarCartao}
                  disabled={processando || !cartaoValido}
                  className="w-full bg-avle-terracotta text-white font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] shadow-md text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {processando ? 'PROCESSANDO...' : `PAGAR R$ ${faturaSelecionada.valorTotal.toFixed(2)}`}
                </button>

                <button onClick={fecharModal} className="w-full text-stone-400 font-bold text-xs py-1">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
