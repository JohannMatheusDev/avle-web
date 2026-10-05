'use client';

/**
 * Prévia da Conta AVLE com números de exemplo, para conferir o desenho sem
 * entrar na conta de uma loja. Nada aqui vem da API.
 */

import { useState } from 'react';
import { TelaDaContaAvle, type ResumoDaConta } from '../../dashboard/components/ContaAvle';

const RESUMO: ResumoDaConta = {
  lojaId: 1,
  nomeLoja: 'Caza Liz',
  competencia: '2026-10',
  recebidoNoMes: 18450.6,
  taxaAvleNoMes: 1845.06,
  recebidoMesAnterior: 16210.4,
  taxaAvleMesAnterior: 1621.04,
  aReceberNoMes: 9612.6,
  parcelasEmAberto: 74,
  chavePix: '12.345.678/0001-90',
  tipoChavePix: 'CNPJ',
  conectada: true,
  saqueEmAndamento: false,
  saldo: 5465.0,
};

const valores = [3120, 4410, 2980, 5210, 4699, 6120, 3880, 4290, 5830, 4720, 3610, 6890];
const saques = [0, 2500, 0, 3000, 0, 4200, 0, 2800, 0, 5000, 0, 3100];
const PAINEL = {
  semanas: valores.map((v, i) => {
    const d = new Date(2026, 6, 20 + i * 7);
    return { inicio: d.toISOString().slice(0, 10), entradas: v, saidas: saques[i] };
  }),
  porDiaDaSemana: [820, 6200, 4300, 5100, 3900, 7400, 1500],
  resumoDaSemana: { inicio: '2026-09-28', fim: '2026-10-04', estaSemana: [], semanaPassada: [], total: 0, totalSemanaPassada: 0 },
  saques: { andamento: { quantidade: 0, valor: 0 }, banco: { quantidade: 0, valor: 0 }, concluidos: { quantidade: 6, valor: 20600 }, naoSairam: { quantidade: 0, valor: 0 } },
};

const hoje = new Date();
const dia = (n: number) => { const d = new Date(hoje); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const EXTRATO = {
  temMais: true,
  lancamentos: [
    { id: '1', data: dia(0), valor: 129.9, tipo: 'PAYMENT', titulo: 'Parcela de outubro', descricao: 'Ana Lima · Grupo Lírios' },
    { id: '2', data: dia(0), valor: 129.9, tipo: 'PAYMENT', titulo: 'Parcela de outubro', descricao: 'Regina Antunes · Grupo Lírios' },
    { id: '3', data: dia(1), valor: -0.99, tipo: 'FEE', titulo: 'Taxa do Asaas', descricao: 'Pix recebido' },
    { id: '4', data: dia(1), valor: -12.99, tipo: 'SPLIT', titulo: 'Parte da AVLE', descricao: '10% da parcela' },
    { id: '5', data: dia(3), valor: -3100, tipo: 'TRANSFER', titulo: 'Saque via Pix', descricao: 'CNPJ 12.345.678/0001-90' },
  ],
};

export default function PreviaContaAvle() {
  const [dias, setDias] = useState<7 | 30 | 90>(30);
  const [semanas, setSemanas] = useState<'4' | '12' | '26'>('12');
  return (
    <div className="fundo-painel min-h-screen p-4 md:p-8">
      <p className="text-[11px] text-stone-400 mb-4">Prévia com números de exemplo — nada vem da API.</p>
      <TelaDaContaAvle
        resumo={RESUMO}
        painel={PAINEL}
        extrato={EXTRATO}
        saques={[{ id: 1, valor: 3100, chavePix: '12.345.678/0001-90', tipoChavePix: 'CNPJ', status: 'CONCLUIDO', criadoEm: dia(3) + 'T10:00:00' }]}
        dias={dias}
        aoMudarDias={setDias}
        semanasDoPainel={semanas}
        aoMudarSemanas={setSemanas}
        podeSacar
        aoExportar={() => {}}
        aoSacar={() => {}}
        aoIrParaConfiguracoes={() => {}}
        aoCarregarMais={() => {}}
      />
    </div>
  );
}
