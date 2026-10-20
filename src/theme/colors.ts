// Every colour the app uses, by purpose, in a light and a dark version.
// Screens pick colours from here (via useTheme / makeStyles) instead of
// writing hex values, so the whole app follows the phone's Light/Dark
// setting. Keep the tailwind.config.js `night-*` colours in sync with the
// dark values below — they're the same colours for className styling.

export type ThemeColors = {
  // Screen background (the warm off-white behind everything)
  background: string;
  // Cards, sheets, the tab bar and header — sits on top of background
  surface: string;
  // Gentle fills: chips, image placeholders, input backgrounds
  surfaceMuted: string;
  // Very light tint for a selected/pressed row or tab
  highlight: string;
  // Highlighter-pen background behind marked words in blog posts
  marker: string;

  // Headings and the most important text
  textPrimary: string;
  // Normal body text
  text: string;
  // Supporting text: subtitles, descriptions
  textSecondary: string;
  // Hints, dates, placeholders, inactive tabs
  textMuted: string;

  // Hairlines and card outlines
  border: string;
  // Input outlines and stronger dividers
  borderStrong: string;

  // Brand gold — buttons, active tab, accents
  brand: string;
  // Faint gold wash behind brand-coloured icons/labels
  brandSoft: string;
  // Text and icons drawn ON a brand-gold background (white in light
  // mode, near-black in dark mode, where white on gold looks harsh)
  onBrand: string;

  // Standard icon colour (settings cog, chevrons…)
  icon: string;
  // Faded icon colour (delete bin, disabled actions)
  iconMuted: string;

  danger: string;
  success: string;

  // Dimmed backdrop behind modals and sheets
  overlay: string;
  // Shadow colour for raised cards
  shadow: string;
};

export const lightColors: ThemeColors = {
  background: '#FAF9F6',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F1EC',
  highlight: '#2C2C2C08',
  marker: '#FEF3C7',

  textPrimary: '#1A1A1A',
  text: '#2C2C2C',
  textSecondary: '#555555',
  textMuted: '#999999',

  border: '#2C2C2C33',
  borderStrong: '#2C2C2C4D',

  brand: '#C1A36A',
  brandSoft: '#C1A36A1A',
  onBrand: '#FFFFFF',

  icon: '#333333',
  iconMuted: '#CCCCCC',

  danger: '#D21616',
  success: '#0E920E',

  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: '#000000',
};

export const darkColors: ThemeColors = {
  background: '#141311',
  surface: '#1F1D1A',
  surfaceMuted: '#2A2723',
  highlight: '#FFFFFF12',
  marker: '#5C4A1F',

  textPrimary: '#F5F2EC',
  text: '#E8E4DC',
  textSecondary: '#BDB7AC',
  textMuted: '#8C867C',

  border: '#FFFFFF1F',
  borderStrong: '#FFFFFF33',

  brand: '#C1A36A',
  brandSoft: '#C1A36A26',
  onBrand: '#141311',

  icon: '#E5E1DA',
  iconMuted: '#5C574F',

  danger: '#FF6B6B',
  success: '#4ADE80',

  overlay: 'rgba(0, 0, 0, 0.65)',
  shadow: '#000000',
};
