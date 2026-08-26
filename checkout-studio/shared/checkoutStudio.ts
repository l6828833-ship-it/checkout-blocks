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

export type StylePreset = {
  slug: string;
  name: string;
  descriptor: string;
  category: "Essential" | "Premium" | "Seasonal" | "Campaign";
  isNew?: boolean;
  tokens: StyleTokens;
};

export type FunnelMode = "Trust-First" | "Product Story" | "Delivery Confidence" | "Minimal Express" | "Community & Care" | "Limited Release";
export type LogoTreatment = "Wordmark" | "Monogram" | "Icon mark" | "Stacked lockup";

export type ThemeAtelierPreset = StylePreset & {
  funnelMode: FunnelMode;
  logoTreatment: LogoTreatment;
  placementHint: string;
  mood: string;
  recommendedModules: string[];
};

const create = (
  slug: string,
  name: string,
  descriptor: string,
  category: StylePreset["category"],
  tokens: Partial<StyleTokens>,
  isNew = false,
): StylePreset => ({
  slug,
  name,
  descriptor,
  category,
  isNew,
  tokens: {
    background: "#FFFEFC",
    surface: "#FFFFFF",
    text: "#252422",
    mutedText: "#726E68",
    primary: "#252422",
    primaryText: "#FFFFFF",
    border: "#DEDAD4",
    focus: "#6654E8",
    error: "#B3261E",
    success: "#147A5B",
    secondary: "#F2F0EB",
    secondaryText: "#252422",
    borderWidth: 1,
    surfaceTreatment: "solid",
    logoTreatment: "Wordmark",
    font: "Sans",
    radius: 12,
    density: "balanced",
    ...tokens,
  },
});

export const STYLE_PRESETS: StylePreset[] = [
  create("modern-minimal", "Modern Minimal", "Clean, neutral, conversion-focused.", "Essential", { primary: "#1F1F1F", focus: "#3759E8", radius: 10 }),
  create("soft-luxury", "Soft Luxury", "Elegant, editorial, and warmly composed.", "Premium", { background: "#FBF8F1", surface: "#FFFCF7", text: "#3E3933", primary: "#3E3933", border: "#E5D8C7", focus: "#B38A4C", font: "Editorial", radius: 16, density: "comfortable" }),
  create("nordic-calm", "Nordic Calm", "Airy, natural, and beautifully restrained.", "Premium", { background: "#F7F5EE", surface: "#FFFEF9", text: "#25302B", mutedText: "#6E756F", primary: "#36493F", border: "#D7D8CE", focus: "#527E69", radius: 8, density: "comfortable" }),
  create("bold-commerce", "Bold Commerce", "Direct, high-energy clarity with a confident CTA.", "Essential", { background: "#FDFDFF", primary: "#2049D8", focus: "#6A86FF", radius: 10, font: "Geometric" }),
  create("organic-wellness", "Organic Wellness", "Gentle color with grounded, trustworthy warmth.", "Premium", { background: "#F8F0DF", surface: "#FFFBF2", text: "#394536", primary: "#5D743F", border: "#DCCAAE", focus: "#9A6A40", radius: 18, density: "comfortable" }),
  create("midnight-premium", "Midnight Premium", "Dark, sophisticated, and quietly striking.", "Premium", { background: "#171A24", surface: "#222632", text: "#F8F6F1", mutedText: "#B9BCC7", primary: "#D9D4C7", primaryText: "#161822", border: "#3A4050", focus: "#A7B8FF", error: "#FFB4AB", success: "#83E6C5", radius: 12 }),
  create("beauty-blush", "Beauty Blush", "Polished tones with a modern feminine edge.", "Premium", { background: "#FDF4F1", surface: "#FFF9F6", text: "#4A3031", primary: "#7C2E48", focus: "#C45478", border: "#EACDCC", radius: 16, font: "Humanist" }),
  create("tech-precision", "Tech Precision", "Crisp hierarchy, exact geometry, and cool intelligence.", "Essential", { background: "#F9FAFC", surface: "#FFFFFF", text: "#19202A", primary: "#293E96", focus: "#5B73E8", border: "#D6DAE4", radius: 6, font: "Geometric", density: "compact" }),
  create("coastal-market", "Coastal Market", "Fresh, relaxed, and effortlessly friendly.", "Premium", { background: "#F6FBFA", surface: "#FFFFFF", text: "#173A47", primary: "#11647F", focus: "#2DB6B2", border: "#CFE5E3", radius: 14, density: "comfortable" }),
  create("heritage-editorial", "Heritage Editorial", "Timeless character for confident, crafted brands.", "Premium", { background: "#F8F4E9", surface: "#FFFDF7", text: "#283A2F", primary: "#38513D", focus: "#873D3D", border: "#D6CBB7", font: "Editorial", radius: 8 }),
  create("playful-pop", "Playful Pop", "Vibrant confidence with a polished, expressive feel.", "Campaign", { background: "#FFF8F1", surface: "#FFFFFF", text: "#312151", primary: "#7044E8", focus: "#FF7B64", border: "#E5D8FF", radius: 18, font: "Geometric" }),
  create("sustainable-earth", "Sustainable Earth", "Grounded materials and thoughtful, natural contrast.", "Premium", { background: "#EDE4D4", surface: "#F8F2E7", text: "#382D24", primary: "#435D38", focus: "#A65A3C", border: "#CDBBA0", radius: 10, font: "Humanist" }),
  create("holiday-glow", "Holiday Glow", "A refined seasonal story in pine, cream, and red.", "Seasonal", { background: "#F8F4E9", surface: "#FFFCF4", text: "#2C4637", primary: "#8B2733", focus: "#B79A5F", border: "#DCCEB4", radius: 12, font: "Editorial" }, true),
  create("sale-event", "Sale Event", "Clear urgency and high contrast without visual noise.", "Campaign", { background: "#FFFFFF", surface: "#FFF8F4", text: "#202027", primary: "#D33A24", focus: "#FD846D", border: "#F0C9C0", radius: 8, density: "compact" }, true),
];

const atelier = (
  slug: string,
  name: string,
  descriptor: string,
  tokens: Partial<StyleTokens>,
  funnelMode: FunnelMode,
  logoTreatment: LogoTreatment,
  placementHint: string,
  mood: string,
  recommendedModules: string[],
): ThemeAtelierPreset => ({ ...create(slug, name, descriptor, "Premium", { ...tokens, logoTreatment }), funnelMode, logoTreatment, placementHint, mood, recommendedModules });

export const THEME_ATELIER: ThemeAtelierPreset[] = [
  atelier("quiet-luxury", "Quiet Luxury", "Warm ivory and composed editorial contrast.", { background: "#FBF8F1", surface: "#FFFCF7", text: "#3E3933", primary: "#3E3933", border: "#E5D8C7", focus: "#B38A4C", font: "Editorial", radius: 16, density: "comfortable" }, "Trust-First", "Wordmark", "Information reassurance zone", "Calm reassurance", ["Trust Bar", "Returns Reminder"]),
  atelier("modern-editorial", "Modern Editorial", "Paper white, ink, and an exacting visual grid.", { background: "#FBFAF7", surface: "#FFFFFF", text: "#181818", primary: "#181818", border: "#D9D5CE", focus: "#713D86", font: "Editorial", radius: 4 }, "Product Story", "Stacked lockup", "Order-summary supporting zone", "Controlled drama", ["Order Benefit Banner", "Customer Support Link"]),
  atelier("nordic-calm-atelier", "Nordic Calm", "Mineral whites and quiet pine hierarchy.", { background: "#F7F5EE", surface: "#FFFEF9", text: "#25302B", primary: "#36493F", border: "#D7D8CE", focus: "#527E69", radius: 8, density: "comfortable" }, "Delivery Confidence", "Icon mark", "Shipping reassurance zone", "Low-friction clarity", ["Delivery Promise", "Sustainability Note"]),
  atelier("coastal-form", "Coastal Form", "Salt white, deep ocean, and sun-washed surfaces.", { background: "#F5FAF9", surface: "#FFFEFB", text: "#173A47", primary: "#11647F", border: "#CFE5E3", focus: "#2DB6B2", radius: 18, density: "comfortable" }, "Community & Care", "Wordmark", "Information care zone", "Airy confidence", ["Trust Bar", "Customer Support Link"]),
  atelier("studio-monochrome", "Studio Monochrome", "Black, stone, and confident geometric restraint.", { background: "#FCFCFB", surface: "#FFFFFF", text: "#111111", primary: "#111111", border: "#D8D8D6", focus: "#5340BD", font: "Geometric", radius: 6, density: "compact" }, "Minimal Express", "Monogram", "Payment reassurance zone", "Fast, focused confidence", ["Secure Checkout Note"]),
  atelier("garden-ritual", "Garden Ritual", "Botanical tones, clay accents, and tactile calm.", { background: "#F5F0E5", surface: "#FFFDF8", text: "#334236", primary: "#456040", border: "#D5C8AA", focus: "#A65A3C", font: "Humanist", radius: 18, density: "comfortable" }, "Community & Care", "Stacked lockup", "Shipping care zone", "Ingredient and care story", ["Sustainability Note", "Returns Reminder"]),
  atelier("future-retail", "Future Retail", "Electric ink, soft chrome, and exact compact rhythm.", { background: "#F6F6FA", surface: "#FFFFFF", text: "#181628", primary: "#3B2BD5", border: "#D7D6E7", focus: "#8B7CFF", font: "Geometric", radius: 10, density: "compact" }, "Minimal Express", "Icon mark", "Payment confidence zone", "Technology-forward precision", ["Secure Checkout Note", "Rewards Reminder"]),
  atelier("heritage-market", "Heritage Market", "Parchment, oxblood, and credible craft cues.", { background: "#F7F1E5", surface: "#FFFDF8", text: "#33271F", primary: "#6B2831", border: "#D5C5AA", focus: "#426446", font: "Editorial", radius: 8 }, "Product Story", "Wordmark", "Order-summary provenance zone", "Craft and provenance", ["Trust Bar", "Sustainability Note"]),
  atelier("soft-sport", "Soft Sport", "Cobalt momentum with optical-white clarity.", { background: "#F8FAFF", surface: "#FFFFFF", text: "#172337", primary: "#214AC8", border: "#D4DDED", focus: "#5A88F6", font: "Geometric", radius: 12, density: "compact" }, "Delivery Confidence", "Icon mark", "Shipping delivery zone", "Performance and certainty", ["Delivery Promise", "Returns Reminder"]),
  atelier("gallery-commerce", "Gallery Commerce", "Museum cream and quiet limited-release pacing.", { background: "#F8F4EC", surface: "#FFFEFB", text: "#2A2828", primary: "#342633", border: "#DDD4CA", focus: "#926F9F", font: "Editorial", radius: 4, density: "comfortable" }, "Limited Release", "Monogram", "Order-summary edition note", "Collected and considered", ["Order Benefit Banner", "Gift Message Reminder"]),
  atelier("daylight-dtc", "Daylight DTC", "Butter, sky, and a friendly accessible action system.", { background: "#FFF9E6", surface: "#FFFFFF", text: "#273143", primary: "#2E75B6", border: "#E9DDAC", focus: "#EF6F61", radius: 16, density: "comfortable" }, "Trust-First", "Stacked lockup", "Information welcome zone", "Approachable confidence", ["Trust Bar", "Customer Support Link"]),
  atelier("night-shift", "Night Shift", "Carbon surfaces and warm-silver actions for dark premium stores.", { background: "#151618", surface: "#222429", text: "#F7F3EA", mutedText: "#BBB8B1", primary: "#E7DFC7", primaryText: "#1B1B1B", border: "#3B3D43", focus: "#B8A8FF", error: "#FFB4AB", success: "#83E6C5", radius: 12 }, "Limited Release", "Wordmark", "Payment reassurance zone", "Distinct dark confidence", ["Secure Checkout Note", "Order Benefit Banner"]),
];

export const CHECKOUT_SCENARIOS = [
  "Information",
  "Shipping",
  "Payment",
  "Discount",
  "Validation",
  "Unavailable",
  "Long cart",
  "Confirmation",
] as const;

export type CheckoutScenario = (typeof CHECKOUT_SCENARIOS)[number];
