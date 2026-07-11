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
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.1' },
          '50%': { opacity: '0.3' },
        },
        fadeInSlide: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeOutSlideDown: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(10px)' },
        },
        slideDownFadeIn: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUpFadeOut: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-100%)', opacity: '0' },
        },
        // NEW for Loading
        spinDash: {
          '0%': { strokeDasharray: '100,200', 'stroke-dashoffset': '0' },
          '50%': { strokeDasharray: '150,150', 'stroke-dashoffset': '-25' },
          '100%': { strokeDasharray: '200,100', 'stroke-dashoffset': '-50' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade': 'fade-in 0.6s ease-out',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'pulse-slow': 'pulseSlow 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in-slide': 'fadeInSlide 0.35s ease-out forwards',
        'fade-out-slide-down': 'fadeOutSlideDown 0.2s ease-in forwards',
        'slide-down-fade-in': 'slideDownFadeIn 0.35s ease-out forwards',
        'slide-up-fade-out': 'slideUpFadeOut 0.3s ease-in forwards',
        // NEW
        spinDash: 'spinDash 1.8s ease-in-out infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(246, 195, 68, 0.15)',
        'card-dark': '0 4px 24px rgba(0, 0, 0, 0.3)',
      }
    }
  },
  plugins: []
}