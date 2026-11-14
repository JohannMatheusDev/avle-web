import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A raiz do projeto, dita explicitamente.
  //
  // Existe um package.json solto em /Users/johann — sobra de um `npm install`
  // rodado na pasta pessoal. Sem esta linha, o Next sobe a arvore procurando
  // lockfile, encontra aquele antes de chegar aqui e assume a home como raiz
  // do projeto: os caminhos passam a ser resolvidos a partir dela, e modulos
  // que estao aqui dentro aparecem como ausentes.
  //
  // O editor faz a mesma busca por conta propria. Enquanto aquele arquivo
  // existir, o VS Code vai continuar dizendo que nao acha o react.
  turbopack: {
    root: __dirname,
  },
  // Cabeçalhos de segurança em todas as páginas. frame-ancestors/X-Frame-Options
  // impedem que outro site carregue o painel escondido num iframe e induza o
  // clique (clickjacking); nosniff e Referrer-Policy fecham vazamentos menores.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
