import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        marker: ['var(--font-marker)', 'cursive'],
        stamp: ['var(--font-stamp)', 'Courier Prime', 'ui-monospace', 'monospace'],
        display: ['var(--font-display)', 'Oswald', 'Impact', 'sans-serif'],
      },
      animation: {
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        bobble: 'bobble 3s ease-in-out infinite',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        bobble: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-2px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
