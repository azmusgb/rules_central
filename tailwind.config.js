// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // Use class-based dark mode
  content: [
    "./*.html",
    "./templates/**/*.html",
    "./static/**/*.html",
    "./static/js/**/*.js",
    "./src/**/*.js",
    // Add more paths if you use Tailwind classes in other file types
  ],
  safelist: [
    // Safelisted classes used dynamically in JS or templates
    "hidden-by-filter", // Used for dynamic filtering
    "bg-dark-700",      // Used for dark backgrounds
    "bg-dark-800",
    "bg-dark-900",
    "border-slate-700",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      colors: {
        // Use semantic names and avoid duplicating DaisyUI theme colors
        primary: {
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        accent: {
          DEFAULT: "#2dd4bf",
          purple: "#d8b4fe",
        },
        info: "#38bdf8",
        success: "#4ade80",
        warning: "#facc15",
        danger: "#f87171",
        dark: {
          700: "#374151",
          800: "#111827",
          850: "#0f172a",
          900: "#0e1524",
          950: "#070b16",
        },
        slate: {
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          700: "#334155",
        },
        // Optionally, add CSS variable references for tokens
        // e.g. 'brand': 'var(--qc-accent)'
      },
      animation: {
        typing: "typing 2s steps(22)",
        "blink-caret": "blink 1s step-end infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        typing: {
          from: { width: "0" },
          to: { width: "100%" },
        },
        blink: {
          "50%": { "border-color": "transparent" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-16px) scale(1.04)" },
        },
      },
      backgroundImage: {
        "hero-pattern": "linear-gradient(120deg, #1e3a8a 0%, #67e8f9 100%)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("daisyui"),
  ],
  // DaisyUI theme configuration
  daisyui: {
    themes: [
      {
        light: {
          primary: "#3b82f6",
          secondary: "#d8b4fe",
          accent: "#2dd4bf",
          neutral: "#64748b",
          "base-100": "#ffffff",
          info: "#38bdf8",
          success: "#4ade80",
          warning: "#facc15",
          error: "#f87171",
        },
        dark: {
          primary: "#3b82f6",
          secondary: "#d8b4fe",
          accent: "#2dd4bf",
          neutral: "#64748b",
          "base-100": "#0e1524",
          info: "#38bdf8",
          success: "#4ade80",
          warning: "#facc15",
          error: "#f87171",
        },
      },
    ],
    darkTheme: "dark",
  },
};
