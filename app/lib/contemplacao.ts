// Formatos devolvidos pela API na trilha pos-sorteio. Ficam num modulo próprio
// porque o painel da cliente e o da loja consomem exatamente os mesmos objetos.

export interface EtapaTrilha {
  etapa: string;
  titulo: string;
  posicao: number;
  concluida: boolean;
  atual: boolean;
}

export interface ResumoSorteio {
  codigoAuditoria: string;
  concursoLoteria: number | null;
  numeroSorteadoFonte: string | null;
  dataApuracao: string | null;
  quantidadeParticipantes: number | null;
}

export interface CardContemplacao {
  cotaId: number;
  // Preenchidos para o painel da loja, onde o card e a lista de quem foi
  // sorteado. No painel da cliente sao ignorados: la a conta e dela.
  clienteNome: string | null;
  clienteTelefone: string | null;
  dataEntrega: string | null;
  grupoNome: string | null;
  dataContemplacao: string | null;
  etapaAtual: string;
  etapaTitulo: string;
  etapaDescricao: string;
  posicaoAtual: number;
  totalEtapas: number;
  creditoAprovado: boolean | null;
  motivoReprovacaoCredito: string | null;
  produtoEscolhido: string | null;
  termoAssinado: boolean;
  aguardandoEncerramento: boolean;
  concluido: boolean;
  // Situacao financeira da cota. A loja decide liberar a retirada olhando o
  // card, e essa decisao dependia de abrir o financeiro em outra tela.
  valorTotalPlano: number | null;
  valorPago: number;
  saldoDevedor: number | null;
  quitada: boolean;
  acaoDoCliente: 'ESCOLHER_PRODUTO' | null;
  trilha: EtapaTrilha[];
  sorteio?: ResumoSorteio;
}

/** Uma linha do histórico de sorteios no painel da loja. */
export interface SorteioResumo {
  id: number;
  codigoAuditoria: string;
  status: 'AGENDADO' | 'APURADO' | 'CANCELADO';
  /**
   * De onde veio o resultado.
   *
   * LOTERIA_FEDERAL é sorteio de verdade, com lista congelada e número de
   * concurso. Qualquer outra coisa é lançamento manual da loja: uma
   * contemplação que aconteceu no balcão e foi cadastrada depois.
   */
  fonteAleatoriedade?: string | null;
  quantidadeParticipantes: number;
  concursoLoteria: number | null;
  dataPrevistaConcurso: string;
  contempladaNome?: string | null;
  cotaContempladaId?: number | null;
}

/** Sorteio de verdade tem número da Loteria por trás; o resto é lançamento. */
export const ehSorteioAuditavel = (s: { fonteAleatoriedade?: string | null }) =>
  s.fonteAleatoriedade === 'LOTERIA_FEDERAL';

export interface CotaElegivel {
  cotaId: number;
  nome: string | null;
  saldoPoupanca: number;
}

export const mensagemDeErro = (erro: unknown, padrao: string) =>
  erro instanceof Error && erro.message ? erro.message : padrao;
