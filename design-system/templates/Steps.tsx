import { Icon } from '../components/core/Icon';

export type Step = { icon: string; label: string };

export type StepsProps = {
  steps: Step[];
  /** Índice da etapa atual. Ela e as anteriores ficam acesas. */
  current: number;
};

/**
 * Linha de etapas com bolinhas ligadas por traço. No export ela vivia dentro
 * da tela da cliente, com as quatro etapas de entrega escritas no código;
 * aqui as etapas vêm por prop, para servir a qualquer andamento.
 */
export function Steps({ steps, current }: StepsProps) {
  return (
    <div className="kit-steps">
      {steps.map((etapa, i) => (
        <div key={etapa.label} className={'kit-step' + (i <= current ? ' kit-step--done' : '')}>
          <span className="kit-step__dot"><Icon name={etapa.icon} size={14} /></span>
          {etapa.label}
        </div>
      ))}
    </div>
  );
}
