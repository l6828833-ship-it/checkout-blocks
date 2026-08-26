import { z } from "zod";
import {
  createBlockedCampaign,
  createMerchantStyle,
  findOrCreateDemoStore,
  getMerchantStyleForStore,
  listMerchantStyles,
  listScheduledCampaigns,
  listStyleVersions,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { validateCampaignWindow, validateStyleTokens } from "../../shared/studioValidation";
import { buildPublishReview, describeConnectionState } from "../../shared/studioSafety";
import { UnconnectedShopifyCheckoutGateway } from "../checkoutGateway";
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

/**
 * Merchant-safe workspace procedures. This router deliberately persists a demo
 * workspace while an installation is pending, and never attempts Shopify writes.
 */
export const studioRouter = router({
  workspace: protectedProcedure.query(async ({ ctx }) => {
    const store = await findOrCreateDemoStore(ctx.user.openId, ctx.user.name ?? "Untitled store");
    const checkout = await new UnconnectedShopifyCheckoutGateway().getContext();
    const isEmbeddedShopifyStore = store.status === "connected";
    return {
      store,
      connection: {
        state: isEmbeddedShopifyStore ? "checking" : checkout.state,
        ...describeConnectionState(isEmbeddedShopifyStore ? "checking" : "not_connected"),
      },
      capabilities: checkout.capabilities,
    };
  }),
  styles: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const store = await findOrCreateDemoStore(ctx.user.openId, ctx.user.name ?? "Untitled store");
      return listMerchantStyles(store.id);
    }),
    saveDraft: protectedProcedure.input(z.object({
      name: z.string().trim().min(1).max(160),
      presetSlug: z.string().trim().min(1).max(100).optional(),
      tokens: tokenSchema,
    })).mutation(async ({ ctx, input }) => {
      const store = await findOrCreateDemoStore(ctx.user.openId, ctx.user.name ?? "Untitled store");
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
      const store = await findOrCreateDemoStore(ctx.user.openId, ctx.user.name ?? "Untitled store");
      return listStyleVersions(store.id);
    }),
  }),
  validation: router({
    style: protectedProcedure.input(z.object({
      tokens: tokenSchema,
    })).query(({ input }) => validateStyleTokens(input.tokens as StyleTokens)),
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
        const store = await findOrCreateDemoStore(ctx.user.openId, ctx.user.name ?? "Untitled store");
        const style = await getMerchantStyleForStore(store.id, input.styleId);
        if (!style) throw new Error("Saved style was not found in this merchant workspace.");
        return buildPublishReview({
          connectionState: "not_connected",
          checkoutBrandingAvailable: false,
          qualityWarnings: 0,
          activeModules: 0,
          styleName: style.name,
        });
      }),
  }),
  campaigns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const store = await findOrCreateDemoStore(ctx.user.openId, ctx.user.name ?? "Untitled store");
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
      if (timing.status === "warning") {
        throw new Error(timing.message);
      }
      const store = await findOrCreateDemoStore(ctx.user.openId, ctx.user.name ?? "Untitled store");
      return createBlockedCampaign({ ...input, storeId: store.id, createdByOpenId: ctx.user.openId });
    }),
  }),
});
