/**
 * Qual painel a afiliada vê ao abrir o /dashboard. Ela também é cliente: usa o
 * painel da cliente para mostrar como o clube funciona e o de afiliada para
 * divulgar. A escolha fica no navegador para a página recarregada não trocar
 * de painel sozinha.
 */

const CHAVE = '@avle:painel';

export type Painel = 'cliente' | 'afiliada';

export function escolherPainel(painel: Painel) {
  try {
    localStorage.setItem(CHAVE, painel);
  } catch {
    // Sem armazenamento: abre o painel da cliente, que é o padrão.
  }
}

export function painelEscolhido(): Painel {
  try {
    return localStorage.getItem(CHAVE) === 'afiliada' ? 'afiliada' : 'cliente';
  } catch {
    return 'cliente';
  }
}

/** Marca na sessão guardada que a conta virou afiliada, sem pedir login de novo. */
export function marcarComoAfiliada() {
  try {
    const bruto = localStorage.getItem('@avle:usuario');
    if (!bruto) return;
    localStorage.setItem('@avle:usuario', JSON.stringify({ ...JSON.parse(bruto), afiliada: true }));
  } catch {
    // Sessão ilegível: o próximo login já traz a marca.
  }
}
