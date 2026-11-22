/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium telemetry palette
        obsidian: '#0B0B0F',
        light: '#F4F4F6',
        emerald: {
          500: '#10B981',  // Electric Emerald/Teal
          600: '#059669',
          700: '#047857',
        },
        violet: {
          500: '#7C3AED',  // Cyber Violet
          600: '#6D28D9',
        },
        amber: {
          500: '#F59E0B',  // Amber Warning
          600: '#D97706',
        },
        crimson: {
          500: '#EF4444',  // Crimson Alert
          600: '#DC2626',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'Space Grotesk', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
        'grotesk': ['Space Grotesk', 'sans-serif'],
      },
      letterSpacing: {
        'tight': '-0.02em',
        'wide': '0.1em',
        'widest': '0.2em',
      },
      animation: {
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.4s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
