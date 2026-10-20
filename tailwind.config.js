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
        // Dark-mode colours, for `dark:` classes (e.g. `bg-white
        // dark:bg-night-surface`). Same values as darkColors in
        // src/theme/colors.ts — keep the two in sync.
        night: '#141311',
        'night-surface': '#1F1D1A',
        'night-muted': '#2A2723',
        'night-text-primary': '#F5F2EC',
        'night-text': '#E8E4DC',
        'night-text-secondary': '#BDB7AC',
        'night-text-muted': '#8C867C',
        'night-border': '#FFFFFF1F',
      },
      fontFamily: {
        cormorant: ['Cormorant Garamond'],
        'dm-sans': ['DM Sans']
      },
    },
  },
  plugins: [],
};
