import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getLatestDraft, parseThemeKey, saveDraft } from "../models/studio-drafts.server";
import { authenticate } from "../shopify.server";
import { getThemePreset, THEME_PRESETS } from "../models/theme-presets";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { draft: await getLatestDraft(session.shop) };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "Untitled checkout style").trim().slice(0, 80) || "Untitled checkout style";
  const draft = await saveDraft({ shop: session.shop, name, themeKey: parseThemeKey(formData.get("themeKey")) });
  return { savedAt: draft.updatedAt.toISOString(), name: draft.name };
};

export default function StudioRoute() {
  const { draft } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const selectedPreset = getThemePreset(draft?.themeKey ?? "soft-luxury");
  return (
    <s-page heading="Style Studio">
      <s-section heading="Checkout visual draft">
        <s-paragraph>Save merchant-owned design intent for review. This changes only the app’s private draft record, never live checkout.</s-paragraph>
        <Form method="post">
          <s-stack direction="block" gap="base">
            <s-text-field name="name" label="Style name" value={draft?.name ?? "Autumn reset"} />
            <s-select name="themeKey" label="Theme direction" value={selectedPreset.key}>
              {THEME_PRESETS.map((preset) => <s-option key={preset.key} value={preset.key}>{preset.name}</s-option>)}
            </s-select>
            <s-button type="submit" variant="primary">Save draft</s-button>
          </s-stack>
        </Form>
        {actionData?.savedAt ? <s-paragraph>Draft saved at {new Date(actionData.savedAt).toLocaleString()}.</s-paragraph> : null}
      </s-section>
      <s-section heading="Current preview direction">
        <s-paragraph>{selectedPreset.name} — {selectedPreset.descriptor}</s-paragraph>
        <s-stack direction="inline" gap="base">
          <s-badge tone="info">{selectedPreset.category}</s-badge>
          <s-badge tone="info">Background {selectedPreset.tokens.background}</s-badge>
          <s-badge tone="info">Primary {selectedPreset.tokens.primary}</s-badge>
          <s-badge tone="info">{selectedPreset.tokens.font} type</s-badge>
          <s-badge tone="info">{selectedPreset.tokens.density} density</s-badge>
        </s-stack>
        <s-paragraph>Surface {selectedPreset.tokens.surface} · Border {selectedPreset.tokens.border} ({selectedPreset.tokens.borderWidth}px) · Focus {selectedPreset.tokens.focus} · {selectedPreset.tokens.surfaceTreatment} surface · {selectedPreset.tokens.logoTreatment} logo.</s-paragraph>
        <s-paragraph>Text {selectedPreset.tokens.text} · Muted text {selectedPreset.tokens.mutedText} · Primary text {selectedPreset.tokens.primaryText} · Secondary {selectedPreset.tokens.secondary} · Secondary text {selectedPreset.tokens.secondaryText}.</s-paragraph>
        <s-paragraph>Error {selectedPreset.tokens.error} · Success {selectedPreset.tokens.success} · {selectedPreset.tokens.radius}px corners.</s-paragraph>
      </s-section>
      <s-section heading="Live checkout status">
        <s-paragraph>Preview and draft features are available now. Live apply stays locked until Shopify capability review and an auditable update-and-rollback operation are implemented.</s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
