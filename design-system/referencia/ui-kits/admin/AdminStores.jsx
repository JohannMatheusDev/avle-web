(() => {
const { Card, Table, Tabs, Input, Badge, Avatar, Money, Button, Dialog, IconButton, Checkbox, Select, ListRow } = window.AVLEDesignSystem_11270f;

const TONE = { Ativa: 'positive', Pendente: 'warning', Suspensa: 'negative' };
const STORES = [
  { id: 1, n: 'Verde Casa', o: 'Paula Martins', c: 'Plantas', city: 'São Paulo, SP', gmv: 0, s: 'Pendente', r: '—' },
  { id: 2, n: 'Ateliê Barro', o: 'Tiago Rocha', c: 'Cerâmica', city: 'Belo Horizonte, MG', gmv: 0, s: 'Pendente', r: '—' },
  { id: 3, n: 'Raiz Casa & Decoração', o: 'Marina Costa', c: 'Decoração', city: 'São Paulo, SP', gmv: 184320, s: 'Ativa', r: '4,8' },
  { id: 4, n: 'Fio & Trama', o: 'Renata Dias', c: 'Têxtil', city: 'Porto Alegre, RS', gmv: 0, s: 'Pendente', r: '—' },
  { id: 5, n: 'Casa Oliva', o: 'André Lopes', c: 'Mesa posta', city: 'Curitiba, PR', gmv: 96410.5, s: 'Ativa', r: '4,6' },
  { id: 6, n: 'Bazar Norte', o: 'Sérgio Lima', c: 'Variedades', city: 'Recife, PE', gmv: 12480, s: 'Suspensa', r: '3,1' },
];

function AdminStores({ toast }) {
  const [rows, setRows] = React.useState(STORES);
  const [tab, setTab] = React.useState('Pendente');
  const [open, setOpen] = React.useState(null);
  const [refuse, setRefuse] = React.useState(false);
  const c = (s) => rows.filter((r) => r.s === s).length;
  const list = rows.filter((r) => tab === 'all' || r.s === tab);
  const setStatus = (id, s, msg) => { setRows((rs) => rs.map((r) => r.id === id ? { ...r, s } : r)); setOpen(null); setRefuse(false); toast(msg, s === 'Suspensa' ? 'negative' : 'positive'); };

  return <>
    <PageHead title="Lojas" sub={rows.length + ' lojas cadastradas'}><span className="kit-desktop-only"><Button variant="outline" icon="download">Exportar</Button></span></PageHead>
    <Card>
      <div className="kit-row" style={{ justifyContent: 'space-between' }}>
        <Tabs value={tab} onChange={setTab} items={[{ value: 'Pendente', label: 'Pendentes', count: c('Pendente') }, { value: 'Ativa', label: 'Ativas', count: c('Ativa') }, { value: 'Suspensa', label: 'Suspensas', count: c('Suspensa') }, { value: 'all', label: 'Todas' }]} />
        <div style={{ flex: '1 1 240px', maxWidth: 340 }}><Input size="sm" icon="search" placeholder="Buscar loja, CNPJ ou responsável" /></div>
      </div>
      <Table onRowClick={setOpen} rows={list} columns={[
        { key: 'n', label: 'Loja', render: (r) => <div className="kit-row"><Avatar name={r.n} brand size={34} /><div><div style={{ fontWeight: 600 }}>{r.n}</div><div className="kit-muted">{r.o}</div></div></div> },
        { key: 'c', label: 'Categoria', hideOnMobile: true },
        { key: 'city', label: 'Cidade', hideOnMobile: true, render: (r) => <span style={{ color: 'var(--text-secondary)' }}>{r.city}</span> },
        { key: 'r', label: 'Nota', hideOnMobile: true },
        { key: 'gmv', label: 'GMV 30d', align: 'right', hideOnMobile: true, render: (r) => r.gmv ? <Money value={r.gmv} size={14} /> : <span className="kit-muted">—</span> },
        { key: 's', label: 'Status', align: 'right', render: (r) => <Badge tone={TONE[r.s]} dot>{r.s}</Badge> },
      ]} />
    </Card>

    <Dialog open={!!open && !refuse} onClose={() => setOpen(null)} title={open && open.n} description={open && open.c + ' · ' + open.city}
      footer={open && (open.s === 'Pendente' ? <><Button variant="danger" onClick={() => setRefuse(true)}>Recusar</Button><Button icon="check" onClick={() => setStatus(open.id, 'Ativa', open.n + ' aprovada')}>Aprovar loja</Button></> :
        open.s === 'Ativa' ? <Button variant="danger" onClick={() => setStatus(open.id, 'Suspensa', open.n + ' suspensa')}>Suspender</Button> : <Button onClick={() => setStatus(open.id, 'Ativa', open.n + ' reativada')}>Reativar</Button>)}>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <ListRow icon="user" title="Responsável" trailing={open.o} />
        <ListRow icon="file-text" title="CNPJ" trailing="12.345.678/0001-90" />
        <ListRow icon="landmark" title="Conta bancária" trailing={<Badge tone="positive">Verificada</Badge>} />
        <ListRow icon="id-card" title="Documentos" trailing={<Badge tone={open.s === 'Pendente' ? 'warning' : 'positive'}>{open.s === 'Pendente' ? '2 de 3' : 'Completos'}</Badge>} />
      </div>}
    </Dialog>

    <Dialog open={refuse} onClose={() => setRefuse(false)} title="Recusar cadastro?" description="O lojista receberá o motivo por e-mail e poderá reenviar."
      footer={<><Button variant="ghost" onClick={() => setRefuse(false)}>Cancelar</Button><Button variant="danger" onClick={() => setStatus(open.id, 'Suspensa', 'Cadastro recusado')}>Recusar</Button></>}>
      <Select label="Motivo" options={['Documentos ilegíveis', 'CNPJ inativo', 'Categoria não permitida', 'Outro']} />
      <Input label="Mensagem ao lojista" multiline placeholder="Opcional" />
    </Dialog>
  </>;
}
window.AdminStores = AdminStores;
})();
