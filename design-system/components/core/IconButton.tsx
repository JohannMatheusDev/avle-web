import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../cx';
import { Icon } from './Icon';

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: string;
  /** `outline` é o anel fino do ↗ no canto dos cartões. */
  variant?: 'outline' | 'filled' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  /** Bolinha vermelha de notificação. */
  dot?: boolean;
  /** Obrigatório: botão só com ícone não diz nada para leitor de tela. */
  label: string;
};

export function IconButton({ icon, variant = 'outline', size = 'md', dot, label, className, ...rest }: IconButtonProps) {
  const tamanhoDoIcone = size === 'sm' ? 15 : size === 'lg' ? 20 : 18;
  return (
    <button aria-label={label} title={label} className={cx('av-iconbtn', variant !== 'outline' && 'av-iconbtn--' + variant, size !== 'md' && 'av-iconbtn--' + size, className)} {...rest}>
      <Icon name={icon} size={tamanhoDoIcone} />
      {dot && <span className="av-iconbtn__dot" />}
    </button>
  );
}
