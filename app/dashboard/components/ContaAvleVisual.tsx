'use client';

/**
 * As peças da Conta AVLE no desenho da referência: o leque de cartões, a
 * faixa de números com tendência, as barras listradas de entradas e saques, o
 * arco de para onde foi o dinheiro, a curva dos dias da semana e a lista de
 * movimentações. Tudo com os componentes de `@/design-system`, dentro de
 * `.avle-ds`; o que é desenho próprio da página está em ContaAvle.module.css.
 */

import { useId, type ReactNode } from 'react';
import { Delta, ListRow, Logo, Money, Sparkline, Tag } from '@/design-system';
import s from './ContaAvle.module.css';

const dataCurta = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const reais = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── O leque ─────────────────────────────────────────────────────────────────

export type CartaoDoLeque = { nome: string; resto?: string; marca?: ReactNode };

export function Leque({
  esquerda, direita, saldo, saldoNota, rotuloEsquerda, rotuloDireita,
}: {
  /** Dois cartões de cada lado do cartão do saldo, do mais afastado ao mais perto. */
  esquerda: [CartaoDoLeque, CartaoDoLeque];
  direita: [CartaoDoLeque, CartaoDoLeque];
  saldo: number | null;
  saldoNota: string;
  rotuloEsquerda?: ReactNode;
  rotuloDireita?: ReactNode;
}) {
  const cartao = (c: CartaoDoLeque, classe: string) => (
    <div className={`${s.cartao} ${classe}`} aria-hidden="true">
      <span className={s.cartaoNome}>{c.nome}{c.resto && <span> {c.resto}</span>}</span>
      {c.marca && <span className={s.cartaoMarca}>{c.marca}</span>}
    </div>
  );
  const [inteiro, centavos] = saldo != null ? reais(saldo).split(',') : ['—', ''];
  return (
    <div className={s.leque}>
      {rotuloEsquerda && <div className={`${s.lequeRotulo} ${s.lequeRotuloEsq}`}>{rotuloEsquerda}</div>}
      {rotuloDireita && <div className={`${s.lequeRotulo} ${s.lequeRotuloDir}`}>{rotuloDireita}</div>}
      {cartao(esquerda[0], s.c1)}
      {cartao(esquerda[1], s.c2)}
      <div className={`${s.cartao} ${s.cartaoDestaque} ${s.c3}`}>
        <div className={s.cartaoDestaqueTopo}>
          <span className={s.cartaoNome}>Saldo <span>disponível</span></span>
          <Logo variant="tree" tone="cream" height={28} />
        </div>
        <span className={s.cartaoSaldo}>
          <span>R$ </span>{inteiro}{centavos && <span>,{centavos}</span>}
        </span>
        <span className={s.cartaoNota}>{saldoNota}</span>
      </div>
      {cartao(direita[0], s.c4)}
      {cartao(direita[1], s.c5)}
    </div>
  );
}

// ── A faixa de números ──────────────────────────────────────────────────────

export type NumeroDaFaixa = {
  rotulo: string;
  valor: number | null;
  variacao?: number | null;
  nota?: string;
  serie?: number[];
};

export function FaixaDeNumeros({ itens }: { itens: NumeroDaFaixa[] }) {
  return (
    <div className={s.numeros}>
      {itens.map((n) => (
        <div key={n.rotulo} className={s.numero}>
          <div>
            <div className={s.numeroRotulo}>{n.rotulo}</div>
            <div className={s.numeroValor}>
              {n.valor != null ? <Money value={n.valor} size={30} /> : <span className={s.pequeno}>indisponível</span>}
              {n.variacao != null && Number.isFinite(n.variacao) && <Delta value={Math.round(n.variacao * 10) / 10} />}
            </div>
            {n.nota && <div className={s.numeroNota}>{n.nota}</div>}
          </div>
          {n.serie && n.serie.length > 1 && <Sparkline data={n.serie} width={96} height={44} area={false} dot={false} />}
        </div>
      ))}
    </div>
  );
}

// ── Barras listradas: entradas em cima, saques espelhados embaixo ───────────

export function BarrasDoPeriodo({ semanas }: { semanas: { inicio: string; entradas: number; saidas: number }[] }) {
  const maiorEntrada = Math.max(1, ...semanas.map((x) => x.entradas));
  const maiorSaida = Math.max(1, ...semanas.map((x) => x.saidas));
  const acesa = semanas.reduce((m, x, i) => (x.entradas > semanas[m].entradas ? i : m), 0);
  const total = semanas.reduce((t, x) => t + x.entradas, 0);
  // Rótulo de uma em cada tantas semanas, para o eixo não embolar; a semana
  // acesa sempre tem o dela, e as vizinhas dela ficam sem.
  const passo = Math.max(1, Math.ceil(semanas.length / 6));
  const comRotulo = (i: number) => i === acesa || (i % passo === 0 && Math.abs(i - acesa) > 1);
  // A etiqueta de valor da barra acesa não pode sair do cartão nas pontas.
  const ancora = acesa >= semanas.length * 0.75 ? s.barraValorFim : acesa <= semanas.length * 0.25 ? s.barraValorInicio : '';
  const media = semanas.length ? total / semanas.length : 0;
  const comSaque = semanas.filter((x) => x.saidas > 0).length;

  return (
    <>
      <div className={s.barrasTotal}>
        <p>Recebido no período</p>
        <Money value={total} size={44} />
      </div>
      <div>
        <div className={s.barras}>
          {semanas.map((x, i) => (
            <div key={x.inicio} className={`${s.barra} ${i === acesa ? s.barraAcesa : ''}`}
              style={{ height: `${Math.max(2, (x.entradas / maiorEntrada) * 100)}%` }}
              title={`Semana de ${dataCurta(x.inicio)}: R$ ${reais(x.entradas)} recebidos`}>
              {i === acesa && x.entradas > 0 && <span className={`${s.barraValor} ${ancora}`}>R$ {reais(x.entradas)}</span>}
            </div>
          ))}
        </div>
        <div className={s.eixo}>
          {semanas.map((x, i) => (
            <span key={x.inicio} className={i === acesa ? s.eixoAceso : ''}>
              {comRotulo(i) ? dataCurta(x.inicio) : ''}
            </span>
          ))}
        </div>
        <div className={s.espelho}>
          {semanas.map((x, i) => (
            <div key={x.inicio} className={`${s.barra} ${i === acesa ? s.barraAcesa : ''}`}
              style={{ height: `${x.saidas > 0 ? Math.max(4, (x.saidas / maiorSaida) * 100) : 2}%` }}
              title={`Semana de ${dataCurta(x.inicio)}: R$ ${reais(x.saidas)} sacados`} />
          ))}
        </div>
      </div>
      <div className={s.legenda}>
        <span><i style={{ background: 'var(--primary)' }} />Entradas por semana</span>
        <span><i style={{ background: 'var(--accent)' }} />Saques, espelhados</span>
      </div>
      <div className={s.resumoDasBarras}>
        <div><span>Média por semana</span><Money value={media} size={20} /></div>
        <div><span>Melhor semana</span><Money value={semanas[acesa]?.entradas ?? 0} size={20} /></div>
        <div><span>Semanas com saque</span><strong>{comSaque} de {semanas.length}</strong></div>
      </div>
    </>
  );
}

// ── O arco: quanto do que entrou ficou e quanto saiu ────────────────────────

export function ArcoDoDinheiro({ entrou, saiu }: { entrou: number; saiu: number }) {
  const idHachura = 'h' + useId().replace(/:/g, '');
  const total = entrou + saiu || 1;
  const parteFicou = entrou > 0 ? Math.max(0, entrou - saiu) / entrou : 0;
  const pctSaiu = entrou > 0 ? Math.min(100, (saiu / entrou) * 100) : 0;
  const pctFicou = 100 - pctSaiu;
  // Meio círculo de raio 80: o comprimento do arco é π·80.
  const comprimento = Math.PI * 80;
  return (
    <>
      <div className={s.arcoLegenda}>
        <span><i style={{ background: 'var(--primary)' }} />Ficou na conta</span>
        <span><i style={{ background: 'var(--border-strong)' }} />Sacado</span>
      </div>
      <svg viewBox="0 0 200 110" width="100%" style={{ display: 'block' }} role="img"
        aria-label={`${pctFicou.toFixed(0)}% do que entrou ficou na conta`}>
        <defs>
          <pattern id={idHachura} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="var(--pedra-400)" strokeWidth="1.5" />
          </pattern>
        </defs>
        <path d="M20,100 A80,80 0 0 1 180,100" fill="none" stroke={`url(#${idHachura})`} strokeWidth="14" strokeLinecap="round" />
        <path d="M20,100 A80,80 0 0 1 180,100" fill="none" stroke="var(--primary)" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${comprimento * parteFicou} ${comprimento}`} />
      </svg>
      <div className={s.arcoNumeros}>
        <div><strong>{pctFicou.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong><span>ficou na conta</span></div>
        <div><strong>{pctSaiu.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong><span>foi sacado</span></div>
      </div>
      <span className={s.pequeno}>Sobre R$ {reais(total === 1 && !entrou ? 0 : entrou)} recebidos no período</span>
    </>
  );
}

// ── A curva dos dias da semana ──────────────────────────────────────────────

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function CurvaDosDias({ porDia }: { porDia: number[] }) {
  const valores = DIAS.map((_, i) => Number(porDia[i]) || 0);
  const maior = Math.max(1, ...valores);
  const media = valores.reduce((a, b) => a + b, 0) / 7;
  const pico = valores.indexOf(Math.max(...valores));
  const largura = 280;
  const altura = 130;
  const x = (i: number) => 10 + (i * (largura - 20)) / 6;
  const y = (v: number) => altura - 12 - (v / maior) * (altura - 34);
  const caminho = (serie: number[]) => serie.reduce((d, v, i) => {
    if (i === 0) return `M${x(0)},${y(v)}`;
    const meio = (x(i - 1) + x(i)) / 2;
    return `${d} C${meio},${y(serie[i - 1])} ${meio},${y(v)} ${x(i)},${y(v)}`;
  }, '');
  const acimaDaMedia = media > 0 ? ((valores[pico] - media) / media) * 100 : 0;

  return (
    <>
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${largura} ${altura}`} width="100%" style={{ display: 'block', overflow: 'visible' }} role="img"
          aria-label={`O dia que mais entra é ${DIAS[pico]}`}>
          <path d={caminho(valores.map(() => media))} fill="none" stroke="var(--border-strong)" strokeWidth="1.2" strokeDasharray="4 4" />
          <path d={caminho([...valores.slice(1), valores[0]].map((v, i) => (v + valores[i]) / 2))} fill="none" stroke="var(--pedra-300)" strokeWidth="1.2" />
          <path d={caminho(valores)} fill="none" stroke="var(--primary)" strokeWidth="2.2" />
          <line x1={x(pico)} x2={x(pico)} y1={y(valores[pico]) - 6} y2={altura - 6} stroke="var(--primary)" strokeWidth="2" />
          <circle cx={x(pico)} cy={y(valores[pico])} r="4" fill="var(--accent)" />
        </svg>
        {valores[pico] > 0 && (
          <span style={{ position: 'absolute', top: 0, left: `${(x(pico) / largura) * 100}%`, transform: 'translate(-50%, -60%)' }}>
            <Tag>{acimaDaMedia >= 0 ? '+' : ''}{acimaDaMedia.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</Tag>
          </span>
        )}
      </div>
      <div className={s.curvaEixo}>
        {DIAS.map((d, i) => <span key={d} className={i === pico ? s.eixoAceso : ''}>{d}</span>)}
      </div>
      <span className={s.pequeno}>
        {valores[pico] > 0
          ? `${DIAS[pico]} é o dia que mais entra: R$ ${reais(valores[pico])} nas últimas semanas.`
          : 'Ainda sem entradas para comparar os dias.'}
      </span>
    </>
  );
}

// ── Movimentações agrupadas por dia ─────────────────────────────────────────

export type Movimento = {
  id: string;
  data: string;
  titulo: string;
  subtitulo?: string;
  valor: number;
  situacao?: ReactNode;
};

const rotuloDoDia = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
};

export function ListaDeMovimentos({ itens, vazio }: { itens: Movimento[]; vazio: string }) {
  if (itens.length === 0) return <p className={s.vazio}>{vazio}</p>;
  const grupos: { dia: string; itens: Movimento[] }[] = [];
  for (const m of itens) {
    const dia = rotuloDoDia(m.data);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.dia === dia) ultimo.itens.push(m);
    else grupos.push({ dia, itens: [m] });
  }
  return (
    <div className={s.lista}>
      {grupos.map((g) => (
        <div key={g.dia}>
          <p className={s.dia}>{g.dia.charAt(0).toUpperCase() + g.dia.slice(1)}</p>
          {g.itens.map((m) => {
            const entrada = m.valor >= 0;
            return (
              <ListRow
                key={m.id}
                icon={entrada ? 'arrow-down-left' : 'arrow-up-right'}
                title={m.titulo}
                subtitle={m.subtitulo}
                trailing={`${entrada ? '+' : '−'}R$ ${reais(Math.abs(m.valor))}`}
                trailingTone={entrada ? 'positive' : 'negative'}
                trailingSub={m.situacao ?? (entrada ? 'Entrada' : 'Saída')}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
