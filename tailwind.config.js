export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'unic-blue': '#1A3FA0',
        'unic-dark': '#0D1B4B',
        'unic-yellow': '#F2C200',
        // Premium Dark Theme
        dark: {
          900: '#060D18',  // Page background
          800: '#0C1829',  // Card background
          700: '#111F35',  // Elevated surface
          600: '#172A45',  // Borders / hover
          500: '#1D3557',  // Active state
        },
        gold: {
          DEFAULT: '#F6C344',
          dim: '#C89B2F',
          light: '#FFD970',
        },
        navy: {
          DEFAULT: '#08182A',
          light: '#0E2240',
        },
        muted: '#8899B4',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      animation: {
        'fade': 'fade-in 0.6s ease-out',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.3s ease-out forwards',
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(246, 195, 68, 0.15)',
        'card-dark': '0 4px 24px rgba(0, 0, 0, 0.3)',
      }
    }
  },
  plugins: []
}
