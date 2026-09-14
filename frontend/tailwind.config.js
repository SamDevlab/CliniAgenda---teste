/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18231f",
        muted: "#6f7d76",
        line: "#e4ebe6",
        paper: "#fbfdfb",
        sage: "#1f8065",
        "sage-dark": "#17624e",
        "sage-soft": "#e9f5ef",
        coral: "#c95f50",
      },
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Manrope", "DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 50px rgba(32, 63, 49, 0.08)",
      },
    },
  },
  plugins: [],
};
