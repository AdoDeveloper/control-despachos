/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',       // Si usas App Router
    './pages/**/*.{js,ts,jsx,tsx}',     // Si usas Pages Router
    './components/**/*.{js,ts,jsx,tsx}',// Componentes
    './src/**/*.{js,ts,jsx,tsx}',       // Si tienes carpeta src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
