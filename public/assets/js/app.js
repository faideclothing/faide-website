/* FAIDE E-COMMERCE (PayPal-only)
   - Products from /assets/js/products.json
   - Cart stored in localStorage (faide_cart_v2)
   - Payments via PayPal.Me (total amount)
   - WhatsApp checkout optional
*/

function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function clickOnEnterSpace(el, fn) {
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  });
}

function moneyZAR(amount) {
  const n = Number(amount || 0);
  return `R${n.toFixed(2)}`;
}

function safeText(s) {
  return String(s ?? "").replace(/[<>&"]/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;"
  }[c]));
}

const CART_STORAGE_KEY = "faide_cart_v2";
const WHATSAPP_NUMBER = "27695603929";
const PAYPAL_ME = "https://www.paypal.me/faideClothing";

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
  const toast = $("#cartToast");
  const messageEl = $("#cartMessage");
  if (!toast || !messageEl) return;
  messageEl.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function buildVariantSrc(baseSrc, n) {
  const qIndex = baseSrc.indexOf("?");
  const clean = qIndex >= 0 ? baseSrc.slice(0, qIndex) : baseSrc;
  const query = qIndex >= 0 ? baseSrc.slice(qIndex) : "";
  const dot = clean.lastIndexOf(".");
  if (dot < 0) return baseSrc;
  return `${clean.slice(0, dot)}${n}${clean.slice(dot)}${query}`;
}

function imageExists(src, timeoutMs = 900) {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      resolve(ok);
    };
    const t = setTimeout(() => finish(false), timeoutMs);
    img.onload = () => { clearTimeout(t); finish(true); };
    img.onerror = () => { clearTimeout(t); finish(false); };
    img.src = src;
  });
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

function gotoLookbook(i) { window.location.href = toQueryUrl({ page: "lookbook", i }); }
function gotoProduct(id) { window.location.href = toQueryUrl({ page: "product", id }); }

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
  if (!valueEl || !incBtn || !decBtn) return;

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

  return { getQty: () => qty, setQty };
}

// ---- Products ----
async function loadProducts() {
  const res = await fetch("/assets/js/products.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load products.json");
  const data = await res.json();

  const products = Array.isArray(data) ? data : (Array.isArray(data.products) ? data.products : []);
  const currency = (!Array.isArray(data) && data.currency) ? String(data.currency) : "ZAR";

  // Basic safety: ensure each product has id
  const normalized = products.map((p, idx) => ({
    id: String(p?.id ?? (idx + 1)),
    name: String(p?.name ?? "Product"),
    category: String(p?.category ?? ""),
    label: String(p?.label ?? "Featured"),
    price: Number(p?.price ?? 0),
    featuredRank: (p?.featuredRank ?? 999),
    sizes: Array.isArray(p?.sizes) ? p.sizes : ["S", "M", "L", "XL"],
    colors: Array.isArray(p?.colors) ? p.colors : ["Black", "White"],
    images: Array.isArray(p?.images) ? p.images : []
  }));

  return { currency, products: normalized };
}

function computeFeatured(products) {
  return [...products].sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999));
}

function sortProducts(products, mode) {
  const arr = [...products];
  if (mode === "price-asc") return arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  if (mode === "price-desc") return arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  if (mode === "name-asc") return arr.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  if (mode === "name-desc") return arr.sort((a, b) => String(b.name).localeCompare(String(a.name)));
  return computeFeatured(arr);
}

function filterProducts(products, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) => {
    const hay = `${p.name} ${p.category} ${p.label}`.toLowerCase();
    return hay.includes(q);
  });
}

// ---- Cart ----
let cart = [];
function cartTotals() {
  let total = 0;
  let itemCount = 0;
  cart.forEach((item) => {
    total += (item.price || 0) * (item.quantity || 0);
    itemCount += (item.quantity || 0);
  });
  return { total, itemCount };
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

function setCheckoutState() {
  const paypalBtn = $("#checkout-paypal-btn");
  const waBtn = $("#checkout-wa-btn");
  const empty = cart.length === 0;

  if (paypalBtn) {
    paypalBtn.disabled = empty;
    paypalBtn.title = empty ? "Add items to checkout" : "Checkout with PayPal";
  }
  if (waBtn) {
    waBtn.disabled = empty;
    waBtn.title = empty ? "Add items to checkout" : "Checkout via WhatsApp";
  }
}

function updateCartUI() {
  const cartItemsEl = $("#cart-items");
  const cartTotalEl = $("#cart-total");
  const cartCountEl = $("#cart-count");

  if (!cartItemsEl || !cartTotalEl || !cartCountEl) return;

  saveCartToStorage(cart);
  cartItemsEl.innerHTML = "";

  const { total, itemCount } = cartTotals();

  if (cart.length === 0) {
    cartItemsEl.innerHTML =
      '<li style="text-align:center;color:#666;border:none;background:transparent;padding:14px 0;">Your cart is empty</li>';
    cartTotalEl.textContent = "0.00";
    cartCountEl.textContent = "0";
    setCheckoutState();
    return;
  }

  cart.forEach((item, idx) => {
    const lineTotal = (item.price || 0) * (item.quantity || 0);

    const li = document.createElement("li");
    li.className = "cart-item";

    li.innerHTML = `
      <img class="cart-item-img" src="${safeText(item.image || "")}" alt="${safeText(item.name || "")}" onerror="this.style.display='none';" />
      <div class="cart-item-info">
        <div class="cart-item-title">${safeText(item.name)}</div>
        <div class="cart-item-meta">Size: ${safeText(item.size)} • Color: ${safeText(item.color)}</div>
        <div class="cart-item-price">${moneyZAR(lineTotal)}</div>
      </div>
      <div class="cart-item-actions">
        <div class="qty-stepper" aria-label="Quantity controls">
          <div class="qty-stepper-inner">
            <button type="button" class="qty-btn" data-action="dec" aria-label="Decrease quantity">−</button>
            <div class="qty-value" aria-label="Quantity">${safeText(item.quantity)}</div>
            <button type="button" class="qty-btn" data-action="inc" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button type="button" class="remove-btn" data-action="remove" aria-label="Remove item">Remove</button>
      </div>
    `;

    li.querySelector('[data-action="dec"]').addEventListener("click", () => {
      item.quantity = Math.max(1, (item.quantity || 1) - 1);
      updateCartUI();
    });
    li.querySelector('[data-action="inc"]').addEventListener("click", () => {
      item.quantity = (item.quantity || 1) + 1;
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
  const productName = product.name || "Item";
  const price = Number(product.price || 0);

  const key = `${product.id}-${size}-${color}`;
  const existing = cart.find((x) => x.key === key);
  if (existing) existing.quantity += quantity;
  else {
    cart.push({
      key,
      id: String(product.id),
      name: String(productName),
      price,
      size: String(size),
      color: String(color),
      quantity: Math.max(1, quantity),
      image: String(image || product.images?.[0] || "")
    });
  }

  updateCartUI();
  showCartToast(`Added ${quantity}x ${productName} (${size}) in ${color}`);
}

// ---- Checkout ----
function buildWhatsAppMessage() {
  if (!cart || cart.length === 0) return null;

  const lines = ["Hi FAIDE, I want to place an order:", ""];
  let total = 0;

  cart.forEach((item, i) => {
    const lineTotal = (item.price || 0) * (item.quantity || 0);
    total += lineTotal;
    lines.push(
      `${i + 1}) ${item.name} | Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity} | ${moneyZAR(lineTotal)}`
    );
  });

  lines.push("", `TOTAL: ${moneyZAR(total)}`, "", "Name:", "(Type here)", "", "Delivery address:", "(Type here)");
  return lines.join("\n");
}

function checkoutOnWhatsApp() {
  const msg = buildWhatsAppMessage();
  if (!msg) return showCartToast("Your cart is empty.");
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
}

function checkoutWithPayPal(currency = "ZAR") {
  if (!cart || cart.length === 0) return showCartToast("Your cart is empty.");

  const { total } = cartTotals();
  const amount = Number(total || 0).toFixed(2);

  // PayPal.Me supports amount + currencyCode
  const url = `${PAYPAL_ME}/${amount}?currencyCode=${encodeURIComponent(currency)}`;

  showCartToast("Opening PayPal… Add your name & address in PayPal note or use WhatsApp checkout.");
  window.open(url, "_blank", "noopener,noreferrer");
}

// ---- Policies ----
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
        <li>Orders are confirmed after payment (PayPal) or WhatsApp confirmation (manual).</li>
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
function showPolicy(policyType) {
  const policy = policies[policyType];
  if (!policy) return;
  const policyModal = $("#policy-modal");
  const modalTitle = $("#modal-title");
  const modalContent = $("#modal-content");

  lastFocusedEl = document.activeElement;
  if (modalTitle) modalTitle.textContent = policy.title;
  if (modalContent) modalContent.innerHTML = policy.content;

  if (policyModal) policyModal.style.display = "flex";
  document.body.classList.add("lock-scroll");
  setTimeout(() => $("#close-modal")?.focus(), 0);
}

function hidePolicy() {
  const policyModal = $("#policy-modal");
  if (policyModal) policyModal.style.display = "none";
  document.body.classList.remove("lock-scroll");
  if (lastFocusedEl && typeof lastFocusedEl.focus === "function") lastFocusedEl.focus();
}

function onClick(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("click", (e) => {
    e.preventDefault();
    fn();
  });
}

// ---- Render Shop ----
function renderShopCard(product, index) {
  const root = document.createElement("article");
  root.className = "product";
  root.setAttribute("data-product-id", String(index + 1));

  const img = product.images?.[0] || "";
  const colorsCount = Array.isArray(product.colors) ? product.colors.length : 0;

  root.innerHTML = `
    <div class="product-img-container">
      <img src="${safeText(img)}" alt="${safeText(product.name)}" class="product-img" loading="lazy" onerror="this.style.opacity='0.25';" />
    </div>

    <div class="product-info">
      <div class="product-label">${safeText(product.label || "Featured")}</div>

      <div class="product-header">
        <div class="product-name-wrapper">
          <h3>${safeText(product.name)}</h3>
          <div class="product-category">${safeText(product.category || "")}</div>
          <div class="product-colors-count">${colorsCount} Colors</div>
        </div>
        <p class="price">${moneyZAR(product.price || 0)}</p>
      </div>
    </div>
  `;

  root.addEventListener("click", (e) => {
    const interactive = e.target.closest("button, input, .color, a, .sizes, .colors, .options, .thumb-row, select");
    if (interactive) return;
    gotoProduct(String(index + 1));
  });

  return root;
}

// ---- Routes ----
function renderLookbookRoute(i) {
  const rlbImg = $("#rlb-img");
  const rlbCounter = $("#rlb-counter");

  const idx = Math.max(1, parseInt(i || "1", 10));
  const cards = $all(".lookbook-card");
  const total = cards.length || 1;
  const safeIdx = Math.min(idx, total);

  const card = cards[safeIdx - 1] || cards[0];
  const src = card?.querySelector("img")?.getAttribute("src") || "";

  if (rlbImg) rlbImg.src = src;
  if (rlbCounter) rlbCounter.textContent = `${safeIdx} / ${total}`;
}

async function buildImagesFromProduct(product) {
  const bases = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const base = bases[0] || "";
  if (!base) return [""];

  const candidates = [
    ...bases,
    buildVariantSrc(base, 1),
    buildVariantSrc(base, 2),
    buildVariantSrc(base, 3),
    buildVariantSrc(base, 4)
  ].filter(Boolean);

  const unique = [];
  candidates.forEach((s) => { if (!unique.includes(s)) unique.push(s); });

  const slice = unique.slice(0, 6);
  const checks = await Promise.all(slice.map((s, i) => (i === 0 ? true : imageExists(s))));
  const ok = slice.filter((_, i) => checks[i]).slice(0, 4);

  return ok.length ? ok : [base];
}

function renderSizes(product, mountEl, onSelect) {
  const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ["S","M","L","XL"];
  mountEl.innerHTML = "";
  sizes.forEach((s) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "size-btn";
    btn.textContent = s;
    btn.addEventListener("click", () => {
      $all(".size-btn", mountEl).forEach((x) => x.classList.remove("selected"));
      btn.classList.add("selected");
      onSelect?.(s);
    });
    mountEl.appendChild(btn);
  });
}

function renderColors(product, mountEl, onSelect) {
  const raw = Array.isArray(product.colors) && product.colors.length ? product.colors : ["Black", "White"];

  const colors = raw.map((c) => {
    if (typeof c === "string") {
      const cls = c.toLowerCase().replace(/\s+/g, "-");
      return { name: c, class: cls };
    }
    return {
      name: c?.name || "Color",
      class: c?.class || String(c?.name || "").toLowerCase().replace(/\s+/g, "-")
    };
  });

  mountEl.innerHTML = "";
  colors.forEach((c) => {
    const div = document.createElement("div");
    div.className = `color ${c.class || ""}`.trim();
    div.setAttribute("role", "button");
    div.setAttribute("tabindex", "0");
    div.setAttribute("aria-label", c.name);
    div.setAttribute("data-color", c.name);

    const select = () => {
      $all(".color", mountEl).forEach((x) => x.classList.remove("selected"));
      div.classList.add("selected");
      onSelect?.(c.name);
    };

    div.addEventListener("click", select);
    clickOnEnterSpace(div, select);
    mountEl.appendChild(div);
  });
}

function renderThumbs(mountEl, sources, activeIndex, onPick) {
  mountEl.innerHTML = "";
  sources.forEach((src, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "thumb" + (i === activeIndex ? " active" : "");
    btn.setAttribute("aria-label", `View image ${i + 1}`);
    btn.innerHTML = `<img src="${safeText(src)}" alt="" loading="lazy" />`;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      onPick(i);
    });
    mountEl.appendChild(btn);
  });
}

async function renderProductRoute(products, id) {
  const idx = Math.max(1, parseInt(id || "1", 10)) - 1;
  const product = products[idx] || products[0];
  if (!product) return;

  const rpp = {
    img: $("#rpp-img"),
    thumbs: $("#rpp-thumbs"),
    subtitle: $("#rpp-subtitle"),
    label: $("#rpp-label"),
    name: $("#rpp-name"),
    category: $("#rpp-category"),
    colorsCount: $("#rpp-colors"),
    price: $("#rpp-price"),
    sizes: $("#rpp-sizes"),
    colorsRow: $("#rpp-colors-row"),
    add: $("#rpp-add")
  };

  let selectedSize = null;
  let selectedColor = null;

  const updateAddState = () => {
    if (!rpp.add) return;
    rpp.add.disabled = !(selectedSize && selectedColor);
  };

  rpp.label.textContent = product.label || "";
  rpp.name.textContent = product.name || "Item";
  rpp.category.textContent = product.category || "";
  rpp.colorsCount.textContent = `${(product.colors || []).length || 0} Colors`;
  rpp.price.textContent = moneyZAR(product.price || 0);

  renderSizes(product, rpp.sizes, (s) => { selectedSize = s; updateAddState(); });
  renderColors(product, rpp.colorsRow, (c) => { selectedColor = c; updateAddState(); });

  const sources = await buildImagesFromProduct(product);
  let active = 0;

  const setImage = (i) => {
    active = (i + sources.length) % sources.length;
    if (rpp.img) {
      rpp.img.style.opacity = "0.25";
      requestAnimationFrame(() => {
        rpp.img.src = sources[active];
        rpp.subtitle.textContent = `${active + 1} / ${sources.length}`;
        renderThumbs(rpp.thumbs, sources, active, setImage);
        setTimeout(() => (rpp.img.style.opacity = "1"), 60);
      });
    }
  };

  setImage(0);

  const stepperRoot = document.querySelector('.qty-stepper-ui[data-qty-root="rpp"]');
  const stepper = stepperRoot ? setupQtyStepper(stepperRoot) : null;

  rpp.add.disabled = true;
  rpp.add.onclick = () => {
    if (!selectedSize) return showCartToast("Select a size first.");
    if (!selectedColor) return showCartToast("Select a color first.");
    const quantity = Math.max(1, stepper?.getQty?.() ?? 1);
    addToCart({
      product,
      size: selectedSize,
      color: selectedColor,
      quantity,
      image: sources[active] || product.images?.[0]
    });
    stepper?.setQty?.(1);
  };
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", async () => {
  const navbar = $(".navbar");
  function handleShrink() {
    if (!navbar) return;
    navbar.classList.toggle("shrink", window.scrollY > 20);
  }
  handleShrink();
  window.addEventListener("scroll", handleShrink, { passive: true });

  const navLinks = $all('[data-nav-link="main"]');

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
  navLinks.forEach((a) => a.addEventListener("click", () => closeMobilePanels()));

  $("#shop-now-btn")?.addEventListener("click", () => scrollToSectionId("shop"));

  onClick("privacy-link", () => showPolicy("privacy"));
  onClick("terms-link", () => showPolicy("terms"));
  onClick("returns-link", () => showPolicy("returns"));
  onClick("shipping-link", () => showPolicy("shipping"));
  $("#close-modal")?.addEventListener("click", hidePolicy);
  $("#policy-modal")?.addEventListener("click", (e) => { if (e.target === $("#policy-modal")) hidePolicy(); });

  $("#floating-cart")?.addEventListener("click", openCart);
  $("#close-cart")?.addEventListener("click", closeCartPanel);
  $("#cart-overlay")?.addEventListener("click", closeCartPanel);

  cart = loadCartFromStorage();
  updateCartUI();

  let currency = "ZAR";
  let products = [];
  try {
    const data = await loadProducts();
    currency = data.currency;
    products = data.products;

    const shopGrid = $("#shop-grid");
    const search = $("#shop-search");
    const sort = $("#shop-sort");

    let currentQuery = "";
    let currentSort = "featured";

    const render = () => {
      if (!shopGrid) return;
      const filtered = filterProducts(products, currentQuery);
      const sorted = sortProducts(filtered, currentSort);

      shopGrid.innerHTML = "";
      sorted.forEach((p) => {
        const idx = products.findIndex((x) => x.id === p.id);
        shopGrid.appendChild(renderShopCard(p, idx >= 0 ? idx : 0));
      });

      if (sorted.length === 0) {
        shopGrid.innerHTML = `<div style="color:#777; padding: 18px 0;">No products found.</div>`;
      }
    };

    search?.addEventListener("input", (e) => { currentQuery = e.target.value; render(); });
    sort?.addEventListener("change", (e) => { currentSort = e.target.value; render(); });

    render();
  } catch (e) {
    console.error(e);
    showCartToast("Failed to load products. Check products.json path.");
  }

  $all(".lookbook-card").forEach((card) => {
    const go = () => gotoLookbook(card.getAttribute("data-look") || "1");
    card.addEventListener("click", go);
    clickOnEnterSpace(card, go);
  });

  $("#checkout-wa-btn")?.addEventListener("click", () => {
    if ($("#checkout-wa-btn")?.disabled) return showCartToast("Add items to checkout.");
    checkoutOnWhatsApp();
  });

  $("#checkout-paypal-btn")?.addEventListener("click", () => {
    if ($("#checkout-paypal-btn")?.disabled) return showCartToast("Add items to checkout.");
    checkoutWithPayPal(currency);
  });

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

  if (page === "lookbook") {
    showRoute("lookbook");
    renderLookbookRoute(params.get("i"));
  } else if (page === "product") {
    showRoute("product");
    await renderProductRoute(products, params.get("id"));
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

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    if (searchPanel?.classList.contains("open") || menuPanel?.classList.contains("open")) {
      closeMobilePanels();
      return;
    }
    const policyModal = $("#policy-modal");
    if (policyModal && policyModal.style.display !== "none") hidePolicy();
    if ($("#cart-sidebar")?.classList.contains("active")) closeCartPanel();
  });
});