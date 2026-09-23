# Design system da AVLE

Tokens, componentes React e referências visuais dos painéis da AVLE (loja,
cliente e admin). Veio de um export do Claude Design e foi reorganizado para
viver dentro do app Next. O contrato visual, com os tokens e as regras de
conteúdo e de visual, é o [DESIGN.md](../DESIGN.md) da raiz. O catálogo de
componentes está em [docs/componentes.md](docs/componentes.md), e a rota
`/design-system` mostra tudo renderizado, com os estados.

As cores são as da própria AVLE — papel, bege, terracota e o verde-tinta da
marca, os tons que os painéis usavam no visual claro. O export do Claude Design
veio com a paleta da referência visual (pretos e verde-limão), e ela foi
trocada. Tema único, claro.

> **Estado atual:** o design system está carregado no app, mas **nenhuma tela do
> produto o usa ainda**; só a vitrine (`/design-system`). Os painéis usam as
> classes do Tailwind com os tons do `@theme` de `app/globals.css` — a mesma
> paleta da AVLE daqui — e uma camada no fim do mesmo arquivo que dá a elas o
> desenho do design system. Ainda sem os componentes.
> Veja [O que ainda não bate](#o-que-ainda-não-bate) antes de migrar uma tela.

## Onde fica cada coisa

```
design-system/
├── index.ts             porta única de importação: componentes, templates e hooks
├── styles.css           entrada do CSS, importada por app/globals.css
├── tokens/              implementação dos tokens do DESIGN.md (cores, tipo, espaço, efeitos, base)
│   └── conferir.mjs     confere os CSS contra o DESIGN.md (npm run design-system:conferir)
├── components/          os 34 componentes em TSX, por grupo, + components.css (classes av-*)
│   ├── core/            Icon, Button, IconButton, Pill, Badge, Avatar
│   ├── forms/           Input, Select, Checkbox, Radio, Switch, Segmented
│   ├── display/         Card, Money/Delta, Stat, ListRow, Progress, Table, EmptyState
│   ├── charts/          BarChart, Donut, Sparkline
│   ├── navigation/      Logo, TopNav, BottomNav, SideNav, Tabs
│   └── feedback/        Dialog, Toast/ToastStack, Tooltip/Tag, Insight
├── templates/           composição de tela: AppShell, SideShell, PageHead, Steps,
│                        useToast + templates.css (grade .g/.sN, kit-*)
├── assets/              artes da marca em PNG
├── lint/aderencia.mjs   regras de aderência, ligadas no eslint.config.mjs
├── docs/componentes.md  catálogo de componentes, com exemplos
└── referencia/          páginas HTML estáticas do export, para abrir no navegador
    ├── index.html       índice de todas as páginas
    ├── guidelines/      cores, tipo, raios, espaço, logo, motivos
    ├── componentes/     um card por grupo de componentes
    ├── ui-kits/         as três telas de exemplo (loja, cliente, admin)
    └── runtime/         cópia congelada do código e do CSS originais do export
```

**A fonte da verdade dos tokens é o [DESIGN.md](../DESIGN.md) da raiz.** Os CSS
de `tokens/` são a implementação dele. Para mudar um token: mude o DESIGN.md,
depois o CSS, e rode `npm run design-system:conferir`, que falha se os dois
divergirem em qualquer sentido. Para validar o formato do DESIGN.md:
`npx @google/design.md lint DESIGN.md`, que hoje dá 0 erros; os avisos esperados
estão em [O que ainda não bate](#o-que-ainda-não-bate).

## Como usar numa tela

```tsx
import { Button, Card, Money } from '@/design-system';

export default function Resumo() {
  return (
    <div className="avle-ds">
      <Card title="Arrecadado" expand>
        <Money value={45060.4} size={44} />
        <Button icon="plus">Novo grupo</Button>
      </Card>
    </div>
  );
}
```

Quatro regras:

1. **Tudo dentro de `.avle-ds`.** Os tokens só existem dentro desse escopo. Um
   componente fora dele aparece sem cor nenhuma. Diálogos, toasts e a barra do
   celular ficam `position: fixed`, mas continuam precisando estar
   *dentro* do elemento com a classe, porque herdam as variáveis pela árvore e
   não pela posição na tela. Por isso nenhum componente usa portal.
2. **Importe de `@/design-system`,** nunca de `@/design-system/components/...`.
   O lint avisa.
3. **Duas cores, dois papéis.** Ação principal e seleção (botão principal,
   item ativo, caixa marcada) são `--primary`, o verde-tinta. Destaque (número
   em foco, barra acesa, contador, faixa de aviso) é `--accent`, a terracota.
4. **Cliente e servidor.** Os componentes que criam `onChange`/`onClick` por
   conta própria são de cliente. A lista está no
   [catálogo](docs/componentes.md). Os outros funcionam em componente de servidor.

### Por que os tokens não ficam no `:root`

O design system usa os mesmos nomes de variável que o Tailwind 4 (`--radius-xl`,
`--leading-relaxed`, `--tracking-wide`, `--font-sans`, `--ease-out`, `--text-xs`)
com valores diferentes. No `:root`, eles venceriam o tema do Tailwind e
mudariam telas que ninguém tocou: `rounded-xl`, usado 151 vezes nos painéis,
passaria de 12px para 28px. Presos a `.avle-ds`, eles só valem onde alguém
escolheu entrar.

A consequência: **dentro** do escopo, os utilitários do Tailwind com esses
nomes seguem o design system (`rounded-xl` vira 28px, `leading-tight` vira
1.1). Isso é intencional. Uma tela migrada fala uma língua só.

A cascata ficou assim:

| Camada | O quê | Por quê |
| --- | --- | --- |
| `@layer base` | `tokens/base.css` | Utilitários do Tailwind no elemento continuam ganhando da base |
| sem camada | tokens e `components.css` | Como vieram do export: o desenho do componente ganha de utilitário do Tailwind com a mesma propriedade; margem e largura continuam livres |

## Como criar um componente

1. **Confira se ele já existe.** Veja o [catálogo](docs/componentes.md) e a
   vitrine. Muitas vezes é uma variante de um que já existe, e não um novo.
2. **Crie o arquivo no grupo certo**, `components/<grupo>/Nome.tsx` (ou
   `templates/`, se for composição de tela). Siga o vizinho: props num
   `type NomeProps`, nome em inglês como os outros, docblock dizendo por que ele
   existe. Ponha `'use client'` só se ele usa hook ou cria handler próprio.
3. **Estilo em `components.css`**, com classes `av-nome`, `av-nome--variante` e
   `av-nome__parte`. Cor, fonte, espaçamento e raio só com `var(--...)` dos
   tokens. Valor que não tem token vira token primeiro no DESIGN.md, e não um
   número solto.
4. **Exporte em `index.ts`**, com o tipo das props.
5. **Mostre na vitrine** (`app/design-system/Catalogo.tsx`), com todos os estados
   que ele tem. Hover, foco e pressionado se forçam com `<Forcado estado="ds-hover">`.
6. **Documente em `docs/componentes.md`** e, se ele tiver cores próprias, em
   `components` no DESIGN.md.
7. `npx tsc --noEmit`, `npm run lint` e `npm run design-system:conferir`.

## Vitrine

A rota `/design-system` (`app/design-system/`) desenha a biblioteca inteira: cada componente com as variantes e os estados
(padrão, hover, foco, pressionado, desativado, erro, vazio, selecionado), os
templates e as cores. Ela usa o código atual, dentro do Next, ao contrário das
referências, que são o desenho congelado. Fica fora dos buscadores.

Hover, foco e pressionado aparecem fixos porque a vitrine copia, em tempo de
execução, as regras `:hover`/`:focus`/`:active` das folhas `av-*` e `kit-*` para
classes (`.ds-hover`, `.ds-foco`, `.ds-clique`). Não existe segunda cópia do CSS
para manter.

## Lint de aderência

`lint/aderencia.mjs` veio do `_adherence.oxlintrc.json` do export, traduzido de
oxlint para ESLint e ligado em `eslint.config.mjs`. Ele avisa (`warn`) sobre:

- import de arquivo interno de componente;
- cor em hexadecimal, px e `font-family` soltos no código;
- prop desconhecida e valor inválido de `variant`/`size`/`tone` nos componentes.

As regras de cor/px **não valem para os 18 arquivos que já existiam**: eles
somam 1.169 ocorrências, e ligar a regra ali afogaria qualquer aviso novo. A
lista `LEGADO` no arquivo só pode encolher. O que foi descartado do original, e
por quê, está no topo do próprio arquivo.

## Páginas de referência

`referencia/` guarda os HTMLs do export: as guidelines (cores, tipo, raios,
logo), um card por grupo de componentes e as três telas de exemplo (loja,
cliente, admin). Eles renderizam idênticos ao export original, o que foi
conferido pixel a pixel ao reorganizar.

```bash
npm run design-system
# abre em http://localhost:4400/referencia/
```

As guidelines e os cards também abrem com duplo clique. As telas de `ui-kits`
precisam do servidor, porque carregam o JSX pelo Babel do navegador, e o Chrome
bloqueia isso em `file://`.

Os componentes dessas páginas vêm de `referencia/runtime/ds-bundle.js`, e o CSS
de `referencia/runtime/estilo-original/`: **cópias congeladas** do código e do
CSS do export. Elas mostram o que o Claude Design entregou, **com a paleta da
referência visual** (pretos e verde-limão), e não a paleta da AVLE que o app usa.
Mudar um componente ou um token do app não muda as referências. Para ver o
design system como ele é hoje, use a vitrine `/design-system`.
React, Babel, as fontes e os ícones vêm de CDN, então as páginas precisam de
internet.

## O que ainda não bate

Decisões que ficaram para quem decide o visual, sem mudança no código:

- **Os painéis ainda não usam os componentes.** Eles voltaram às cores da AVLE
  de antes do visual escuro, que são as mesmas daqui, mas continuam com as
  classes do Tailwind escritas à mão. Migrar é trocar essas classes pelos
  componentes, tela por tela.
- **Contraste da terracota.** Texto branco sobre `#BD6B42` dá 3,93:1, abaixo dos
  4,5:1 do WCAG AA para texto pequeno (passa nos 3:1 de texto grande e ícone).
  Aparece na faixa de aviso (Insight), no badge sólido, na pílula de acento e no
  IconButton de acento. A cor é a da marca e não foi mexida.
- **As telas de exemplo são de outro negócio.** Pedidos, produtos e entregas
  foram inventados pelo Claude Design, que não conhecia a AVLE. Os componentes
  servem; o conteúdo das telas não.
- **Ícones.** O design system usa Lucide pelo CDN do unpkg. O trilho dos painéis
  usa os ícones desenhados em `app/dashboard/components/Casca.tsx`.
- **Sem estado de carregamento.** O export não tinha um, e ele não foi
  inventado. Quando for preciso, ele nasce como variante do Button, primeiro no
  DESIGN.md.
- **Avisos do linter do DESIGN.md.** 32 `orphaned-tokens` (cores de paleta que
  nenhum token de componente cita, o que é esperado numa paleta), 1
  `token-like-ignored` (a chave `effects`, extensão deste projeto) e 6 de
  contraste: os 4 da terracota acima, o rosa do botão de perigo sobre o seu
  fundo claro (4,12:1) e o texto do badge neutro sobre o bege (4,35:1).
- **Nomes em inglês.** Os componentes se chamam `Button`, `Card`... e não
  `Botao`, `Cartao`, como o resto do projeto. É o contrato do design system: a
  documentação e o lint se referem a eles por esses nomes.
