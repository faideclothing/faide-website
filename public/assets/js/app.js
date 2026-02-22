(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function isMobile() {
    return window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  }

  function clickOnEnterSpace(el, fn) {
    if (!el) return;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn();
      }
    });
  }

  // ---------- SDK config (kept) ----------
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
        {
          get: () => config.background_color || defaultConfig.background_color,
          set: (v) => window.elementSdk?.setConfig?.({ background_color: (config.background_color = v) })
        },
        {
          get: () => config.surface_color || defaultConfig.surface_color,
          set: (v) => window.elementSdk?.setConfig?.({ surface_color: (config.surface_color = v) })
        },
        {
          get: () => config.text_color || defaultConfig.text_color,
          set: (v) => window.elementSdk?.setConfig?.({ text_color: (config.text_color = v) })
        },
        {
          get: () => config.primary_accent || defaultConfig.primary_accent,
          set: (v) => window.elementSdk?.setConfig?.({ primary_accent: (config.primary_accent = v) })
        },
        {
          get: () => config.secondary_accent || defaultConfig.secondary_accent,
          set: (v) => window.elementSdk?.setConfig?.({ secondary_accent: (config.secondary_accent = v) })
        }
      ],
      borderables: [],
      fontEditable: {
        get: () => config.font_family || defaultConfig.font_family,
        set: (v) => window.elementSdk?.setConfig?.({ font_family: (config.font_family = v) })
      },
      fontSizeable: {
        get: () => config.font_size || defaultConfig.font_size,
        set: (v) => window.elementSdk?.setConfig?.({ font_size: (config.font_size = v) })
      }
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

  // ---------- Data ----------
  async function loadCatalog() {
    const url = new URL("assets/js/products.json", window.location.href).toString();
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load products.json");
    return res.json();
  }

  // ---------- Helpers ----------
  function getNavOffsetPx() {
    const nav = document.querySelector(".navbar");
    const navH = nav?.getBoundingClientRect?.().height || 86;
    return Math.round(navH + 18);
  }

  function scrollToSectionId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.pageYOffset - getNavOffsetPx();
    window.scrollTo({ top, behavior: "smooth" });
  }

  function formatPriceZAR(price) {
    const n = Number(price || 0);
    return `R${n.toFixed(2)}`;
  }

  function setupQtyStepper(rootEl, { onChange } = {}) {
    const valueEl = rootEl.querySelector("[data-qty-value]");
    const incBtn = rootEl.querySelector('[data-qty-btn="inc"]');
    const decBtn = rootEl.querySelector('[data-qty-btn="dec"]');
    if (!valueEl || !incBtn || !decBtn) return null;

    let qty = 1;
    let holdTimer = null;
    let holdInterval = null;
    let speed = 180;

    const render = () => {
      valueEl.textContent = String(qty);
      onChange?.(qty);
    };

    const setQty = (next) => {
      qty = Math.max(1, next);
      render();
    };

    const step = (dir) => setQty(qty + dir);

    const stopHold = () => {
      clearTimeout(holdTimer);
      clearInterval(holdInterval);
      holdTimer = null;
      holdInterval = null;
      speed = 180;
    };

    const startHold = (dir) => {
      stopHold();
      holdTimer = setTimeout(() => {
        holdInterval = setInterval(() => {
          step(dir);
          if (speed > 65) speed -= 10;
        }, speed);
      }, 260);
    };

    const bindBtn = (btn, dir) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        step(dir);
      });

      const start = (e) => {
        e.preventDefault();
        e.stopPropagation();
        startHold(dir);
        step(dir);
      };

      btn.addEventListener("mousedown", start);
      btn.addEventListener("touchstart", start, { passive: false });
      ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((ev) =>
        btn.addEventListener(ev, stopHold, { passive: true })
      );
    };

    bindBtn(incBtn, +1);
    bindBtn(decBtn, -1);

    render();
    return { getQty: () => qty, setQty };
  }

  // ---------- Cart storage ----------
  const CART_STORAGE_KEY = "faide_cart_v2";
  function loadCartFromStorage() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  function saveCartToStorage(nextCart) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart || []));
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

  // ---------- History / Back-gesture UI stack ----------
  // We push a history state for overlays on open, so mobile back closes them first.
  const UI = {
    drawer: "drawer",
    search: "search",
    cart: "cart",
    policy: "policy",
    checkout: "checkout"
  };

  function pushUiState(kind) {
    // Push same URL but a state marker
    const currentUrl = window.location.href;
    history.pushState({ ui: kind }, "", currentUrl);
  }

  function pushRouteState(url, state) {
    history.pushState(state || {}, "", url);
  }

  function closeTopUiFromPopstate() {
    // Close in priority order (top-most first)
    if (isCheckoutOpen()) return closeCheckout(true);
    if (isPolicyOpen()) return hidePolicy(true);
    if (isCartOpen()) return closeCartPanel(true);
    if (isSearchOpen()) return closeSearch(true);
    if (isDrawerOpen()) return closeDrawer(true);
    return false;
  }

  // ---------- Mobile Drawer ----------
  const drawer = {
    overlay: $("drawer-overlay"),
    panel: $("mobile-drawer"),
    openBtn: $("mobile-menu-btn"),
    closeDesktopBtn: $("drawer-close-desktop")
  };

  function isDrawerOpen() {
    return drawer.panel?.classList.contains("active");
  }

  function openDrawer() {
    if (isDrawerOpen()) return;
    drawer.panel?.classList.add("active");
    drawer.panel?.setAttribute("aria-hidden", "false");
    drawer.overlay?.classList.add("active");
    drawer.overlay?.setAttribute("aria-hidden", "false");
    document.body.classList.add("lock-scroll");
    pushUiState(UI.drawer);
  }

  function closeDrawer(fromPop) {
    if (!isDrawerOpen()) return;
    drawer.panel?.classList.remove("active");
    drawer.panel?.setAttribute("aria-hidden", "true");
    drawer.overlay?.classList.remove("active");
    drawer.overlay?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lock-scroll");
    if (!fromPop) history.back();
  }

  // ---------- Mobile Search ----------
  const searchUi = {
    openBtn: $("mobile-search-btn"),
    overlay: $("mobile-search-overlay"),
    closeDesktopBtn: $("search-close-desktop"),
    input: $("mobile-search-input"),
    results: $("mobile-search-results")
  };

  function isSearchOpen() {
    return searchUi.overlay?.classList.contains("active");
  }

  function openSearch() {
    if (isSearchOpen()) return;
    searchUi.overlay?.classList.add("active");
    searchUi.overlay?.setAttribute("aria-hidden", "false");
    document.body.classList.add("lock-scroll");
    pushUiState(UI.search);
    setTimeout(() => searchUi.input?.focus(), 80);
  }

  function closeSearch(fromPop) {
    if (!isSearchOpen()) return;
    searchUi.overlay?.classList.remove("active");
    searchUi.overlay?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lock-scroll");
    if (searchUi.input) searchUi.input.value = "";
    if (searchUi.results) searchUi.results.innerHTML = "";
    if (!fromPop) history.back();
  }

  // ---------- Policies modal ----------
  let policyApi = null;
  function isPolicyOpen() {
    const m = $("policy-modal");
    return m && m.style.display === "block";
  }

  function showPolicyModal(type) {
    policyApi?.showPolicy(type);
  }

  function hidePolicy(fromPop) {
    policyApi?.hidePolicyInternal();
    if (!fromPop) history.back();
  }

  // ---------- Checkout modal ----------
  let checkoutModalApi = null;
  function isCheckoutOpen() {
    const m = $("checkout-modal");
    return m && m.style.display === "block";
  }

  function openCheckout() {
    checkoutModalApi?.open();
    pushUiState(UI.checkout);
  }

  function closeCheckout(fromPop) {
    checkoutModalApi?.close();
    if (!fromPop) history.back();
  }

  // ---------- Cart ----------
  const cartUi = {
    floating: $("floating-cart"),
    sidebar: $("cart-sidebar"),
    overlay: $("cart-overlay"),
    closeDesktopBtn: $("close-cart"),
    itemsEl: $("cart-items"),
    totalEl: $("cart-total"),
    countEl: $("cart-count"),
    checkoutBtn: $("checkout-btn")
  };

  function isCartOpen() {
    return cartUi.sidebar?.classList.contains("active");
  }

  function openCart() {
    if (isCartOpen()) return;
    cartUi.sidebar?.classList.add("active");
    cartUi.overlay?.classList.add("active");
    cartUi.overlay?.setAttribute("aria-hidden", "false");
    document.body.classList.add("lock-scroll");
    pushUiState(UI.cart);
  }

  function closeCartPanel(fromPop) {
    if (!isCartOpen()) return;
    cartUi.sidebar?.classList.remove("active");
    cartUi.overlay?.classList.remove("active");
    cartUi.overlay?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lock-scroll");
    if (!fromPop) history.back();
  }

  // ---------- Render ----------
  function renderLookbook(listEl, lookbookItems, gotoLookbook) {
    if (!listEl) return;
    listEl.innerHTML = "";
    lookbookItems.forEach((item) => {
      const card = document.createElement("div");
      card.className = "lookbook-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `Open Lookbook ${item.id}`);
      card.innerHTML = `<img src="${item.image}" alt="${item.alt || "Lookbook"}" class="lookbook-img" />`;
      const go = () => gotoLookbook(String(item.id));
      card.addEventListener("click", go);
      clickOnEnterSpace(card, go);
      listEl.appendChild(card);
    });
  }

  function renderShop(shopEl, products, gotoProduct, addToCartFactory) {
    if (!shopEl) return;
    shopEl.innerHTML = "";

    products.forEach((p) => {
      const card = document.createElement("div");
      card.className = "product";
      card.setAttribute("data-product-id", p.id);

      const colorsCountText = `${(p.colors || []).length} Colors`;

      const sizesHtml = (p.sizes || ["S", "M", "L", "XL"])
        .map((s) => `<button type="button" class="size-btn" data-size="${s}">${s}</button>`)
        .join("");

      const colorsHtml = (p.colors || [])
        .map(
          (c) =>
            `<div class="${c.className}" role="button" tabindex="0" aria-label="${c.name}" data-color="${c.name}"></div>`
        )
        .join("");

      card.innerHTML = `
        <div class="product-img-container">
          <img src="${(p.images && p.images[0]) || ""}" alt="${p.name}" class="product-img" />
        </div>

        <div class="product-info">
          <div class="product-label">${p.label || "New"}</div>

          <div class="product-header">
            <div class="product-name-wrapper">
              <h3>${p.name}</h3>
              <div class="product-category">${p.category || ""}</div>
              <div class="product-colors-count">${colorsCountText}</div>
            </div>
            <p class="price">${formatPriceZAR(p.price)}</p>
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

            <button type="button" class="secondary-btn add-to-cart" disabled>Add to Bag</button>
          </div>
        </div>
      `;

      shopEl.appendChild(card);

      addToCartFactory(card, p);

      // tap anywhere else -> product route
      card.addEventListener("click", (e) => {
        const interactive = e.target.closest("button, input, .color, a, .sizes, .colors, .options");
        if (interactive) return;
        gotoProduct(p.id);
      });
    });
  }

  // ---------- Main ----------
  document.addEventListener("DOMContentLoaded", async () => {
    $("shop-now-btn")?.addEventListener("click", () => scrollToSectionId("shop"));

    // shrink nav
    const navbar = document.querySelector(".navbar");
    function handleShrink() {
      if (!navbar) return;
      navbar.classList.toggle("shrink", window.scrollY > 20);
    }
    handleShrink();
    window.addEventListener("scroll", handleShrink, { passive: true });

    // Load products/lookbook
    let catalog = null;
    try {
      catalog = await loadCatalog();
    } catch (err) {
      console.error(err);
      showCartToast("Missing products.json. Check assets/js/products.json");
      catalog = { lookbook: [], products: [] };
    }

    // ---------- Routes (SPA) ----------
    const site = $("site-content");
    const rlb = $("route-lookbook");
    const rpp = $("route-product");

    const rlbImg = $("rlb-img");
    const rlbCounter = $("rlb-counter");

    const rppEls = {
      img: $("rpp-img"),
      thumbs: $("rpp-thumbs"),
      subtitle: $("rpp-subtitle"),
      label: $("rpp-label"),
      name: $("rpp-name"),
      category: $("rpp-category"),
      colorsCount: $("rpp-colors"),
      price: $("rpp-price"),
      sizes: $("rpp-sizes"),
      colorsRow: $("rpp-colors-row"),
      add: $("rpp-add")
    };

    const rppStepperRoot = document.querySelector('.qty-stepper-ui[data-qty-root="rpp"]');
    const rppStepper = rppStepperRoot ? setupQtyStepper(rppStepperRoot) : null;

    let rppSources = [];
    let rppIndex = 0;
    let rppProduct = null;
    let __rppSwapToken = 0;

    function showRoute(page) {
      rlb?.classList.remove("active");
      rpp?.classList.remove("active");
      rlb?.setAttribute("aria-hidden", "true");
      rpp?.setAttribute("aria-hidden", "true");
      document.body.classList.remove("route-active");

      if (site) site.style.display = "block";

      if (page === "lookbook") {
        if (site) site.style.display = "none";
        rlb?.classList.add("active");
        rlb?.setAttribute("aria-hidden", "false");
        document.body.classList.add("route-active");
      }
      if (page === "product") {
        if (site) site.style.display = "none";
        rpp?.classList.add("active");
        rpp?.setAttribute("aria-hidden", "false");
        document.body.classList.add("route-active");
      }
    }

    function currentRouteFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const page = params.get("page");
      if (page === "lookbook") return { page: "lookbook", i: params.get("i") || "1" };
      if (page === "product") return { page: "product", id: params.get("id") || "" };
      return { page: null };
    }

    function buildUrl(paramsObj) {
      const url = new URL(window.location.href);
      url.hash = "";
      url.search = "";
      Object.keys(paramsObj || {}).forEach((k) => {
        const v = paramsObj[k];
        if (v == null || v === "") return;
        url.searchParams.set(k, String(v));
      });
      return url.pathname + (url.searchParams.toString() ? "?" + url.searchParams.toString() : "");
    }

    function gotoLookbook(i) {
      closeDrawer(true);
      closeSearch(true);
      const url = buildUrl({ page: "lookbook", i });
      pushRouteState(url, { page: "lookbook", i: String(i) });
      renderFromUrl();
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    function gotoProduct(id) {
      closeDrawer(true);
      closeSearch(true);
      const url = buildUrl({ page: "product", id });
      pushRouteState(url, { page: "product", id: String(id) });
      renderFromUrl();
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    function renderLookbookRoute(i) {
      const idx = Math.max(1, parseInt(i || "1", 10));
      const items = catalog.lookbook || [];
      const total = items.length || 1;
      const safeIdx = Math.min(idx, total);
      const item = items[safeIdx - 1] || items[0];

      if (rlbImg) rlbImg.src = item?.image || "";
      if (rlbCounter) rlbCounter.textContent = `${safeIdx} / ${total}`;
    }

    function renderRppThumbs() {
      if (!rppEls.thumbs) return;
      rppEls.thumbs.innerHTML = "";
      rppSources.slice(0, 4).forEach((src, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "thumb" + (i === rppIndex ? " active" : "");
        btn.setAttribute("aria-label", `View image ${i + 1}`);
        btn.innerHTML = `<img src="${src}" alt="" loading="lazy" />`;
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          setRppImage(i);
        });
        rppEls.thumbs.appendChild(btn);
      });
    }

    function setRppImage(i) {
      if (!rppSources.length || !rppEls.img) return;
      const token = ++__rppSwapToken;

      rppIndex = (i + rppSources.length) % rppSources.length;
      const nextSrc = rppSources[rppIndex];

      rppEls.img.style.opacity = "0.25";
      requestAnimationFrame(() => {
        if (token !== __rppSwapToken) return;
        rppEls.img.src = nextSrc;
        if (rppEls.subtitle) rppEls.subtitle.textContent = `${rppIndex + 1} / ${rppSources.length}`;
        renderRppThumbs();
        setTimeout(() => {
          if (token !== __rppSwapToken) return;
          rppEls.img.style.opacity = "1";
        }, 60);
      });
    }

    function updateRppAddState() {
      const selectedSize = rppEls.sizes?.querySelector(".size-btn.selected");
      const selectedColor = rppEls.colorsRow?.querySelector(".color.selected");
      if (rppEls.add) rppEls.add.disabled = !(selectedSize && selectedColor);
    }

    function renderSizesToRpp(sizes) {
      if (!rppEls.sizes) return;
      rppEls.sizes.innerHTML = "";
      (sizes || ["S", "M", "L", "XL"]).forEach((s) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "size-btn";
        btn.textContent = s;
        btn.addEventListener("click", () => {
          Array.from(rppEls.sizes.querySelectorAll(".size-btn")).forEach((x) => x.classList.remove("selected"));
          btn.classList.add("selected");
          updateRppAddState();
        });
        rppEls.sizes.appendChild(btn);
      });
    }

    function renderColorsToRpp(colors) {
      if (!rppEls.colorsRow) return;
      rppEls.colorsRow.innerHTML = "";

      (colors || []).forEach((c) => {
        const div = document.createElement("div");
        div.className = c.className || "color black";
        div.setAttribute("role", "button");
        div.setAttribute("tabindex", "0");
        div.setAttribute("aria-label", c.name || "Color");
        div.setAttribute("data-color", c.name || "Color");

        const select = () => {
          Array.from(rppEls.colorsRow.querySelectorAll(".color")).forEach((x) => x.classList.remove("selected"));
          div.classList.add("selected");
          updateRppAddState();
        };

        div.addEventListener("click", select);
        clickOnEnterSpace(div, select);

        rppEls.colorsRow.appendChild(div);
      });
    }

    async function renderProductRoute(id) {
      const prod = (catalog.products || []).find((p) => String(p.id) === String(id)) || (catalog.products || [])[0];
      if (!prod) return;

      rppProduct = prod;
      rppSources = (prod.images || []).filter(Boolean).slice(0, 4);
      rppIndex = 0;

      if (rppEls.label) rppEls.label.textContent = prod.label || "";
      if (rppEls.name) rppEls.name.textContent = prod.name || "Item";
      if (rppEls.category) rppEls.category.textContent = prod.category || "";
      if (rppEls.colorsCount) rppEls.colorsCount.textContent = `${(prod.colors || []).length} Colors`;
      if (rppEls.price) rppEls.price.textContent = formatPriceZAR(prod.price);

      renderSizesToRpp(prod.sizes);
      renderColorsToRpp(prod.colors);
      rppStepper?.setQty?.(1);
      if (rppEls.add) rppEls.add.disabled = true;

      setRppImage(0);
    }

    async function renderFromUrl() {
      const r = currentRouteFromUrl();
      if (r.page === "lookbook") {
        showRoute("lookbook");
        renderLookbookRoute(r.i);
        return;
      }
      if (r.page === "product") {
        showRoute("product");
        await renderProductRoute(r.id);
        return;
      }
      showRoute(null);
    }

    // back buttons in route header: use history.back to support gesture
    document.querySelectorAll("[data-route-back]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        history.back();
      });
    });

    // ---------- Policies ----------
    function initPolicies() {
      const policyModal = $("policy-modal");
      const modalTitle = $("modal-title");
      const modalContent = $("modal-content");
      const closeModal = $("close-modal");

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

      let lastFocusedEl = null;

      function showPolicy(type) {
        const policy = policies[type];
        if (!policy) return;
        lastFocusedEl = document.activeElement;
        if (modalTitle) modalTitle.textContent = policy.title;
        if (modalContent) modalContent.innerHTML = policy.content;
        if (policyModal) policyModal.style.display = "block";
        document.body.classList.add("lock-scroll");
        pushUiState(UI.policy);
        setTimeout(() => closeModal?.focus?.(), 0);
      }

      function hidePolicyInternal() {
        if (policyModal) policyModal.style.display = "none";
        document.body.classList.remove("lock-scroll");
        if (lastFocusedEl && typeof lastFocusedEl.focus === "function") lastFocusedEl.focus();
      }

      closeModal?.addEventListener("click", () => hidePolicy(false));
      policyModal?.addEventListener("click", (e) => {
        if (e.target === policyModal) hidePolicy(false);
      });

      return { showPolicy, hidePolicyInternal };
    }

    policyApi = initPolicies();

    // policy links
    function onClick(id, fn) {
      const el = $(id);
      if (!el) return;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        fn();
      });
    }

    onClick("privacy-link", () => showPolicyModal("privacy"));
    onClick("terms-link", () => showPolicyModal("terms"));
    onClick("returns-link", () => showPolicyModal("returns"));
    onClick("shipping-link", () => showPolicyModal("shipping"));

    // ---------- Checkout modal ----------
    const CHECKOUT_PROFILE_KEY = "faide_checkout_profile_v1";
    function loadCheckoutProfile() {
      try {
        const raw = localStorage.getItem(CHECKOUT_PROFILE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
    function saveCheckoutProfile(profile) {
      try {
        localStorage.setItem(CHECKOUT_PROFILE_KEY, JSON.stringify(profile || {}));
      } catch {}
    }

    function initCheckoutModal(getCartTotals) {
      const overlay = $("checkout-modal");
      const close1 = $("checkout-close");
      const close2 = $("checkout-close-2");
      const itemsCount = $("checkout-items-count");
      const totalEl = $("checkout-total");
      const submit = $("co-submit");

      const nameEl = $("co-name");
      const emailEl = $("co-email");
      const phoneEl = $("co-phone");
      const cityEl = $("co-city");

      function open() {
        const { itemCount, total } = getCartTotals();
        if (itemsCount) itemsCount.textContent = String(itemCount);
        if (totalEl) totalEl.textContent = total.toFixed(2);

        const profile = loadCheckoutProfile();
        if (profile) {
          if (nameEl) nameEl.value = profile.name || "";
          if (emailEl) emailEl.value = profile.email || "";
          if (phoneEl) phoneEl.value = profile.phone || "";
          if (cityEl) cityEl.value = profile.city || "";
        }

        if (overlay) overlay.style.display = "block";
        document.body.classList.add("lock-scroll");
        setTimeout(() => emailEl?.focus?.(), 80);
      }

      function close() {
        if (overlay) overlay.style.display = "none";
        document.body.classList.remove("lock-scroll");
      }

      close1?.addEventListener("click", () => closeCheckout(false));
      close2?.addEventListener("click", () => closeCheckout(false));
      overlay?.addEventListener("click", (e) => {
        if (e.target === overlay) closeCheckout(false);
      });

      submit?.addEventListener("click", () => {
        const profile = {
          name: nameEl?.value?.trim() || "",
          email: emailEl?.value?.trim() || "",
          phone: phoneEl?.value?.trim() || "",
          city: cityEl?.value?.trim() || ""
        };

        if (!profile.email) return showCartToast("Please enter an email.");
        saveCheckoutProfile(profile);
        showCartToast("Saved. We’ll notify you when payments go live.");
        closeCheckout(false);
      });

      return { open, close };
    }

    // ---------- Cart logic ----------
    let cart = loadCartFromStorage();

    function setCheckoutState() {
      const empty = cart.length === 0;
      if (!cartUi.checkoutBtn) return;
      cartUi.checkoutBtn.disabled = empty;
      cartUi.checkoutBtn.title = empty ? "Add items to checkout" : "Proceed to Checkout";
    }

    function getCartTotals() {
      let total = 0;
      let itemCount = 0;
      cart.forEach((item) => {
        total += item.price * item.quantity;
        itemCount += item.quantity;
      });
      return { total, itemCount };
    }

    checkoutModalApi = initCheckoutModal(getCartTotals);

    cartUi.floating?.addEventListener("click", openCart);
    cartUi.closeDesktopBtn?.addEventListener("click", () => closeCartPanel(false));
    cartUi.overlay?.addEventListener("click", () => closeCartPanel(false));

    cartUi.checkoutBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      if (cartUi.checkoutBtn.disabled) return showCartToast("Add items to checkout.");
      openCheckout();
    });

    function updateCartUI() {
      if (!cartUi.itemsEl || !cartUi.totalEl || !cartUi.countEl) return;
      saveCartToStorage(cart);

      cartUi.itemsEl.innerHTML = "";
      const totals = getCartTotals();

      if (cart.length === 0) {
        cartUi.itemsEl.innerHTML =
          '<li style="text-align:center;color:#666;border:none;background:transparent;padding:14px 0;">Your cart is empty</li>';
        cartUi.totalEl.textContent = "0.00";
        cartUi.countEl.textContent = "0";
        setCheckoutState();
        return;
      }

      cart.forEach((item, idx) => {
        const lineTotal = item.price * item.quantity;

        const li = document.createElement("li");
        li.className = "cart-item";
        li.innerHTML = `
          <img class="cart-item-img" src="${item.image || ""}" alt="${item.name}" onerror="this.style.display='none';" />
          <div class="cart-item-info">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-meta">Size: ${item.size} • Color: ${item.color}</div>
            <div class="cart-item-price">R${lineTotal.toFixed(2)}</div>
          </div>
          <div class="cart-item-actions">
            <div class="qty-stepper" aria-label="Quantity controls">
              <div class="qty-stepper-inner">
                <button type="button" class="qty-btn" data-action="dec" aria-label="Decrease quantity">−</button>
                <div class="qty-value" aria-label="Quantity">${item.quantity}</div>
                <button type="button" class="qty-btn" data-action="inc" aria-label="Increase quantity">+</button>
              </div>
            </div>
            <button type="button" class="remove-btn" data-action="remove" aria-label="Remove item">Remove</button>
          </div>
        `;

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

        cartUi.itemsEl.appendChild(li);
      });

      cartUi.totalEl.textContent = totals.total.toFixed(2);
      cartUi.countEl.textContent = String(totals.itemCount);
      setCheckoutState();
    }

    // ---------- Add-to-cart bindings for shop cards ----------
    function addToCartFactory(productEl, productData) {
      const stepperRoot = productEl.querySelector('.qty-stepper-ui[data-qty-root="card"]');
      const stepper = stepperRoot ? setupQtyStepper(stepperRoot) : null;

      const sizeButtons = productEl.querySelectorAll(".size-btn");
      const colorOptions = productEl.querySelectorAll(".color");
      const addToCartBtn = productEl.querySelector(".add-to-cart");

      const updateAddBtn = () => {
        if (!addToCartBtn) return;
        const selectedSize = productEl.querySelector(".size-btn.selected");
        const selectedColor = productEl.querySelector(".color.selected");
        addToCartBtn.disabled = !(selectedSize && selectedColor);
      };

      sizeButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          sizeButtons.forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
          productEl.classList.add("expanded");
          updateAddBtn();
        });
      });

      colorOptions.forEach((color) => {
        const select = (e) => {
          e?.stopPropagation?.();
          colorOptions.forEach((c) => c.classList.remove("selected"));
          color.classList.add("selected");
          productEl.classList.add("expanded");
          updateAddBtn();
        };
        color.addEventListener("click", select);
        clickOnEnterSpace(color, select);
      });

      updateAddBtn();

      addToCartBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const selectedSize = productEl.querySelector(".size-btn.selected");
        const selectedColor = productEl.querySelector(".color.selected");
        if (!selectedSize) return showCartToast("Select a size first.");
        if (!selectedColor) return showCartToast("Select a color first.");

        let quantity = stepper?.getQty?.() ?? 1;
        quantity = Math.max(1, Number.isFinite(quantity) ? quantity : 1);

        const size = selectedSize.textContent.trim();
        const colorName = selectedColor.getAttribute("data-color") || "Color";
        const image = (productData.images && productData.images[0]) || "";

        const itemKey = `${productData.id}-${size}-${colorName}`;
        const existing = cart.find((item) => item.key === itemKey);

        if (existing) existing.quantity += quantity;
        else
          cart.push({
            key: itemKey,
            id: productData.id,
            name: productData.name,
            price: Number(productData.price || 0),
            size,
            color: colorName,
            quantity,
            image
          });

        updateCartUI();
        showCartToast(`Added ${quantity}x ${productData.name} (${size}) in ${colorName}`);
        stepper?.setQty?.(1);
      });
    }

    // ---------- Render base pages ----------
    renderLookbook($("lookbook-list"), catalog.lookbook || [], gotoLookbook);
    renderShop($("shop-products"), catalog.products || [], gotoProduct, addToCartFactory);

    // ---------- Product route add-to-cart ----------
    rppEls.add?.addEventListener("click", () => {
      if (!rppProduct) return;

      const selectedSize = rppEls.sizes?.querySelector(".size-btn.selected");
      const selectedColor = rppEls.colorsRow?.querySelector(".color.selected");
      if (!selectedSize) return showCartToast("Select a size first.");
      if (!selectedColor) return showCartToast("Select a color first.");

      let quantity = rppStepper?.getQty?.() ?? 1;
      quantity = Math.max(1, Number.isFinite(quantity) ? quantity : 1);

      const size = selectedSize.textContent.trim();
      const colorName = selectedColor.getAttribute("data-color") || "Color";
      const image = rppSources[rppIndex] || (rppProduct.images && rppProduct.images[0]) || "";

      const itemKey = `${rppProduct.id}-${size}-${colorName}`;
      const existing = cart.find((item) => item.key === itemKey);

      if (existing) existing.quantity += quantity;
      else
        cart.push({
          key: itemKey,
          id: rppProduct.id,
          name: rppProduct.name,
          price: Number(rppProduct.price || 0),
          size,
          color: colorName,
          quantity,
          image
        });

      updateCartUI();
      showCartToast(`Added ${quantity}x ${rppProduct.name} (${size}) in ${colorName}`);
    });

    updateCartUI();

    // ---------- Main nav links ----------
    const navLinks = document.querySelectorAll('[data-nav-link="main"]');
    const drawerLinks = document.querySelectorAll('[data-nav-link="drawer"]');

    function handleNavToHash(href) {
      if (!href.includes("#")) return;
      const id = href.split("#")[1];
      if (!id) return;

      // if in route, go back to home then scroll
      const r = currentRouteFromUrl();
      if (r.page) {
        const url = buildUrl({});
        pushRouteState(url, {});
        renderFromUrl();
        setTimeout(() => {
          scrollToSectionId(id);
          history.replaceState({}, "", `${location.pathname}#${id}`);
        }, 40);
        return;
      }

      scrollToSectionId(id);
      history.replaceState({}, "", `${location.pathname}#${id}`);
    }

    navLinks.forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        handleNavToHash(a.getAttribute("href") || "");
      });
    });

    drawerLinks.forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        closeDrawer(false); // uses back-stack correctly
        handleNavToHash(a.getAttribute("href") || "");
      });
    });

    // active link highlight (home sections)
    const sectionIds = ["drop", "lookbook", "shop", "about"];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    function setActive(id) {
      navLinks.forEach((a) => {
        a.classList.remove("active");
        a.removeAttribute("aria-current");
      });
      Array.from(navLinks)
        .filter((a) => (a.getAttribute("href") || "").endsWith(`#${id}`))
        .forEach((lnk) => {
          lnk.classList.add("active");
          lnk.setAttribute("aria-current", "page");
        });
    }

    let raf = null;
    const updateActiveFromScroll = () => {
      // only on home page
      const r = currentRouteFromUrl();
      if (r.page) return;

      const refY = window.scrollY + getNavOffsetPx() + 10;
      let current = sections[0]?.id || "drop";
      for (const sec of sections) if (sec && sec.offsetTop <= refY) current = sec.id;
      setActive(current);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        updateActiveFromScroll();
      });
    };

    updateActiveFromScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateActiveFromScroll, { passive: true });

    // initial hash scroll
    const hashId = (location.hash || "").replace("#", "");
    if (hashId && ["drop", "lookbook", "shop", "about", "footer"].includes(hashId)) {
      setTimeout(() => {
        scrollToSectionId(hashId);
        setActive(hashId === "footer" ? "about" : hashId);
      }, 30);
    }

    // ---------- Mobile drawer events ----------
    drawer.openBtn?.addEventListener("click", openDrawer);
    drawer.overlay?.addEventListener("click", () => closeDrawer(false));
    drawer.closeDesktopBtn?.addEventListener("click", () => closeDrawer(false));

    // ---------- Mobile search events ----------
    searchUi.openBtn?.addEventListener("click", openSearch);
    searchUi.closeDesktopBtn?.addEventListener("click", () => closeSearch(false));
    searchUi.overlay?.addEventListener("click", (e) => {
      // tap outside sheet closes
      if (e.target === searchUi.overlay) closeSearch(false);
    });

    // search logic (live results)
    function renderSearchResults(q) {
      if (!searchUi.results) return;
      const query = (q || "").trim().toLowerCase();
      if (!query) {
        searchUi.results.innerHTML = "";
        return;
      }

      const matches = (catalog.products || [])
        .filter((p) => {
          const name = String(p.name || "").toLowerCase();
          const cat = String(p.category || "").toLowerCase();
          const label = String(p.label || "").toLowerCase();
          return name.includes(query) || cat.includes(query) || label.includes(query);
        })
        .slice(0, 8);

      if (matches.length === 0) {
        searchUi.results.innerHTML = `<div style="color:#888;font-weight:800;padding:10px 2px;">No results.</div>`;
        return;
      }

      searchUi.results.innerHTML = "";
      matches.forEach((p) => {
        const row = document.createElement("div");
        row.className = "search-result";
        row.setAttribute("role", "button");
        row.setAttribute("tabindex", "0");

        const img = (p.images && p.images[0]) || "";
        row.innerHTML = `
          <img src="${img}" alt="${p.name}" onerror="this.style.display='none';" />
          <div>
            <div class="search-result-title">${p.name}</div>
            <div class="search-result-sub">${p.category || ""} • ${formatPriceZAR(p.price)}</div>
          </div>
        `;

        const go = () => {
          closeSearch(false);
          gotoProduct(p.id);
        };
        row.addEventListener("click", go);
        clickOnEnterSpace(row, go);
        searchUi.results.appendChild(row);
      });
    }

    searchUi.input?.addEventListener("input", (e) => renderSearchResults(e.target.value));

    // ---------- Start routing render ----------
    await renderFromUrl();

    // ---------- Browser back gesture handling ----------
    window.addEventListener("popstate", async () => {
      // If a UI overlay is open, close it first.
      const closed = closeTopUiFromPopstate();
      if (closed) return;

      // Otherwise, route changed: render based on URL
      await renderFromUrl();
    });

    // ---------- ESC handling (desktop) ----------
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;

      if (isCheckoutOpen()) return closeCheckout(false);
      if (isPolicyOpen()) return hidePolicy(false);
      if (isCartOpen()) return closeCartPanel(false);
      if (isSearchOpen()) return closeSearch(false);
      if (isDrawerOpen()) return closeDrawer(false);
    });
  });
})();