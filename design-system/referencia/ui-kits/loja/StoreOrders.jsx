(() => {
const { Card, Table, Tabs, Input, Badge, Avatar, Money, Button, Dialog, IconButton, Select } = window.AVLEDesignSystem_11270f;

const TONE = { 'A enviar': 'warning', 'Em trânsito': 'info', 'Entregue': 'positive', 'Cancelado': 'negative', 'Aguardando pagamento': 'neutral' };
const ORDERS = [
  { id: '#AV-2041', c: 'Ana Lima', d: '28.09.26 · 14:02', i: 2, v: 289.9, pay: 'Pix', s: 'A enviar' },
  { id: '#AV-2040', c: 'Rafael Souza', d: '28.09.26 · 11:47', i: 5, v: 1240, pay: 'Cartão 3x', s: 'A enviar' },
  { id: '#AV-2039', c: 'Beatriz Nunes', d: '27.09.26 · 22:15', i: 1, v: 96.5, pay: 'Boleto', s: 'Aguardando pagamento' },
  { id: '#AV-2038', c: 'Carlos Mota', d: '27.09.26 · 18:30', i: 3, v: 412.3, pay: 'Pix', s: 'Em trânsito' },
  { id: '#AV-2037', c: 'Juliana Reis', d: '26.09.26 · 09:12', i: 1, v: 189.9, pay: 'Cartão', s: 'Entregue' },
  { id: '#AV-2036', c: 'Pedro Alves', d: '25.09.26 · 16:44', i: 2, v: 358, pay: 'Pix', s: 'Entregue' },
  { id: '#AV-2035', c: 'Lívia Castro', d: '25.09.26 · 10:03', i: 1, v: 249, pay: 'Cartão', s: 'Cancelado' },
];

function StoreOrders({ toast }) {
  const [tab, setTab] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [rows, setRows] = React.useState(ORDERS);
  const [open, setOpen] = React.useState(null);
  const count = (s) => rows.filter((r) => r.s === s).length;
  const filtered = rows.filter((r) => (tab === 'all' || r.s === tab) && (r.c + r.id).toLowerCase().includes(q.toLowerCase()));
  const ship = (o) => { setRows((rs) => rs.map((r) => r.id === o.id ? { ...r, s: 'Em trânsito' } : r)); setOpen(null); toast('Pedido ' + o.id + ' marcado como enviado'); };

  return <>
    <PageHead title="Pedidos" sub={rows.length + ' pedidos nos últimos 7 dias'}>
      <span className="kit-desktop-only"><Button variant="outline" icon="download">Exportar</Button></span>
    </PageHead>
    <Card>
      <div className="kit-row" style={{ justifyContent: 'space-between' }}>
        <Tabs value={tab} onChange={setTab} items={[{ value: 'all', label: 'Todos', count: rows.length }, { value: 'A enviar', label: 'A enviar', count: count('A enviar') }, { value: 'Em trânsito', label: 'Em trânsito', count: count('Em trânsito') }, { value: 'Entregue', label: 'Entregues' }, { value: 'Cancelado', label: 'Cancelados' }]} />
        <div className="kit-row" style={{ flex: '1 1 260px', maxWidth: 360 }}><Input size="sm" icon="search" placeholder="Buscar cliente ou pedido" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} /><IconButton icon="sliders-horizontal" label="Filtros" /></div>
      </div>
      <Table onRowClick={setOpen} rows={filtered} columns={[
        { key: 'id', label: 'Pedido', render: (r) => <div><div style={{ fontWeight: 600 }}>{r.id}</div><div className="kit-muted">{r.d}</div></div> },
        { key: 'c', label: 'Cliente', hideOnMobile: true, render: (r) => <div className="kit-row"><Avatar name={r.c} size={32} />{r.c}</div> },
        { key: 'i', label: 'Itens', hideOnMobile: true },
        { key: 'pay', label: 'Pagamento', hideOnMobile: true, render: (r) => <span style={{ color: 'var(--text-secondary)' }}>{r.pay}</span> },
        { key: 's', label: 'Status', render: (r) => <Badge tone={TONE[r.s]} dot>{r.s}</Badge> },
        { key: 'v', label: 'Total', align: 'right', render: (r) => <Money value={r.v} size={14} /> },
      ]} />
    </Card>

    <Dialog open={!!open} onClose={() => setOpen(null)} title={open && 'Pedido ' + open.id} description={open && open.c + ' · ' + open.d}
      footer={open && <><Button variant="ghost" onClick={() => setOpen(null)}>Fechar</Button>{open.s === 'A enviar' && <Button icon="truck" onClick={() => ship(open)}>Marcar como enviado</Button>}</>}>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="kit-row" style={{ justifyContent: 'space-between' }}><Badge tone={TONE[open.s]} dot>{open.s}</Badge><span className="kit-muted">{open.pay}</span></div>
        <div style={{ padding: 16, borderRadius: 20, background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="kit-row" style={{ justifyContent: 'space-between' }}><span>{open.i} {open.i > 1 ? 'itens' : 'item'}</span><Money value={open.v - 24.9} size={14} /></div>
          <div className="kit-row" style={{ justifyContent: 'space-between' }}><span>Frete · Sedex</span><Money value={24.9} size={14} /></div>
          <div className="kit-row" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}><b style={{ fontWeight: 600 }}>Total</b><Money value={open.v} size={20} /></div>
        </div>
        <Select label="Transportadora" options={['Correios · Sedex', 'Correios · PAC', 'Jadlog']} />
      </div>}
    </Dialog>
  </>;
}
window.StoreOrders = StoreOrders;
})();
