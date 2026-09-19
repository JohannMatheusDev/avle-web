import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css"; // 🔌 A fiação que faltava para ativar o Tailwind!
import AvisoCookies from "./components/AvisoCookies";

const inter = Inter({ subsets: ["latin"] });

// A serif da pagina comercial. Fica numa variavel, e nao no body, porque o
// resto do sistema continua em Inter: painel tem numero e tabela, e serif
// grande atrapalha leitura de dado.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--fonte-display",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "AVLE",
  description: "Seu clube de compras planejado",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      
      <body className={`${inter.className} ${fraunces.variable} bg-avle-bege antialiased`}>
        {children}
        <AvisoCookies />
      </body>
    </html>
  );
}