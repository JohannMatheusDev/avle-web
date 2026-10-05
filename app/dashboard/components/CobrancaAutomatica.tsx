'use client';

/**
 * A cobrança automática no admin: como está configurada agora e o ensaio da
 * próxima competência. O ensaio mostra quantas parcelas sairiam, quem fica de
 * fora e por quê, sem criar nada no Asaas nem avisar ninguém - é o que se
 * confere antes de ligar a cobrança para a base inteira.
 */

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

type Situacao = {
  emissaoAtiva: boolean;
  modoTeste: boolean;
  somenteCota: string | null;
  avisarPorWhatsapp: boolean;
  avisarPorEmail: boolean;
  whatsappConfigurado: boolean;
  proximaCompetencia: string;
  vencimento: string;
  lembreteEmailAtivo: boolean;
  lembreteEmailModoTeste: boolean;
  avisoMensalAtivo?: boolean;
};

type Aviso = {
  sairiam?: number;
  enviados?: number;
  falhas?: number;
  semCelular?: number;
  jaAvisadas?: number;
  foraPorque?: Record<string, number>;
  amostra?: string[];
  problemas?: string[];
  motivo?: string;
};

type Ensaio = {
  competencia?: string;
  vencimento?: string;
  seriamEmitidas?: number;
  puladas?: number;
  motivosDePular?: Record<string, number>;
  semEmailNoCadastro?: number;
  semCelularValido?: number;
  semRepasseAutomatico?: number;
  amostra?: string[];
  motivo?: string;
};

const data = (iso?: string) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR') : '');
const mes = (competencia?: string) =>
  competencia ? new Date(`${competencia}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '';

function Linha({ rotulo, valor, bom, variavel }: { rotulo: string; valor: string; bom: boolean; variavel: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] text-painel-tinta">{rotulo}</p>
        <p className="text-[11px] text-stone-400 font-mono break-all">{variavel}</p>
      </div>
      <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${bom ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
        {valor}
      </span>
    </div>
  );
}

export default function CobrancaAutomatica() {
  const [situacao, setSituacao] = useState<Situacao | null>(null);
  const [ensaio, setEnsaio] = useState<Ensaio | null>(null);
  const [ensaiando, setEnsaiando] = useState(false);
  const [erro, setErro] = useState('');
  const [telefoneTeste, setTelefoneTeste] = useState('42984117768');
  const [testando, setTestando] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{ enviado: boolean; destino?: string; motivo?: string } | null>(null);

  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [avisoOcupado, setAvisoOcupado] = useState(false);

  const chamarAviso = async (acao: 'ensaiar' | 'enviar') => {
    if (acao === 'enviar' && !window.confirm(
      `Mandar agora o aviso do mês pelo WhatsApp para ${aviso?.sairiam ?? 'todas as'} cliente(s) que ainda não pagaram?`,
    )) return;
    setAvisoOcupado(true);
    try {
      const r = await apiFetch(`/api/cobranca/aviso-do-mes/${acao}`, { method: 'POST' });
      setAviso(r.ok ? await r.json() : { motivo: 'O servidor recusou o pedido.' });
    } catch {
      setAviso({ motivo: 'Não foi possível falar com o servidor.' });
    } finally {
      setAvisoOcupado(false);
    }
  };

  const testarWhatsapp = async () => {
    setTestando(true);
    setResultadoTeste(null);
    try {
      const r = await apiFetch('/api/cobranca/testar-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: telefoneTeste }),
      });
      setResultadoTeste(r.ok ? await r.json() : { enviado: false, motivo: 'O servidor recusou o teste.' });
    } catch {
      setResultadoTeste({ enviado: false, motivo: 'Não foi possível falar com o servidor.' });
    } finally {
      setTestando(false);
    }
  };

  useEffect(() => {
    let ativo = true;
    apiFetch('/api/cobranca/automatica')
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => { if (ativo && s) setSituacao(s); })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

  const ensaiar = async () => {
    setEnsaiando(true);
    setErro('');
    try {
      const r = await apiFetch('/api/cobranca/ensaiar-proxima', { method: 'POST' });
      if (!r.ok) throw new Error('Não foi possível rodar o ensaio agora.');
      setEnsaio(await r.json());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível rodar o ensaio agora.');
    } finally {
      setEnsaiando(false);
    }
  };

  if (!situacao) return null;

  // No ar de verdade: emitindo, fora do modo de teste, para todas as cotas.
  const noAr = situacao.emissaoAtiva && !situacao.modoTeste && !situacao.somenteCota;

  return (
    <div className="cartao-avle p-6 mb-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 style={{ fontWeight: 600 }} className="text-[16px] text-painel-tinta">Cobrança automática</h3>
          <p className="text-[12px] text-stone-500 mt-1 max-w-xl leading-relaxed">
            Todo dia às 9h, do dia 1º até o vencimento, o sistema emite no Asaas a parcela do mês de cada cota ativa
            e avisa a cliente pelo WhatsApp. Próxima: <strong className="text-painel-tinta">{mes(situacao.proximaCompetencia)}</strong>,
            vencendo em <strong className="text-painel-tinta">{data(situacao.vencimento)}</strong>.
          </p>
        </div>
        <span className={`text-[12px] font-semibold px-3 py-1.5 rounded-full ${noAr ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-900'}`}>
          {noAr ? 'No ar para todas as cotas' : situacao.somenteCota ? `Só a cota #${situacao.somenteCota}` : 'Em teste: não emite nada'}
        </span>
      </div>

      <div className="divide-y divide-painel-borda">
        <Linha rotulo="Emissão ligada" valor={situacao.emissaoAtiva ? 'Sim' : 'Não'} bom={situacao.emissaoAtiva}
          variavel="AVLE_COBRANCA_MENSAL_ATIVA" />
        <Linha rotulo="Modo de teste (só relata, não emite)" valor={situacao.modoTeste ? 'Ligado' : 'Desligado'} bom={!situacao.modoTeste}
          variavel="AVLE_COBRANCA_MENSAL_MODO_TESTE" />
        <Linha rotulo="Restrita a uma cota" valor={situacao.somenteCota ? `Cota #${situacao.somenteCota}` : 'Não, todas'}
          bom={!situacao.somenteCota} variavel="AVLE_COBRANCA_MENSAL_SOMENTE_COTA" />
        <Linha rotulo="Avisar pelo WhatsApp" valor={situacao.avisarPorWhatsapp ? 'Sim' : 'Não'} bom={situacao.avisarPorWhatsapp}
          variavel="AVLE_COBRANCA_MENSAL_AVISAR_WHATSAPP" />
        <Linha rotulo="WhatsApp com token e número configurados" valor={situacao.whatsappConfigurado ? 'Sim' : 'Não'}
          bom={situacao.whatsappConfigurado} variavel="AVLE_WHATSAPP_TOKEN · AVLE_WHATSAPP_PHONE_NUMBER_ID" />
        <Linha rotulo="Avisar por e-mail" valor={situacao.avisarPorEmail ? 'Sim' : 'Não'} bom={!situacao.avisarPorEmail}
          variavel="AVLE_COBRANCA_MENSAL_AVISAR_EMAIL" />
        <Linha rotulo="Lembrete por e-mail nos dias 1, 5 e 8"
          valor={!situacao.lembreteEmailAtivo ? 'Desligado' : situacao.lembreteEmailModoTeste ? 'Em teste' : 'Ligado'}
          bom={!situacao.lembreteEmailAtivo} variavel="AVLE_COBRANCA_ATIVA · AVLE_COBRANCA_MODO_TESTE" />
      </div>

      <div className="rounded-2xl bg-painel-papel p-4 space-y-3">
        <div>
          <p className="text-[13px] font-semibold text-painel-tinta">Testar a mensagem no WhatsApp</p>
          <p className="text-[11px] text-stone-500">Manda a mensagem de cobrança, com dados de exemplo, para um número. Não cria cobrança.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input value={telefoneTeste} onChange={(e) => setTelefoneTeste(e.target.value)} inputMode="tel"
            placeholder="DDD e número" className="h-10 px-4 flex-1 min-w-[180px] bg-white ring-1 ring-painel-borda rounded-full text-[13px] text-painel-tinta focus:outline-none focus:ring-2 focus:ring-painel-acento/50" />
          <button type="button" onClick={testarWhatsapp} disabled={testando || telefoneTeste.replace(/\D/g, '').length < 10}
            className="h-10 px-5 rounded-full bg-painel-acento text-white text-[12px] font-semibold disabled:opacity-50 cursor-pointer">
            {testando ? 'Enviando…' : 'Enviar teste'}
          </button>
        </div>
        {resultadoTeste && (
          <p className={`text-[12px] leading-relaxed break-words ${resultadoTeste.enviado ? 'text-emerald-700' : 'text-rose-700'}`}>
            {resultadoTeste.enviado
              ? `Enviada para ${resultadoTeste.destino}. Confira no WhatsApp desse número.`
              : `Não saiu. ${resultadoTeste.motivo ?? ''}`}
          </p>
        )}
      </div>

      <div className="rounded-2xl bg-painel-papel p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-painel-tinta">Aviso do mês, sem cobrança</p>
            <p className="text-[11px] text-stone-500 max-w-md leading-relaxed">
              Lembra pelo WhatsApp quem ainda não pagou a parcela de {mes(situacao.proximaCompetencia)}, com o endereço do
              painel. Não emite nada no Asaas. Sai sozinho de hora em hora, das 9h às 18h, em dia útil, até o vencimento, uma vez por cliente.
            </p>
            <p className="text-[11px] text-stone-400 font-mono mt-1">AVLE_AVISO_MENSAL_ATIVO</p>
          </div>
          <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${situacao.avisoMensalAtivo ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
            {situacao.avisoMensalAtivo ? 'Ligado' : 'Desligado'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => chamarAviso('ensaiar')} disabled={avisoOcupado}
            className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
            {avisoOcupado ? 'Aguarde…' : 'Ver quem recebe'}
          </button>
          {situacao.avisoMensalAtivo && (
            <button type="button" onClick={() => chamarAviso('enviar')} disabled={avisoOcupado}
              className="h-10 px-5 rounded-full bg-painel-acento text-white text-[12px] font-semibold disabled:opacity-50 cursor-pointer">
              Enviar agora
            </button>
          )}
        </div>
        {aviso && (
          <div className="space-y-2 text-[12px] text-stone-600">
            {aviso.motivo ? (
              <p className="text-amber-800">{aviso.motivo}</p>
            ) : (
              <>
                <p className="text-painel-tinta">
                  {aviso.enviados !== undefined
                    ? <><strong>{aviso.enviados}</strong> aviso(s) enviado(s){aviso.falhas ? `, ${aviso.falhas} não saíram` : ''}.</>
                    : <><strong>{aviso.sairiam ?? 0}</strong> cliente(s) receberiam agora.</>}
                  {' '}Já avisadas este mês: {aviso.jaAvisadas ?? 0}. Sem celular: {aviso.semCelular ?? 0}.
                </p>
                {aviso.foraPorque && Object.keys(aviso.foraPorque).length > 0 && (
                  <ul className="space-y-0.5">
                    {Object.entries(aviso.foraPorque).map(([m, n]) => <li key={m}>{n} · {m}</li>)}
                  </ul>
                )}
                {aviso.problemas && aviso.problemas.length > 0 && (
                  <ul className="space-y-0.5 text-rose-700 break-words">
                    {aviso.problemas.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                )}
                {aviso.amostra && aviso.amostra.length > 0 && (
                  <details>
                    <summary className="font-semibold text-stone-500 cursor-pointer">Quem recebe</summary>
                    <ul className="mt-1 space-y-0.5">{aviso.amostra.map((a) => <li key={a}>{a}</li>)}</ul>
                  </details>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-painel-papel p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-painel-tinta">Ensaio de {mes(situacao.proximaCompetencia)}</p>
            <p className="text-[11px] text-stone-500">Mostra o que sairia. Não cria cobrança nem manda mensagem.</p>
          </div>
          <button type="button" onClick={ensaiar} disabled={ensaiando}
            className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
            {ensaiando ? 'Ensaiando…' : 'Ensaiar agora'}
          </button>
        </div>
        {erro && <p className="text-[12px] text-rose-600">{erro}</p>}
        {ensaio && (
          <div className="space-y-3">
            {ensaio.motivo ? (
              <p className="text-[12px] text-amber-800">{ensaio.motivo}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { r: 'Sairiam', v: ensaio.seriamEmitidas ?? 0 },
                    { r: 'Ficam de fora', v: ensaio.puladas ?? 0 },
                    { r: 'Sem celular válido', v: ensaio.semCelularValido ?? 0 },
                    { r: 'Loja sem carteira', v: ensaio.semRepasseAutomatico ?? 0 },
                  ].map((b) => (
                    <div key={b.r} className="rounded-xl bg-white p-3">
                      <span className="block text-[11px] text-stone-400">{b.r}</span>
                      <span className="block text-[20px] font-semibold tabular-nums text-painel-tinta">{b.v}</span>
                    </div>
                  ))}
                </div>
                {ensaio.motivosDePular && Object.keys(ensaio.motivosDePular).length > 0 && (
                  <div>
                    <p className="text-[12px] font-semibold text-painel-tinta mb-1">Por que ficam de fora</p>
                    <ul className="text-[12px] text-stone-600 space-y-0.5">
                      {Object.entries(ensaio.motivosDePular).map(([m, n]) => <li key={m}>{n} · {m}</li>)}
                    </ul>
                  </div>
                )}
                {(ensaio.semRepasseAutomatico ?? 0) > 0 && (
                  <p className="text-[12px] text-amber-800">
                    Atenção: {ensaio.semRepasseAutomatico} cobrança(s) de loja sem carteira sairiam sem split, e o valor
                    inteiro ficaria na conta da AVLE.
                  </p>
                )}
                {ensaio.amostra && ensaio.amostra.length > 0 && (
                  <details>
                    <summary className="text-[12px] font-semibold text-stone-500 cursor-pointer">Amostra das que sairiam</summary>
                    <ul className="text-[12px] text-stone-600 mt-1 space-y-0.5">
                      {ensaio.amostra.map((a) => <li key={a}>{a}</li>)}
                    </ul>
                  </details>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
