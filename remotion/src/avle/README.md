# AVLE: apresentação para lojistas (30 s, vertical)

Composições: `AvleApresentacao` (1080×1920, 30 fps, 900 frames) e `AvleCapa`
(1 frame, a pergunta do gancho). Comandos rodados de dentro de `remotion/`.

```bash
npx remotion studio src/index.ts   # conferir no navegador
npm run avle                       # frames → mp4 → capa
```

`npm run avle` gera `out/avle-apresentacao.mp4` e `out/avle-capa.png`.

## Por que o render tem duas etapas

O `npx remotion render src/index.ts AvleApresentacao out/avle-apresentacao.mp4`
não funciona nesta máquina: o compositor do Remotion 4.0.532 exige macOS 15,
e no macOS 13 ele renderiza tudo e morre ao juntar o vídeo, com
`Symbol not found: _AVCaptureDeviceTypeContinuityCamera`. Então o Remotion só
renderiza os frames (`avle:frames`) e o ffmpeg do sistema monta o mp4
(`avle:montar`, em `scripts/avle-montar.sh`). Num macOS 15 o comando direto
funciona, e aí vale a prop `comNarracao`.

## Áudio

- **No Studio e num render direto**, a narração entra com a prop
  `comNarracao: true` e a trilha com `comTrilha: true`. As duas começam em
  `false` para o vídeo renderizar antes de os arquivos existirem.
- **No `npm run avle`**, quem decide é o arquivo: se `public/avle/narracao.mp3`
  ou `public/avle/trilha.mp3` existir, o `avle-montar.sh` mistura. A trilha entra
  a 0,12 com fade-out nos últimos 15 frames, os mesmos números de `audio` em
  `timing.ts`.

## Onde mexer

| Para | Arquivo |
| --- | --- |
| Retemporizar uma cena ou uma batida | `timing.ts` |
| Trocar texto falado, legenda ou texto da tela | `roteiro.ts` |
| Trocar o @ do CTA | `PERFIL` em `marca.ts` |
| Cores e artes | `marca.ts` (valores do DESIGN.md da raiz) |
| Área segura, escala de tipo | `tema.ts` |

As legendas contam a partir do início da cena, então retemporizar uma cena em
`timing.ts` arrasta as legendas dela junto.

## Roteiro com minutagem

O tempo de cada legenda é a janela em que aquela fala deve caber. Grave em cima
destas janelas, ou ajuste `legendas` em `roteiro.ts` depois de gravar.

| Tempo | Cena | Fala |
| --- | --- | --- |
| 0,0–3,0 | Gancho | "E se o seu cliente pagasse antes de levar o produto?" (o "ANTES" bate em 1,1 s) |
| 3,1–4,5 | Dor | "Vender parcelado hoje" |
| 4,5–6,1 | | "é correr atrás de atraso," |
| 6,1–8,0 | | "cobrar no braço e torcer pra receber." |
| 8,1–9,3 | Virada | "Com a AVLE," |
| 9,3–11,0 | | "sua loja monta um clube de compras." |
| 11,1–12,7 | Como funciona · 1 | "A cliente entra num grupo" |
| 12,7–14,5 | | "e paga uma parcela fixa por mês." |
| 14,5–16,5 | Como funciona · 2 | "A gente cobra pelo WhatsApp." |
| 16,6–18,3 | Como funciona · 3 | "Todo mês tem sorteio auditável" |
| 18,3–19,4 | | "pela Loteria Federal," |
| 19,4–21,0 | | "e quem é contemplada retira o produto na sua loja." |
| 21,1–23,0 | Benefício | "Dinheiro entrando todo mês," |
| 23,0–25,0 | | "direto na conta da sua loja." |
| 25,0–29,3 | CTA | "Quer montar o primeiro grupo da sua loja? Chama a gente no WhatsApp. Link na bio." |
| 29,3–30,0 | | silêncio; a imagem fica parada |

## Artes e fontes

| Arquivo | Origem |
| --- | --- |
| `public/avle/*.png` | copiados de `design-system/assets/` sem alteração |
| `public/fonts/urbanist-latin-{300..700}-normal.woff2` | `node_modules/@fontsource/urbanist`, SIL OFL 1.1 (`public/fonts/Urbanist-LICENSE.txt`) |
