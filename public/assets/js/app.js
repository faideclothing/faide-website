(function () {
  function $(id) {
    return document.getElementById(id);
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

  function scrollToSectionId(id, behavior = "smooth") {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.pageYOffset - getNavOffsetPx();
    window.scrollTo({ top, behavior });
  }

  function toQueryUrl(params) {
    const url = new URL(window.location.href);
    url.hash = "";
    Object.keys(params).forEach((k) => {
      if (params[k] == null || params[k] === "") url.searchParams.delete(k);
      else url.searchParams.set(k, String(params[k]));
    });
    const qs = url.searchParams.toString();
    return qs ? url.pathname + "?" + qs : url.pathname;
  }

  function gotoLookbook(i) {
    window.location.href = toQueryUrl({ page: "lookbook", i });
  }

  function gotoProduct(id) {
    window.location.href = toQueryUrl({ page: "product", id });
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
    }
    if (page === "product") {
      if (site) site.style.display = "none";
      rpp?.classList.add("active");
      rpp?.setAttribute("aria-hidden", "false");
    }
  }

  function normalizeStr(s) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  }

  function applyShopSearch(term) {
    const q = normalizeStr(term);
    const shopEl = document.getElementById("shop-products");
    if (!shopEl) return;

    const cards = Array.from(shopEl.querySelectorAll(".product"));
    let shown = 0;

    cards.forEach((card) => {
      const name = normalizeStr(card.querySelector("h3")?.textContent);
      const category = normalizeStr(card.querySelector(".product-category")?.textContent);
      const label = normalizeStr(card.querySelector(".product-label")?.textContent);

      const match = !q || name.includes(q) || category.includes(q) || label.includes(q);
      card.style.display = match ? "" : "none";
      if (match) shown += 1;
    });

    let empty = document.getElementById("shop-search-empty");
    if (!q) {
      if (empty) empty.remove();
      return;
    }
    if (shown === 0) {
      if (!empty) {
        empty = document.createElement("div");
        empty.id = "shop-search-empty";
        empty.style.color = "#777";
        empty.style.fontWeight = "800";
        empty.style.padding = "0 var(--px)";
        empty.style.marginTop = "10px";
        empty.textContent = "No products found.";
        shopEl.parentElement.appendChild(empty);
      }
    } else {
      if (empty) empty.remove();
    }
  }

  // ---------- Qty Stepper ----------
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

  // ---------- Cart ----------
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

  // ---------- Global modal / nav lock helpers ----------
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

  function setNavHidden(hidden) {
    document.body.classList.toggle("nav-hidden", !!hidden);
  }

  // Back gesture handling: when a modal/cart opens on mobile, push a history state.
  let modalDepth = 0;
  function pushModalState() {
    if (!isMobile()) return;
    modalDepth += 1;
    history.pushState({ __faideModal: true, depth: modalDepth }, "");
  }
  function popModalState() {
    if (!isMobile()) return;
    if (modalDepth > 0) modalDepth -= 1;
  }

  // ---------- Policies ----------
  function initPolicies(openModal, closeModal) {
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

    function showPolicy(type) {
      const policy = policies[type];
      if (!policy) return;
      if (modalTitle) modalTitle.textContent = policy.title;
      if (modalContent) modalContent.innerHTML = policy.content;
      openModal(policyModal, $("close-modal"));
    }

    function onClick(id, fn) {
      const el = $(id);
      if (!el) return;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        fn();
      });
    }

    onClick("privacy-link", () => showPolicy("privacy"));
    onClick("terms-link", () => showPolicy("terms"));
    onClick("returns-link", () => showPolicy("returns"));
    onClick("shipping-link", () => showPolicy("shipping"));

    $("close-modal")?.addEventListener("click", () => closeModal(policyModal));
    policyModal?.addEventListener("click", (e) => {
      if (e.target === policyModal) closeModal(policyModal);
    });

    return {
      isOpen: () => policyModal?.style.display === "block",
      close: () => closeModal(policyModal)
    };
  }

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

  function initCheckoutModal(getCartTotals, openModal, closeModal) {
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

      openModal(overlay, emailEl);
    }

    function close() {
      closeModal(overlay);
    }

    close1?.addEventListener("click", close);
    close2?.addEventListener("click", close);
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) close();
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
      close();
    });

    return { open, close, isOpen: () => overlay?.style.display === "block" };
  }

  // ---------- Signup modal (Shop reached) ----------
  const SIGNUP_KEY = "faide_signup_v1";
  function initSignupModal(openModal, closeModal) {
    const overlay = $("signup-modal");
    const closeBtn = $("signup-close");
    const emailEl = $("su-email");
    const submit = $("su-submit");

    function open() {
      openModal(overlay, emailEl);
    }
    function close() {
      closeModal(overlay);
    }

    closeBtn?.addEventListener("click", close);
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    submit?.addEventListener("click", () => {
      const email = emailEl?.value?.trim() || "";
      if (!email || !email.includes("@") || !email.includes(".")) {
        showCartToast("Please enter a valid email.");
        return;
      }
      try {
        localStorage.setItem(SIGNUP_KEY, JSON.stringify({ email, ts: Date.now() }));
      } catch {}
      showCartToast("You’re in. Drop alerts enabled.");
      close();
    });

    return { open, close, isOpen: () => overlay?.style.display === "block" };
  }

  function formatPriceZAR(price) {
    const n = Number(price || 0);
    return `R${n.toFixed(2)}`;
  }

  function renderLookbook(listEl, lookbookItems) {
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

  function renderShop(shopEl, products) {
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
    });
  }

  // ---------- Main ----------
  document.addEventListener("DOMContentLoaded", async () => {
    $("shop-now-btn")?.addEventListener("click", () => scrollToSectionId("shop"));

    const navbar = document.querySelector(".navbar");
    const navLinks = document.querySelectorAll('[data-nav-link="main"]');

    // Drawer UI
    const menuBtn = $("mobile-menu-btn");
    const drawer = $("mobile-menu-panel");
    const drawerOverlay = $("mobile-drawer-overlay");
    const drawerClose = $("drawer-close");

    // ONE Shop search
    const shopSearchInput = $("shop-search-input");
    const shopSearchClear = $("shop-search-clear");

    // Mobile search icon now: scroll to Shop + focus input
    $("mobile-search-btn")?.addEventListener("click", () => {
      // go to shop and focus
      scrollToSectionId("shop");
      setTimeout(() => shopSearchInput?.focus?.(), 450);
    });

    function handleShrink() {
      if (!navbar) return;
      navbar.classList.toggle("shrink", window.scrollY > 20);
    }
    handleShrink();
    window.addEventListener("scroll", handleShrink, { passive: true });

    // ---------- Modal open/close (shared) ----------
    function openModal(modalEl, focusEl) {
      if (!modalEl) return;
      modalEl.style.display = "block";
      document.body.classList.add("lock-scroll");
      setNavHidden(true);
      pushModalState();
      setTimeout(() => focusEl?.focus?.(), 50);
    }

    function closeModal(modalEl) {
      if (!modalEl) return;
      if (modalEl.style.display !== "block") return;
      modalEl.style.display = "none";
      document.body.classList.remove("lock-scroll");

      const anyOpen =
        $("policy-modal")?.style.display === "block" ||
        $("checkout-modal")?.style.display === "block" ||
        $("signup-modal")?.style.display === "block" ||
        $("cart-sidebar")?.classList.contains("active");

      setNavHidden(anyOpen);
      popModalState();
    }

    // Drawer open/close
    function openDrawer() {
      if (!drawer || !drawerOverlay) return;
      drawer.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
      drawerOverlay.classList.add("active");
      menuBtn?.setAttribute("aria-expanded", "true");
      document.body.classList.add("lock-scroll");
    }
    function closeDrawer() {
      if (!drawer || !drawerOverlay) return;
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      drawerOverlay.classList.remove("active");
      menuBtn?.setAttribute("aria-expanded", "false");
      document.body.classList.remove("lock-scroll");
    }

    menuBtn?.addEventListener("click", () => {
      if (drawer?.classList.contains("open")) closeDrawer();
      else openDrawer();
    });
    drawerClose?.addEventListener("click", closeDrawer);
    drawerOverlay?.addEventListener("click", closeDrawer);

    navLinks.forEach((a) => a.addEventListener("click", () => closeDrawer()));

    // Shop search logic (single input)
    function setSearchValue(v) {
      const val = v == null ? "" : String(v);
      if (shopSearchInput && shopSearchInput.value !== val) shopSearchInput.value = val;

      const has = !!normalizeStr(val);
      shopSearchClear?.classList.toggle("show", has);
      applyShopSearch(val);
    }

    shopSearchInput?.addEventListener("input", (e) => setSearchValue(e.target.value));
    shopSearchClear?.addEventListener("click", () => {
      setSearchValue("");
      shopSearchInput?.focus();
    });

    // ---------- Policies ----------
    const policies = initPolicies(openModal, closeModal);

    // Load products/lookbook
    let catalog = null;
    try {
      catalog = await loadCatalog();
    } catch (err) {
      console.error(err);
      showCartToast("Missing products.json. Check assets/js/products.json");
      catalog = { lookbook: [], products: [] };
    }

    renderLookbook($("lookbook-list"), catalog.lookbook || []);
    renderShop($("shop-products"), catalog.products || []);

    // ---------- Cart UI + logic ----------
    const floatingCart = $("floating-cart");
    const cartSidebar = $("cart-sidebar");
    const cartOverlay = $("cart-overlay");
    const closeCart = $("close-cart");
    const cartItemsEl = $("cart-items");
    const cartTotalEl = $("cart-total");
    const cartCountEl = $("cart-count");
    const checkoutBtn = $("checkout-btn");

    let cart = loadCartFromStorage();

    function openCart() {
      cartSidebar?.classList.add("active");
      cartOverlay?.classList.add("active");
      document.body.classList.add("lock-scroll");
      setNavHidden(true);
      pushModalState();
    }
    function closeCartPanel() {
      cartSidebar?.classList.remove("active");
      cartOverlay?.classList.remove("active");
      document.body.classList.remove("lock-scroll");
      setNavHidden(false);
      popModalState();
    }

    floatingCart?.addEventListener("click", openCart);
    closeCart?.addEventListener("click", closeCartPanel);
    cartOverlay?.addEventListener("click", closeCartPanel);

    function setCheckoutState() {
      const empty = cart.length === 0;
      if (!checkoutBtn) return;
      checkoutBtn.disabled = empty;
      checkoutBtn.title = empty ? "Add items to checkout" : "Proceed to Checkout";
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

    const checkoutModal = initCheckoutModal(getCartTotals, openModal, closeModal);

    checkoutBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      if (checkoutBtn.disabled) return showCartToast("Add items to checkout.");
      checkoutModal.open();
    });

    function updateCartUI() {
      if (!cartItemsEl || !cartTotalEl || !cartCountEl) return;
      saveCartToStorage(cart);

      cartItemsEl.innerHTML = "";
      const totals = getCartTotals();

      if (cart.length === 0) {
        cartItemsEl.innerHTML =
          '<li style="text-align:center;color:#666;border:none;background:transparent;padding:14px 0;">Your cart is empty</li>';
        cartTotalEl.textContent = "0.00";
        cartCountEl.textContent = "0";
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

        cartItemsEl.appendChild(li);
      });

      cartTotalEl.textContent = totals.total.toFixed(2);
      cartCountEl.textContent = String(totals.itemCount);
      setCheckoutState();
    }

    // Add-to-cart bindings for rendered cards
    function bindProductCards() {
      const cards = Array.from(document.querySelectorAll(".product"));

      cards.forEach((productEl) => {
        const productId = productEl.getAttribute("data-product-id");
        const productData = (catalog.products || []).find((p) => String(p.id) === String(productId));
        if (!productData) return;

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

        productEl.addEventListener("click", (e) => {
          const interactive = e.target.closest("button, input, .color, a, .sizes, .colors, .options");
          if (interactive) return;
          gotoProduct(productData.id);
        });
      });
    }

    bindProductCards();
    updateCartUI();

    // ---------- Routes ----------
    const params = new URLSearchParams(window.location.search);
    const page = params.get("page");

    // nav click behavior
    navLinks.forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href") || "";
        if (!href.includes("#")) return;
        if (page === "lookbook" || page === "product") {
          e.preventDefault();
          window.location.href = "index.html" + href;
        } else {
          e.preventDefault();
          const id = href.replace("#", "");
          scrollToSectionId(id);
          history.replaceState(null, "", `${location.pathname}#${id}`);
        }
      });
    });

    const rlbImg = $("rlb-img");

    const rpp = {
      img: $("rpp-img"),
      thumbs: $("rpp-thumbs"),
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

    function renderLookbookRoute(i) {
      const idx = Math.max(1, parseInt(i || "1", 10));
      const items = catalog.lookbook || [];
      const total = items.length || 1;
      const safeIdx = Math.min(idx, total);
      const item = items[safeIdx - 1] || items[0];
      if (rlbImg) rlbImg.src = item?.image || "";
    }

    function updateRppAddState() {
      const selectedSize = rpp.sizes?.querySelector(".size-btn.selected");
      const selectedColor = rpp.colorsRow?.querySelector(".color.selected");
      if (rpp.add) rpp.add.disabled = !(selectedSize && selectedColor);
    }

    let rppSources = [];
    let rppIndex = 0;
    let rppProduct = null;

    function renderRppThumbs() {
      if (!rpp.thumbs) return;
      rpp.thumbs.innerHTML = "";
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
        rpp.thumbs.appendChild(btn);
      });
    }

    let __rppSwapToken = 0;
    function setRppImage(i) {
      if (!rppSources.length || !rpp.img) return;
      const token = ++__rppSwapToken;

      rppIndex = (i + rppSources.length) % rppSources.length;
      const nextSrc = rppSources[rppIndex];

      rpp.img.style.opacity = "0.25";
      requestAnimationFrame(() => {
        if (token !== __rppSwapToken) return;
        rpp.img.src = nextSrc;
        renderRppThumbs();
        setTimeout(() => {
          if (token !== __rppSwapToken) return;
          rpp.img.style.opacity = "1";
        }, 60);
      });
    }

    function renderSizesToRpp(sizes) {
      if (!rpp.sizes) return;
      rpp.sizes.innerHTML = "";
      (sizes || ["S", "M", "L", "XL"]).forEach((s) => {
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
    }

    function renderColorsToRpp(colors) {
      if (!rpp.colorsRow) return;
      rpp.colorsRow.innerHTML = "";

      (colors || []).forEach((c) => {
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
    }

    async function renderProductRoute(id) {
      const prod = (catalog.products || []).find((p) => String(p.id) === String(id)) || (catalog.products || [])[0];
      if (!prod) return;

      rppProduct = prod;
      rppSources = (prod.images || []).filter(Boolean).slice(0, 4);
      rppIndex = 0;

      if (rpp.label) rpp.label.textContent = prod.label || "";
      if (rpp.name) rpp.name.textContent = prod.name || "Item";
      if (rpp.category) rpp.category.textContent = prod.category || "";
      if (rpp.colorsCount) rpp.colorsCount.textContent = `${(prod.colors || []).length} Colors`;
      if (rpp.price) rpp.price.textContent = formatPriceZAR(prod.price);

      renderSizesToRpp(prod.sizes);
      renderColorsToRpp(prod.colors);
      rppStepper?.setQty?.(1);
      if (rpp.add) rpp.add.disabled = true;

      setRppImage(0);
    }

    if (page === "lookbook") {
      showRoute("lookbook");
      renderLookbookRoute(params.get("i"));
    } else if (page === "product") {
      showRoute("product");
      await renderProductRoute(params.get("id"));
    } else {
      showRoute(null);

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

      let navLock = false;
      let navUnlockTimer = null;

      navLinks.forEach((a) => {
        a.addEventListener("click", (e) => {
          const href = a.getAttribute("href") || "";
          if (!href.includes("#")) return;
          const id = href.split("#")[1];
          if (!id) return;

          e.preventDefault();
          navLock = true;
          clearTimeout(navUnlockTimer);

          setActive(id);
          scrollToSectionId(id);

          navUnlockTimer = setTimeout(() => (navLock = false), 650);
          history.replaceState(null, "", `${location.pathname}#${id}`);
        });
      });

      let raf = null;
      const updateActiveFromScroll = () => {
        if (navLock) return;
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

      const hashId = (location.hash || "").replace("#", "");
      if (hashId && ["drop", "lookbook", "shop", "about", "footer"].includes(hashId)) {
        setTimeout(() => {
          scrollToSectionId(hashId);
          setActive(hashId === "footer" ? "about" : hashId);
        }, 30);
      }
    }

    // Product route add to cart
    rpp.add?.addEventListener("click", () => {
      if (!rppProduct) return;

      const selectedSize = rpp.sizes?.querySelector(".size-btn.selected");
      const selectedColor = rpp.colorsRow?.querySelector(".color.selected");
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

    // ---------- Signup popup when Shop is reached ----------
    const signupModal = initSignupModal(openModal, closeModal);

    function alreadySignedUp() {
      try {
        return !!localStorage.getItem(SIGNUP_KEY);
      } catch {
        return false;
      }
    }

    if (!page && !alreadySignedUp()) {
      const shopSection = document.getElementById("shop");
      if (shopSection && "IntersectionObserver" in window) {
        const obs = new IntersectionObserver(
          (entries) => {
            const hit = entries.some((e) => e.isIntersecting);
            if (hit && !alreadySignedUp()) {
              signupModal.open();
              obs.disconnect();
            }
          },
          { threshold: 0.35 }
        );
        obs.observe(shopSection);
      }
    }

    // ---------- Back gesture: close open layers first ----------
    window.addEventListener("popstate", () => {
      if ($("signup-modal")?.style.display === "block") return signupModal.close();
      if ($("checkout-modal")?.style.display === "block") return checkoutModal.close();
      if ($("policy-modal")?.style.display === "block") return policies.close();
      if ($("cart-sidebar")?.classList.contains("active")) return closeCartPanel();
      if (drawer?.classList.contains("open")) return closeDrawer();
    });

    // ESC handling
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;

      if (drawer?.classList.contains("open")) closeDrawer();
      if ($("policy-modal")?.style.display === "block") policies.close();
      if ($("checkout-modal")?.style.display === "block") checkoutModal.close();
      if ($("signup-modal")?.style.display === "block") signupModal.close();
      if ($("cart-sidebar")?.classList.contains("active")) closeCartPanel();
    });
  });
})();