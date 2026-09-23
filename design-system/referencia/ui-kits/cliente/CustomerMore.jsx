(() => {
const { Card, Money, Icon, IconButton, Button, Input, Switch, Avatar, ListRow, Radio, Pill, EmptyState } = window.AVLEDesignSystem_11270f;

const FAVS = [
  { id: 1, n: 'Vaso de cerâmica Terra', s: 'Raiz Casa', v: 189.9, ic: 'flower-2' },
  { id: 2, n: 'Manta de linho natural', s: 'Raiz Casa', v: 249, ic: 'layers' },
  { id: 3, n: 'Caneca Musgo', s: 'Ateliê Barro', v: 64.9, ic: 'coffee' },
  { id: 4, n: 'Cachepô de fibra', s: 'Verde Casa', v: 89.9, ic: 'sprout' },
  { id: 5, n: 'Quadro Folhagem', s: 'Raiz Casa', v: 320, ic: 'image' },
  { id: 6, n: 'Luminária de bambu', s: 'Raiz Casa', v: 239, ic: 'lamp' },
];

function CustomerFavorites({ toast }) {
  const [items, setItems] = React.useState(FAVS);
  return <>
    <PageHead title="Favoritos" sub={items.length + ' produtos salvos'} />
    {items.length === 0 ? <Card><EmptyState icon="heart" title="Nenhum favorito ainda" body="Toque no coração de um produto para salvá-lo aqui." /></Card> :
    <div className="g">{items.map((f) => <Card key={f.id} className="s3 m-half" style={{ padding: 12, gap: 12 }}>
      <div className="kit-ph" style={{ aspectRatio: '1' }}><Icon name={f.ic} size={36} />
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}><IconButton icon="heart" variant="accent" size="sm" label="Remover dos favoritos" onClick={() => { setItems((xs) => xs.filter((x) => x.id !== f.id)); toast('Removido dos favoritos'); }} /></div>
      </div>
      <div style={{ padding: '0 4px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="kit-muted">{f.s}</div>
        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.n}</div>
        <div className="kit-row" style={{ justifyContent: 'space-between' }}><Money value={f.v} size={18} /><IconButton icon="shopping-bag" size="sm" label="Adicionar à sacola" onClick={() => toast('Adicionado à sacola')} /></div>
      </div>
    </Card>)}</div>}
  </>;
}

function CustomerAccount({ toast }) {
  const [n, setN] = React.useState({ pedidos: true, ofertas: false, whatsapp: true });
  const [addr, setAddr] = React.useState('casa');
  return <>
    <PageHead title="Minha conta" sub="Dados, endereços e preferências" />
    <div className="g">
      <Card className="s7" title="Dados pessoais">
        <div className="kit-row" style={{ gap: 16 }}><Avatar name="Lucas Andrade" size={64} /><div><div style={{ fontSize: 18 }}>Lucas Andrade</div><div className="kit-muted">Cliente desde 2024</div></div></div>
        <div className="g" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
          <Input label="Nome completo" defaultValue="Lucas Andrade" />
          <Input label="CPF" defaultValue="•••.482.910-••" disabled />
          <Input label="E-mail" icon="mail" defaultValue="lucas@email.com" />
          <Input label="Celular" icon="phone" defaultValue="(11) 98765-4321" />
        </div>
        <div><Button onClick={() => toast('Dados atualizados')}>Salvar alterações</Button></div>
      </Card>
      <div className="s5" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card title="Endereços" actions={<IconButton icon="plus" label="Novo endereço" />}>
          {[['casa', 'Casa', 'Rua das Palmeiras, 120 · São Paulo, SP'], ['trab', 'Trabalho', 'Av. Paulista, 1500, cj 82 · São Paulo, SP']].map(([v, t, s]) =>
            <div key={v} style={{ padding: 14, borderRadius: 18, background: addr === v ? 'var(--surface-raised)' : 'transparent', border: '1px solid var(--border-subtle)' }}>
              <Radio name="addr" value={v} checked={addr === v} onChange={setAddr} label={<div><div style={{ fontWeight: 500 }}>{t}</div><div className="kit-muted">{s}</div></div>} />
            </div>)}
        </Card>
        <Card title="Notificações">
          <Switch label="Status dos pedidos" checked={n.pedidos} onChange={(v) => setN({ ...n, pedidos: v })} />
          <Switch label="Ofertas e cupons" checked={n.ofertas} onChange={(v) => setN({ ...n, ofertas: v })} />
          <Switch label="Avisos por WhatsApp" checked={n.whatsapp} onChange={(v) => setN({ ...n, whatsapp: v })} />
        </Card>
        <Button variant="ghost" icon="log-out">Sair da conta</Button>
      </div>
    </div>
  </>;
}
Object.assign(window, { CustomerFavorites, CustomerAccount });
})();
