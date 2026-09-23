'use client';

export type TabItem = { value: string; label: string; count?: number };

export type TabsProps = {
  items: (string | TabItem)[];
  value: string;
  onChange?: (value: string) => void;
};

/** Abas em pílula, com rolagem lateral quando não cabem. */
export function Tabs({ items = [], value, onChange }: TabsProps) {
  return (
    <div className="av-tabs" role="tablist">
      {items.map((it) => {
        const aba = typeof it === 'string' ? { value: it, label: it, count: undefined } : it;
        return (
          <button key={aba.value} role="tab" aria-selected={aba.value === value} className={'av-tab' + (aba.value === value ? ' av-tab--on' : '')} onClick={() => onChange?.(aba.value)}>
            {aba.label}
            {aba.count != null && <span className="av-tab__count">{aba.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
