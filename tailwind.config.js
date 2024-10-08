/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      beaufort: ["Beaufort", "sans-serif"],
      spiegel: ["Spiegel", "sans-serif"],
    },
    extend: {
      backgroundImage: {
        "sr-art": "url('~/public/srbackground.png')",
        "emerald-border": "url('~/public/rank/emerald.png')",
      },
    },
  },
  plugins: [],
};
