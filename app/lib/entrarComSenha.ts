import { apiFetch } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

/**
 * Entra com o e-mail e a senha que a pessoa acabou de digitar no cadastro.
 *
 * Quem se cadastra já entra: pedir o login logo depois, com os campos limpos,
 * era digitar tudo de novo. Devolve a sessão guardada, ou nulo quando o login
 * não deu certo - aí a tela de entrar abre com os dados já preenchidos.
 */
export async function entrarComSenha(identificador: string, senha: string): Promise<Record<string, unknown> | null> {
  try {
    const resposta = await apiFetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador: identificador.trim(), senha }),
    });
    if (!resposta.ok) return null;
    const usuario = await resposta.json();
    localStorage.setItem('@avle:usuario', JSON.stringify(usuario));
    return usuario;
  } catch {
    return null;
  }
}
