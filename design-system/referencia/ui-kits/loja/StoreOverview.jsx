(() => {
const { Card, Stat, Money, Delta, BarChart, ListRow, Avatar, Badge, Progress, Insight, Segmented, Select, IconButton, Button, Pill, Icon } = window.AVLEDesignSystem_11270f;

const WEEK = [{ label: 'Dom', value: 3120 }, { label: 'Seg', value: 5480 }, { label: 'Ter', value: 4210 }, { label: 'Qua', value: 8920, highlight: true }, { label: 'Qui', value: 6130 }, { label: 'Sex', value: 7340 }, { label: 'Sáb', value: 9860 }];
const RECENT = [
  { n: 'Ana Lima', id: '#AV-2041', d: '28.09', v: 289.9, s: 'Pago' },
  { n: 'Rafael Souza', id: '#AV-2040', d: '28.09', v: 1240, s: 'Pago' },
  { n: 'Beatriz Nunes', id: '#AV-2039', d: '27.09', v: 96.5, s: 'Pendente' },
  { n: 'Carlos Mota', id: '#AV-2038', d: '27.09', v: 412.3, s: 'Pago' },
];
const TOP = [
  { n: 'Vaso de cerâmica Terra', q: 84, v: 15951.6, p: 100 },
  { n: 'Manta de linho natural', q: 52, v: 12948, p: 74 },
  { n: 'Luminária de bambu', q: 37, v: 8843, p: 52 },
];

function StoreOverview({ go, toast }) {
  const [period, setPeriod] = React.useState('Semana');
  return <>
    <PageHead title="Olá, Marina" sub="Raiz Casa & Decoração · terça, 28 de setembro">
      <Segmented options={['Hoje', 'Semana', 'Mês']} value={period} onChange={setPeriod} />
      <span className="kit-desktop-only kit-row"><IconButton icon="calendar" label="Período" /><IconButton icon="download" label="Exportar" /></span>
      <Button icon="plus" onClick={() => go('produtos')}>Novo produto</Button>
    </PageHead>

    <div className="g">
      <Card className="s4" title="Receita" expand onExpand={() => go('financeiro')} actions={<Badge tone="positive" dot>Ao vivo</Badge>}>
        <Stat value={45060.4} size={44} delta={12.4} deltaLabel="vs semana anterior" />
        <div className="kit-row">
          {[['Pix', 21480], ['Cartão', 19220], ['Boleto', 4360.4]].map(([k, v]) =>
            <div key={k} style={{ flex: 1, minWidth: 90, padding: '10px 12px', borderRadius: 16, background: 'var(--surface-raised)' }}>
              <div className="kit-muted">{k}</div><Money value={v} size={16} decimals={0} /></div>)}
        </div>
      </Card>

      <Card className="s4" title="Pedidos" expand onExpand={() => go('pedidos')}>
        <div className="kit-row" style={{ gap: 24 }}>
          <Stat value={312} money={false} size={44} delta={6} deltaLabel="novos" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
            {[['A enviar', 12, 'warning'], ['Em trânsito', 48, 'info'], ['Devoluções', 2, 'negative']].map(([k, v, t]) =>
              <div key={k} className="kit-row" style={{ justifyContent: 'space-between' }}><Badge tone={t} dot>{k}</Badge><b style={{ fontWeight: 600 }}>{v}</b></div>)}
          </div>
        </div>
        <Button variant="secondary" block iconRight="arrow-right" onClick={() => go('pedidos')}>Enviar 12 pedidos</Button>
      </Card>

      <Card className="s4" title="Meta de setembro" subtitle="R$ 150.000 · faltam 2 dias">
        <div className="kit-row" style={{ alignItems: 'baseline' }}><Money value={109580} size={32} decimals={0} /><span className="kit-muted">/ R$ 150.000</span></div>
        <Progress value={73} knob />
        <Insight title="Estoque baixo em 3 produtos" onClick={() => go('produtos')}>Reponha antes de sexta para não perder vendas</Insight>
      </Card>

      <Card className="s8" title="Vendas" actions={<><Select size="sm" options={['Receita', 'Pedidos']} /><IconButton icon="arrow-up-right" label="Abrir" /></>}>
        <div className="kit-row" style={{ alignItems: 'baseline', gap: 12 }}><Money value={45060.4} size={28} /><Delta value={12.4} label="vs semana anterior" /></div>
        <BarChart data={WEEK} height={230} format={(v) => brl(v)} />
      </Card>

      <Card className="s4" title="Pedidos recentes" expand onExpand={() => go('pedidos')}>
        <div>{RECENT.map((r) => <ListRow key={r.id} lead={<Avatar name={r.n} />} title={r.n} subtitle={r.id + ' · ' + r.d} trailing={'+' + brl(r.v)} trailingTone={r.s === 'Pago' ? 'positive' : undefined} trailingSub={r.s} onClick={() => go('pedidos')} />)}</div>
      </Card>

      <Card className="s6" title="Mais vendidos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{TOP.map((t, i) =>
          <div key={t.n} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span className="av-row__lead" style={i === 0 ? { background: 'var(--accent)', color: 'var(--text-on-accent)' } : null}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="kit-row" style={{ justifyContent: 'space-between' }}><span style={{ fontWeight: 500 }}>{t.n}</span><Money value={t.v} size={14} /></div>
              <Progress value={t.p} size="sm" plain /><span className="kit-muted">{t.q} vendidos</span>
            </div></div>)}</div>
      </Card>

      <Card className="s6" title="Atividade da loja">
        <div className="g" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
          {[['eye', 'Visitas', '8.412', 9], ['percent', 'Conversão', '3,7%', 0.4], ['star', 'Avaliação', '4,8', 0.1], ['message-circle', 'Perguntas', '5', -2]].map(([ic, k, v, d]) =>
            <div key={k} style={{ padding: 16, borderRadius: 20, background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="kit-row" style={{ justifyContent: 'space-between' }}><span className="kit-muted" style={{ fontSize: 13 }}>{k}</span><Icon name={ic} size={16} style={{ color: 'var(--text-tertiary)' }} /></div>
              <div className="kit-row" style={{ alignItems: 'baseline' }}><span className="av-money" style={{ fontSize: 26 }}>{v}</span><Delta value={d} suffix={k === 'Perguntas' || k === 'Avaliação' ? '' : '%'} /></div>
            </div>)}
        </div>
      </Card>
    </div>
  </>;
}
window.StoreOverview = StoreOverview;
})();
