/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#080705',
        obsidian: '#11100d',
        graphite: '#1c1914',
        gold: '#d7a846',
        amberline: '#f4d27a',
        ember: '#ff6b35',
        emerald: '#49d17d',
        cyan: '#5dd9ff'
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(215,168,70,.22), 0 18px 60px rgba(0,0,0,.34)',
        glow: '0 0 28px rgba(215,168,70,.28)'
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
