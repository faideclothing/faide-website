/* FAIDE Store App (single-file vanilla JS)
 * - Renders products from /assets/js/products.json
 * - Cart (localStorage)
 * - Product + Lookbook routes (query params)
 * - Checkout link + WhatsApp fallback
 */

(function () {
  "use strict";

  // ---------- Utilities ----------
  function $(sel, root = document) {
    return root.querySelector(sel);
  }
  function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }
  function moneyZAR(n) {
    const v = Number(n || 0);
    return `R${v.toFixed(2)}`;
  }
  function clickOnEnterSpace(el, fn) {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn();
      }
    });
  }

  // ---------- Config + Data ----------
  const CART_STORAGE_KEY = "faide_cart_v2";
  let STORE = { currency: "ZAR", whatsappNumber: "27695603929", products: [] };
  let cart = [];

  async function loadProducts() {
    const res = await fetch("/assets/js/products.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load products.json");
    const json = await res.json();
    STORE = {
      currency: json.currency || "ZAR",
      whatsappNumber: json.whatsappNumber || "27695603929",
      products: Array.isArray(json.products) ? json.products : [],
    };
  }

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

  // ---------- Toast ----------
  function showCartToast(message) {
    const toast = $("#cartToast");
    const msg = $("#cartMessage");
    if (!toast || !msg) return;
    msg.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // ---------- Cart Core ----------
  function cartTotals() {
    let total = 0;
    let count = 0;
    for (const item of cart) {
      total += (Number(item.price) || 0) * (Number(item.quantity) || 0);
      count += Number(item.quantity) || 0;
    }
    return { total, count };
  }

  function findProductById(id) {
    return STORE.products.find((p) => Number(p.id) === Number(id)) || null;
  }

  function upsertCartItem({ productId, name, price, size, color, quantity, image }) {
    const key = `${productId}-${size}-${color}`;
    const existing = cart.find((x) => x.key === key);
    if (existing) {
      existing.quantity += quantity;
      existing.image = image || existing.image;
    } else {
      cart.push({ key, productId, name, price, size, color, quantity, image: image || "" });
    }
    saveCartToStorage(cart);
  }

  // ---------- WhatsApp Checkout ----------
  function checkoutOnWhatsApp() {
    if (!cart || cart.length === 0) return showCartToast("Your cart is empty.");
    const lines = ["Hi FAIDE, I want to place an order:", ""];
    let total = 0;

    cart.forEach((item, i) => {
      const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
      total += lineTotal;
      lines.push(
        `${i + 1}) ${item.name} | Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity} | ${moneyZAR(lineTotal)}`
      );
    });

    lines.push(
      "",
      `TOTAL: ${moneyZAR(total)}`,
      "",
      "Name:",
      "(Type here)",
      "",
      "Delivery address:",
      "(Type here)"
    );

    window.open(
      `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer"
    );
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
      if (typeof onChange === "function") onChange(qty);
    };

    const setQty = (next) => {
      qty = Math.max(1, Number(next) || 1);
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

  // ---------- Router Helpers ----------
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

  // ---------- Rendering Products ----------
  function renderProducts() {
    const host = $("#products-scroll");
    if (!host) return;

    host.innerHTML = "";

    for (const p of STORE.products) {
      const productEl = document.createElement("div");
      productEl.className = "product";
      productEl.setAttribute("data-product-id", String(p.id));

      const mainImage = (p.images && p.images[0]) || "";
      const colorsCount = Array.isArray(p.colors) ? p.colors.length : 0;

      productEl.innerHTML = `
        <div class="product-img-container">
          <img src="${mainImage}" alt="${escapeHtml(p.name)}" class="product-img" loading="lazy" />
        </div>

        <div class="product-info">
          <div class="product-label">${escapeHtml(p.label || "New")}</div>

          <div class="product-header">
            <div class="product-name-wrapper">
              <h3>${escapeHtml(p.name)}</h3>
              <div class="product-category">${escapeHtml(p.category || "")}</div>
              <div class="product-colors-count">${colorsCount} Colors</div>
            </div>
            <p class="price">${moneyZAR(p.price)}</p>
          </div>

          <div class="options" aria-label="${escapeHtml(p.name)} options">
            <div class="option-label">Select Size</div>
            <div class="sizes">
              ${(p.sizes || ["S", "M", "L", "XL"])
                .map((s) => `<button type="button" class="size-btn" data-size="${escapeHtml(s)}">${escapeHtml(s)}</button>`)
                .join("")}
            </div>

            <div class="option-label">Select Color</div>
            <div class="colors">
              ${(p.colors || [])
                .map((c) => {
                  const cls = String(c).toLowerCase() === "black" ? "black" : String(c).toLowerCase() === "white" ? "white" : "grey";
                  return `<div class="color ${cls}" role="button" tabindex="0" aria-label="${escapeHtml(c)}" data-color="${escapeHtml(c)}"></div>`;
                })
                .join("")}
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

      // Expand on tap (optional)
      productEl.addEventListener("mouseenter", () => productEl.classList.add("expanded"));
      productEl.addEventListener("mouseleave", () => productEl.classList.remove("expanded"));

      // Setup option selections
      const stepperRoot = productEl.querySelector('.qty-stepper-ui[data-qty-root="card"]');
      const stepper = stepperRoot ? setupQtyStepper(stepperRoot) : null;

      const sizeButtons = $all(".size-btn", productEl);
      const colorOptions = $all(".color", productEl);
      const addBtn = $(".add-to-cart", productEl);

      const updateAddBtn = () => {
        const selectedSize = $(".size-btn.selected", productEl);
        const selectedColor = $(".color.selected", productEl);
        if (addBtn) addBtn.disabled = !(selectedSize && selectedColor);
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

      colorOptions.forEach((c) => {
        const select = (e) => {
          e?.stopPropagation?.();
          colorOptions.forEach((x) => x.classList.remove("selected"));
          c.classList.add("selected");
          productEl.classList.add("expanded");
          updateAddBtn();
        };
        c.addEventListener("click", select);
        clickOnEnterSpace(c, select);
      });

      updateAddBtn();

      addBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const selectedSize = $(".size-btn.selected", productEl);
        const selectedColor = $(".color.selected", productEl);
        if (!selectedSize) return showCartToast("Select a size first.");
        if (!selectedColor) return showCartToast("Select a color first.");

        let quantity = stepper?.getQty?.() ?? 1;
        quantity = Math.max(1, Number.isFinite(quantity) ? quantity : 1);

        const size = selectedSize.textContent.trim();
        const color = selectedColor.getAttribute("data-color") || "Color";
        const image = mainImage;

        upsertCartItem({
          productId: p.id,
          name: p.name,
          price: Number(p.price) || 0,
          size,
          color,
          quantity,
          image,
        });

        updateCartUI();
        showCartToast(`Added ${quantity}x ${p.name} (${size}) in ${color}`);
        stepper?.setQty?.(1);
      });

      // Click card -> product route (avoid interacting elements)
      productEl.addEventListener("click", (e) => {
        const interactive = e.target.closest("button, input, .color, a, .sizes, .colors, .options");
        if (interactive) return;
        gotoProduct(String(p.id));
      });

      host.appendChild(productEl);
    }
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---------- Cart UI ----------
  function updateCartUI() {
    const cartSidebar = $("#cart-sidebar");
    const cartOverlay = $("#cart-overlay");
    const cartItemsEl = $("#cart-items");
    const cartTotalEl = $("#cart-total");
    const cartCountEl = $("#cart-count");
    const checkoutLink = $("#checkout-link");
    const whatsappBtn = $("#whatsapp-checkout");

    saveCartToStorage(cart);

    const { total, count } = cartTotals();

    if (cartTotalEl) cartTotalEl.textContent = total.toFixed(2);
    if (cartCountEl) cartCountEl.textContent = String(count);

    const empty = cart.length === 0;
    if (checkoutLink) checkoutLink.setAttribute("aria-disabled", empty ? "true" : "false");
    if (whatsappBtn) whatsappBtn.disabled = empty;

    if (!cartItemsEl) return;

    cartItemsEl.innerHTML = "";

    if (empty) {
      cartItemsEl.innerHTML =
        '<li style="text-align:center;color:#666;border:none;background:transparent;padding:14px 0;">Your cart is empty</li>';
      return;
    }

    cart.forEach((item, idx) => {
      const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);

      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML = `
        <img class="cart-item-img" src="${item.image || ""}" alt="${escapeHtml(item.name)}" onerror="this.style.display='none';" />
        <div class="cart-item-info">
          <div class="cart-item-title">${escapeHtml(item.name)}</div>
          <div class="cart-item-meta">Size: ${escapeHtml(item.size)} • Color: ${escapeHtml(item.color)}</div>
          <div class="cart-item-price">${moneyZAR(lineTotal)}</div>
        </div>
        <div class="cart-item-actions">
          <div class="qty-stepper" aria-label="Quantity controls">
            <div class="qty-stepper-inner">
              <button type="button" class="qty-btn" data-action="dec" aria-label="Decrease quantity">−</button>
              <div class="qty-value" aria-label="Quantity">${Number(item.quantity) || 1}</div>
              <button type="button" class="qty-btn" data-action="inc" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <button type="button" class="remove-btn" data-action="remove" aria-label="Remove item">Remove</button>
        </div>
      `;

      li.querySelector('[data-action="dec"]').addEventListener("click", () => {
        item.quantity = Math.max(1, (Number(item.quantity) || 1) - 1);
        updateCartUI();
      });
      li.querySelector('[data-action="inc"]').addEventListener("click", () => {
        item.quantity = (Number(item.quantity) || 1) + 1;
        updateCartUI();
      });
      li.querySelector('[data-action="remove"]').addEventListener("click", () => {
        cart.splice(idx, 1);
        updateCartUI();
      });

      cartItemsEl.appendChild(li);
    });

    // keep state
    if (cartSidebar?.classList.contains("active")) cartOverlay?.classList.add("active");
  }

  function openCart() {
    $("#cart-sidebar")?.classList.add("active");
    $("#cart-overlay")?.classList.add("active");
    document.body.classList.add("lock-scroll");
  }
  function closeCartPanel() {
    $("#cart-sidebar")?.classList.remove("active");
    $("#cart-overlay")?.classList.remove("active");
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
        <p style="margin-bottom:14px;">You can request to update or delete your information by contacting us at <a style="color:var(--primary); text-decoration:none;" href="mailto:faideclothingsa@gmail.com">faideclothingsa@gmail.com</a>.</p>
      `,
    },
    terms: {
      title: "Terms of Service",
      content: `
        <p style="margin-bottom:14px;"><strong>FAIDE Terms of Service</strong></p>
        <p style="margin-bottom:14px;">By using this website and placing an order, you agree to the terms below.</p>
        <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Orders</h3>
        <ul style="margin-left:18px; margin-bottom:14px;">
          <li>Orders are paid online at checkout or confirmed via WhatsApp if you choose that option.</li>
          <li>We may contact you if we need size/color confirmation or address clarification.</li>
        </ul>
        <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Pricing</h3>
        <p style="margin-bottom:14px;">Prices are listed in ZAR (R). We reserve the right to correct errors and update pricing.</p>
        <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Availability</h3>
        <p style="margin-bottom:14px;">Stock availability may change. If an item is unavailable, we’ll offer an alternative or refund.</p>
      `,
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
      `,
    },
    shipping: {
      title: "Shipping Policy",
      content: `
        <p style="margin-bottom:14px;"><strong>Shipping Policy</strong></p>
        <p style="margin-bottom:14px;">We ship orders within South Africa. Delivery times depend on your location.</p>
        <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Processing time</h3>
        <p style="margin-bottom:14px;">Orders are typically processed within 1–3 business days after payment.</p>
        <h3 style="color:#fff; font-size:1.05rem; margin:18px 0 8px;">Delivery</h3>
        <ul style="margin-left:18px; margin-bottom:14px;">
          <li>Estimated delivery: 2–7 business days (varies by region).</li>
          <li>Tracking may be provided depending on courier service.</li>
        </ul>
        <p style="margin-bottom:14px;">Questions? Email <a style="color:var(--primary); text-decoration:none;" href="mailto:faideclothingsa@gmail.com">faideclothingsa@gmail.com</a></p>
      `,
    },
  };

  let lastFocusedEl = null;
  function showPolicy(policyType) {
    const policy = policies[policyType];
    if (!policy) return;
    const modal = $("#policy-modal");
    const title = $("#modal-title");
    const content = $("#modal-content");
    lastFocusedEl = document.activeElement;

    if (title) title.textContent = policy.title;
    if (content) content.innerHTML = policy.content;
    if (modal) modal.style.display = "block";

    document.body.classList.add("lock-scroll");
    setTimeout(() => $("#close-modal")?.focus(), 0);
  }
  function hidePolicy() {
    const modal = $("#policy-modal");
    if (modal) modal.style.display = "none";
    document.body.classList.remove("lock-scroll");
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") lastFocusedEl.focus();
  }

  // ---------- Nav scroll helpers ----------
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

  // ---------- Lookbook + Product Routes ----------
  function renderLookbookRoute(i) {
    const idx = Math.max(1, parseInt(i || "1", 10));
    const cards = $all(".lookbook-card");
    const total = cards.length || 1;
    const safeIdx = Math.min(idx, total);

    const card = cards[safeIdx - 1] || cards[0];
    const src = card?.querySelector("img")?.getAttribute("src") || "";

    const rlbImg = $("#rlb-img");
    const rlbCounter = $("#rlb-counter");
    if (rlbImg) rlbImg.src = src;
    if (rlbCounter) rlbCounter.textContent = `${safeIdx} / ${total}`;
  }

  function renderProductRoute(idStr) {
    const id = parseInt(idStr || "1", 10);
    const p = findProductById(id);
    if (!p) return;

    const img = $("#rpp-img");
    const thumbs = $("#rpp-thumbs");
    const subtitle = $("#rpp-subtitle");
    const label = $("#rpp-label");
    const name = $("#rpp-name");
    const category = $("#rpp-category");
    const colorsCount = $("#rpp-colors");
    const price = $("#rpp-price");
    const sizes = $("#rpp-sizes");
    const colorsRow = $("#rpp-colors-row");
    const addBtn = $("#rpp-add");

    if (label) label.textContent = p.label || "";
    if (name) name.textContent = p.name || "";
    if (category) category.textContent = p.category || "";
    if (colorsCount) colorsCount.textContent = `${(p.colors || []).length} Colors`;
    if (price) price.textContent = moneyZAR(p.price);

    // images
    const sources = Array.isArray(p.images) && p.images.length ? p.images.slice(0, 4) : [];
    let activeIndex = 0;
    const setImage = (i) => {
      activeIndex = clamp(i, 0, Math.max(0, sources.length - 1));
      if (img) img.src = sources[activeIndex] || "";
      if (subtitle) subtitle.textContent = `${activeIndex + 1} / ${sources.length || 1}`;
      renderThumbs();
    };
    const renderThumbs = () => {
      if (!thumbs) return;
      thumbs.innerHTML = "";
      sources.forEach((src, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "thumb" + (i === activeIndex ? " active" : "");
        btn.setAttribute("aria-label", `View image ${i + 1}`);
        btn.innerHTML = `<img src="${src}" alt="" loading="lazy" />`;
        btn.addEventListener("click", () => setImage(i));
        thumbs.appendChild(btn);
      });
    };
    setImage(0);

    // sizes
    if (sizes) {
      sizes.innerHTML = "";
      (p.sizes || ["S", "M", "L", "XL"]).forEach((s) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "size-btn";
        btn.textContent = s;
        btn.addEventListener("click", () => {
          $all(".size-btn", sizes).forEach((x) => x.classList.remove("selected"));
          btn.classList.add("selected");
          updateAddState();
        });
        sizes.appendChild(btn);
      });
    }

    // colors
    if (colorsRow) {
      colorsRow.innerHTML = "";
      (p.colors || []).forEach((c) => {
        const cls = String(c).toLowerCase() === "black" ? "black" : String(c).toLowerCase() === "white" ? "white" : "grey";
        const div = document.createElement("div");
        div.className = `color ${cls}`;
        div.setAttribute("role", "button");
        div.setAttribute("tabindex", "0");
        div.setAttribute("aria-label", c);
        div.setAttribute("data-color", c);

        const select = () => {
          $all(".color", colorsRow).forEach((x) => x.classList.remove("selected"));
          div.classList.add("selected");
          updateAddState();
        };
        div.addEventListener("click", select);
        clickOnEnterSpace(div, select);

        colorsRow.appendChild(div);
      });
    }

    // qty
    const stepperRoot = document.querySelector('.qty-stepper-ui[data-qty-root="rpp"]');
    const stepper = stepperRoot ? setupQtyStepper(stepperRoot) : null;

    function updateAddState() {
      const hasSize = sizes?.querySelector(".size-btn.selected");
      const hasColor = colorsRow?.querySelector(".color.selected");
      if (addBtn) addBtn.disabled = !(hasSize && hasColor);
    }
    updateAddState();

    addBtn?.addEventListener("click", () => {
      const selectedSize = sizes?.querySelector(".size-btn.selected");
      const selectedColor = colorsRow?.querySelector(".color.selected");
      if (!selectedSize) return showCartToast("Select a size first.");
      if (!selectedColor) return showCartToast("Select a color first.");

      let quantity = stepper?.getQty?.() ?? 1;
      quantity = Math.max(1, Number.isFinite(quantity) ? quantity : 1);

      const size = selectedSize.textContent.trim();
      const color = selectedColor.getAttribute("data-color") || "Color";
      const imageSrc = sources[activeIndex] || sources[0] || "";

      upsertCartItem({
        productId: p.id,
        name: p.name,
        price: Number(p.price) || 0,
        size,
        color,
        quantity,
        image: imageSrc,
      });

      updateCartUI();
      showCartToast(`Added ${quantity}x ${p.name} (${size}) in ${color}`);
      stepper?.setQty?.(1);
    });
  }

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", async () => {
    // Load data
    try {
      await loadProducts();
    } catch (e) {
      console.error(e);
      showCartToast("Error loading products.");
    }

    // Load cart
    cart = loadCartFromStorage();

    // Render products
    renderProducts();

    // Navbar shrink
    const navbar = $(".navbar");
    const handleShrink = () => {
      if (!navbar) return;
      navbar.classList.toggle("shrink", window.scrollY > 20);
    };
    handleShrink();
    window.addEventListener("scroll", handleShrink, { passive: true });

    // Shop now button
    $("#shop-now-btn")?.addEventListener("click", () => scrollToSectionId("shop"));

    // Mobile panels
    const searchBtn = $("#mobile-search-btn");
    const menuBtn = $("#mobile-menu-btn");
    const searchPanel = $("#mobile-search-panel");
    const menuPanel = $("#mobile-menu-panel");
    const searchInput = $("#mobile-search-input");

    const closeMobilePanels = () => {
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
    $all('[data-nav-link="main"]').forEach((a) => a.addEventListener("click", () => closeMobilePanels()));

    // Search: basic filter
    searchInput?.addEventListener("input", (e) => {
      const q = String(e.target.value || "").trim().toLowerCase();
      const host = $("#products-scroll");
      if (!host) return;
      $all(".product", host).forEach((node) => {
        const id = node.getAttribute("data-product-id");
        const p = findProductById(id);
        const hay = `${p?.name || ""} ${p?.category || ""} ${(p?.colors || []).join(" ")} ${(p?.label || "")}`.toLowerCase();
        node.style.display = !q || hay.includes(q) ? "" : "none";
      });
    });

    // Cart open/close
    $("#floating-cart")?.addEventListener("click", openCart);
    $("#close-cart")?.addEventListener("click", closeCartPanel);
    $("#cart-overlay")?.addEventListener("click", closeCartPanel);

    // WhatsApp button inside cart
    $("#whatsapp-checkout")?.addEventListener("click", () => {
      if (!cart.length) return showCartToast("Add items to checkout.");
      checkoutOnWhatsApp();
    });

    // Policy modal hooks
    const onClick = (id, fn) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        fn();
      });
    };
    onClick("privacy-link", () => showPolicy("privacy"));
    onClick("terms-link", () => showPolicy("terms"));
    onClick("returns-link", () => showPolicy("returns"));
    onClick("shipping-link", () => showPolicy("shipping"));
    $("#close-modal")?.addEventListener("click", hidePolicy);
    $("#policy-modal")?.addEventListener("click", (e) => {
      if (e.target === $("#policy-modal")) hidePolicy();
    });

    // Lookbook cards route
    $all(".lookbook-card").forEach((card) => {
      const go = () => gotoLookbook(card.getAttribute("data-look") || "1");
      card.addEventListener("click", go);
      clickOnEnterSpace(card, go);
    });

    // Nav active + scroll behavior
    const navLinks = $all('[data-nav-link="main"]');
    const params = new URLSearchParams(window.location.search);
    const page = params.get("page");

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

    // Route resolution
    if (page === "lookbook") {
      showRoute("lookbook");
      renderLookbookRoute(params.get("i"));
    } else if (page === "product") {
      showRoute("product");
      renderProductRoute(params.get("id"));
    } else {
      showRoute(null);

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
    }

    // ESC key closes panels/modals/cart
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;

      if (searchPanel?.classList.contains("open") || menuPanel?.classList.contains("open")) {
        closeMobilePanels();
        return;
      }
      const modal = $("#policy-modal");
      if (modal && modal.style.display === "block") hidePolicy();
      if ($("#cart-sidebar")?.classList.contains("active")) closeCartPanel();
    });

    // Update cart UI after everything
    updateCartUI();
  });
})();