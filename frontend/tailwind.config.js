/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'utm-bg': '#0b0e17',
        'utm-card': '#111827',
        'utm-card-hover': '#1a2332',
        'utm-blue': '#4f8ef7',
        'utm-green': '#00d4aa',
        'utm-blue-dim': '#2a4a7a',
        'utm-green-dim': '#0a6b5a',
        'utm-text': '#e2e8f0',
        'utm-text-muted': '#94a3b8',
        'utm-border': '#1e293b',
      },
      fontFamily: {
        'display': ['"Space Grotesk"', 'sans-serif'],
        'body': ['"DM Sans"', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.8s ease-out',
        'slide-in-left': 'slideInLeft 0.8s ease-out',
        'fade-in': 'fadeIn 1s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'radar': 'radarSweep 4s linear infinite',
        'drone-fly': 'droneFly 20s linear infinite',
        'grid-pulse': 'gridPulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(79, 142, 247, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(79, 142, 247, 0.6)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        droneFly: {
          '0%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(100px, -30px)' },
          '50%': { transform: 'translate(200px, 10px)' },
          '75%': { transform: 'translate(100px, -20px)' },
          '100%': { transform: 'translate(0, 0)' },
        },
        gridPulse: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(79, 142, 247, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(79, 142, 247, 0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}