# Fila de espera — contrato de API

O frontend da fila de espera está implementado e no ar, mas depende de campos e
endpoints que **ainda precisam existir no backend**. Enquanto eles não existirem,
a tela se comporta exatamente como antes: nenhum grupo é escondido e a fila
aparece vazia. Nada quebra.

Este documento descreve o que a API precisa entregar.

## 1. Disponibilidade do grupo (alteração em endpoint existente)

`GET /api/grupos/loja/:lojaId` hoje devolve:

```json
{ "id": 12, "nome": "Clube Sala de Estar", "valorParcela": 250.0, "duracaoMeses": 24, "quantidadeMaxCotas": 30 }
```

Precisa passar a devolver **dois campos a mais** em cada grupo:

| Campo           | Tipo                        | Significado                                  |
| --------------- | --------------------------- | -------------------------------------------- |
| `status`        | `"ABERTO"` \| `"ENCERRADO"` | Grupo encerrado não aceita mais participantes |
| `cotasOcupadas` | `number`                    | Quantas cotas já estão preenchidas            |

A regra de disponibilidade vive em [`app/lib/grupos.ts`](../app/lib/grupos.ts) e é
usada pelos dois painéis, para que loja e cliente nunca discordem:

- **encerrado** → `status === "ENCERRADO"`
- **lotado** → `quantidadeMaxCotas - cotasOcupadas === 0`
- **disponível** → não encerrado **e** com vaga

Os dois campos são opcionais no tipo. Se vierem ausentes ou não numéricos, o
grupo é tratado como **aberto** — escolha deliberada: tratar desconhecido como
"cheio" esconderia todos os grupos de todas as clientes de uma vez.

## 2. Endpoints da fila

### `GET /api/lojas/:lojaId/fila-espera`

Usado pelo painel da loja. Devolve a fila **já ordenada por ordem de chegada** —
a tela numera as posições pela ordem do array, não reordena.

```json
[
  {
    "id": 4,
    "clienteId": 87,
    "nome": "Maria Souza",
    "email": "maria@exemplo.com",
    "telefone": "45999998888",
    "cpf": "12345678901",
    "criadoEm": "2026-08-14T13:02:00Z"
  }
]
```

### `POST /api/lojas/:lojaId/fila-espera`

A cliente entra na fila. Corpo: `{ "clienteId": 87 }`.

Deve ser **idempotente**: se a pessoa já está na fila daquela loja, não criar
uma segunda linha nem mudar a posição dela.

### `DELETE /api/lojas/:lojaId/fila-espera/:filaId`

Remove da fila. Usado pela loja (botão "Remover") e pela própria cliente
(link "Sair da fila de espera").

### `POST /api/lojas/:lojaId/fila-espera/:filaId/convocar`

A loja convoca alguém da fila para um grupo. Corpo: `{ "grupoId": 12 }`.

O servidor deve, **numa transação**:

1. revalidar que o grupo ainda tem vaga — entre a tela carregar e a loja clicar,
   a última cota pode ter sido preenchida por outro caminho;
2. vincular a cliente ao grupo;
3. remover a pessoa da fila.

Em caso de falha, devolver 4xx com `{ "erro": "mensagem" }` ou texto puro — a
tela sabe ler os dois formatos e mostra a mensagem para a loja.

### `GET /api/usuarios/:userId/fila-espera`

Usado pelo painel da cliente para saber em quais lojas ela está esperando e em
que posição. Mesmo formato de lista por loja que `acessos-loja` já usa:

```json
[{ "id": 4, "lojaId": 3, "posicao": 2, "criadoEm": "2026-08-14T13:02:00Z" }]
```

`posicao` é opcional. Se vier ausente, a tela apenas diz que a cliente está na
fila, sem citar o número.

## 3. Comportamento das telas

**Painel da loja** — aba "Fila de Espera", com contador no menu lateral. Lista
posição, cliente, contato e data de entrada. "Convocar" abre um modal que só
oferece grupos com vaga; o botão fica desabilitado quando não há nenhum. A aba
de Grupos ganhou etiqueta de **Aberto / Lotado / Encerrado** por grupo.

**Painel da cliente** — grupos encerrados ou lotados somem da vitrine. Exceção
importante: um grupo em que ela **já tem cota** continua visível mesmo encerrado,
senão ela perderia o acesso ao painel do próprio clube. Quando a loja tem grupos
mas nenhum disponível, aparece a mensagem de grupos preenchidos com o botão
"Entrar na fila de espera"; se já estiver na fila, aparece a posição e a opção de
sair. A mensagem de "ainda não lançou nenhum grupo" continua para lojas sem
grupo algum — são situações diferentes.
