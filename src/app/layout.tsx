import "./globals.css";

import { Geist_Mono, Inter } from "next/font/google";

import { Toaster } from "@/shared/infrastructure/shadcn/components/ui/sonner";
import { TooltipProvider } from "@/shared/infrastructure/shadcn/components/ui/tooltip";
import type { Metadata } from "next";
import { cn } from "@/shared/infrastructure/shadcn/lib/utils";

import { ThemeProvider } from "@/shared/infrastructure/components/theme-provider";
import { ClientErrorReporter } from "@/shared/infrastructure/logging/ClientErrorReporter";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TUMITECH · Gestión de Eventos",
  description: "Sistema web de gestión de eventos de TUMITECH S.A.C.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <body
        className={`${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientErrorReporter />
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
