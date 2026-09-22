import type { Config } from "tailwindcss";

/**
 * RAIOS — Design tokens
 *
 * Cor:
 *  - base:      #0A0A0A  (fundo)
 *  - surface:   #131313  (painéis sólidos, ex. bottom sheet)
 *  - glass:     rgba(255,255,255,.04) + blur (cards)
 *  - line:      rgba(255,255,255,.08) (bordas translúcidas)
 *  - lime:      #B6FF3C  (CTA primário — "marcar jogo")
 *  - cyan:      #2BF0D9  (acento secundário — futsal / info)
 *  - ink:       #F4F4EF  (texto primário)
 *  - mute:      #8C8C86  (texto secundário)
 *
 * Tipografia:
 *  - Display "Ozzy"  -> substituto: 'Anton' (condensada, robusta — números
 *    de camisa, placares, títulos). Usada como elemento visual ativo, não
 *    só como rótulo.
 *  - Corpo "Ground"  -> substituto: 'Inter' (legibilidade em telas pequenas).
 */

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#0A0A0A",
        surface: "#131313",
        line: "rgba(255,255,255,0.08)",
        lime: {
          DEFAULT: "#B6FF3C",
          dim: "#8FCC2E",
        },
        cyan: {
          DEFAULT: "#2BF0D9",
          dim: "#22BFAD",
        },
        ink: {
          DEFAULT: "#F4F4EF",
          mute: "#8C8C86",
          faint: "#5A5A55",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        sheet: "28px",
        card: "20px",
        pill: "999px",
      },
      backdropBlur: {
        glass: "18px",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(182,255,60,0.25), 0 8px 24px -8px rgba(182,255,60,0.35)",
        soft: "0 12px 40px -16px rgba(0,0,0,0.6)",
      },
      maxWidth: {
        app: "430px",
        desk: "1180px",
      },
    },
  },
  plugins: [],
};

export default config;
