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
};

export default nextConfig;
