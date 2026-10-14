'use client';

/**
 * O admin cadastra a loja com o percentual negociado e recebe o link do
 * convite para mandar ao lojista.
 *
 * O CNPJ preenche a razão social e a sede pela Receita (BrasilAPI), porque é
 * isso que vai escrito no contrato e digitar endereço é onde mais se erra. O
 * servidor confere o CNPJ de novo ao salvar.
 */

import { useState } from 'react';
import { apiFetch } from '../../lib/api';
import { comissaoPorParcela } from './ComissaoDaLoja';

const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CadastroDeLojaPeloAdmin({ aoCadastrar }: { aoCadastrar?: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeComercial, setNomeComercial] = useState('');
  const [enderecoSede, setEnderecoSede] = useState('');
  const [telefone, setTelefone] = useState('');
  const [percentual, setPercentual] = useState('');
  // O que o cadastro da tela inicial pede da loja, para a loja chegar pelo
  // link já completa: só falta o lojista criar a senha e aceitar.
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [faturamento, setFaturamento] = useState('');
  const [chaveAsaas, setChaveAsaas] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const [convite, setConvite] = useState<{ link: string; expiraEm: string; nomeComercial: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const mascaraCnpj = (v: string) => v.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');

  const consultarReceita = async () => {
    const digitos = cnpj.replace(/\D/g, '');
    if (digitos.length !== 14) return;
    setConsultando(true);
    setAviso('');
    setErro('');
    try {
      const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digitos}`).catch(() => null);
      if (!r || r.status >= 500 || r.status === 429) {
        setAviso('A Receita não respondeu agora. Preencha à mão: o CNPJ é conferido de novo ao salvar.');
        return;
      }
      if (!r.ok) throw new Error('CNPJ não encontrado na Receita.');
      const d = await r.json();
      if (d.descricao_situacao_cadastral && d.descricao_situacao_cadastral !== 'ATIVA') {
        throw new Error(`A empresa consta como ${d.descricao_situacao_cadastral} na Receita.`);
      }
      setRazaoSocial(String(d.razao_social || '').trim());
      setNomeComercial((atual) => atual || String(d.nome_fantasia || d.razao_social || '').trim());
      const rua = [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' ');
      const partes = [rua, d.numero, d.complemento, d.bairro, d.municipio && d.uf ? `${d.municipio}/${d.uf}` : d.municipio,
        d.cep ? `CEP ${String(d.cep).replace(/^(\d{5})(\d{3})$/, '$1-$2')}` : null]
        .map((p) => (p ? String(p).trim() : '')).filter(Boolean);
      setEnderecoSede(partes.join(', '));
      if (d.ddd_telefone_1) setTelefone((atual) => atual || String(d.ddd_telefone_1));
      if (d.cep) setCep((atual) => atual || String(d.cep).replace(/^(\d{5})(\d{3})$/, '$1-$2'));
      if (d.email) setEmail((atual) => atual || String(d.email).toLowerCase());
      setAviso('Dados da Receita preenchidos. Confira antes de salvar.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível consultar o CNPJ.');
    } finally {
      setConsultando(false);
    }
  };

  const numeroPercentual = Number(percentual.replace(',', '.'));
  const percentualOk = numeroPercentual > 0 && numeroPercentual < 100;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valido = cnpj.replace(/\D/g, '').length === 14 && razaoSocial.trim() && nomeComercial.trim() && enderecoSede.trim()
    && percentualOk && emailOk && cep.replace(/\D/g, '').length === 8 && faturamento.replace(/\D/g, '').length > 0
    && chaveAsaas.trim().startsWith('$aact_');

  const mascaraCep = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
  const mascaraMoeda = (v: string) => {
    const d = v.replace(/\D/g, '');
    return d ? (Number(d) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    setSalvando(true);
    setErro('');
    try {
      const r = await apiFetch('/api/admin/lojas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cnpj, razaoSocial, nomeComercial, enderecoSede, telefone, percentual, email: email.trim(), cep,
          faturamento: (Number(faturamento.replace(/\D/g, '')) / 100).toFixed(2), chaveAsaas: chaveAsaas.trim(),
        }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.erro || 'Não foi possível cadastrar a loja.');
      setConvite(d);
      aoCadastrar?.();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível cadastrar a loja.');
    } finally {
      setSalvando(false);
    }
  };

  const copiar = async () => {
    if (!convite) return;
    try {
      await navigator.clipboard.writeText(convite.link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErro('O navegador não deixou copiar. Selecione o link e copie à mão.');
    }
  };

  const recomecar = () => {
    setConvite(null); setCnpj(''); setRazaoSocial(''); setNomeComercial(''); setEnderecoSede('');
    setTelefone(''); setPercentual(''); setAviso(''); setErro('');
    setEmail(''); setCep(''); setFaturamento(''); setChaveAsaas('');
  };

  const campo = 'w-full h-10 px-3 rounded-xl border border-stone-200 bg-white text-[13px] focus:outline-none focus:border-[#0B1E14]';
  const rotulo = 'block text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1';

  if (!aberto) {
    return (
      <div className="cartao-avle p-5 flex flex-wrap items-center justify-between gap-3 text-left">
        <div>
          <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">Cadastrar loja</h3>
          <p className="text-[12px] text-stone-500 mt-0.5">Com o percentual negociado. Gera o link do contrato para mandar ao lojista.</p>
        </div>
        <button type="button" onClick={() => setAberto(true)}
          className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde cursor-pointer">
          Nova loja
        </button>
      </div>
    );
  }

  if (convite) {
    const texto = `Olá! Aqui é a AVLE. Segue o link para você ler e aceitar o contrato da ${convite.nomeComercial} e criar o acesso ao painel: ${convite.link}`;
    const numero = telefone.replace(/\D/g, '');
    return (
      <div className="cartao-avle p-6 space-y-3 text-left">
        <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">{convite.nomeComercial} cadastrada</h3>
        <p className="text-[12px] text-stone-600">
          Mande este link ao lojista. Ele vale até {new Date(convite.expiraEm).toLocaleDateString('pt-BR')}: ali ele lê o contrato,
          cria o acesso e aceita. O painel da loja só abre depois do aceite.
        </p>
        <p className="text-[12px] font-mono bg-painel-papel rounded-xl p-3 break-all select-all">{convite.link}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copiar}
            className="h-10 px-5 rounded-full bg-painel-tinta text-white text-[12px] font-semibold cursor-pointer">
            {copiado ? 'Link copiado' : 'Copiar link'}
          </button>
          {numero.length >= 10 && (
            <a href={`https://wa.me/55${numero}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer"
              className="h-10 px-5 inline-flex items-center rounded-full border border-stone-200 text-[12px] font-semibold text-painel-tinta">
              Mandar no WhatsApp
            </a>
          )}
          <button type="button" onClick={recomecar} className="h-10 px-5 rounded-full text-[12px] text-stone-500 cursor-pointer">
            Cadastrar outra
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={salvar} className="cartao-avle p-6 space-y-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 style={{ fontWeight: 600 }} className="text-[15px] text-painel-tinta">Cadastrar loja</h3>
          <p className="text-[12px] text-stone-500 mt-0.5">Esses dados vão escritos no contrato que o lojista vai aceitar.</p>
        </div>
        <button type="button" onClick={() => setAberto(false)} className="text-[12px] text-stone-400 cursor-pointer">Fechar</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={rotulo} htmlFor="cl-cnpj">CNPJ *</label>
          <input id="cl-cnpj" className={campo} value={cnpj} inputMode="numeric" placeholder="00.000.000/0000-00"
            onChange={(e) => setCnpj(mascaraCnpj(e.target.value))} onBlur={consultarReceita} />
          {consultando && <p className="text-[10px] text-stone-400 mt-1">Consultando a Receita…</p>}
        </div>
        <div>
          <label className={rotulo} htmlFor="cl-percentual">Percentual da AVLE *</label>
          <div className="flex items-center gap-1">
            <input id="cl-percentual" className={campo} value={percentual} inputMode="decimal" placeholder="Ex.: 5"
              onChange={(e) => setPercentual(e.target.value.replace(/[^0-9,.]/g, ''))} />
            <span className="text-[13px] text-stone-500">%</span>
          </div>
          {percentualOk && (
            <p className="text-[10px] text-stone-500 mt-1">
              Numa parcela de R$ 179,90: AVLE {reais(comissaoPorParcela(179.9, numeroPercentual))}, loja {reais(179.9 - comissaoPorParcela(179.9, numeroPercentual))}.
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className={rotulo} htmlFor="cl-razao">Razão social *</label>
          <input id="cl-razao" className={campo} value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
        </div>
        <div>
          <label className={rotulo} htmlFor="cl-nome">Nome da loja *</label>
          <input id="cl-nome" className={campo} value={nomeComercial} onChange={(e) => setNomeComercial(e.target.value)} placeholder="Como as clientes conhecem" />
        </div>
        <div>
          <label className={rotulo} htmlFor="cl-tel">Telefone do lojista</label>
          <input id="cl-tel" className={campo} value={telefone} inputMode="numeric" onChange={(e) => setTelefone(e.target.value)} placeholder="Para mandar o link" />
        </div>
        <div className="sm:col-span-2">
          <label className={rotulo} htmlFor="cl-sede">Endereço da sede *</label>
          <input id="cl-sede" className={campo} value={enderecoSede} onChange={(e) => setEnderecoSede(e.target.value)} placeholder="Rua, número, bairro, cidade/UF, CEP" />
        </div>
        <div>
          <label className={rotulo} htmlFor="cl-email">E-mail do lojista *</label>
          <input id="cl-email" type="email" className={campo} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Vai preenchido no convite" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={rotulo} htmlFor="cl-cep">CEP *</label>
            <input id="cl-cep" className={campo} value={cep} inputMode="numeric" onChange={(e) => setCep(mascaraCep(e.target.value))} placeholder="85010-000" />
          </div>
          <div>
            <label className={rotulo} htmlFor="cl-faturamento">Faturamento *</label>
            <input id="cl-faturamento" className={campo} value={faturamento} inputMode="numeric" onChange={(e) => setFaturamento(mascaraMoeda(e.target.value))} placeholder="R$ 10.000,00" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={rotulo} htmlFor="cl-chave">Chave de API da conta do Asaas da loja *</label>
          <input id="cl-chave" type="password" autoComplete="off" className={`${campo} font-mono`} value={chaveAsaas}
            onChange={(e) => setChaveAsaas(e.target.value)} placeholder="$aact_…" />
          <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">
            As parcelas caem direto na conta do Asaas da loja, e a AVLE recebe só a comissão. A AVLE não abre conta para a
            loja: peça ao lojista a chave de Integrações → Chave de API, no Asaas dele. Ela fica guardada cifrada.
          </p>
          {chaveAsaas.trim().length > 0 && !chaveAsaas.trim().startsWith('$aact_') && (
            <p className="text-[10px] text-rose-600 mt-1">A chave de API começa com $aact_. Não é o Wallet ID nem o número da conta.</p>
          )}
        </div>
      </div>

      {aviso && <p className="text-[12px] text-stone-600">{aviso}</p>}
      {erro && <p className="text-[12px] text-rose-600">{erro}</p>}

      <button type="submit" disabled={!valido || salvando}
        className="h-10 px-6 rounded-full bg-painel-tinta text-white text-[12px] font-semibold hover:bg-avle-verde disabled:opacity-50 cursor-pointer">
        {salvando ? 'Cadastrando…' : 'Cadastrar e gerar o link'}
      </button>
    </form>
  );
}
