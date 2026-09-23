# Componentes

Catálogo dos 34 componentes e dos templates de composição exportados por
[`design-system/index.ts`](../index.ts). Todos aparecem renderizados, com os
estados, na rota `/design-system`.

Os exemplos vieram dos arquivos `*.prompt.md` do export do Claude Design,
ajustados para o TypeScript daqui. As props completas, com a documentação de
cada uma, estão no tipo `XxxProps` de cada arquivo.

Tudo é importado do mesmo lugar:

```tsx
import { Button, Card, Money } from '@/design-system';
```

**Cliente ou servidor.** Os componentes que criam `onClick` ou `onChange` por
conta própria são de cliente (`'use client'`): BarChart, Dialog, Tabs,
Segmented, TopNav, BottomNav, SideNav, Checkbox, Radio e Switch, além dos
templates AppShell e SideShell e do hook `useToast`. Eles podem ser
desenhados a partir de uma página de servidor, mas as funções (`onChange`)
só podem vir de um componente de cliente. O resto funciona dos dois lados.

## Base (`components/core`)

**Icon**: ícone Lucide de traço fino, na cor do texto (`currentColor`). Use em
todo glifo da interface. Os nomes são os do Lucide em kebab-case, na versão
`lucide-static@0.460.0`.

```tsx
<Icon name="shopping-bag" size={20} />
```

**Button**: botão em pílula. O `primary`, em verde-tinta, é a única ação
principal da tela; o resto vai de `secondary` ou `outline`. Variantes: `primary`,
`secondary`, `outline`, `ghost`, `danger`, `inverse`. Tamanhos: `sm`, `md` e
`lg`. Use `block` para largura total no celular. Aceita todos os atributos de
`<button>`.

```tsx
<Button icon="plus">Novo grupo</Button>
<Button variant="secondary" iconRight="arrow-up-right">Ver relatório</Button>
```

**IconButton**: botão redondo só com ícone: o ↗ no canto dos cartões, busca,
filtro, calendário, notificações. O `label` é obrigatório.

```tsx
<IconButton icon="arrow-up-right" label="Expandir" />
<IconButton icon="bell" variant="filled" dot label="Notificações" />
```

**Pill**: chip de contorno fino, para filtros, sugestões rápidas e rótulos
de seção.

```tsx
<Pill active>Receita</Pill>
<Pill dot>Visão geral</Pill>
```

**Badge**: cápsula pequena de situação (pagamento, aprovação).

```tsx
<Badge tone="positive" dot>Em dia</Badge>
<Badge tone="warning">Pendente</Badge>
```

**Avatar**: foto redonda de pessoa ou loja; sem foto, mostra as iniciais.
`brand` usa o verde da marca, para loja sem foto.

```tsx
<Avatar name="Marina Costa" size={40} />
```

## Formulário (`components/forms`)

**Input**: campo em pílula com rótulo, ícone, dica e erro. `multiline` vira
`<textarea>`.

```tsx
<Input label="E-mail" placeholder="voce@loja.com" icon="mail" />
<Input icon="search" placeholder="Buscar clientes" size="sm" />
```

**Select**: `<select>` nativo dentro da mesma pílula do Input.

```tsx
<Select size="sm" options={['Semanal', 'Mensal', 'Anual']} />
```

**Checkbox**: caixa de cantos arredondados, preenchida em verde-tinta quando
marcada. O `onChange` recebe o novo estado, e não o evento.

```tsx
<Checkbox label="Lembrar de mim" checked={lembrar} onChange={setLembrar} />
```

**Radio**: opções que se excluem. O `onChange` recebe o `value` da opção.

```tsx
<Radio name="pagamento" value="pix" label="Pix" checked={forma === 'pix'} onChange={setForma} />
```

**Switch**: liga e desliga.

```tsx
<Switch label="Loja aberta" checked={aberta} onChange={setAberta} />
```

**Segmented**: controle segmentado em pílula: Dia/Semana/Mês, Lista/Grade.

```tsx
<Segmented options={[{ value: 'dia', label: 'Dia' }, { value: 'semana', label: 'Semana' }, { value: 'mes', label: 'Mês' }]} value={periodo} onChange={setPeriodo} />
```

## Exibição (`components/display`)

**Card**: o bloco do painel: superfície escura, cantos de 28px, título leve
de 20px e o ↗ opcional no canto. `raised` serve para bloco dentro de bloco e
`accent` para o único cartão de destaque da tela, em verde-tinta, como o cartão
de número principal dos painéis.

```tsx
<Card title="Pagamentos recentes" expand actions={<Select size="sm" options={['Semanal', 'Mensal']} />}>…</Card>
```

**Money / Delta**: dinheiro no desenho da marca, com prefixo e centavos
apagados ("R$ 44.060,00"). O Delta mostra a variação com ↗ ou ↘.

```tsx
<Money value={44060} size={40} />
<Delta value={8.2} label="vs mês anterior" />
```

**Stat**: bloco de indicador: rótulo, número grande e linha de variação.
Vai dentro de um Card.

```tsx
<Stat label="Arrecadado no mês" value={128430.5} delta={12.4} deltaLabel="vs set." />
<Stat label="Cotas ativas" value={312} money={false} />
```

**ListRow**: linha no estilo de extrato: círculo à esquerda, título,
subtítulo, data e valor com sinal.

```tsx
<ListRow lead={<Avatar name="Ana Lima" />} title="Ana Lima" subtitle="Cota 14" meta="28.09.26" trailing="+R$ 280,00" trailingTone="positive" />
```

**Progress**: barra de meta: preenchimento no acento sobre o restante
hachurado, com etiqueta de % opcional.

```tsx
<Progress value={73} knob />
<Progress value={40} size="sm" plain />
```

**Table**: tabela sem bordas, com divisória fina entre linhas. No celular,
cada linha vira cartão. O tipo da linha é genérico, e coluna com nome
errado aparece como erro de tipo.

```tsx
<Table columns={[{ key: 'nome', label: 'Cliente' }, { key: 'valor', label: 'Parcela', align: 'right' }]} rows={clientes} />
```

**EmptyState**: estado vazio centralizado: ícone redondo, título, uma linha e
uma ação opcional.

```tsx
<EmptyState icon="inbox" title="Nenhum aviso" body="Quando houver novidade, ela aparece aqui." />
```

## Gráficos (`components/charts`)

**BarChart**: barras em cápsula; a selecionada acende no acento com o valor
numa etiqueta.

```tsx
<BarChart data={[{ label: 'Seg', value: 1200 }, { label: 'Ter', value: 1800, highlight: true }]} format={(v) => 'R$ ' + v} />
```

**Donut**: rosca de fatias arredondadas; combine terracota, verde-tinta e a fatia
hachurada de "outros".

```tsx
<Donut segments={[{ value: 60, color: 'var(--chart-1)' }, { value: 25, color: 'var(--chart-2)' }, { value: 15, hatch: true }]} center={<Money value={5080} size={22} />} />
```

**Sparkline**: linha de tendência fina com área suave e ponto no fim.

```tsx
<Sparkline data={[4, 6, 5, 9, 7, 12]} height={90} />
```

## Navegação (`components/navigation`)

**Logo**: a marca, sempre a partir das artes em PNG, nunca redesenhada.
Verde por padrão; `tone="cream"` só sobre superfície escura, como o cartão de
destaque.

```tsx
<Logo height={24} />
<Logo variant="full" tone="cream" height={120} />
```

**TopNav**: barra superior fixa e translúcida: logo, grupo de links em
pílula e controles à direita. Abaixo de 1100px os links somem e o BottomNav
assume.

```tsx
<TopNav role="Loja" items={secoes} value={secao} onChange={setSecao} end={<Avatar name="Marina" />} />
```

**BottomNav**: barra flutuante do celular (abaixo de 1100px). O item ativo se
abre numa pílula com o nome, e os outros ficam só no ícone. Máximo de cinco
itens; o que passar disso vai para uma folha "Mais".

```tsx
<BottomNav items={[{ value: 'inicio', label: 'Início', icon: 'house' }]} value={secao} onChange={setSecao} />
```

**SideNav**: navegação vertical agrupada, para administração no desktop.

```tsx
<SideNav groups={[{ label: 'Operação', items: [{ value: 'lojas', label: 'Lojas', icon: 'store', count: 4 }] }]} value={secao} onChange={setSecao} />
```

**Tabs**: abas de filtro com contagem e rolagem lateral; a ativa fica
invertida (branco sobre o escuro).

```tsx
<Tabs items={[{ value: 'todas', label: 'Todas', count: 128 }, { value: 'atraso', label: 'Em atraso', count: 6 }]} value={aba} onChange={setAba} />
```

## Retorno (`components/feedback`)

**Dialog**: janela sobre fundo desfocado; vira folha no rodapé no celular.
Fecha no Esc e no clique fora.

```tsx
<Dialog open={aberto} title="Recusar loja?" description="O lojista será avisado." onClose={fechar}
  footer={<><Button variant="ghost">Cancelar</Button><Button variant="danger">Recusar</Button></>} />
```

**Insight**: faixa de destaque no acento, uma por tela, para o aviso mais
acionável.

```tsx
<Insight title="3 parcelas vencem amanhã" onClick={abrirCobranca}>Mande o lembrete hoje</Insight>
```

**Toast / ToastStack**: confirmação em pílula invertida, no centro do rodapé.
No celular, fica acima do BottomNav.

```tsx
<ToastStack><Toast action="Desfazer">Pagamento registrado</Toast></ToastStack>
```

**Tooltip / Tag**: dica em pílula no hover e no foco. A `Tag` é a mesma
cápsula, fixa, para valores de gráfico.

```tsx
<Tooltip content="Exportar CSV"><IconButton icon="download" label="Exportar" /></Tooltip>
<Tag accent>R$ 16.021</Tag>
```

## Templates (`templates/`)

Padrões de composição de tela. No export eles viviam nas telas de exemplo
(`ui_kits/shared`); aqui viraram código do sistema. A troca Claro/Escuro das
telas de exemplo não veio: o design system tem um tema só.

**AppShell**: casca de tela com barra superior (loja e cliente). No desktop a
navegação fica na barra; abaixo de 1100px ela desce para o BottomNav, com no
máximo cinco itens.

```tsx
<AppShell role="Loja" nav={secoes} page={secao} setPage={setSecao} user="Marina Costa">…</AppShell>
```

**SideShell**: casca com navegação lateral (admin). A lateral aparece a partir
de 1100px; abaixo disso, a lista `flat` vira o BottomNav.

```tsx
<SideShell groups={grupos} flat={secoes} page={secao} setPage={setSecao} user="Johann">…</SideShell>
```

**PageHead**: título ou saudação grande, linha de situação e ferramentas à
direita. `back` põe o botão de voltar.

```tsx
<PageHead title="Olá, Marina" sub="3 parcelas vencem esta semana"><Button icon="plus">Novo grupo</Button></PageHead>
```

**Steps**: linha de etapas ligadas por traço; a atual e as anteriores ficam
acesas.

```tsx
<Steps current={1} steps={[{ icon: 'user-plus', label: 'Entrou' }, { icon: 'receipt', label: 'Pagando' }, { icon: 'gift', label: 'Contemplada' }]} />
```

**useToast**: devolve `[mostrar, no]`. `mostrar('Pagamento registrado')` abre o
aviso por 2,8s; o `no` vai para a tela, dentro do `.avle-ds`.

**Classes de composição** (`templates.css`):

- `.g` + `.s3`…`.s12` para a grade de 12 colunas. Abaixo de 1100px, 3 a 5 colunas
  viram 6; abaixo de 720px, tudo vai a 12, e `.m-half` mantém um `.s3` pela
  metade.
- `.kit-main` para o conteúdo da página, com a largura máxima e o respiro do
  BottomNav.
- `.kit-row` para uma linha flexível; `.kit-muted` para texto de apoio;
  `.kit-ph` para o placeholder de imagem; `.kit-desktop-only` some no celular.
