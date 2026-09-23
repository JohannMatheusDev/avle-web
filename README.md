# AVLE: frontend

Site e painéis da AVLE, o clube de compras planejado: a loja monta grupos, a
cliente entra numa cota e paga em parcelas. É o app Next.js que conversa com a
API do repositório `avle-api` (Spring Boot).

## Rodando

```bash
npm install
npm run dev          # http://localhost:3000
```

A única variável de ambiente é `NEXT_PUBLIC_API_URL`, em `.env.local`. Sem ela,
o app aponta para `https://api.avle.com.br`, a API de produção.

| Script | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run lint` | ESLint, com as regras de aderência ao design system |
| `npm run design-system` | serve as páginas de referência do design system em `http://localhost:4400/referencia/` |
| `npm run design-system:conferir` | confere se os tokens do CSS batem com o `DESIGN.md` |

## Estrutura

```
app/
├── page.tsx               entrada e login
├── dashboard/             os três painéis (loja, cliente, admin) e a casca comum
├── convite/[id]/          cadastro pelo link de convite da loja
├── fatura/                faturas da cliente
├── admin/                 painel administrativo da plataforma
├── previa-visual/         os painéis com dados de exemplo, sem precisar logar
├── design-system/         vitrine do design system (rota /design-system)
├── components/            componentes usados por mais de uma rota
└── lib/                   regras e acesso à API (api.ts é a porta única de saída)
design-system/             tokens, componentes, templates e referências visuais (ver o README de lá)
DESIGN.md                  contrato visual e fonte da verdade dos tokens
docs/                      contratos de API entre este repositório e o avle-api
```

Toda chamada à API passa por `apiFetch`, em `app/lib/api.ts`. A sessão é um
cookie httpOnly, e uma chamada feita fora dele sai sem sessão.

## Design system

O contrato visual é o [DESIGN.md](DESIGN.md), no formato aberto do Google
Stitch: ele é a fonte da verdade dos tokens. A implementação está em
`design-system/`: os tokens, os 34 componentes, os templates de composição e as
páginas de referência visual que vieram do Claude Design. A vitrine com tudo
renderizado fica em `/design-system`.

As cores são as da própria AVLE: papel, bege, terracota e o verde-tinta da marca.
Tela nova nasce com os componentes de `@/design-system`, e cor, fonte,
espaçamento e raio saem de token, nunca de valor escrito à mão. Os painéis que
estão no ar usam a mesma paleta, pelos tons do `@theme` de `app/globals.css`,
mas ainda não usam os componentes. Como usar, como criar um componente e o que
ainda diverge do visual no ar estão em
[design-system/README.md](design-system/README.md).

## Publicação

A Vercel publica a partir de `main`. Dar push numa branch de feature não muda
nada do que está no ar: a mudança só sai depois do merge em `main`.

## Documentação

- [DESIGN.md](DESIGN.md): contrato visual, tokens e regras de conteúdo e visual
- [design-system/README.md](design-system/README.md): uso do design system, mapa da biblioteca e como criar um componente
- [design-system/docs/componentes.md](design-system/docs/componentes.md): catálogo de componentes
- [docs/fila-de-espera.md](docs/fila-de-espera.md): contrato de API da fila de espera
- [AGENTS.md](AGENTS.md): instruções para agentes de código (o `CLAUDE.md` importa este arquivo)

## Saiba mais sobre o Next.js

- [Documentação do Next.js](https://nextjs.org/docs): recursos e API.
- [Learn Next.js](https://nextjs.org/learn): tutorial interativo.
- [Repositório do Next.js no GitHub](https://github.com/vercel/next.js).
- [Publicação na Vercel](https://nextjs.org/docs/app/building-your-application/deploying).

A documentação da versão instalada vem junto do pacote, em
`node_modules/next/dist/docs/`, e é a que vale para este projeto.
