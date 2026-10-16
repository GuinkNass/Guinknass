import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GuinkNass & Studio 13Point Tattoo | Sistema de Agendamentos",
  description: "Agendamento e consulta de orçamentos autorais - Studio 13Point Tattoo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#0a0a0c] text-neutral-100 min-h-screen antialiased selection:bg-amber-500 selection:text-neutral-950">
        {children}
      </body>
    </html>
  );
}
