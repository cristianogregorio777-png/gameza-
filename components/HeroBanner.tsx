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
    <section className="hero-banner relative mx-4 mt-4 min-h-[320px] overflow-hidden rounded-sheet border border-cream/15 bg-navy-deep lg:mx-auto lg:mt-8 lg:min-h-[380px] lg:max-w-[960px]">
      <div className="absolute inset-0 bg-navy-deep" />

      <svg
        aria-hidden="true"
        viewBox="0 0 520 320"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full text-cream opacity-[0.14]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <path d="M-20 160H540" />
        <circle cx="260" cy="160" r="52" />
        <circle cx="260" cy="160" r="2" fill="currentColor" stroke="none" />
        <path d="M-6 76H72C99 76 120 97 120 124V196C120 223 99 244 72 244H-6" />
        <path d="M526 76H448C421 76 400 97 400 124V196C400 223 421 244 448 244H526" />
        <path d="M0 320L178 210M520 320L342 210" opacity=".45" />
      </svg>

      <div className="absolute left-6 top-1/2 z-10 flex max-w-[125px] -translate-y-1/2 items-start gap-3 lg:left-12 lg:max-w-[260px]">
        <span className="mt-1 h-12 w-0.5 shrink-0 bg-orange" />
        <div>
          <h1 className="font-display text-[27px] font-bold leading-[1.05] text-cream lg:text-5xl">
            Marca o teu jogo.
          </h1>
          <p className="mt-2 text-[13px] font-semibold leading-snug text-orange lg:text-base">
            Com a Raios.
          </p>
        </div>
      </div>

      {/* Slot do atleta — recortado, ancorado à direita, sangrando pra fora do card */}
      <div className="pointer-events-none absolute bottom-0 right-[-14px] h-[320px] w-[250px] lg:right-8 lg:h-[380px] lg:w-[340px]">
        {athleteSrc ? (
          <Image
            src={athleteSrc}
            alt=""
            fill
            priority
            sizes="250px"
            className="athlete-figure object-contain object-bottom"
          />
        ) : (
          <svg
            viewBox="0 0 190 240"
            className="h-full w-full opacity-[0.12]"
            fill="none"
          >
            <ellipse cx="95" cy="220" rx="60" ry="10" fill="currentColor" />
            <path
              d="M95 20c-16 0-28 13-28 30 0 12 6 22 15 28l-4 130h34l-4-130c9-6 15-16 15-28 0-17-12-30-28-30Z"
              fill="currentColor"
            />
          </svg>
        )}
      </div>

    </section>
  );
}
