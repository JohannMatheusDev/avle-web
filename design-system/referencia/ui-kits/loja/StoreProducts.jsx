(() => {
const { Card, Tabs, Input, Select, Badge, Money, Button, Switch, Dialog, Icon, IconButton, EmptyState } = window.AVLEDesignSystem_11270f;

const PRODUCTS = [
  { id: 1, n: 'Vaso de cerâmica Terra', cat: 'Decoração', v: 189.9, q: 24, on: true, ic: 'flower-2' },
  { id: 2, n: 'Manta de linho natural', cat: 'Têxtil', v: 249, q: 3, on: true, ic: 'layers' },
  { id: 3, n: 'Luminária de bambu', cat: 'Iluminação', v: 239, q: 12, on: true, ic: 'lamp' },
  { id: 4, n: 'Kit xícaras Musgo', cat: 'Mesa posta', v: 129.9, q: 2, on: true, ic: 'coffee' },
  { id: 5, n: 'Cesto de palha P', cat: 'Organização', v: 79.9, q: 0, on: false, ic: 'shopping-basket' },
  { id: 6, n: 'Quadro Folhagem', cat: 'Decoração', v: 320, q: 8, on: true, ic: 'image' },
];

function StoreProducts({ toast }) {
  const [items, setItems] = React.useState(PRODUCTS);
  const [tab, setTab] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const low = items.filter((p) => p.q > 0 && p.q <= 3).length;
  const list = items.filter((p) => (tab === 'all' || (tab === 'low' ? p.q <= 3 : !p.on)) && p.n.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id, v) => setItems((xs) => xs.map((p) => p.id === id ? { ...p, on: v } : p));

  return <>
    <PageHead title="Produtos" sub={items.length + ' produtos · ' + low + ' com estoque baixo'}>
      <Button icon="plus" onClick={() => setAdding(true)}>Novo produto</Button>
    </PageHead>
    <div className="kit-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
      <Tabs value={tab} onChange={setTab} items={[{ value: 'all', label: 'Todos', count: items.length }, { value: 'low', label: 'Estoque baixo', count: low + items.filter((p) => p.q === 0).length }, { value: 'off', label: 'Ocultos' }]} />
      <div style={{ flex: '1 1 240px', maxWidth: 340 }}><Input size="sm" icon="search" placeholder="Buscar produto" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    </div>
    {list.length === 0 ? <Card><EmptyState icon="package-search" title="Nenhum produto aqui" body="Ajuste os filtros ou cadastre um novo produto." action={<Button size="sm" onClick={() => setAdding(true)}>Novo produto</Button>} /></Card> :
    <div className="g">{list.map((p) =>
      <Card key={p.id} className="s4" style={{ padding: 14, gap: 14 }}>
        <div className="kit-ph"><Icon name={p.ic} size={40} />
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1 }}>{p.q === 0 ? <Badge tone="negative">Esgotado</Badge> : p.q <= 3 ? <Badge tone="warning">Restam {p.q}</Badge> : <Badge>{p.q} em estoque</Badge>}</div>
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}><IconButton icon="ellipsis" size="sm" variant="filled" label="Mais ações" /></div>
        </div>
        <div style={{ padding: '0 6px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="kit-muted">{p.cat}</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{p.n}</div>
          <div className="kit-row" style={{ justifyContent: 'space-between' }}><Money value={p.v} size={20} /><Switch checked={p.on} onChange={(v) => { toggle(p.id, v); toast(v ? 'Produto visível na loja' : 'Produto ocultado'); }} /></div>
        </div>
      </Card>)}</div>}

    <Dialog open={adding} onClose={() => setAdding(false)} title="Novo produto" description="Você pode completar fotos e variações depois."
      footer={<><Button variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button><Button onClick={() => { setAdding(false); toast('Produto salvo como rascunho'); }}>Salvar rascunho</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Nome" placeholder="Ex.: Vaso de cerâmica Terra" />
        <div className="g" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}><Input label="Preço" placeholder="R$ 0,00" /><Input label="Estoque" placeholder="0" type="number" /></div>
        <Select label="Categoria" options={['Decoração', 'Têxtil', 'Iluminação', 'Mesa posta', 'Organização']} />
        <Input label="Descrição" multiline placeholder="Materiais, medidas, cuidados…" />
      </div>
    </Dialog>
  </>;
}
window.StoreProducts = StoreProducts;
})();
