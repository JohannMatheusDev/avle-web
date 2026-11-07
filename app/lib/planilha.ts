/**
 * Planilha para baixar, em Excel (.xlsx) ou CSV, montada no navegador.
 *
 * O Excel é o padrão: abre direto, com os valores como número (soma e
 * filtra), o cabeçalho fixo e com filtro, e uma aba para cada parte do
 * relatório. O CSV fica para quem vai importar em outro sistema: ponto e
 * vírgula, BOM e vírgula decimal, que é o que o Excel em português espera.
 *
 * O .xlsx é escrito aqui mesmo, sem biblioteca: é um zip (sem compressão)
 * com meia dúzia de XMLs. Uma biblioteca de planilha pesaria mais do que
 * todo o resto da tela para gerar uma tabela simples.
 */

export type Celula = string | number | null | undefined;
export type Formato = 'xlsx' | 'csv';

export type Aba = {
  nome: string;
  linhas: Celula[][];
  /** Colunas (a partir de 0) com duas casas decimais, como valor em reais. */
  decimais?: number[];
  /** A primeira linha é cabeçalho: fica fixa, em negrito e com filtro. Padrão: sim. */
  cabecalho?: boolean;
  /** Filtro no cabeçalho. Padrão: sim, quando há cabeçalho. */
  filtro?: boolean;
};

export const FORMATOS: { formato: Formato; rotulo: string; ajuda: string }[] = [
  { formato: 'xlsx', rotulo: 'Excel (.xlsx)', ajuda: 'Abre direto, com colunas, filtros e valores somáveis' },
  { formato: 'csv', rotulo: 'CSV (.csv)', ajuda: 'Texto simples, para importar em outro sistema' },
];

/** Baixa as abas no formato escolhido. O nome vai sem extensão. */
export function baixarPlanilha(nome: string, abas: Aba[], formato: Formato) {
  if (formato === 'xlsx') {
    baixar(`${nome}.xlsx`, new Blob([xlsx(abas)],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  } else {
    baixar(`${nome}.csv`, new Blob(['﻿' + csv(abas)], { type: 'text/csv;charset=utf-8' }));
  }
}

function baixar(nome: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Lê um CSV de ponto e vírgula (como o extrato que vem da API), para virar
 * Excel. Aspas duplas escapam o separador e a quebra de linha.
 */
export function lerCsv(texto: string): string[][] {
  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = '';
  let aspas = false;
  const t = texto.replace(/^﻿/, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"' && t[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ';') { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (campo !== '' || linha.length > 0) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

/** "1.234,56" ou "1234,56" vira 1234.56; o que não é número volta como veio. */
export function numeroBr(v: string): Celula {
  const t = v.trim();
  if (!/^-?[\d.]*\d(,\d+)?$/.test(t)) return v;
  return Number(t.replace(/\./g, '').replace(',', '.'));
}

/* --------------------------------------------------------------------- CSV */

function csv(abas: Aba[]) {
  const partes: string[] = [];
  abas.forEach((aba, i) => {
    const decimais = colunasDecimais(aba);
    // Uma aba só por arquivo no CSV: as outras vêm abaixo, com o nome em cima.
    if (i > 0) partes.push('', celulaCsv(aba.nome));
    for (const l of aba.linhas) {
      partes.push(l.map((c, j) => (typeof c === 'number' ? numeroCsv(c, decimais.has(j)) : celulaCsv(c))).join(';'));
    }
  });
  return partes.join('\r\n');
}

// O que começa com = + - @ ganha um apóstrofo: nome de cliente vem de
// cadastro, e o Excel executaria uma fórmula escrita ali.
function celulaCsv(v: Celula) {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const numeroCsv = (v: number, decimal: boolean) =>
  (decimal || !Number.isInteger(v) ? v.toFixed(2) : String(v)).replace('.', ',');

/* -------------------------------------------------------------------- XLSX */

// Coluna com algum valor quebrado também ganha duas casas: assim R$ 50 e
// R$ 129,90 saem alinhados.
function colunasDecimais(aba: Aba) {
  const d = new Set(aba.decimais ?? []);
  aba.linhas.forEach((l, i) => {
    if (i === 0 && aba.cabecalho !== false) return;
    l.forEach((c, j) => { if (typeof c === 'number' && !Number.isInteger(c)) d.add(j); });
  });
  return d;
}

const xml = (v: string) => v
  // Caractere de controle não existe em XML: o Excel recusaria o arquivo.
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function coluna(n: number) {
  let s = '';
  for (n += 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function nomesDasAbas(abas: Aba[]) {
  const usados = new Set<string>();
  return abas.map((a, i) => {
    const base = a.nome.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || `Planilha ${i + 1}`;
    let nome = base;
    for (let n = 2; usados.has(nome.toLowerCase()); n++) nome = `${base.slice(0, 28)} ${n}`;
    usados.add(nome.toLowerCase());
    return nome;
  });
}

// Estilos: 0 normal, 1 cabeçalho em negrito, 2 número com duas casas.
const ESTILOS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  + '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
  + '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
  + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
  + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
  + '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
  + '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
  + '<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>'
  + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
  + '</styleSheet>';

function folha(aba: Aba) {
  const cabecalho = aba.cabecalho !== false && aba.linhas.length > 0;
  const decimais = colunasDecimais(aba);
  const colunas = Math.max(1, ...aba.linhas.map((l) => l.length));

  // Largura pela célula mais comprida da coluna, entre 8 e 60 caracteres.
  const larguras = Array.from({ length: colunas }, (_, j) => Math.min(60, Math.max(8,
    ...aba.linhas.map((l) => {
      const c = l[j];
      return c == null ? 0 : typeof c === 'number' ? c.toFixed(2).length + 3 : String(c).length;
    })) + 2));

  const linhas = aba.linhas.map((l, i) => {
    const celulas = l.map((c, j) => {
      if (c == null || c === '') return '';
      const ref = `${coluna(j)}${i + 1}`;
      if (typeof c === 'number' && Number.isFinite(c)) {
        return `<c r="${ref}"${decimais.has(j) ? ' s="2"' : ''}><v>${c}</v></c>`;
      }
      const estilo = cabecalho && i === 0 ? ' s="1"' : '';
      return `<c r="${ref}" t="inlineStr"${estilo}><is><t xml:space="preserve">${xml(String(c))}</t></is></c>`;
    }).join('');
    return `<row r="${i + 1}">${celulas}</row>`;
  }).join('');

  const fim = `${coluna(colunas - 1)}${Math.max(1, aba.linhas.length)}`;
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
    + 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    + `<dimension ref="A1:${fim}"/>`
    + (cabecalho
      ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
      : '<sheetViews><sheetView workbookViewId="0"/></sheetViews>')
    + `<cols>${larguras.map((w, j) => `<col min="${j + 1}" max="${j + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    + `<sheetData>${linhas}</sheetData>`
    + (cabecalho && aba.filtro !== false ? `<autoFilter ref="A1:${fim}"/>` : '')
    + '</worksheet>';
}

function xlsx(abas: Aba[]): Uint8Array<ArrayBuffer> {
  const lista = abas.length > 0 ? abas : [{ nome: 'Planilha', linhas: [] }];
  const nomes = nomesDasAbas(lista);
  const arquivos: [string, string][] = [
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
      + lista.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
      + '</Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
      + '</Relationships>'],
    ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
      + 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
      + nomes.map((n, i) => `<sheet name="${xml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')
      + '</sheets>'
      // O filtro do cabeçalho precisa deste nome, senão o Excel o descarta.
      + (() => {
        const filtros = lista.map((a, i) => {
          if (a.cabecalho === false || a.filtro === false || a.linhas.length === 0) return '';
          const colunas = Math.max(1, ...a.linhas.map((l) => l.length));
          const ref = `'${nomes[i].replace(/'/g, "''")}'!$A$1:$${coluna(colunas - 1)}$${a.linhas.length}`;
          return `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">${xml(ref)}</definedName>`;
        }).join('');
        return filtros ? `<definedNames>${filtros}</definedNames>` : '';
      })()
      + '</workbook>'],
    ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + lista.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
      + `<Relationship Id="rId${lista.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
      + '</Relationships>'],
    ['xl/styles.xml', ESTILOS],
    ...lista.map((a, i): [string, string] => [`xl/worksheets/sheet${i + 1}.xml`, folha(a)]),
  ];
  return zip(arquivos);
}

/* --------------------------------------------------------------------- ZIP */

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(dados: Uint8Array) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < dados.length; i++) c = CRC[(c ^ dados[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/** Zip sem compressão (método 0, "store"), que todo leitor de planilha aceita. */
function zip(arquivos: [string, string][]): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder();
  const agora = new Date();
  const hora = (agora.getHours() << 11) | (agora.getMinutes() << 5) | Math.floor(agora.getSeconds() / 2);
  const dia = ((agora.getFullYear() - 1980) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate();

  const partes: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let posicao = 0;

  for (const [nome, conteudo] of arquivos) {
    const n = enc.encode(nome);
    const d = enc.encode(conteudo);
    const crc = crc32(d);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034B50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // nomes em UTF-8
    local.setUint16(8, 0, true);
    local.setUint16(10, hora, true);
    local.setUint16(12, dia, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, d.length, true);
    local.setUint32(22, d.length, true);
    local.setUint16(26, n.length, true);
    local.setUint16(28, 0, true);

    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014B50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true);
    c.setUint16(12, hora, true);
    c.setUint16(14, dia, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, d.length, true);
    c.setUint32(24, d.length, true);
    c.setUint16(28, n.length, true);
    c.setUint32(42, posicao, true);

    partes.push(new Uint8Array(local.buffer), n, d);
    central.push(new Uint8Array(c.buffer), n);
    posicao += 30 + n.length + d.length;
  }

  const tamanhoCentral = central.reduce((s, p) => s + p.length, 0);
  const fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054B50, true);
  fim.setUint16(8, arquivos.length, true);
  fim.setUint16(10, arquivos.length, true);
  fim.setUint32(12, tamanhoCentral, true);
  fim.setUint32(16, posicao, true);

  const tudo = [...partes, ...central, new Uint8Array(fim.buffer)];
  const saida = new Uint8Array(new ArrayBuffer(tudo.reduce((s, p) => s + p.length, 0)));
  let o = 0;
  for (const p of tudo) { saida.set(p, o); o += p.length; }
  return saida;
}
