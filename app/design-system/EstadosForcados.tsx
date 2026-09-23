'use client';

import { useEffect } from 'react';

/**
 * Deixa a vitrine mostrar hover, foco e clique sem ninguém encostar no mouse.
 *
 * Esses estados só existem como pseudo-classe (`:hover`, `:focus-visible`,
 * `:active`), que não dá para ligar por código. Em vez de escrever uma segunda
 * cópia de cada regra para a vitrine — que ficaria velha na primeira mudança
 * do design system —, este componente lê as regras `av-*`/`kit-*` já
 * carregadas e cria uma versão delas presa a uma classe: `.ds-hover .av-btn`
 * vale o mesmo que `.av-btn:hover`. É o que o addon de pseudo-estados do
 * Storybook faz.
 *
 * Só roda na rota da vitrine. Nada disso vai para as telas do app.
 */
const PSEUDOS: [RegExp, string][] = [
  [/:hover/g, 'ds-hover'],
  [/:focus-visible|:focus-within|:focus(?![-\w])/g, 'ds-foco'],
  [/:active/g, 'ds-clique'],
];

function versaoForcada(seletor: string): string[] {
  const saida: string[] = [];
  for (const parte of seletor.split(',')) {
    if (!/\.(av|kit)-/.test(parte)) continue;
    for (const [pseudo, classe] of PSEUDOS) {
      pseudo.lastIndex = 0;
      if (!pseudo.test(parte)) continue;
      pseudo.lastIndex = 0;
      saida.push(`.${classe} ${parte.trim().replace(pseudo, '')}`);
    }
  }
  return saida;
}

function copiarRegras(regras: CSSRuleList): string {
  let css = '';
  for (const regra of Array.from(regras)) {
    if (regra instanceof CSSStyleRule) {
      const seletores = versaoForcada(regra.selectorText);
      if (seletores.length) css += `${seletores.join(',')}{${regra.style.cssText}}\n`;
    } else if (regra instanceof CSSMediaRule) {
      const dentro = copiarRegras(regra.cssRules);
      if (dentro) css += `@media ${regra.conditionText}{${dentro}}\n`;
    } else if ('cssRules' in regra) {
      // Camadas (`@layer`) e `@supports` guardam regras dentro de si.
      css += copiarRegras((regra as CSSGroupingRule).cssRules);
    }
  }
  return css;
}

export default function EstadosForcados() {
  useEffect(() => {
    let css = '';
    for (const folha of Array.from(document.styleSheets)) {
      try {
        css += copiarRegras(folha.cssRules);
      } catch {
        // Folha de outro domínio (a fonte do Google): o navegador não deixa ler.
      }
    }
    const estilo = document.createElement('style');
    estilo.dataset.vitrine = 'estados-forcados';
    estilo.textContent = css;
    document.head.appendChild(estilo);
    return () => estilo.remove();
  }, []);

  return null;
}
