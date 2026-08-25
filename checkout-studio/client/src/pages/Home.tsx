import { STYLE_PRESETS, THEME_ATELIER, type CheckoutScenario, type FunnelMode, type LogoTreatment, type StylePreset, type StyleTokens, type ThemeAtelierPreset } from "@shared/checkoutStudio";
import { trpc } from "@/lib/trpc";
import { BrandSignaturePanel, CapabilityCenterPanel, FunnelComposerPanel, PlacementMapPanel, ThemeAtelierPanel } from "@/components/ExpandedStudioPanels";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  Copy,
  Crown,
  Eye,
  FileClock,
  Grid2X2,
  History,
  Info,
  Layers3,
  LayoutDashboard,
  Lock,
  Menu,
  Monitor,
  MoreHorizontal,
  Palette,
  PanelRight,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Area = "Overview" | "Theme Atelier" | "Brand Signature" | "Funnel Composer" | "Placement Map" | "Capability Center" | "Style Library" | "Style Editor" | "Content Blocks" | "Preview & Test" | "Campaign Scheduler" | "Style History" | "Settings";
type PreviewDevice = "desktop" | "tablet" | "mobile";

const nav: { label: Area; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Theme Atelier", icon: WandSparkles },
  { label: "Brand Signature", icon: Crown },
  { label: "Funnel Composer", icon: Sparkles },
  { label: "Placement Map", icon: Copy },
  { label: "Capability Center", icon: ShieldCheck },
  { label: "Style Library", icon: Grid2X2 },
  { label: "Style Editor", icon: Palette },
  { label: "Content Blocks", icon: Layers3 },
  { label: "Preview & Test", icon: Eye },
  { label: "Campaign Scheduler", icon: CalendarClock },
  { label: "Style History", icon: History },
  { label: "Settings", icon: Settings2 },
];

function initialAreaFromUrl(): Area {
  const value = new URLSearchParams(window.location.search).get("area");
  return nav.some(item => item.label === value) ? value as Area : "Overview";
}

function initialDeviceFromUrl(): PreviewDevice {
  const value = new URLSearchParams(window.location.search).get("device");
  return value === "mobile" || value === "tablet" || value === "desktop" ? value : "desktop";
}

let previewPresentation: { brandName: string; brandTreatment: LogoTreatment; funnelMode: FunnelMode } = {
  brandName: "Aster & Thread",
  brandTreatment: "Wordmark",
  funnelMode: "Trust-First",
};

const scenarios: CheckoutScenario[] = ["Information", "Shipping", "Payment", "Discount", "Validation", "Unavailable", "Long cart", "Confirmation"];

function tokenToRgb(hex: string) {
  const raw = hex.replace("#", "");
  const normalized = raw.length === 3 ? raw.split("").map(char => char + char).join("") : raw;
  const value = Number.parseInt(normalized, 16);
  return [value >> 16, (value >> 8) & 255, value & 255];
}

function luminance(hex: string) {
  const [r, g, b] = tokenToRgb(hex).map(channel => {
    const linear = channel / 255;
    return linear <= 0.03928 ? linear / 12.92 : ((linear + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(first: string, second: string) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "accent" }) {
  const styles = {
    neutral: "bg-stone-100 text-stone-600 border-stone-200",
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    accent: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em] ${styles[tone]}`}>{children}</span>;
}

function AppMark() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#29251f] shadow-[0_6px_14px_rgba(41,37,31,0.18)]">
      <span className="font-serif text-lg italic leading-none text-[#f7f1e8]">C</span>
    </div>
  );
}

function CheckoutPreview({ tokens, scenario, device = "desktop", brandName, brandTreatment, funnelMode, interactive = false, onSelectComponent }: { tokens: StyleTokens; scenario: CheckoutScenario; device?: PreviewDevice; brandName?: string; brandTreatment?: LogoTreatment; funnelMode?: FunnelMode; interactive?: boolean; onSelectComponent?: (component: string) => void }) {
  const isMobile = device === "mobile";
  const isTablet = device === "tablet";
  const displayBrandName = brandName ?? previewPresentation.brandName;
  const displayBrandTreatment = brandTreatment ?? previewPresentation.brandTreatment;
  const displayFunnelMode = funnelMode ?? previewPresentation.funnelMode;
  const total = scenario === "Long cart" ? "$284.00" : "$128.00";
  const outlined = (name: string) => interactive ? " cursor-pointer transition hover:ring-2 hover:ring-violet-400/60" : "";
  const select = (name: string) => onSelectComponent?.(name);

  return (
    <div className={`checkout-frame mx-auto ${isMobile ? "max-w-[350px]" : isTablet ? "max-w-[680px]" : "max-w-[790px]"}`} style={{ "--preview-bg": tokens.background, "--preview-surface": tokens.surface, "--preview-text": tokens.text, "--preview-muted": tokens.mutedText, "--preview-primary": tokens.primary, "--preview-primary-text": tokens.primaryText, "--preview-border": tokens.border, "--preview-focus": tokens.focus, "--preview-error": tokens.error } as React.CSSProperties}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-[11px] shadow-sm"><span className="font-semibold text-stone-600">Responsive simulation <span className="ml-1 font-normal text-stone-400">{isMobile ? "390 px" : isTablet ? "768 px" : "1440 px"}</span></span><div className="flex rounded-lg bg-stone-100 p-0.5">{([['mobile', Smartphone, 'Mobile'], ['tablet', Tablet, 'Tablet'], ['desktop', Monitor, 'Desktop']] as const).map(([mode, Icon, label]) => <button type="button" key={mode} onClick={() => window.dispatchEvent(new CustomEvent("checkout-studio:device-change", { detail: mode }))} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold transition ${device === mode ? "bg-white text-[#6556d9] shadow-sm" : "text-stone-500 hover:text-stone-800"}`}><Icon className="h-3 w-3" />{label}</button>)}</div></div>
      <div className={`overflow-hidden rounded-[18px] border border-stone-200 bg-[var(--preview-bg)] shadow-[0_24px_70px_rgba(39,34,28,0.13)] ${isMobile ? "text-[10px]" : "text-xs"}`} style={{ borderWidth: tokens.borderWidth }}>
        <div className="flex items-center justify-between border-b border-[var(--preview-border)] px-5 py-4 text-[var(--preview-text)]">
          <div className={`flex items-center gap-2.5 ${displayBrandTreatment === "Stacked lockup" ? "flex-col items-start gap-1" : ""}`}><div className="grid h-6 w-6 place-items-center rounded-md bg-[var(--preview-primary)] font-serif text-xs italic text-[var(--preview-primary-text)]">{displayBrandName.slice(0, 1).toUpperCase()}</div>{displayBrandTreatment !== "Icon mark" && <span className={`${tokens.font === "Editorial" ? "font-serif text-base" : "font-semibold"}`}>{displayBrandTreatment === "Monogram" ? displayBrandName.slice(0, 1).toUpperCase() : displayBrandName}</span>}</div>
          <span className="text-[var(--preview-muted)]">Secure checkout</span>
        </div>
        <div className={`${isMobile ? "block" : isTablet ? "grid grid-cols-[1fr_0.8fr]" : "grid grid-cols-[1.1fr_0.9fr]"}`}>
          <section className="p-5 text-[var(--preview-text)]">
            <div className="mb-3 flex items-center gap-2 text-[var(--preview-muted)]"><span className="rounded-full bg-[var(--preview-primary)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--preview-primary-text)]">1</span>Information <ChevronRight className="h-3 w-3" /> Shipping <ChevronRight className="h-3 w-3" /> Payment</div>
            <div className="mb-4 inline-flex rounded-full border border-[var(--preview-border)] bg-[var(--preview-surface)] px-2.5 py-1 text-[9px] font-semibold text-[var(--preview-muted)]">{displayFunnelMode} funnel direction</div>
            {scenario === "Unavailable" && <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800">We couldn’t find a shipping method for this address. Try a nearby location.</div>}
            {scenario === "Confirmation" ? <div className="rounded-xl border border-[var(--preview-border)] bg-[var(--preview-surface)] p-4"><div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--preview-primary)] text-[var(--preview-primary-text)]"><Check className="h-4 w-4" /></div><h3 className="mt-3 text-base font-semibold">Thank you, Sophie.</h3><p className="mt-1 leading-5 text-[var(--preview-muted)]">Your order is confirmed. We will send a delivery update when it begins its journey.</p><div className="mt-4 rounded-lg bg-black/[0.03] p-3"><p className="font-semibold">Order care</p><p className="mt-1 text-[var(--preview-muted)]">Keep your order number for any support request.</p></div></div> : <><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Contact</h3><button className="text-[var(--preview-primary)] underline">Log in</button></div>
            <label className="mb-3 block"><span className="mb-1.5 block font-medium">Email</span><div onClick={() => select("Email field")} className={`rounded-[calc(var(--preview-radius,12px)-4px)] border border-[var(--preview-border)] bg-[var(--preview-surface)] px-3 py-2.5 text-[var(--preview-muted)] ${outlined("Email field")}`}>sophie@example.com</div>{scenario === "Validation" && <span className="mt-1.5 flex items-center gap-1 text-[var(--preview-error)]"><AlertTriangle className="h-3 w-3" />Enter a valid email address.</span>}</label>
            {scenario === "Shipping" && <div className="mb-3 space-y-2"><p className="font-semibold">Delivery method</p><div className={`flex items-center justify-between rounded-lg border-2 border-[var(--preview-primary)] bg-[var(--preview-surface)] px-3 py-3 ${outlined("Shipping selection")}`} onClick={() => select("Shipping selection")}><span><b>Standard delivery</b><br /><span className="text-[var(--preview-muted)]">3–5 business days</span></span><b>$6.00</b></div><div className="flex items-center justify-between rounded-lg border border-[var(--preview-border)] bg-[var(--preview-surface)] px-3 py-3"><span><b>Express delivery</b><br /><span className="text-[var(--preview-muted)]">1–2 business days</span></span><b>$15.00</b></div></div>}
            {scenario === "Payment" && <div className="mb-3 space-y-2"><p className="font-semibold">Payment</p><div onClick={() => select("Payment selection")} className={`rounded-lg border-2 border-[var(--preview-primary)] bg-[var(--preview-surface)] px-3 py-3 ${outlined("Payment selection")}`}><div className="mb-3 flex items-center justify-between"><b>Credit card</b><span className="font-semibold">VISA&nbsp; ●●●●</span></div><div className="grid grid-cols-2 gap-2"><div className="rounded border border-[var(--preview-border)] px-2 py-2 text-[var(--preview-muted)]">Card number</div><div className="rounded border border-[var(--preview-border)] px-2 py-2 text-[var(--preview-muted)]">MM / YY</div></div></div></div>}
            {scenario === "Discount" && <div className="mb-3"><p className="mb-2 font-semibold">Discount</p><div className="flex gap-2"><div className="flex-1 rounded-lg border border-[var(--preview-border)] bg-[var(--preview-surface)] px-3 py-2.5 text-[var(--preview-muted)]">WELCOME15</div><div className="rounded-lg bg-[var(--preview-primary)] px-3 py-2.5 font-semibold text-[var(--preview-primary-text)]">Apply</div></div><p className="mt-2 text-emerald-700">WELCOME15 applied — You saved $19.20</p></div>}
            {scenario !== "Shipping" && scenario !== "Payment" && <><label className="mb-3 block"><span className="mb-1.5 block font-medium">Country / Region</span><div className="flex items-center justify-between rounded-lg border border-[var(--preview-border)] bg-[var(--preview-surface)] px-3 py-2.5">United States <ChevronRight className="h-3 w-3 rotate-90" /></div></label><div className="mb-4 grid grid-cols-2 gap-3"><label><span className="mb-1.5 block font-medium">First name</span><div className="rounded-lg border border-[var(--preview-border)] bg-[var(--preview-surface)] px-3 py-2.5 text-[var(--preview-muted)]">Sophie</div></label><label><span className="mb-1.5 block font-medium">Last name</span><div className="rounded-lg border border-[var(--preview-border)] bg-[var(--preview-surface)] px-3 py-2.5 text-[var(--preview-muted)]">Martin</div></label></div></>}
            <button onClick={() => select("Primary button")} className={`w-full rounded-[var(--preview-radius,12px)] bg-[var(--preview-primary)] px-4 py-3 font-semibold text-[var(--preview-primary-text)] shadow-sm ${outlined("Primary button")}`}>{scenario === "Payment" ? "Pay now" : "Continue to shipping"}</button>
            <p className="mt-3 text-center text-[10px] text-[var(--preview-muted)]">By continuing, you agree to the store’s terms and privacy policy.</p></>}
          </section>
          <aside className={`border-[var(--preview-border)] bg-black/[0.018] p-5 ${isMobile ? "border-t" : "border-l"}`}>
            <h3 className="mb-4 font-semibold text-[var(--preview-text)]">Order summary</h3>
            <div className="space-y-3 text-[var(--preview-text)]">
              {Array.from({ length: scenario === "Long cart" ? 4 : 1 }).map((_, index) => <div className="flex gap-3" key={index}><div className="h-11 w-11 shrink-0 rounded-md bg-gradient-to-br from-[#e8d4c4] to-[#b88a72]" /><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><b className="truncate">{index ? "Ribbed cotton tee" : "Soft form carryall"}</b><span>{index ? "$32.00" : "$128.00"}</span></div><p className="mt-1 text-[var(--preview-muted)]">Natural / One size</p></div></div>)}
            </div>
            <div className="my-4 border-t border-[var(--preview-border)]" />
            <div className="space-y-2 text-[var(--preview-muted)]"><div className="flex justify-between"><span>Subtotal</span><span>{total}</span></div><div className="flex justify-between"><span>Shipping</span><span>Calculated next</span></div></div>
            <div className="mt-4 flex items-end justify-between border-t border-[var(--preview-border)] pt-4 text-[var(--preview-text)]"><b>Total</b><span className="text-lg font-semibold">{total}</span></div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function CapabilityBanner() {
  const workspaceQuery = trpc.studio.workspace.useQuery(undefined, { retry: false, refetchOnWindowFocus: true });
  const isEmbedded = typeof window !== "undefined" && window.self !== window.top && new URLSearchParams(window.location.search).has("host");
  const connectionState = workspaceQuery.data?.connection.state ?? "not_connected";
  const connectionMessage = workspaceQuery.data?.connection.message;
  const connectionTitle = workspaceQuery.data?.connection.title;
  const isConnected = connectionState === "checking" || connectionState === "ready";
  const isReady = connectionState === "ready";

  useEffect(() => {
    if (!isEmbedded || isConnected) return;
    const retry = window.setInterval(() => void workspaceQuery.refetch(), 1000);
    const stop = window.setTimeout(() => window.clearInterval(retry), 12_000);
    return () => { window.clearInterval(retry); window.clearTimeout(stop); };
  }, [isConnected, isEmbedded, workspaceQuery]);

  const isBlocked = connectionState === "denied" || connectionState === "error";
  return <div className={`flex flex-col gap-3 rounded-2xl border px-4 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between ${isConnected ? "border-violet-200 bg-violet-50 text-violet-950" : isBlocked ? "border-rose-200 bg-rose-50 text-rose-950" : "border-[#e8dbbf] bg-[#fffbf3] text-[#6c5737]"}`}><div className="flex items-start gap-3"><div className={`mt-0.5 rounded-full p-1.5 ${isConnected ? "bg-violet-100" : isBlocked ? "bg-rose-100" : "bg-[#f5e7c5]"}`}>{isConnected ? <CircleDashed className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}</div><p>{isReady ? <><b>{connectionTitle ?? "Store verified"}.</b> {connectionMessage ?? "Supported checkout capabilities are ready for review before any live change."}</> : isConnected ? <><b>Store connected.</b> {connectionMessage ?? "Checkout Studio is checking the Shopify plan, supported configuration fields, and extension targets. Live publishing remains locked until that check is complete."}</> : isBlocked ? <><b>{connectionTitle ?? "Checkout capability unavailable"}.</b> {connectionMessage ?? "The live checkout has not changed. Review Shopify plan and permission access, then refresh."}</> : <><b>Demo workspace.</b> Open Checkout Studio from Shopify Admin to establish a verified App Bridge session, then the app will check store eligibility.</>}</p></div><button onClick={() => void workspaceQuery.refetch()} className="shrink-0 text-left font-semibold underline underline-offset-4">Refresh connection</button></div>;
}

export default function Home() {
  const [area, setArea] = useState<Area>(initialAreaFromUrl);
  const [selectedPreset, setSelectedPreset] = useState<StylePreset>(STYLE_PRESETS[1]);
  const [tokens, setTokens] = useState<StyleTokens>(STYLE_PRESETS[1].tokens);
  const [scenario, setScenario] = useState<CheckoutScenario>("Information");
  const [device, setDevice] = useState<PreviewDevice>(initialDeviceFromUrl);
  const [inspector, setInspector] = useState("Primary button");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [favorites, setFavorites] = useState<string[]>(["soft-luxury"]);
  const [draftName, setDraftName] = useState("Autumn reset");
  const [modules, setModules] = useState<Record<string, boolean>>({ "Trust Bar": true, "Delivery Promise": true, "Secure Checkout Note": false, "Sustainability Note": false, "Gift Message Reminder": false, "Returns Reminder": true, "Rewards Reminder": false, "Order Benefit Banner": false, "Customer Support Link": true, "Social Proof Snippet": false });
  const [activeSchedule, setActiveSchedule] = useState(false);
  const [activeFunnel, setActiveFunnel] = useState<FunnelMode>("Trust-First");
  const [brandName, setBrandName] = useState("Aster & Thread");
  const [brandTreatment, setBrandTreatment] = useState<LogoTreatment>("Wordmark");
  const [persistedStyleId, setPersistedStyleId] = useState<number | null>(null);
  useEffect(() => {
    const changeDevice = (event: Event) => {
      const mode = (event as CustomEvent<PreviewDevice>).detail;
      if (mode === "desktop" || mode === "tablet" || mode === "mobile") setDevice(mode);
    };
    window.addEventListener("checkout-studio:device-change", changeDevice);
    return () => window.removeEventListener("checkout-studio:device-change", changeDevice);
  }, []);
  const workspaceQuery = trpc.studio.workspace.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const versionsQuery = trpc.studio.versions.list.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const saveDraftMutation = trpc.studio.styles.saveDraft.useMutation({
    onSuccess: style => {
      setPersistedStyleId(style?.id ?? null);
      void versionsQuery.refetch();
      toast.success("Draft saved to your merchant workspace.");
    },
    onError: () => toast.error("Sign in to save this draft to your merchant workspace."),
  });
  const campaignMutation = trpc.studio.campaigns.create.useMutation({
    onSuccess: () => toast.success("Campaign saved as blocked until Shopify capability validation is available."),
    onError: () => toast.error("Save a signed-in draft before preparing this campaign."),
  });

  previewPresentation = { brandName, brandTreatment, funnelMode: activeFunnel };

  const buttonContrast = useMemo(() => contrastRatio(tokens.primary, tokens.primaryText), [tokens]);
  const filteredPresets = STYLE_PRESETS.filter(item => (category === "All" || item.category === category) && `${item.name} ${item.descriptor}`.toLowerCase().includes(search.toLowerCase()));
  const activeModules = Object.values(modules).filter(Boolean).length;
  const applyPreset = (preset: StylePreset) => { setSelectedPreset(preset); setTokens(preset.tokens); setArea("Style Editor"); toast.success(`${preset.name} is ready to personalize.`); };
  const applyAtelierTheme = (theme: ThemeAtelierPreset) => { setSelectedPreset(theme); setTokens(theme.tokens); setActiveFunnel(theme.funnelMode); setBrandTreatment(theme.tokens.logoTreatment); setDraftName(`${theme.name} chapter`); setArea("Brand Signature"); toast.success(`${theme.name} is ready for your brand signature.`); };
  const updateColor = (key: keyof Pick<StyleTokens, "background" | "surface" | "text" | "primary" | "primaryText" | "border" | "focus">, value: string) => setTokens(current => ({ ...current, [key]: value }));
  const handleSaveDraft = () => saveDraftMutation.mutate({ name: draftName, presetSlug: selectedPreset.slug, tokens });
  const handleCreateCampaign = () => {
    if (!persistedStyleId) return toast.info("Save the draft first, then Checkout Studio can prepare a campaign record.");
    campaignMutation.mutate({ merchantStyleId: persistedStyleId, name: "Holiday chapter", startAt: new Date("2026-12-01T17:00:00Z"), endAt: new Date("2026-12-30T07:59:00Z"), timezone: "America/Los_Angeles" });
  };
  const safeAction = (label: string) => {
    if (label.includes("Apply")) return window.dispatchEvent(new CustomEvent("checkout-studio:open-review", { detail: { theme: selectedPreset.name, funnel: activeFunnel, brandName, treatment: brandTreatment } }));
    if (label.includes("Restore")) return window.dispatchEvent(new Event("checkout-studio:open-rollback"));
    toast.info(`${label} is intentionally disabled in demo mode. Connect an eligible Shopify store to validate and enable this action.`);
  };

  const overview = <>
    <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow">Checkout Studio</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#29251f] sm:text-4xl">Your checkout, refined.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">Create a more cohesive checkout with clear, Shopify-supported branding controls and a careful release workflow.</p></div><div className="flex gap-2"><button onClick={() => setArea("Style Library")} className="quiet-button"><Grid2X2 className="h-4 w-4" />Browse styles</button><button onClick={() => setArea("Style Editor")} className="primary-button"><Palette className="h-4 w-4" />Edit style</button></div></div>
    <CapabilityBanner />
    <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_2px_8px_rgba(44,38,28,.025)] lg:flex-row lg:items-center lg:justify-between">
      <div><p className="text-sm font-semibold">Workspace draft record</p><p className="mt-1 text-xs leading-5 text-stone-500">{versionsQuery.isLoading ? "Loading merchant version history…" : versionsQuery.error ? "Sign in to save styles and view merchant-scoped history. The live checkout is unchanged." : versionsQuery.data?.length ? `${versionsQuery.data.length} saved version${versionsQuery.data.length === 1 ? "" : "s"} in this workspace.` : "No saved version yet. Save this visual direction as a draft first."}</p></div>
      <div className="flex flex-wrap gap-2"><button disabled={saveDraftMutation.isPending} onClick={handleSaveDraft} className="quiet-button"><Check className="h-4 w-4" />{saveDraftMutation.isPending ? "Saving…" : "Save draft"}</button><button disabled={campaignMutation.isPending} onClick={handleCreateCampaign} className="quiet-button"><CalendarClock className="h-4 w-4" />{campaignMutation.isPending ? "Saving…" : "Prepare campaign"}</button></div>
    </section>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="studio-card overflow-hidden p-0"><div className="relative overflow-hidden bg-[#29251f] px-6 pb-6 pt-6 text-[#fffaf2]"><div className="absolute -right-12 -top-14 h-52 w-52 rounded-full bg-[#b89d6d] opacity-30 blur-3xl" /><div className="relative flex items-start justify-between gap-4"><div><Pill tone="good"><CheckCircle2 className="h-3 w-3" />Published draft</Pill><h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">{selectedPreset.name}</h2><p className="mt-1 text-sm text-stone-300">Last updated today at 11:24 AM</p></div><button onClick={() => setArea("Style Editor")} className="rounded-lg border border-white/20 bg-white/10 p-2 transition hover:bg-white/20" aria-label="Edit current style"><ArrowUpRight className="h-4 w-4" /></button></div></div><div className="grid gap-4 p-5 sm:grid-cols-3"><div><p className="label">Branding</p><p className="mt-1.5 text-sm font-semibold">7 tokens applied</p></div><div><p className="label">Content blocks</p><p className="mt-1.5 text-sm font-semibold">{activeModules} enabled</p></div><div><p className="label">Capability state</p><p className="mt-1.5 text-sm font-semibold">Awaiting connection</p></div></div></section>
      <section className="studio-card p-5"><div className="flex items-start justify-between"><div><p className="eyebrow">Checkout readiness</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Thoughtfully prepared</h2></div><div className="relative grid h-16 w-16 place-items-center rounded-full" style={{ background: "conic-gradient(#466858 0 73%, #ece8e1 73% 100%)" }}><div className="grid h-12 w-12 place-items-center rounded-full bg-white text-sm font-semibold">73</div></div></div><p className="mt-3 text-sm leading-6 text-stone-500">A practical guidance score based on contrast, clarity, mobile cues, and currently configured checkout features. It is not a conversion guarantee.</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full w-[73%] rounded-full bg-[#466858]" /></div></section>
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-3"><section className="studio-card p-5 lg:col-span-2"><div className="flex items-center justify-between"><div><p className="eyebrow">Next best actions</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Small improvements, clearly explained.</h2></div><button onClick={() => setArea("Preview & Test")} className="text-sm font-semibold text-[#6556d9]">View checks</button></div><div className="mt-4 divide-y divide-stone-100"><ActionRow icon={<Sparkles />} title="Review primary button contrast" description={`Current contrast is ${buttonContrast.toFixed(1)}:1. Keep it at 4.5:1 or stronger for normal-sized text.`} action="Review" onClick={() => setArea("Style Editor")} /><ActionRow icon={<Monitor />} title="Compare a mobile checkout state" description="Preview a tighter viewport before any supported publish action is available." action="Preview" onClick={() => { setDevice("mobile"); setArea("Preview & Test"); }} /><ActionRow icon={<CalendarClock />} title="Prepare a seasonal campaign" description="Save the style and schedule a future review window in your local timezone." action="Schedule" onClick={() => setArea("Campaign Scheduler")} /></div></section>
      <section className="studio-card p-5"><div className="flex items-center justify-between"><div><p className="eyebrow">Upcoming</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Campaigns</h2></div><CalendarClock className="h-5 w-5 text-[#8a7c6d]" /></div><div className="mt-5 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center"><FileClock className="mx-auto h-6 w-6 text-stone-400" /><p className="mt-3 text-sm font-semibold">No future campaign yet</p><p className="mt-1 text-xs leading-5 text-stone-500">Create one when your store is connected and eligible for supported style updates.</p><button onClick={() => setArea("Campaign Scheduler")} className="mt-4 text-sm font-semibold text-[#6556d9]">Create campaign</button></div></section></div>
    <section className="studio-card mt-5 overflow-hidden p-0"><div className="grid lg:grid-cols-[0.85fr_1.15fr]"><div className="p-6"><p className="eyebrow">A safer change path</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">From visual idea to supported checkout configuration.</h2><p className="mt-3 text-sm leading-6 text-stone-500">Checkout Studio keeps the design exploration fast, and the live configuration boundary honest.</p><div className="mt-6 space-y-4"><Step number="1" title="Choose a style" text="Start with a curated token set, then personalize it." /><Step number="2" title="Preview & validate" text="Review realistic states and plain-language checks." /><Step number="3" title="Apply safely" text="Only enabled after Shopify validates the eligible configuration." /></div></div><div className="relative flex min-h-[310px] items-center justify-center overflow-hidden bg-[#f5f0e7] p-6"><div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(184,157,109,.28),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(101,86,217,.14),transparent_35%)]" /><div className="relative w-full max-w-lg scale-[.78] origin-center sm:scale-[.92]"><CheckoutPreview tokens={tokens} scenario="Information" /></div></div></div></section>
  </>;

  const library = <><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow">Style library</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">A point of view for every checkout.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">Original design systems, each prepared as editable color, type, density, and component tokens.</p></div><button onClick={() => setArea("Style Editor")} className="quiet-button"><Palette className="h-4 w-4" />Open editor</button></div><div className="mt-6 flex flex-col gap-3 sm:flex-row"><label className="search-field"><Search className="h-4 w-4" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search styles" /></label><div className="flex gap-2 overflow-x-auto pb-1">{["All", "Essential", "Premium", "Seasonal", "Campaign"].map(item => <button onClick={() => setCategory(item)} key={item} className={`filter-button ${category === item ? "filter-button-active" : ""}`}>{item}</button>)}</div></div><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredPresets.map(preset => <PresetCard key={preset.slug} preset={preset} favorite={favorites.includes(preset.slug)} onFavorite={() => setFavorites(current => current.includes(preset.slug) ? current.filter(value => value !== preset.slug) : [...current, preset.slug])} onUse={() => applyPreset(preset)} />)}</div></>;

  const themeAtelier = <ThemeAtelierPanel themes={THEME_ATELIER} selectedSlug={selectedPreset.slug} brandName={brandName} onApply={applyAtelierTheme} />;
  const brandSignature = <BrandSignaturePanel primary={tokens.primary} text={tokens.primaryText} brandName={brandName} treatment={brandTreatment} onChange={setBrandName} onTreatmentChange={setBrandTreatment} />;
  const funnelComposer = <FunnelComposerPanel activeMode={activeFunnel} onMode={setActiveFunnel} />;
  const placementMap = <PlacementMapPanel />;
  const capabilityCenter = <CapabilityCenterPanel />;

  const editor = <><div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="eyebrow">Style editor</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">{draftName}</h1><p className="mt-2 text-sm text-stone-500">Based on <button onClick={() => setArea("Style Library")} className="font-semibold text-[#6556d9] underline underline-offset-4">{selectedPreset.name}</button> · Unsaved changes</p></div><div className="flex flex-wrap gap-2"><button onClick={() => toast.success("Draft saved locally in this workspace.")} className="quiet-button"><Check className="h-4 w-4" />Save draft</button><button onClick={() => setArea("Preview & Test")} className="quiet-button"><Eye className="h-4 w-4" />Preview changes</button><button onClick={() => safeAction("Apply to checkout")} className="primary-button opacity-60"><Lock className="h-4 w-4" />Apply to checkout</button></div></div><CapabilityBanner /><div className="editor-layout mt-5"><aside className="editor-sidebar"><div className="mb-5"><label className="label">Style name</label><input className="studio-input mt-2" value={draftName} onChange={event => setDraftName(event.target.value)} /></div><EditorSection title="Brand kit" subtitle="Logo, colors, type, and corner language" active /><EditorSection title="Colors" subtitle="Semantic tokens with contrast guidance" /><div className="rounded-xl bg-stone-50 p-3"><p className="mb-3 text-xs font-semibold text-stone-700">Semantic colors</p><ColorControl label="Background" value={tokens.background} onChange={value => updateColor("background", value)} /><ColorControl label="Surface" value={tokens.surface} onChange={value => updateColor("surface", value)} /><ColorControl label="Text" value={tokens.text} onChange={value => updateColor("text", value)} /><ColorControl label="Primary" value={tokens.primary} onChange={value => updateColor("primary", value)} /><ColorControl label="Button text" value={tokens.primaryText} onChange={value => updateColor("primaryText", value)} /><ColorControl label="Focus ring" value={tokens.focus} onChange={value => updateColor("focus", value)} /></div><EditorSection title="Typography" subtitle={`${tokens.font} pairing · balanced scale`} /><EditorSection title="Components" subtitle="Buttons, fields, cards, choices" /><EditorSection title="Layout" subtitle="Comfortable density · logo alignment" /><EditorSection title="Content blocks" subtitle={`${activeModules} enabled modules`} /></aside><section className="editor-preview"><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold">Checkout simulation</p><p className="mt-1 text-xs text-stone-500">Representative only — not your live Shopify checkout.</p></div><div className="flex rounded-lg border border-stone-200 bg-white p-1"><button onClick={() => setDevice("desktop")} className={`preview-device-button ${device === "desktop" ? "preview-device-active" : ""}`}><Monitor className="h-3.5 w-3.5" />Desktop</button><button onClick={() => setDevice("mobile")} className={`preview-device-button ${device === "mobile" ? "preview-device-active" : ""}`}><Smartphone className="h-3.5 w-3.5" />Mobile</button></div></div><div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1.5">{scenarios.map(item => <button key={item} onClick={() => setScenario(item)} className={`scenario-button ${scenario === item ? "scenario-active" : ""}`}>{item}</button>)}</div><div className="flex min-h-[590px] items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-[#f3efe8] p-5"><CheckoutPreview tokens={tokens} scenario={scenario} device={device} interactive onSelectComponent={setInspector} /></div></section><aside className="inspector"><div className="flex items-center justify-between"><div><p className="label">Contextual inspector</p><h3 className="mt-1 text-lg font-semibold">{inspector}</h3></div><PanelRight className="h-4 w-4 text-stone-400" /></div><div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-3.5"><p className="text-xs font-semibold text-stone-700">{inspector === "Primary button" ? "Primary action" : inspector}</p><p className="mt-1 text-xs leading-5 text-stone-500">These controls change the simulated design token set. Shopify will validate supported targets after store installation.</p></div><div className="mt-5 space-y-4"><InspectorRow label="Background" value={tokens.primary} onChange={value => updateColor("primary", value)} /><InspectorRow label="Text" value={tokens.primaryText} onChange={value => updateColor("primaryText", value)} /><InspectorRow label="Focus outline" value={tokens.focus} onChange={value => updateColor("focus", value)} /><div><div className="flex justify-between"><span className="text-xs font-medium">Corner radius</span><span className="text-xs text-stone-500">{tokens.radius}px</span></div><input className="range" type="range" min="4" max="24" value={tokens.radius} onChange={event => setTokens(current => ({ ...current, radius: Number(event.target.value) }))} /></div></div><div className="mt-6 border-t border-stone-100 pt-5"><p className="label">Focus &amp; contrast</p><div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-800"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />Button text contrast is {buttonContrast.toFixed(1)}:1.</div></div></aside></div></>;

  const blocks = <><header className="max-w-3xl"><p className="eyebrow">Content blocks</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Supportive moments, in their supported places.</h1><p className="mt-2 text-sm leading-6 text-stone-500">Enable concise checkout extension content only where the merchant’s configuration permits it. Every block remains optional and position-aware.</p></header><CapabilityBanner /><div className="mt-6 grid gap-4 lg:grid-cols-2">{Object.entries(modules).map(([name, enabled]) => <ModuleCard key={name} name={name} enabled={enabled} onToggle={() => setModules(current => ({ ...current, [name]: !current[name] }))} />)}</div></>;

  const preview = <><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow">Preview &amp; test</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">See the moments shoppers actually encounter.</h1><p className="mt-2 text-sm text-stone-500">This is a representative simulation, not a rendering of your live Shopify checkout.</p></div><div className="flex gap-2"><button onClick={() => setDevice("desktop")} className={`quiet-button ${device === "desktop" ? "border-[#8f82ed] bg-violet-50" : ""}`}><Monitor className="h-4 w-4" />Desktop</button><button onClick={() => setDevice("mobile")} className={`quiet-button ${device === "mobile" ? "border-[#8f82ed] bg-violet-50" : ""}`}><Smartphone className="h-4 w-4" />Mobile</button></div></div><div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_315px]"><section className="studio-card overflow-hidden p-5"><div className="flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1.5">{scenarios.map(item => <button key={item} onClick={() => setScenario(item)} className={`scenario-button ${scenario === item ? "scenario-active" : ""}`}>{item}</button>)}</div><div className="mt-5 flex min-h-[620px] items-center justify-center rounded-2xl bg-[#f3efe8] p-5"><CheckoutPreview tokens={tokens} scenario={scenario} device={device} /></div></section><section className="studio-card p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#466858]" /><div><p className="eyebrow">Quality panel</p><h2 className="mt-0.5 text-xl font-semibold tracking-[-0.03em]">Clear, calm checks</h2></div></div><div className="mt-5 space-y-3"><QualityItem good title="Button text is visible" description={`${buttonContrast.toFixed(1)}:1 contrast in this simulation.`} /><QualityItem good title="Focus states are defined" description="Interactive controls retain a clear focus indicator." /><QualityItem good title="Labels remain visible" description="Inputs have text labels rather than placeholder-only guidance." /><QualityItem title="Check the actual store capability" description="Shopify will determine the supported branding fields and extension targets after installation." /><QualityItem title="Review on a mobile device" description="The mobile state is simulated; verify the supported editor preview after connection." /></div><button onClick={() => safeAction("Open Shopify preview")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"><Lock className="h-4 w-4" />Open Shopify preview when connected</button></section></div></>;

  const scheduler = <><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow">Campaign scheduler</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Time a visual change with care.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">Choose a date range, preserve the prior configuration, and only activate after Shopify re-checks eligibility.</p></div><button onClick={() => safeAction("Create campaign")} className="primary-button opacity-60"><Lock className="h-4 w-4" />Schedule campaign</button></div><CapabilityBanner /><div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]"><section className="studio-card p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold tracking-[-0.03em]">New campaign</h2><p className="mt-1 text-sm text-stone-500">Save the desired style, period, and automatic restoration plan.</p></div><Pill tone="warn">Not connected</Pill></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><FormField label="Campaign name" value="Holiday chapter" /><FormField label="Style" value={selectedPreset.name} /><FormField label="Start date & time" value="Dec 01, 2026 · 9:00 AM" /><FormField label="End date & time" value="Dec 29, 2026 · 11:59 PM" /><FormField label="Timezone" value="America / Los Angeles" /><FormField label="After campaign" value="Restore current stable version" /></div><div className="mt-5 flex items-center gap-3 rounded-xl bg-stone-50 p-4"><button onClick={() => setActiveSchedule(!activeSchedule)} className={`relative h-6 w-11 rounded-full transition ${activeSchedule ? "bg-[#6556d9]" : "bg-stone-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${activeSchedule ? "left-6" : "left-1"}`} /></button><div><p className="text-sm font-semibold">Keep campaign ready for activation</p><p className="mt-0.5 text-xs text-stone-500">It will remain blocked until an eligible store is connected and validations pass.</p></div></div></section><section className="studio-card p-6"><p className="eyebrow">Safeguards</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">The existing live configuration stays protected.</h2><div className="mt-6 space-y-5"><ScheduleStep icon={<ShieldCheck />} title="Validate before activation" text="Re-check plan eligibility, available checkout fields, and extension targets immediately before the scheduled change." /><ScheduleStep icon={<RefreshCcw />} title="Restore automatically" text="Preserve the most recent stable style version for a reversible campaign end." /><ScheduleStep icon={<AlertTriangle />} title="Fail safely" text="If eligibility changes, keep the live checkout unchanged and write a merchant-visible diagnostic." /></div></section></div></>;

  const history = <><p className="eyebrow">Style history</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Every thoughtful iteration, accounted for.</h1><p className="mt-2 text-sm text-stone-500">Saved versions record the visual configuration, a human note, and the intended status.</p><div className="studio-card mt-6 overflow-hidden p-0"><div className="grid grid-cols-[1.1fr_0.55fr_0.65fr_0.7fr] gap-3 border-b border-stone-100 bg-stone-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500"><span>Version</span><span>Author</span><span>Status</span><span>Action</span></div>{versionsQuery.isLoading ? <div className="px-5 py-10 text-sm text-stone-500">Loading merchant style history…</div> : versionsQuery.error ? <div className="px-5 py-10 text-sm text-stone-500">Sign in to view merchant-scoped version history. Your live checkout is unchanged.</div> : versionsQuery.data?.length ? versionsQuery.data.map(version => <div className="grid grid-cols-[1.1fr_0.55fr_0.65fr_0.7fr] items-center gap-3 border-b border-stone-100 px-5 py-4 text-sm last:border-0" key={version.id}><div><p className="font-semibold text-stone-800">v{version.versionNumber} · {version.name}</p><p className="mt-1 text-xs text-stone-500">{new Date(version.createdAt).toLocaleString()} · {version.changeSummary.length} changes</p></div><span className="text-stone-600">You</span><span><Pill tone={version.isStable ? "good" : "accent"}>{version.isStable ? "Stable" : "Draft"}</Pill></span><button onClick={() => safeAction("Restore stable version")} className="justify-self-start text-sm font-semibold text-[#6556d9]">Review</button></div>) : <div className="px-5 py-10 text-center text-sm text-stone-500">No saved versions yet. Save a draft to begin a merchant-scoped history.</div>}</div></>;

  const settings = <><p className="eyebrow">Settings</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Configure the workspace, not the checkout beyond Shopify’s limits.</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">Checkout Studio identifies the supported configuration only after an authorized installation. It does not inject scripts, edit checkout templates, or bypass plan rules.</p><div className="mt-6 grid gap-5 lg:grid-cols-2"><DataStateCard loading={workspaceQuery.isLoading} error={workspaceQuery.error?.message} storeName={workspaceQuery.data?.store.displayName} onRetry={() => void workspaceQuery.refetch()} /><SettingsCard icon={<Palette />} title="Brand defaults" description="Set the default color direction, preferred type tone, and corner style for new drafts." action="Edit brand defaults" onClick={() => setArea("Style Editor")} /><SettingsCard icon={<ShieldCheck />} title="Permissions & audit" description="Actions will be scoped to the merchant store and include a recorded change summary." action="Review audit history" onClick={() => setArea("Style History")} /><SettingsCard icon={<CircleDashed />} title="Feature flags" description="New checkout capabilities and module types can be enabled only after they are explicitly supported." action="View feature map" onClick={() => toast.info("Feature flags are configured server-side after your Shopify connection is established.")} /></div></>;

  const content: Record<Area, React.ReactNode> = { "Overview": overview, "Theme Atelier": themeAtelier, "Brand Signature": brandSignature, "Funnel Composer": funnelComposer, "Placement Map": placementMap, "Capability Center": capabilityCenter, "Style Library": library, "Style Editor": editor, "Content Blocks": blocks, "Preview & Test": preview, "Campaign Scheduler": scheduler, "Style History": history, "Settings": settings };
  return <div className="min-h-screen bg-[#fbfaf8] text-[#29251f]"><div className="app-shell"><aside className="app-sidebar"><div className="flex items-center gap-2.5 px-3 py-2"><AppMark /><div><p className="font-semibold tracking-[-0.03em]">Checkout Studio</p><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">Checkout branding</p></div></div><nav className="mt-8 space-y-1">{nav.map(item => { const Icon = item.icon; return <button onClick={() => setArea(item.label)} key={item.label} className={`nav-button ${area === item.label ? "nav-active" : ""}`}><Icon className="h-4 w-4" /><span>{item.label}</span>{item.label === "Campaign Scheduler" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c6a472]" />}</button>; })}</nav><button onClick={() => window.dispatchEvent(new Event("checkout-studio:open-onboarding"))} className="mt-5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#6556d9] transition hover:bg-violet-50"><Sparkles className="h-3.5 w-3.5" />Open setup guide</button><div className="mt-auto rounded-xl border border-stone-200 bg-[#f7f4ee] p-3"><div className="flex items-center gap-2"><div className="grid h-7 w-7 place-items-center rounded-full bg-[#d9ceb8] text-[11px] font-bold text-[#514937]">AB</div><div><p className="text-xs font-semibold">Aster &amp; Bloom</p><p className="text-[10px] text-stone-500">Demo workspace</p></div><MoreHorizontal className="ml-auto h-4 w-4 text-stone-400" /></div></div></aside><main className="app-main"><header className="app-topbar"><button className="md:hidden"><Menu className="h-5 w-5" /></button><div className="hidden items-center gap-2 text-xs text-stone-500 md:flex"><span>Workspace</span><ChevronRight className="h-3 w-3" /><span className="font-semibold text-stone-700">{area}</span></div><div className="ml-auto flex items-center gap-2"><Pill tone="warn"><CircleDashed className="h-3 w-3" />Not connected</Pill><button onClick={() => window.dispatchEvent(new Event("checkout-studio:open-onboarding"))} className="hidden items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 sm:flex"><Lock className="h-3.5 w-3.5" />Connect Shopify</button></div></header><div className="app-content">{content[area]}</div></main></div></div>;
}

function ActionRow({ icon, title, description, action, onClick }: { icon: React.ReactNode; title: string; description: string; action: string; onClick: () => void }) { return <div className="flex gap-3 py-4 first:pt-2 last:pb-0"><div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-[#6d6255]">{icon}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-stone-500">{description}</p></div><button onClick={onClick} className="self-center text-xs font-semibold text-[#6556d9]">{action}</button></div>; }
function Step({ number, title, text }: { number: string; title: string; text: string }) { return <div className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#29251f] text-[11px] font-semibold text-white">{number}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs leading-5 text-stone-500">{text}</p></div></div>; }
function PresetCard({ preset, favorite, onFavorite, onUse }: { preset: StylePreset; favorite: boolean; onFavorite: () => void; onUse: () => void }) { return <article className="preset-card group"><div className="relative min-h-[165px] overflow-hidden rounded-xl border border-stone-200 p-3" style={{ background: preset.tokens.background, color: preset.tokens.text }}><button onClick={onFavorite} className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/80 text-stone-600 backdrop-blur hover:bg-white" aria-label={`Favorite ${preset.name}`}><Star className={`h-3.5 w-3.5 ${favorite ? "fill-[#c69547] text-[#c69547]" : ""}`} /></button><div className="h-full rounded-lg border p-3 shadow-sm" style={{ background: preset.tokens.surface, borderColor: preset.tokens.border }}><div className="flex justify-between"><div className="h-3 w-3 rounded" style={{ background: preset.tokens.primary }} /><span className="text-[8px] opacity-60">Checkout</span></div><div className="mt-5 space-y-2"><div className="h-2 w-16 rounded opacity-60" style={{ background: preset.tokens.text }} /><div className="h-7 rounded border" style={{ borderColor: preset.tokens.border }} /><div className="h-7 rounded" style={{ background: preset.tokens.primary }} /></div></div></div><div className="mt-4 flex items-start gap-3"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate text-sm font-semibold">{preset.name}</h2>{preset.isNew && <Pill tone="accent">New</Pill>}</div><p className="mt-1 min-h-10 text-xs leading-5 text-stone-500">{preset.descriptor}</p><div className="mt-3 flex items-center justify-between"><Pill tone="neutral">{preset.category}</Pill><button onClick={onUse} className="text-xs font-semibold text-[#6556d9]">Use style</button></div></div></div></article>; }
function EditorSection({ title, subtitle, active = false }: { title: string; subtitle: string; active?: boolean }) { return <button className={`mb-1 flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left transition ${active ? "bg-stone-100" : "hover:bg-stone-50"}`}><div><p className="text-xs font-semibold">{title}</p><p className="mt-0.5 text-[10px] text-stone-500">{subtitle}</p></div><ChevronRight className="h-3.5 w-3.5 text-stone-400" /></button>; }
function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="mb-2 flex items-center gap-2 last:mb-0"><input className="color-swatch" type="color" value={value} onChange={event => onChange(event.target.value)} /><span className="min-w-0 flex-1 truncate text-[11px] text-stone-600">{label}</span><input className="w-[67px] bg-transparent text-right font-mono text-[10px] uppercase text-stone-500 outline-none" value={value} onChange={event => /^#[0-9A-Fa-f]{0,6}$/.test(event.target.value) && onChange(event.target.value)} /></label>; }
function InspectorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="flex items-center gap-2"><span className="min-w-0 flex-1 text-xs font-medium">{label}</span><input className="color-swatch" type="color" value={value} onChange={event => onChange(event.target.value)} /><span className="w-[57px] font-mono text-[10px] uppercase text-stone-500">{value}</span></label>; }
function ModuleCard({ name, enabled, onToggle }: { name: string; enabled: boolean; onToggle: () => void }) { const helper: Record<string, string> = { "Trust Bar": "Icons and concise benefit statements, placed only where the checkout editor permits.", "Delivery Promise": "Merchant-authored delivery expectation with clear eligibility language.", "Secure Checkout Note": "A short reassurance note with an accessible icon label.", "Sustainability Note": "A factual, merchant-provided packaging or impact statement.", "Gift Message Reminder": "A prompt to add a gift note where supported.", "Returns Reminder": "A concise policy reminder with a merchant-configured link.", "Rewards Reminder": "Requires a connected loyalty data source and supported configuration.", "Order Benefit Banner": "A configured free-shipping or campaign message, never an invented claim.", "Customer Support Link": "A merchant-configured contact destination.", "Social Proof Snippet": "Merchant-authored content only. Checkout Studio does not generate customer claims or testimonials." }; return <article className="studio-card p-5"><div className="flex gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${enabled ? "bg-violet-50 text-[#6556d9]" : "bg-stone-100 text-stone-500"}`}><Layers3 className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h2 className="text-sm font-semibold">{name}</h2><button onClick={onToggle} className={`relative h-6 w-11 shrink-0 rounded-full transition ${enabled ? "bg-[#6556d9]" : "bg-stone-300"}`} aria-label={`Toggle ${name}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-1"}`} /></button></div><p className="mt-2 text-xs leading-5 text-stone-500">{helper[name]}</p><div className="mt-4 flex items-center justify-between"><Pill tone={enabled ? "good" : "neutral"}>{enabled ? "Configured" : "Optional"}</Pill><button onClick={() => toast.info(`${name} settings are prepared for supported placement selection after installation.`)} className="text-xs font-semibold text-[#6556d9]">Configure</button></div></div></div></article>; }
function QualityItem({ title, description, good = false }: { title: string; description: string; good?: boolean }) { return <div className="flex gap-3 rounded-xl border border-stone-100 p-3"><div className={`mt-0.5 ${good ? "text-emerald-600" : "text-amber-600"}`}>{good ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}</div><div><p className="text-xs font-semibold text-stone-800">{title}</p><p className="mt-1 text-xs leading-5 text-stone-500">{description}</p></div></div>; }
function FormField({ label, value }: { label: string; value: string }) { return <label><span className="label">{label}</span><div className="mt-2 flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-700">{value}<ChevronRight className="h-4 w-4 rotate-90 text-stone-400" /></div></label>; }
function ScheduleStep({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="flex gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-[#6556d9]">{icon}</div><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-stone-500">{text}</p></div></div>; }
function SettingsCard({ icon, title, description, action, onClick }: { icon: React.ReactNode; title: string; description: string; action: string; onClick: () => void }) { return <section className="studio-card p-5"><div className="grid h-9 w-9 place-items-center rounded-lg bg-stone-100 text-[#6556d9]">{icon}</div><h2 className="mt-4 text-lg font-semibold tracking-[-0.02em]">{title}</h2><p className="mt-2 text-sm leading-6 text-stone-500">{description}</p><button onClick={onClick} className="mt-5 text-sm font-semibold text-[#6556d9]">{action}</button></section>; }
function DataStateCard({ loading, error, storeName, onRetry }: { loading: boolean; error?: string; storeName?: string; onRetry: () => void }) { const denied = Boolean(error); return <section className="studio-card p-5"><div className={`grid h-9 w-9 place-items-center rounded-lg ${loading ? "bg-stone-100 text-stone-500" : denied ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{loading ? <CircleDashed className="h-5 w-5 animate-spin" /> : denied ? <Lock className="h-4 w-4" /> : <CheckCircle2 className="h-5 w-5" />}</div><h2 className="mt-4 text-lg font-semibold tracking-[-0.02em]">{loading ? "Checking workspace access" : denied ? "Workspace permission required" : "Store capability status"}</h2><p className="mt-2 text-sm leading-6 text-stone-500">{loading ? "Retrieving the merchant-scoped workspace and capability context." : denied ? "Sign in to access merchant-scoped drafts and capability details. The live checkout configuration has not changed." : `${storeName ?? "Your store"} is connected to a demo workspace. Shopify plan and checkout targets remain pending authorization.`}</p><button onClick={onRetry} className="mt-5 text-sm font-semibold text-[#6556d9]">{loading ? "Checking…" : denied ? "Try again" : "Refresh capability status"}</button></section>; }
