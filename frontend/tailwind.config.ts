import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "deep-purple": "#1a0533",
        "neon-blue": "#00d4ff",
        "teal": "#00ffd5",
        "glass-bg": "rgba(255,255,255,0.05)",
        "dark-bg": "#0a0a0f",
        "card-bg": "rgba(255,255,255,0.03)",
      },
      backdropBlur: {
        glass: "12px",
      },
      boxShadow: {
        "glow-blue": "0 0 20px rgba(0,212,255,0.3)",
        "glow-teal": "0 0 20px rgba(0,255,213,0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
