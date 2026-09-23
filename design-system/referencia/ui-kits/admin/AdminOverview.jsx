(() => {
const { Card, Stat, Money, Delta, BarChart, Donut, ListRow, Avatar, Badge, Button, Insight, Segmented, IconButton, Sparkline, Progress } = window.AVLEDesignSystem_11270f;

const MONTHS = [['Abr', 1.42], ['Mai', 1.58], ['Jun', 1.51], ['Jul', 1.86], ['Ago', 2.04], ['Set', 2.31]].map(([label, v], i) => ({ label, value: v * 1e6, highlight: i === 5 }));
const PENDING = [['Verde Casa', 'Plantas · SP', '2h'], ['Ateliê Barro', 'Cerâmica · MG', '5h'], ['Fio & Trama', 'Têxtil · RS', '1d'], ['Luz Nativa', 'Iluminação · BA', '1d']];

function AdminOverview({ go, toast }) {
  const [p, setP] = React.useState('6m');
  return <>
    <PageHead title="Visão geral" sub="Marketplace AVLE · setembro 2026">
      <Segmented options={[{ value: '30d', label: '30 dias' }, { value: '6m', label: '6 meses' }, { value: '12m', label: '12 meses' }]} value={p} onChange={setP} />
      <span className="kit-desktop-only"><IconButton icon="download" label="Exportar" /></span>
    </PageHead>
    <div className="g">
      {[['GMV', 2310480, 13.2, true], ['Receita AVLE', 184838.4, 11.8, true], ['Lojas ativas', 1284, 4.1, false], ['Clientes ativos', 48210, 7.6, false]].map(([l, v, d, m]) =>
        <Card key={l} className="s3 m-half"><Stat label={l} value={v} money={m} size={28} delta={d} deltaLabel="mês" /></Card>)}

      <Card className="s8" title="GMV mensal" expand actions={<Badge tone="positive" dot>Recorde</Badge>}>
        <div className="kit-row" style={{ alignItems: 'baseline', gap: 12 }}><Money value={2310480} size={28} decimals={0} /><Delta value={13.2} label="vs agosto" /></div>
        <BarChart data={MONTHS} height={230} format={(v) => 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi'} />
      </Card>

      <Card className="s4" title="Aprovações pendentes" subtitle="Tempo médio de análise: 9h" expand onExpand={() => go('lojas')}>
        <div>{PENDING.map(([n, s, t]) => <ListRow key={n} lead={<Avatar name={n} brand />} title={n} subtitle={s} meta={t} onClick={() => go('lojas')} />)}</div>
        <Button variant="secondary" block iconRight="arrow-right" onClick={() => go('lojas')}>Analisar 4 lojas</Button>
      </Card>

      <Card className="s4" title="Categorias">
        <div className="kit-row" style={{ gap: 18, justifyContent: 'center' }}>
          <Donut size={150} thickness={18} segments={[{ value: 38, color: 'var(--chart-1)' }, { value: 27, color: 'var(--chart-2)' }, { value: 20, color: 'var(--chart-4)' }, { value: 15, hatch: true }]} center={<div><div className="av-money" style={{ fontSize: 20 }}>38%</div><div className="kit-muted">Decoração</div></div>} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>{[['var(--chart-1)', 'Decoração', '38%'], ['var(--chart-2)', 'Têxtil', '27%'], ['var(--chart-4)', 'Mesa posta', '20%'], ['var(--ink-600)', 'Outros', '15%']].map(([c, k, v]) => <div key={k} className="kit-row" style={{ gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: 9, background: c }} />{k}<b style={{ marginLeft: 'auto', fontWeight: 600 }}>{v}</b></div>)}</div>
        </div>
      </Card>

      <Card className="s4" title="Saúde da plataforma">
        {[['Pedidos entregues no prazo', 94], ['Disputas resolvidas em 48h', 81], ['Uptime de pagamentos', 99.9]].map(([k, v]) => <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><div className="kit-row" style={{ justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text-secondary)' }}>{k}</span><b style={{ fontWeight: 600 }}>{v.toLocaleString('pt-BR')}%</b></div><Progress value={v} size="sm" plain /></div>)}
      </Card>

      <Card className="s4" title="Alertas">
        <Insight title="Pico de chargebacks" onClick={() => go('disputas')}>3 lojas acima de 1,5% esta semana</Insight>
        <Insight muted icon="shield-alert" title="7 produtos denunciados" onClick={() => go('disputas')}>Aguardando moderação</Insight>
      </Card>
    </div>
  </>;
}
window.AdminOverview = AdminOverview;
})();
