module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      spacing: {
        'size-6': '1.5rem',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      zIndex: {
        '1': '1',
      },
      colors: {
        'brand-50': '#f2f7ff',
        'brand-100': '#dde9ff',
        'brand-200': '#c2d6ff',
        'brand-300': '#9cb9ff',
        'brand-400': '#7592ff',
        'brand-500': '#465fff',
        'brand-600': '#3641f5',
        'brand-700': '#2a31d8',
        'brand-800': '#252dae',
        'brand-900': '#262e89',
        'brand-950': '#161950',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.size-6': {
          width: '1.5rem',
          height: '1.5rem',
        },
      });
    }
  ],
}
