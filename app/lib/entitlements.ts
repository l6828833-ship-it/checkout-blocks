import type { PlanCode } from "@prisma/client";

export const IMPRESSION_LIMITS: Record<PlanCode, number> = {
  FREE: 1500,
  PLUS: 10000,
  PRO: 50000,
  MAX: 150000,
};

export function mayServeNextImpression(planCode: PlanCode, currentImpressions: number) {
  return Number.isInteger(currentImpressions) && currentImpressions >= 0 && currentImpressions < IMPRESSION_LIMITS[planCode];
}

export type RestrictedFeature = "COD" | "ADVANCED_TARGETING" | "SCHEDULING";

export function hasPlanFeature(planCode: PlanCode, feature: RestrictedFeature) {
  if (feature === "COD") return planCode === "PRO" || planCode === "MAX";
  if (feature === "ADVANCED_TARGETING") return planCode === "PRO" || planCode === "MAX";
  return planCode === "MAX";
}
