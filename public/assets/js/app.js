(function () {
  "use strict";

  const CART_STORAGE_KEY = "faide_cart_v2";

  function $(sel, root = document) {
    return root.querySelector(sel);
  }
  function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function clickOnEnterSpace(el, fn) {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn();
      }
    });
  }

  function showToast(message) {
    const toast = $("#cartToast");
    const messageEl = $("#cartMessage");
    if (!toast || !messageEl) return;
    messageEl.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  function saveCart(cart) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart || []));
    } catch {}
  }

  function formatMoneyZAR(amount) {
    const n = Number(amount || 0);
    return `R${n.toFixed(2)}`;
  }

  function getNavOffsetPx() {
    const nav = $(".navbar");
    const navH = nav?.getBoundingClientRect?.().height || 86;
    return Math.round(navH + 18);
  }

  function scrollToSectionId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.pageYOffset - getNavOffsetPx();
    window.scrollTo({ top, behavior: "smooth" });
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
    const site = $("#site-content");
    const rlb = $("#route-lookbook");
    const rpp = $("#route-product");

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

    incBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      step(+1);
    });
    decBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      step(-1);
    });

    render();
    return { getQty: () => qty, setQty };
  }

  function colorClassFromName(name) {
    const v = String(name || "").toLowerCase();
    if (v.includes("black")) return "black";
    if (v.includes("white")) return "white";
    if (v.includes("grey") || v.includes("gray")) return "grey";
    return "grey";
  }

  async function fetchCatalog() {
    const res = await fetch("/assets/js/products.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load products.json");
    return await res.json();
  }

  function renderLookbook(lookbook) {
    const list = $("#lookbook-list");
    if (!list) return;
    list.innerHTML = "";

    (lookbook || []).forEach((src, idx) => {
      const card = document.createElement("div");
      card.className = "lookbook-card";
      card.setAttribute("data-look", String(idx + 1));
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `Open Lookbook ${idx + 1}`);
      card.innerHTML = `<img src="${src}" alt="FAIDE Lookbook ${idx + 1}" class="lookbook-img" loading="lazy" />`;
      const go = () => gotoLookbook(idx + 1);
      card.addEventListener("click", go);
      clickOnEnterSpace(card, go);
      list.appendChild(card);
    });
  }

  function renderShop(products) {
    const wrap = $("#shop-products");
    if (!wrap) return;
    wrap.innerHTML = "";

    (products || []).forEach((p, i) => {
      const id = p.id || String(i + 1);
      const mainImg = (p.images && p.images[0]) ? p.images[0] : "/images/hero.png";

      const card = document.createElement("div");
      card.className = "product";
      card.setAttribute("data-product-id", id);
      card.setAttribute("data-name", p.name || "Item");
      card.setAttribute("data-price", String(p.price || 0));

      const colorsCount = Array.isArray(p.colors) ? `${p.colors.length} Colors` : "";
      const priceText = formatMoneyZAR(p.price || 0);

      card.innerHTML = `
        <div class="product-img-container">
          <img src="${mainImg}" alt="${p.name || "Product"}" class="product-img" loading="lazy" />
        </div>

        <div class="product-info">
          <div class="product-label">${p.label || "New"}</div>

          <div class="product-header">
            <div class="product-name-wrapper">
              <h3>${p.name || "Product"}</h3>
              <div class="product-category">${p.category || ""}</div>
              <div class="product-colors-count">${colorsCount}</div>
            </div>
            <p class="price">${priceText}</p>
          </div>

          <div class="options" aria-label="${p.name || "Product"} options">
            <div class="option-label">Select Size</div>
            <div class="sizes">
              ${(p.sizes || ["S","M","L","XL"]).map(s => `<button type="button" class="size-btn" data-size="${s}">${s}</button>`).join("")}
            </div>

            <div class="option-label">Select Color</div>
            <div class="colors">
              ${(p.colors || ["Black","White"]).map(c => {
                const klass = colorClassFromName(c);
                return `<div class="color ${klass}" role="button" tabindex="0" aria-label="${c}" data-color="${c}"></div>`;
              }).join("")}
            </div>

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

      wrap.appendChild(card);
    });
  }

  // Policies
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
        <p style="margin-bottom:14px;">You can request to update or delete your information by contacting us at <a href="mailto:faideclothingsa@gmail.com">faideclothingsa@gmail.com</a>.</p>
      `
    },
    terms: {
      title: "Terms of Service",
      content: `
        <p style="margin-bottom:14px;"><strong>FAIDE Terms of Service</strong></p>
        <p style="margin-bottom:14px;">By using this website and placing an order, you agree to the terms below.</p>
        <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Orders</h3>
        <ul style="margin-left:18px; margin-bottom:14px;">
          <li>Orders are paid via card checkout (Stripe).</li>
          <li>We may contact you if we need size/color confirmation or address clarification.</li>
        </ul>
        <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Pricing</h3>
        <p style="margin-bottom:14px;">Prices are listed in ZAR (R). We reserve the right to correct errors and update pricing.</p>
        <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Availability</h3>
        <p style="margin-bottom:14px;">Stock availability may change. If an item is unavailable, we’ll offer an alternative or refund.</p>
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
        <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">How to request</h3>
        <p style="margin-bottom:14px;">Contact us via email with your order details.</p>
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
        <p style="margin-bottom:14px;">Questions? Email <a href="mailto:faideclothingsa@gmail.com">faideclothingsa@gmail.com</a></p>
      `
    }
  };

  function setupPolicies() {
    const policyModal = $("#policy-modal");
    const modalTitle = $("#modal-title");
    const modalContent = $("#modal-content");
    const closeModal = $("#close-modal");

    let lastFocusedEl = null;

    function showPolicy(type) {
      const policy = policies[type];
      if (!policy) return;
      lastFocusedEl = document.activeElement;
      if (modalTitle) modalTitle.textContent = policy.title;
      if (modalContent) modalContent.innerHTML = policy.content;
      if (policyModal) policyModal.style.display = "block";
      document.body.classList.add("lock-scroll");
      setTimeout(() => closeModal?.focus(), 0);
    }

    function hidePolicy() {
      if (policyModal) policyModal.style.display = "none";
      document.body.classList.remove("lock-scroll");
      if (lastFocusedEl && typeof lastFocusedEl.focus === "function") lastFocusedEl.focus();
    }

    function bind(id, fn) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        fn();
      });
    }

    bind("privacy-link", () => showPolicy("privacy"));
    bind("terms-link", () => showPolicy("terms"));
    bind("returns-link", () => showPolicy("returns"));
    bind("shipping-link", () => showPolicy("shipping"));

    closeModal?.addEventListener("click", hidePolicy);
    policyModal?.addEventListener("click", (e) => {
      if (e.target === policyModal) hidePolicy();
    });

    return { hidePolicy, policyModal };
  }

  async function stripeCheckout(cart, currency = "zar") {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart, currency })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Checkout failed");
    if (!data?.url) throw new Error("No checkout URL");
    window.location.href = data.url;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    // Navbar shrink
    const navbar = $(".navbar");
    function handleShrink() {
      if (!navbar) return;
      navbar.classList.toggle("shrink", window.scrollY > 20);
    }
    handleShrink();
    window.addEventListener("scroll", handleShrink, { passive: true });

    // Mobile panels
    const navLinks = $all('[data-nav-link="main"]');
    const searchBtn = $("#mobile-search-btn");
    const menuBtn = $("#mobile-menu-btn");
    const searchPanel = $("#mobile-search-panel");
    const menuPanel = $("#mobile-menu-panel");
    const searchInput = $("#mobile-search-input");

    const closeMobilePanels = () => {
      if (searchPanel) { searchPanel.classList.remove("open"); searchPanel.setAttribute("aria-hidden", "true"); }
      if (menuPanel) { menuPanel.classList.remove("open"); menuPanel.setAttribute("aria-hidden", "true"); }
      searchBtn?.setAttribute("aria-expanded", "false");
      menuBtn?.setAttribute("aria-expanded", "false");
    };

    const openSearch = () => {
      if (menuPanel?.classList.contains("open")) {
        menuPanel.classList.remove("open");
        menuPanel.setAttribute("aria-hidden", "true");
        menuBtn?.setAttribute("aria-expanded", "false");
      }
      if (!searchPanel) return;
      const willOpen = !searchPanel.classList.contains("open");
      searchPanel.classList.toggle("open");
      searchPanel.setAttribute("aria-hidden", willOpen ? "false" : "true");
      searchBtn?.setAttribute("aria-expanded", willOpen ? "true" : "false");
      if (willOpen) setTimeout(() => searchInput?.focus(), 60);
    };

    const openMenu = () => {
      if (searchPanel?.classList.contains("open")) {
        searchPanel.classList.remove("open");
        searchPanel.setAttribute("aria-hidden", "true");
        searchBtn?.setAttribute("aria-expanded", "false");
      }
      if (!menuPanel) return;
      const willOpen = !menuPanel.classList.contains("open");
      menuPanel.classList.toggle("open");
      menuPanel.setAttribute("aria-hidden", willOpen ? "false" : "true");
      menuBtn?.setAttribute("aria-expanded", willOpen ? "true" : "false");
    };

    searchBtn?.addEventListener("click", openSearch);
    menuBtn?.addEventListener("click", openMenu);
    navLinks.forEach((a) => a.addEventListener("click", () => closeMobilePanels()));

    // Shop now button
    $("#shop-now-btn")?.addEventListener("click", () => scrollToSectionId("shop"));

    // Policies
    const { hidePolicy, policyModal } = setupPolicies();

    // Load products
    let catalog;
    try {
      catalog = await fetchCatalog();
    } catch (e) {
      showToast("Products failed to load.");
      console.error(e);
      catalog = { currency: "zar", products: [], lookbook: [] };
    }

    const currency = (catalog.currency || "zar").toLowerCase();
    renderLookbook(catalog.lookbook || []);
    renderShop(catalog.products || []);

    // Cart
    let cart = loadCart();

    const floatingCart = $("#floating-cart");
    const cartSidebar = $("#cart-sidebar");
    const cartOverlay = $("#cart-overlay");
    const closeCart = $("#close-cart");
    const cartItemsEl = $("#cart-items");
    const cartTotalEl = $("#cart-total");
    const cartCountEl = $("#cart-count");
    const checkoutBtn = $("#checkout-btn");

    function openCart() {
      cartSidebar?.classList.add("active");
      cartOverlay?.classList.add("active");
      document.body.classList.add("lock-scroll");
    }
    function closeCartPanel() {
      cartSidebar?.classList.remove("active");
      cartOverlay?.classList.remove("active");
      document.body.classList.remove("lock-scroll");
    }

    floatingCart?.addEventListener("click", openCart);
    closeCart?.addEventListener("click", closeCartPanel);
    cartOverlay?.addEventListener("click", closeCartPanel);

    function setCheckoutState() {
      const empty = cart.length === 0;
      if (!checkoutBtn) return;
      checkoutBtn.disabled = empty;
      checkoutBtn.title = empty ? "Add items to checkout" : "Pay by card (secure checkout)";
    }

    function updateCartUI() {
      saveCart(cart);

      if (!cartItemsEl || !cartTotalEl || !cartCountEl) return;

      cartItemsEl.innerHTML = "";
      let total = 0;
      let itemCount = 0;

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
        total += lineTotal;
        itemCount += item.quantity;

        const li = document.createElement("li");
        li.className = "cart-item";
        li.innerHTML = `
          <img class="cart-item-img" src="${item.image || ""}" alt="${item.name}" onerror="this.style.display='none';" />
          <div class="cart-item-info">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-meta">Size: ${item.size} • Color: ${item.color}</div>
            <div class="cart-item-price">${formatMoneyZAR(lineTotal)}</div>
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

      cartTotalEl.textContent = total.toFixed(2);
      cartCountEl.textContent = String(itemCount);
      setCheckoutState();
    }

    updateCartUI();

    // Checkout → Stripe
    checkoutBtn?.addEventListener("click", async (e) => {
      e.preventDefault();
      if (checkoutBtn.disabled) return showToast("Add items to checkout.");

      try {
        await stripeCheckout(cart, currency);
      } catch (err) {
        console.error(err);
        showToast(String(err?.message || "Checkout unavailable. Please try again."));
      }
    });

    // Card interactions: size/color/qty/add
    const productEls = $all(".product");
    productEls.forEach((productEl) => {
      const stepperRoot = productEl.querySelector('.qty-stepper-ui[data-qty-root="card"]');
      const stepper = stepperRoot ? setupQtyStepper(stepperRoot) : null;

      const sizeButtons = $all(".size-btn", productEl);
      const colorOptions = $all(".color", productEl);
      const addToCartBtn = $(".add-to-cart", productEl);

      const updateAddBtn = () => {
        const selectedSize = $(".size-btn.selected", productEl);
        const selectedColor = $(".color.selected", productEl);
        if (addToCartBtn) addToCartBtn.disabled = !(selectedSize && selectedColor);
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

        const productId = productEl.getAttribute("data-product-id") || "item";
        const productName = productEl.getAttribute("data-name") || "Item";
        const price = parseFloat(productEl.getAttribute("data-price") || "0");

        const selectedSize = $(".size-btn.selected", productEl);
        const selectedColor = $(".color.selected", productEl);
        if (!selectedSize) return showToast("Select a size first.");
        if (!selectedColor) return showToast("Select a color first.");

        let quantity = stepper?.getQty?.() ?? 1;
        quantity = Math.max(1, Number.isFinite(quantity) ? quantity : 1);

        const size = selectedSize.textContent.trim();
        const colorName = selectedColor.getAttribute("data-color") || "Color";
        const image = $(".product-img", productEl)?.getAttribute("src") || "";

        const key = `${productId}-${size}-${colorName}`;
        const existing = cart.find((x) => x.key === key);

        if (existing) existing.quantity += quantity;
        else cart.push({ key, id: productId, name: productName, price, size, color: colorName, quantity, image });

        updateCartUI();
        showToast(`Added ${quantity}x ${productName} (${size}) in ${colorName}`);
        stepper?.setQty?.(1);
      });

      // Clicking product card opens product page (but ignore UI clicks)
      productEl.addEventListener("click", (e) => {
        const interactive = e.target.closest("button, input, .color, a, .sizes, .colors, .options");
        if (interactive) return;
        gotoProduct(productEl.getAttribute("data-product-id") || "1");
      });
    });

    // Lookbook routing
    $all(".lookbook-card").forEach((card) => {
      const go = () => gotoLookbook(card.getAttribute("data-look") || "1");
      card.addEventListener("click", go);
      clickOnEnterSpace(card, go);
    });

    // Search (mobile): filters products by name/category
    searchInput?.addEventListener("input", () => {
      const q = (searchInput.value || "").trim().toLowerCase();
      productEls.forEach((el) => {
        const name = (el.getAttribute("data-name") || "").toLowerCase();
        const cat = ($(".product-category", el)?.textContent || "").toLowerCase();
        const show = !q || name.includes(q) || cat.includes(q);
        el.style.display = show ? "" : "none";
      });
    });

    // Routes: lookbook / product / default
    const params = new URLSearchParams(window.location.search);
    const page = params.get("page");

    // nav link behavior
    navLinks.forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href") || "";
        if (!href.includes("#")) return;
        if (page === "lookbook" || page === "product") {
          e.preventDefault();
          window.location.href = href;
        }
      });
    });

    // Route renderers
    async function renderLookbookRoute(i) {
      const idx = Math.max(1, parseInt(i || "1", 10));
      const srcs = catalog.lookbook || [];
      const total = srcs.length || 1;
      const safeIdx = Math.min(idx, total);
      const src = srcs[safeIdx - 1] || srcs[0] || "/images/hero.png";
      const img = $("#rlb-img");
      const counter = $("#rlb-counter");
      if (img) img.src = src;
      if (counter) counter.textContent = `${safeIdx} / ${total}`;
    }

    function getProductById(id) {
      const list = catalog.products || [];
      return list.find((p) => String(p.id) === String(id)) || list[0] || null;
    }

    function renderRppColors(colors) {
      const row = $("#rpp-colors-row");
      if (!row) return;
      row.innerHTML = "";
      (colors || []).forEach((c) => {
        const div = document.createElement("div");
        div.className = `color ${colorClassFromName(c)}`;
        div.setAttribute("role", "button");
        div.setAttribute("tabindex", "0");
        div.setAttribute("aria-label", c);
        div.setAttribute("data-color", c);

        const select = () => {
          $all(".color", row).forEach((x) => x.classList.remove("selected"));
          div.classList.add("selected");
          updateRppAddState();
        };

        div.addEventListener("click", select);
        clickOnEnterSpace(div, select);
        row.appendChild(div);
      });
    }

    function renderRppSizes(sizes) {
      const wrap = $("#rpp-sizes");
      if (!wrap) return;
      wrap.innerHTML = "";
      (sizes || []).forEach((s) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "size-btn";
        btn.textContent = s;
        btn.addEventListener("click", () => {
          $all(".size-btn", wrap).forEach((x) => x.classList.remove("selected"));
          btn.classList.add("selected");
          updateRppAddState();
        });
        wrap.appendChild(btn);
      });
    }

    let rppSources = [];
    let rppIndex = 0;
    let rppProduct = null;

    function renderRppThumbs() {
      const thumbs = $("#rpp-thumbs");
      if (!thumbs) return;
      thumbs.innerHTML = "";
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
        thumbs.appendChild(btn);
      });
    }

    function setRppImage(i) {
      const img = $("#rpp-img");
      const subtitle = $("#rpp-subtitle");
      if (!img || !rppSources.length) return;
      rppIndex = (i + rppSources.length) % rppSources.length;
      const nextSrc = rppSources[rppIndex];

      img.style.opacity = "0.25";
      requestAnimationFrame(() => {
        img.src = nextSrc;
        if (subtitle) subtitle.textContent = `${rppIndex + 1} / ${rppSources.length}`;
        renderRppThumbs();
        setTimeout(() => (img.style.opacity = "1"), 60);
      });
    }

    function updateRppAddState() {
      const sizes = $("#rpp-sizes");
      const colors = $("#rpp-colors-row");
      const add = $("#rpp-add");
      const selectedSize = sizes?.querySelector(".size-btn.selected");
      const selectedColor = colors?.querySelector(".color.selected");
      if (add) add.disabled = !(selectedSize && selectedColor);
    }

    async function renderProductRoute(id) {
      rppProduct = getProductById(id);
      if (!rppProduct) return;

      $("#rpp-label").textContent = rppProduct.label || "";
      $("#rpp-name").textContent = rppProduct.name || "Product";
      $("#rpp-category").textContent = rppProduct.category || "";
      $("#rpp-colors").textContent = Array.isArray(rppProduct.colors) ? `${rppProduct.colors.length} Colors` : "";
      $("#rpp-price").textContent = formatMoneyZAR(rppProduct.price || 0);

      renderRppSizes(rppProduct.sizes || ["S","M","L","XL"]);
      renderRppColors(rppProduct.colors || ["Black","White"]);

      rppSources = (rppProduct.images || []).filter(Boolean);
      if (!rppSources.length) rppSources = ["/images/hero.png"];
      setRppImage(0);

      const add = $("#rpp-add");
      add.disabled = true;
    }

    // Route decision
    if (page === "lookbook") {
      showRoute("lookbook");
      await renderLookbookRoute(params.get("i"));
    } else if (page === "product") {
      showRoute("product");
      await renderProductRoute(params.get("id"));
    } else {
      showRoute(null);

      // Active nav tracking
      const sectionIds = ["drop", "lookbook", "shop", "about"];
      const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

      function setActive(id) {
        navLinks.forEach((a) => {
          a.classList.remove("active");
          a.removeAttribute("aria-current");
        });
        navLinks
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

      // Checkout success/cancel message
      const checkoutState = params.get("checkout");
      if (checkoutState === "success") showToast("Payment successful! Thank you for your order.");
      if (checkoutState === "cancel") showToast("Checkout cancelled.");
    }

    // Add from product route
    const rppStepperRoot = document.querySelector('.qty-stepper-ui[data-qty-root="rpp"]');
    const rppStepper = rppStepperRoot ? setupQtyStepper(rppStepperRoot) : null;

    $("#rpp-add")?.addEventListener("click", () => {
      if (!rppProduct) return;

      const size = $("#rpp-sizes")?.querySelector(".size-btn.selected")?.textContent?.trim();
      const color = $("#rpp-colors-row")?.querySelector(".color.selected")?.getAttribute("data-color");

      if (!size) return showToast("Select a size first.");
      if (!color) return showToast("Select a color first.");

      let quantity = rppStepper?.getQty?.() ?? 1;
      quantity = Math.max(1, Number.isFinite(quantity) ? quantity : 1);

      const key = `${rppProduct.id}-${size}-${color}`;
      const existing = cart.find((x) => x.key === key);

      const image = rppSources[rppIndex] || (rppProduct.images?.[0] || "/images/hero.png");
      const price = Number(rppProduct.price || 0);

      if (existing) existing.quantity += quantity;
      else cart.push({ key, id: rppProduct.id, name: rppProduct.name, price, size, color, quantity, image });

      updateCartUI();
      showToast(`Added ${quantity}x ${rppProduct.name} (${size}) in ${color}`);
    });

    // ESC closes panels/modals/cart
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;

      if (searchPanel?.classList.contains("open") || menuPanel?.classList.contains("open")) {
        closeMobilePanels();
        return;
      }
      if (policyModal && policyModal.style.display === "block") hidePolicy();
      if (cartSidebar?.classList.contains("active")) closeCartPanel();
    });
  });
})();