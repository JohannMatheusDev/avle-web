// Regra unica de disponibilidade de um grupo de compras.
//
// O painel da loja e o painel da cliente precisam concordar sobre o que e um
// grupo "aberto". Antes cada tela decidia por conta propria, e a cliente
// enxergava grupo ja encerrado ou lotado como se desse para entrar.
//
// O backend passou a enviar dois campos novos em GET /api/grupos/loja/:id:
//   status        'ABERTO' | 'ENCERRADO'
//   cotasOcupadas quantas cotas do grupo ja estao preenchidas
//
// Os dois sao opcionais de proposito. Enquanto a API antiga nao envia nada, o
// grupo e tratado como aberto e a tela se comporta como antes, sem esconder
// grupo nenhum por engano.

export interface GrupoComVagas {
  quantidadeMaxCotas?: number | null;
  cotasOcupadas?: number | null;
  status?: string | null;
}

export function grupoEncerrado(grupo: GrupoComVagas | null | undefined): boolean {
  return String(grupo?.status ?? '').toUpperCase() === 'ENCERRADO';
}

// Devolve null quando o servidor nao informou a ocupacao. null significa
// "nao da para saber", que e diferente de zero vagas: tratar desconhecido
// como cheio esconderia todos os grupos da cliente.
export function vagasDoGrupo(grupo: GrupoComVagas | null | undefined): number | null {
  const maximo = Number(grupo?.quantidadeMaxCotas);
  const ocupadas = Number(grupo?.cotasOcupadas);

  if (!Number.isFinite(maximo) || !Number.isFinite(ocupadas)) return null;

  return Math.max(0, maximo - ocupadas);
}

export function grupoLotado(grupo: GrupoComVagas | null | undefined): boolean {
  return vagasDoGrupo(grupo) === 0;
}

// Um grupo so aparece para a cliente entrar se nao encerrou e ainda tem vaga.
export function grupoDisponivel(grupo: GrupoComVagas | null | undefined): boolean {
  if (grupoEncerrado(grupo)) return false;

  const vagas = vagasDoGrupo(grupo);
  return vagas === null ? true : vagas > 0;
}
