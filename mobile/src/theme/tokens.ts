import { useColorScheme } from "react-native";

export const light = {
  bg: "#FAFAFB",
  surface: "#FFFFFF",
  surface2: "#F6F7FB",
  surface3: "#EEF0F6",
  border: "#E6E8EF",
  borderStrong: "#D4D8E3",
  text: "#0B1020",
  textMuted: "#5B6478",
  textSubtle: "#8A92A6",

  brand500: "#6366F1",
  brand600: "#4F46E5",
  brand700: "#4338CA",
  accentMint: "#10B981",
  accentRose: "#F43F5E",
  accentAmber: "#F59E0B",
  accentSky: "#0EA5E9",
  accentViolet: "#8B5CF6",
};

// Neutrals mirror the web's :root[data-theme="dark"]; brand/accent hues are shared,
// except brand600/700, which are used as text and lift to brand-400/300 for contrast.
export const dark: typeof light = {
  ...light,
  bg: "#07080C",
  surface: "#0D0F17",
  surface2: "#11141D",
  surface3: "#161A25",
  border: "#1F2433",
  borderStrong: "#2A3041",
  text: "#E7E9F1",
  textMuted: "#9AA3B8",
  textSubtle: "#7F889C",
  brand600: "#818CF8",
  brand700: "#A5B4FC",
};

export function useColors() {
  return useColorScheme() === "dark" ? dark : light;
}

export const categoryAccent: Record<string, string> = {
  fashion: light.brand500,
  electronics: light.accentViolet,
  home: light.accentMint,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const font = {
  size: {
    xs: 11,
    sm: 12,
    md: 13,
    base: 14,
    lg: 16,
    xl: 18,
    "2xl": 22,
    "3xl": 28,
    "4xl": 36,
  },
};
