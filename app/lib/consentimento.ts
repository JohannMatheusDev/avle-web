// Consentimento de cookies e armazenamento local (LGPD).
//
// A AVLE guarda dois tipos de coisa no navegador:
//
//   ESSENCIAL   - a sessao de quem entrou e a loja a que a conta esta amarrada.
//                 Sem isso a pessoa e deslogada a cada clique, entao nao ha o
//                 que consentir: e o proprio servico funcionando. A LGPD pede
//                 transparencia sobre isso, nao autorizacao previa.
//
//   OPCIONAL    - medicao de uso, marketing e afins. Hoje NAO existe nenhum, e
//                 por isso "rejeitar" nao degrada nada. Este modulo existe para
//                 que, quando o primeiro for adicionado, ele ja nasca atras da
//                 pergunta em vez de ser ligado sem ninguem perceber.
//
// A escolha e gravada localmente porque e uma preferencia do aparelho, nao um
// dado da conta: registrar no servidor exigiria identificar quem ainda nem
// entrou, que e justamente o oposto do que a pergunta quer proteger.

export type EscolhaConsentimento = 'aceito' | 'rejeitado';

const CHAVE = '@avle:consentimento_cookies';
const CHAVE_DATA = '@avle:consentimento_data';

export function lerConsentimento(): EscolhaConsentimento | null {
  if (typeof window === 'undefined') return null;

  const valor = window.localStorage.getItem(CHAVE);
  return valor === 'aceito' || valor === 'rejeitado' ? valor : null;
}

export function gravarConsentimento(escolha: EscolhaConsentimento) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(CHAVE, escolha);
  // A data importa para a LGPD: o consentimento tem prazo e precisa ser
  // renovado quando o tratamento mudar.
  window.localStorage.setItem(CHAVE_DATA, new Date().toISOString());
}

/**
 * Porta unica para qualquer armazenamento nao essencial. Toda medicao de uso
 * que vier a existir deve passar por aqui antes de gravar ou disparar nada.
 */
export function podeUsarOpcionais(): boolean {
  return lerConsentimento() === 'aceito';
}
