import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "ABAD Laboratorio · Registro de Pacientes",
    template: "%s · ABAD Laboratorio",
  },
  description:
    "Módulo interno de registro de pacientes ABAD para exportación a Athenea.",
  applicationName: "ABAD Registro de Pacientes",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full bg-canvas text-ink">{children}</body>
    </html>
  );
}
