/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1F3C5A',
        'primary-hover': '#16324A',
        secondary: '#4FBF9F',
        accent: '#F4C542',
        background: '#F5F7F8',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      boxShadow: {
        card: '0 12px 36px rgba(17, 39, 60, 0.08)',
        hover: '0 20px 48px rgba(17, 39, 60, 0.14)',
      },
      borderRadius: {
        pill: '999px',
        card: '24px',
        panel: '32px',
      },
      transitionDuration: {
        fast: '150ms',
        base: '240ms',
      },
    },
  },
  plugins: [],
};
