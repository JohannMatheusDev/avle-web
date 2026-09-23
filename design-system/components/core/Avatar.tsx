export type AvatarProps = {
  src?: string;
  name?: string;
  size?: number;
  /** Fundo verde da marca com creme por cima, para loja sem foto. */
  brand?: boolean;
};

export function Avatar({ src, name = '', size = 40, brand }: AvatarProps) {
  const iniciais = name.split(' ').filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
  return (
    <span className={'av-avatar' + (brand ? ' av-avatar--brand' : '')} style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }} title={name}>
      {/* eslint-disable-next-line @next/next/no-img-element -- foto de perfil vem de URL externa arbitrária */}
      {src ? <img src={src} alt={name} /> : iniciais}
    </span>
  );
}
