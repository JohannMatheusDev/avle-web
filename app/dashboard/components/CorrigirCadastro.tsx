'use client';

/**
 * Corrige o cadastro de uma cliente: nome, CPF, e-mail e telefone. Busca pelo
 * nome, CPF, telefone ou e-mail, mostra o que está gravado e, ao salvar, o
 * antes e o depois. O servidor confere o CPF e se algum dado já é de outra
 * conta. Mostra também a situação de cada cota dela e reativa a que foi
 * cancelada por engano.
 */

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

type CotaDaCliente = { cotaId: number; grupo: string; loja?: string; status: string; vagaMantida?: boolean };
type Cliente = { id: number; nome: string; cpf?: string; email?: string; telefone?: string; tipo?: string; grupos: string[]; cotas?: CotaDaCliente[] };

type CobrancaNoAsaas = {
  id: string; value: number; status: string; billingType?: string; dueDate?: string; paymentDate?: string;
  description?: string; conta: string; contaLojaId: number; noAvle: string[]; pagaSemBaixa: boolean; temBaixa?: boolean;
};
type NoAsaas = { clienteId: number; cobrancas: CobrancaNoAsaas[]; cotas: CotaDaCliente[]; falhas?: string[] };

const STATUS_ASAAS: Record<string, string> = {
  PENDING: 'aguardando', OVERDUE: 'vencida', RECEIVED: 'paga', CONFIRMED: 'paga', RECEIVED_IN_CASH: 'paga em dinheiro',
  REFUNDED: 'estornada', REFUND_REQUESTED: 'estorno pedido',
};
const reais = (v: number) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const data = (d?: string) => (d ? d.split('-').reverse().join('/') : '—');

const SITUACAO: Record<string, string> = {
  ATIVA: 'ativa',
  AGUARDANDO_PAGAMENTO: 'reservada, falta pagar a entrada',
  CANCELADA: 'cancelada: não aparece no painel dela',
  REJEITADA: 'recusada: não aparece no painel dela',
  PENDENTE_AVALIACAO: 'em avaliação',
};
type Campos = { nome: string; cpf: string; email: string; telefone: string };

const campo = 'w-full h-10 px-4 bg-white ring-1 ring-painel-borda rounded-full text-[13px] text-painel-tinta focus:outline-none focus:ring-2 focus:ring-painel-acento/50';

export default function CorrigirCadastro() {
  const [busca, setBusca] = useState('');
  const [lista, setLista] = useState<Cliente[] | null>(null);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [valores, setValores] = useState<Campos>({ nome: '', cpf: '', email: '', telefone: '' });
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [noAsaas, setNoAsaas] = useState<NoAsaas | null>(null);
  const [cotaDaBaixa, setCotaDaBaixa] = useState<Record<string, number>>({});

  const buscar = async () => {
    setOcupado(true);
    setAviso('');
    try {
      const r = await apiFetch(`/api/admin/clientes?busca=${encodeURIComponent(busca.trim())}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || 'Não deu para buscar.');
      setLista(d);
      setEditando(null);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu para buscar.');
    } finally {
      setOcupado(false);
    }
  };

  // As clientes com CPF inválido: o Asaas recusa a cobrança delas, e o Pix não sai.
  const verCpfsInvalidos = async () => {
    setOcupado(true);
    setAviso('');
    try {
      const r = await apiFetch('/api/admin/clientes/cpf-invalido');
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || 'Não deu para buscar.');
      setLista(d);
      setEditando(null);
      setAviso(d.length ? `${d.length} cliente(s) com CPF inválido: o Pix delas não sai até corrigir.` : 'Nenhuma cliente com CPF inválido.');
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu para buscar.');
    } finally {
      setOcupado(false);
    }
  };

  // Devolve ao grupo a cota cancelada por engano, com o saldo e o histórico.
  const reativar = async (cliente: Cliente, cota: CotaDaCliente) => {
    if (!window.confirm(`Reativar a cota de ${cliente.nome} no grupo ${cota.grupo}? Ela volta a ver o grupo no painel e a ser cobrada.`)) return;
    setOcupado(true);
    setAviso('');
    try {
      const r = await apiFetch(`/api/admin/cotas/${cota.cotaId}/reativar`, { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || 'Não deu para reativar.');
      setLista((l) => l?.map((c) => (c.id === cliente.id ? { ...c, cotas: d.cotas } : c)) ?? null);
      setAviso(d.mensagem);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu para reativar.');
    } finally {
      setOcupado(false);
    }
  };

  // O que o Asaas tem desta cliente, em todas as contas, ao lado do AVLE.
  const verNoAsaas = async (c: Cliente) => {
    setOcupado(true);
    setAviso('');
    try {
      const r = await apiFetch(`/api/admin/clientes/${c.id}/asaas`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || 'Não deu para consultar o Asaas.');
      setNoAsaas({ clienteId: c.id, ...d });
      const semBaixa = (d.cobrancas as CobrancaNoAsaas[]).filter((x) => x.pagaSemBaixa).length;
      setAviso(semBaixa ? `${semBaixa} cobrança(s) paga(s) no Asaas sem baixa no AVLE.` : 'Nenhuma cobrança paga sem baixa.');
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu para consultar o Asaas.');
    } finally {
      setOcupado(false);
    }
  };

  const darBaixa = async (cob: CobrancaNoAsaas) => {
    if (!noAsaas) return;
    if (!window.confirm(`Dar baixa na cobrança de ${reais(cob.value)} (${cob.conta}, paga em ${data(cob.paymentDate)})?`)) return;
    setOcupado(true);
    setAviso('');
    try {
      const r = await apiFetch(`/api/admin/clientes/${noAsaas.clienteId}/asaas/baixar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: cob.id, contaLojaId: cob.contaLojaId, cotaId: cotaDaBaixa[cob.id] }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || 'Não deu para dar baixa.');
      setAviso(d.mensagem);
      const cliente = lista?.find((c) => c.id === noAsaas.clienteId);
      if (cliente) await verNoAsaas(cliente);
      setAviso(d.mensagem);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu para dar baixa.');
    } finally {
      setOcupado(false);
    }
  };

  // Tira a parcela creditada a mais: a baixa numa cobrança que já estava contada.
  const desfazerBaixa = async (cob: CobrancaNoAsaas) => {
    if (!noAsaas) return;
    if (!window.confirm(`Desfazer a baixa da cobrança de ${reais(cob.value)}? A parcela sai do saldo (${cob.noAvle.join(', ').toLowerCase()}).`)) return;
    setOcupado(true);
    setAviso('');
    try {
      const r = await apiFetch(`/api/admin/clientes/${noAsaas.clienteId}/asaas/desfazer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: cob.id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || 'Não deu para desfazer.');
      const cliente = lista?.find((c) => c.id === noAsaas.clienteId);
      if (cliente) await verNoAsaas(cliente);
      setAviso(d.mensagem);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu para desfazer.');
    } finally {
      setOcupado(false);
    }
  };

  const abrir = (c: Cliente) => {
    setEditando(c);
    setValores({ nome: c.nome ?? '', cpf: c.cpf ?? '', email: c.email ?? '', telefone: c.telefone ?? '' });
    setAviso('');
  };

  const salvar = async () => {
    if (!editando) return;
    setOcupado(true);
    setAviso('');
    try {
      const r = await apiFetch(`/api/admin/clientes/${editando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || 'Não deu para salvar.');
      const mudou = (['nome', 'cpf', 'email', 'telefone'] as const)
        .filter((k) => d.antes[k] !== d.depois[k])
        .map((k) => `${k}: ${d.antes[k] ?? '—'} → ${d.depois[k]}`);
      setAviso(mudou.length ? `Salvo. ${mudou.join(' · ')}` : 'Nada mudou: os dados já estavam assim.');
      setLista((l) => l?.map((c) => (c.id === editando.id ? { ...c, ...d.depois } : c)) ?? null);
      setEditando(null);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu para salvar.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="cartao-avle p-6 mb-6 space-y-4">
      <div>
        <h3 style={{ fontWeight: 600 }} className="text-[16px] text-painel-tinta">Corrigir cadastro de cliente</h3>
        <p className="text-[12px] text-stone-500 mt-1 max-w-xl leading-relaxed">
          Busque pelo nome, CPF, telefone ou e-mail. O CPF é conferido, e nenhum dado pode ser de outra conta. Celular
          sem o nono dígito ganha o 9 ao salvar.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, CPF, telefone ou e-mail"
          onKeyDown={(e) => { if (e.key === 'Enter' && busca.trim().length >= 3) buscar(); }}
          className={`${campo} flex-1 min-w-[200px]`} />
        <button type="button" onClick={buscar} disabled={ocupado || busca.trim().length < 3}
          className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
          Buscar
        </button>
        <button type="button" onClick={verCpfsInvalidos} disabled={ocupado}
          className="h-10 px-5 rounded-full border border-painel-borda text-[12px] font-semibold text-painel-tinta hover:bg-stone-50 disabled:opacity-50 cursor-pointer">
          Ver CPFs inválidos
        </button>
      </div>

      {lista && lista.length === 0 && <p className="text-[12px] text-stone-400">Ninguém com essa busca.</p>}
      {lista && lista.length > 0 && !editando && (
        <div className="divide-y divide-painel-borda">
          {lista.map((c) => (
            <div key={c.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 text-[12px] text-stone-500">
                <p className="text-[13px] font-semibold text-painel-tinta">{c.nome}</p>
                <p>CPF {c.cpf || '—'} · {c.telefone || 'sem telefone'} · {c.email || 'sem e-mail'}</p>
                {c.cotas ? (
                  c.cotas.length === 0 ? <p className="text-stone-400">sem grupo</p> : (
                    <ul className="mt-1 space-y-1">
                      {c.cotas.map((cota) => {
                        const fora = cota.status === 'CANCELADA' || cota.status === 'REJEITADA';
                        return (
                          <li key={cota.cotaId} className="flex flex-wrap items-center gap-2">
                            <span className="text-painel-tinta">{cota.grupo}{cota.loja ? ` · ${cota.loja}` : ''}</span>
                            <span className={fora ? 'text-rose-700 font-semibold' : 'text-stone-400'}>
                              ({SITUACAO[cota.status] ?? cota.status.toLowerCase()})
                            </span>
                            {fora && (
                              <button type="button" onClick={() => reativar(c, cota)} disabled={ocupado}
                                className="h-7 px-3 rounded-full bg-painel-tinta text-white text-[11px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
                                Reativar
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )
                ) : (
                  <p className="text-stone-400">{c.grupos.length ? c.grupos.join(', ') : 'sem grupo'}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => verNoAsaas(c)} disabled={ocupado}
                  className="h-9 px-4 rounded-full border border-painel-borda text-[12px] font-semibold text-painel-tinta hover:bg-stone-50 disabled:opacity-50 cursor-pointer">
                  Cobranças no Asaas
                </button>
                <button type="button" onClick={() => abrir(c)}
                  className="h-9 px-4 rounded-full border border-painel-borda text-[12px] font-semibold text-painel-tinta hover:bg-stone-50 cursor-pointer">
                  Corrigir
                </button>
              </div>
              {noAsaas?.clienteId === c.id && (
                <div className="w-full rounded-2xl bg-painel-papel p-3 text-[12px]">
                  {noAsaas.falhas?.map((f) => <p key={f} className="text-rose-700">Não consultou {f}</p>)}
                  {noAsaas.cobrancas.length === 0 ? (
                    <p className="text-stone-400">Nenhuma cobrança no Asaas para o CPF dela.</p>
                  ) : (
                    <ul className="divide-y divide-painel-borda">
                      {noAsaas.cobrancas.map((cob) => (
                        <li key={cob.id} className={`py-2 flex flex-wrap items-center justify-between gap-2 ${cob.pagaSemBaixa ? 'text-rose-800' : 'text-stone-500'}`}>
                          <div className="min-w-0">
                            <p className="font-semibold text-painel-tinta">
                              {reais(cob.value)} · {STATUS_ASAAS[cob.status] ?? cob.status.toLowerCase()} · conta {cob.conta}
                            </p>
                            <p>
                              vence {data(cob.dueDate)}{cob.paymentDate ? ` · paga em ${data(cob.paymentDate)}` : ''}
                              {cob.billingType ? ` · ${cob.billingType}` : ''}
                            </p>
                            <p className="text-stone-400">
                              No AVLE: {cob.noAvle.length ? cob.noAvle.join(', ').toLowerCase() : 'não existe (nasceu fora do AVLE)'}
                            </p>
                          </div>
                          {cob.temBaixa && (
                            <button type="button" onClick={() => desfazerBaixa(cob)} disabled={ocupado}
                              className="h-8 px-3 rounded-full border border-painel-borda text-[11px] font-semibold text-stone-500 hover:bg-white disabled:opacity-50 cursor-pointer">
                              Desfazer baixa
                            </button>
                          )}
                          {cob.pagaSemBaixa && (
                            <div className="flex flex-wrap items-center gap-2">
                              {cob.noAvle.length === 0 && (
                                <select value={cotaDaBaixa[cob.id] ?? ''} onChange={(e) => setCotaDaBaixa((m) => ({ ...m, [cob.id]: Number(e.target.value) }))}
                                  className="h-8 px-2 rounded-full bg-white ring-1 ring-painel-borda text-[12px]">
                                  <option value="">Qual grupo?</option>
                                  {noAsaas.cotas.map((cota) => (
                                    <option key={cota.cotaId} value={cota.cotaId}>{cota.grupo}{cota.loja ? ` · ${cota.loja}` : ''}</option>
                                  ))}
                                </select>
                              )}
                              <button type="button" onClick={() => darBaixa(cob)}
                                disabled={ocupado || (cob.noAvle.length === 0 && !cotaDaBaixa[cob.id])}
                                className="h-8 px-3 rounded-full bg-painel-tinta text-white text-[11px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
                                Dar baixa
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editando && (
        <div className="rounded-2xl bg-painel-papel p-4 space-y-2">
          <p className="text-[13px] font-semibold text-painel-tinta">Corrigindo: {editando.nome}</p>
          {(['nome', 'cpf', 'email', 'telefone'] as const).map((k) => (
            <label key={k} className="block">
              <span className="block text-[11px] text-stone-400 mb-1">{{ nome: 'Nome', cpf: 'CPF', email: 'E-mail', telefone: 'Telefone' }[k]}</span>
              <input value={valores[k]} onChange={(e) => setValores((v) => ({ ...v, [k]: e.target.value }))} className={campo} />
            </label>
          ))}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setEditando(null)}
              className="h-10 px-5 rounded-full border border-painel-borda text-[12px] font-semibold text-stone-500 cursor-pointer">
              Voltar
            </button>
            <button type="button" onClick={salvar} disabled={ocupado}
              className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
              {ocupado ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {aviso && <p className="text-[12px] text-painel-tinta break-words">{aviso}</p>}
    </div>
  );
}
