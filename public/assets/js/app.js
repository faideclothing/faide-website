(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function clickOnEnterSpace(el, fn) {
    if (!el) return;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn(e);
      }
    });
  }

  const defaultConfig = {
    brand_name: "FAIDE",
    hero_title: "NEW DROP",
    hero_description: "New drops, exclusive releases, and updates are announced on our social platforms.",
    about_headline: "About FAIDE",
    about_description:
      "FAIDE is a luxury streetwear brand built for those who move in silence. Designed with intention. Worn with purpose.",
    background_color: "#000000",
    surface_color: "#111111",
    text_color: "#ffffff",
    primary_accent: "#a855f7",
    secondary_accent: "#9333ea",
    font_family: "Inter",
    font_size: 16
  };

  function setCSSVar(name, value) {
    if (!value) return;
    document.documentElement.style.setProperty(name, value);
  }

  async function onConfigChange(config) {
    const heroTitle = config.hero_title || defaultConfig.hero_title;
    const heroDescription = config.hero_description || defaultConfig.hero_description;
    const aboutHeadline = config.about_headline || defaultConfig.about_headline;
    const aboutDescription = config.about_description || defaultConfig.about_description;

    const heroTitleEl = $("hero-title");
    const heroDescEl = $("hero-description");
    if (heroTitleEl) heroTitleEl.textContent = heroTitle;
    if (heroDescEl) heroDescEl.textContent = heroDescription;

    const aboutTitleEl = $("about-title");
    const aboutDescEl = $("about-description");
    if (aboutTitleEl) aboutTitleEl.textContent = aboutHeadline;
    if (aboutDescEl) aboutDescEl.textContent = aboutDescription;

    setCSSVar("--bg", config.background_color || defaultConfig.background_color);
    setCSSVar("--surface", config.surface_color || defaultConfig.surface_color);
    setCSSVar("--text", config.text_color || defaultConfig.text_color);
    setCSSVar("--primary", config.primary_accent || defaultConfig.primary_accent);
    setCSSVar("--secondary", config.secondary_accent || defaultConfig.secondary_accent);

    const customFont = config.font_family || defaultConfig.font_family;
    document.body.style.fontFamily = `${customFont}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  }

  function mapToCapabilities(config) {
    return {
      recolorables: [
        { get: () => config.background_color || defaultConfig.background_color, set: (v) => window.elementSdk?.setConfig?.({ background_color: (config.background_color = v) }) },
        { get: () => config.surface_color || defaultConfig.surface_color, set: (v) => window.elementSdk?.setConfig?.({ surface_color: (config.surface_color = v) }) },
        { get: () => config.text_color || defaultConfig.text_color, set: (v) => window.elementSdk?.setConfig?.({ text_color: (config.text_color = v) }) },
        { get: () => config.primary_accent || defaultConfig.primary_accent, set: (v) => window.elementSdk?.setConfig?.({ primary_accent: (config.primary_accent = v) }) },
        { get: () => config.secondary_accent || defaultConfig.secondary_accent, set: (v) => window.elementSdk?.setConfig?.({ secondary_accent: (config.secondary_accent = v) }) }
      ],
      borderables: [],
      fontEditable: { get: () => config.font_family || defaultConfig.font_family, set: (v) => window.elementSdk?.setConfig?.({ font_family: (config.font_family = v) }) },
      fontSizeable: { get: () => config.font_size || defaultConfig.font_size, set: (v) => window.elementSdk?.setConfig?.({ font_size: (config.font_size = v) }) }
    };
  }

  function mapToEditPanelValues(config) {
    return new Map([
      ["brand_name", config.brand_name || defaultConfig.brand_name],
      ["hero_title", config.hero_title || defaultConfig.hero_title],
      ["hero_description", config.hero_description || defaultConfig.hero_description],
      ["about_headline", config.about_headline || defaultConfig.about_headline],
      ["about_description", config.about_description || defaultConfig.about_description]
    ]);
  }

  async function waitForElementSdk(timeoutMs = 2500) {
    const start = Date.now();
    while (!window.elementSdk) {
      if (Date.now() - start > timeoutMs) return false;
      await new Promise((r) => setTimeout(r, 50));
    }
    return true;
  }

  (async () => {
    const ready = await waitForElementSdk();
    if (ready) window.elementSdk.init({ defaultConfig, onConfigChange, mapToCapabilities, mapToEditPanelValues });
    else onConfigChange({ ...defaultConfig });
  })();

  function parseCatalogJson(raw) {
    return JSON.parse(raw);
  }

  async function loadCatalog() {
    const candidates = [
      new URL("assets/js/products.json", window.location.href).toString(),
      `${window.location.origin}/assets/js/products.json`,
      new URL("src/data/products.json", window.location.href).toString(),
      `${window.location.origin}/src/data/products.json`
    ];

    const errors = [];

    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          errors.push(`${url} -> HTTP ${res.status}`);
          continue;
        }

        const raw = await res.text();
        const data = parseCatalogJson(raw);
        if (!data || !Array.isArray(data.products)) {
          errors.push(`${url} -> invalid catalog shape`);
          continue;
        }
        return data;
      } catch (err) {
        errors.push(`${url} -> ${err?.message || String(err)}`);
      }
    }

    throw new Error(`Unable to load catalog. Tried: ${errors.join(" | ")}`);
  }

  function optimizeImageLoading() {
    const images = Array.from(document.querySelectorAll("img"));
    images.forEach((img, index) => {
      if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
      if (img.id === "brand-wordmark") return;
      const isPriority = img.closest(".hero") || index < 6;
      if (isPriority) {
        img.setAttribute("fetchpriority", "high");
        if (!img.hasAttribute("loading")) img.setAttribute("loading", "eager");
      } else if (!img.hasAttribute("loading")) {
        img.setAttribute("loading", "lazy");
      }
    });
  }

  function getNavOffsetPx() {
    const nav = document.querySelector(".navbar");
    const strip = document.querySelector(".shipping-strip");
    if (!nav) return 12;
    const navStyle = window.getComputedStyle(nav);
    const stripStyle = strip ? window.getComputedStyle(strip) : null;
    const navFixed = navStyle.position === "fixed" || navStyle.position === "sticky";
    const stripFixed = stripStyle && (stripStyle.position === "fixed" || stripStyle.position === "sticky");
    if (!navFixed && !stripFixed) return 12;
    const navH = nav.getBoundingClientRect().height || 0;
    const stripH = strip ? strip.getBoundingClientRect().height || 0 : 0;
    return Math.round(navH + stripH + 14);
  }

  function scrollToSectionId(id, behavior = "smooth") {
    const el = document.getElementById(id);
    if (!el) return;
    const safeBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : behavior;
    const top = el.getBoundingClientRect().top + window.pageYOffset - getNavOffsetPx();
    window.scrollTo({ top, behavior: safeBehavior });
  }

  function toQueryUrl(params) {
    const url = new URL(window.location.href);
    url.hash = "";
    Object.keys(params).forEach((k) => {
      if (params[k] == null || params[k] === "") url.searchParams.delete(k);
      else url.searchParams.set(k, String(params[k]));
    });
    const qs = url.searchParams.toString();
    return qs ? `${url.pathname}?${qs}` : url.pathname;
  }

  function navigateTo(params, { replace = false } = {}) {
    const target = toQueryUrl(params);
    if (replace) history.replaceState(params, "", target);
    else history.pushState(params, "", target);
    window.dispatchEvent(new CustomEvent("faide:navigate"));
  }

  function gotoLookbook(i, options) {
    navigateTo({ page: "lookbook", i }, options);
  }

  function gotoProduct(id, options) {
    navigateTo({ page: "product", id }, options);
  }

  function gotoHomeSection(id = "drop", { replace = false } = {}) {
    const target = `${window.location.pathname}#${id}`;
    if (replace) history.replaceState({}, "", target);
    else history.pushState({}, "", target);
    window.dispatchEvent(new CustomEvent("faide:navigate"));
  }

  function showRoute(page) {
    const site = $("site-content");
    const rlb = $("route-lookbook");
    const rpp = $("route-product");

    rlb?.classList.remove("active");
    rpp?.classList.remove("active");
    rlb?.setAttribute("aria-hidden", "true");
    rpp?.setAttribute("aria-hidden", "true");
    if (site) site.style.display = "block";

    if (page === "lookbook") {
      if (site) site.style.display = "none";
      rlb?.classList.add("active");
      rlb?.setAttribute("aria-hidden", "false");
      document.body.classList.add("route-open");
      return;
    }
    if (page === "product") {
      if (site) site.style.display = "none";
      rpp?.classList.add("active");
      rpp?.setAttribute("aria-hidden", "false");
      document.body.classList.add("route-open");
      return;
    }
    document.body.classList.remove("route-open");
  }

  function normalizeStr(s) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  }

  function applyShopSearch(term) {
    const q = normalizeStr(term);
    const shopEl = $("shop-products");
    if (!shopEl) return;

    const cards = Array.from(shopEl.querySelectorAll(".product"));
    let shown = 0;

    cards.forEach((card) => {
      const haystack = normalizeStr(card.textContent);
      const match = !q || haystack.includes(q);
      card.style.display = match ? "" : "none";
      if (match) shown += 1;
    });

    let empty = $("shop-search-empty");
    if (!q) {
      empty?.remove();
      return;
    }

    if (shown === 0 && !empty) {
      empty = document.createElement("div");
      empty.id = "shop-search-empty";
      empty.className = "shop-search-empty";
      empty.textContent = "No products found.";
      shopEl.parentElement?.appendChild(empty);
    } else if (shown > 0) {
      empty?.remove();
    }
  }

  function setupQtyStepper(rootEl, { onChange } = {}) {
    const valueEl = rootEl.querySelector("[data-qty-value]");
    const incBtn = rootEl.querySelector('[data-qty-btn="inc"]');
    const decBtn = rootEl.querySelector('[data-qty-btn="dec"]');
    if (!valueEl || !incBtn || !decBtn) return null;

    let qty = 1;
    const render = () => {
      valueEl.textContent = String(qty);
      onChange?.(qty);
    };
    const setQty = (next) => {
      qty = Math.max(1, next);
      render();
    };
    const step = (dir) => setQty(qty + dir);

    [
      [incBtn, 1],
      [decBtn, -1]
    ].forEach(([btn, dir]) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        step(dir);
      });
    });

    render();
    return { getQty: () => qty, setQty };
  }

  const CART_STORAGE_KEY = "faide_cart_v3";
  const CHECKOUT_PROFILE_KEY = "faide_checkout_profile_v1";
  const SIGNUP_KEY = "faide_signup_v2";
  const AUTH_KEY = "faide_auth_v1";
  const USERS_KEY = "faide_users_v1";

  function loadJsonStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJsonStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function showCartToast(message) {
    const toast = $("cartToast");
    const messageEl = $("cartMessage");
    if (!toast || !messageEl) return;
    messageEl.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
  const overlayHistory = [];
  const overlayRegistry = new Map();

  function setNavHidden(hidden) {
    document.body.classList.toggle("nav-hidden", !!hidden);
  }

  function refreshPageLocks() {
    const hasBlockingLayer = Array.from(overlayRegistry.values()).some((entry) => entry.isOpen());
    document.body.classList.toggle("lock-scroll", hasBlockingLayer);
    setNavHidden(hasBlockingLayer);
  }

  function registerOverlay(name, api) {
    overlayRegistry.set(name, api);
  }

  function openOverlay(name) {
    if (overlayRegistry.get(name)?.isOpen()) return;
    overlayRegistry.get(name)?.open();
    overlayHistory.push(name);
    history.pushState({ __faideOverlay: name }, "");
    refreshPageLocks();
  }

  function closeOverlay(name, { fromPop = false } = {}) {
    if (!overlayRegistry.get(name)?.isOpen()) return false;
    overlayRegistry.get(name)?.close();
    const index = overlayHistory.lastIndexOf(name);
    if (index >= 0) overlayHistory.splice(index, 1);
    refreshPageLocks();
    if (!fromPop && history.state?.__faideOverlay === name) {
      history.back();
    }
    return true;
  }

  function closeTopOverlayFromPop() {
    const name = overlayHistory[overlayHistory.length - 1];
    if (!name) return false;
    return closeOverlay(name, { fromPop: true });
  }

  function formatPriceZAR(price) {
    return `R${Number(price || 0).toFixed(2)}`;
  }

  function productIsAvailable(product, settings) {
    const mode = String(settings?.inventoryMode || "in_stock").toLowerCase();
    const globalOut = mode === "out_of_stock";
    const raw = product?.inStock;
    const normalized = typeof raw === "string" ? raw.toLowerCase() : raw;
    const productOut = normalized === false || normalized === "false" || normalized === "0";
    return !globalOut && !productOut;
  }

  function stockMessage(product, settings) {
    return productIsAvailable(product, settings)
      ? (product?.stockNote || settings?.stockMessage || "In stock")
      : (product?.outOfStockMessage || settings?.outOfStockMessage || "Out of stock");
  }

  function preloadImage(src, priority = "auto") {
    if (!src) return;
    const img = new Image();
    if (priority === "high") img.fetchPriority = "high";
    img.decoding = "async";
    img.src = src;
  }

  function preloadImageSet(urls = [], priority = "auto") {
    urls.filter(Boolean).forEach((url) => preloadImage(url, priority));
  }

  function updateMetaTag(selector, attr, value) {
    const el = document.querySelector(selector);
    if (el && value) el.setAttribute(attr, value);
  }

  function updateSeoForProduct(product) {
    if (!product) return;
    const title = `FAIDE | ${product.name}`;
    const description = `${product.name} by FAIDE. ${product.category}. ${stockMessage(product, catalog.settings)}.`;
    document.title = title;
    updateMetaTag('meta[name="description"]', "content", description);
    updateMetaTag('meta[property="og:title"]', "content", title);
    updateMetaTag('meta[property="og:description"]', "content", description);
    updateMetaTag('meta[name="twitter:title"]', "content", title);
    updateMetaTag('meta[name="twitter:description"]', "content", description);
    const image = new URL(product.images?.[0] || "images/hero.png", window.location.origin + window.location.pathname).toString();
    updateMetaTag('meta[property="og:image"]', "content", image);
    updateMetaTag('meta[name="twitter:image"]', "content", image);
    updateMetaTag('link[rel="canonical"]', "href", `https://faide.store/${window.location.search || ""}`.replace(/\/$/, ""));

    const schemaEl = $("dynamic-schema");
    if (schemaEl) {
      schemaEl.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: product.images?.map((img) => `https://faide.store/${img}`),
        description,
        brand: { "@type": "Brand", name: "FAIDE" },
        offers: {
          "@type": "Offer",
          priceCurrency: "ZAR",
          price: Number(product.price || 0).toFixed(2),
          availability: productIsAvailable(product, catalog.settings)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: `https://faide.store/?page=product&id=${product.id}`
        }
      });
    }
  }

  function resetSeoToDefault() {
    document.title = "FAIDE | Luxury Streetwear Brand";
    updateMetaTag('meta[name="description"]', "content", "FAIDE luxury streetwear. New drops, exclusive releases, and curated essentials. Designed with intention. Worn with purpose.");
    updateMetaTag('meta[property="og:title"]', "content", "FAIDE | Luxury Streetwear Brand");
    updateMetaTag('meta[property="og:description"]', "content", "Luxury streetwear designed with intention. New drops, exclusive releases, and curated essentials.");
    updateMetaTag('meta[name="twitter:title"]', "content", "FAIDE | Luxury Streetwear Brand");
    updateMetaTag('meta[name="twitter:description"]', "content", "Luxury streetwear designed with intention. New drops, exclusive releases, and curated essentials.");
    updateMetaTag('meta[property="og:image"]', "content", "https://faide.store/images/hero.png");
    updateMetaTag('meta[name="twitter:image"]', "content", "https://faide.store/images/hero.png");
    updateMetaTag('link[rel="canonical"]', "href", "https://faide.store/");
    const schemaEl = $("dynamic-schema");
    if (schemaEl) schemaEl.textContent = "";
  }

  function initPolicies() {
    const policyModal = $("policy-modal");
    const modalTitle = $("modal-title");
    const modalContent = $("modal-content");
    const policies = {
      privacy: {
        title: "Privacy Policy",
        content: `
          <p style="margin-bottom:14px;"><strong>FAIDE Privacy Policy</strong></p>
          <p style="margin-bottom:14px;">We respect your privacy. This policy explains what information we collect, why we collect it, and how we use it.</p>
          <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">What we collect</h3>
          <ul style="margin-left:18px; margin-bottom:14px;">
            <li>Contact details you provide (name, phone number, email).</li>
            <li>Order details (items, size, color, quantity, delivery address).</li>
            <li>Basic site analytics (to improve performance and experience).</li>
          </ul>
          <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">How we use it</h3>
          <ul style="margin-left:18px; margin-bottom:14px;">
            <li>To process and fulfill your order.</li>
            <li>To communicate about your order (shipping updates, questions).</li>
            <li>To improve the website and product experience.</li>
          </ul>
          <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Your choices</h3>
          <p style="margin-bottom:14px;">You can request to update or delete your information by contacting us at <a style="color:var(--primary); text-decoration:none;" href="mailto:faideclothingsa@gmail.com">faideclothingsa@gmail.com</a>.</p>
        `
      },
      terms: {
        title: "Terms of Service",
        content: `
          <p style="margin-bottom:14px;"><strong>FAIDE Terms of Service</strong></p>
          <p style="margin-bottom:14px;">By using this website, you agree to the terms below.</p>
          <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Orders</h3>
          <ul style="margin-left:18px; margin-bottom:14px;">
            <li>Card checkout will be enabled soon.</li>
            <li>We may contact you for size/color confirmation when checkout is live.</li>
          </ul>
          <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Pricing</h3>
          <p style="margin-bottom:14px;">Prices are listed in ZAR (R). We reserve the right to correct errors and update pricing.</p>
          <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Availability</h3>
          <p style="margin-bottom:14px;">Stock availability may change.</p>
        `
      },
      returns: {
        title: "Returns & Exchanges",
        content: `
          <p style="margin-bottom:14px;"><strong>Returns & Exchanges</strong></p>
          <p style="margin-bottom:14px;">If something isn’t right, we’ll work with you.</p>
          <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Eligibility</h3>
          <ul style="margin-left:18px; margin-bottom:14px;">
            <li>Items must be unworn, unwashed, and in original condition.</li>
            <li>Request must be made within 7 days of delivery.</li>
          </ul>
          <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Exchanges</h3>
          <p style="margin-bottom:14px;">Size exchanges are accepted if stock is available.</p>
        `
      },
      shipping: {
        title: "Shipping Policy",
        content: `
          <p style="margin-bottom:14px;"><strong>Shipping Policy</strong></p>
          <p style="margin-bottom:14px;">We ship orders within South Africa. Delivery times depend on your location.</p>
          <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Processing time</h3>
          <p style="margin-bottom:14px;">Orders are typically processed within 1–3 business days after confirmation.</p>
          <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Delivery</h3>
          <ul style="margin-left:18px; margin-bottom:14px;">
            <li>Estimated delivery: 2–7 business days (varies by region).</li>
            <li>Tracking may be provided depending on courier service.</li>
          </ul>
        `
      }
    };

    registerOverlay("policy", {
      isOpen: () => policyModal?.style.display === "flex",
      open: () => {
        if (policyModal) policyModal.style.display = "flex";
      },
      close: () => {
        if (policyModal) policyModal.style.display = "none";
      }
    });

    [
      ["privacy-link", "privacy"],
      ["terms-link", "terms"],
      ["returns-link", "returns"],
      ["shipping-link", "shipping"]
    ].forEach(([id, key]) => {
      $(id)?.addEventListener("click", (e) => {
        e.preventDefault();
        modalTitle.textContent = policies[key].title;
        modalContent.innerHTML = policies[key].content;
        openOverlay("policy");
      });
    });

    $("close-modal")?.addEventListener("click", () => closeOverlay("policy"));
    policyModal?.addEventListener("click", (e) => {
      if (e.target === policyModal) closeOverlay("policy");
    });
  }

  function initCheckoutModal(getCartTotals) {
    const overlay = $("checkout-modal");
    const nameEl = $("co-name");
    const emailEl = $("co-email");
    const phoneEl = $("co-phone");
    const cityEl = $("co-city");

    registerOverlay("checkout", {
      isOpen: () => overlay?.style.display === "flex",
      open: () => {
        const { itemCount, total } = getCartTotals();
        $("checkout-items-count").textContent = String(itemCount);
        $("checkout-total").textContent = total.toFixed(2);
        const profile = loadJsonStorage(CHECKOUT_PROFILE_KEY, null);
        const auth = loadJsonStorage(AUTH_KEY, null);
        if (profile) {
          if (nameEl) nameEl.value = profile.name || "";
          if (emailEl) emailEl.value = profile.email || auth?.email || "";
          if (phoneEl) phoneEl.value = profile.phone || "";
          if (cityEl) cityEl.value = profile.city || "";
        } else if (auth?.email && emailEl) {
          emailEl.value = auth.email;
        }
        if (overlay) overlay.style.display = "flex";
        setTimeout(() => emailEl?.focus(), 30);
      },
      close: () => {
        if (overlay) overlay.style.display = "none";
      }
    });

    ["checkout-close", "checkout-close-2"].forEach((id) => $(id)?.addEventListener("click", () => closeOverlay("checkout")));
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) closeOverlay("checkout");
    });

    $("co-submit")?.addEventListener("click", () => {
      const profile = {
        name: nameEl?.value?.trim() || "",
        email: emailEl?.value?.trim() || "",
        phone: phoneEl?.value?.trim() || "",
        city: cityEl?.value?.trim() || ""
      };
      if (!profile.email) return showCartToast("Please enter an email.");
      saveJsonStorage(CHECKOUT_PROFILE_KEY, profile);
      showCartToast("Details saved for faster secure checkout.");
      closeOverlay("checkout");
    });
  }

  function initAuthModal({ onAuthChange } = {}) {
    const overlay = $("signup-modal");
    const title = $("signup-title");
    const text = overlay?.querySelector(".signup-text");
    const email = $("su-email");
    const password = $("su-password");
    const submit = $("su-submit");
    const switchBtn = $("auth-switch-mode");
    const note = overlay?.querySelector(".signup-note");
    let mode = "signup";

    function setMode(nextMode) {
      mode = nextMode;
      const login = mode === "login";
      if (title) title.textContent = login ? "Log in to FAIDE" : "Join FAIDE";
      if (text) text.textContent = login
        ? "Log in for saved details, faster checkout, and member drop updates on this device."
        : "Enter your details to get exclusive updates, early access, and drop alerts.";
      if (submit) submit.textContent = login ? "Log In" : "Sign Up";
      if (switchBtn) switchBtn.textContent = login ? "Need an account? Sign up" : "Already joined? Log in";
      if (note) note.textContent = login ? "Local device login only for now." : "Drop alerts only. No spam.";
      if (password) password.placeholder = login ? "Password" : "Create a password";
    }

    registerOverlay("auth", {
      isOpen: () => overlay?.style.display === "flex",
      open: () => {
        if (overlay) overlay.style.display = "flex";
        setTimeout(() => email?.focus(), 30);
      },
      close: () => {
        if (overlay) overlay.style.display = "none";
      }
    });

    $("signup-close")?.addEventListener("click", () => closeOverlay("auth"));
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) closeOverlay("auth");
    });
    switchBtn?.addEventListener("click", () => setMode(mode === "login" ? "signup" : "login"));

    [email, password].forEach((field) => {
      field?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit?.click();
        }
      });
    });

    submit?.addEventListener("click", () => {
      const userEmail = email?.value?.trim() || "";
      const userPassword = password?.value?.trim() || "";
      if (!userEmail.includes("@") || userPassword.length < 6) {
        showCartToast("Enter a valid email and at least 6 characters.");
        return;
      }
      const users = loadJsonStorage(USERS_KEY, []);
      if (mode === "signup") {
        if (users.some((u) => u.email.toLowerCase() === userEmail.toLowerCase())) {
          showCartToast("Email already registered. Log in instead.");
          return;
        }
        users.push({ email: userEmail, password: userPassword, ts: Date.now() });
        saveJsonStorage(USERS_KEY, users);
        saveJsonStorage(SIGNUP_KEY, { email: userEmail, ts: Date.now() });
        saveJsonStorage(AUTH_KEY, { email: userEmail, ts: Date.now() });
        showCartToast("You’re in. Account saved on this device.");
      } else {
        const match = users.find((u) => u.email.toLowerCase() === userEmail.toLowerCase() && u.password === userPassword);
        if (!match) {
          showCartToast("Account not found. Check details or sign up.");
          return;
        }
        saveJsonStorage(AUTH_KEY, { email: userEmail, ts: Date.now() });
        showCartToast("Welcome back to FAIDE.");
      }
      closeOverlay("auth");
      onAuthChange?.();
    });

    return {
      openSignup: () => {
        setMode("signup");
        openOverlay("auth");
      },
      openLogin: () => {
        setMode("login");
        openOverlay("auth");
      }
    };
  }

  let catalog = { settings: {}, lookbook: [], products: [] };

  function renderLookbook(listEl, lookbookItems) {
    if (!listEl) return;
    listEl.innerHTML = "";
    lookbookItems.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "lookbook-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `Open lookbook image ${item.id}`);
      card.innerHTML = `<img src="${item.image}" alt="${item.alt || "Lookbook"}" class="lookbook-img" loading="${index === 0 ? "eager" : "lazy"}" decoding="async" ${index === 0 ? 'fetchpriority="high"' : ""} />`;
      const go = () => gotoLookbook(String(item.id));
      card.addEventListener("click", go);
      clickOnEnterSpace(card, go);
      listEl.appendChild(card);
    });
  }

  function renderShop(shopEl, products, settings) {
    if (!shopEl) return;
    shopEl.innerHTML = "";

    products.forEach((p, index) => {
      const available = productIsAvailable(p, settings);
      const card = document.createElement("article");
      card.className = `product${available ? "" : " product-out"}`;
      card.setAttribute("data-product-id", p.id);
      card.setAttribute("itemscope", "");
      card.setAttribute("itemtype", "https://schema.org/Product");

      const sizesHtml = (p.sizes || ["S", "M", "L", "XL"]).map((s) => `<button type="button" class="size-btn" data-size="${s}">${s}</button>`).join("");
      const colorsHtml = (p.colors || []).map((c) => `<div class="${c.className}" role="button" tabindex="0" aria-label="${c.name}" data-color="${c.name}"></div>`).join("");

      card.innerHTML = `
        <meta itemprop="name" content="${p.name}" />
        <meta itemprop="description" content="${p.category}" />
        <div class="product-img-container">
          <img src="${(p.images && p.images[0]) || ""}" alt="${p.name}" class="product-img" itemprop="image" loading="${index < 2 ? "eager" : "lazy"}" decoding="async" ${index === 0 ? 'fetchpriority="high"' : ""} />
          <div class="product-stock-pill${available ? " in-stock" : " out-of-stock"}">${stockMessage(p, settings)}</div>
        </div>
        <div class="product-info">
          <div class="product-label-row">
            <div class="product-label">${p.label || "New"}</div>
            
          </div>
          <div class="product-header">
            <div class="product-name-wrapper">
              <h3 itemprop="name">${p.name}</h3>
              <div class="product-category">${p.category || ""}</div>
              <div class="product-colors-count" aria-hidden="true"></div>
            </div>
            <p class="price" itemprop="offers" itemscope itemtype="https://schema.org/Offer"><span itemprop="priceCurrency" content="ZAR"></span><span itemprop="price" content="${Number(p.price || 0).toFixed(2)}">${formatPriceZAR(p.price)}</span></p>
          </div>
          <div class="options" aria-label="Product options">
            <div class="option-label">Select Size</div>
            <div class="sizes">${sizesHtml}</div>
            <div class="option-label">Select Color</div>
            <div class="colors">${colorsHtml}</div>
            <div class="quantity-wrapper">
              <div class="qty-stepper-ui" data-qty-root="card">
                <button type="button" class="qty-btn-ui" data-qty-btn="dec" aria-label="Decrease quantity">−</button>
                <div class="qty-value-ui" data-qty-value>1</div>
                <button type="button" class="qty-btn-ui" data-qty-btn="inc" aria-label="Increase quantity">+</button>
              </div>
            </div>
            <button type="button" class="secondary-btn add-to-cart" ${available ? "" : "disabled data-disabled-reason=\"out-of-stock\""}>${available ? "Add to Bag" : "Sold out"}</button>
          </div>
        </div>`;
      shopEl.appendChild(card);
    });
  }

  function setupMobileShopViewLimit() {
    const cards = Array.from(document.querySelectorAll("#shop-products .product"));
    const viewMoreBtn = $("shop-view-more-btn");
    if (!viewMoreBtn || !cards.length) return;

    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const shouldLimit = mobile && cards.length > 6;

    cards.forEach((card, idx) => {
      card.classList.remove("mobile-card-hidden");
      if (shouldLimit && idx >= 6) card.classList.add("mobile-card-hidden");
    });

    viewMoreBtn.classList.toggle("show", shouldLimit);
    viewMoreBtn.textContent = "View More";
    viewMoreBtn.setAttribute("aria-expanded", "false");

    if (shouldLimit) {
      viewMoreBtn.onclick = () => {
        cards.forEach((card) => card.classList.remove("mobile-card-hidden"));
        viewMoreBtn.classList.remove("show");
        viewMoreBtn.setAttribute("aria-expanded", "true");
      };
    } else {
      viewMoreBtn.onclick = null;
    }
  }

  function initRevealAnimations() {
    const targets = document.querySelectorAll(".lookbook-card, .product, .about, .footer");
    targets.forEach((el) => el.classList.add("reveal-on-scroll"));
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach((el) => observer.observe(el));
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const navbar = document.querySelector(".navbar");
    const navLinks = document.querySelectorAll('[data-nav-link="main"]');
    const menuBtn = $("mobile-menu-btn");
    const navSearchBtn = $("nav-search-btn");
    const navLoginBtn = $("nav-login-btn");
    const drawer = $("mobile-menu-panel");
    const drawerOverlay = $("mobile-drawer-overlay");
    const shopSearchInput = $("shop-search-input");
    const shopSearchClear = $("shop-search-clear");

    function handleShrink() {
      if (!navbar) return;
      navbar.classList.remove("shrink");
    }
    handleShrink();
    let lastScrollY = window.scrollY;
    function handleNavVisibilityOnScroll() {
      const y = window.scrollY;
      const goingDown = y > lastScrollY;
      const shouldHide = goingDown && y > 24;
      document.body.classList.toggle("nav-hidden", shouldHide);
      lastScrollY = y;
    }
    handleNavVisibilityOnScroll();
    window.addEventListener("scroll", handleNavVisibilityOnScroll, { passive: true });

    registerOverlay("drawer", {
      isOpen: () => drawer?.classList.contains("open"),
      open: () => {
        drawer?.classList.add("open");
        drawer?.setAttribute("aria-hidden", "false");
        drawerOverlay?.classList.add("active");
        menuBtn?.setAttribute("aria-expanded", "true");
      },
      close: () => {
        drawer?.classList.remove("open");
        drawer?.setAttribute("aria-hidden", "true");
        drawerOverlay?.classList.remove("active");
        menuBtn?.setAttribute("aria-expanded", "false");
      }
    });

    menuBtn?.addEventListener("click", () => {
      if (drawer?.classList.contains("open")) closeOverlay("drawer");
      else openOverlay("drawer");
    });
    $("drawer-close")?.addEventListener("click", () => closeOverlay("drawer"));
    drawerOverlay?.addEventListener("click", () => closeOverlay("drawer"));
    navLinks.forEach((a) => a.addEventListener("click", (e) => {
      const href = a.getAttribute("href") || "";
      if (href.startsWith("#")) {
        e.preventDefault();
        const sectionId = href.slice(1) || "drop";
        if (activeRoute) gotoHomeSection(sectionId);
        setTimeout(() => scrollToSectionId(sectionId), 20);
      }
      closeOverlay("drawer");
    }));

    document.querySelector('.brand-link')?.addEventListener("click", (e) => {
      e.preventDefault();
      if (activeRoute) gotoHomeSection("drop");
      setTimeout(() => scrollToSectionId("drop"), 20);
    });

    function setSearchValue(v) {
      const val = v == null ? "" : String(v);
      if (shopSearchInput && shopSearchInput.value !== val) shopSearchInput.value = val;
      shopSearchClear?.classList.toggle("show", !!normalizeStr(val));
      applyShopSearch(val);
    }
    shopSearchInput?.addEventListener("input", (e) => setSearchValue(e.target.value));
    shopSearchClear?.addEventListener("click", () => {
      setSearchValue("");
      shopSearchInput?.focus();
    });
    navSearchBtn?.addEventListener("click", () => {
      if (activeRoute) gotoHomeSection("shop");
      setTimeout(() => {
        scrollToSectionId("shop");
        shopSearchInput?.focus();
      }, 30);
    });

    initPolicies();

    const getCurrentAuth = () => loadJsonStorage(AUTH_KEY, null);
    function applyAuthUI() {
      const currentAuth = getCurrentAuth();
      const isLoggedIn = !!currentAuth?.email;
      if (navLoginBtn) {
        navLoginBtn.setAttribute("aria-label", isLoggedIn ? `Log out ${currentAuth.email}` : "Log in or sign up");
        navLoginBtn.setAttribute("title", isLoggedIn ? `Logged in as ${currentAuth.email}. Click to log out.` : "Log in or sign up");
        navLoginBtn.classList.toggle("is-logged-in", isLoggedIn);
      }
      const drawerAuth = $("drawer-auth-link");
      if (drawerAuth) drawerAuth.textContent = isLoggedIn ? "Log Out" : "Log In";
      const drawerSignup = $("drawer-signup-link");
      if (drawerSignup) drawerSignup.style.display = isLoggedIn ? "none" : "inline-flex";
    }

    function logoutUser() {
      const auth = getCurrentAuth();
      if (!auth?.email) return;
      localStorage.removeItem(AUTH_KEY);
      showCartToast("Logged out successfully.");
      applyAuthUI();
    }

    const authModal = initAuthModal({ onAuthChange: applyAuthUI });
    $("drawer-auth-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      closeOverlay("drawer");
      if (getCurrentAuth()?.email) {
        logoutUser();
        return;
      }
      setTimeout(() => authModal.openLogin(), 40);
    });
    $("drawer-signup-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      closeOverlay("drawer");
      setTimeout(() => authModal.openSignup(), 40);
    });
    navLoginBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      if (getCurrentAuth()?.email) {
        logoutUser();
        return;
      }
      authModal.openLogin();
    });

    applyAuthUI();

    try {
      catalog = await loadCatalog();
    } catch (err) {
      console.error(err);
      showCartToast("Could not load products data. Check products.json format and path.");
      catalog = { settings: {}, lookbook: [], products: [] };
    }

    preloadImage(catalog.lookbook?.[0]?.image, "high");
    preloadImage(catalog.products?.[0]?.images?.[0], "high");

    renderLookbook($("lookbook-list"), catalog.lookbook || []);
    renderShop($("shop-products"), catalog.products || [], catalog.settings || {});
    setupMobileShopViewLimit();
    initRevealAnimations();
    optimizeImageLoading();
    window.addEventListener("resize", () => requestAnimationFrame(setupMobileShopViewLimit), { passive: true });

    const floatingCart = $("nav-cart-btn");
    const cartSidebar = $("cart-sidebar");
    const cartOverlay = $("cart-overlay");
    const cartItemsEl = $("cart-items");
    const cartTotalEl = $("cart-total");
    const cartCountEl = $("cart-count");
    const checkoutBtn = $("checkout-btn");
    const cartSummaryEl = $("cart-summary-meta");
    let cart = loadJsonStorage(CART_STORAGE_KEY, []);

    registerOverlay("cart", {
      isOpen: () => cartSidebar?.classList.contains("active"),
      open: () => {
        cartSidebar?.classList.add("active");
        cartOverlay?.classList.add("active");
      },
      close: () => {
        cartSidebar?.classList.remove("active");
        cartOverlay?.classList.remove("active");
      }
    });

    floatingCart?.addEventListener("click", () => openOverlay("cart"));
    $("close-cart")?.addEventListener("click", () => closeOverlay("cart"));
    cartOverlay?.addEventListener("click", () => closeOverlay("cart"));

    function getCartTotals() {
      let total = 0;
      let itemCount = 0;
      cart.forEach((item) => {
        total += item.price * item.quantity;
        itemCount += item.quantity;
      });
      return { total, itemCount };
    }

    initCheckoutModal(getCartTotals);

    checkoutBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      if (checkoutBtn.disabled) return showCartToast("Add items to checkout.");
      openOverlay("checkout");
    });

    function updateCartUI() {
      if (!cartItemsEl || !cartTotalEl || !cartCountEl) return;
      saveJsonStorage(CART_STORAGE_KEY, cart);
      cartItemsEl.innerHTML = "";
      const totals = getCartTotals();
      cartTotalEl.textContent = totals.total.toFixed(2);
      cartCountEl.textContent = String(totals.itemCount);
      if (cartSummaryEl) cartSummaryEl.textContent = totals.itemCount ? `${totals.itemCount} item${totals.itemCount === 1 ? "" : "s"}` : "Bag empty";
      if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

      if (cart.length === 0) {
        cartItemsEl.innerHTML = '<li class="cart-empty-state"><strong>Bag empty.</strong><span>Add a piece to continue.</span></li>';
        return;
      }

      cart.forEach((item, idx) => {
        const li = document.createElement("li");
        li.className = "cart-item";
        li.innerHTML = `
          <img class="cart-item-img" src="${item.image || ""}" alt="${item.name}" loading="lazy" decoding="async" />
          <div class="cart-item-info">
            <div class="cart-item-topline">
              <div class="cart-item-title">${item.name}</div>
              <div class="cart-item-line-total">${formatPriceZAR(item.price * item.quantity)}</div>
            </div>
            <div class="cart-item-meta-row">
              <span class="cart-item-badge">Size ${item.size}</span>
              <span class="cart-item-badge">${item.color}</span>
            </div>
            <div class="cart-item-unit-price">${formatPriceZAR(item.price)} each</div>
          </div>
          <div class="cart-item-actions">
            <div class="qty-stepper">
              <div class="qty-stepper-inner">
                <button type="button" class="qty-btn" data-action="dec">−</button>
                <div class="qty-value">${item.quantity}</div>
                <button type="button" class="qty-btn" data-action="inc">+</button>
              </div>
            </div>
            <button type="button" class="remove-btn" data-action="remove">Remove</button>
          </div>`;
        li.querySelector('[data-action="dec"]').addEventListener("click", () => {
          item.quantity = Math.max(1, item.quantity - 1);
          updateCartUI();
        });
        li.querySelector('[data-action="inc"]').addEventListener("click", () => {
          item.quantity += 1;
          updateCartUI();
        });
        li.querySelector('[data-action="remove"]').addEventListener("click", () => {
          cart.splice(idx, 1);
          updateCartUI();
        });
        cartItemsEl.appendChild(li);
      });
    }

    function bindProductCards() {
      Array.from(document.querySelectorAll(".product")).forEach((productEl) => {
        const productId = productEl.getAttribute("data-product-id");
        const productData = (catalog.products || []).find((p) => String(p.id) === String(productId));
        if (!productData) return;
        const available = productIsAvailable(productData, catalog.settings || {});
        const stepper = setupQtyStepper(productEl.querySelector('.qty-stepper-ui[data-qty-root="card"]'));
        const sizeButtons = productEl.querySelectorAll(".size-btn");
        const colorOptions = productEl.querySelectorAll(".color");
        const addToCartBtn = productEl.querySelector(".add-to-cart");

        const updateAddBtn = () => {
          const selectedSize = productEl.querySelector(".size-btn.selected");
          const selectedColor = productEl.querySelector(".color.selected");
          if (!addToCartBtn) return;
          addToCartBtn.disabled = !available || !(selectedSize && selectedColor);
          addToCartBtn.textContent = available ? "Add to Bag" : "Out of Stock";
        };

        sizeButtons.forEach((btn) => btn.addEventListener("click", (e) => {
          e.stopPropagation();
          sizeButtons.forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
          updateAddBtn();
        }));

        colorOptions.forEach((color) => {
          const select = (e) => {
            e?.stopPropagation?.();
            colorOptions.forEach((c) => c.classList.remove("selected"));
            color.classList.add("selected");
            updateAddBtn();
          };
          color.addEventListener("click", select);
          clickOnEnterSpace(color, select);
        });

        addToCartBtn?.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!available) return showCartToast(stockMessage(productData, catalog.settings));
          const selectedSize = productEl.querySelector(".size-btn.selected");
          const selectedColor = productEl.querySelector(".color.selected");
          if (!selectedSize) return showCartToast("Select a size first.");
          if (!selectedColor) return showCartToast("Select a color first.");
          const quantity = Math.max(1, stepper?.getQty?.() ?? 1);
          const size = selectedSize.textContent.trim();
          const colorName = selectedColor.getAttribute("data-color") || "Color";
          const itemKey = `${productData.id}-${size}-${colorName}`;
          const existing = cart.find((item) => item.key === itemKey);
          if (existing) existing.quantity += quantity;
          else cart.push({ key: itemKey, id: productData.id, name: productData.name, price: Number(productData.price || 0), size, color: colorName, quantity, image: productData.images?.[0] || "" });
          updateCartUI();
          showCartToast(`Added ${quantity}x ${productData.name}`);
          stepper?.setQty?.(1);
        });

        updateAddBtn();
        productEl.addEventListener("click", (e) => {
          const interactive = e.target.closest("button, input, .color, a, .sizes, .colors, .options");
          if (interactive) return;
          gotoProduct(productData.id);
        });
      });
    }

    bindProductCards();
    updateCartUI();

    const rlbImg = $("rlb-img");
    const rlbPrev = $("rlb-prev");
    const rlbNext = $("rlb-next");
    const rlbMeta = $("rlb-meta");
    const rlbProgressFill = $("rlb-progress-fill");
    const rppRouteTitle = $("rpp-route-title");
    const rpp = {
      img: $("rpp-img"),
      thumbs: $("rpp-thumbs"),
      label: $("rpp-label"),
      name: $("rpp-name"),
      category: $("rpp-category"),
      colorsCount: $("rpp-colors"),
      price: $("rpp-price"),
      stock: $("rpp-stock"),
      sizes: $("rpp-sizes"),
      colorsRow: $("rpp-colors-row"),
      add: $("rpp-add")
    };
    const rppStepper = setupQtyStepper(document.querySelector('.qty-stepper-ui[data-qty-root="rpp"]'));
    const sectionIds = ["drop", "lookbook", "shop", "about"];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    let activeRoute = null;
    let activeLookbookIndex = 1;
    let rppSources = [];
    let rppIndex = 0;
    let rppProduct = null;

    function setActive(id) {
      navLinks.forEach((a) => {
        a.classList.remove("active");
        a.removeAttribute("aria-current");
      });
      Array.from(navLinks).filter((a) => (a.getAttribute("href") || "").endsWith(`#${id}`)).forEach((lnk) => {
        lnk.classList.add("active");
        lnk.setAttribute("aria-current", "page");
      });
    }

    function updateActiveFromScroll() {
      if (activeRoute) return;
      const refY = window.scrollY + getNavOffsetPx() + 10;
      let current = sections[0]?.id || "drop";
      for (const sec of sections) if (sec && sec.offsetTop <= refY) current = sec.id;
      setActive(current);
    }
    window.addEventListener("scroll", () => requestAnimationFrame(updateActiveFromScroll), { passive: true });

    function parseRoute() {
      const params = new URLSearchParams(window.location.search);
      return {
        page: params.get("page"),
        lookbookIndex: params.get("i"),
        productId: params.get("id"),
        hashId: (location.hash || "").replace("#", "")
      };
    }

    function sanitizeRoute(route) {
      const allowedPages = new Set([null, "lookbook", "product"]);
      if (!allowedPages.has(route.page)) {
        history.replaceState({}, "", "404.html");
        return { ...route, page: null, hashId: "drop" };
      }
      return route;
    }

    function renderLookbookRoute(i) {
      const items = catalog.lookbook || [];
      const total = items.length || 1;
      const idx = Math.max(1, parseInt(i || "1", 10));
      const safeIdx = Math.min(idx, total);
      const item = items[safeIdx - 1] || items[0];
      activeLookbookIndex = safeIdx;
      if (rlbImg && item) {
        rlbImg.classList.add("is-loading");
        rlbImg.src = item.image || "";
        rlbImg.alt = item.alt || `Lookbook image ${safeIdx}`;
        rlbImg.loading = "eager";
        rlbImg.decoding = "async";
        rlbImg.fetchPriority = "high";
      }
      if (rlbMeta) rlbMeta.textContent = `Look ${safeIdx} of ${total}`;
      if (rlbProgressFill) rlbProgressFill.style.width = `${Math.max(6, (safeIdx / total) * 100)}%`;
      const prev = items[(safeIdx - 2 + items.length) % items.length]?.image;
      const next = items[safeIdx % items.length]?.image;
      preloadImageSet([prev, next], "high");
      resetLookbookZoom();
    }

    let lookbookScale = 1;
    let lookbookX = 0;
    let lookbookY = 0;
    let pinchStartDistance = 0;
    let pinchStartScale = 1;
    const pointerMap = new Map();

    function applyLookbookTransform() {
      if (!rlbImg) return;
      rlbImg.style.transform = `translate(${lookbookX}px, ${lookbookY}px) scale(${lookbookScale})`;
      rlbImg.classList.toggle("zoomed", lookbookScale > 1.01);
    }

    function resetLookbookZoom() {
      lookbookScale = 1;
      lookbookX = 0;
      lookbookY = 0;
      applyLookbookTransform();
    }

    function getPointerDistance() {
      const points = Array.from(pointerMap.values());
      if (points.length < 2) return 0;
      const dx = points[0].x - points[1].x;
      const dy = points[0].y - points[1].y;
      return Math.hypot(dx, dy);
    }

    rlbImg?.addEventListener("dblclick", () => {
      if (lookbookScale > 1.01) resetLookbookZoom();
      else {
        lookbookScale = 1.9;
        applyLookbookTransform();
      }
    });

    rlbImg?.addEventListener("pointerdown", (e) => {
      pointerMap.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointerMap.size === 2) {
        pinchStartDistance = getPointerDistance();
        pinchStartScale = lookbookScale;
      }
    });

    rlbImg?.addEventListener("pointermove", (e) => {
      if (!pointerMap.has(e.pointerId)) return;
      const prev = pointerMap.get(e.pointerId);
      pointerMap.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointerMap.size === 2) {
        const currentDistance = getPointerDistance();
        if (pinchStartDistance > 0) {
          lookbookScale = Math.min(3, Math.max(1, pinchStartScale * (currentDistance / pinchStartDistance)));
          applyLookbookTransform();
        }
        return;
      }

      if (lookbookScale > 1.01 && prev) {
        lookbookX += e.clientX - prev.x;
        lookbookY += e.clientY - prev.y;
        applyLookbookTransform();
      }
    });

    ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
      rlbImg?.addEventListener(eventName, (e) => {
        pointerMap.delete(e.pointerId);
        if (pointerMap.size < 2) pinchStartDistance = 0;
        if (lookbookScale <= 1.01) resetLookbookZoom();
      });
    });

    rlbImg?.addEventListener("load", () => {
      requestAnimationFrame(() => rlbImg.classList.remove("is-loading"));
    });

    const checkoutPaypalBtn = $("checkout-paypal-btn");
    checkoutPaypalBtn?.addEventListener("click", () => {
      checkoutPaypalBtn.classList.add("is-processing");
      checkoutPaypalBtn.setAttribute("aria-busy", "true");
      checkoutPaypalBtn.textContent = "Redirecting to PayPal...";
      setTimeout(() => {
        checkoutPaypalBtn.classList.remove("is-processing");
        checkoutPaypalBtn.removeAttribute("aria-busy");
        checkoutPaypalBtn.textContent = "Pay with PayPal";
      }, 2200);
    });

    function setRppImage(i) {
      if (!rppSources.length || !rpp.img) return;
      rppIndex = (i + rppSources.length) % rppSources.length;
      rpp.img.src = rppSources[rppIndex];
      rpp.img.decoding = "async";
      rpp.img.fetchPriority = rppIndex === 0 ? "high" : "auto";
      rpp.thumbs.innerHTML = "";
      rppSources.forEach((src, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `thumb${index === rppIndex ? " active" : ""}`;
        btn.innerHTML = `<img src="${src}" alt="" loading="lazy" decoding="async" />`;
        btn.addEventListener("click", () => setRppImage(index));
        rpp.thumbs.appendChild(btn);
      });
    }

    function updateRppAddState() {
      const selectedSize = rpp.sizes?.querySelector(".size-btn.selected");
      const selectedColor = rpp.colorsRow?.querySelector(".color.selected");
      const available = productIsAvailable(rppProduct, catalog.settings || {});
      if (rpp.add) {
        rpp.add.disabled = !available || !(selectedSize && selectedColor);
        rpp.add.textContent = available ? "Add to Bag" : "Out of Stock";
      }
    }

    function renderProductRoute(id) {
      const prod = (catalog.products || []).find((p) => String(p.id) === String(id)) || (catalog.products || [])[0];
      if (!prod) return;
      rppProduct = prod;
      rppSources = (prod.images || []).filter(Boolean).slice(0, 4);
      if (rpp.label) rpp.label.textContent = prod.label || "";
      if (rpp.name) rpp.name.textContent = prod.name || "Item";
      if (rppRouteTitle) rppRouteTitle.textContent = prod.name || "Product";
      if (rpp.category) rpp.category.textContent = prod.category || "";
      if (rpp.colorsCount) rpp.colorsCount.textContent = "";
      if (rpp.price) rpp.price.textContent = formatPriceZAR(prod.price);
      if (rpp.stock) {
        rpp.stock.textContent = stockMessage(prod, catalog.settings || {});
        rpp.stock.className = `rpp-stock ${productIsAvailable(prod, catalog.settings || {}) ? "in-stock" : "out-of-stock"}`;
      }
      rpp.sizes.innerHTML = "";
      (prod.sizes || ["S", "M", "L", "XL"]).forEach((s) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "size-btn";
        btn.textContent = s;
        btn.addEventListener("click", () => {
          Array.from(rpp.sizes.querySelectorAll(".size-btn")).forEach((x) => x.classList.remove("selected"));
          btn.classList.add("selected");
          updateRppAddState();
        });
        rpp.sizes.appendChild(btn);
      });
      rpp.colorsRow.innerHTML = "";
      (prod.colors || []).forEach((c) => {
        const div = document.createElement("div");
        div.className = c.className || "color black";
        div.setAttribute("role", "button");
        div.setAttribute("tabindex", "0");
        div.setAttribute("aria-label", c.name || "Color");
        div.setAttribute("data-color", c.name || "Color");
        const select = () => {
          Array.from(rpp.colorsRow.querySelectorAll(".color")).forEach((x) => x.classList.remove("selected"));
          div.classList.add("selected");
          updateRppAddState();
        };
        div.addEventListener("click", select);
        clickOnEnterSpace(div, select);
        rpp.colorsRow.appendChild(div);
      });
      rppStepper?.setQty?.(1);
      updateRppAddState();
      setRppImage(0);
      updateSeoForProduct(prod);
    }

    rpp.add?.addEventListener("click", () => {
      if (!rppProduct || !productIsAvailable(rppProduct, catalog.settings || {})) return showCartToast(stockMessage(rppProduct, catalog.settings || {}));
      const selectedSize = rpp.sizes?.querySelector(".size-btn.selected");
      const selectedColor = rpp.colorsRow?.querySelector(".color.selected");
      if (!selectedSize || !selectedColor) return showCartToast("Choose a size and color first.");
      const quantity = Math.max(1, rppStepper?.getQty?.() ?? 1);
      const itemKey = `${rppProduct.id}-${selectedSize.textContent.trim()}-${selectedColor.getAttribute("data-color")}`;
      const existing = cart.find((item) => item.key === itemKey);
      if (existing) existing.quantity += quantity;
      else cart.push({ key: itemKey, id: rppProduct.id, name: rppProduct.name, price: Number(rppProduct.price || 0), size: selectedSize.textContent.trim(), color: selectedColor.getAttribute("data-color"), quantity, image: rppProduct.images?.[0] || "" });
      updateCartUI();
      showCartToast(`Added ${quantity}x ${rppProduct.name}`);
    });

    rlbPrev?.addEventListener("click", () => gotoLookbook(activeLookbookIndex <= 1 ? catalog.lookbook.length : activeLookbookIndex - 1));
    rlbNext?.addEventListener("click", () => gotoLookbook(activeLookbookIndex >= catalog.lookbook.length ? 1 : activeLookbookIndex + 1));

    function maybeOpenSignupOnScroll() {
      const alreadySigned = loadJsonStorage(SIGNUP_KEY, null);
      if (alreadySigned) return;
      const shop = $("shop");
      if (!shop) return;
      const rect = shop.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.6) {
        window.removeEventListener("scroll", maybeOpenSignupOnScroll);
        setTimeout(() => authModal.openSignup(), 250);
      }
    }
    window.addEventListener("scroll", maybeOpenSignupOnScroll, { passive: true });

    function applyRoute() {
      const { page, lookbookIndex, productId, hashId } = sanitizeRoute(parseRoute());
      activeRoute = page || null;
      if (page === "lookbook") {
        if (!catalog.lookbook?.length) return showRoute(null);
        if (rppRouteTitle) rppRouteTitle.textContent = "PRODUCT";
        showRoute("lookbook");
        renderLookbookRoute(lookbookIndex);
        document.title = `FAIDE | Lookbook ${activeLookbookIndex}`;
        return;
      }
      if (page === "product") {
        const knownProduct = (catalog.products || []).some((p) => String(p.id) === String(productId));
        if (!knownProduct && catalog.products?.[0]?.id) {
          navigateTo({ page: "product", id: catalog.products[0].id }, { replace: true });
          return;
        }
        showRoute("product");
        renderProductRoute(productId);
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
      }
      if (rppRouteTitle) rppRouteTitle.textContent = "PRODUCT";
      showRoute(null);
      resetSeoToDefault();
      const targetId = sectionIds.includes(hashId) ? hashId : "drop";
      setActive(targetId);
      if (location.hash) setTimeout(() => scrollToSectionId(targetId, "auto"), 0);
    }

    window.addEventListener("faide:navigate", applyRoute);
    window.addEventListener("popstate", () => {
      if (closeTopOverlayFromPop()) return;
      applyRoute();
    });

    document.querySelectorAll(".route-back").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const href = link.getAttribute("href") || "index.html#drop";
        const target = href.split("#")[1] || "drop";
        gotoHomeSection(target);
        setTimeout(() => scrollToSectionId(target), 20);
      });
    });

    $("shop-now-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      if (activeRoute) gotoHomeSection("shop");
      setTimeout(() => scrollToSectionId("shop"), 20);
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;
        e.preventDefault();
        closeOverlay("drawer");
        gotoHomeSection(href.replace("#", ""));
        setTimeout(() => scrollToSectionId(href.replace("#", "")), 20);
      });
    });

    applyRoute();
    updateActiveFromScroll();
    refreshPageLocks();
  });
})();
