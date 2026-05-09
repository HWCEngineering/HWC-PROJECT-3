/**
 * HWC Photo Log — Design tokens
 * Pulled from the web app's global.css to keep brand consistency.
 */

export const Colors = {
  // Brand
  hwcRed: "#EE2F27",
  darkGray: "#292C30",
  mediumGray: "#6C6864",
  lightGray: "#DDD4CC",

  // Surfaces
  bg: "#FFFFFF",
  fg: "#0F1115",
  muted: "#5B616E",
  border: "rgba(15, 17, 21, 0.12)",

  // Accent
  accent: "#EE2F27",
  accentContrast: "#FFFFFF",

  // Header
  headerBg: "rgba(26, 28, 32, 0.95)",
  headerFg: "#F5F7FA",
} as const;

export const Font = {
  regular: "System",
  // Poppins can be loaded via expo-font later; System is fine for MVP
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 28,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
