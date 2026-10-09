import type { Metadata } from "next";
import { Inter, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DominioHackCTF",
  description: "Plataforma web orientada a la comunidad de hacking ético que combina laboratorios prácticos tipo CTF con módulos de aprendizaje teórico progresivo. El sistema permite a los usuarios aprender conceptos de ciberseguridad ofensiva de forma estructurada, avanzando a través de módulos con contenido teórico y preguntas de validación, para luego aplicar ese conocimiento en máquinas vulnerables reales desplegadas en contenedores aislados.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    
    </html>
  );
}
