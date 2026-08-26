// Regra unica de disponibilidade de um grupo de compras.
//
// O painel da loja e o painel da cliente precisam concordar sobre o que e um
// grupo "aberto". Antes cada tela decidia por conta propria, e a cliente
// enxergava grupo ja encerrado ou lotado como se desse para entrar.
//
// O backend passou a enviar dois campos novos em GET /api/grupos/loja/:id:
//   status        'ABERTO' | 'ENCERRADO'
//   cotasOcupadas quantas cotas do grupo ja estao preenchidas
//   permiteEntradaAposEncerrar  excecao da loja, explicada em grupoDisponivel
//
// Os dois sao opcionais de proposito. Enquanto a API antiga nao envia nada, o
// grupo e tratado como aberto e a tela se comporta como antes, sem esconder
// grupo nenhum por engano.

export interface GrupoComVagas {
  quantidadeMaxCotas?: number | null;
  cotasOcupadas?: number | null;
  status?: string | null;
  permiteEntradaAposEncerrar?: boolean | null;
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
//
// A excecao existe para a loja que fechou o grupo e depois perdeu gente no meio
// do periodo. A vaga de quem desistiu continua valendo, mas a regra normal
// sumia com o grupo inteiro e deixava esse lugar preso ate a loja reabrir tudo.
// Quando a loja tem a excecao ligada, o grupo encerrado volta a aparecer - e
// ainda assim so enquanto sobrar vaga, que e o ponto todo.
export function grupoDisponivel(grupo: GrupoComVagas | null | undefined): boolean {
  if (grupoEncerrado(grupo) && !grupo?.permiteEntradaAposEncerrar) return false;

  const vagas = vagasDoGrupo(grupo);
  return vagas === null ? true : vagas > 0;
}
