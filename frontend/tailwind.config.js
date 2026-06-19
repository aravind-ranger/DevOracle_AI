/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0F19",
        darkCard: "rgba(17, 24, 39, 0.7)",
        neonBlue: "#00F0FF",
        neonPurple: "#BD00FF",
        neonGreen: "#39FF14",
        neonRed: "#FF073A",
        neonOrange: "#FF5F1F",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        neonBlue: "0 0 10px rgba(0, 240, 255, 0.3), 0 0 20px rgba(0, 240, 255, 0.2)",
        neonPurple: "0 0 10px rgba(189, 0, 255, 0.3), 0 0 20px rgba(189, 0, 255, 0.2)",
        neonGreen: "0 0 10px rgba(57, 255, 20, 0.3), 0 0 20px rgba(57, 255, 20, 0.2)",
      }
    },
  },
  plugins: [],
}
