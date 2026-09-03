// Regras de aceitação compartilhadas pelo login principal e pela página de
// convite. As duas telas validavam por conta própria e checavam apenas o
// tamanho dos campos, então um CPF 99999999999 ou um telefone (00) 00000-0000
// passavam direto. O servidor aplica as mesmas regras, aqui e so para o retorno
// imediato ao usuário.

export const somenteDigitos = (valor: string) => (valor || '').replace(/\D/g, '');

/**
 * CPF conferido pelos dígitos verificadores. O algoritmo já recusa sozinho os
 * números de digito repetido (111.111.111-11, 999.999.999-99), que são a forma
 * mais comum de burlar um cadastro.
 */
export const cpfValido = (cpf: string) => {
  const numero = somenteDigitos(cpf);
  if (numero.length !== 11) return false;
  if (new Set(numero).size === 1) return false;

  for (let posicaoDigito = 9; posicaoDigito < 11; posicaoDigito++) {
    let soma = 0;
    for (let i = 0; i < posicaoDigito; i++) {
      soma += Number(numero[i]) * (posicaoDigito + 1 - i);
    }
    const resto = soma % 11;
    const esperado = resto < 2 ? 0 : 11 - resto;
    if (Number(numero[posicaoDigito]) !== esperado) return false;
  }
  return true;
};

// DDDs em uso no Brasil. A lista fechada barra números inventados como (00) e
// (10), que passariam por qualquer checagem baseada so em tamanho.
const DDDS_VALIDOS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/**
 * Telefone brasileiro: DDD conhecido, 8 ou 9 digitos na linha e celular
 * comecando em 9. Numeros de digito repetido são recusados mesmo quando o
 * tamanho bate, que era o caso do 99999999999.
 */
export const telefoneValido = (telefone: string) => {
  const numero = somenteDigitos(telefone);
  if (numero.length !== 10 && numero.length !== 11) return false;
  if (new Set(numero).size === 1) return false;
  if (!DDDS_VALIDOS.has(Number(numero.slice(0, 2)))) return false;

  const linha = numero.slice(2);
  if (linha.length === 9 && linha[0] !== '9') return false;
  if (linha.length === 8 && (linha[0] === '0' || linha[0] === '1')) return false;

  // Linha toda igual (999999999) passa nas regras acima, mas não existe.
  return new Set(linha).size !== 1;
};

export interface RequisitosSenha {
  tamanhoMinimo: boolean;
  temMaiuscula: boolean;
  temNumero: boolean;
  temCaracterEspecial: boolean;
}

export const requisitosSenha = (senha: string): RequisitosSenha => ({
  tamanhoMinimo: (senha || '').length >= 8,
  temMaiuscula: /[A-Z]/.test(senha || ''),
  temNumero: /[0-9]/.test(senha || ''),
  temCaracterEspecial: /[^A-Za-z0-9]/.test(senha || ''),
});

export const senhaForte = (senha: string) =>
  Object.values(requisitosSenha(senha)).every(Boolean);

/**
 * Aceita e-mail, telefone ou CPF como identificador de login.
 *
 * O CPF entrou porque nem toda cliente lembra qual e-mail usou no cadastro, e
 * varias nem tem e-mail. CPF ela sabe de cabeca.
 *
 * Telefone e CPF tem os mesmos onze digitos, entao nao da para dizer qual e
 * qual sem consultar a base - por isso aqui basta ser um dos dois, e quem
 * decide e o servidor, procurando nos dois campos.
 */
export const identificadorLoginValido = (valor: string) => {
  const texto = (valor || '').trim();
  if (texto.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
  return telefoneValido(texto) || cpfValido(texto);
};

/** CEP com o hifen, do jeito que se escreve: 85015-300. */
export const aplicarMascaraCep = (valor: string) => {
  const digitos = (valor || '').replace(/\D/g, '');
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5, 8)}`;
};
