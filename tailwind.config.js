/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@docusaurus/theme-classic/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@docusaurus/theme-search-algolia/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
