// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubsiMatch - Consigue tu Casa Propia",
  description: "Simulador de subsidios habitacionales (DS49, DS1, DS19) y créditos hipotecarios en Chile",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-[#f9f7f2] text-[#4a4a4a] min-h-screen flex flex-col justify-between">
        {/* El contenido de cada página se inyectará aquí */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer único centralizado para toda la aplicación */}
        <footer className="bg-[#4a4a4a] text-white text-center py-4 text-sm font-light mt-10">
          <p>© 2026 SubsiMatch</p>
        </footer>
      </body>
    </html>
  );
}
