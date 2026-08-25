export type StyleTokens = {
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  primary: string;
  primaryText: string;
  border: string;
  focus: string;
  error: string;
  success: string;
  secondary: string;
  secondaryText: string;
  borderWidth: 1 | 2;
  surfaceTreatment: "solid" | "soft-gradient" | "textured";
  logoTreatment: "Wordmark" | "Monogram" | "Icon mark" | "Stacked lockup";
  font: "Sans" | "Editorial" | "Humanist" | "Geometric";
  radius: number;
  density: "comfortable" | "balanced" | "compact";
};

export type ThemePreset = {
  key: string;
  name: string;
  descriptor: string;
  category: "Essential" | "Premium" | "Seasonal" | "Campaign";
  tokens: StyleTokens;
};

const createPreset = (key: string, name: string, descriptor: string, category: ThemePreset["category"], tokens: Partial<StyleTokens>): ThemePreset => ({
  key,
  name,
  descriptor,
  category,
  tokens: {
    background: "#FFFEFC", surface: "#FFFFFF", text: "#252422", mutedText: "#726E68", primary: "#252422", primaryText: "#FFFFFF",
    border: "#DEDAD4", focus: "#6654E8", error: "#B3261E", success: "#147A5B", secondary: "#F2F0EB", secondaryText: "#252422",
    borderWidth: 1, surfaceTreatment: "solid", logoTreatment: "Wordmark", font: "Sans", radius: 12, density: "balanced", ...tokens,
  },
});

export const THEME_PRESETS = [
  createPreset("modern-minimal", "Modern Minimal", "Clean, neutral, and conversion-focused.", "Essential", { primary: "#1F1F1F", focus: "#3759E8", radius: 10 }),
  createPreset("soft-luxury", "Soft Luxury", "Elegant, editorial, and warmly composed.", "Premium", { background: "#FBF8F1", surface: "#FFFCF7", text: "#3E3933", primary: "#3E3933", border: "#E5D8C7", focus: "#B38A4C", font: "Editorial", radius: 16, density: "comfortable" }),
  createPreset("nordic-calm", "Nordic Calm", "Airy, natural, and beautifully restrained.", "Premium", { background: "#F7F5EE", surface: "#FFFEF9", text: "#25302B", mutedText: "#6E756F", primary: "#36493F", border: "#D7D8CE", focus: "#527E69", radius: 8, density: "comfortable" }),
  createPreset("bold-commerce", "Bold Commerce", "Direct, high-energy clarity with a confident CTA.", "Essential", { background: "#FDFDFF", primary: "#2049D8", focus: "#6A86FF", radius: 10, font: "Geometric" }),
  createPreset("organic-wellness", "Organic Wellness", "Gentle color with grounded, trustworthy warmth.", "Premium", { background: "#F8F0DF", surface: "#FFFBF2", text: "#394536", primary: "#5D743F", border: "#DCCAAE", focus: "#9A6A40", radius: 18, density: "comfortable" }),
  createPreset("midnight-premium", "Midnight Premium", "Dark, sophisticated, and quietly striking.", "Premium", { background: "#171A24", surface: "#222632", text: "#F8F6F1", mutedText: "#B9BCC7", primary: "#D9D4C7", primaryText: "#161822", border: "#3A4050", focus: "#A7B8FF", error: "#FFB4AB", success: "#83E6C5", radius: 12 }),
  createPreset("beauty-blush", "Beauty Blush", "Polished tones with a modern feminine edge.", "Premium", { background: "#FDF4F1", surface: "#FFF9F6", text: "#4A3031", primary: "#7C2E48", focus: "#C45478", border: "#EACDCC", radius: 16, font: "Humanist" }),
  createPreset("tech-precision", "Tech Precision", "Crisp hierarchy, exact geometry, and cool intelligence.", "Essential", { background: "#F9FAFC", surface: "#FFFFFF", text: "#19202A", primary: "#293E96", focus: "#5B73E8", border: "#D6DAE4", radius: 6, font: "Geometric", density: "compact" }),
  createPreset("coastal-market", "Coastal Market", "Fresh, relaxed, and effortlessly friendly.", "Premium", { background: "#F6FBFA", surface: "#FFFFFF", text: "#173A47", primary: "#11647F", focus: "#2DB6B2", border: "#CFE5E3", radius: 14, density: "comfortable" }),
  createPreset("heritage-editorial", "Heritage Editorial", "Timeless character for confident, crafted brands.", "Premium", { background: "#F8F4E9", surface: "#FFFDF7", text: "#283A2F", primary: "#38513D", focus: "#873D3D", border: "#D6CBB7", font: "Editorial", radius: 8 }),
  createPreset("playful-pop", "Playful Pop", "Vibrant confidence with a polished, expressive feel.", "Campaign", { background: "#FFF8F1", surface: "#FFFFFF", text: "#312151", primary: "#7044E8", focus: "#FF7B64", border: "#E5D8FF", radius: 18, font: "Geometric" }),
  createPreset("sustainable-earth", "Sustainable Earth", "Grounded materials and thoughtful, natural contrast.", "Premium", { background: "#EDE4D4", surface: "#F8F2E7", text: "#382D24", primary: "#435D38", focus: "#A65A3C", border: "#CDBBA0", radius: 10, font: "Humanist" }),
  createPreset("holiday-glow", "Holiday Glow", "A refined seasonal story in pine, cream, and red.", "Seasonal", { background: "#F8F4E9", surface: "#FFFCF4", text: "#2C4637", primary: "#8B2733", focus: "#B79A5F", border: "#DCCEB4", radius: 12, font: "Editorial" }),
  createPreset("sale-event", "Sale Event", "Clear urgency and high contrast without visual noise.", "Campaign", { background: "#FFFFFF", surface: "#FFF8F4", text: "#202027", primary: "#D33A24", focus: "#FD846D", border: "#F0C9C0", radius: 8, density: "compact" }),
] as const;

export type ThemeKey = (typeof THEME_PRESETS)[number]["key"];

export function getThemePreset(key: string) {
  return THEME_PRESETS.find((preset) => preset.key === key) ?? THEME_PRESETS[1];
}
