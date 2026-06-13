import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        radar: {
          bg: "#080b12",
          surface: "#0d1117",
          card: "#111827",
          elevated: "#161b26",
          border: "#1e293b",
          accent: "#3b82f6",
          muted: "#64748b",
        },
        terminal: {
          green: "#22c55e",
          red: "#ef4444",
          amber: "#f59e0b",
          blue: "#3b82f6",
          neutral: "#94a3b8",
        },
        cmc: {
          up: "#22c55e",
          down: "#ef4444",
          text: "#f1f5f9",
          muted: "#64748b",
        },
      },
      boxShadow: {
        terminal: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.4)",
        "terminal-hover":
          "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.5)",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
