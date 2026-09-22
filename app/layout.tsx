import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import { ToastProvider } from "../components/Toast";
import "./globals.css";

const display = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Raios — Marca o teu jogo",
  description: "Raios Futebol Club: encontra adversários e marca o teu próximo jogo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO" className={`${display.variable} ${body.variable}`}>
      <body className="bg-base font-body text-ink">
        <ToastProvider>
          <main className="mx-auto max-w-app md:max-w-desk">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
