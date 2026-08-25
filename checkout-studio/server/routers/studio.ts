import { z } from "zod";
import {
  createBlockedCampaign,
  createMerchantStyle,
  findOrCreateDemoStore,
  getMerchantStyleForStore,
  getStoreByOwnerOpenId,
  listMerchantStyles,
  listScheduledCampaigns,
  listStyleVersions,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { validateCampaignWindow, validateStyleTokens } from "../../shared/studioValidation";
import { buildPublishReview, describeConnectionState } from "../../shared/studioSafety";
import { UnconnectedShopifyCheckoutGateway } from "../checkoutGateway";
import { getCheckoutCapabilityStatus } from "../shopifyCapabilities";
import type { StyleTokens } from "../../shared/checkoutStudio";

const tokenSchema = z.object({
  background: z.string(), surface: z.string(), text: z.string(), mutedText: z.string(),
  primary: z.string(), primaryText: z.string(), border: z.string(), focus: z.string(),
  error: z.string(), success: z.string(), secondary: z.string(), secondaryText: z.string(),
  borderWidth: z.union([z.literal(1), z.literal(2)]), surfaceTreatment: z.enum(["solid", "soft-gradient", "textured"]),
  logoTreatment: z.enum(["Wordmark", "Monogram", "Icon mark", "Stacked lockup"]),
  font: z.enum(["Sans", "Editorial", "Humanist", "Geometric"]),
  radius: z.number(), density: z.enum(["comfortable", "balanced", "compact"]),
});

/** Prefer the store persisted by a verified Shopify App Bridge token. */
async function resolveMerchantStore(user: { openId: string; name?: string | null }) {
  const verifiedStore = await getStoreByOwnerOpenId(user.openId);
  if (verifiedStore) return verifiedStore;
  return findOrCreateDemoStore(user.openId, user.name ?? "Untitled store");
}

/**
 * Merchant-safe workspace procedures. Shopify writes remain unavailable until
 * a later capability check promotes the connection from `checking` to `ready`.
 */
export const studioRouter = router({
  workspace: protectedProcedure.query(async ({ ctx }) => {
    const store = await resolveMerchantStore(ctx.user);
    const checkout = await new UnconnectedShopifyCheckoutGateway().getContext();
    const isEmbeddedShopifyStore = store.status === "connected";
    const capabilityStatus = isEmbeddedShopifyStore
      ? await getCheckoutCapabilityStatus(ctx.user.openId)
      : null;
    const state = capabilityStatus?.state ?? (isEmbeddedShopifyStore ? "checking" : "not_connected");
    return {
      store,
      connection: {
        state,
        ...describeConnectionState(state),
        ...(capabilityStatus ? { title: capabilityStatus.title, message: capabilityStatus.message } : {}),
      },
      capabilities: capabilityStatus
        ? checkout.capabilities.map(capability => capability.key === "checkout_branding"
          ? {
              ...capability,
              availability: capabilityStatus.checkoutBrandingAvailable ? "available" : "unavailable",
              reason: capabilityStatus.message,
              fallback: capabilityStatus.checkoutBrandingAvailable
                ? "Save a draft and review it before any live configuration action."
                : capability.fallback,
            }
          : capability)
        : checkout.capabilities,
    };
  }),
  styles: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const store = await resolveMerchantStore(ctx.user);
      return listMerchantStyles(store.id);
    }),
    saveDraft: protectedProcedure.input(z.object({
      name: z.string().trim().min(1).max(160),
      presetSlug: z.string().trim().min(1).max(100).optional(),
      tokens: tokenSchema,
    })).mutation(async ({ ctx, input }) => {
      const store = await resolveMerchantStore(ctx.user);
      return createMerchantStyle({
        storeId: store.id,
        name: input.name,
        presetSlug: input.presetSlug,
        tokens: input.tokens,
        createdByOpenId: ctx.user.openId,
      });
    }),
  }),
  versions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const store = await resolveMerchantStore(ctx.user);
      return listStyleVersions(store.id);
    }),
  }),
  validation: router({
    style: protectedProcedure.input(z.object({ tokens: tokenSchema }))
      .query(({ input }) => validateStyleTokens(input.tokens as StyleTokens)),
    campaignWindow: protectedProcedure.input(z.object({ startAt: z.date(), endAt: z.date() }))
      .query(({ input }) => validateCampaignWindow(input.startAt, input.endAt)),
    publishReview: protectedProcedure.input(z.object({
      styleName: z.string().min(1).max(160),
      activeModules: z.number().int().min(0),
      qualityWarnings: z.number().int().min(0),
      connectionState: z.enum(["not_connected", "checking", "ready", "error", "denied"]),
      checkoutBrandingAvailable: z.boolean(),
    })).query(({ input }) => buildPublishReview(input)),
    savedDraftReview: protectedProcedure.input(z.object({ styleId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const store = await resolveMerchantStore(ctx.user);
        const style = await getMerchantStyleForStore(store.id, input.styleId);
        if (!style) throw new Error("Saved style was not found in this merchant workspace.");
        return buildPublishReview({
          connectionState: store.status === "connected" ? "checking" : "not_connected",
          checkoutBrandingAvailable: false,
          liveApplyImplemented: false,
          qualityWarnings: 0,
          activeModules: 0,
          styleName: style.name,
        });
      }),
  }),
  campaigns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const store = await resolveMerchantStore(ctx.user);
      return listScheduledCampaigns(store.id);
    }),
    create: protectedProcedure.input(z.object({
      merchantStyleId: z.number().int().positive(),
      name: z.string().trim().min(1).max(160),
      startAt: z.date(),
      endAt: z.date(),
      timezone: z.string().trim().min(1).max(80),
    })).mutation(async ({ ctx, input }) => {
      const timing = validateCampaignWindow(input.startAt, input.endAt);
      if (timing.status === "warning") throw new Error(timing.message);
      const store = await resolveMerchantStore(ctx.user);
      return createBlockedCampaign({ ...input, storeId: store.id, createdByOpenId: ctx.user.openId });
    }),
  }),
});
