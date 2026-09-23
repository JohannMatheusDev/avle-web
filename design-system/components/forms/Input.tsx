import type { CSSProperties, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cx } from '../cx';
import { Icon } from '../core/Icon';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string;
  hint?: string;
  /** Mensagem de erro. Pinta a borda e toma o lugar da dica. */
  error?: string;
  /** Ícone Lucide no começo do campo. */
  icon?: string;
  trailing?: ReactNode;
  size?: 'sm' | 'md';
  /** Vira <textarea>. Os atributos repassados vão para ele. */
  multiline?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function Input({ label, hint, error, icon, trailing, size = 'md', multiline, className, style, ...rest }: InputProps) {
  return (
    <label className={cx('av-field', className)} style={style}>
      {label && <span className="av-field__label">{label}</span>}
      <span className={cx('av-input', size === 'sm' && 'av-input--sm', error && 'av-input--error', multiline && 'av-input--area')}>
        {icon && <Icon name={icon} size={18} className="av-input__icon" />}
        {multiline ? <textarea {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} /> : <input {...rest} />}
        {trailing}
      </span>
      {(error || hint) && <span className={cx('av-field__hint', error && 'av-field__hint--error')}>{error || hint}</span>}
    </label>
  );
}
