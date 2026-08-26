import { AlertTriangle, ArrowRight, CheckCircle2, CircleDashed, Eye, Lock, Palette, RefreshCcw, ShieldCheck, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Overlay = "onboarding" | "review" | "rollback" | null;
type ReviewDetail = { theme: string; funnel: string; brandName: string; treatment: string };

const onboarding = [
  { icon: <ShieldCheck />, eyebrow: "Capability check", title: "Start with what Shopify supports.", text: "After installation, Checkout Studio reads the store’s available checkout configuration and clearly marks what can and cannot be published.", action: "Review capability plan" },
  { icon: <Palette />, eyebrow: "Brand signature", title: "Set the visual direction once.", text: "Bring together your logo treatment, brand colors, type direction, and corner language before choosing a funnel theme.", action: "Open Brand Signature" },
  { icon: <Sparkles />, eyebrow: "Theme & funnel", title: "Compose a considered checkout path.", text: "Pair a Theme Atelier system with an intentional contact, shipping, payment, and confirmation direction.", action: "Explore themes" },
  { icon: <Eye />, eyebrow: "Preview & apply", title: "Review the state before release.", text: "Compare realistic checkout moments, inspect quality checks, and only enable live configuration after Shopify confirms eligibility.", action: "Open preview" },
];

export function StudioOverlays() {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [step, setStep] = useState(0);
  const [review, setReview] = useState<ReviewDetail>({ theme: "Soft Luxury", funnel: "Trust-First", brandName: "Aster & Thread", treatment: "Wordmark" });

  useEffect(() => {
    const openOnboarding = () => { setStep(0); setOverlay("onboarding"); };
    const openReview = (event: Event) => {
      const detail = (event as CustomEvent<ReviewDetail>).detail;
      if (detail?.theme && detail?.funnel) setReview(detail);
      setOverlay("review");
    };
    const openRollback = () => setOverlay("rollback");
    window.addEventListener("checkout-studio:open-onboarding", openOnboarding);
    window.addEventListener("checkout-studio:open-review", openReview);
    window.addEventListener("checkout-studio:open-rollback", openRollback);
    return () => {
      window.removeEventListener("checkout-studio:open-onboarding", openOnboarding);
      window.removeEventListener("checkout-studio:open-review", openReview);
      window.removeEventListener("checkout-studio:open-rollback", openRollback);
    };
  }, []);

  if (!overlay) return null;
  const close = () => setOverlay(null);
  const current = onboarding[step];

  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#29251f]/35 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true">
    {overlay === "onboarding" && <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-stone-200 bg-[#fffdf9] shadow-[0_30px_90px_rgba(41,37,31,.24)]"><div className="flex items-center justify-between border-b border-stone-100 px-6 py-5"><div className="flex items-center gap-2 text-xs font-semibold text-stone-500"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#29251f] font-serif text-base italic text-[#f7f1e8]">C</span>Checkout Studio guide</div><button onClick={close} className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700" aria-label="Close onboarding"><X className="h-4 w-4" /></button></div><div className="p-6 sm:p-8"><div className="mb-8 flex gap-1.5">{onboarding.map((_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-[#6556d9]" : "bg-stone-200"}`} />)}</div><div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-[#6556d9]">{current.icon}</div><p className="mt-6 text-[11px] font-bold uppercase tracking-[0.13em] text-[#8a7c6d]">{current.eyebrow}</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#29251f]">{current.title}</h2><p className="mt-4 max-w-md text-sm leading-6 text-stone-500">{current.text}</p><div className="mt-8 rounded-xl border border-[#e8dbbf] bg-[#fffbf3] p-3 text-xs leading-5 text-[#6c5737]"><Lock className="mr-1.5 inline h-3.5 w-3.5" />Demo mode keeps all live checkout actions unavailable until the app is authorized for a merchant’s store.</div><div className="mt-8 flex items-center justify-between"><button onClick={close} className="text-sm font-semibold text-stone-500">Skip for now</button><button onClick={() => step === onboarding.length - 1 ? (close(), toast.success("Your onboarding plan is ready. Explore styles before you connect Shopify.")) : setStep(value => value + 1)} className="primary-button">{step === onboarding.length - 1 ? "Finish guide" : current.action}<ArrowRight className="h-4 w-4" /></button></div></div></div>}
    {overlay === "review" && <div className="w-full max-w-2xl rounded-3xl border border-stone-200 bg-[#fffdf9] p-6 shadow-[0_30px_90px_rgba(41,37,31,.24)] sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Review changes</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Refine before release.</h2></div><button onClick={close} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100" aria-label="Close review"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-xs font-semibold text-stone-700">Brand &amp; theme summary</p><ul className="mt-3 space-y-2 text-sm text-stone-600"><li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#466858]" />{review.theme} token system</li><li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#466858]" />{review.brandName} · {review.treatment} treatment</li><li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#466858]" />Colors, forms, and primary action styling</li></ul></div><div className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-xs font-semibold text-stone-700">{review.funnel} funnel intent</p><ul className="mt-3 space-y-2 text-sm text-stone-600"><li><b>Contact</b> — trust and brand signature</li><li><b>Shipping</b> — delivery confidence</li><li><b>Payment</b> — secure reassurance</li><li><b>Confirmation</b> — order care, when supported</li></ul></div></div><div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950"><div className="flex items-center gap-2 font-semibold"><CircleDashed className="h-4 w-4" />Capability outcomes &amp; safe alternatives</div><p className="mt-1"><b>Logo placement:</b> not yet verified — preview approved lockups. <b>Extension targets:</b> not yet verified — configure representative copy. <b>Payment order and customer fields:</b> unavailable — keep Shopify logic unchanged.</p></div><div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><div className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4" />Live publish is unavailable</div><p className="mt-1">Connect and authorize a Shopify store first. Checkout Studio will verify the profile, plan, supported fields, and extension targets again before it enables confirmation.</p></div><div className="mt-6 flex justify-end gap-2"><button onClick={close} className="quiet-button">Keep editing</button><button onClick={() => toast.info("Shopify connection is required before this confirmation can be enabled.")} className="primary-button opacity-60"><Lock className="h-4 w-4" />Apply when connected</button></div></div>}
    {overlay === "rollback" && <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-[#fffdf9] p-6 shadow-[0_30px_90px_rgba(41,37,31,.24)] sm:p-7"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-stone-100 text-[#6556d9]"><RefreshCcw className="h-5 w-5" /></div><div><p className="eyebrow">Restore stable version</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Return with confidence.</h2></div></div><button onClick={close} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100" aria-label="Close rollback"><X className="h-4 w-4" /></button></div><p className="mt-5 text-sm leading-6 text-stone-500">Restoring a stable version replaces the currently active supported checkout configuration with the saved token snapshot. The change would be recorded in the audit trail.</p><div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />Connection required</div><p className="mt-1">No live checkout configuration will change until Shopify installation, capability checks, and final confirmation are available.</p></div><div className="mt-6 flex justify-end gap-2"><button onClick={close} className="quiet-button">Cancel</button><button onClick={() => toast.info("Restore is available after Shopify capability validation.")} className="primary-button opacity-60"><Lock className="h-4 w-4" />Restore when connected</button></div></div>}
  </div>;
}
