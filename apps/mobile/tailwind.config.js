/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#fafaf9",
        foreground: "#0c0a09",
        surface: "#ffffff",
        "surface-2": "#f5f5f4",
        muted: "#57534e",
        subtle: "#78716c",
        border: "#e7e5e4",
        "border-strong": "#d6d3d1",
        primary: {
          DEFAULT: "#7c3aed",
          600: "#6d28d9",
          50: "#ede9fe",
        },
        accent: {
          DEFAULT: "#06b6d4",
          600: "#0891b2",
        },
        rose: "#e11d48",
        amber: "#f59e0b",
        emerald: "#10b981",
        blue: "#3b82f6",
        whatsapp: "#25d366",
      },
    },
  },
  plugins: [],
};
