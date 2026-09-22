"use client";

import Image from "next/image";

interface HeroBannerProps {
  /**
   * Caminho de uma imagem PNG sem fundo (atleta ou jogador ilustrado).
   * Não incluímos fotos de atletas reais aqui por direitos de imagem/autorais —
   * substitui por arte licenciada, ilustração própria da marca, ou fotos
   * enviadas pelos próprios times dos Raios.
   */
  athleteSrc?: string;
}

export default function HeroBanner({ athleteSrc }: HeroBannerProps) {
  return (
    <section className="hero-banner relative mx-4 mt-4 min-h-[320px] overflow-hidden rounded-[26px] border border-white/[0.1] bg-[#0d1512]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_66%_48%,_rgba(182,255,60,0.12),_transparent_30%),linear-gradient(120deg,#101a16_0%,#0c1210_58%,#090c0c_100%)]" />

      <svg
        aria-hidden="true"
        viewBox="0 0 520 320"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-[0.1]"
        fill="none"
        stroke="#d7e8c9"
        strokeWidth="1"
      >
        <path d="M-20 160H540" />
        <circle cx="260" cy="160" r="52" />
        <circle cx="260" cy="160" r="2" fill="#d7e8c9" stroke="none" />
        <path d="M-6 76H72C99 76 120 97 120 124V196C120 223 99 244 72 244H-6" />
        <path d="M526 76H448C421 76 400 97 400 124V196C400 223 421 244 448 244H526" />
        <path d="M0 320L178 210M520 320L342 210" opacity=".45" />
      </svg>

      <div className="absolute left-6 top-1/2 z-10 flex max-w-[125px] -translate-y-1/2 items-start gap-3">
        <span className="mt-1 h-12 w-0.5 shrink-0 rounded-full bg-lime" />
        <div>
          <h1 className="font-body text-[24px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
            Marca o teu jogo.
          </h1>
          <p className="mt-2 text-[13px] font-medium leading-snug text-lime">
            Com a Raios.
          </p>
        </div>
      </div>

      {/* Slot do atleta — recortado, ancorado à direita, sangrando pra fora do card */}
      <div className="pointer-events-none absolute bottom-0 right-[-14px] h-[320px] w-[250px]">
        {athleteSrc ? (
          <Image
            src={athleteSrc}
            alt=""
            fill
            priority
            sizes="250px"
            className="object-contain object-bottom [filter:drop-shadow(0_18px_24px_rgba(0,0,0,0.7))]"
          />
        ) : (
          <svg
            viewBox="0 0 190 240"
            className="h-full w-full opacity-[0.14]"
            fill="none"
          >
            <ellipse cx="95" cy="220" rx="60" ry="10" fill="#000" />
            <path
              d="M95 20c-16 0-28 13-28 30 0 12 6 22 15 28l-4 130h34l-4-130c9-6 15-16 15-28 0-17-12-30-28-30Z"
              fill="url(#g)"
            />
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#B6FF3C" />
                <stop offset="1" stopColor="#2BF0D9" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>

    </section>
  );
}
