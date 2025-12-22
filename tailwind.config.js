/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'archon-orange': '#ff6d5a',
        'archon-amber': '#f59e0b',
        'archon-purple': '#8b5cf6',
        'archon-dark': '#0a0a0f',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'live-pulse': 'livePulse 1.5s infinite',
      },
    },
  },
  plugins: [],
}
