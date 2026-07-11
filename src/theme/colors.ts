export type ThemeColors = {
  primary: string;
  primaryDark: string;
  background: string;
  card: string;
  text: string;
  mutedText: string;
  border: string;
  lightBlue: string;
  lightPurple: string;
  lightGreen: string;
  lightOrange: string;
  success: string;
  danger: string;
  info: string;
  warning: string;
  white: string;
  black: string;
};

// Single brand accent (previously three competing colors: #3E6DA6, #7453C8, #007AFF
// were all in use across different screens). #7453C8 was already the dominant one.
export const lightPalette: ThemeColors = {
  primary: "#7453C8",
  primaryDark: "#5A3DA0",
  background: "#F5F8FD",
  card: "#FFFFFF",
  text: "#1F334D",
  mutedText: "#6F87A6",
  border: "#DDE5F2",
  lightBlue: "#EFF4FC",
  lightPurple: "#EEE7FF",
  lightGreen: "#E8F6EE",
  lightOrange: "#FDF2E9",
  success: "#4FA57B",
  danger: "#E36A6A",
  info: "#4E79C7",
  warning: "#E67E22",
  white: "#FFFFFF",
  black: "#000000",
};

export const darkPalette: ThemeColors = {
  primary: "#9A82E0",
  primaryDark: "#7453C8",
  background: "#13141A",
  card: "#1D1F29",
  text: "#EEF1F8",
  mutedText: "#8D9BB5",
  border: "#2B2E3A",
  lightBlue: "#1E2430",
  lightPurple: "#2A2440",
  lightGreen: "#182922",
  lightOrange: "#2C2118",
  success: "#4FA57B",
  danger: "#E36A6A",
  info: "#7E9FDC",
  warning: "#E68A4E",
  white: "#FFFFFF",
  black: "#000000",
};

/** @deprecated Use `useTheme().colors` so screens react to dark mode. Kept only for any
 * not-yet-migrated import; always resolves to the light palette. */
export const colors = lightPalette;
