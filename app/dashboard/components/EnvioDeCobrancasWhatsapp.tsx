'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

type Envio = {
  clienteId: number;
  nome: string;
  telefone: string;
  parcelas: number;
  total: string;
  vencimento: string;
  mensagemCobranca: string;
  mensagemDuvida: string;
  outrosGrupos?: number;
  loja?: string;
  grupo?: string;
  avisadaEm?: string | null;
  avisadaPor?: string | null;
};

type Lista = {
  competencia: string;
  vencimento: string;
  clientesParaAvisar: number;
  parcelasNessasMensagens: number;
  semCelular: number;
  jaPagas: number;
  envios: Envio[];
};

/**
 * O envio manual das cobranças do mês, pelo WhatsApp da AVLE.
 *
 * Existe enquanto a conta da Meta não é liberada. Cada botão abre a conversa
 * da cliente com a mensagem já escrita — quem envia é a pessoa, uma por vez.
 * Não é disparo automático, e é justamente por isso que não corre risco de o
 * número ser bloqueado.
 *
 * A tela é organizada por loja e por turma porque são quase duzentas conversas
 * numa sessão só: fechar uma turma inteira e ver o contador zerar é o que dá
 * noção de progresso numa lista desse tamanho. Quem já foi avisada fica
 * gravado no servidor, e não no navegador — recarregar a página não perde o
 * lugar, e duas pessoas dividindo o trabalho enxergam a mesma lista.
 *
 * O texto vem pronto do servidor, e não é montado aqui. É o mesmo que será
 * submetido como modelo à Meta: quando o envio automático entrar, a cliente
 * recebe exatamente o que já recebia.
 */
export default function EnvioDeCobrancasWhatsapp({ grupoId }: { grupoId?: number }) {
  const [lista, setLista] = useState<Lista | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [abertas, setAbertas] = useState<string[]>([]);
  const [aviso, setAviso] = useState('');

  // Quem já foi avisada, por cliente, com o quando. Nasce do que o servidor
  // respondeu e é atualizado na hora do clique, sem esperar a rede: a pessoa
  // está numa sequência de cliques e não pode ficar em dúvida se marcou.
  const [avisadas, setAvisadas] = useState<Record<number, string>>({});

  const buscarDados = useCallback(async (): Promise<Lista> => {
    // Sem grupo, vem a base inteira - e como o painel do admin usa, porque
    // quem cobra e a AVLE e nao cada loja.
    const rota = grupoId
      ? `/api/cobranca/envios-do-mes?grupoId=${grupoId}`
      : '/api/cobranca/envios-do-mes';
    const resposta = await apiFetch(rota);
    if (!resposta.ok) throw new Error('lista indisponivel');
    return resposta.json();
  }, [grupoId]);

  const marcasDoServidor = (dados: Lista) => {
    const marcas: Record<number, string> = {};
    dados.envios.forEach((e) => {
      if (e.avisadaEm) marcas[e.clienteId] = e.avisadaEm;
    });
    return marcas;
  };

  // A regra do React proíbe setState no corpo síncrono do efeito, porque
  // dispara uma segunda renderização em cascata - então aqui ele só acontece
  // dentro das continuações da promessa.
  useEffect(() => {
    let ativo = true;
    buscarDados()
      .then((dados) => {
        if (!ativo) return;
        setLista(dados);
        setAvisadas(marcasDoServidor(dados));
        setErro('');
      })
      .catch(() => ativo && setErro('Não foi possível carregar as cobranças do mês.'))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [buscarDados]);

  const tentarDeNovo = () => {
    setCarregando(true);
    setErro('');
    buscarDados()
      .then((dados) => {
        setLista(dados);
        setAvisadas(marcasDoServidor(dados));
      })
      .catch(() => setErro('Não foi possível carregar as cobranças do mês.'))
      .finally(() => setCarregando(false));
  };

  /**
   * Grava no servidor que a mensagem foi mandada.
   *
   * Marca antes de confirmar porque a pessoa segue clicando na próxima, e uma
   * espera de rede a cada conversa somaria minutos ao longo de duzentas. Se a
   * gravação falhar, a marca volta atrás e a tela avisa - errar para o lado de
   * "não marquei" é melhor do que dizer que avisou quem ficou sem mensagem.
   */
  const gravarEnvio = async (clienteId: number, enviada: boolean) => {
    const antes = avisadas;
    setAvisadas((atual) => {
      const copia = { ...atual };
      if (enviada) copia[clienteId] = 'agora';
      else delete copia[clienteId];
      return copia;
    });

    const rota = enviada ? 'enviada' : 'nao-enviada';
    try {
      const resposta = await apiFetch(`/api/cobranca/envios-do-mes/${clienteId}/${rota}`, {
        method: 'POST',
      });
      if (!resposta.ok) throw new Error('nao gravou');
      setAviso('');
    } catch {
      setAvisadas(antes);
      setAviso('Não deu para guardar essa marca. A mensagem pode ter sido enviada mesmo assim.');
    }
  };

  const abrirWhatsapp = (envio: Envio, mensagem: string, marcar: boolean) => {
    // O 55 é o código do país. O cadastro guarda onze dígitos, sem ele.
    const destino = envio.telefone.length === 11 ? `55${envio.telefone}` : envio.telefone;
    window.open(`https://wa.me/${destino}?text=${encodeURIComponent(mensagem)}`, '_blank');
    if (marcar) gravarEnvio(envio.clienteId, true);
  };

  if (carregando) {
    return (
      <div className="bg-white border border-[#DFD9CE] rounded-2xl p-6 mb-6">
        <p className="text-xs text-stone-400 animate-pulse font-bold uppercase tracking-wider">
          Carregando cobranças do mês...
        </p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-white border border-[#DFD9CE] rounded-2xl p-6 mb-6">
        <p className="text-xs text-rose-600 font-medium">{erro}</p>
        <button
          type="button"
          onClick={tentarDeNovo}
          className="mt-3 px-3 py-1.5 bg-[#0B1E14] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  const foiAvisada = (envio: Envio) => avisadas[envio.clienteId] !== undefined;

  const todosOsEnvios = lista?.envios ?? [];
  const envios = busca.trim()
    ? todosOsEnvios.filter((e) => e.nome.toLowerCase().includes(busca.trim().toLowerCase()))
    : todosOsEnvios;

  // Agrupado por loja e, dentro dela, por turma: é a mesma divisão que a loja
  // enxerga no painel dela, então quem envia reconhece a lista sem traduzir
  // nada - e fechar uma turma de dez é uma meta possível, ao contrário de
  // "mandar as cento e noventa e oito".
  const porLoja = envios.reduce<Record<string, Record<string, Envio[]>>>((mapa, envio) => {
    const loja = envio.loja || 'Sem loja';
    const grupo = envio.grupo || 'Sem turma';
    mapa[loja] = mapa[loja] || {};
    (mapa[loja][grupo] = mapa[loja][grupo] || []).push(envio);
    return mapa;
  }, {});

  const lojas = Object.keys(porLoja).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const turmasDa = (loja: string) =>
    Object.keys(porLoja[loja]).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const totalAvisadas = todosOsEnvios.filter(foiAvisada).length;

  // A próxima que ainda não foi avisada. É o que transforma "procurar na lista
  // e clicar" em só clicar - o WhatsApp abre uma conversa por vez, então o
  // ganho possível é tirar a busca do caminho, e não mandar todas de uma vez.
  const proximaDaTurma = (loja: string, turma: string) =>
    porLoja[loja][turma].find((e) => !foiAvisada(e));

  const chaveDaTurma = (loja: string, turma: string) => `${loja} · ${turma}`;
  const alternar = (chave: string) =>
    setAbertas((atual) =>
      atual.includes(chave) ? atual.filter((c) => c !== chave) : [...atual, chave],
    );

  return (
    <div className="bg-white border border-[#DFD9CE] rounded-2xl mb-6 overflow-hidden">
      <div className="px-5 py-4 border-b border-[#DFD9CE] flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Cobranças de {lista?.competencia}
          </p>
          <h4 className="text-sm font-bold text-[#0B1E14] mt-0.5">
            Envio pelo WhatsApp · vence {lista?.vencimento}
          </h4>
        </div>
        {todosOsEnvios.length > 8 && (
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente"
            className="px-3 h-9 rounded-xl border border-[#DFD9CE] bg-white text-xs w-48 focus:outline-none focus:border-[#BD6B42]"
          />
        )}
        <div className="flex items-center gap-4 text-[10px] font-mono text-stone-500">
          <span>
            <strong className="text-[#0B1E14]">
              {totalAvisadas}/{todosOsEnvios.length}
            </strong>{' '}
            avisadas
          </span>
          {(lista?.jaPagas ?? 0) > 0 && <span>{lista?.jaPagas} já pagas</span>}
          {(lista?.semCelular ?? 0) > 0 && (
            <span className="text-amber-700">{lista?.semCelular} sem celular</span>
          )}
        </div>
      </div>

      {aviso && (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200">
          <p className="text-[10px] text-amber-800 font-medium">{aviso}</p>
        </div>
      )}

      {envios.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-xs text-stone-400 italic">
            Nenhuma cobrança em aberto {grupoId ? 'neste grupo' : ''} para {lista?.competencia}.
          </p>
          <p className="text-[10px] text-stone-400 mt-1">
            A lista aparece depois que as parcelas do mês forem emitidas.
          </p>
        </div>
      ) : (
        lojas.map((loja) => {
          const turmas = turmasDa(loja);
          const daLoja = turmas.flatMap((t) => porLoja[loja][t]);
          const avisadasDaLoja = daLoja.filter(foiAvisada).length;

          return (
            <div key={loja}>
              <div className="px-5 py-3 bg-[#0B1E14] text-[#DFD9CE] flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider">{loja}</span>
                <span className="text-[10px] font-mono text-[#DFD9CE]/70">
                  {avisadasDaLoja}/{daLoja.length} avisadas
                </span>
              </div>

              {turmas.map((turma) => {
                const daTurma = porLoja[loja][turma];
                const jaFeitas = daTurma.filter(foiAvisada).length;
                const faltam = daTurma.length - jaFeitas;
                const proxima = proximaDaTurma(loja, turma);
                const chave = chaveDaTurma(loja, turma);
                const aberta = abertas.includes(chave);

                return (
                  <div key={chave}>
                    <div className="px-5 py-3 bg-stone-50 border-y border-[#DFD9CE] flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => alternar(chave)}
                        className="flex items-center gap-3 min-w-0 cursor-pointer text-left"
                      >
                        <span className="text-stone-400 text-[10px] w-3 shrink-0">
                          {aberta ? '▾' : '▸'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 truncate">
                          {turma}
                        </span>
                        {/* Uma bolinha por cliente, na mesma leitura das parcelas
                            no painel da loja: escura é feita, clara é pendente. */}
                        <span className="flex items-center gap-1 shrink-0">
                          {daTurma.slice(0, 20).map((e) => (
                            <span
                              key={e.clienteId}
                              title={`${e.nome}${foiAvisada(e) ? ' · avisada' : ' · pendente'}`}
                              className={`w-2 h-2 rounded-full ${
                                foiAvisada(e) ? 'bg-[#0B1E14]' : 'bg-[#DFD9CE]'
                              }`}
                            />
                          ))}
                          {daTurma.length > 20 && (
                            <span className="text-[9px] text-stone-400 font-mono ml-0.5">
                              +{daTurma.length - 20}
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 shrink-0">
                          {jaFeitas}/{daTurma.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={!proxima}
                        onClick={() => proxima && abrirWhatsapp(proxima, proxima.mensagemCobranca, true)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default bg-[#BD6B42] text-white"
                      >
                        {proxima ? `Enviar próxima (${faltam})` : 'Turma concluída'}
                      </button>
                    </div>

                    {aberta && (
                      <ul className="divide-y divide-[#DFD9CE]">
                        {daTurma.map((envio) => {
                          const jaEnviado = foiAvisada(envio);
                          return (
                            <li
                              key={envio.clienteId}
                              className="px-5 py-3.5 flex flex-wrap items-center gap-3 justify-between"
                            >
                              <div className="min-w-0">
                                <p
                                  className={`text-xs font-bold ${
                                    jaEnviado ? 'text-stone-400 line-through' : 'text-stone-700'
                                  }`}
                                >
                                  {envio.nome}
                                </p>
                                <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                                  {envio.total}
                                  {envio.parcelas > 1 && ` · ${envio.parcelas} planos`}
                                  {(envio.outrosGrupos ?? 0) > 0 &&
                                    ` · a mensagem já cobre ${envio.outrosGrupos} plano(s) de outra turma`}
                                </p>
                                {jaEnviado && (
                                  <p className="text-[10px] text-[#0B1E14] mt-1 flex items-center gap-2">
                                    <span className="font-bold">
                                      Avisada {avisadas[envio.clienteId]}
                                      {envio.avisadaPor && ` · ${envio.avisadaPor}`}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => gravarEnvio(envio.clienteId, false)}
                                      className="text-stone-400 underline cursor-pointer hover:text-stone-600"
                                    >
                                      desfazer
                                    </button>
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => abrirWhatsapp(envio, envio.mensagemDuvida, false)}
                                  className="px-3 py-2 border border-[#DFD9CE] text-stone-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-stone-50 transition-colors cursor-pointer"
                                >
                                  Dúvidas
                                </button>
                                <button
                                  type="button"
                                  onClick={() => abrirWhatsapp(envio, envio.mensagemCobranca, true)}
                                  className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                    jaEnviado
                                      ? 'bg-stone-100 text-stone-400'
                                      : 'bg-[#0B1E14] text-white hover:bg-opacity-90'
                                  }`}
                                >
                                  {jaEnviado ? 'Enviar de novo' : 'Cobrança'}
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })
      )}

      <div className="px-5 py-3 bg-stone-50 border-t border-[#DFD9CE]">
        <p className="text-[10px] text-stone-400 leading-relaxed">
          O botão abre o WhatsApp com a mensagem escrita. Confira e envie você mesma — o disparo
          é manual de propósito, para o número da AVLE não ser bloqueado por envio em massa. Quem
          já foi avisada fica marcado para todo mundo que abrir esta tela.
        </p>
      </div>
    </div>
  );
}
