/* eslint-disable @next/next/no-img-element -- PNG da marca em altura fixa; o next/image exigiria largura e altura de cada arte e não ganha nada aqui */
import logoCreme from '../../assets/avle-logo-cream.png';
import logoFloresta from '../../assets/avle-logo-forest.png';
import arvoreCreme from '../../assets/avle-tree-cream.png';
import arvoreFloresta from '../../assets/avle-tree-forest.png';
import nomeCreme from '../../assets/avle-wordmark-cream.png';
import nomeFloresta from '../../assets/avle-wordmark-forest.png';

const ARTES = {
  wordmark: { cream: nomeCreme, forest: nomeFloresta },
  tree: { cream: arvoreCreme, forest: arvoreFloresta },
  full: { cream: logoCreme, forest: logoFloresta },
};

export type LogoProps = {
  /** `wordmark` é o nome AVLE, `tree` só a árvore, `full` os dois. */
  variant?: 'wordmark' | 'tree' | 'full';
  /** Verde sobre fundo claro (o padrão); creme sobre superfície escura. */
  tone?: 'forest' | 'cream';
  height?: number;
};

/**
 * A marca, sempre a partir das artes em PNG — nunca redesenhada.
 *
 * O original recebia um `base` com o caminho relativo até a pasta de assets,
 * porque rodava em HTML solto. Aqui as artes são importadas e o Next resolve
 * o endereço sozinho, então a prop deixou de existir. O tom `auto` também saiu:
 * o design system tem um tema só, claro, e a arte verde é a que se lê nele.
 */
export function Logo({ variant = 'wordmark', tone = 'forest', height = 26 }: LogoProps) {
  return <img className="av-logo" src={ARTES[variant][tone].src} alt="AVLE" style={{ height }} />;
}
