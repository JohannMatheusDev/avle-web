(() => {
const { Card, Money, ListRow, Avatar, Badge, Button, Icon, IconButton, Insight, Pill } = window.AVLEDesignSystem_11270f;

const STEPS = [['check', 'Confirmado'], ['package', 'Separado'], ['truck', 'Em trânsito'], ['house', 'Entregue']];
function Steps({ at }) {
  return <div className="kit-steps">{STEPS.map(([ic, l], i) => <div key={l} className={'kit-step' + (i <= at ? ' kit-step--done' : '')}><span className="kit-step__dot"><Icon name={ic} size={14} /></span>{l}</div>)}</div>;
}
window.OrderSteps = Steps;

const FAVS = [
  { n: 'Vaso Terra', s: 'Raiz Casa', v: 189.9, ic: 'flower-2' },
  { n: 'Manta de linho', s: 'Raiz Casa', v: 249, ic: 'layers' },
  { n: 'Caneca Musgo', s: 'Ateliê Barro', v: 64.9, ic: 'coffee' },
];

function CustomerHome({ go, toast }) {
  return <>
    <PageHead title="Olá, Lucas" sub="Você tem 1 pedido a caminho">
      <span className="kit-desktop-only"><Button variant="outline" icon="headphones">Ajuda</Button></span>
    </PageHead>
    <div className="g">
      <Card className="s8" title="Pedido a caminho" subtitle="#AV-2038 · Raiz Casa & Decoração" expand onExpand={() => go('pedidos')}>
        <div className="kit-row" style={{ gap: 16, alignItems: 'stretch' }}>
          <div className="kit-ph" style={{ width: 120, aspectRatio: '1', flex: 'none' }}><Icon name="lamp" size={32} /></div>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
            <Badge tone="info" dot>Em trânsito</Badge>
            <div style={{ fontSize: 22 }}>Chega <b style={{ fontWeight: 600 }}>quinta, 30 set</b></div>
            <div className="kit-muted">Luminária de bambu + 2 itens · Correios Sedex</div>
          </div>
        </div>
        <Steps at={2} />
        <div className="kit-row"><Button variant="secondary" icon="map-pin" onClick={() => toast('Link de rastreio copiado')}>Rastrear</Button><Button variant="ghost">Falar com a loja</Button></div>
      </Card>

      <Card className="s4" title="Saldo AVLE">
        <Money value={42.5} size={40} />
        <div className="kit-muted">Cashback disponível para a próxima compra</div>
        <Insight title="Ganhe R$ 15 de volta" onClick={() => toast('Cupom ativado')}>Em compras acima de R$ 150 até domingo</Insight>
      </Card>

      <Card className="s6" title="Últimos pedidos" expand onExpand={() => go('pedidos')}>
        <div>{[['#AV-2038', 'Raiz Casa', '27.09', 412.3, 'Em trânsito', 'info'], ['#AV-1987', 'Ateliê Barro', '12.09', 129.8, 'Entregue', 'positive'], ['#AV-1920', 'Verde Casa', '30.08', 89.9, 'Entregue', 'positive']].map(([id, s, d, v, st, t]) =>
          <ListRow key={id} lead={<Avatar name={s} brand />} title={s} subtitle={id + ' · ' + d} trailing={brl(v)} trailingSub={<Badge tone={t}>{st}</Badge>} onClick={() => go('pedidos')} />)}</div>
      </Card>

      <Card className="s6" title="Favoritos" expand onExpand={() => go('favoritos')}>
        <div className="g" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>{FAVS.map((f) =>
          <div key={f.n} style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }} onClick={() => go('favoritos')}>
            <div className="kit-ph" style={{ aspectRatio: '1' }}><Icon name={f.ic} size={28} /></div>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.n}</div>
            <Money value={f.v} size={14} />
          </div>)}</div>
      </Card>

      <Card className="s12" title="Continue explorando">
        <div className="kit-row">{['Decoração', 'Mesa posta', 'Iluminação', 'Têxtil', 'Plantas', 'Presentes'].map((c, i) => <Pill key={c} active={i === 0}>{c}</Pill>)}</div>
      </Card>
    </div>
  </>;
}
window.CustomerHome = CustomerHome;
})();
