import type { Metadata } from "next";
import { DM_Sans, Roboto_Slab } from "next/font/google";
import { ToastProvider } from "../components/Toast";
import BrandHeader from "../components/BrandHeader";
import HumanVerificationGate from "../components/HumanVerificationGate";
import "./globals.css";

const display = Roboto_Slab({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = DM_Sans({
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
          <HumanVerificationGate>
            <main className="mx-auto min-h-screen max-w-app lg:max-w-[1120px] lg:px-8">
              <BrandHeader />
              {children}
            </main>
          </HumanVerificationGate>
        </ToastProvider>
      </body>
    </html>
  );
}
