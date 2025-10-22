/** @type {import('tailwindcss').Config} */
module.exports = {
  // This 'content' array tells Tailwind CSS which files to scan for class names.
  // It targets:
  // - The main App.tsx file in the project root,
  // - All JavaScript and TypeScript files (including JSX/TSX) in the 'components' directory and its subdirectories,
  // - All JavaScript and TypeScript files (including JSX/TSX) in the 'src' directory and its subdirectories.
  content: [
    './App.tsx',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#C1A36A',
        'gray-primary': '#2C2C2C',
        'light-gray': '#2C2C2C80',
        // textSecondary: "#7A7A7A",
        offWhite: "#FAF9F6",
        // borderGray: "#D9D9D9",
      },
      fontFamily: {
        cormorant: ['Cormorant Garamond'],
        'dm-sans': ['DM Sans']
      },
    },
  },
  plugins: [],
};
