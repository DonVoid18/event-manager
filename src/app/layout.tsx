import "./globals.css";

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { Toaster } from "@/shared/infrastructure/shadcn/components/ui/sonner";
import { TooltipProvider } from "@/shared/infrastructure/shadcn/components/ui/tooltip";
import type { Metadata } from "next";
import { cn } from "@/shared/infrastructure/shadcn/lib/utils";

import { ThemeProvider } from "@/shared/infrastructure/components/theme-provider";
import { ClientErrorReporter } from "@/shared/infrastructure/logging/ClientErrorReporter";

export const metadata: Metadata = {
  title: {
    default: "TUMITECH · Gestión de eventos",
    template: "%s · TUMITECH",
  },
  description: "Sistema web para la gestión de eventos de TUMITECH S.A.C.: registro de asistentes, invitaciones y check-in.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("font-sans", GeistSans.variable, GeistMono.variable)} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ClientErrorReporter />
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
