// Utilitários de datas para o sistema AVLE.
// Regras de negócio: vencimento no 5º dia útil de cada mês,
// sorteio sempre no dia 10 de cada mês.

// ── Feriados nacionais fixos (MM-DD) ──────────────────────────────────────────
const FERIADOS_FIXOS = [
  '01-01', // Confraternização Universal
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independência do Brasil
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '12-25', // Natal
];

// ── Páscoa pelo algoritmo de Gauss ────────────────────────────────────────────
function calcularPascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function addDias(data: Date, dias: number): Date {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

function mesmoDia(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

// ── Verifica se uma data é feriado nacional ────────────────────────────────────
function ehFeriado(data: Date): boolean {
  const mmdd = `${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  if (FERIADOS_FIXOS.includes(mmdd)) return true;

  const pascoa = calcularPascoa(data.getFullYear());
  const moveisPassoais = [
    addDias(pascoa, -48), // Segunda de Carnaval
    addDias(pascoa, -47), // Terça de Carnaval
    addDias(pascoa, -2),  // Sexta-feira Santa
    addDias(pascoa, 60),  // Corpus Christi
  ];

  return moveisPassoais.some(f => mesmoDia(f, data));
}

// ── Verifica se é dia útil (seg–sex, sem feriado) ────────────────────────────
export function ehDiaUtil(data: Date): boolean {
  const dow = data.getDay();
  if (dow === 0 || dow === 6) return false;
  return !ehFeriado(data);
}

// ── Retorna o N-ésimo dia útil de um mês ─────────────────────────────────────
export function enesimoDialUtil(ano: number, mes: number, n: number): Date {
  let data = new Date(ano, mes - 1, 1);
  let contagem = 0;
  while (contagem < n) {
    if (ehDiaUtil(data)) contagem++;
    if (contagem < n) data = addDias(data, 1);
  }
  return data;
}

// ── Próximo vencimento (5º dia útil) ─────────────────────────────────────────
export function proximoVencimento(): Date {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let mes = hoje.getMonth() + 1;
  let ano = hoje.getFullYear();
  let venc = enesimoDialUtil(ano, mes, 5);

  // Se hoje já passou do vencimento deste mês, vai para o próximo
  if (hoje > venc) {
    mes++;
    if (mes > 12) { mes = 1; ano++; }
    venc = enesimoDialUtil(ano, mes, 5);
  }

  return venc;
}

// ── Próximo sorteio (dia 10 de cada mês) ─────────────────────────────────────
export function proximoSorteio(): Date {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let mes = hoje.getMonth() + 1;
  let ano = hoje.getFullYear();
  let sorteio = new Date(ano, mes - 1, 10);

  if (hoje > sorteio) {
    mes++;
    if (mes > 12) { mes = 1; ano++; }
    sorteio = new Date(ano, mes - 1, 10);
  }

  return sorteio;
}

// ── Formata Date para DD/MM/AAAA ──────────────────────────────────────────────
export function formatarData(data: Date): string {
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Dias restantes até uma data ───────────────────────────────────────────────
export function diasAte(data: Date): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}
