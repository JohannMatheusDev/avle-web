/**
 * Confere se os tokens do CSS batem com o DESIGN.md da raiz.
 *
 * O DESIGN.md é a fonte da verdade dos tokens, mas quem roda no navegador é o
 * CSS de `design-system/tokens/`. Sem esta conferência, os dois divergiriam na
 * primeira pressa: alguém ajusta um tom no CSS, a tela fica certa, e o
 * contrato passa a mentir para o próximo agente que o ler.
 *
 * Confere nos dois sentidos: todo token do DESIGN.md tem de existir no CSS com
 * o mesmo valor, e todo token de cor, raio, espaçamento, tipo e efeito do CSS
 * tem de estar no DESIGN.md. Sai com erro se algo não bater.
 *
 * O frontmatter é lido por um leitor de YAML mínimo, e não por uma biblioteca:
 * o projeto mantém poucas dependências, e o formato do arquivo é nosso — mapas
 * aninhados de `chave: valor`, sem listas nem texto de várias linhas.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');

function lerFrontmatter(texto) {
  const bloco = texto.match(/^---\n([\s\S]*?)\n---\n/);
  if (!bloco) throw new Error('DESIGN.md sem frontmatter entre ---.');
  const raiz = {};
  const pilha = [{ recuo: -1, no: raiz }];
  for (const linha of bloco[1].split('\n')) {
    if (!linha.trim() || linha.trim().startsWith('#')) continue;
    const recuo = linha.length - linha.trimStart().length;
    const [, chave, resto] = linha.trim().match(/^("?[^":]+"?):\s*(.*)$/) ?? [];
    if (!chave) throw new Error(`Linha que o leitor não entende: "${linha}"`);
    while (pilha.at(-1).recuo >= recuo) pilha.pop();
    const nome = chave.replace(/^"|"$/g, '');
    const pai = pilha.at(-1).no;
    if (resto === '') {
      pai[nome] = {};
      pilha.push({ recuo, no: pai[nome] });
    } else {
      pai[nome] = resto.startsWith('"') ? JSON.parse(resto) : resto;
    }
  }
  return raiz;
}

/** Tokens de cada arquivo, separados em tema escuro (padrão) e claro. */
function lerCss(arquivo) {
  const css = readFileSync(join(AQUI, arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const temas = { escuro: {}, claro: {} };
  for (const [, seletor, corpo] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const tema = seletor.includes('light') ? temas.claro : temas.escuro;
    for (const [, nome, valor] of corpo.matchAll(/--([\w-]+)\s*:\s*([^;]+);?/g)) tema[nome] = valor.trim();
  }
  return temas;
}

const normalizar = (valor) => String(valor).replace(/\s+/g, '').toLowerCase();
/** `{colors.ink-900}` no DESIGN.md é `var(--ink-900)` no CSS. */
const comoCss = (valor) => String(valor).replace(/^\{(?:colors|spacing|rounded)\.([\w-]+)\}$/, 'var(--$1)');

const design = lerFrontmatter(readFileSync(join(RAIZ, 'DESIGN.md'), 'utf8'));
const cores = lerCss('colors.css');
const espaco = lerCss('spacing.css').escuro;
const tipo = lerCss('typography.css').escuro;
const efeitos = lerCss('effects.css');
const erros = [];

function comparar(onde, esperado, noCss) {
  if (noCss === undefined) erros.push(`${onde}: está no DESIGN.md e falta no CSS.`);
  else if (normalizar(comoCss(esperado)) !== normalizar(noCss)) erros.push(`${onde}: DESIGN.md diz ${esperado}, CSS diz ${noCss}.`);
}

// `focus-ring` mora no colors.css mas é uma sombra; no DESIGN.md fica em effects.
const SOMBRA_EM_COLORS = 'focus-ring';

for (const [nome, valor] of Object.entries(design.colors ?? {})) {
  const claro = nome.endsWith('-light');
  const base = claro ? nome.slice(0, -6) : nome;
  comparar(`colors.${nome}`, valor, (claro ? cores.claro : cores.escuro)[base]);
}
for (const [nome, valor] of Object.entries(design.rounded ?? {})) comparar(`rounded.${nome}`, valor, espaco[`radius-${nome}`]);
for (const [nome, valor] of Object.entries(design.spacing ?? {})) {
  comparar(`spacing.${nome}`, valor, espaco[/^\d+$/.test(nome) ? `space-${nome}` : nome]);
}
for (const [nome, valor] of Object.entries(design.effects ?? {})) {
  const claro = nome.endsWith('-light');
  const base = claro ? nome.slice(0, -6) : nome;
  const origem = base === SOMBRA_EM_COLORS ? cores : efeitos;
  comparar(`effects.${nome}`, valor, (claro ? origem.claro : origem.escuro)[base]);
}

// Tipografia: os papéis (`display`) são o atalho `--type-display` do CSS,
// desmontado em peso, tamanho e entrelinha; a escala (`text-h1`) é o tamanho.
const resolver = (valor) => valor.replace(/var\(--([\w-]+)\)/g, (_, nome) => tipo[nome] ?? `var(--${nome})`);
for (const [nome, t] of Object.entries(design.typography ?? {})) {
  if (nome === 'mono') {
    if (!tipo['font-mono']?.includes(t.fontFamily)) erros.push(`typography.mono: ${t.fontFamily} não está em --font-mono.`);
    continue;
  }
  if (nome.startsWith('text-')) { comparar(`typography.${nome}.fontSize`, t.fontSize, tipo[nome]); continue; }
  const atalho = tipo[`type-${nome}`];
  if (!atalho) { erros.push(`typography.${nome}: falta --type-${nome} no CSS.`); continue; }
  const [, peso, tamanho, entrelinha, familia] = resolver(atalho).match(/^(\d+)\s+(\S+)\/(\S+)\s+(.+)$/) ?? [];
  comparar(`typography.${nome}.fontWeight`, t.fontWeight, peso);
  comparar(`typography.${nome}.fontSize`, t.fontSize, tamanho);
  comparar(`typography.${nome}.lineHeight`, t.lineHeight, entrelinha);
  if (!familia?.includes(t.fontFamily)) erros.push(`typography.${nome}.fontFamily: ${t.fontFamily} não está em ${familia}.`);
}

// O caminho de volta: token que só existe no CSS também é divergência.
const noDesign = (grupo, nome) => Object.hasOwn(design[grupo] ?? {}, nome);
for (const [tema, sufixo] of [['escuro', ''], ['claro', '-light']]) {
  for (const nome of Object.keys(cores[tema])) {
    const grupo = nome === SOMBRA_EM_COLORS ? 'effects' : 'colors';
    if (!noDesign(grupo, nome + sufixo)) erros.push(`--${nome} (${tema}): está no colors.css e falta em ${grupo} no DESIGN.md.`);
  }
  for (const nome of Object.keys(efeitos[tema])) {
    if (!noDesign('effects', nome + sufixo)) erros.push(`--${nome} (${tema}): está no effects.css e falta em effects no DESIGN.md.`);
  }
}
for (const nome of Object.keys(espaco)) {
  const [grupo, chave] = nome.startsWith('radius-') ? ['rounded', nome.slice(7)] : ['spacing', nome.startsWith('space-') ? nome.slice(6) : nome];
  if (!noDesign(grupo, chave)) erros.push(`--${nome}: está no spacing.css e falta em ${grupo} no DESIGN.md.`);
}
for (const nome of Object.keys(tipo)) {
  if (nome.startsWith('text-') && !noDesign('typography', nome)) erros.push(`--${nome}: está no typography.css e falta em typography no DESIGN.md.`);
  if (nome.startsWith('type-') && !noDesign('typography', nome.slice(5))) erros.push(`--${nome}: está no typography.css e falta em typography no DESIGN.md.`);
}

if (erros.length) {
  console.error(`DESIGN.md e tokens do CSS divergem em ${erros.length} ponto(s):\n- ${erros.join('\n- ')}`);
  process.exit(1);
}
const total = ['colors', 'typography', 'rounded', 'spacing', 'effects'].reduce((soma, g) => soma + Object.keys(design[g] ?? {}).length, 0);
console.log(`DESIGN.md e tokens do CSS batem (${total} tokens conferidos).`);
