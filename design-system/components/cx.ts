/**
 * Junta classes ignorando as falsas. Cada componente do export original
 * repetia esta mesma linha no topo; aqui ela existe uma vez só.
 */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');
