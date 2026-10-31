/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        bubble: ['"Fredoka"', 'Comic Sans MS', 'cursive', 'sans-serif'],
      },
      screens: {
        'xs': '480px',
      },
      borderWidth: {
        '3': '3px',
      },
      colors: {
        kid: {
          pink: '#FF6B8B',
          pinkLight: '#FFF0F3',
          purple: '#9B5DE5',
          purpleLight: '#F3E8FF',
          blue: '#00BBF9',
          blueLight: '#E0F7FE',
          green: '#00F5D4',
          greenLight: '#E6FAF6',
          yellow: '#FEE440',
          yellowLight: '#FFFDEB',
          orange: '#FF9F1C',
          orangeLight: '#FFF3E0',
          cream: '#FFFDF9',
        }
      },
      boxShadow: {
        'bubbly': '0 8px 0 rgba(0, 0, 0, 0.08), 0 15px 25px rgba(0, 0, 0, 0.05)',
        'bubbly-active': '0 2px 0 rgba(0, 0, 0, 0.08), 0 5px 10px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};
