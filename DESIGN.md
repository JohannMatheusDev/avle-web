---
version: alpha
name: AVLE
description: Painéis da AVLE (loja, cliente e admin), na paleta da própria marca. Tema único, claro.
colors:
  avle-tinta: "#0B1E14"
  avle-tinta-800: "#08170F"
  avle-verde: "#1C3F24"
  avle-terracota: "#BD6B42"
  avle-terracota-escuro: "#A95A33"
  avle-terracota-vivo: "#C05A3E"
  avle-bege: "#F7F4EB"
  avle-papel: "#F5F2EB"
  avle-areia: "#EFEAE1"
  avle-borda: "#E8E4DA"
  avle-borda-forte: "#DFD9CE"
  avle-texto: "#2C2A29"
  pedra-300: "oklch(86.9% 0.005 56.366)"
  pedra-400: "oklch(70.9% 0.01 56.259)"
  pedra-500: "oklch(55.3% 0.013 58.071)"
  pedra-600: "oklch(44.4% 0.011 73.639)"
  esmeralda-50: "oklch(97.9% 0.021 166.113)"
  esmeralda-700: "oklch(50.8% 0.118 165.612)"
  rosa-50: "oklch(96.9% 0.015 12.422)"
  rosa-600: "oklch(58.6% 0.253 17.585)"
  rosa-700: "oklch(51.4% 0.222 16.935)"
  ambar-50: "oklch(98.7% 0.022 95.277)"
  ambar-700: "oklch(55.5% 0.163 48.998)"
  bg-app: "{colors.avle-papel}"
  surface-card: "#FFFFFF"
  surface-raised: "{colors.avle-bege}"
  surface-sunken: "{colors.avle-papel}"
  surface-hover: "{colors.avle-areia}"
  surface-inverse: "{colors.avle-tinta}"
  surface-brand: "{colors.avle-verde}"
  border-subtle: "rgba(11,30,20,.05)"
  border-default: "{colors.avle-borda}"
  border-strong: "{colors.avle-borda-forte}"
  text-primary: "{colors.avle-tinta}"
  text-secondary: "{colors.pedra-500}"
  text-tertiary: "{colors.pedra-400}"
  text-disabled: "{colors.pedra-300}"
  text-inverse: "#FFFFFF"
  primary: "{colors.avle-tinta}"
  primary-hover: "{colors.avle-verde}"
  primary-press: "{colors.avle-tinta-800}"
  text-on-primary: "#FFFFFF"
  accent: "{colors.avle-terracota}"
  accent-hover: "{colors.avle-terracota-escuro}"
  accent-press: "{colors.avle-terracota-escuro}"
  accent-soft: "rgba(189,107,66,.12)"
  accent-ink: "{colors.avle-terracota-escuro}"
  accent-glow: "rgba(189,107,66,.18)"
  text-on-accent: "#FFFFFF"
  positive: "{colors.esmeralda-700}"
  negative: "{colors.rosa-600}"
  warning: "{colors.ambar-700}"
  info: "{colors.avle-verde}"
  positive-soft: "{colors.esmeralda-50}"
  negative-soft: "{colors.rosa-50}"
  warning-soft: "{colors.ambar-50}"
  info-soft: "rgba(28,63,36,.08)"
  chart-1: "{colors.avle-terracota}"
  chart-2: "{colors.avle-tinta}"
  chart-3: "{colors.avle-borda}"
  chart-4: "{colors.pedra-400}"
typography:
  display:
    fontFamily: Urbanist
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.1
  page-title:
    fontFamily: Urbanist
    fontSize: 32px
    fontWeight: 400
    lineHeight: 1.25
  card-title:
    fontFamily: Urbanist
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.25
  body:
    fontFamily: Urbanist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: Urbanist
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.25
  metric:
    fontFamily: Urbanist
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1
  text-display:
    fontFamily: Urbanist
    fontSize: 48px
  text-h1:
    fontFamily: Urbanist
    fontSize: 40px
  text-h2:
    fontFamily: Urbanist
    fontSize: 32px
  text-h3:
    fontFamily: Urbanist
    fontSize: 24px
  text-h4:
    fontFamily: Urbanist
    fontSize: 20px
  text-lg:
    fontFamily: Urbanist
    fontSize: 18px
  text-md:
    fontFamily: Urbanist
    fontSize: 16px
  text-sm:
    fontFamily: Urbanist
    fontSize: 14px
  text-xs:
    fontFamily: Urbanist
    fontSize: 12px
  text-2xs:
    fontFamily: Urbanist
    fontSize: 11px
  mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
rounded:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 28px
  2xl: 36px
  pill: 999px
spacing:
  "0": 0
  "1": 4px
  "2": 8px
  "3": 12px
  "4": 16px
  "5": 20px
  "6": 24px
  "7": 28px
  "8": 32px
  "10": 40px
  "12": 48px
  "16": 64px
  card-padding: 24px
  card-padding-mobile: 18px
  grid-gap: 16px
  control-sm: 32px
  control-md: 40px
  control-lg: 48px
  nav-height: 72px
  bottom-nav-height: 64px
  content-max: 1440px
# Extensão deste projeto (o formato não tem grupo para isso): sombras,
# degradês, desfoque, curvas e tempos. O linter oficial ignora a chave.
effects:
  focus-ring: "0 0 0 3px rgba(189,107,66,.30)"
  shadow-card: "0 0 0 1px rgba(11,30,20,.05),0 1px 2px rgba(11,30,20,.04),0 22px 44px -34px rgba(11,30,20,.55)"
  shadow-pill: "inset 0 1px 0 rgba(255,255,255,.9),0 1px 3px rgba(11,30,20,.08)"
  shadow-pop: "0 24px 48px -12px rgba(11,30,20,.18),0 0 0 1px rgba(11,30,20,.06)"
  shadow-accent-glow: "0 0 24px rgba(189,107,66,.35)"
  gradient-pill: "linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,0))"
  gradient-accent-bar: "linear-gradient(180deg,#BD6B42 0%,rgba(189,107,66,.15) 100%)"
  gradient-bar-muted: "linear-gradient(180deg,#E8E4DA 0%,rgba(232,228,218,0) 100%)"
  hatch: "repeating-linear-gradient(135deg,rgba(11,30,20,.14) 0 2px,transparent 2px 7px)"
  blur-overlay: "blur(16px)"
  scrim: "rgba(11,30,20,.35)"
  ease-out: "cubic-bezier(.2,.8,.2,1)"
  ease-in-out: "cubic-bezier(.65,0,.35,1)"
  dur-fast: "120ms"
  dur-base: "200ms"
  dur-slow: "320ms"
components:
  # Tirado de design-system/components/components.css. Ação principal e
  # seleção usam o verde-tinta (primary); destaque usa a terracota (accent).
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-primary}"
    rounded: "{rounded.pill}"
    height: "{spacing.control-md}"
    padding: "{spacing.5}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.text-on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    height: "{spacing.control-md}"
  button-secondary-hover:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.text-primary}"
  button-ghost:
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
  button-ghost-hover:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
  button-danger:
    backgroundColor: "{colors.negative-soft}"
    textColor: "{colors.negative}"
    rounded: "{rounded.pill}"
  button-danger-hover:
    backgroundColor: "{colors.negative}"
    textColor: "{colors.text-inverse}"
  button-inverse:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.pill}"
  icon-button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-on-accent}"
    rounded: "{rounded.pill}"
    size: "{spacing.control-md}"
  pill-active:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
  tab-active:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.pill}"
  segmented-on:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card-padding}"
  card-raised:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
  card-accent:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-primary}"
    rounded: "{rounded.xl}"
  input:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    height: "{spacing.control-lg}"
    padding: "{spacing.4}"
  badge-neutral:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
  badge-solid:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-on-accent}"
    rounded: "{rounded.pill}"
  insight:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-on-accent}"
    rounded: "{rounded.lg}"
  toast:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.pill}"
  dialog:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "{spacing.6}"
  bottom-nav-item-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-primary}"
    rounded: "{rounded.pill}"
  avatar-brand:
    backgroundColor: "{colors.surface-brand}"
    textColor: "{colors.avle-bege}"
    rounded: "{rounded.pill}"
  pill-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-on-accent}"
    rounded: "{rounded.pill}"
  checkbox-checked:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-primary}"
---

# AVLE: contrato visual

Este arquivo é o contrato visual da AVLE e a **fonte da verdade dos tokens**. Ele
segue o formato [DESIGN.md](https://github.com/google-labs-code/design.md)
(versão `alpha`): os tokens estão no frontmatter acima, e o texto abaixo explica
como aplicá-los.

- **Mudar um token é mudar aqui primeiro.** A implementação fica em
  `design-system/tokens/*.css`, e `npm run design-system:conferir` falha se os
  dois divergirem.
- **Paleta da AVLE, tema único.** O export do Claude Design veio com a paleta da
  referência visual (pretos em escada e um verde-limão). Ela foi trocada pela da
  própria AVLE — bege, papel, terracota e o verde da marca, os mesmos tons dos
  painéis no visual claro. Não há tema escuro. Onde o texto em inglês abaixo
  falava da paleta antiga, ele foi reescrito; o resto é o texto aprovado.
- **`effects`** é uma extensão deste projeto: o formato não tem grupo para
  sombras, degradês e tempos de animação.
- **Como usar no código, o mapa da biblioteca e como criar um componente** estão
  em [design-system/README.md](design-system/README.md). A vitrine com tudo
  renderizado fica na rota `/design-system`.

As seções abaixo são a especificação aprovada no Claude Design e ficam em inglês,
como vieram. Uma tradução abriria a porta para divergir dela sem ninguém perceber.
As notas deste projeto estão em português e marcadas como **Nota do projeto**.

## Overview

AVLE has three dashboards sharing one visual language: **Loja** (the store), **Cliente** (the customer) and **Admin** (the platform back-office).

All three are **mobile-complete**: desktop gets the full density (pill top-nav or side-nav, 12-col grid, tables); under 1100px navigation moves to a floating bottom bar, and under 720px grids collapse to one column, tables stack into cards and dialogs become bottom sheets. No feature is desktop-only except bulk export shortcuts.

Brand tagline tone (from reference, adapted): clarity, precision, premium feel — no exclamation marks, no hype.

> **Nota do projeto.** O export descrevia a AVLE como marketplace, com pedidos,
> produtos e entregas, porque o Claude Design não conhecia o negócio. A AVLE é um
> clube de compras planejado: a loja monta grupos, a cliente entra numa cota e
> paga parcelas. Os componentes valem; os exemplos de conteúdo do export, não.
> O painel da cliente é usado quase só pelo celular.

### Content fundamentals

- **Language**: Brazilian Portuguese. Money `R$ 44.060,00`; dates `28.09.26` (dotted, like the reference) or "terça, 28 de setembro" in greetings.
- **Voice**: calm, direct, second person (**você**). The product speaks as a helpful partner: "Reponha antes de sexta para não perder vendas." Never first-person "eu".
- **Greeting-first**: each dashboard opens with "Olá, {nome}" + one status line ("Você tem 1 pedido a caminho").
- **Casing**: Sentence case everywhere — titles, buttons, tabs ("Novo produto", "Pedidos recentes"). Uppercase only for 11px role tags (LOJA, ADMIN).
- **Buttons are verbs**: "Enviar 12 pedidos", "Aprovar loja", "Sacar agora", "Rastrear". Put the count in the CTA when it helps.
- **Insights** are one concrete fact + one consequence/action, ≤ 70 chars each line: title "Estoque baixo em 3 produtos", body "Reponha antes de sexta…".
- **Numbers over adjectives**; deltas as "↗ 12,4% vs semana anterior".
- **No emoji.** Unicode arrows ↗ ↘ are used for deltas only.

### Sources

- `design-system/assets/avle-marca-original.png` is the **only AVLE brand asset**: tree + serif "AVLE" wordmark, cream `#F8F4EC` on forest `#1E3A2F`.
- The visual reference for the dashboard style is a third-party Behance case study, **"Finpath — AI-powered Fintech SaaS platform" (2026)** (pill controls, Urbanist type, rounded 28px cards, capsule bar charts, hatched progress). Only its shapes and components are used: its name, logo and colors are **not**. The palette is AVLE's own.

> **Nota do projeto.** A arte da marca se chamava `uploads/AVLE_.png` no export,
> e as outras artes de `design-system/assets/` foram feitas a partir dela. Os 19
> prints do Finpath vieram no export, mas não estão no repositório: são material
> de terceiros, só inspiração, e somam 60 MB. O Claude Design não recebeu nem
> código nem produto da AVLE, então as telas de `design-system/referencia/ui-kits`
> são desenhos novos no estilo da referência, e não telas da AVLE.

## Colors

- **Palette**: AVLE's own. Paper canvas `#F5F2EB`, white cards, beige `#F7F4EB` for raised tiles, sand `#EFEAE1` on hover, border `#E8E4DA`. Text is the brand ink green `#0B1E14`, with Tailwind stone for support text (`stone-500`, `stone-400`).
- **Two brand colors, two jobs.** **Ink green `#0B1E14`** (`primary`) is action and selection: the primary CTA, the active bottom-nav item, checked boxes and switches, the highlight card. **Terracotta `#BD6B42`** (`accent`) is attention, used sparingly: one highlighted bar, the progress fill, counters, the Insight banner, the focus ring. Brand green `#1C3F24` is the primary hover and the store avatar.
- **Status**: the same Tailwind `emerald-700` / `rose-600` / `amber-700` (on their `-50` tints) the dashboards use, in the same `oklch` values; info is the brand green.
- **Theme**: one, light. There is no dark theme.

> **Nota do projeto.** Use sempre o papel (`primary`, `accent`, `surface-card`,
> `text-secondary`), e nunca a cor crua (`avle-terracota`, `avle-tinta`). Se a
> paleta mudar, o papel acompanha; a cor crua fica para trás.

## Typography

- **Type**: Urbanist only (300–700). Headlines are *light/regular*, never bold — hierarchy comes from size and grey steps. Metrics are semibold with **muted currency prefix and muted decimals**. Scale 48/40/32/24/20/16/14/12.
- **Fonts**: Urbanist + JetBrains Mono. The wordmark's serif lives only in the logo artwork.

> **Nota do projeto.** No app, a Urbanist vem do `next/font` (`app/layout.tsx`),
> e o token `--font-sans` a encontra pela variável `--font-urbanist`. O Google
> Fonts só é usado nas páginas de referência. A JetBrains Mono não é carregada
> no app.

## Layout

- **Layout**: max 1440px, 12-col grid, 16px gaps, 28px side padding (14px mobile). Sticky top nav 72px. Mobile: fixed floating bottom nav 12px from edges; content gets 110px bottom padding.

> **Nota do projeto.** A grade é `.g` com `.s3`…`.s12`, em
> `design-system/templates/templates.css`.

## Elevation & Depth

- **Cards**: white fill, a near-invisible ink-green hairline and a long, shallow shadow (`--shadow-card`), as on the dashboard cards. Title 20px light, top-left; a circular **↗ expand** button top-right is the signature affordance.
- **Depth**: shadows are tinted with the ink green, never black. Raised pills get `--shadow-pill` (top light + soft drop). Only overlays (dialogs, bottom nav, toasts) get a real outer shadow (`--shadow-pop`).
- **Blur/transparency**: top nav and bottom nav are translucent with 16px backdrop blur; dialog scrim blurs 6px. Nothing else is transparent.
- **Motion**: quick and quiet — 120ms hovers, 200ms state, 320ms entrance with `cubic-bezier(.2,.8,.2,1)`; dialogs/toasts rise 12px + fade. No bounces, no looping animation.
- **Hover**: surfaces step to sand (`--surface-hover`); text goes secondary→primary; the primary button goes to brand green `#1C3F24`, terracotta darkens to `#A95A33`. **Press**: `scale(.97)` on buttons, `.94` on icon buttons.
- **Focus**: 3px terracotta ring at 30% (`--focus-ring`).

## Shapes

- **Shape**: everything interactive is a **pill** (999px). Cards 28px (20px mobile), inner tiles 16–20px, round 40px icon buttons with hairline ring.
- **Motifs**: diagonal **hatch** fill for remainder/"others" (progress tracks, donut segments); **capsule bars** with a top-to-transparent gradient, the selected one in terracotta with a value tag above; small value **tags** as pills.
- **Backgrounds**: solid paper; no photos behind UI, no gradients except the bar fades and a faint terracotta radial glow on image placeholders. No textures.
- **Imagery**: none supplied. Product images are placeholder tiles (raised gradient + Lucide glyph). When real photos arrive, prefer warm, natural, softly lit product shots that sit well against paper.

## Components

- **core**: Icon, Button, IconButton, Pill, Badge, Avatar
- **forms**: Input, Select, Checkbox, Radio, Switch, Segmented
- **display**: Card, Money, Delta, Stat, ListRow, Progress, Table, EmptyState
- **charts**: BarChart, Donut, Sparkline
- **navigation**: Logo, TopNav, BottomNav, SideNav, Tabs
- **feedback**: Dialog, Toast, ToastStack, Tooltip, Tag, Insight

Intentional additions beyond the basics: **Money/Delta** (brand money formatting), **Insight** (the reference's highlighted AI/insight banner), **charts** (dashboards need them), **Logo** (wraps the PNG so nobody redraws it).

### Iconography

- **Lucide** line icons (`lucide-static@0.460.0` from unpkg), rendered as CSS masks via `<Icon name="…"/>` so they take `currentColor`. Matches the reference's thin 1.5–2px rounded strokes. Substitution: the reference's exact icon set is unknown; Lucide is the closest CDN match.
- Icons sit inside **round containers**: hairline-ring IconButtons (toolbar, ↗ expanders), filled 40px leads in list rows, 28px dots in steppers.
- Sizes: 18px default, 15–16px in small controls, 20px in bottom nav, 24–40px in empty states/placeholders.
- No emoji, no icon font, no PNG icons. Unicode ↗/↘ only for deltas.
- **Logo**: never redraw. Use `assets/avle-logo-*.png` (full), `avle-wordmark-*` (nav, 20–26px tall), `avle-tree-*` (mark), `avle-logo-square.png` (app icon/avatar). Forest on the light canvas (the default); cream only on dark surfaces such as the highlight card.

> **Nota do projeto.** Onde o texto acima cita `assets/`, os arquivos estão em
> `design-system/assets/`. Além dos 34 componentes, há os templates de composição:
> AppShell, SideShell, PageHead, Steps e o hook `useToast`. O catálogo com exemplos fica em
> [design-system/docs/componentes.md](design-system/docs/componentes.md). O design
> system **não tem estado de carregamento**: o export não trazia um.

## Do's and Don'ts

Regras deste projeto, reunidas das seções acima.

- **Faça** a tela nova com os componentes de `@/design-system`, dentro de `.avle-ds`.
- **Faça** cor, fonte, espaçamento e raio com token (`var(--surface-card)`, `var(--space-4)`, `var(--radius-xl)`).
- **Faça** a ação principal em verde-tinta (`primary`) e o destaque em terracota (`accent`), com parcimônia: uma barra acesa, um Insight por tela.
- **Faça** títulos em peso leve ou regular, com a hierarquia no tamanho.
- **Não** escreva hexadecimal, px de espaçamento ou `font-family` soltos no código. O `npm run lint` avisa.
- **Não** redesenhe o logo: use o `<Logo>`, que carrega as artes em PNG.
- **Não** use emoji, ponto de exclamação ou negrito em título.
- **Não** use sombra externa fora de diálogo, toast e barra do celular.
- **Não** mude token só no CSS: o DESIGN.md vem primeiro.

## Os painéis que estão no ar

Os painéis **ainda não usam** os componentes deste design system, mas estão na
mesma paleta e já têm o desenho dele: uma camada no fim de `app/globals.css`,
presa a `.fundo-painel`, dá às classes antigas os cantos, a sombra, as pílulas,
os títulos leves e os números em Urbanist daqui. Os tons do `@theme` de lá são
os tokens daqui com outro nome. Tela que migrar troca as classes do Tailwind
pelos componentes, e nem a cor nem a forma mudam.

| Painéis (`@theme`) | Valor | Aqui |
| --- | --- | --- |
| `--color-painel-tinta` | `#0B1E14` | `primary`, `text-primary` |
| `--color-painel-acento` | `#BD6B42` | `accent` |
| `--color-painel-borda` | `#E8E4DA` | `border-default` |
| `--color-painel-papel` | `#F5F2EB` | `bg-app` |
| `--color-avle-bege` | `#F7F4EB` | `surface-raised` |
| `--color-avle-verde` | `#1C3F24` | `primary-hover`, `surface-brand` |
