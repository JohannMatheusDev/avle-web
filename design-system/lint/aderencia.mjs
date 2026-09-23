/**
 * Aderência ao design system, dentro da config do ESLint do projeto.
 *
 * Veio do export do Claude Design como `_adherence.oxlintrc.json`, escrito
 * para o oxlint. O projeto roda ESLint, então as regras vieram para cá com os
 * mesmos seletores e a mesma severidade (`warn`). O que mudou, e por quê:
 *
 * - A lista de props permitidas de Button, IconButton, Pill, Input, Select e
 *   Checkbox foi descartada. Esses componentes aceitam todos os atributos do
 *   elemento HTML que desenham, e a lista gerada não sabia disso: acusava
 *   `<Button onClick>`, e as próprias telas de exemplo do export violavam a
 *   regra. Quem confere essas props é o TypeScript. As regras de valor
 *   (`variant`, `size`) desses componentes continuam.
 * - As regras de BarDatum, TableColumn, NavItem e dos outros tipos de dado
 *   foram descartadas: eles não são elementos JSX, e a regra nunca disparava.
 * - A lista de props do Tooltip também foi descartada. A regra reconhece o
 *   componente só pelo nome, e os painéis usam o `<Tooltip>` do Recharts nos
 *   gráficos: ao ligar a regra, os oito tooltips de gráfico da loja e do
 *   admin passaram a ser acusados como uso errado do design system. Qualquer
 *   componente de outra biblioteca com o mesmo nome de um destes cai no mesmo
 *   problema — se aparecer, a saída é a mesma.
 * - A prop `base` do Logo saiu da lista, porque deixou de existir, e o tom
 *   `auto` saiu dos valores aceitos: o design system tem um tema só.
 * - A `react/forbid-elements` ficou de fora: veio com a lista de proibidos vazia.
 */

// Arquivos escritos antes do design system chegar. Somados, dão 1,169
// avisos de cor e px soltos (medido ao trazer a regra). Ligar a regra neles
// afogaria qualquer aviso novo no meio de mais de mil antigos. Arquivo que
// migrar para o design system sai desta lista — ela só pode encolher. Os
// colchetes de rota vão escapados, senão o glob lê `[id]` como classe de
// caracteres e o arquivo não casa com nada.
const LEGADO = [
  "app/admin/page.tsx",
  "app/components/AvisoCookies.tsx",
  "app/convite/\\[id\\]/page.tsx",
  "app/dashboard/components/BoasVindasTermos.tsx",
  "app/dashboard/components/Casca.tsx",
  "app/dashboard/components/CheckoutPix.tsx",
  "app/dashboard/components/DashboardAdmin.tsx",
  "app/dashboard/components/DashboardCliente.tsx",
  "app/dashboard/components/DashboardLoja.tsx",
  "app/dashboard/components/EnvioDeCobrancasWhatsapp.tsx",
  "app/dashboard/components/ExtratoDePagamentos.tsx",
  "app/dashboard/components/ListaDeAvisos.tsx",
  "app/dashboard/components/PainelDeAvisosFlutuante.tsx",
  "app/dashboard/components/ParcelasDoPlano.tsx",
  "app/dashboard/components/TelaCarregamento.tsx",
  "app/fatura/page.tsx",
  "app/page.tsx",
  "app/previa-visual/page.tsx",
  // Define a paleta antiga em hexadecimal, que é justamente o papel dele. O
  // Tailwind 4 nem lê este arquivo sem um `@config` no CSS, mas ele segue aqui.
  "tailwind.config.ts",
];

const ESTILO = [
  { selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]", message: "Cor em hexadecimal solta — use um token de cor do design system via var()." },
  { selector: "Literal[value=/\\b\\d+px\\b/]", message: "Valor em px solto — use um token de espaçamento do design system via var()." },
  { selector: "Literal[value=/font-family\\s*:\\s*(?!['\\\"]?(?:Urbanist|JetBrains Mono))/i]", message: "Fonte fora do design system. Disponíveis: Urbanist, JetBrains Mono." },
];

const PROPS = [
  { selector: "JSXOpeningElement[name.name='Avatar'] > JSXAttribute > JSXIdentifier[name!=/^(?:src|name|size|brand|key|ref|className|style|children)$/]", message: "<Avatar> não aceita essa prop. Props declaradas: src, name, size, brand." },
  { selector: "JSXOpeningElement[name.name='Badge'] > JSXAttribute > JSXIdentifier[name!=/^(?:tone|dot|children|className|key|ref|className|style|children)$/]", message: "<Badge> não aceita essa prop. Props declaradas: tone, dot, children, className." },
  { selector: "JSXOpeningElement[name.name='Badge'] > JSXAttribute[name.name='tone'] > Literal[value!=/^(?:neutral|positive|negative|warning|info|solid)$/]", message: "<Badge>: `tone` precisa ser um de 'neutral' | 'positive' | 'negative' | 'warning' | 'info' | 'solid'." },
  { selector: "JSXOpeningElement[name.name='Button'] > JSXAttribute[name.name='variant'] > Literal[value!=/^(?:primary|secondary|outline|ghost|danger|inverse)$/]", message: "<Button>: `variant` precisa ser um de 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'inverse'." },
  { selector: "JSXOpeningElement[name.name='Button'] > JSXAttribute[name.name='size'] > Literal[value!=/^(?:sm|md|lg)$/]", message: "<Button>: `size` precisa ser um de 'sm' | 'md' | 'lg'." },
  { selector: "JSXOpeningElement[name.name='Card'] > JSXAttribute > JSXIdentifier[name!=/^(?:title|subtitle|actions|expand|onExpand|variant|flush|interactive|children|className|style|onClick|key|ref|className|style|children)$/]", message: "<Card> não aceita essa prop. Props declaradas: title, subtitle, actions, expand, onExpand, variant, flush, interactive, children, className, style, onClick." },
  { selector: "JSXOpeningElement[name.name='Card'] > JSXAttribute[name.name='variant'] > Literal[value!=/^(?:default|raised|accent)$/]", message: "<Card>: `variant` precisa ser um de 'default' | 'raised' | 'accent'." },
  { selector: "JSXOpeningElement[name.name='Dialog'] > JSXAttribute > JSXIdentifier[name!=/^(?:open|title|description|children|footer|onClose|key|ref|className|style|children)$/]", message: "<Dialog> não aceita essa prop. Props declaradas: open, title, description, children, footer, onClose." },
  { selector: "JSXOpeningElement[name.name='EmptyState'] > JSXAttribute > JSXIdentifier[name!=/^(?:icon|title|body|action|key|ref|className|style|children)$/]", message: "<EmptyState> não aceita essa prop. Props declaradas: icon, title, body, action." },
  { selector: "JSXOpeningElement[name.name='Icon'] > JSXAttribute > JSXIdentifier[name!=/^(?:name|size|className|style|label|key|ref|className|style|children)$/]", message: "<Icon> não aceita essa prop. Props declaradas: name, size, className, style, label." },
  { selector: "JSXOpeningElement[name.name='IconButton'] > JSXAttribute[name.name='variant'] > Literal[value!=/^(?:outline|filled|accent)$/]", message: "<IconButton>: `variant` precisa ser um de 'outline' | 'filled' | 'accent'." },
  { selector: "JSXOpeningElement[name.name='IconButton'] > JSXAttribute[name.name='size'] > Literal[value!=/^(?:sm|md|lg)$/]", message: "<IconButton>: `size` precisa ser um de 'sm' | 'md' | 'lg'." },
  { selector: "JSXOpeningElement[name.name='Input'] > JSXAttribute[name.name='size'] > Literal[value!=/^(?:sm|md)$/]", message: "<Input>: `size` precisa ser um de 'sm' | 'md'." },
  { selector: "JSXOpeningElement[name.name='Insight'] > JSXAttribute > JSXIdentifier[name!=/^(?:title|children|icon|muted|onClick|key|ref|className|style|children)$/]", message: "<Insight> não aceita essa prop. Props declaradas: title, children, icon, muted, onClick." },
  { selector: "JSXOpeningElement[name.name='ListRow'] > JSXAttribute > JSXIdentifier[name!=/^(?:icon|lead|title|subtitle|meta|trailing|trailingSub|trailingTone|onClick|key|ref|className|style|children)$/]", message: "<ListRow> não aceita essa prop. Props declaradas: icon, lead, title, subtitle, meta, trailing, trailingSub, trailingTone, onClick." },
  { selector: "JSXOpeningElement[name.name='ListRow'] > JSXAttribute[name.name='trailingTone'] > Literal[value!=/^(?:positive|negative)$/]", message: "<ListRow>: `trailingTone` precisa ser um de 'positive' | 'negative'." },
  { selector: "JSXOpeningElement[name.name='Logo'] > JSXAttribute > JSXIdentifier[name!=/^(?:variant|tone|height|key|ref|className|style|children)$/]", message: "<Logo> não aceita essa prop. Props declaradas: variant, tone, height." },
  { selector: "JSXOpeningElement[name.name='Logo'] > JSXAttribute[name.name='variant'] > Literal[value!=/^(?:wordmark|tree|full)$/]", message: "<Logo>: `variant` precisa ser um de 'wordmark' | 'tree' | 'full'." },
  { selector: "JSXOpeningElement[name.name='Logo'] > JSXAttribute[name.name='tone'] > Literal[value!=/^(?:forest|cream)$/]", message: "<Logo>: `tone` precisa ser um de 'forest' | 'cream'." },
  { selector: "JSXOpeningElement[name.name='Money'] > JSXAttribute > JSXIdentifier[name!=/^(?:value|currency|size|decimals|locale|style|key|ref|className|style|children)$/]", message: "<Money> não aceita essa prop. Props declaradas: value, currency, size, decimals, locale, style." },
  { selector: "JSXOpeningElement[name.name='Pill'] > JSXAttribute[name.name='size'] > Literal[value!=/^(?:sm|md)$/]", message: "<Pill>: `size` precisa ser um de 'sm' | 'md'." },
  { selector: "JSXOpeningElement[name.name='Progress'] > JSXAttribute > JSXIdentifier[name!=/^(?:value|max|knob|plain|size|key|ref|className|style|children)$/]", message: "<Progress> não aceita essa prop. Props declaradas: value, max, knob, plain, size." },
  { selector: "JSXOpeningElement[name.name='Progress'] > JSXAttribute[name.name='size'] > Literal[value!=/^(?:sm|md)$/]", message: "<Progress>: `size` precisa ser um de 'sm' | 'md'." },
  { selector: "JSXOpeningElement[name.name='Radio'] > JSXAttribute > JSXIdentifier[name!=/^(?:label|checked|onChange|name|value|disabled|key|ref|className|style|children)$/]", message: "<Radio> não aceita essa prop. Props declaradas: label, checked, onChange, name, value, disabled." },
  { selector: "JSXOpeningElement[name.name='Sparkline'] > JSXAttribute > JSXIdentifier[name!=/^(?:data|width|height|color|area|dot|key|ref|className|style|children)$/]", message: "<Sparkline> não aceita essa prop. Props declaradas: data, width, height, color, area, dot." },
  { selector: "JSXOpeningElement[name.name='Stat'] > JSXAttribute > JSXIdentifier[name!=/^(?:label|value|money|currency|size|delta|deltaLabel|foot|key|ref|className|style|children)$/]", message: "<Stat> não aceita essa prop. Props declaradas: label, value, money, currency, size, delta, deltaLabel, foot." },
  { selector: "JSXOpeningElement[name.name='Switch'] > JSXAttribute > JSXIdentifier[name!=/^(?:label|checked|onChange|disabled|key|ref|className|style|children)$/]", message: "<Switch> não aceita essa prop. Props declaradas: label, checked, onChange, disabled." },
  { selector: "JSXOpeningElement[name.name='Toast'] > JSXAttribute > JSXIdentifier[name!=/^(?:tone|children|action|onAction|key|ref|className|style|children)$/]", message: "<Toast> não aceita essa prop. Props declaradas: tone, children, action, onAction." },
  { selector: "JSXOpeningElement[name.name='Toast'] > JSXAttribute[name.name='tone'] > Literal[value!=/^(?:positive|negative)$/]", message: "<Toast>: `tone` precisa ser um de 'positive' | 'negative'." },
];

// Tudo o que é do app, menos o próprio design system: é lá dentro que os
// valores crus viram token, e é de lá que os componentes são importados.
const CODIGO_DO_APP = ['**/*.{js,jsx,ts,tsx,mjs}'];
const DESIGN_SYSTEM = ['design-system/**'];

const aderencia = [
  {
    files: CODIGO_DO_APP,
    ignores: DESIGN_SYSTEM,
    rules: {
      'no-restricted-imports': ['warn', {
        patterns: [{
          group: ['@/design-system/components/*', '**/design-system/components/*'],
          message: "Importe os componentes de '@/design-system', e não do arquivo interno.",
        }],
      }],
      'no-restricted-syntax': ['warn', ...ESTILO, ...PROPS],
    },
  },
  // No legado vale só a parte dos componentes. Como o ESLint troca a lista
  // inteira de uma regra quando outro bloco a redefine, este bloco repete os
  // seletores de props sem os de estilo.
  {
    files: LEGADO,
    rules: {
      'no-restricted-syntax': ['warn', ...PROPS],
    },
  },
];

export default aderencia;
