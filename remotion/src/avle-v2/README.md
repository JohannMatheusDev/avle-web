# AVLE V2: apresentação para lojistas (30 s, vertical)

Composições: `AvleApresentacaoV2` (1080×1920, 30 fps, 900 frames) e
`AvleCapaV2` (o gancho congelado, com o carimbo). A V1 (`AvleApresentacao`,
em `src/avle/`) continua como estava.

```bash
npx remotion studio src/index.ts   # conferir no navegador
npm run avle-v2                    # ritmo → frames → mp4 → capa
```

`npm run avle-v2` gera `out/avle-v2.mp4` e `out/avle-v2-capa.png`. O primeiro
passo, `avle-v2:ritmo`, lista os beats de `timing.ts` e falha se algum trecho
passar de 1,2 s sem estímulo novo.

## Por que o render tem etapas

O `npx remotion render AvleApresentacaoV2 out/avle-v2.mp4` não funciona neste
Mac (macOS 13): o compositor do Remotion 4.0.532 exige macOS 15. O Remotion
renderiza os frames e `scripts/avle-v2-montar.mjs` monta o mp4 com o ffmpeg do
sistema. O mesmo script mistura o áudio, lendo os beats do `timing.ts`.

## Áudio

| Arquivo | Quando entra |
| --- | --- |
| `public/avle/narracao-v2.mp3` | prop `comNarracao` no Studio; no `npm run avle-v2`, se o arquivo existir |
| `public/avle/trilha-v2.mp3` | prop `comTrilha`; a 0,12, com fade-out nos últimos 15 frames |
| `public/avle/sfx/{whoosh,pop,ding,impacto}.mp3` | prop `comSfx`; um efeito em cada beat que tem `som` em `timing.ts` |

As três props começam em `false`, para o vídeo renderizar antes de os
arquivos existirem. Para tirar um efeito, apague o `som` do beat.

## Onde mexer

| Para | Arquivo |
| --- | --- |
| Cenas, transições, beats e o som de cada beat | `timing.ts` |
| Narração, legendas e todo texto da tela | `roteiro.ts` |
| O @ do CTA | `PERFIL` em `marca.ts` |
| Componentes de motion (Notificacao, KineticText, Contador, MockupCelular, BarraDeProgresso, Flash, Shake, Legendas) | `motion/` |
| Peças desenhadas (caderno, celular do gancho, placar, telas, ícones) | `pecas/` |

## Roteiro com minutagem

A janela de cada fala é o tempo em que ela deve caber. Dentro dela, as palavras
da legenda entram no ritmo estimado pelo tamanho de cada uma. Depois de gravar,
ajuste `de`/`ate` em `legendas` (`roteiro.ts`).

| Tempo (s) | Cena | Fala |
| --- | --- | --- |
| 0,07–1,33 | Gancho | "Isso é o celular de uma loja" |
| 1,33–2,50 | | "no dia do vencimento." (cala no congelamento) |
| 3,07–4,27 | Contraste | "Porque vender parcelado" |
| 4,27–5,60 | | "do jeito antigo é isso:" (depois: calendário e "CHEGA.", sem fala) |
| 8,07–9,33 | Virada | "Com a AVLE," |
| 9,33–11,00 | | "sua loja vira um clube de compras." |
| 11,10–12,50 | Como funciona · 1 | "A cliente entra num grupo" |
| 12,50–14,00 | | "com parcela fixa." |
| 14,07–16,33 | Como funciona · 2 | "A AVLE cobra pelo WhatsApp." |
| 17,07–18,53 | Como funciona · 3 | "Todo mês tem sorteio" |
| 18,53–19,60 | | "pela Loteria Federal," |
| 19,60–21,00 | | "e quem é contemplada retira na sua loja." |
| 21,10–23,00 | Benefício | "E o dinheiro cai direto" |
| 23,00–25,00 | | "na conta da sua loja." |
| 25,07–26,50 | CTA | "Quer isso na sua loja?" |
| 26,50–28,17 | | "Chama a gente no WhatsApp." |
| 28,17–29,50 | | "Link na bio." |

## Efeitos sonoros por beat

| Tempo (s) | Som | Beat |
| --- | --- | --- |
| 0,10 · 0,47 · 0,77 · 1,03 · 1,27 · 1,47 · 1,63 · 1,77 · 1,90 · 2,00 · 2,07 · 2,13 · 2,20 · 2,23 · 2,27 | pop | as 15 notificações, acelerando |
| 2,50 | impacto | congela + flash + carimbo |
| 3,00 | whoosh | corte para o caderno |
| 3,10 · 3,67 | whoosh | páginas virando |
| 4,30 | whoosh | corte para a mensagem |
| 4,40 | pop | balão da mensagem |
| 5,60 | whoosh | corte para o calendário |
| 6,53 | impacto | carimbo "ATRASADO" |
| 6,90 | impacto | "CHEGA." |
| 8,20 | impacto | caderno fecha |
| 8,60 | whoosh | árvore cresce |
| 9,40 | pop | wordmark |
| 11,00 | whoosh | celular entra |
| 11,27 | whoosh | cartão do grupo |
| 11,73 | pop | parcela fixa (punch) |
| 14,00 | impacto | "WhatsApp." (quebra de padrão) |
| 14,47 | whoosh | tela da conversa |
| 14,67 | pop | balão da cobrança |
| 15,27 | pop | toque no "Pagar com Pix" |
| 15,53 | ding | "Pago" |
| 16,20 | pop | "Parcelas em dia" |
| 17,00 | whoosh | placar |
| 17,80 · 18,13 · 18,47 | pop | cada dígito travando |
| 18,73 | pop | selo "Auditável · Loteria Federal" |
| 19,00 | impacto | congela + cor invertida |
| 19,27 | ding | "Contemplada!" |
| 19,73 | whoosh | sacola entrando na loja |
| 20,40 | whoosh | zoom para dentro da tela |
| 21,33 · 21,60 · 21,87 · 22,13 · 22,40 · 22,67 | pop | as seis barras |
| 23,20 | pop | etiqueta "R$ 2.700/mês" |
| 23,53 | ding | total fecha |
| 24,27 | whoosh | zoom no total |
| 25,33 | whoosh | "primeiro grupo" |
| 26,00 | pop | botão entra |
| 27,87 | pop | dedo toca o botão |
| 28,13 | whoosh | seta |
| 29,50 | pop | celular do gancho volta no canto (loop) |

## Conteúdo inventado e por quê

- Grupos com nome de flor, clientes "Bruna" e "Cida", nomes do caderno, o
  número "047" e os valores: tudo fictício, como o brief pede.
- O contador do gancho ("27 pagos hoje") vem com a etiqueta "Cena ilustrativa",
  porque o brief proíbe número de resultado apresentado como real. O gráfico do
  benefício tem o selo "valores ilustrativos".
- O ✓✓ azul é a única cor de fora da paleta; sem ela o "lido" não se lê.
