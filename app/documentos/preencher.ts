/**
 * Preenche os campos variáveis dos documentos oficiais.
 *
 * Só troca o que é dado da loja ou do grupo; o resto do texto fica idêntico ao
 * original. Os 10% e 90% escritos nos documentos viram o percentual da loja
 * ou do grupo: o percentual é negociado por loja, e um contrato dizendo 10%
 * para uma loja de 5% contradiria o próprio split.
 */

import {
  CONTRATO_LOJISTA_1_1,
  POLITICA_DE_PRIVACIDADE_1,
  POLITICA_DE_REPASSES_1,
  REGULAMENTO_GERAL_1,
  TERMO_DE_ADESAO_1,
} from './textos';

/** 5 vira "5%", 7.5 vira "7,5%". */
export const formatarPercentual = (p: number) =>
  `${Number(p).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

function trocarPercentuais(texto: string, percentualAvle: number) {
  const daAvle = formatarPercentual(percentualAvle);
  const daLoja = formatarPercentual(Math.round((100 - percentualAvle) * 100) / 100);
  return texto.replaceAll('10%', daAvle).replaceAll('90%', daLoja);
}

/** Os dados da loja que vão no contrato. */
export type DadosDoLojista = { razaoSocial: string; cnpj: string; enderecoSede?: string | null; percentualAvle: number };

/**
 * O contrato AVLE x Lojista preenchido, sem o bloco de assinatura e
 * testemunhas do final: o aceite é eletrônico e registrado pela plataforma
 * (cláusula 15.11), e quem exibe mostra o registro do aceite no lugar.
 */
export function contratoDoLojista(d: DadosDoLojista, versao = 'lojista-1.1') {
  if (versao !== 'lojista-1.1') throw new Error(`Versão do contrato desconhecida: ${versao}`);
  let t = CONTRATO_LOJISTA_1_1;
  t = t.replace('[RAZÃO SOCIAL DO LOJISTA]', d.razaoSocial);
  t = t.replace(
    'inscrita no CNPJ sob o nº [A CONFIRMAR], com sede em [A CONFIRMAR], doravante denominada LOJISTA',
    `inscrita no CNPJ sob o nº ${d.cnpj}, com sede em ${d.enderecoSede || '[A CONFIRMAR]'}, doravante denominada LOJISTA`,
  );
  const fim = t.indexOf('Guarapuava, 05 de outubro de 2026.');
  if (fim > 0) t = t.slice(0, fim).trimEnd();
  return trocarPercentuais(t, d.percentualAvle);
}

/** O Anexo II do contrato do lojista, com o percentual da loja. */
export function politicaDeRepasses(percentualAvle: number) {
  return trocarPercentuais(POLITICA_DE_REPASSES_1, percentualAvle);
}

/**
 * O Regulamento Geral, aceito no cadastro.
 *
 * No cadastro ainda não há grupo, e cada grupo tem o seu percentual: a frase
 * dos 10%/90% passa a remeter ao Quadro Resumo do grupo, que é onde o
 * Termo de Adesão diz o percentual daquela adesão.
 */
export function regulamentoGeral() {
  return REGULAMENTO_GERAL_1.replace(
    '10% do pagamento serão destinados à plataforma e 90% ao LOJISTA',
    'o percentual indicado no Quadro Resumo do grupo será destinado à plataforma e o restante ao LOJISTA',
  );
}

export function politicaDePrivacidade() {
  return POLITICA_DE_PRIVACIDADE_1;
}

/**
 * As cláusulas do Termo de Adesão, a partir da cláusula 1. A identificação da
 * participante e o Quadro Resumo, que no original são tabelas a preencher,
 * quem exibe monta com os dados da cota.
 */
export function clausulasDoTermoDeAdesao(percentualAvle: number) {
  const inicio = TERMO_DE_ADESAO_1.indexOf('CLÁUSULA 1  ADESÃO E DOCUMENTOS');
  const corpo = TERMO_DE_ADESAO_1.slice(inicio).replace(/\n_{5,}\nPARTICIPANTE\s*$/, '').trimEnd();
  return trocarPercentuais(corpo, percentualAvle);
}

/** A abertura do Termo, antes das tabelas. */
export function aberturaDoTermoDeAdesao() {
  return TERMO_DE_ADESAO_1.split('\n').slice(0, 2).join('\n');
}
