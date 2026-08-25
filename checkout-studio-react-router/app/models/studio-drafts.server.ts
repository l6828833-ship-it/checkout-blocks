import prisma from "../db.server";
import { getThemePreset, THEME_PRESETS, type ThemeKey } from "./theme-presets";

export type { ThemeKey } from "./theme-presets";

export function parseThemeKey(value: FormDataEntryValue | null): ThemeKey {
  return THEME_PRESETS.some((preset) => preset.key === value) ? (value as ThemeKey) : "soft-luxury";
}

export async function getLatestDraft(shop: string) {
  return prisma.studioDraft.findFirst({ where: { shop }, orderBy: { updatedAt: "desc" } });
}

export async function saveDraft(input: { shop: string; name: string; themeKey: ThemeKey }) {
  const existing = await getLatestDraft(input.shop);
  const preset = getThemePreset(input.themeKey);
  const tokens = {
    themeKey: preset.key,
    category: preset.category,
    ...preset.tokens,
    previewOnly: true,
    updatedBy: "merchant",
  };
  if (existing) {
    return prisma.studioDraft.update({
      where: { id: existing.id },
      data: { name: input.name, themeKey: input.themeKey, tokens },
    });
  }
  return prisma.studioDraft.create({
    data: { shop: input.shop, name: input.name, themeKey: input.themeKey, tokens },
  });
}
