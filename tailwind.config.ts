import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Quality Rating Colors
        quality: {
          excellent: '#10b981',   // green-500 - CV <10%
          good: '#3b82f6',        // blue-500 - CV 10-15%
          acceptable: '#f59e0b',  // amber-500 - CV 15-20%
          poor: '#ef4444',        // red-500 - CV >20%
          unknown: '#6b7280',     // gray-500 - No data
        },
        // Thermo Brand Colors (from logo)
        thermo: {
          'forest': '#0F3730',    // Dark forest green (background)
          'forest-light': '#1a4d44', // Lighter forest green (hover)
          'gold': '#E8B923',      // Gold (accents, flame)
          'gold-light': '#F4C430', // Light gold (hover)
          'cream': '#F5F1E3',     // Cream (text)
          'cream-dark': '#E8E4D8', // Darker cream (muted text)
        },
        // Brand Colors (legacy)
        brand: {
          primary: '#2563eb',     // blue-600
          secondary: '#7c3aed',   // violet-600
          accent: '#0891b2',      // cyan-600
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
