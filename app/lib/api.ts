// Porta unica de saida para a API.
//
// Existe por um motivo so, mas importante: a sessao passou a viajar num cookie
// httpOnly, e o navegador nao envia cookie em requisicao de outra origem a menos
// que a chamada peca explicitamente por credentials: 'include'. Como avle.com.br
// e api.avle.com.br sao origens diferentes para o navegador, uma unica chamada
// esquecida sairia sem sessao e passaria a falhar quando a API fechar.
//
// Centralizar tambem deixa um lugar unico para tratar 401 no futuro, em vez de
// espalhar a mesma checagem por dezenas de telas.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

/** O texto que as telas mostram quando a ação do colaborador foi para aprovação. */
export const MENSAGEM_DE_APROVACAO = 'Pedido enviado para a aprovação da loja. Você acompanha em Aprovações.';

export async function apiFetch(caminho: string, opcoes: RequestInit = {}): Promise<Response> {
  const url = caminho.startsWith('http') ? caminho : `${API_URL}${caminho}`;

  const resposta = await fetch(url, {
    ...opcoes,
    credentials: 'include',
  });

  // A ação do colaborador que precisa da loja mãe volta como 202, "aguardando
  // aprovação": nada foi feito ainda. Cada tela trata 2xx como sucesso e
  // mostraria "grupo criado" sem grupo nenhum. Aqui ela vira uma resposta
  // não concluída, com a mensagem certa, e o painel é avisado para mostrar
  // "Enviado para aprovação" no lugar do erro.
  if (resposta.status === 202) {
    const corpo = await resposta.clone().json().catch(() => null);
    if (corpo?.aguardandoAprovacao) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('avle:aguardando-aprovacao', { detail: corpo }));
      }
      return new Response(
        JSON.stringify({ erro: MENSAGEM_DE_APROVACAO, motivo: MENSAGEM_DE_APROVACAO, mensagem: MENSAGEM_DE_APROVACAO, aguardandoAprovacao: true }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }
  return resposta;
}

/**
 * Encerra a sessao no servidor. O cookie e httpOnly, entao a tela nao consegue
 * apaga-lo sozinha: sem esta chamada, limpar o localStorage tiraria a pessoa da
 * interface mas deixaria a sessao viva no navegador.
 */
export async function encerrarSessao() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Servidor fora do ar nao pode impedir a saida da conta na tela.
  }
  localStorage.removeItem('@avle:usuario');
}
