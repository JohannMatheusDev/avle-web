/**
 * Serve a pasta do design system por HTTP, para abrir as referências.
 *
 * As telas de exemplo (ui-kits) carregam o JSX pelo Babel do navegador, que
 * busca cada arquivo com XHR — e o Chrome bloqueia XHR em `file://`. Aberta
 * com duplo clique, a tela da loja fica toda preta. Os cards de componente e
 * as guidelines abrem direto do disco; as telas precisam disto.
 *
 * Sem dependência de propósito: o projeto mantém poucas, e isto é só leitura
 * de arquivo. Serve a raiz de `design-system/` e não só `referencia/`, porque
 * as páginas buscam os tokens e as artes da marca um nível acima.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = Number(process.env.PORT) || 4400;
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.jsx': 'text/babel', '.png': 'image/png', '.json': 'application/json',
};

createServer(async (req, res) => {
  const caminho = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const arquivo = join(RAIZ, caminho.endsWith('/') ? caminho + 'index.html' : caminho);
  // Sem esta checagem, `/../../.env.local` sairia da pasta e leria o resto do
  // disco. O separador no fim evita que uma pasta vizinha que só comece com o
  // mesmo nome (`design-system-antigo`) passe no teste.
  if (!arquivo.startsWith(RAIZ + sep)) { res.writeHead(403).end(); return; }
  try {
    const corpo = await readFile(arquivo);
    res.writeHead(200, { 'Content-Type': TIPOS[extname(arquivo)] || 'application/octet-stream' }).end(corpo);
  } catch {
    res.writeHead(404).end('Nao encontrado');
  }
}).listen(PORTA, '127.0.0.1', () => {
  console.log(`Referência do design system em http://localhost:${PORTA}/referencia/`);
});
