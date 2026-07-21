import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // 🔌 A fiação que faltava para ativar o Tailwind!

const inter = Inter({ subsets: ["latin"] });

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
      
      <body className={`${inter.className} bg-avle-bege antialiased`}>
        {children}
      </body>
    </html>
  );
}