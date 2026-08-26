# Expanded Checkout Studio Product Prompt

Build **Checkout Studio**, an embedded Shopify Admin application that helps merchants make their checkout feel deliberately branded, premium, and recognizably different from Shopify’s default visual presentation—while strictly using Shopify-supported checkout branding, checkout configuration, and Checkout UI extension capabilities.

The product must feel like a **luxury checkout creative director and release-control system**, not a generic settings panel. Merchants should be able to choose a branded checkout funnel direction, apply a visual system, preview each checkout stage in realistic states, configure eligible content placements, validate accessibility, save versions, and safely release only the settings Shopify confirms are supported for that store.

> **Non-negotiable rule:** The app must never claim to redesign, inject into, or move Shopify-controlled checkout elements. Every preview is clearly labeled as a representative simulation. A control is publishable only after real-time Shopify capability validation confirms the store plan, checkout configuration, supported field, and extension target.

## Product Outcome

Design a polished merchant workspace where a checkout can become visually distinctive through a coordinated **brand system**, **funnel theme**, and **content strategy**. The goal is not to make checkout look random or overloaded. The goal is to make it feel intentionally branded at each decision point: trust at contact, clarity at shipping, confidence at payment, and reassurance at order confirmation.

| Product principle | Required behavior |
|---|---|
| Branded, not generic | Let merchants add a custom logo lockup, logo scale, brand colors, typography direction, corner language, visual density, and supported surface/image assets. |
| Funnel-aware | Each theme defines intentional treatment for contact, shipping, payment, and confirmation states rather than one flat global color scheme. |
| Safe by default | Shopify-controlled areas are visibly labeled and have no fake “publish” control. Unsupported changes remain preview-only. |
| Placement-led | Content modules are positioned through approved Checkout UI extension targets only; the UI explains where a module can appear and who controls final placement. |
| Brand continuity | The confirmation page is treated as a branded post-purchase moment, with eligible thank-you content and an optional continuation journey—not an afterthought. |

## Theme Families

Create an editorial **Theme Atelier** rather than a simple template library. Each theme includes a full token system, a logo presentation mode, recommended module placement patterns, and a distinct funnel mood. Include at least these twelve original theme families.

| Theme family | Visual character | Funnel direction |
|---|---|---|
| Quiet Luxury | Warm ivory, espresso, restrained brass, refined serif accent | Calm reassurance and premium product confidence |
| Modern Editorial | Ink, paper white, sharp grid rhythm, high-contrast typography | Product-story emphasis with controlled drama |
| Nordic Calm | Mineral white, pine, mist blue, generous spacing | Clarity, low cognitive load, trust-first delivery choices |
| Coastal Form | Salt white, deep ocean, sun-washed sand, rounded forms | Airy discovery with gentle confidence cues |
| Studio Monochrome | Black, stone, off-white, geometric typography | Bold product identity and fast decision flow |
| Garden Ritual | Botanical green, clay, linen, organic radius | Ingredient, sustainability, and care storytelling |
| Future Retail | Electric ink, soft chrome, signal violet, compact density | Technology-forward, high-energy checkout experience |
| Heritage Market | Oxblood, parchment, forest, label-like details | Craft, provenance, and product authenticity |
| Soft Sport | Optical white, cobalt, graphite, kinetic but controlled | Performance, delivery certainty, and fast mobile checkout |
| Gallery Commerce | Museum cream, charcoal, muted plum, oversized whitespace | Limited-edition presentation and thoughtful scarcity language |
| Daylight DTC | Butter, sky, coral accent, friendly sans | Approachable conversion flow with high legibility |
| Night Shift | Midnight, carbon, warm silver, accessible dark surfaces | Premium dark mode with unmistakable actions and focus states |

For every theme, show a complete token sheet. The editable core should include page background, card surface, heading/body/muted text, divider color, primary and secondary actions, action text, error/success states, focus ring, border thickness, corner radius, form density, typography pairing, logo treatment, and supported background/image treatment. Never use a theme as a single screenshot; it must remain editable through semantic design tokens.

## Logo and Brand Identity Studio

Create a dedicated **Brand Signature** step before style editing. Let the merchant upload or select a logo from approved store assets, define a wordmark and optional monogram treatment, choose supported logo size/alignment, set clear-space behavior, and choose an accessible background contrast. Offer contextual mockups for wide wordmarks, compact marks, icon-only marks, and small-screen treatment.

The UI must distinguish between: **brand-controlled styling**, **merchant-configurable Shopify settings**, **app extension content**, and **Shopify-controlled checkout structure**. Use a four-state legend everywhere. Do not imply that the logo can be placed in arbitrary positions; only expose placements that Shopify validates for the merchant’s checkout configuration.

## Checkout Funnel Composer

Add a **Funnel Composer** that makes the checkout feel different at each stage without breaking the checkout’s required flow. The merchant chooses an experience direction, then configures an eligible combination of visual styling and content modules.

| Funnel stage | Merchant goal | Supported design opportunities | Never promise |
|---|---|---|---|
| Contact / Information | Establish trust quickly | Logo treatment, global tokens, approved trust/care content module | Moving Shopify-owned customer fields or changing checkout logic |
| Shipping | Reduce hesitation | Delivery promise, returns reminder, sustainability note, approved helper copy | Reordering shipping rates or changing rate-selection logic |
| Payment | Reinforce confidence | Secure checkout note, payment reassurance, support link, styling of supported visual fields | Moving payment providers, altering payment logic, or injecting scripts |
| Order confirmation | Extend brand continuity | Thank-you content, order-care instructions, eligible cross-sell or post-purchase module | Guaranteed access to every post-purchase target or unsupported upsell behavior |

Offer pre-built funnel modes such as **Trust-First**, **Product Story**, **Delivery Confidence**, **Minimal Express**, **Community & Care**, and **Limited Release**. Each mode should propose modules and visual emphasis, but merchants can accept, remove, or adapt them. Never fabricate reviews, ratings, customer counts, urgency, or social proof. If a merchant has approved factual content, let them enter it with a source or label; otherwise, omit it.

## Placement Composer

Build a visual **Placement Map** rather than a list of switches. Show a simplified checkout anatomy with legal target zones. When the store is not connected, display zones as “to be verified” and keep them non-publishable. When connected, show only verified eligible extension locations.

Each content module must have an eligibility label, concise purpose, supported target, visibility conditions, and fallback behavior. Examples include a delivery promise, secure checkout reassurance, returns reminder, support contact, gift note reminder, sustainability detail, rewards reminder, and order-care note. Allow different approved modules to appear in different stages when Shopify supports the target. Do not let a merchant freely drag content over customer fields, payment controls, the order total, or any Shopify-controlled element.

## Preview and Experience States

The preview must look premium and intentionally different across themes, but it must always carry the label: **“Representative simulation — not your live Shopify checkout.”** Include desktop and mobile previews for contact, shipping, payment, discount applied, validation error, unavailable shipping, long cart, and confirmation states. A theme’s personality should be visible through hierarchy, rhythm, logo treatment, action emphasis, spacing, and eligible module placement—not through unsupported structural changes.

Add a comparison mode with three columns: **Current brand direction**, **Proposed theme**, and **Shopify capability outcome**. The capability column must use only: Available, Limited, Unavailable, or Not yet verified. Add plain-language reasons and a safe alternative for every unavailable option.

## Release Control and Safety

Create a guided release sequence: **Brand signature → Choose theme → Compose funnel → Preview states → Accessibility & quality → Review change summary → Apply when verified**. The review screen must identify every changed token, every affected extension module, current capability state, quality warnings, backup version, and restoration plan.

Use these safeguards:

1. The primary apply action is disabled until Shopify connection, plan eligibility, checkout profile, requested field, and extension target have all been verified.
2. A release always writes a merchant-scoped version and retains the last stable version for rollback.
3. Scheduled campaign actions create a clear start and restoration plan, store all dates as UTC, show the merchant’s selected time zone, and re-check eligibility immediately before activation.
4. If Shopify rejects a configuration, the UI records the diagnostic, does not alter the live checkout, and gives a plain-language next step.
5. Accessibility checks cover contrast, visible focus, text hierarchy, primary-action distinction, mobile density, error notice visibility, and logo/background legibility.

## Design Direction

Use a **quiet-luxury commerce operating system** visual language: warm off-white surfaces, expressive yet restrained typography, matte black primary actions, one carefully used brand accent, soft elevation, editorial spacing, and a prominent checkout canvas. The design should look custom enough for premium brands, but controls must remain familiar and efficient for non-technical merchants.

Avoid generic gradient cards, excessive dashboard charts, fake testimonials, fake ratings, countdown pressure, and decorative clutter. Favor clear labels, beautiful token swatches, exact capability messaging, rich before/after previews, and meaningful empty states.

## Required Screens

Build the following screens: Overview; Theme Atelier; Brand Signature; Funnel Composer; Placement Map; Visual Editor; Preview & Test; Accessibility Studio; Review & Apply; Style History; Campaign Scheduler; Capability Center; and Shopify Connection Guide.

The first screen should immediately make the product promise clear: **“A checkout that looks unmistakably yours—released only where Shopify supports it.”**
