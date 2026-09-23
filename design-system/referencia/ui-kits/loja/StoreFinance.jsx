(() => {
const { Card, Stat, Money, Delta, Sparkline, ListRow, Badge, Button, Donut, Segmented } = window.AVLEDesignSystem_11270f;

const PAYOUTS = [
  { d: '27.09.26', v: 12480.3, s: 'Pago', m: 'Pix · Itaú ••42' },
  { d: '20.09.26', v: 9832.1, s: 'Pago', m: 'Pix · Itaú ••42' },
  { d: '13.09.26', v: 11204.75, s: 'Pago', m: 'Pix · Itaú ••42' },
  { d: '04.10.26', v: 14210, s: 'Agendado', m: 'Previsto' },
];

function StoreFinance({ toast }) {
  const [range, setRange] = React.useState('30d');
  return <>
    <PageHead title="Financeiro" sub="Repasses semanais toda sexta-feira">
      <Segmented options={[{ value: '7d', label: '7 dias' }, { value: '30d', label: '30 dias' }, { value: '90d', label: '90 dias' }]} value={range} onChange={setRange} />
    </PageHead>
    <div className="g">
      <Card className="s5" variant="accent">
        <div className="kit-row" style={{ justifyContent: 'space-between' }}><span style={{ fontSize: 14, fontWeight: 500 }}>Saldo disponível</span><Badge tone="neutral">Atualizado agora</Badge></div>
        <span className="av-money" style={{ fontSize: 48 }}><span style={{ fontSize: '.5em', opacity: .6, marginRight: 6, fontWeight: 400 }}>R$</span>8.940<span style={{ opacity: .55, fontWeight: 400 }}>,20</span></span>
        <div className="kit-row"><Button variant="inverse" icon="arrow-down-to-line" onClick={() => toast('Saque de R$ 8.940,20 solicitado')}>Sacar agora</Button><Button variant="ghost" style={{ color: 'inherit' }}>Dados bancários</Button></div>
      </Card>
      <Card className="s3 m-half" title="A receber"><Stat value={14210} size={30} foot="próximo repasse 04.10" /></Card>
      <Card className="s4" title="Taxas do período" subtitle="Comissão AVLE 8% + meios de pagamento">
        <div className="kit-row" style={{ gap: 18 }}>
          <Donut size={110} thickness={14} segments={[{ value: 8, color: 'var(--chart-1)' }, { value: 3.2, color: 'var(--chart-2)' }, { value: 1, hatch: true }]} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            {[['var(--chart-1)', 'Comissão', 'R$ 3.604'], ['var(--chart-2)', 'Pagamentos', 'R$ 1.442'], ['var(--ink-600)', 'Frete', 'R$ 450']].map(([c, k, v]) => <div key={k} className="kit-row" style={{ gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: 9, background: c }} />{k}<b style={{ fontWeight: 600, marginLeft: 'auto' }}>{v}</b></div>)}
          </div>
        </div>
      </Card>
      <Card className="s7" title="Receita líquida" expand>
        <div className="kit-row" style={{ alignItems: 'baseline', gap: 12 }}><Money value={39564.1} size={28} /><Delta value={9.1} label="vs período anterior" /></div>
        <Sparkline data={[18, 22, 19, 26, 24, 31, 28, 34, 30, 38, 36, 42]} height={180} />
      </Card>
      <Card className="s5" title="Repasses" expand>
        <div>{PAYOUTS.map((p) => <ListRow key={p.d} icon={p.s === 'Pago' ? 'check' : 'clock'} title={p.d} subtitle={p.m} trailing={brl(p.v)} trailingSub={p.s} trailingTone={p.s === 'Pago' ? 'positive' : undefined} />)}</div>
      </Card>
    </div>
  </>;
}
window.StoreFinance = StoreFinance;
})();
