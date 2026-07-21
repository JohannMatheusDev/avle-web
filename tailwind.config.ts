import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",         // Removido o /src
    "./components/**/*.{js,ts,jsx,tsx,mdx}",  // Removido o /src
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",       // Removido o /src
  ],
  theme: {
    extend: {
      colors: {
        avle: {
          bege: '#F7F4EB',
          terracota: '#C05A3E',
          verde: '#1C3F24',
          texto: '#2C2A29',
        },
      },
    },
  },
  plugins: [],
};
export default config;