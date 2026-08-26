(() => {
  "use strict";
  const runtime = window.ConvertPop || {};
  if (!runtime.configUrl || !runtime.eventUrl || document.documentElement.dataset.convertpopLoaded) return;
  document.documentElement.dataset.convertpopLoaded = "true";

  const visitorKey = "convertpop:visitor";
  const visitorId = localStorage.getItem(visitorKey) || crypto.randomUUID();
  localStorage.setItem(visitorKey, visitorId);
  const escaped = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const isMobile = matchMedia("(max-width: 749px)").matches;

  function targets(campaign) {
    const rule = campaign.targeting || {};
    const paths = Array.isArray(rule.paths) ? rule.paths : [];
    if (paths.length && !paths.some((path) => location.pathname.startsWith(path))) return false;
    if (rule.device === "mobile" && !isMobile) return false;
    if (rule.device === "desktop" && isMobile) return false;
    if (rule.visitor === "returning" && !localStorage.getItem("convertpop:returning")) return false;
    return true;
  }

  function emitImpression(campaignId) {
    fetch(runtime.eventUrl, {
      method: "POST", credentials: "same-origin", keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "impression", campaignId, visitorId }),
    }).catch(() => {});
  }

  async function cartSubtotal() {
    const cart = await fetch("/cart.js", { credentials: "same-origin" }).then((response) => response.ok ? response.json() : null).catch(() => null);
    return (cart?.total_price || 0) / 100;
  }

  function installCartChangeObserver() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const target = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      if (/\/cart\/(add|change|update|clear)(\.js)?(?:\?|$)/.test(target)) {
        Promise.resolve().then(() => document.dispatchEvent(new CustomEvent("cart:updated")));
      }
      return response;
    };
  }

  function mountBar(campaign) {
    const content = campaign.content || {};
    const node = document.createElement("section");
    node.className = "convertpop-bar";
    node.style.cssText = `position:${content.sticky ? "sticky" : "relative"};top:0;z-index:2147483646;background:${content.background || "#1a1a1a"};color:${content.color || "#ffffff"};padding:10px 16px;text-align:center;font:500 14px/1.4 system-ui,sans-serif;`;
    const text = document.createElement("span");
    node.append(text);
    if (content.dismissible) {
      const close = document.createElement("button");
      close.type = "button"; close.setAttribute("aria-label", "Dismiss announcement"); close.textContent = "×";
      close.style.cssText = "float:right;border:0;background:transparent;color:inherit;font-size:20px;cursor:pointer";
      close.onclick = () => { sessionStorage.setItem(`convertpop:dismissed:${campaign.id}`, "1"); node.remove(); };
      node.append(close);
    }
    if (content.freeShippingThreshold) {
      cartSubtotal().then((subtotal) => {
        const remaining = Math.max(0, Number(content.freeShippingThreshold) - subtotal);
        text.textContent = remaining ? `Add ${new Intl.NumberFormat(undefined, { style: "currency", currency: runtime.currency || "USD" }).format(remaining)} more for free shipping.` : (content.successMessage || "You qualify for free shipping.");
      });
      document.addEventListener("cart:updated", () => cartSubtotal().then((subtotal) => { const remaining = Math.max(0, Number(content.freeShippingThreshold) - subtotal); text.textContent = remaining ? `Add ${new Intl.NumberFormat(undefined, { style: "currency", currency: runtime.currency || "USD" }).format(remaining)} more for free shipping.` : (content.successMessage || "You qualify for free shipping."); }));
    } else text.textContent = content.message || "";
    document.body.prepend(node);
    emitImpression(campaign.id);
  }

  function mountPopup(campaign) {
    const content = campaign.content || {};
    const node = document.createElement("dialog");
    node.className = "convertpop-popup";
    node.setAttribute("aria-label", content.heading || "Store offer");
    node.innerHTML = `<form method="dialog" style="min-width:min(92vw,420px);padding:24px;font:400 15px/1.5 system-ui,sans-serif"><button aria-label="Close" style="float:right;border:0;background:none;font-size:20px;cursor:pointer">×</button><h2 style="margin:0 32px 8px 0">${escaped(content.heading || "A little something for you")}</h2><p>${escaped(content.body || "Sign up to receive merchant-approved updates.")}</p><label style="display:block">Email<input type="email" required name="email" style="box-sizing:border-box;width:100%;padding:10px;margin:6px 0 10px" /></label><label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" required /> <span>${escaped(content.consent || "I agree to receive marketing communications. I can unsubscribe at any time.")}</span></label><button value="submit" style="margin-top:14px;padding:10px 14px;border:0;border-radius:6px;background:#2c6ecb;color:#fff;cursor:pointer">${escaped(content.cta || "Continue")}</button></form>`;
    document.body.append(node); node.showModal(); emitImpression(campaign.id);
  }

  function mountCod(campaign) {
    const content = campaign.content || {};
    const dialog = document.createElement("dialog");
    dialog.setAttribute("aria-label", content.heading || "Cash on delivery confirmation");
    dialog.innerHTML = `<form id="convertpop-cod-form" style="min-width:min(92vw,480px);padding:24px;font:400 15px/1.5 system-ui,sans-serif"><button type="button" aria-label="Close" data-close style="float:right;border:0;background:none;font-size:20px;cursor:pointer">×</button><h2>${escaped(content.heading || "Confirm your cash on delivery order")}</h2><p>${escaped(content.body || "Verify your phone number to confirm this order.")}</p><label>Full name<input required name="fullName" style="box-sizing:border-box;width:100%;padding:10px;margin:6px 0 10px" /></label><label>Phone number<input required name="phone" placeholder="+15551234567" inputmode="tel" style="box-sizing:border-box;width:100%;padding:10px;margin:6px 0 10px" /></label><label>Address<input required name="address1" style="box-sizing:border-box;width:100%;padding:10px;margin:6px 0 10px" /></label><label>City<input required name="city" style="box-sizing:border-box;width:100%;padding:10px;margin:6px 0 10px" /></label><label>Postal code<input name="postalCode" style="box-sizing:border-box;width:100%;padding:10px;margin:6px 0 10px" /></label><label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" required /> <span>${escaped(content.consent || "I consent to processing my contact details to verify this COD order.")}</span></label><button style="margin-top:14px;padding:10px 14px;border:0;border-radius:6px;background:#2c6ecb;color:#fff;cursor:pointer">Send verification code</button><p aria-live="polite" data-status></p></form>`;
    document.body.append(dialog); dialog.showModal(); emitImpression(campaign.id);
    dialog.querySelector("[data-close]").onclick = () => dialog.close();
    const form = dialog.querySelector("#convertpop-cod-form"); const status = dialog.querySelector("[data-status]");
    form.onsubmit = async (event) => {
      event.preventDefault(); const values = Object.fromEntries(new FormData(form)); status.textContent = "Sending verification code…";
      const cart = await fetch("/cart.js", { credentials: "same-origin" }).then((response) => response.json()).catch(() => null);
      const items = (cart?.items || []).map((item) => ({ variantId: item.variant_id, quantity: item.quantity }));
      const response = await fetch(runtime.configUrl.replace(/config$/, "cod-start"), { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, items }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.submissionId) { status.textContent = "We could not send a verification code. Please try again later."; return; }
      form.innerHTML = `<label>Verification code<input required name="code" inputmode="numeric" autocomplete="one-time-code" style="box-sizing:border-box;width:100%;padding:10px;margin:6px 0 10px" /></label><button style="margin-top:14px;padding:10px 14px;border:0;border-radius:6px;background:#2c6ecb;color:#fff;cursor:pointer">Confirm order</button><p aria-live="polite" data-status></p>`;
      const verificationStatus = form.querySelector("[data-status]");
      form.onsubmit = async (verifyEvent) => { verifyEvent.preventDefault(); verificationStatus.textContent = "Confirming your order…"; const code = new FormData(form).get("code"); const verify = await fetch(runtime.configUrl.replace(/config$/, "cod-verify"), { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submissionId: result.submissionId, code }) }); const verified = await verify.json().catch(() => ({})); verificationStatus.textContent = verified.verified ? "Your order is confirmed." : "We could not verify that code. Please try again."; };
    };
  }

  function render(campaign) {
    if (sessionStorage.getItem(`convertpop:dismissed:${campaign.id}`) || !targets(campaign)) return;
    const delay = Math.max(0, Number(campaign.schedule?.delaySeconds || 0)) * 1000;
    setTimeout(() => { if (campaign.kind === "ANNOUNCEMENT_BAR") mountBar(campaign); if (campaign.kind === "POPUP") mountPopup(campaign); if (campaign.kind === "COD_FORM") mountCod(campaign); }, delay);
  }

  installCartChangeObserver();
  fetch(runtime.configUrl, { credentials: "same-origin" }).then((response) => response.ok ? response.json() : { campaigns: [] }).then((payload) => {
    localStorage.setItem("convertpop:returning", "1");
    (payload.campaigns || []).forEach(render);
  }).catch(() => {});
})();
