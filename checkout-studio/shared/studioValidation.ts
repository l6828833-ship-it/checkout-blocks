import type { StyleTokens } from "./checkoutStudio";

export type QualityCheck = {
  id: "button-contrast" | "focus-indicator" | "schedule-window";
  status: "pass" | "warning";
  message: string;
};

function toLinear(channel: number) {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const raw = hex.replace("#", "");
  const normalized = raw.length === 3 ? raw.split("").map(value => value + value).join("") : raw;
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return 0;
  const color = Number.parseInt(normalized, 16);
  const [red, green, blue] = [color >> 16, (color >> 8) & 255, color & 255].map(toLinear);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground: string, background: string) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

export function validateStyleTokens(tokens: StyleTokens): QualityCheck[] {
  const buttonContrast = contrastRatio(tokens.primaryText, tokens.primary);
  return [
    {
      id: "button-contrast",
      status: buttonContrast >= 4.5 ? "pass" : "warning",
      message: buttonContrast >= 4.5
        ? `Primary button text has ${buttonContrast.toFixed(1)}:1 contrast.`
        : `Primary button text has ${buttonContrast.toFixed(1)}:1 contrast. Try #FFFFFF or darken the button background.`,
    },
    {
      id: "focus-indicator",
      status: contrastRatio(tokens.focus, tokens.background) >= 3 ? "pass" : "warning",
      message: contrastRatio(tokens.focus, tokens.background) >= 3
        ? "Focus indicator remains distinct from the checkout background."
        : "Focus indicator may be difficult to see. Use a stronger contrasting focus color.",
    },
  ];
}

export function validateCampaignWindow(startAt: Date, endAt: Date): QualityCheck {
  return endAt.getTime() > startAt.getTime()
    ? { id: "schedule-window", status: "pass", message: "Campaign end occurs after campaign start." }
    : { id: "schedule-window", status: "warning", message: "Choose an end time that occurs after the campaign start." };
}
