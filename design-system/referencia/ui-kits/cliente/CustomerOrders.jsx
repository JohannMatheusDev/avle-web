(() => {
const { Card, Tabs, Money, Badge, Button, Icon, Avatar, Dialog, EmptyState } = window.AVLEDesignSystem_11270f;

const ORDERS = [
  { id: '#AV-2038', s: 'Raiz Casa & Decoração', d: '27.09.26', v: 412.3, st: 'Em trânsito', t: 'info', at: 2, items: ['Luminária de bambu', 'Vaso Terra', 'Porta-velas'], ic: 'lamp' },
  { id: '#AV-1987', s: 'Ateliê Barro', d: '12.09.26', v: 129.8, st: 'Entregue', t: 'positive', at: 3, items: ['Caneca Musgo ×2'], ic: 'coffee' },
  { id: '#AV-1920', s: 'Verde Casa', d: '30.08.26', v: 89.9, st: 'Entregue', t: 'positive', at: 3, items: ['Cachepô de fibra'], ic: 'sprout' },
  { id: '#AV-1811', s: 'Raiz Casa & Decoração', d: '02.08.26', v: 249, st: 'Cancelado', t: 'negative', at: 0, items: ['Manta de linho natural'], ic: 'layers' },
];

function CustomerOrders({ toast }) {
  const [tab, setTab] = React.useState('all');
  const [open, setOpen] = React.useState(null);
  const list = ORDERS.filter((o) => tab === 'all' || (tab === 'open' ? o.st === 'Em trânsito' : o.st === 'Entregue'));
  return <>
    <PageHead title="Meus pedidos" sub={ORDERS.length + ' pedidos em 2026'} />
    <div style={{ marginBottom: 16 }}><Tabs value={tab} onChange={setTab} items={[{ value: 'all', label: 'Todos', count: ORDERS.length }, { value: 'open', label: 'Em andamento', count: 1 }, { value: 'done', label: 'Entregues' }]} /></div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {list.length === 0 && <Card><EmptyState icon="package" title="Nada por aqui" body="Seus pedidos aparecerão nesta lista." /></Card>}
      {list.map((o) => <Card key={o.id} interactive onClick={() => setOpen(o)} style={{ padding: 16 }}>
        <div className="kit-row" style={{ gap: 16 }}>
          <div className="kit-ph" style={{ width: 72, aspectRatio: '1', flex: 'none', borderRadius: 16 }}><Icon name={o.ic} size={24} /></div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div className="kit-row" style={{ gap: 8 }}><span style={{ fontWeight: 600 }}>{o.s}</span><Badge tone={o.t} dot>{o.st}</Badge></div>
            <div className="kit-muted" style={{ marginTop: 4 }}>{o.id} · {o.d} · {o.items.join(', ')}</div>
          </div>
          <Money value={o.v} size={18} />
          <Icon name="chevron-right" size={18} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </Card>)}
    </div>

    <Dialog open={!!open} onClose={() => setOpen(null)} title={open && 'Pedido ' + open.id} description={open && open.s + ' · ' + open.d}
      footer={open && <>{open.st === 'Entregue' && <Button variant="secondary" icon="rotate-ccw" onClick={() => { setOpen(null); toast('Itens adicionados à sacola'); }}>Comprar de novo</Button>}{open.st === 'Em trânsito' && <Button icon="map-pin" onClick={() => { setOpen(null); toast('Link de rastreio copiado'); }}>Rastrear</Button>}</>}>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {open.st !== 'Cancelado' && <OrderSteps at={open.at} />}
        <div style={{ padding: 16, borderRadius: 20, background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {open.items.map((i) => <div key={i} className="kit-row" style={{ justifyContent: 'space-between' }}><span>{i}</span></div>)}
          <div className="kit-row" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}><b style={{ fontWeight: 600 }}>Total</b><Money value={open.v} size={20} /></div>
        </div>
      </div>}
    </Dialog>
  </>;
}
window.CustomerOrders = CustomerOrders;
})();
