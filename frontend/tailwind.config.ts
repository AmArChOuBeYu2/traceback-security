import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        surface: {
          DEFAULT: "#0f172a",
          hover: "#1e293b",
          border: "#1e293b",
        },
        cyber: {
          cyan: "#00f3ff",
          emerald: "#02c39a",
          amber: "#ffb703",
          red: "#ff0055",
          purple: "#9d4edd",
          slate: "#1e293b",
          dark: "#080c14",
        },
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "Courier New", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "cyan-glow": "0 0 20px rgba(0, 243, 255, 0.25)",
        "red-glow": "0 0 20px rgba(255, 0, 85, 0.25)",
        "emerald-glow": "0 0 20px rgba(2, 195, 154, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "radar-sweep": "spin 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
