import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover, var(--card)))", foreground: "hsl(var(--popover-foreground, var(--card-foreground)))" },
        accent: "hsl(var(--accent, var(--muted)))",
        ring: "hsl(var(--ring))",
        secondary: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        destructive: "hsl(var(--destructive, 0 84% 60%))",
        "strategy-accent": "hsl(var(--strategy-accent))",
        "strategy-warning": "hsl(var(--strategy-warning))",
        "background-soft": "hsl(var(--background-soft))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
