/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#0C447C',     // Trust, authority
          success: '#0F6E56',  // Authentic / safe
          danger: '#A32D2D',   // Synthetic / threat
          warning: '#633806',  // Review needed
          bgLight: '#FFFFFF',  // Background Light
          bgDark: '#111111',   // Background Dark
        }
      },
      borderRadius: {
        card: '12px',
        elem: '8px',
        pill: '20px',
      },
      borderWidth: {
        'thin': '0.5px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
      }
    },
  },
  plugins: [],
}
