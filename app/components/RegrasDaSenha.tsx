'use client';

/**
 * As regras da senha, à vista desde antes de a cliente digitar, cada uma
 * acendendo conforme ela digita. Quem redefinia a senha só via "Fraca" e o
 * botão apagado, sem saber o que faltava. As regras são as mesmas do servidor
 * (requisitosSenha em app/lib/validacao.ts).
 */

import { requisitosSenha } from '../lib/validacao';

export default function RegrasDaSenha({ senha }: { senha: string }) {
  const r = requisitosSenha(senha);
  const regras = [
    { ok: r.tamanhoMinimo, texto: 'Pelo menos 8 caracteres' },
    { ok: r.temMaiuscula, texto: 'Uma letra maiúscula (A, B, C…)' },
    { ok: r.temNumero, texto: 'Um número (0 a 9)' },
    { ok: r.temCaracterEspecial, texto: 'Um caractere especial, como ! @ # $ % & * ou ponto' },
  ];
  const faltam = regras.filter((x) => !x.ok).length;

  return (
    <div className="mt-2 p-3 bg-stone-50 border border-stone-200/60 rounded-xl space-y-1.5 text-[12px] text-left" aria-live="polite">
      <p className="text-[11px] font-bold text-stone-500">
        {faltam === 0 ? 'Senha pronta.' : `A senha precisa ter (falta${faltam === 1 ? '' : 'm'} ${faltam}):`}
      </p>
      {regras.map((x) => (
        <div key={x.texto} className={`flex items-center gap-2 transition-colors ${x.ok ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`}>
          <span aria-hidden="true" className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${x.ok ? 'bg-emerald-600 text-white' : 'border border-stone-300'}`}>
            {x.ok ? '✓' : ''}
          </span>
          <span>{x.texto}</span>
        </div>
      ))}
    </div>
  );
}
