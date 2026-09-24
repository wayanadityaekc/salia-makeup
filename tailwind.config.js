/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          DEFAULT: "#6B2C3E",
          deep: "#4A1F2C",
          soft: "#F7EDEF",
          line: "#EAD9DD",
        },
        ink: "#241C1E",
        muted: "#8A7B7F",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1180px",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};
