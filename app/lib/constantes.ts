/**
 * A senha com que o backend cria a conta da cliente quando a loja a cadastra.
 *
 * Fica aqui, num lugar so, porque ja esteve escrita solta em duas telas e as
 * duas ficaram para tras quando o valor mudou: a loja prometia "Avle123" e a
 * conta nascia com outra coisa, entao a cliente tentava entrar com o que leu na
 * tela e nao conseguia.
 *
 * O valor de verdade e o do backend, em UsuarioController. Se ele mudar la,
 * muda aqui - nao existe forma de a tela descobrir sozinha, porque este texto
 * aparece antes de qualquer cadastro existir.
 */
export const SENHA_PADRAO_INICIAL = 'Avle_123!';
