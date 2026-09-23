export type ProgressProps = {
  value: number;
  max?: number;
  /** Etiqueta flutuante com o % na ponta do preenchimento. */
  knob?: boolean;
  /** Trilho liso no lugar do hachurado. */
  plain?: boolean;
  size?: 'sm' | 'md';
};

export function Progress({ value = 0, max = 100, knob, plain, size = 'md' }: ProgressProps) {
  const porcento = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={'av-progress' + (plain ? ' av-progress--plain' : '') + (size === 'sm' ? ' av-progress--sm' : '')} role="progressbar" aria-valuenow={Math.round(porcento)} aria-valuemin={0} aria-valuemax={100}>
      <div className="av-progress__fill" style={{ width: porcento + '%' }} />
      {knob && size !== 'sm' && <span className="av-progress__knob" style={{ left: `clamp(22px,${porcento}%,calc(100% - 22px))` }}>{Math.round(porcento)}%</span>}
    </div>
  );
}
