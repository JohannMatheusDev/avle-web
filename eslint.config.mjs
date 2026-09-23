import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import aderencia from "./design-system/lint/aderencia.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Páginas de referência do design system: JSX que roda no navegador pelo
    // Babel, com componentes vindos de `window`. Não é código do app.
    "design-system/referencia/**/*",
    // O servidor das referências é código de Node de verdade, e esse passa.
    // A exceção só funciona porque a linha acima termina em `/**/*`: com
    // `/**`, o ESLint ignora a pasta inteira e nem entra nela para ver isto.
    "!design-system/referencia/servir.mjs",
  ]),
  // Regras de aderência ao design system. O que foi trazido do export e o que
  // ficou de fora está explicado no próprio arquivo.
  ...aderencia,
]);

export default eslintConfig;
