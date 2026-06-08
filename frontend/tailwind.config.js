/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00c38b',
          dark: '#006c4b',
        },
        brand: {
          dark: '#1e2532',
          accent: '#6366f1',
        },
        realify: {
          dark: '#1c212b',
          primary: '#00c38b',
        },
        'on-background': '#151c26',
        'surface': '#f8f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eff4ff',
        'surface-container': '#e7eefc',
        'surface-container-high': '#e2e8f6',
        'surface-container-highest': '#dce3f1',
        'secondary-container': '#6062f2',
        'primary-container': '#00c38b',
        'secondary': '#4646d8',
        'error': '#ba1a1a',
        'outline-variant': '#bbcac0',
        'outline': '#6c7a72',
        'on-surface-variant': '#3c4a42',
        'on-surface': '#151c26',
        'on-primary': '#ffffff',
        'on-secondary': '#ffffff',
        'primary-fixed': '#64fcbf',
        'on-primary-fixed-variant': '#005138',
        'tertiary-container': '#ff8b6f',
        'tertiary': '#9e412b',
        'on-tertiary': '#ffffff',
      },
      borderRadius: {
        'custom': '8px',
      },
      spacing: {
        'container-max': '800px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '32px',
        'sidebar-width': '400px',
        'gutter': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
