import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import { Icon } from './Icon';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'inverse';
  size?: 'sm' | 'md' | 'lg';
  /** Ícone Lucide antes do rótulo. */
  icon?: string;
  iconRight?: string;
  /** Largura total — o uso esperado no celular. */
  block?: boolean;
  children?: ReactNode;
};

/**
 * Botão em pílula. O `primary` é a única ação principal da tela; o resto vai
 * de `secondary` ou `outline`.
 */
export function Button({ variant = 'primary', size = 'md', icon, iconRight, block, children, className, ...rest }: ButtonProps) {
  const tamanhoDoIcone = size === 'sm' ? 16 : 18;
  return (
    <button className={cx('av-btn', 'av-btn--' + variant, size !== 'md' && 'av-btn--' + size, block && 'av-btn--block', className)} {...rest}>
      {icon && <Icon name={icon} size={tamanhoDoIcone} />}
      {children}
      {iconRight && <Icon name={iconRight} size={tamanhoDoIcone} />}
    </button>
  );
}
