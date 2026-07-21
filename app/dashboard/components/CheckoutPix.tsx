'use client';

import { useState } from 'react';

export default function CheckoutPix() {
  const [valorInput, setValorInput] = useState('49.90'); // Valor padrão simulado
  const [dadosPix, setDadosPix] = useState<{ pixCopiaECola: string; qrCodeUrl: string; idTransacao: string } | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const handleGerarPagamento = async () => {
    setCarregando(true);
    setCopiado(false);
    try {
      const resposta = await fetch('http://localhost:8080/api/pagamentos/gerar-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: valorInput }),
      });

      if (!resposta.ok) throw new Error('Falha ao gerar o gateway.');

      const dados = await resposta.json();
      setDadosPix(dados);
    } catch (erro) {
      console.error(erro);
    } finally {
      setCarregando(false);
    }
  };

  const handleCopiarCodigo = () => {
    if (dadosPix) {
      navigator.clipboard.writeText(dadosPix.pixCopiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000); // Reseta o estado do botão após 3 segundos
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-stone-200/60 p-6 shadow-xl transition-all text-stone-800">
      <div className="text-center border-b border-stone-100 pb-4 mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-avle-verde">Checkout Digital AVLE</h3>
        <p className="text-xs text-stone-500 mt-1">Gere pagamentos dinâmicos instantâneos</p>
      </div>

      {!dadosPix ? (
        // TELA 1: Definição do Valor para a Demonstração
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Valor da Parcela (R$) *</label>
            <input 
              type="number" 
              value={valorInput}
              onChange={(e) => setValorInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-avle-verde bg-stone-50 text-sm font-medium h-[46px]"
            />
          </div>

          <button
            onClick={handleGerarPagamento}
            disabled={carregando}
            className="w-full bg-avle-terracotta text-white font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] shadow-md text-sm tracking-wide disabled:opacity-50"
          >
            {carregando ? 'PROCESSANDO GATEWAY...' : 'GERAR PIX DINÂMICO'}
          </button>
        </div>
      ) : (
        // TELA 2: Visualização do QR Code e Copia e Cola
        <div className="space-y-6 flex flex-col items-center animate-fade-in">
          
          {/* QR Code Dinâmico Real */}
          <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-2xl shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={dadosPix.qrCodeUrl} 
              alt="QR Code Pix" 
              className="w-48 h-48 rounded-lg"
            />
          </div>

          <div className="text-center space-y-1">
            <p className="text-[10px] font-black tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase inline-block">⏱️ Aguardando Pagamento</p>
            <p className="text-xs text-stone-400 mt-1">Ref Transação: #{dadosPix.idTransacao}</p>
          </div>

          {/* Copia e Cola Input */}
          <div className="w-full space-y-2">
            <label className="block text-[10px] font-bold uppercase text-stone-500">Código Pix Copia e Cola</label>
            <div className="relative flex items-center">
              <input 
                type="text" 
                readOnly
                value={dadosPix.pixCopiaECola}
                className="w-full px-4 py-3 pr-24 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono overflow-hidden text-ellipsis whitespace-nowrap select-all h-[46px]"
              />
              <button
                onClick={handleCopiarCodigo}
                className={`absolute right-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                  copiado 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-avle-verde text-white hover:bg-opacity-90'
                }`}
              >
                {copiado ? '✓ COPIADO' : 'COPIAR'}
              </button>
            </div>
          </div>

          <button
            onClick={() => setDadosPix(null)}
            className="text-stone-400 hover:text-stone-600 font-bold text-xs text-center py-1 transition-all"
          >
            ← Voltar e alterar valor
          </button>
        </div>
      )}
    </div>
  );
}