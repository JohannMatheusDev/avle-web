'use client';

/**
 * A equipe da loja, nas Configurações: a loja mãe convida pelo e-mail
 * colaboradores e o financeiro, vê quem já entrou e quem ainda não aceitou, e
 * tira o acesso. Colaborador e financeiro não veem este cartão.
 */

import { useCallback, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '../../lib/api';

type Papel = 'COLABORADOR' | 'FINANCEIRO';
type Pessoa = { id: number; nome: string; email: string };
type Convite = Pessoa & { expirado?: boolean; papel?: Papel };
type Equipe = { colaboradores: Pessoa[]; financeiro?: Pessoa[]; convites: Convite[] };

const PAPEIS: { id: Papel; rotulo: string; ajuda: string }[] = [
  { id: 'COLABORADOR', rotulo: 'Colaborador',
    ajuda: 'Cuida do dia a dia sem ver o faturamento nem a Conta AVLE. Cadastrar cliente, adicionar a um grupo, baixa manual, criar ou excluir grupo e corrigir datas passam pela sua aprovação.' },
  { id: 'FINANCEIRO', rotulo: 'Financeiro',
    ajuda: 'Vê a Conta AVLE, o a receber, os pagamentos e baixa os relatórios. Não mexe em grupos nem em clientes. Saque e troca da chave Pix que ele pedir passam pela sua aprovação.' },
];

const lerErro = async (res: Response, padrao: string) => {
  const texto = await res.text().catch(() => '');
  try {
    return JSON.parse(texto)?.erro || padrao;
  } catch {
    return texto || padrao;
  }
};

export default function EquipeDaLoja({
  lojaId,
  mostrarAviso,
}: {
  lojaId: number | undefined;
  mostrarAviso: (titulo: string, texto: string, erro: boolean) => void;
}) {
  const [equipe, setEquipe] = useState<Equipe | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState<Papel>('COLABORADOR');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    if (!lojaId) return;
    try {
      const res = await apiFetch(`${API_URL}/api/lojas/${lojaId}/colaboradores`);
      if (res.ok) setEquipe(await res.json());
    } catch {
      // Sem a lista, o cartão mostra só o formulário.
    }
  }, [lojaId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial da equipe
    carregar();
  }, [carregar]);

  const chamar = async (url: string, opcoes: RequestInit, sucesso: string) => {
    setEnviando(true);
    try {
      const res = await apiFetch(url, opcoes);
      if (!res.ok) throw new Error(await lerErro(res, 'Não foi possível concluir agora.'));
      setEquipe(await res.json());
      mostrarAviso('Equipe atualizada', sucesso, false);
      return true;
    } catch (e) {
      mostrarAviso('Não deu certo', e instanceof Error ? e.message : 'Tente de novo em instantes.', true);
      return false;
    } finally {
      setEnviando(false);
    }
  };

  const convidar = async () => {
    const ok = await chamar(`${API_URL}/api/lojas/${lojaId}/colaboradores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, papel }),
    }, `O convite foi para ${email}. Ele vale por 7 dias.`);
    if (ok) { setNome(''); setEmail(''); }
  };

  const remover = (p: Pessoa) => {
    if (!window.confirm(`Tirar o acesso de ${p.nome}? Essa pessoa não vai mais conseguir entrar no painel da loja.`)) return;
    chamar(`${API_URL}/api/lojas/${lojaId}/colaboradores/${p.id}`, { method: 'DELETE' }, `${p.nome} não tem mais acesso.`);
  };

  const cancelar = (c: Convite) => {
    chamar(`${API_URL}/api/lojas/${lojaId}/colaboradores/convites/${c.id}`, { method: 'DELETE' }, 'O convite foi cancelado.');
  };

  const valido = nome.trim().length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const campo = 'w-full h-11 px-4 bg-painel-papel ring-1 ring-painel-borda rounded-full text-[13px] text-painel-tinta focus:outline-none focus:ring-2 focus:ring-painel-acento/50';

  return (
    <div className="cartao-avle p-6 space-y-4">
      <div>
        <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">Equipe</h3>
        <p className="text-[12px] text-stone-500 mt-1 leading-relaxed">
          Quem você convida entra com o próprio login. O colaborador cuida do dia a dia; o financeiro confere o
          dinheiro. O que for sensível passa pela sua aprovação, em Aprovações.
        </p>
      </div>

      {equipe && ([['Colaboradores', equipe.colaboradores], ['Financeiro', equipe.financeiro ?? []]] as const).map(([titulo, pessoas]) =>
        pessoas.length > 0 && (
          <div key={titulo}>
            <p className="text-[12px] text-stone-400 mb-1">{titulo}</p>
            <div className="divide-y divide-painel-borda">
              {pessoas.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-painel-tinta truncate">{p.nome}</p>
                    <p className="text-[11px] text-stone-400 truncate">{p.email}</p>
                  </div>
                  <button type="button" disabled={enviando} onClick={() => remover(p)}
                    className="text-[12px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer disabled:opacity-40">
                    Tirar acesso
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

      {equipe && equipe.convites.length > 0 && (
        <div>
          <p className="text-[12px] text-stone-400 mb-1">Convites que ainda não foram aceitos</p>
          <div className="divide-y divide-painel-borda">
            {equipe.convites.map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] text-painel-tinta truncate">
                    {c.nome} · <span className="text-stone-400">{c.email}{c.papel === 'FINANCEIRO' ? ' · financeiro' : ''}</span>
                  </p>
                  {c.expirado && <p className="text-[11px] text-amber-700">Venceu: convide de novo.</p>}
                </div>
                <button type="button" disabled={enviando} onClick={() => cancelar(c)}
                  className="text-[12px] font-semibold text-stone-500 hover:text-painel-tinta cursor-pointer disabled:opacity-40">
                  Cancelar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 pt-1">
        <p className="text-[12px] text-stone-500">Convidar para a equipe</p>
        <div role="radiogroup" aria-label="Papel na equipe" className="grid grid-cols-2 gap-2">
          {PAPEIS.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={papel === p.id} onClick={() => setPapel(p.id)}
              className={`h-10 rounded-full text-[13px] font-semibold cursor-pointer ring-1 ${papel === p.id
                ? 'bg-painel-tinta text-white ring-painel-tinta' : 'bg-painel-papel text-painel-tinta ring-painel-borda hover:ring-painel-acento/50'}`}>
              {p.rotulo}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-stone-500 leading-relaxed">{PAPEIS.find((p) => p.id === papel)!.ajuda}</p>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" className={campo} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" inputMode="email"
          autoCapitalize="none" className={campo} />
        <button type="button" onClick={convidar} disabled={!valido || enviando}
          className="w-full h-11 rounded-full bg-painel-tinta text-white text-[13px] font-semibold hover:bg-avle-verde disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          {enviando ? 'Enviando…' : 'Enviar convite'}
        </button>
      </div>
    </div>
  );
}
