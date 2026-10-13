'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

type Contrato = {
  cotaId: number;
  status: string | null;
  versao: string | null;
  assinado: boolean;
  dataAssinatura: string | null;
  ipAssinatura: string | null;
  cliente?: {
    nome: string; cpf: string; telefone: string | null; email: string | null;
    endereco: string | null; cadastroCompleto: boolean;
    dataAceiteTermos: string | null; versaoTermos: string | null;
  };
  loja?: { nome: string; documento: string | null; telefone: string | null; endereco: string | null; temRegulamento: boolean; lojaId: number };
  grupo?: { nome: string; valorParcela: number | null; duracaoMeses: number | null; valorTotal: number | null; dataInicio: string | null; dataTermino: string | null };
};

const reais = (v: number | null | undefined) =>
  v == null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const data = (v: string | null | undefined, comHora = false) =>
  v ? new Date(v).toLocaleString('pt-BR', comHora
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const cpfVisivel = (cpf?: string) => {
  const d = (cpf || '').replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf || '—';
};

/**
 * O contrato da cliente: o termo de adesão de cada grupo em que ela entrou,
 * com os dados dela e o registro do aceite.
 *
 * Antes não existia: só o regulamento em PDF da loja, igual para todo mundo e
 * sem o nome de ninguém. A cliente não tinha como mostrar o que contratou.
 *
 * As cláusulas moram aqui, e não no servidor, porque são texto. Cada cota
 * guarda a versão que assinou (adesao-1); mudou uma cláusula, nasce uma versão
 * nova aqui e no AVLE_CONTRATO_VERSAO, e as adesões antigas continuam
 * mostrando o texto que foi aceito.
 *
 * O mesmo componente serve à loja, na ficha da cliente.
 */
export default function ContratoDaCliente({ usuarioId }: { usuarioId: number }) {
  const [contratos, setContratos] = useState<Contrato[] | null>(null);
  const [erro, setErro] = useState(false);
  const [aberto, setAberto] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;
    apiFetch(`${API_URL}/api/contratos/cliente/${usuarioId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((lista: Contrato[]) => {
        if (!ativo) return;
        setContratos(lista);
        if (lista.length === 1) setAberto(lista[0].cotaId);
      })
      .catch(() => ativo && setErro(true));
    return () => {
      ativo = false;
    };
  }, [usuarioId]);

  if (erro) {
    return <p className="text-xs text-rose-600">Não conseguimos carregar o contrato agora. Tente de novo em instantes.</p>;
  }
  if (!contratos) return <p className="text-xs text-stone-400">Carregando o contrato...</p>;
  if (contratos.length === 0) {
    return (
      <p className="text-xs text-stone-500 leading-relaxed">
        O contrato aparece aqui quando você entra num grupo. Ele é o termo de adesão daquele grupo, com os seus dados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {contratos.map((c) => (
        <div key={c.cotaId} className="border border-[#DFD9CE] rounded-2xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setAberto(aberto === c.cotaId ? null : c.cotaId)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer hover:bg-stone-50"
            aria-expanded={aberto === c.cotaId}
          >
            <span>
              <span className="block text-xs font-bold text-[#0B1E14]">Termo de adesão · {c.grupo?.nome}</span>
              <span className="block text-[10px] text-stone-500 mt-0.5">
                {c.loja?.nome} · {c.assinado ? `aceito em ${data(c.dataAssinatura)}` : 'adesão anterior ao termo eletrônico'}
              </span>
            </span>
            <span className="text-stone-400 text-xs font-bold">{aberto === c.cotaId ? 'Fechar' : 'Ver'}</span>
          </button>
          {aberto === c.cotaId && <TextoDoContrato contrato={c} />}
        </div>
      ))}
    </div>
  );
}

function TextoDoContrato({ contrato: c }: { contrato: Contrato }) {
  const g = c.grupo;
  const titulo = 'text-[11px] font-bold text-[#0B1E14] uppercase tracking-wide mt-4';
  return (
    <article className="px-5 pb-5 pt-2 text-[12px] text-stone-700 leading-relaxed border-t border-stone-100 print:text-black">
      <h4 className="text-sm font-serif font-bold text-[#0B1E14] text-center mt-3">TERMO DE ADESÃO AO CLUBE DE COMPRAS</h4>
      <p className="text-center text-[10px] text-stone-500">Grupo {g?.nome} · participação nº {c.cotaId}</p>

      <p className={titulo}>As partes</p>
      <p>
        <strong>Participante:</strong> {c.cliente?.nome}, CPF {cpfVisivel(c.cliente?.cpf)}
        {c.cliente?.telefone ? `, celular ${c.cliente.telefone}` : ''}
        {c.cliente?.email ? `, e-mail ${c.cliente.email}` : ''}
        {c.cliente?.endereco ? `, residente em ${c.cliente.endereco}` : ''}.
      </p>
      <p>
        <strong>Loja:</strong> {c.loja?.nome}{c.loja?.documento ? `, inscrita sob o nº ${c.loja.documento}` : ''}
        {c.loja?.endereco ? `, com endereço em ${c.loja.endereco}` : ''}, que organiza o grupo e entrega o produto.
      </p>
      <p>
        <strong>Plataforma:</strong> AVLE, que hospeda o grupo, emite as cobranças e conduz o sorteio.
      </p>

      <p className={titulo}>1. Objeto</p>
      <p>
        A participante adere ao grupo {g?.nome}, organizado pela loja na plataforma AVLE, para adquirir um produto
        da loja por meio de contribuições mensais.
      </p>

      <p className={titulo}>2. Parcelas</p>
      <p>
        O plano tem {g?.duracaoMeses ?? '—'} parcelas mensais de valor fixo de {reais(g?.valorParcela)}, num total de{' '}
        {reais(g?.valorTotal)}. A primeira parcela é paga no momento da adesão; as seguintes vencem até o quinto dia
        útil de cada mês e são pagas por Pix ou boleto. A participação não consome o limite do cartão de crédito da
        participante.
      </p>

      <p className={titulo}>3. Contemplação</p>
      <p>
        As contempladas são definidas por sorteio auditável, entre as participantes com a parcela do mês paga. Ser
        contemplada não encerra o plano: a participante continua pagando as parcelas até o fim do grupo.
      </p>

      <p className={titulo}>4. Retirada do produto</p>
      <p>
        Contemplada, a participante passa pela análise de crédito da loja e escolhe o produto. A liberação do produto
        exige o cadastro completo, com endereço, e as parcelas em dia.
      </p>

      <p className={titulo}>5. Avisos e dados pessoais</p>
      <p>
        A participante aceita receber os avisos de cobrança e do plano por WhatsApp e e-mail. Os dados informados são
        usados para emitir as cobranças, conduzir o plano e falar com ela sobre ele.
      </p>

      <p className={titulo}>6. Regulamento da loja</p>
      <p>
        As regras de desistência, cancelamento e demais condições do grupo são as do regulamento da loja, que integra
        este termo{c.loja?.temRegulamento ? ' e pode ser consultado na aba Regulamento' : ''}.
      </p>

      <p className={titulo}>Registro do aceite</p>
      {c.assinado ? (
        <p>
          Aceito eletronicamente em {data(c.dataAssinatura, true)}
          {c.ipAssinatura ? `, a partir do endereço de rede ${c.ipAssinatura}` : ''}, versão {c.versao || 'adesao-1'} deste
          termo. Termos de uso da AVLE aceitos em {data(c.cliente?.dataAceiteTermos, true)}
          {c.cliente?.versaoTermos ? ` (versão ${c.cliente.versaoTermos})` : ''}.
        </p>
      ) : (
        <p>
          Esta adesão foi feita antes do aceite eletrônico do termo. As condições do grupo seguem as acima e o
          regulamento da loja.
        </p>
      )}

      <button
        type="button"
        onClick={() => window.print()}
        className="mt-4 px-4 py-2 border border-stone-200 text-stone-600 font-bold rounded-xl text-[10px] uppercase tracking-wider cursor-pointer hover:bg-stone-100 print:hidden"
      >
        Imprimir ou salvar em PDF
      </button>
    </article>
  );
}
