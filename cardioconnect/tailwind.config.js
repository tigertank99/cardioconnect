/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5fa",
          100: "#d4e6f1",
          200: "#a9cce3",
          300: "#7fb3d5",
          400: "#5499c7",
          500: "#1a5276",
          600: "#154360",
          700: "#11354d",
          800: "#0d2839",
          900: "#081a26",
        },
        cardiac: {
          50: "#fdecea",
          100: "#f9c4bf",
          200: "#f5a094",
          300: "#e74c3c",
          400: "#c0392b",
          500: "#a93226",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        body: ['"DM Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
