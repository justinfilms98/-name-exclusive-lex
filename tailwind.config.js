/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: '#E3F2F9',
        sand: '#F2E8D5',
        nude: '#DACFC4',
        'nude-hover': '#E8D4C6',
        text: '#3C2F2F',
        'text-secondary': '#5E4B4B',
        accent: '#B89178',
        border: '#C0B4AC',
        card: {
          DEFAULT: '#F2E8D5',
          foreground: '#3C2F2F',
        },
        popover: {
          DEFAULT: '#F2E8D5',
          foreground: '#3C2F2F',
        },
        primary: {
          DEFAULT: '#B89178',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#DACFC4',
          foreground: '#3C2F2F',
        },
        muted: {
          DEFAULT: '#F2E8D5',
          foreground: '#5E4B4B',
        },
        destructive: {
          DEFAULT: '#FF4D4D',
          foreground: '#FFFFFF',
        },
        ring: '#C0B4AC',
        input: '#C0B4AC',
        brand: {
          almond: '#E3D4C2',
          sage: '#8F907E',
          earth: '#664D38',
          mist: '#DADFDB',
          pine: '#383B26',
          tan: '#B89178',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 