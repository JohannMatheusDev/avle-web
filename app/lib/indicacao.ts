/**
 * A indicação da afiliada, guardada no navegador de quem abriu o link dela.
 * Vale por 30 dias e só para o cadastro na mesma loja: quem abre o link hoje e
 * se cadastra na semana que vem ainda conta para a afiliada.
 */

const CHAVE = '@avle:indicacao';
const VALIDADE_MS = 30 * 24 * 60 * 60 * 1000;

type Indicacao = { codigo: string; lojaId: number; em: number };

export function guardarIndicacao(codigo: string, lojaId: number) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ codigo, lojaId, em: Date.now() } satisfies Indicacao));
  } catch {
    // Sem armazenamento (aba anônima bloqueada): o cadastro segue sem indicação.
  }
}

/** O código da afiliada para o cadastro nesta loja, ou nada. */
export function codigoDaIndicacao(lojaId: number | null | undefined): string | undefined {
  if (!lojaId) return undefined;
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return undefined;
    const i = JSON.parse(bruto) as Indicacao;
    if (i.lojaId !== lojaId || Date.now() - i.em > VALIDADE_MS) return undefined;
    return i.codigo;
  } catch {
    return undefined;
  }
}
