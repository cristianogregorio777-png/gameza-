import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#16324F",
        "navy-deep": "#10263D",
        "navy-soft": "#244461",
        surface: "#1B3B59",
        "surface-raised": "#244461",
        line: "rgba(245,232,214,0.18)",
        orange: {
          DEFAULT: "#F0791E",
          dim: "#C85E12",
        },
        cream: "#F5E8D6",
        olive: {
          DEFAULT: "#4B5D45",
          dim: "#384635",
        },
        gold: "#F2BE3D",
        warning: "#F2BE3D",
        danger: "#D95C4F",
        ink: {
          DEFAULT: "#F5E8D6",
          mute: "#C6C1B6",
          faint: "#8E9BA5",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
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
        glow: "0 0 0 1px rgba(240,121,30,0.3), 0 12px 30px -14px rgba(240,121,30,0.45)",
        soft: "0 16px 40px -20px rgba(16,38,61,0.8)",
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
