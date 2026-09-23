<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design system

O contrato visual é o `DESIGN.md` da raiz: ele é a **fonte da verdade dos
tokens** (cores, tipo, espaço, raio, efeitos) e traz as regras de conteúdo e de
visual. Leia-o, e também o `design-system/README.md`, antes de escrever
interface. O README explica o escopo `.avle-ds`, sem o qual os componentes
aparecem sem cor, e o que ainda diverge do visual no ar.

- **Componente novo sai da biblioteca em `design-system/`.** Importe de
  `@/design-system`, nunca do arquivo interno do componente.
- **Nenhum valor de cor, fonte, espaçamento ou raio vai escrito à mão no
  código.** Use os tokens (`var(--surface-card)`, `var(--space-4)`,
  `var(--radius-xl)`). O `npm run lint` avisa sobre hexadecimal e px soltos.
- **Token muda primeiro no `DESIGN.md`**, depois em `design-system/tokens/*.css`.
  O `npm run design-system:conferir` falha se os dois divergirem.
- **As cores são as da AVLE**: verde-tinta (`--primary`) para ação e seleção,
  terracota (`--accent`) para destaque, papel e bege nas superfícies. Tema único,
  claro.
- **Não mexa nos painéis** (`app/dashboard`) nem nos tons do `@theme` do
  `app/globals.css` quando o trabalho for no design system. Eles ficam como estão.
- Não mexa em `design-system/referencia/`: são as páginas aprovadas,
  congeladas, e não código do app.

Mapa da biblioteca (detalhe em `design-system/README.md`):

| Onde | O que tem |
| --- | --- |
| `design-system/index.ts` | porta única de importação |
| `design-system/tokens/` | implementação dos tokens do DESIGN.md + `conferir.mjs` |
| `design-system/components/<grupo>/` | os 34 componentes em TSX (`core`, `forms`, `display`, `charts`, `navigation`, `feedback`) + `components.css` |
| `design-system/templates/` | composição de tela: AppShell, SideShell, PageHead, Steps, useToast, grade `.g`/`.sN` |
| `design-system/assets/` | artes da marca em PNG |
| `design-system/lint/aderencia.mjs` | regras de aderência do ESLint |
| `design-system/docs/componentes.md` | catálogo com exemplos |
| `design-system/referencia/` | HTMLs de referência visual do export, congelados com a paleta original; `npm run design-system` e abra `http://localhost:4400/referencia/` |
| `app/design-system/` | a vitrine, na rota `/design-system`: tudo renderizado, com os estados |

Para criar um componente: grupo certo em `components/`, estilo com classes
`av-*` em `components.css` só com tokens, export em `index.ts`, todos os
estados na vitrine e entrada no catálogo. O passo a passo está em
"Como criar um componente", no `design-system/README.md`.
