/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          dark: "#0a0a0c",
          card: "#121216",
          border: "#23232a",
          gold: "#f59e0b",
        },
      },
    },
  },
  plugins: [],
};
