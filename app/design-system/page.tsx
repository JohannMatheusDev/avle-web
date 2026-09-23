import type { Metadata } from 'next';
import Catalogo from './Catalogo';
import EstadosForcados from './EstadosForcados';
import './vitrine.css';

/**
 * Vitrine do design system: a biblioteca inteira, com os estados de cada peça.
 *
 * Existe para conferir o design system dentro do app de verdade — com o Next,
 * a fonte do `next/font` e a camada escura do `globals.css` carregadas —, o
 * que as páginas de `design-system/referencia` não fazem: elas mostram o
 * desenho aprovado, congelado. Aqui aparece o código atual.
 *
 * Fica fora dos buscadores. Não tem dado de ninguém, mas também não é página
 * para cliente encontrar.
 */
export const metadata: Metadata = {
  title: 'Design system · AVLE',
  robots: { index: false, follow: false },
};

export default function VitrineDoDesignSystem() {
  return (
    <div className="avle-ds vitrine">
      <EstadosForcados />
      <div className="vitrine__topo">
        <h1>Design system</h1>
        <p>
          Os componentes de <code>design-system/</code>, com todos os estados, na paleta da AVLE. Hover, foco e
          pressionado aparecem fixos para comparação; as peças continuam respondendo ao mouse e ao teclado.
          O contrato visual está no <code>DESIGN.md</code> da raiz.
        </p>
      </div>
      <div className="vitrine__corpo">
        <Catalogo />
      </div>
    </div>
  );
}
