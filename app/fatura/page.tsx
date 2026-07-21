'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Transacao {
  id: number;
  valorTotal: number;
  valorPoupanca: number;
  valorTaxaAdm: number;
  statusPagamento: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  dataVencimento: string;
}

export default function Faturas() {
  const router = useRouter();
  const [faturas, setFaturas] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarExtrato = async () => {
    const stringUsuario = localStorage.getItem('@avle:usuario');
    if (!stringUsuario) {
      router.push('/');
      return;
    }
    const user = JSON.parse(stringUsuario);

    try {
      const res = await fetch(`http://localhost:8080/api/financeiro/extrato/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setFaturas(data);
      }
    } catch (err) {
      console.error('Erro ao buscar extrato:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const stringUsuario = localStorage.getItem('@avle:usuario');
    if (!stringUsuario) {
      router.push('/');
      return;
    }
    
    carregarExtrato();
  }, [router]);

  
  const handlePagar = async (transacaoId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/financeiro/confirmar-pagamento/${transacaoId}`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Erro ao processar o pagamento.');
      }

      alert('Pagamento processado via PIX com sucesso!');
      carregarExtrato(); 

    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-avle-bege text-avle-texto flex flex-col items-center p-4 pb-24">
      <div className="w-full max-w-md flex flex-col space-y-6">
        
        {/* Header Simples */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/60">
          <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Módulo Financeiro</p>
          <h2 className="text-lg font-bold text-avle-verde">Minhas Parcelas</h2>
        </div>

        {/* Listagem de Parcelas */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-sm text-stone-400 py-8">Buscando faturas no banco de dados...</p>
          ) : faturas.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-stone-200/60">
              <span className="text-2xl block mb-2">🍃</span>
              <p className="text-sm text-stone-400">Você ainda não possui faturas geradas. Entre em um clube de compras na aba anterior!</p>
            </div>
          ) : (
            faturas.map((fatura, index) => (
              <div key={fatura.id} className="bg-white rounded-xl p-4 shadow-sm border border-stone-200/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-stone-700">Parcela {String(index + 1).padStart(2, '0')}</span>
                    
                    {/* Badge de Status Dinâmico */}
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      fatura.statusPagamento === 'PAGO' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      fatura.statusPagamento === 'ATRASADO' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                      'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {fatura.statusPagamento}
                    </span>
                  </div>
                  
                  <p className="text-xs text-stone-400 mt-1">
                    Vence em: {new Date(fatura.dataVencimento).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Poupança: R$ {fatura.valorPoupanca.toFixed(2)} | Taxa: R$ {fatura.valorTaxaAdm.toFixed(2)}
                  </p>
                </div>

                <div className="text-right flex flex-col items-end space-y-2">
                  <span className="text-sm font-black text-stone-800">
                    R$ {fatura.valorTotal.toFixed(2)}
                  </span>
                  
                  {/* Só mostra o botão se a fatura não estiver paga */}
                  {fatura.statusPagamento !== 'PAGO' && (
                    <button
                      type="button"
                      onClick={() => handlePagar(fatura.id)}
                      className="bg-avle-terracotta text-white font-bold px-3 py-1.5 rounded-lg text-[10px] tracking-wider transition-all hover:bg-opacity-90 active:scale-95"
                    >
                      PAGAR PIX
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Menu Inferior Nativo */}
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-avle-verde text-white h-16 rounded-2xl shadow-xl flex items-center justify-around px-6 z-50">
          <button type="button" onClick={() => router.push('/dashboard')} className="flex flex-col items-center justify-center space-y-0.5 text-stone-300 hover:text-white transition-colors">
            <span className="text-lg">📋</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Clubes</span>
          </button>
          <button type="button" onClick={() => router.push('/faturas')} className="flex flex-col items-center justify-center space-y-0.5 text-avle-terracotta">
            <span className="text-lg">💰</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Faturas</span>
          </button>
        </div>

      </div>
    </div>
  );
}