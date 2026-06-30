/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'eden-green': '#2D4B3E',
        'eden-beige': '#F5F2ED',
        'eden-earth': '#8C7A6B',
        'eden-leaf': '#6B8E23',
        'steward-gold': '#A27532',
        'steward-orange': '#DB9B2F',
        'steward-offwhite': '#FEFAE0',
        'steward-cream': '#FDDD9A',
        'steward-green': '#2E5534',
        'steward-blue': '#417C98',
        'steward-dark': '#21282E',
      },
      fontFamily: {
        'lofi': ['Courier New', 'Courier', 'monospace'],
        'sans': ['Exo', 'Inter', 'sans-serif'],
        'exo': ['Exo', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
