/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1340df', // Matching the vivid blue from the image
          dark: '#081e6b',
          light: '#f1f5f9'
        }
      }
    },
  },
  plugins: [],
}
