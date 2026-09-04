'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

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
 * O envio manual das cobranças do mês, pelo WhatsApp da loja.
 *
 * Existe enquanto a conta da Meta não é liberada. Cada botão abre a conversa
 * da cliente com a mensagem já escrita — quem envia é a pessoa, do número da
 * loja, uma por vez. Não é disparo automático, e é justamente por isso que não
 * corre risco de o número ser bloqueado.
 *
 * O texto vem pronto do servidor, e não é montado aqui. É o mesmo que será
 * submetido como modelo à Meta: quando o envio automático entrar, a cliente
 * recebe exatamente o que já recebia.
 */
export default function EnvioDeCobrancasWhatsapp({ grupoId }: { grupoId?: number }) {
  const [lista, setLista] = useState<Lista | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [enviados, setEnviados] = useState<number[]>([]);
  const [busca, setBusca] = useState('');

  // A busca não toca em estado: quem guarda o resultado é quem chama. A regra
  // do React proíbe setState no corpo síncrono do efeito, porque dispara uma
  // segunda renderização em cascata - então aqui ele só acontece dentro das
  // continuações da promessa.
  const buscarDados = useCallback(async (): Promise<Lista> => {
    // Sem grupo, vem a base inteira - e como o painel do admin usa, porque
    // quem cobra e a AVLE e nao cada loja.
    const rota = grupoId
      ? `${API_URL}/api/cobranca/envios-do-mes?grupoId=${grupoId}`
      : `${API_URL}/api/cobranca/envios-do-mes`;
    const resposta = await apiFetch(rota);
    if (!resposta.ok) throw new Error('lista indisponivel');
    return resposta.json();
  }, [grupoId]);

  useEffect(() => {
    let ativo = true;
    buscarDados()
      .then((dados) => {
        if (!ativo) return;
        setLista(dados);
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
      .then((dados) => setLista(dados))
      .catch(() => setErro('Não foi possível carregar as cobranças do mês.'))
      .finally(() => setCarregando(false));
  };

  const abrirWhatsapp = (envio: Envio, mensagem: string, marcarComoEnviado: boolean) => {
    // O 55 é o código do país. O cadastro guarda onze dígitos, sem ele.
    const destino = envio.telefone.length === 11 ? `55${envio.telefone}` : envio.telefone;
    window.open(`https://wa.me/${destino}?text=${encodeURIComponent(mensagem)}`, '_blank');

    // Marca local, só para quem envia não perder o lugar na lista. Abrir a
    // conversa não é ter enviado, e o servidor não tem como saber disso.
    if (marcarComoEnviado && !enviados.includes(envio.clienteId)) {
      setEnviados([...enviados, envio.clienteId]);
    }
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

  const todosOsEnvios = lista?.envios ?? [];
  const envios = busca.trim()
    ? todosOsEnvios.filter((e) => e.nome.toLowerCase().includes(busca.trim().toLowerCase()))
    : todosOsEnvios;

  // Agrupado por loja: quem administra atende várias, e mandar uma unidade
  // inteira de uma vez evita pular de uma cliente da Caza Liz para outra de
  // outra loja no meio da sequência.
  const porLoja = envios.reduce<Record<string, Envio[]>>((mapa, envio) => {
    const loja = envio.loja || 'Sem loja';
    (mapa[loja] = mapa[loja] || []).push(envio);
    return mapa;
  }, {});
  const lojas = Object.keys(porLoja).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // A próxima que ainda não foi enviada. É o que transforma "procurar na lista
  // e clicar" em só clicar - o WhatsApp abre uma conversa por vez, então o
  // ganho possível é tirar a busca do caminho, e não mandar todas de uma vez.
  const proximaDaLoja = (loja: string) =>
    porLoja[loja].find((e) => !enviados.includes(e.clienteId));

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
          <span><strong className="text-[#0B1E14]">{lista?.clientesParaAvisar ?? 0}</strong> a avisar</span>
          {(lista?.jaPagas ?? 0) > 0 && <span>{lista?.jaPagas} já pagas</span>}
          {(lista?.semCelular ?? 0) > 0 && (
            <span className="text-amber-700">{lista?.semCelular} sem celular</span>
          )}
        </div>
      </div>

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
          const daLoja = porLoja[loja];
          const faltam = daLoja.filter((e) => !enviados.includes(e.clienteId)).length;
          const proxima = proximaDaLoja(loja);

          return (
            <div key={loja}>
              <div className="px-5 py-2.5 bg-stone-50 border-y border-[#DFD9CE] flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  {loja} · {daLoja.length} cliente{daLoja.length > 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  disabled={!proxima}
                  onClick={() => proxima && abrirWhatsapp(proxima, proxima.mensagemCobranca, true)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default bg-[#BD6B42] text-white"
                >
                  {proxima ? `Enviar próxima (${faltam})` : 'Todas enviadas'}
                </button>
              </div>

              <ul className="divide-y divide-[#DFD9CE]">
                {daLoja.map((envio) => {
                  const jaEnviado = enviados.includes(envio.clienteId);
                  return (
                    <li key={envio.clienteId} className="px-5 py-3.5 flex flex-wrap items-center gap-3 justify-between">
                      <div className="min-w-0">
                        <p className={`text-xs font-bold ${jaEnviado ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                          {envio.nome}
                        </p>
                        <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                          {envio.total}
                          {envio.parcelas > 1 && ` · ${envio.parcelas} planos`}
                          {(envio.outrosGrupos ?? 0) > 0 &&
                            ` · a mensagem já cobre ${envio.outrosGrupos} plano(s) de outra turma`}
                        </p>
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
                            jaEnviado ? 'bg-stone-100 text-stone-400' : 'bg-[#0B1E14] text-white hover:bg-opacity-90'
                          }`}
                        >
                          {jaEnviado ? 'Enviar de novo' : 'Cobrança'}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}

      <div className="px-5 py-3 bg-stone-50 border-t border-[#DFD9CE]">
        <p className="text-[10px] text-stone-400 leading-relaxed">
          O botão abre o WhatsApp com a mensagem escrita. Confira e envie você mesma — o disparo
          é manual de propósito, para o número da loja não ser bloqueado por envio em massa.
        </p>
      </div>
    </div>
  );
}
