'use client';

import { useState, type ReactNode } from 'react';
import {
  AppShell, Avatar, Badge, BarChart, BottomNav, Button, Card, Checkbox, Delta, Dialog, Donut, EmptyState, Icon,
  IconButton, Input, Insight, ListRow, Logo, Money, PageHead, Pill, Progress, Radio, Segmented, Select, SideNav,
  SideShell, Sparkline, Stat, Steps, Switch, Table, Tabs, Tag, Toast, ToastStack, Tooltip, TopNav,
} from '@/design-system';

/**
 * A biblioteca inteira, com cada estado de cada peça.
 *
 * Os exemplos falam a língua da AVLE — grupos, cotas, parcelas —, e não a dos
 * pedidos e entregas das telas de referência: o componente é o mesmo, mas é
 * com o conteúdo de verdade que se vê se ele serve.
 */

const SECOES = [
  { value: 'inicio', label: 'Início', icon: 'house' },
  { value: 'clientes', label: 'Clientes', icon: 'users', badge: true },
  { value: 'grupos', label: 'Grupos', icon: 'layout-grid' },
  { value: 'financeiro', label: 'Financeiro', icon: 'wallet' },
];

const MESES = [
  { label: 'Abr', value: 18200 }, { label: 'Mai', value: 21400 }, { label: 'Jun', value: 19800 },
  { label: 'Jul', value: 24600 }, { label: 'Ago', value: 27300, highlight: true }, { label: 'Set', value: 25900 },
];

const CLIENTES = [
  { id: 1, nome: 'Maria Oliveira', cota: '14', grupo: 'Casa Nova', situacao: 'Em dia', valor: 909.3 },
  { id: 2, nome: 'Joana Ribeiro', cota: '03', grupo: 'Casa Nova', situacao: 'Contemplada', valor: 1039.2 },
  { id: 3, nome: 'Cláudia Nunes', cota: '21', grupo: 'Sala Completa', situacao: 'Em atraso', valor: 259.8 },
];

const TOM_DA_SITUACAO: Record<string, 'positive' | 'negative' | 'info'> = { 'Em dia': 'positive', Contemplada: 'info', 'Em atraso': 'negative' };

const CORES = ['bg-app', 'surface-card', 'surface-raised', 'surface-hover', 'border-default', 'text-primary', 'text-secondary', 'text-tertiary', 'primary', 'primary-hover', 'accent', 'accent-hover', 'positive', 'negative', 'warning', 'info', 'surface-brand'];

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <section className="vitrine__secao"><h3>{titulo}</h3>{children}</section>;
}

function Linha({ rotulo, alta, children }: { rotulo: string; alta?: boolean; children: ReactNode }) {
  return (
    <div className={'vitrine__linha' + (alta ? ' vitrine__linha--alta' : '')}>
      <span className="vitrine__rotulo">{rotulo}</span>
      <div className="vitrine__pecas">{children}</div>
    </div>
  );
}

/** Envolve a peça na classe que liga o estado forçado (ver EstadosForcados). */
function Forcado({ estado, className, children }: { estado: 'ds-hover' | 'ds-foco' | 'ds-clique'; className?: string; children: ReactNode }) {
  return <span className={estado + (className ? ' ' + className : '')}>{children}</span>;
}

export default function Catalogo() {
  const [secao, setSecao] = useState('inicio');
  const [aba, setAba] = useState('todas');
  const [periodo, setPeriodo] = useState('mes');
  const [lembrar, setLembrar] = useState(true);
  const [forma, setForma] = useState('pix');
  const [aberta, setAberta] = useState(true);
  const [dialogo, setDialogo] = useState(true);

  return (
    <div className="vitrine__catalogo">

      <Secao titulo="Cores">
        <div className="vitrine__pecas">
          {CORES.map((cor) => (
            <div key={cor} className="vitrine__cor"><span style={{ background: `var(--${cor})` }} />{`--${cor}`}</div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Button">
        <Linha rotulo="Variantes">
          <Button icon="plus">Novo grupo</Button>
          <Button variant="secondary">Receber</Button>
          <Button variant="outline" iconRight="arrow-up-right">Relatório</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="danger">Excluir cota</Button>
          <Button variant="inverse">Inverso</Button>
        </Linha>
        <Linha rotulo="Tamanhos"><Button size="sm">Pequeno</Button><Button>Médio</Button><Button size="lg">Grande</Button></Linha>
        <Linha rotulo="Hover">
          <Forcado estado="ds-hover"><Button>Novo grupo</Button></Forcado>
          <Forcado estado="ds-hover"><Button variant="secondary">Receber</Button></Forcado>
          <Forcado estado="ds-hover"><Button variant="outline">Relatório</Button></Forcado>
          <Forcado estado="ds-hover"><Button variant="ghost">Cancelar</Button></Forcado>
          <Forcado estado="ds-hover"><Button variant="danger">Excluir cota</Button></Forcado>
        </Linha>
        <Linha rotulo="Foco"><Forcado estado="ds-foco"><Button>Novo grupo</Button></Forcado><Forcado estado="ds-foco"><Button variant="outline">Relatório</Button></Forcado></Linha>
        <Linha rotulo="Pressionado"><Forcado estado="ds-clique"><Button>Novo grupo</Button></Forcado></Linha>
        <Linha rotulo="Desativado"><Button disabled>Novo grupo</Button><Button variant="secondary" disabled>Receber</Button><Button variant="outline" disabled>Relatório</Button></Linha>
        <Linha rotulo="Largura total"><div style={{ width: '100%' }}><Button block>Pagar parcela</Button></div></Linha>
        <Linha rotulo="Carregando"><span className="vitrine__nota">O design system não tem estado de carregamento. O export não trazia um, e ele não foi inventado.</span></Linha>
      </Secao>

      <Secao titulo="IconButton">
        <Linha rotulo="Variantes">
          <IconButton icon="arrow-up-right" label="Abrir" />
          <IconButton icon="bell" variant="filled" dot label="Avisos" />
          <IconButton icon="plus" variant="accent" label="Adicionar" />
          <IconButton icon="ellipsis" size="sm" label="Mais" />
          <IconButton icon="search" size="lg" label="Buscar" />
        </Linha>
        <Linha rotulo="Hover / foco / pressionado">
          <Forcado estado="ds-hover"><IconButton icon="arrow-up-right" label="Abrir" /></Forcado>
          <Forcado estado="ds-foco"><IconButton icon="arrow-up-right" label="Abrir" /></Forcado>
          <Forcado estado="ds-clique"><IconButton icon="plus" variant="accent" label="Adicionar" /></Forcado>
        </Linha>
        <Linha rotulo="Desativado"><IconButton icon="download" label="Exportar" disabled /></Linha>
      </Secao>

      <Secao titulo="Pill · Badge · Avatar · Icon">
        <Linha rotulo="Pill"><Pill dot>Visão geral</Pill><Pill active>Selecionada</Pill><Pill>Normal</Pill><Pill accent>Hoje</Pill><Pill size="sm" icon="sparkles">Sugestão</Pill><Forcado estado="ds-hover"><Pill>Hover</Pill></Forcado></Linha>
        <Linha rotulo="Badge"><Badge tone="positive" dot>Em dia</Badge><Badge tone="warning" dot>Pendente</Badge><Badge tone="negative">Em atraso</Badge><Badge tone="info">Contemplada</Badge><Badge>Rascunho</Badge><Badge tone="solid">Nova</Badge></Linha>
        <Linha rotulo="Avatar"><Avatar name="Maria Oliveira" /><Avatar name="Caza Liz" brand /><Avatar name="Joana Ribeiro" size={32} /><Avatar name="Rita Bueno" size={56} /></Linha>
        <Linha rotulo="Icon"><Icon name="house" size={22} /><Icon name="users" size={22} /><Icon name="wallet" size={22} /><Icon name="calendar" size={22} /><Icon name="bell" size={22} label="Avisos" /></Linha>
      </Secao>

      <Secao titulo="Formulário">
        <div className="g">
          <div className="s4"><Input label="Nome da cliente" placeholder="Maria Oliveira" icon="user" /></div>
          <div className="s4"><Forcado estado="ds-foco"><Input label="Com foco" placeholder="Digite o CPF" icon="id-card" /></Forcado></div>
          <div className="s4"><Forcado estado="ds-hover"><Input label="Com hover" placeholder="E-mail" icon="mail" /></Forcado></div>
          <div className="s4"><Input label="CPF" defaultValue="123.456.789-00" error="CPF inválido. Confira os números." icon="id-card" /></div>
          <div className="s4"><Input label="Telefone" placeholder="(42) 99999-0000" hint="Com DDD, só números." /></div>
          <div className="s4"><Input label="Desativado" placeholder="Não editável" disabled /></div>
          <div className="s6"><Input label="Observação" placeholder="Algo que a loja precise saber" multiline /></div>
          <div className="s3"><Select label="Grupo" options={['Casa Nova', 'Sala Completa']} /></div>
          <div className="s3"><Select label="Pequeno" size="sm" options={['Semanal', 'Mensal']} /></div>
        </div>
        <Linha rotulo="Checkbox"><Checkbox label="Lembrar de mim" checked={lembrar} onChange={setLembrar} /><Checkbox label="Desmarcado" checked={false} /><Checkbox label="Desativado" checked disabled /><Forcado estado="ds-foco"><Checkbox label="Com foco" checked={false} /></Forcado></Linha>
        <Linha rotulo="Radio">
          <Radio name="forma" value="pix" label="Pix" checked={forma === 'pix'} onChange={setForma} />
          <Radio name="forma" value="boleto" label="Boleto" checked={forma === 'boleto'} onChange={setForma} />
          <Radio name="forma-off" value="cartao" label="Cartão (desativado)" disabled />
        </Linha>
        <Linha rotulo="Switch"><Switch label="Loja aberta" checked={aberta} onChange={setAberta} /><Switch label="Desligado" checked={false} /><Switch label="Desativado" checked disabled /></Linha>
        <Linha rotulo="Segmented">
          <Segmented options={[{ value: 'dia', label: 'Dia' }, { value: 'semana', label: 'Semana' }, { value: 'mes', label: 'Mês' }]} value={periodo} onChange={setPeriodo} />
          <Segmented size="sm" options={[{ value: 'lista', label: 'Lista', icon: 'list' }, { value: 'grade', label: 'Grade', icon: 'layout-grid' }]} value="lista" />
        </Linha>
      </Secao>

      <Secao titulo="Card · Money · Stat · Progress · Insight">
        <div className="g">
          <Card className="s4" title="Arrecadado no mês" expand actions={<Badge tone="positive" dot>Ao vivo</Badge>}>
            <Money value={45060.4} size={40} />
            <Delta value={12.4} label="vs agosto" />
          </Card>
          <Card className="s4" title="Meta de setembro" subtitle="R$ 150.000 · faltam 7 dias">
            <Stat label="Recebido" value={109580} />
            <Progress value={73} knob />
            <Progress value={40} size="sm" plain />
          </Card>
          <Card className="s4" title="Card elevado" variant="raised">
            <Stat label="Cotas ativas" value={312} money={false} delta={-2.1} deltaLabel="vs agosto" />
          </Card>
          <Card className="s4" variant="accent" title="Card de destaque"><Money value={2310.5} size={28} /><div><Logo tone="cream" height={20} /></div></Card>
          <Card className="s4" interactive title="Card clicável" subtitle="Passe o mouse" />
          <Forcado estado="ds-hover" className="s4 vitrine__celula"><Card interactive title="Card clicável com hover" subtitle="Estado forçado" /></Forcado>
        </div>
        <Insight title="3 parcelas vencem amanhã" onClick={() => undefined}>Mande o lembrete hoje para não virar atraso</Insight>
        <Insight title="Faixa neutra" muted>Para um aviso que não é o principal da tela</Insight>
      </Secao>

      <Secao titulo="ListRow · Table · EmptyState">
        <div className="g">
          <Card className="s6" title="Pagamentos recentes">
            <ListRow lead={<Avatar name="Maria Oliveira" />} title="Maria Oliveira" subtitle="Cota 14 · Casa Nova" meta="23.09.26" trailing="+R$ 909,30" trailingSub="Pix" trailingTone="positive" />
            <ListRow icon="receipt" title="Estorno" subtitle="Cota 21 · Sala Completa" meta="22.09.26" trailing="−R$ 259,80" trailingTone="negative" />
            <ListRow icon="wallet" title="Linha clicável" subtitle="Abre o extrato" trailing="R$ 1.039,20" onClick={() => undefined} />
          </Card>
          <Card className="s6" title="Vazio">
            <EmptyState icon="inbox" title="Nenhum aviso" body="Quando houver novidade de pagamento, ela aparece aqui." action={<Button size="sm" variant="secondary">Atualizar</Button>} />
          </Card>
          <Card className="s12" title="Clientes do grupo">
            <Table
              columns={[
                { key: 'nome', label: 'Cliente', render: (c) => <div className="kit-row"><Avatar name={c.nome} size={32} />{c.nome}</div> },
                { key: 'cota', label: 'Cota' },
                { key: 'grupo', label: 'Grupo', hideOnMobile: true },
                { key: 'situacao', label: 'Situação', render: (c) => <Badge tone={TOM_DA_SITUACAO[c.situacao]} dot>{c.situacao}</Badge> },
                { key: 'valor', label: 'Pago', align: 'right', render: (c) => <Money value={c.valor} size={14} /> },
              ]}
              rows={CLIENTES}
              onRowClick={() => undefined}
            />
          </Card>
        </div>
      </Secao>

      <Secao titulo="Gráficos">
        <div className="g">
          <Card className="s6" title="Arrecadação por mês"><BarChart data={MESES} format={(v) => 'R$ ' + v.toLocaleString('pt-BR')} /></Card>
          <Card className="s3" title="Por grupo">
            <Donut size={160} segments={[{ value: 60, color: 'var(--chart-1)' }, { value: 25, color: 'var(--chart-2)' }, { value: 15, hatch: true }]} center={<Money value={5080} size={20} decimals={0} />} />
          </Card>
          <Card className="s3" title="Tendência"><Sparkline data={[4, 6, 5, 9, 7, 12]} height={90} /></Card>
        </div>
      </Secao>

      <Secao titulo="Navegação">
        <Linha rotulo="Tabs"><Tabs items={[{ value: 'todas', label: 'Todas', count: 128 }, { value: 'atraso', label: 'Em atraso', count: 6 }, { value: 'quitadas', label: 'Quitadas' }]} value={aba} onChange={setAba} /></Linha>
        <Linha rotulo="Tabs com hover"><Forcado estado="ds-hover"><Tabs items={['Hover']} value="" /></Forcado></Linha>
        <Linha rotulo="Logo"><Logo /><Logo variant="tree" height={40} /><Logo variant="full" height={72} /></Linha>
        <Linha rotulo="BottomNav"><BottomNav static items={SECOES} value={secao} onChange={setSecao} /></Linha>
        <div className="vitrine__moldura"><TopNav role="Loja" items={SECOES} value={secao} onChange={setSecao} end={<><IconButton icon="bell" dot label="Avisos" /><Avatar name="Marina Costa" /></>} /></div>
        <div className="vitrine__moldura">
          <SideNav value={secao} onChange={setSecao} groups={[{ label: 'Operação', items: [{ value: 'inicio', label: 'Início', icon: 'house' }, { value: 'clientes', label: 'Clientes', icon: 'users', count: 54 }] }, { label: 'Dinheiro', items: [{ value: 'financeiro', label: 'Financeiro', icon: 'wallet' }] }]} />
        </div>
      </Secao>

      <Secao titulo="Retorno">
        <Linha rotulo="Toast"><Toast>Pagamento registrado</Toast><Toast action="Desfazer">Cota cancelada</Toast><Toast tone="negative">Não foi possível enviar</Toast></Linha>
        <Linha rotulo="Tooltip" alta><Tooltip content="Exportar CSV"><IconButton icon="download" label="Exportar" /></Tooltip><Forcado estado="ds-hover"><Tooltip content="Sempre visível aqui"><IconButton icon="info" label="Info" /></Tooltip></Forcado></Linha>
        <Linha rotulo="Tag"><Tag>R$ 16.021</Tag><Tag accent>R$ 27.300</Tag></Linha>
        <div className="vitrine__moldura vitrine__moldura--dialogo">
          <div className="kit-main"><Button variant="outline" onClick={() => setDialogo(true)}>Abrir diálogo</Button></div>
          <Dialog open={dialogo} title="Excluir a cota 21?" description="A cliente deixa o grupo e as parcelas futuras são canceladas." onClose={() => setDialogo(false)}
            footer={<><Button variant="ghost" onClick={() => setDialogo(false)}>Cancelar</Button><Button variant="danger">Excluir</Button></>} />
          <ToastStack><Toast>Aviso dentro da moldura</Toast></ToastStack>
        </div>
      </Secao>

      <Secao titulo="Templates">
        <PageHead title="Olá, Marina" sub="Caza Liz · 3 parcelas vencem esta semana"><Button icon="plus">Novo grupo</Button></PageHead>
        <Card title="Andamento da cota">
          <Steps current={1} steps={[{ icon: 'user-plus', label: 'Entrou' }, { icon: 'receipt', label: 'Pagando' }, { icon: 'gift', label: 'Contemplada' }, { icon: 'check', label: 'Quitada' }]} />
        </Card>
        <span className="vitrine__nota">Placeholder de imagem (<code>kit-ph</code>) e a grade de 12 colunas (<code>.g</code> + <code>.s3</code>…<code>.s12</code>):</span>
        <div className="g"><div className="s3"><div className="kit-ph"><Icon name="image" size={28} /></div></div></div>
        <div className="g">
          {[3, 3, 6, 4, 8, 12].map((span, i) => <div key={i} className={`s${span} vitrine__coluna`}>{`.s${span}`}</div>)}
        </div>
        <span className="vitrine__nota">AppShell e SideShell abaixo, cada um numa moldura. A barra do celular aparece abaixo de 1100px.</span>
        <div className="vitrine__moldura vitrine__moldura--casca">
          <AppShell role="Loja" nav={SECOES} page={secao} setPage={setSecao} user="Marina Costa">
            <PageHead title="Início" sub="Conteúdo da página" />
          </AppShell>
        </div>
        <div className="vitrine__moldura vitrine__moldura--casca">
          <SideShell groups={[{ label: 'Plataforma', items: [{ value: 'inicio', label: 'Visão geral', icon: 'layout-dashboard' }, { value: 'clientes', label: 'Lojas', icon: 'store', count: 4 }] }]} flat={SECOES}
            page={secao} setPage={setSecao} user="Johann">
            <PageHead title="Visão geral" sub="Admin" />
          </SideShell>
        </div>
      </Secao>
    </div>
  );
}
