(() => {
  "use strict";

  // ---------- Helpers ----------
  function qs(sel, root = document) {
    return root.querySelector(sel);
  }
  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }
  function moneyZAR(n) {
    const v = Number(n || 0);
    return v.toFixed(2);
  }
  function clickOnEnterSpace(el, fn) {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn();
      }
    });
  }

  // ---------- Config ----------
  const WHATSAPP_NUMBER = "27695603929";
  const CART_STORAGE_KEY = "faide_cart_v2";
  const PRODUCTS_URL = "/assets/js/products.json";

  // ---------- UI refs ----------
  const navbar = qs(".navbar");
  const navLinks = qsa('[data-nav-link="main"]');

  const searchBtn = qs("#mobile-search-btn");
  const menuBtn = qs("#mobile-menu-btn");
  const searchPanel = qs("#mobile-search-panel");
  const menuPanel = qs("#mobile-menu-panel");
  const searchInput = qs("#mobile-search-input");

  const productsContainer = qs("#products-container");

  const floatingCart = qs("#floating-cart");
  const cartSidebar = qs("#cart-sidebar");
  const cartOverlay = qs("#cart-overlay");
  const closeCartBtn = qs("#close-cart");
  const cartItemsEl = qs("#cart-items");
  const cartTotalEl = qs("#cart-total");
  const cartCountEl = qs("#cart-count");
  const checkoutBtn = qs("#checkout-btn");

  const toast = qs("#cartToast");
  const toastMsg = qs("#cartMessage");

  // Policies modal
  const policyModal = qs("#policy-modal");
  const modalTitle = qs("#modal-title");
  const modalContent = qs("#modal-content");
  const closeModal = qs("#close-modal");

  // Checkout modal
  const checkoutModal = qs("#checkout-modal");
  const checkoutModalTotal = qs("#checkout-modal-total");
  const closeCheckoutModalBtn = qs("#close-checkout-modal");
  const checkoutWhatsappBtn = qs("#checkout-whatsapp-btn");
  const paypalBoxId = "#paypal-buttons";

  // Routes
  const siteContent = qs("#site-content");
  const routeLookbook = qs("#route-lookbook");
  const routeProduct = qs("#route-product");
  const rlbImg = qs("#rlb-img");
  const rlbCounter = qs("#rlb-counter");

  const rpp = {
    img: qs("#rpp-img"),
    thumbs: qs("#rpp-thumbs"),
    subtitle: qs("#rpp-subtitle"),
    label: qs("#rpp-label"),
    name: qs("#rpp-name"),
    category: qs("#rpp-category"),
    colorsCount: qs("#rpp-colors"),
    price: qs("#rpp-price"),
    sizes: qs("#rpp-sizes"),
    colorsRow: qs("#rpp-colors-row"),
    add: qs("#rpp-add")
  };

  // ---------- State ----------
  let products = [];
  let cart = [];
  let paypalRendered = false;

  // Product route state
  let rppActiveProduct = null;
  let rppSources = [];
  let rppIndex = 0;

  // ---------- Toast ----------
  function showToast(message) {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // ---------- Storage ----------
  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  function saveCart(next) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next || []));
    } catch {}
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
      if (onChange) onChange(qty);
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

  // ---------- Navigation ----------
  function getNavOffsetPx() {
    const navH = navbar?.getBoundingClientRect?.().height || 86;
    return Math.round(navH + 18);
  }

  function scrollToSectionId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.pageYOffset - getNavOffsetPx();
    window.scrollTo({ top, behavior: "smooth" });
  }

  function closeMobilePanels() {
    if (searchPanel) {
      searchPanel.classList.remove("open");
      searchPanel.setAttribute("aria-hidden", "true");
    }
    if (menuPanel) {
      menuPanel.classList.remove("open");
      menuPanel.setAttribute("aria-hidden", "true");
    }
    searchBtn?.setAttribute("aria-expanded", "false");
    menuBtn?.setAttribute("aria-expanded", "false");
  }

  function openSearch() {
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
  }

  function openMenu() {
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
  }

  function handleShrink() {
    if (!navbar) return;
    navbar.classList.toggle("shrink", window.scrollY > 20);
  }

  // ---------- Cart ----------
  function computeCartTotal(cartArr) {
    return (cartArr || []).reduce((sum, item) => {
      const price = Number(item.price || 0);
      const qty = Math.max(1, Number(item.quantity || 1));
      return sum + price * qty;
    }, 0);
  }

  function setCheckoutState() {
    const empty = cart.length === 0;
    if (!checkoutBtn) return;
    checkoutBtn.disabled = empty;
    checkoutBtn.title = empty ? "Add items to checkout" : "Proceed to payment";
  }

  function openCart() {
    cartSidebar?.classList.add("active");
    cartOverlay?.classList.add("active");
    document.body.classList.add("lock-scroll");
  }
  function closeCart() {
    cartSidebar?.classList.remove("active");
    cartOverlay?.classList.remove("active");
    document.body.classList.remove("lock-scroll");
  }

  function updateCartUI() {
    if (!cartItemsEl || !cartTotalEl || !cartCountEl) return;

    saveCart(cart);

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

    cartTotalEl.textContent = total.toFixed(2);
    cartCountEl.textContent = String(itemCount);
    setCheckoutState();
  }

  function addToCart({ product, size, color, quantity, image }) {
    const key = `${product.id}-${size}-${color}`;
    const existing = cart.find((x) => x.key === key);

    if (existing) existing.quantity += quantity;
    else {
      cart.push({
        key,
        id: product.id,
        name: product.name,
        price: Number(product.price),
        size,
        color,
        quantity,
        image: image || (product.images?.[0] || "")
      });
    }

    updateCartUI();
    showToast(`Added ${quantity}x ${product.name} (${size}) in ${color}`);
  }

  // ---------- WhatsApp checkout ----------
  function checkoutOnWhatsApp() {
    if (!cart || cart.length === 0) return showToast("Your cart is empty.");

    const lines = ["Hi FAIDE, I want to place an order:", ""];
    let total = 0;

    cart.forEach((item, i) => {
      const lineTotal = item.price * item.quantity;
      total += lineTotal;
      lines.push(
        `${i + 1}) ${item.name} | Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity} | R${lineTotal.toFixed(2)}`
      );
    });

    lines.push("", `TOTAL: R${total.toFixed(2)}`, "", "Name:", "(Type here)", "", "Delivery address:", "(Type here)");

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // ---------- Checkout Modal + PayPal ----------
  function openCheckoutModal() {
    if (!checkoutModal) return;
    if (!cart || cart.length === 0) return showToast("Your cart is empty.");

    const total = computeCartTotal(cart);
    if (checkoutModalTotal) checkoutModalTotal.textContent = total.toFixed(2);

    checkoutModal.style.display = "block";
    document.body.classList.add("lock-scroll");

    // Render PayPal once
    if (!paypalRendered) {
      const wait = setInterval(() => {
        if (window.paypal && typeof window.paypal.Buttons === "function") {
          clearInterval(wait);

          window.paypal
            .Buttons({
              createOrder: async () => {
                const resp = await fetch("/api/paypal-create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ cart, currency: "ZAR" })
                });

                const data = await resp.json();
                if (!resp.ok || !data.id) {
                  throw new Error(data?.error || "Failed to create PayPal order");
                }
                return data.id;
              },

              onApprove: async (data) => {
                const resp = await fetch("/api/paypal-capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderID: data.orderID })
                });

                const result = await resp.json();
                if (!resp.ok) throw new Error(result?.error || "Failed to capture payment");

                // Clear cart
                cart = [];
                updateCartUI();
                hideCheckoutModal();

                showToast("Payment successful ✅ Order received!");
                // Optional redirect:
                // window.location.href = "/success.html";
              },

              onError: (err) => {
                console.error(err);
                showToast("PayPal error. Please try again.");
              }
            })
            .render(paypalBoxId);

          paypalRendered = true;
        }
      }, 60);

      setTimeout(() => clearInterval(wait), 5000);
    }
  }

  function hideCheckoutModal() {
    if (!checkoutModal) return;
    checkoutModal.style.display = "none";
    document.body.classList.remove("lock-scroll");
  }

  // ---------- Policies ----------
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
        <p style="margin-bottom:14px;">You can request to update or delete your information by contacting us at
          <a style="color:var(--primary); text-decoration:none;" href="mailto:faideclothingsa@gmail.com">faideclothingsa@gmail.com</a>.
        </p>
      `
    },
    terms: {
      title: "Terms of Service",
      content: `
        <p style="margin-bottom:14px;"><strong>FAIDE Terms of Service</strong></p>
        <p style="margin-bottom:14px;">By using this website and placing an order, you agree to the terms below.</p>
        <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Orders</h3>
        <ul style="margin-left:18px; margin-bottom:14px;">
          <li>Orders can be paid via PayPal or confirmed via WhatsApp checkout.</li>
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
        <p style="margin-bottom:14px;">Contact us on WhatsApp or email with your order details.</p>
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
        <p style="margin-bottom:14px;">Questions? Email
          <a style="color:var(--primary); text-decoration:none;" href="mailto:faideclothingsa@gmail.com">faideclothingsa@gmail.com</a>
        </p>
      `
    }
  };

  let lastFocusedEl = null;
  function showPolicy(type) {
    const pol = policies[type];
    if (!pol) return;

    lastFocusedEl = document.activeElement;
    if (modalTitle) modalTitle.textContent = pol.title;
    if (modalContent) modalContent.innerHTML = pol.content;

    if (policyModal) policyModal.style.display = "block";
    document.body.classList.add("lock-scroll");
    setTimeout(() => closeModal?.focus(), 0);
  }

  function hidePolicy() {
    if (policyModal) policyModal.style.display = "none";
    document.body.classList.remove("lock-scroll");
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") lastFocusedEl.focus();
  }

  // ---------- Routing ----------
  function toQueryUrl(params) {
    const url = new URL(window.location.href);
    url.hash = "";
    Object.keys(params).forEach((k) => {
      if (params[k] == null || params[k] === "") url.searchParams.delete(k);
      else url.searchParams.set(k, String(params[k]));
    });
    const qsStr = url.searchParams.toString();
    return qsStr ? url.pathname + "?" + qsStr : url.pathname;
  }

  function showRoute(page) {
    routeLookbook?.classList.remove("active");
    routeProduct?.classList.remove("active");
    routeLookbook?.setAttribute("aria-hidden", "true");
    routeProduct?.setAttribute("aria-hidden", "true");
    if (siteContent) siteContent.style.display = "block";

    if (page === "lookbook") {
      if (siteContent) siteContent.style.display = "none";
      routeLookbook?.classList.add("active");
      routeLookbook?.setAttribute("aria-hidden", "false");
    } else if (page === "product") {
      if (siteContent) siteContent.style.display = "none";
      routeProduct?.classList.add("active");
      routeProduct?.setAttribute("aria-hidden", "false");
    }
  }

  function gotoLookbook(i) {
    window.location.href = toQueryUrl({ page: "lookbook", i });
  }
  function gotoProduct(id) {
    window.location.href = toQueryUrl({ page: "product", id });
  }

  function renderLookbookRoute(i) {
    const idx = Math.max(1, parseInt(i || "1", 10));
    const cards = qsa(".lookbook-card");
    const total = cards.length || 1;
    const safeIdx = Math.min(idx, total);

    const card = cards[safeIdx - 1] || cards[0];
    const src = card?.querySelector("img")?.getAttribute("src") || "";

    if (rlbImg) rlbImg.src = src;
    if (rlbCounter) rlbCounter.textContent = `${safeIdx} / ${total}`;
  }

  function renderSizesInRpp(product) {
    if (!rpp.sizes) return;
    rpp.sizes.innerHTML = "";
    (product.sizes || ["S", "M", "L", "XL"]).forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "size-btn";
      btn.textContent = s;

      btn.addEventListener("click", () => {
        qsa(".size-btn", rpp.sizes).forEach((x) => x.classList.remove("selected"));
        btn.classList.add("selected");
        updateRppAddState();
      });

      rpp.sizes.appendChild(btn);
    });
  }

  function renderColorsInRpp(product) {
    if (!rpp.colorsRow) return;
    rpp.colorsRow.innerHTML = "";

    const colors = product.colors || ["Black", "White"];
    colors.forEach((name) => {
      const div = document.createElement("div");
      div.className = "color " + name.toLowerCase();
      div.setAttribute("role", "button");
      div.setAttribute("tabindex", "0");
      div.setAttribute("aria-label", name);
      div.setAttribute("data-color", name);

      const select = () => {
        qsa(".color", rpp.colorsRow).forEach((x) => x.classList.remove("selected"));
        div.classList.add("selected");
        updateRppAddState();
      };

      div.addEventListener("click", (e) => {
        e.preventDefault();
        select();
      });
      clickOnEnterSpace(div, select);

      rpp.colorsRow.appendChild(div);
    });
  }

  function fillRppMeta(product) {
    if (!product) return;
    rpp.label.textContent = product.label || "";
    rpp.name.textContent = product.name || "Item";
    rpp.category.textContent = product.category || "";
    rpp.colorsCount.textContent = `${(product.colors || []).length || 0} Colors`;
    rpp.price.textContent = `R${moneyZAR(product.price)}`;
    if (rpp.add) rpp.add.disabled = true;
  }

  function updateRppAddState() {
    const selectedSize = rpp.sizes?.querySelector(".size-btn.selected");
    const selectedColor = rpp.colorsRow?.querySelector(".color.selected");
    if (rpp.add) rpp.add.disabled = !(selectedSize && selectedColor);
  }

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

  function setRppImage(i) {
    if (!rppSources.length || !rpp.img) return;
    rppIndex = (i + rppSources.length) % rppSources.length;

    const nextSrc = rppSources[rppIndex];
    rpp.img.style.opacity = "0.25";
    requestAnimationFrame(() => {
      rpp.img.src = nextSrc;
      if (rpp.subtitle) rpp.subtitle.textContent = `${rppIndex + 1} / ${rppSources.length}`;
      renderRppThumbs();
      setTimeout(() => (rpp.img.style.opacity = "1"), 70);
    });
  }

  async function renderProductRoute(id) {
    const pid = parseInt(id || "1", 10);
    const product = products.find((p) => Number(p.id) === pid) || products[0];
    if (!product) return;

    rppActiveProduct = product;
    rppSources = Array.isArray(product.images) && product.images.length ? product.images.slice(0, 4) : [];
    rppIndex = 0;

    fillRppMeta(product);
    renderSizesInRpp(product);
    renderColorsInRpp(product);

    if (rpp.img) rpp.img.src = rppSources[0] || "";
    if (rpp.subtitle) rpp.subtitle.textContent = `${rppSources.length ? 1 : 0} / ${rppSources.length || 0}`;
    renderRppThumbs();
    updateRppAddState();
  }

  // ---------- Product rendering ----------
  function colorDotClass(colorName) {
    const c = String(colorName || "").toLowerCase();
    if (c.includes("black")) return "black";
    if (c.includes("white")) return "white";
    if (c.includes("grey") || c.includes("gray")) return "grey";
    return "grey";
  }

  function makeProductCard(product) {
    const el = document.createElement("div");
    el.className = "product";
    el.setAttribute("data-product-id", String(product.id));

    const colorsCount = (product.colors || []).length;
    const mainImg = product.images?.[0] || "";

    el.innerHTML = `
      <div class="product-img-container">
        <img src="${mainImg}" alt="${product.name}" class="product-img" />
      </div>

      <div class="product-info">
        <div class="product-label">${product.label || ""}</div>

        <div class="product-header">
          <div class="product-name-wrapper">
            <h3>${product.name}</h3>
            <div class="product-category">${product.category || ""}</div>
            <div class="product-colors-count">${colorsCount} Colors</div>
          </div>
          <p class="price">R${moneyZAR(product.price)}</p>
        </div>

        <div class="options" aria-label="Product options">
          <div class="option-label">Select Size</div>
          <div class="sizes">
            ${(product.sizes || ["S","M","L","XL"]).map(s => `<button type="button" class="size-btn" data-size="${s}">${s}</button>`).join("")}
          </div>

          <div class="option-label">Select Color</div>
          <div class="colors">
            ${(product.colors || []).map(c => `<div class="color ${colorDotClass(c)}" role="button" tabindex="0" aria-label="${c}" data-color="${c}"></div>`).join("")}
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

    // Expand on click for desktop hover
    const options = qs(".options", el);
    const addBtn = qs(".add-to-cart", el);
    const sizeBtns = qsa(".size-btn", el);
    const colorBtns = qsa(".color", el);

    const stepperRoot = qs('.qty-stepper-ui[data-qty-root="card"]', el);
    const stepper = stepperRoot ? setupQtyStepper(stepperRoot) : null;

    const updateAddBtn = () => {
      const sizeSelected = qs(".size-btn.selected", el);
      const colorSelected = qs(".color.selected", el);
      addBtn.disabled = !(sizeSelected && colorSelected);
    };

    sizeBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        sizeBtns.forEach((x) => x.classList.remove("selected"));
        btn.classList.add("selected");
        el.classList.add("expanded");
        options?.classList.add("open");
        updateAddBtn();
      });
    });

    colorBtns.forEach((dot) => {
      const select = (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        colorBtns.forEach((x) => x.classList.remove("selected"));
        dot.classList.add("selected");
        el.classList.add("expanded");
        options?.classList.add("open");
        updateAddBtn();
      };
      dot.addEventListener("click", select);
      clickOnEnterSpace(dot, select);
    });

    updateAddBtn();

    addBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const sizeSelected = qs(".size-btn.selected", el);
      const colorSelected = qs(".color.selected", el);
      if (!sizeSelected) return showToast("Select a size first.");
      if (!colorSelected) return showToast("Select a color first.");

      const qty = clamp(stepper?.getQty?.() ?? 1, 1, 99);
      const size = sizeSelected.textContent.trim();
      const color = colorSelected.getAttribute("data-color") || "Color";
      const img = mainImg;

      addToCart({ product, size, color, quantity: qty, image: img });

      // Reset stepper
      stepper?.setQty?.(1);
    });

    // Navigate to product route if clicking outside controls
    el.addEventListener("click", (e) => {
      const interactive = e.target.closest("button, input, .color, a, .sizes, .colors, .options");
      if (interactive) return;
      gotoProduct(product.id);
    });

    return el;
  }

  function renderProducts(list) {
    if (!productsContainer) return;
    productsContainer.innerHTML = "";
    list.forEach((p) => productsContainer.appendChild(makeProductCard(p)));
  }

  // ---------- Search ----------
  function applySearch(query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return renderProducts(products);

    const filtered = products.filter((p) => {
      const hay = `${p.name} ${p.category} ${(p.colors || []).join(" ")} ${(p.sizes || []).join(" ")} ${p.label}`.toLowerCase();
      return hay.includes(q);
    });

    renderProducts(filtered);
  }

  // ---------- Init ----------
  async function loadProducts() {
    const resp = await fetch(PRODUCTS_URL, { cache: "no-store" });
    if (!resp.ok) throw new Error("Failed to load products.json");
    const data = await resp.json();
    if (!Array.isArray(data)) throw new Error("products.json must be an array");
    return data;
  }

  function setActiveNav(id) {
    navLinks.forEach((a) => {
      a.classList.remove("active");
      a.removeAttribute("aria-current");
    });

    navLinks
      .filter((a) => (a.getAttribute("href") || "").endsWith(`#${id}`))
      .forEach((a) => {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      });
  }

  function initNavScrollSpy() {
    const sectionIds = ["drop", "lookbook", "shop", "about"];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    let navLock = false;
    let navUnlockTimer = null;

    navLinks.forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href") || "";
        if (!href.includes("#")) return;
        const id = href.split("#")[1];
        if (!id) return;

        const params = new URLSearchParams(window.location.search);
        const page = params.get("page");
        if (page === "lookbook" || page === "product") {
          // If on route page, just go to section url
          return;
        }

        e.preventDefault();
        closeMobilePanels();

        navLock = true;
        clearTimeout(navUnlockTimer);
        setActiveNav(id);
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
      for (const sec of sections) {
        if (sec && sec.offsetTop <= refY) current = sec.id;
      }
      setActiveNav(current);
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
        setActiveNav(hashId === "footer" ? "about" : hashId);
      }, 30);
    }
  }

  function wireLookbookCards() {
    qsa(".lookbook-card").forEach((card) => {
      const go = () => gotoLookbook(card.getAttribute("data-look") || "1");
      card.addEventListener("click", go);
      clickOnEnterSpace(card, go);
    });
  }

  function bindGlobalEvents() {
    // Nav
    searchBtn?.addEventListener("click", openSearch);
    menuBtn?.addEventListener("click", openMenu);
    navLinks.forEach((a) => a.addEventListener("click", () => closeMobilePanels()));

    // Shrink
    handleShrink();
    window.addEventListener("scroll", handleShrink, { passive: true });

    // Hero button
    qs("#shop-now-btn")?.addEventListener("click", () => scrollToSectionId("shop"));

    // Search input
    searchInput?.addEventListener("input", (e) => applySearch(e.target.value));

    // Cart
    floatingCart?.addEventListener("click", openCart);
    closeCartBtn?.addEventListener("click", closeCart);
    cartOverlay?.addEventListener("click", closeCart);

    // Checkout
    checkoutBtn?.addEventListener("click", (e) => {
      if (checkoutBtn.disabled) {
        e.preventDefault();
        return showToast("Add items to checkout.");
      }
      openCheckoutModal();
    });

    closeCheckoutModalBtn?.addEventListener("click", hideCheckoutModal);
    checkoutModal?.addEventListener("click", (e) => {
      if (e.target === checkoutModal) hideCheckoutModal();
    });

    checkoutWhatsappBtn?.addEventListener("click", () => checkoutOnWhatsApp());

    // Policies
    function hookPolicy(id, type) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        showPolicy(type);
      });
    }
    hookPolicy("privacy-link", "privacy");
    hookPolicy("terms-link", "terms");
    hookPolicy("returns-link", "returns");
    hookPolicy("shipping-link", "shipping");

    closeModal?.addEventListener("click", hidePolicy);
    policyModal?.addEventListener("click", (e) => {
      if (e.target === policyModal) hidePolicy();
    });

    // Escape close
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;

      if (searchPanel?.classList.contains("open") || menuPanel?.classList.contains("open")) {
        closeMobilePanels();
        return;
      }
      if (policyModal && policyModal.style.display === "block") hidePolicy();
      if (checkoutModal && checkoutModal.style.display === "block") hideCheckoutModal();
      if (cartSidebar?.classList.contains("active")) closeCart();
    });
  }

  function bindProductRouteAdd() {
    // qty stepper on product route
    const rppStepperRoot = qs('.qty-stepper-ui[data-qty-root="rpp"]');
    const rppStepper = rppStepperRoot ? setupQtyStepper(rppStepperRoot) : null;

    rpp.add?.addEventListener("click", () => {
      if (!rppActiveProduct) return;

      const selectedSize = rpp.sizes?.querySelector(".size-btn.selected");
      const selectedColor = rpp.colorsRow?.querySelector(".color.selected");
      if (!selectedSize) return showToast("Select a size first.");
      if (!selectedColor) return showToast("Select a color first.");

      const qty = clamp(rppStepper?.getQty?.() ?? 1, 1, 99);
      const size = selectedSize.textContent.trim();
      const color = selectedColor.getAttribute("data-color") || "Color";
      const image = rppSources[rppIndex] || (rppActiveProduct.images?.[0] || "");

      addToCart({ product: rppActiveProduct, size, color, quantity: qty, image });
      rppStepper?.setQty?.(1);
    });
  }

  async function boot() {
    cart = loadCart();
    updateCartUI();

    products = await loadProducts();
    renderProducts(products);

    // Wire lookbook
    wireLookbookCards();

    // Routes
    const params = new URLSearchParams(window.location.search);
    const page = params.get("page");

    if (page === "lookbook") {
      showRoute("lookbook");
      renderLookbookRoute(params.get("i"));
    } else if (page === "product") {
      showRoute("product");
      await renderProductRoute(params.get("id"));
    } else {
      showRoute(null);
      initNavScrollSpy();
    }

    bindProductRouteAdd();
    bindGlobalEvents();
  }

  document.addEventListener("DOMContentLoaded", () => {
    boot().catch((err) => {
      console.error(err);
      showToast("Site error loading. Please refresh.");
    });
  });
})();