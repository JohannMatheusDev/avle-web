/**
 * O mesmo relatório da planilha, em PDF, baixado direto como arquivo.
 *
 * Carregado só quando alguém escolhe PDF (import dinâmico em planilha.ts):
 * o jsPDF pesa mais do que a tela inteira e não precisa vir com ela.
 *
 * Cada aba vira uma tabela, uma embaixo da outra, com o título do
 * relatório no topo e o número da página no rodapé. Página deitada quando
 * a tabela é larga. As cores são os tokens do design system, lidos na hora
 * do escopo .avle-ds, e não valores escritos aqui.
 */

import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { colunasDecimais, type Aba, type Celula, type InfoDoRelatorio } from './planilha';

type Rgb = [number, number, number];

function paraRgb(v: string): Rgb | null {
  const t = v.trim();
  let m = /^#([0-9a-f]{3})$/i.exec(t);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16)) as Rgb;
  m = /^#([0-9a-f]{6})/i.exec(t);
  if (m) return [0, 2, 4].map((i) => parseInt(m![1].slice(i, i + 2), 16)) as Rgb;
  const r = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(t);
  return r ? [Number(r[1]), Number(r[2]), Number(r[3])] : null;
}

/** Lê as cores dos tokens. Sem o CSS carregado, cai em preto e branco. */
function cores() {
  const preto: Rgb = [0, 0, 0];
  const branco: Rgb = [255, 255, 255];
  let estilo: CSSStyleDeclaration | null = null;
  const sonda = document.createElement('div');
  sonda.className = 'avle-ds';
  sonda.style.display = 'none';
  document.body.appendChild(sonda);
  try {
    estilo = getComputedStyle(sonda);
    const token = (nome: string, reserva: Rgb) => paraRgb(estilo!.getPropertyValue(nome)) ?? reserva;
    return {
      primaria: token('--primary', preto),
      sobrePrimaria: token('--text-on-primary', branco),
      texto: token('--text-primary', preto),
      secundario: token('--text-secondary', preto),
      afundado: token('--surface-sunken', branco),
      borda: token('--border-default', preto),
    };
  } finally {
    sonda.remove();
  }
}

const numero = (v: number, decimal: boolean) => v.toLocaleString('pt-BR', decimal
  ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  : { maximumFractionDigits: 2 });

const vazia = (l: Celula[]) => l.every((c) => c == null || c === '');

export function gerarPdf(nome: string, abas: Aba[], info: InfoDoRelatorio) {
  const c = cores();

  // Só as colunas escolhidas para o PDF; a planilha leva todas.
  const tabelas = abas.map((aba) => {
    const todas = Math.max(0, ...aba.linhas.map((l) => l.length));
    const indices = aba.colunasNoPdf ?? Array.from({ length: todas }, (_, i) => i);
    const decimais = colunasDecimais(aba);
    const temCabecalho = aba.cabecalho !== false && aba.linhas.length > 0;
    const [cabecalho, ...corpo] = temCabecalho ? aba.linhas : [[], ...aba.linhas];
    const linhas = corpo.filter((l) => !vazia(l));
    const numericas = new Set(indices.filter((j) => linhas.some((l) => typeof l[j] === 'number')));
    return {
      aba,
      head: temCabecalho ? [indices.map((j) => String(cabecalho[j] ?? ''))] : undefined,
      body: linhas.map((l) => indices.map((j) => {
        const v = l[j];
        return typeof v === 'number' ? numero(v, decimais.has(j)) : v == null ? '' : String(v);
      })),
      direita: indices.map((j, k) => (numericas.has(j) ? k : -1)).filter((k) => k >= 0),
      colunas: indices.length,
    };
  });

  const larga = Math.max(0, ...tabelas.map((t) => t.colunas)) > 6;
  const doc = new jsPDF({ orientation: larga ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const margem = 12;
  const fonte = Math.max(...tabelas.map((t) => t.colunas)) > 10 ? 7 : 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...c.texto);
  doc.text(info.titulo, margem, 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...c.secundario);
  const sub = doc.splitTextToSize(
    [info.subtitulo, `Gerado em ${new Date().toLocaleString('pt-BR')}`].filter(Boolean).join(' · '),
    largura - 2 * margem,
  ) as string[];
  doc.text(sub, margem, 23);
  let y = 23 + sub.length * 4.5 + 3;

  for (const t of tabelas) {
    if (t.body.length === 0 && !t.head) continue;
    // Com mais de uma aba, cada tabela leva o nome dela em cima.
    if (tabelas.length > 1) {
      if (y > altura - 35) { doc.addPage(); y = 17; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...c.texto);
      doc.text(t.aba.nome, margem, y);
      y += 3;
    }
    autoTable(doc, {
      startY: y,
      head: t.head,
      body: t.body.length > 0 ? t.body : [[{ content: 'Nada a mostrar.', colSpan: t.colunas }]],
      margin: { left: margem, right: margem, top: 14, bottom: 14 },
      theme: 'grid',
      // A linha não se parte entre duas páginas: pula inteira para a próxima.
      rowPageBreak: 'avoid',
      styles: {
        font: 'helvetica', fontSize: fonte, cellPadding: 1.6, overflow: 'linebreak', valign: 'top',
        textColor: c.texto, lineColor: c.borda, lineWidth: 0.1,
      },
      headStyles: { fillColor: c.primaria, textColor: c.sobrePrimaria, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: c.afundado },
      columnStyles: Object.fromEntries(t.direita.map((k) => [k, { halign: 'right' as const }])),
      // Tabela de poucas colunas, como o resumo, fica do tamanho do conteúdo.
      tableWidth: t.colunas <= 3 ? 'wrap' : 'auto',
      // O título da coluna de número acompanha o número, à direita.
      didParseCell: (d) => {
        if (d.section === 'head' && t.direita.includes(d.column.index)) d.cell.styles.halign = 'right';
        // Linha de total em negrito, para não parecer só mais uma linha.
        if (d.section === 'body' && t.aba.ultimaLinhaEhTotal && d.row.index === t.body.length - 1) {
          d.cell.styles.fontStyle = 'bold';
        }
      },
    });
    y = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) + 9;
  }

  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...c.secundario);
    doc.text(`${info.titulo} · página ${i} de ${paginas}`, margem, altura - 7);
    doc.text('AVLE', largura - margem, altura - 7, { align: 'right' });
  }

  doc.save(`${nome}.pdf`);
}
