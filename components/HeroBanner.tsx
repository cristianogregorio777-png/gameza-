"use client";

import Image from "next/image";

interface HeroBannerProps {
  /**
   * Caminho de uma imagem PNG sem fundo (atleta ou jogador ilustrado).
   * Não incluímos fotos de atletas reais aqui por direitos de imagem/autorais —
   * substitui por arte licenciada, ilustração própria da marca, ou fotos
   * enviadas pelos próprios times da Gameza.
   */
  athleteSrc?: string;
  teamCount: number;
}

export default function HeroBanner({ athleteSrc, teamCount }: HeroBannerProps) {
  return (
    <div className="relative mx-4 mt-4 overflow-hidden rounded-sheet border border-line bg-gradient-to-b from-white/[0.06] to-transparent">
      <div className="relative z-10 px-6 pt-7 pb-24">
        <p className="font-display text-[13px] tracking-wide text-lime">
          {teamCount} times prontos para jogar
        </p>
        <h1 className="font-display mt-2 max-w-[220px] text-4xl leading-[0.95] text-ink">
          Marca o teu próximo jogo
        </h1>
        <p className="font-body mt-3 max-w-[240px] text-sm text-ink-mute">
          Encontra adversários no teu bairro ou escola, sem precisar de criar
          um time.
        </p>
      </div>

      {/* Slot do atleta — recortado, ancorado à direita, sangrando pra fora do card */}
      <div className="pointer-events-none absolute bottom-0 right-[-8px] h-[240px] w-[190px]">
        {athleteSrc ? (
          <Image
            src={athleteSrc}
            alt=""
            fill
            className="object-contain object-bottom [filter:drop-shadow(0_18px_24px_rgba(0,0,0,0.55))]"
          />
        ) : (
          // Fallback quando ainda não há asset: silhueta simples em SVG
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

      <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-lime/20 blur-[70px]" />
    </div>
  );
}
