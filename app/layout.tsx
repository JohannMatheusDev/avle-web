import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css"; // 🔌 A fiação que faltava para ativar o Tailwind!
import AvisoCookies from "./components/AvisoCookies";

// A tipografia da referencia escolhida. Geometrica e de terminacoes redondas,
// ela carrega a personalidade que o Inter nao tem - e continua legivel na
// tabela de parcelas, que e onde a loja passa o dia.
const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
      
      <body className={`${urbanist.className} bg-[#0A0A0A] antialiased`}>
        {children}
        <AvisoCookies />
      </body>
    </html>
  );
}