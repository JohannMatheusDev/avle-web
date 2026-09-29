'use client';

/**
 * O saque da Conta AVLE como no app do banco: uma pergunta por tela, com a
 * faixa escura em cima e o botão de seguir embaixo. Para onde vai, a chave, o
 * titular conferido no Asaas, o valor, a revisão, a senha de saque no teclado
 * da tela e o comprovante no fim.
 *
 * A estrutura vem do app da Caixa, as cores são as da AVLE: o verde-tinta faz
 * a faixa e a terracota faz o botão.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Icone } from './Casca';
import { real } from './Indicadores';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

type SenhaDeSaque = { definida: boolean; bloqueadaAte: string | null; liberaEm: string | null };
type Titular = { chave: string; tipo: string; nome?: string | null; documento?: string | null; banco?: string | null };
type SaqueFeito = {
  id: number;
  valor: number;
  chavePix: string;
  tipoChavePix: string;
  status: string;
  comprovanteUrl?: string | null;
  nomeRecebedor?: string | null;
  criadoEm?: string;
};

type Passo = 'carregando' | 'criar-senha' | 'destino' | 'chave' | 'valor' | 'revisao' | 'senha' | 'enviando' | 'comprovante';

const TIPOS: { id: string; rotulo: string; titulo: string; exemplo: string; teclado: 'numeric' | 'email' | 'text' | 'tel' }[] = [
  { id: 'CPF', rotulo: 'CPF', titulo: 'Digite o CPF', exemplo: '000.000.000-00', teclado: 'numeric' },
  { id: 'CNPJ', rotulo: 'CNPJ', titulo: 'Digite o CNPJ', exemplo: '00.000.000/0000-00', teclado: 'numeric' },
  { id: 'PHONE', rotulo: 'Celular', titulo: 'Digite o celular', exemplo: '(42) 99999-0000', teclado: 'tel' },
  { id: 'EMAIL', rotulo: 'E-mail', titulo: 'Digite o e-mail', exemplo: 'nome@exemplo.com', teclado: 'email' },
  { id: 'EVP', rotulo: 'Chave aleatória', titulo: 'Cole a chave aleatória', exemplo: '123e4567-e89b-12d3-a456-426614174000', teclado: 'text' },
];
const nomeDoTipo = (id: string) => TIPOS.find((t) => t.id === id)?.rotulo ?? id;

const SITUACAO: Record<string, { titulo: string; texto: string }> = {
  CONCLUIDO: { titulo: 'Pix enviado', texto: 'O dinheiro já caiu na conta de destino.' },
  PENDENTE: { titulo: 'Pix a caminho', texto: 'O Asaas aprovou o saque. Em instantes o dinheiro cai na conta de destino.' },
  EM_PROCESSAMENTO: { titulo: 'Pix a caminho', texto: 'O banco está processando. Em instantes o dinheiro cai na conta de destino.' },
  SOLICITANDO: { titulo: 'Saque pedido', texto: 'O pedido foi enviado ao Asaas. Acompanhe na lista de saques da Conta AVLE.' },
  AGUARDANDO_APROVACAO: { titulo: 'Saque aguardando aprovação', texto: 'O saque foi registrado e espera a aprovação no Asaas.' },
};

async function lerErro(res: Response, padrao: string) {
  const texto = await res.text().catch(() => '');
  try {
    const corpo = JSON.parse(texto);
    return corpo?.erro || corpo?.mensagem || padrao;
  } catch {
    return texto || padrao;
  }
}

const quando = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function FluxoDeSaque({
  lojaId,
  saldo,
  chavePix,
  tipoChavePix,
  aoFechar,
  aoConcluir,
}: {
  lojaId: number | undefined;
  saldo: number;
  chavePix: string;
  tipoChavePix: string;
  aoFechar: () => void;
  /** Depois do comprovante: a Conta AVLE relê saldo, extrato e saques. */
  aoConcluir: () => void;
}) {
  const [passo, setPasso] = useState<Passo>('carregando');
  const [historico, setHistorico] = useState<Passo[]>([]);
  const [situacao, setSituacao] = useState<SenhaDeSaque>({ definida: false, bloqueadaAte: null, liberaEm: null });
  const [tipo, setTipo] = useState('CPF');
  const [chave, setChave] = useState('');
  const [daLoja, setDaLoja] = useState(false);
  const [titular, setTitular] = useState<Titular | null>(null);
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [feito, setFeito] = useState<SaqueFeito | null>(null);

  const temChaveDaLoja = !!chavePix && !!tipoChavePix;
  const numero = Number(valor.replace(/\./g, '').replace(',', '.'));
  const valorOk = Number.isFinite(numero) && numero > 0 && numero <= saldo;

  const irPara = (proximo: Passo) => {
    setErro('');
    setHistorico((h) => [...h, passo]);
    setPasso(proximo);
  };
  const voltar = () => {
    setErro('');
    const anterior = historico[historico.length - 1];
    if (!anterior || anterior === 'carregando' || passo === 'comprovante') { fechar(); return; }
    setHistorico((h) => h.slice(0, -1));
    setPasso(anterior);
  };
  const fechar = () => (feito ? aoConcluir() : aoFechar());

  const lerSituacao = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/conta/senha-saque`);
      const s: SenhaDeSaque = res.ok ? await res.json() : { definida: false, bloqueadaAte: null, liberaEm: null };
      setSituacao(s);
      return s;
    } catch {
      return null;
    }
  }, [lojaId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura inicial da senha de saque
    lerSituacao().then((s) => setPasso(s && !s.definida ? 'criar-senha' : 'destino'));
  }, [lerSituacao]);

  // Na página inteira do saque, o fundo não rola por trás.
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = antes; };
  }, []);

  const consultar = async (chaveAlvo: string, tipoAlvo: string, doLoja: boolean) => {
    setOcupado(true);
    setErro('');
    try {
      const q = `chave=${encodeURIComponent(chaveAlvo)}&tipo=${encodeURIComponent(tipoAlvo)}`;
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/conta/consultar-chave?${q}`);
      if (!res.ok) throw new Error(await lerErro(res, 'Não foi possível conferir a chave agora.'));
      setTitular(await res.json());
      setDaLoja(doLoja);
      irPara('valor');
    } catch (e) {
      // A chave da loja já foi conferida no cadastro: sem a consulta, segue
      // sem o nome do titular. A chave digitada precisa passar.
      if (doLoja) {
        setTitular({ chave: chaveAlvo, tipo: tipoAlvo });
        setDaLoja(true);
        irPara('valor');
      } else {
        setErro(e instanceof Error ? e.message : 'Não foi possível conferir a chave agora.');
      }
    } finally {
      setOcupado(false);
    }
  };

  const enviar = async (senha: string) => {
    setPasso('enviando');
    setErro('');
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/conta/saque`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: numero.toFixed(2),
          senhaSaque: senha,
          ...(daLoja ? {} : { chavePix: chave.trim(), tipoChavePix: tipo }),
        }),
      });
      if (!res.ok) {
        const mensagem = await lerErro(res, 'Não foi possível fazer o saque.');
        if (/senha de saque/i.test(mensagem)) {
          await lerSituacao();
          setPasso('senha');
          setErro(mensagem);
          return;
        }
        setPasso('revisao');
        setErro(mensagem);
        return;
      }
      setFeito(await res.json());
      setHistorico([]);
      setPasso('comprovante');
    } catch {
      setPasso('revisao');
      setErro('Não conseguimos falar com o servidor. O saque não foi feito. Tente de novo.');
    }
  };

  const tituloDoPasso: Record<Passo, string> = {
    carregando: 'Pix',
    'criar-senha': situacao.definida ? 'Trocar senha de saque' : 'Senha de saque',
    destino: 'Pix',
    chave: 'Pix com chave',
    valor: 'Valor',
    revisao: 'Revisão',
    senha: 'Senha de saque',
    enviando: 'Enviando',
    comprovante: 'Comprovante',
  };
  const ordem: Passo[] = ['destino', 'chave', 'valor', 'revisao', 'senha'];
  const progresso = ordem.indexOf(passo);

  return (
    <div className="fixed inset-0 z-[90] bg-painel-papel flex flex-col animate-fadeIn" role="dialog" aria-modal="true" aria-label="Saque via Pix">
      {/* Faixa do banco: voltar, o nome do passo e fechar. */}
      <header className="bg-painel-tinta text-white">
        <div className="max-w-md mx-auto w-full px-4 h-16 flex items-center gap-3">
          {passo !== 'enviando' && passo !== 'comprovante' ? (
            <button type="button" onClick={voltar} aria-label="Voltar" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center cursor-pointer">
              <Icone nome="voltar" className="w-4 h-4" />
            </button>
          ) : <span className="w-10" />}
          <div className="flex-1 min-w-0 text-center">
            <span className="block text-[15px] font-semibold">{tituloDoPasso[passo]}</span>
            <span className="block text-[11px] text-white/55">Conta AVLE</span>
          </div>
          {passo !== 'enviando' ? (
            <button type="button" onClick={fechar} aria-label="Fechar" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-[15px] cursor-pointer">
              ✕
            </button>
          ) : <span className="w-10" />}
        </div>
        {progresso >= 0 && (
          <div className="h-1 bg-white/10">
            <div className="h-full bg-painel-acento transition-all duration-300" style={{ width: `${((progresso + 1) / ordem.length) * 100}%` }} />
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto w-full px-4 py-6">
          {passo === 'carregando' && <p className="text-[13px] text-stone-400 text-center py-16">Carregando…</p>}

          {passo === 'criar-senha' && (
            <CriarSenha
              lojaId={lojaId}
              troca={situacao.definida}
              aoCriar={(s) => { setSituacao(s); setHistorico([]); setPasso('destino'); }}
            />
          )}

          {passo === 'destino' && (
            <>
              <h1 className="text-[22px] text-painel-tinta leading-tight" style={{ fontWeight: 600 }}>Para onde vai o dinheiro?</h1>
              <p className="text-[13px] text-stone-500 mt-1">Saldo disponível: <strong className="text-painel-tinta tabular-nums">{real(saldo)}</strong></p>

              {(situacao.bloqueadaAte || situacao.liberaEm) && (
                <p className="rounded-[16px] bg-amber-50 text-amber-800 text-[12px] leading-relaxed p-3 mt-4">
                  {situacao.bloqueadaAte
                    ? `A senha de saque está travada por excesso de tentativas até ${quando(situacao.bloqueadaAte)}.`
                    : `A senha de saque foi trocada há pouco. Por segurança, o saque volta a funcionar ${quando(situacao.liberaEm!)}.`}
                </p>
              )}

              {temChaveDaLoja && (
                <>
                  <span className="block text-[12px] text-stone-400 mt-6 mb-2">Chave da loja</span>
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => consultar(chavePix, tipoChavePix, true)}
                    className="w-full bg-white rounded-[20px] p-4 flex items-center gap-3 text-left shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:ring-1 hover:ring-painel-acento/40 transition cursor-pointer disabled:opacity-60"
                  >
                    <span className="w-11 h-11 rounded-full bg-painel-tinta text-white flex items-center justify-center flex-shrink-0">
                      <Icone nome="lojas" className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-semibold text-painel-tinta">Para a conta da loja</span>
                      <span className="block text-[12px] text-stone-500 truncate">{nomeDoTipo(tipoChavePix)} · {chavePix}</span>
                    </span>
                    <span className="text-stone-300 text-[18px]">›</span>
                  </button>
                </>
              )}

              <span className="block text-[12px] text-stone-400 mt-6 mb-2">Pix para outra chave</span>
              <div className="bg-white rounded-[20px] divide-y divide-painel-borda overflow-hidden">
                {TIPOS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setTipo(t.id); setChave(''); irPara('chave'); }}
                    className="w-full px-4 h-[60px] flex items-center gap-3 text-left hover:bg-painel-papel/60 transition-colors cursor-pointer"
                  >
                    <span className="w-9 h-9 rounded-full bg-painel-papel text-painel-acento flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                      {t.id === 'EMAIL' ? '@' : t.id === 'PHONE' ? '☏' : t.id === 'EVP' ? '✱' : t.rotulo.slice(0, 2)}
                    </span>
                    <span className="flex-1 text-[14px] font-medium text-painel-tinta">{t.rotulo}</span>
                    <span className="text-stone-300 text-[18px]">›</span>
                  </button>
                ))}
              </div>
              {erro && <p className="text-[12px] text-rose-600 mt-3">{erro}</p>}
            </>
          )}

          {passo === 'chave' && (() => {
            const t = TIPOS.find((x) => x.id === tipo)!;
            return (
              <>
                <h1 className="text-[22px] text-painel-tinta leading-tight" style={{ fontWeight: 600 }}>{t.titulo}</h1>
                <p className="text-[13px] text-stone-500 mt-1">Vamos conferir no Asaas quem é o titular antes de você confirmar.</p>
                <input
                  autoFocus
                  aria-label={t.titulo}
                  inputMode={t.teclado}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={chave}
                  onChange={(e) => setChave(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && chave.trim()) consultar(chave.trim(), tipo, false); }}
                  placeholder={t.exemplo}
                  className="mt-8 w-full bg-transparent border-b-2 border-painel-borda focus:border-painel-acento outline-none pb-2 text-[20px] text-painel-tinta placeholder:text-stone-300 transition-colors"
                />
                {erro && <p className="text-[12px] text-rose-600 mt-3 leading-snug">{erro}</p>}
              </>
            );
          })()}

          {passo === 'valor' && (
            <>
              <h1 className="text-[22px] text-painel-tinta leading-tight" style={{ fontWeight: 600 }}>Quanto você quer enviar?</h1>
              {titular && (
                <p className="text-[13px] text-stone-500 mt-1 truncate">
                  Para <strong className="text-painel-tinta">{titular.nome || `${nomeDoTipo(titular.tipo)} ${titular.chave}`}</strong>
                </p>
              )}
              <div className="mt-10 flex items-baseline justify-center gap-2">
                <span className="text-[22px] text-stone-400">R$</span>
                <input
                  autoFocus
                  aria-label="Valor"
                  inputMode="decimal"
                  value={valor}
                  onChange={(e) => setValor(e.target.value.replace(/[^\d,.]/g, ''))}
                  placeholder="0,00"
                  className="w-[220px] bg-transparent outline-none text-[44px] font-semibold tabular-nums text-painel-tinta placeholder:text-stone-300 text-center"
                />
              </div>
              <div className="mt-2 text-center">
                <span className="text-[12px] text-stone-500">Disponível {real(saldo)} · </span>
                <button type="button" onClick={() => setValor(saldo.toFixed(2).replace('.', ','))} className="text-[12px] font-semibold text-painel-acento hover:underline cursor-pointer">
                  Usar tudo
                </button>
              </div>
              {numero > saldo && <p className="text-[12px] text-rose-600 mt-3 text-center">O valor passa do saldo disponível.</p>}
            </>
          )}

          {passo === 'revisao' && titular && (
            <>
              <h1 className="text-[22px] text-painel-tinta leading-tight" style={{ fontWeight: 600 }}>Confira os dados do Pix</h1>
              <div className="bg-white rounded-[24px] mt-5 overflow-hidden">
                <div className="px-5 py-5 text-center border-b border-dashed border-painel-borda">
                  <span className="block text-[12px] text-stone-400">Valor</span>
                  <span className="block text-[32px] font-semibold tabular-nums text-painel-tinta mt-1">{real(numero)}</span>
                </div>
                <Linha rotulo="Para" valor={titular.nome || 'Titular não informado pelo Asaas'} forte />
                {titular.documento && <Linha rotulo="CPF/CNPJ" valor={titular.documento} />}
                {titular.banco && <Linha rotulo="Instituição" valor={titular.banco} />}
                <Linha rotulo="Chave" valor={`${nomeDoTipo(titular.tipo)} · ${daLoja ? chavePix : chave.trim()}`} />
                <Linha rotulo="De" valor="Conta AVLE da loja" />
                <Linha rotulo="Quando" valor="Agora · Pix cai na hora" ultima />
              </div>
              {!daLoja && (
                <p className="text-[11px] text-stone-500 leading-relaxed mt-3">
                  Confira o nome antes de seguir: Pix enviado não volta sozinho. A loja recebe um aviso de todo saque para outra chave.
                </p>
              )}
              {erro && <p className="text-[12px] text-rose-600 mt-3 leading-snug">{erro}</p>}
            </>
          )}

          {passo === 'senha' && (
            <TecladoDeSenha
              travada={situacao.bloqueadaAte ?? situacao.liberaEm}
              erro={erro}
              aoLimparErro={() => setErro('')}
              aoCompletar={enviar}
              aoEsquecer={() => irPara('criar-senha')}
            />
          )}

          {passo === 'enviando' && (
            <div className="py-24 flex flex-col items-center gap-4">
              <span className="w-12 h-12 rounded-full border-4 border-painel-borda border-t-painel-acento animate-spin" />
              <p className="text-[14px] text-painel-tinta font-medium">Enviando o Pix…</p>
              <p className="text-[12px] text-stone-400">Não feche esta tela.</p>
            </div>
          )}

          {passo === 'comprovante' && feito && (
            <Comprovante saque={feito} titular={titular} aoVoltar={aoConcluir} />
          )}
        </div>
      </main>

      {/* O botão de seguir fica embaixo, como no app do banco. */}
      {(passo === 'chave' || passo === 'valor' || passo === 'revisao') && (
        <footer className="bg-white border-t border-painel-borda">
          <div className="max-w-md mx-auto w-full px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <button
              type="button"
              disabled={ocupado || (passo === 'chave' && !chave.trim()) || (passo === 'valor' && !valorOk)}
              onClick={() => {
                if (passo === 'chave') consultar(chave.trim(), tipo, false);
                else if (passo === 'valor') irPara('revisao');
                else irPara('senha');
              }}
              className="w-full h-14 rounded-full bg-painel-acento text-white text-[15px] font-semibold shadow-[0_12px_24px_-14px_rgba(189,107,66,0.9)] hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {passo === 'chave' ? (ocupado ? 'Conferindo a chave…' : 'Continuar')
                : passo === 'valor' ? 'Continuar'
                : 'Confirmar e digitar a senha'}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

function Linha({ rotulo, valor, forte = false, ultima = false }: { rotulo: string; valor: string; forte?: boolean; ultima?: boolean }) {
  return (
    <div className={`px-5 py-3.5 flex justify-between gap-4 ${ultima ? '' : 'border-b border-painel-borda/70'}`}>
      <span className="text-[12px] text-stone-400 flex-shrink-0">{rotulo}</span>
      <span className={`text-[13px] text-right break-all ${forte ? 'font-semibold text-painel-tinta' : 'text-painel-tinta'}`}>{valor}</span>
    </div>
  );
}

/**
 * A senha no teclado da tela, com as bolinhas em cima, como no banco. Os seis
 * números completos já enviam.
 */
function TecladoDeSenha({
  travada,
  erro,
  aoLimparErro,
  aoCompletar,
  aoEsquecer,
}: {
  travada: string | null;
  erro: string;
  aoLimparErro: () => void;
  aoCompletar: (senha: string) => void;
  aoEsquecer: () => void;
}) {
  const [digitos, setDigitos] = useState('');
  // A referência guarda o que já foi digitado: toques rápidos seguidos liam
  // o estado antigo e só o último número ficava.
  const digitados = useRef('');

  const apertar = (d: string) => {
    if (travada) return;
    aoLimparErro();
    const novo = (digitados.current + d).slice(0, 6);
    if (novo.length === 6) {
      digitados.current = '';
      setDigitos('');
      aoCompletar(novo);
      return;
    }
    digitados.current = novo;
    setDigitos(novo);
  };
  const apagar = () => {
    digitados.current = digitados.current.slice(0, -1);
    setDigitos(digitados.current);
  };

  // No computador, o teclado físico também digita.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) apertar(e.key);
      else if (e.key === 'Backspace') apagar();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  });

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-[22px] text-painel-tinta leading-tight text-center" style={{ fontWeight: 600 }}>Digite sua senha de saque</h1>
      <p className="text-[13px] text-stone-500 mt-1 text-center">Os 6 números que só servem para sacar.</p>

      <div className="flex gap-3 mt-8" aria-label={`${digitos.length} de 6 números digitados`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className={`w-3.5 h-3.5 rounded-full transition-colors ${i < digitos.length ? 'bg-painel-tinta' : 'bg-painel-borda'}`} />
        ))}
      </div>

      {travada && (
        <p className="rounded-[16px] bg-amber-50 text-amber-800 text-[12px] leading-relaxed p-3 mt-5 text-center">
          Saque travado até {quando(travada)}.
        </p>
      )}
      {erro && <p className="text-[12px] text-rose-600 mt-4 text-center leading-snug">{erro}</p>}

      <div className="grid grid-cols-3 gap-3 mt-8 w-full max-w-[300px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((tecla, i) =>
          tecla === '' ? <span key={i} /> : (
            <button
              key={i}
              type="button"
              disabled={!!travada}
              aria-label={tecla === '⌫' ? 'Apagar' : tecla}
              onClick={() => (tecla === '⌫' ? apagar() : apertar(tecla))}
              className={`h-16 rounded-[20px] text-[24px] font-semibold tabular-nums transition-colors cursor-pointer disabled:opacity-40 ${
                tecla === '⌫' ? 'text-stone-500 hover:bg-white' : 'bg-white text-painel-tinta hover:bg-painel-borda/50 active:bg-painel-borda'
              }`}
            >
              {tecla}
            </button>
          ),
        )}
      </div>

      <button type="button" onClick={aoEsquecer} className="mt-6 text-[13px] font-semibold text-painel-acento hover:underline cursor-pointer">
        Esqueci a senha de saque
      </button>
    </div>
  );
}

function Comprovante({ saque, titular, aoVoltar }: { saque: SaqueFeito; titular: Titular | null; aoVoltar: () => void }) {
  const s = SITUACAO[saque.status] ?? SITUACAO.SOLICITANDO;
  const concluido = saque.status === 'CONCLUIDO';
  const para = saque.nomeRecebedor || titular?.nome || null;
  const data = saque.criadoEm ? new Date(saque.criadoEm).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');

  const compartilhar = () => {
    const texto = `Pix de ${real(saque.valor)}${para ? ` para ${para}` : ''} · ${data} · Saque #${saque.id} · Conta AVLE`;
    if (navigator.share) navigator.share({ title: 'Comprovante de saque', text: texto }).catch(() => {});
    else navigator.clipboard?.writeText(texto);
  };

  return (
    <>
      <div className="flex flex-col items-center text-center pt-2">
        <span className={`w-16 h-16 rounded-full flex items-center justify-center text-[28px] text-white ${concluido ? 'bg-emerald-600' : 'bg-painel-acento'}`}>
          ✓
        </span>
        <h1 className="text-[22px] text-painel-tinta mt-4" style={{ fontWeight: 600 }}>{s.titulo}</h1>
        <p className="text-[13px] text-stone-500 mt-1 max-w-[300px]">{s.texto}</p>
      </div>

      <div className="bg-white rounded-[24px] mt-6 overflow-hidden">
        <div className="px-5 py-5 text-center border-b border-dashed border-painel-borda">
          <span className="block text-[12px] text-stone-400">Valor</span>
          <span className="block text-[32px] font-semibold tabular-nums text-painel-tinta mt-1">{real(saque.valor)}</span>
        </div>
        {para && <Linha rotulo="Para" valor={para} forte />}
        {titular?.documento && <Linha rotulo="CPF/CNPJ" valor={titular.documento} />}
        {titular?.banco && <Linha rotulo="Instituição" valor={titular.banco} />}
        <Linha rotulo="Chave" valor={`${nomeDoTipo(saque.tipoChavePix)} · ${saque.chavePix}`} />
        <Linha rotulo="De" valor="Conta AVLE da loja" />
        <Linha rotulo="Data e hora" valor={data} />
        <Linha rotulo="Saque" valor={`#${saque.id}`} ultima />
      </div>

      <div className="mt-6 space-y-2">
        {saque.comprovanteUrl && (
          <a
            href={saque.comprovanteUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full h-12 rounded-full bg-white ring-1 ring-painel-borda text-[14px] font-semibold text-painel-tinta flex items-center justify-center hover:ring-painel-tinta/30"
          >
            Ver comprovante do Asaas
          </a>
        )}
        <button type="button" onClick={compartilhar} className="w-full h-12 rounded-full bg-white ring-1 ring-painel-borda text-[14px] font-semibold text-painel-tinta hover:ring-painel-tinta/30 cursor-pointer">
          Compartilhar
        </button>
        <button type="button" onClick={aoVoltar} className="w-full h-14 rounded-full bg-painel-acento text-white text-[15px] font-semibold hover:brightness-95 cursor-pointer">
          Voltar para a Conta AVLE
        </button>
      </div>
    </>
  );
}

/** Criar ou trocar a senha de saque, dentro do fluxo. */
function CriarSenha({ lojaId, troca, aoCriar }: { lojaId: number | undefined; troca: boolean; aoCriar: (s: SenhaDeSaque) => void }) {
  const [senhaDoPainel, setSenhaDoPainel] = useState('');
  const [nova, setNova] = useState('');
  const [repetida, setRepetida] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const valido = senhaDoPainel.length > 0 && /^\d{6}$/.test(nova) && nova === repetida;
  const soNumeros = (v: string) => v.replace(/\D/g, '').slice(0, 6);
  const campo = 'w-full h-12 px-5 bg-white ring-1 ring-painel-borda rounded-full text-painel-tinta focus:outline-none focus:ring-2 focus:ring-painel-acento/50';

  const salvar = async () => {
    setEnviando(true);
    setErro('');
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/conta/senha-saque`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaDoPainel, novaSenha: nova }),
      });
      if (!res.ok) throw new Error(await lerErro(res, 'Não foi possível salvar a senha de saque.'));
      aoCriar(await res.json());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar a senha de saque.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <h1 className="text-[22px] text-painel-tinta leading-tight" style={{ fontWeight: 600 }}>
        {troca ? 'Troque a senha de saque' : 'Crie a sua senha de saque'}
      </h1>
      <p className="text-[13px] text-stone-500 mt-1 leading-relaxed">
        São 6 números, só para sacar, diferentes da senha do painel.
        {troca && ' Depois da troca, os saques ficam parados por 24 horas, por segurança.'}
      </p>
      <ul className="mt-3 text-[12px] text-stone-400 leading-relaxed list-disc pl-4">
        <li>Sem sequência (123456, 987654) nem número repetido (111222, 121212).</li>
        <li>Sem números do CNPJ, do CPF ou do telefone.</li>
        <li>Diferente da senha do painel e das últimas senhas de saque.</li>
      </ul>

      <label className="block text-[12px] text-stone-500 mt-6 mb-1.5" htmlFor="fluxo-senha-painel">Senha do painel</label>
      <input id="fluxo-senha-painel" type="password" autoComplete="current-password" value={senhaDoPainel}
        onChange={(e) => setSenhaDoPainel(e.target.value)} className={`${campo} text-[14px]`} />

      <label className="block text-[12px] text-stone-500 mt-4 mb-1.5" htmlFor="fluxo-nova-senha">Nova senha de saque</label>
      <input id="fluxo-nova-senha" type="password" inputMode="numeric" autoComplete="new-password" value={nova}
        onChange={(e) => setNova(soNumeros(e.target.value))} className={`${campo} text-[18px] tracking-[0.5em] tabular-nums`} />

      <label className="block text-[12px] text-stone-500 mt-4 mb-1.5" htmlFor="fluxo-repetir-senha">Repita a senha de saque</label>
      <input id="fluxo-repetir-senha" type="password" inputMode="numeric" autoComplete="new-password" value={repetida}
        onChange={(e) => setRepetida(soNumeros(e.target.value))} className={`${campo} text-[18px] tracking-[0.5em] tabular-nums`} />
      {repetida.length === 6 && nova !== repetida && <p className="text-[12px] text-rose-600 mt-1.5">As duas senhas não são iguais.</p>}

      {erro && <p className="text-[12px] text-rose-600 mt-3 leading-snug">{erro}</p>}

      <button type="button" onClick={salvar} disabled={!valido || enviando}
        className="mt-6 w-full h-14 rounded-full bg-painel-acento text-white text-[15px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-95 transition-all cursor-pointer">
        {enviando ? 'Salvando…' : troca ? 'Trocar senha de saque' : 'Criar senha e continuar'}
      </button>
    </>
  );
}
