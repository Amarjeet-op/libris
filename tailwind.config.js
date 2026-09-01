/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./hooks/**/*.{js,jsx}",
    "./context/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          light: "#faf6ee",
          DEFAULT: "#f6f1e7",
          dark: "#1b1a17",
          sepia: "#f1e5c8",
        },
        ink: {
          DEFAULT: "#1c1a16",
          soft: "#4a453c",
          faint: "#8a8478",
        },
      },
      fontFamily: {
        serif: ["var(--font-reading)", "Georgia", "serif"],
        sans: ["var(--font-ui)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        book: "0 30px 60px -20px rgba(0,0,0,0.35), 0 10px 20px -10px rgba(0,0,0,0.25)",
        page: "0 2px 12px rgba(0,0,0,0.08)",
        card: "0 20px 40px -18px rgba(0,0,0,0.28)",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: 0.35 },
          "50%": { opacity: 0.8 },
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
        fadeUp: "fadeUp 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
