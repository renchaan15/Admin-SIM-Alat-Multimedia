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
        // Pemetaan warna premium yang sama dengan aplikasi mobile
        primary: {
          DEFAULT: '#10B981', // Aesthetic Emerald Green
          dark: '#059669',
          light: '#D1FAE5',
        },
        background: '#F8FAFC', // Slate Off-White bersih
        surface: '#FFFFFF',
        textPrimary: '#1E293B',
        textSecondary: '#64748B',
        danger: '#EF4444',
        dangerLight: '#FEE2E2',
        amberAccent: '#F59E0B',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};