(() => {
const { Card, Table, Tabs, Input, Badge, Avatar, Money, Button, Pill, IconButton, ListRow, Insight } = window.AVLEDesignSystem_11270f;

const USERS = [
  { n: 'Lucas Andrade', e: 'lucas@email.com', t: 'Cliente', o: 14, v: 2140.8, d: '12.03.24', s: 'Ativo' },
  { n: 'Marina Costa', e: 'marina@raizcasa.com', t: 'Lojista', o: 0, v: 0, d: '02.01.24', s: 'Ativo' },
  { n: 'Beatriz Nunes', e: 'bia.nunes@email.com', t: 'Cliente', o: 3, v: 318.4, d: '19.07.26', s: 'Ativo' },
  { n: 'Sérgio Lima', e: 'sergio@bazarnorte.com', t: 'Lojista', o: 0, v: 0, d: '11.05.25', s: 'Bloqueado' },
  { n: 'Carla Menezes', e: 'carla.m@email.com', t: 'Cliente', o: 27, v: 5820, d: '08.11.23', s: 'Ativo' },
];

function AdminUsers() {
  const [tab, setTab] = React.useState('all');
  const list = USERS.filter((u) => tab === 'all' || u.t === tab);
  return <>
    <PageHead title="Usuários" sub="49.494 contas · 1.284 lojistas" />
    <Card>
      <div className="kit-row" style={{ justifyContent: 'space-between' }}>
        <Tabs value={tab} onChange={setTab} items={[{ value: 'all', label: 'Todos' }, { value: 'Cliente', label: 'Clientes' }, { value: 'Lojista', label: 'Lojistas' }]} />
        <div style={{ flex: '1 1 240px', maxWidth: 340 }}><Input size="sm" icon="search" placeholder="Nome, e-mail ou CPF" /></div>
      </div>
      <Table rows={list} columns={[
        { key: 'n', label: 'Usuário', render: (u) => <div className="kit-row"><Avatar name={u.n} size={34} /><div><div style={{ fontWeight: 600 }}>{u.n}</div><div className="kit-muted">{u.e}</div></div></div> },
        { key: 't', label: 'Tipo', hideOnMobile: true, render: (u) => <Badge tone={u.t === 'Lojista' ? 'info' : 'neutral'}>{u.t}</Badge> },
        { key: 'o', label: 'Pedidos', hideOnMobile: true },
        { key: 'v', label: 'Gasto total', hideOnMobile: true, align: 'right', render: (u) => u.v ? <Money value={u.v} size={14} /> : <span className="kit-muted">—</span> },
        { key: 'd', label: 'Desde', hideOnMobile: true, render: (u) => <span style={{ color: 'var(--text-secondary)' }}>{u.d}</span> },
        { key: 's', label: 'Status', align: 'right', render: (u) => <Badge tone={u.s === 'Ativo' ? 'positive' : 'negative'} dot>{u.s}</Badge> },
      ]} />
    </Card>
  </>;
}

const CASES = [
  { id: 'D-318', t: 'Produto não recebido', who: 'Beatriz Nunes → Bazar Norte', v: 96.5, age: '2d', pr: 'negative' },
  { id: 'D-317', t: 'Item diferente do anunciado', who: 'Carla Menezes → Casa Oliva', v: 129.9, age: '1d', pr: 'warning' },
  { id: 'D-315', t: 'Produto denunciado: réplica', who: 'Denúncia anônima → Bazar Norte', v: 0, age: '5h', pr: 'warning' },
];

function AdminDisputes({ toast }) {
  const [items, setItems] = React.useState(CASES);
  const resolve = (id, how) => { setItems((xs) => xs.filter((x) => x.id !== id)); toast(id + ' · ' + how); };
  return <>
    <PageHead title="Disputas & moderação" sub={items.length + ' casos abertos'} />
    <div className="g">
      <div className="s8" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.length === 0 && <Card><div className="av-empty"><div className="av-empty__title">Tudo resolvido</div>Nenhum caso aberto no momento.</div></Card>}
        {items.map((c) => <Card key={c.id} style={{ padding: 18 }}>
          <div className="kit-row" style={{ justifyContent: 'space-between' }}>
            <div className="kit-row" style={{ gap: 8 }}><Badge tone={c.pr} dot>{c.id}</Badge><span style={{ fontWeight: 600 }}>{c.t}</span></div>
            <span className="kit-muted">aberto há {c.age}</span>
          </div>
          <div className="kit-row" style={{ justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{c.who}</span>{c.v > 0 && <Money value={c.v} size={16} />}
          </div>
          <div className="kit-row"><Button size="sm" onClick={() => resolve(c.id, 'reembolso aprovado')}>Reembolsar cliente</Button><Button size="sm" variant="secondary" onClick={() => resolve(c.id, 'a favor da loja')}>A favor da loja</Button><Button size="sm" variant="ghost">Ver conversa</Button></div>
        </Card>)}
      </div>
      <div className="s4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card title="Esta semana">
          <ListRow icon="scale" title="Casos resolvidos" trailing="42" />
          <ListRow icon="timer" title="Tempo médio" trailing="31h" />
          <ListRow icon="rotate-ccw" title="Reembolsos" trailing={brl(4820.3)} trailingTone="negative" />
        </Card>
        <Insight title="Bazar Norte em 2 casos" onClick={() => toast('Loja enviada para revisão')}>Considere revisar a loja</Insight>
      </div>
    </div>
  </>;
}
Object.assign(window, { AdminUsers, AdminDisputes });
})();
