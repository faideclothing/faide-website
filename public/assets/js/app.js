function clickOnEnterSpace(el, fn) {
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
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
  font_size: 16,
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

  const heroTitleEl = document.getElementById("hero-title");
  const heroDescEl = document.getElementById("hero-description");
  if (heroTitleEl) heroTitleEl.textContent = heroTitle;
  if (heroDescEl) heroDescEl.textContent = heroDescription;

  const aboutTitleEl = document.getElementById("about-title");
  const aboutDescEl = document.getElementById("about-description");
  if (aboutTitleEl) aboutTitleEl.textContent = aboutHeadline;
  if (aboutDescEl) aboutDescEl.textContent = aboutDescription;

  setCSSVar("--bg", config.background_color || defaultConfig.background_color);
  setCSSVar("--surface", config.surface_color || defaultConfig.surface_color);
  setCSSVar("--text", config.text_color || defaultConfig.text_color);
  setCSSVar("--primary", config.primary_accent || defaultConfig.primary_accent);
  setCSSVar("--secondary", config.secondary_accent || defaultConfig.secondary_accent);

  const customFont = config.font_family || defaultConfig.font_family;
  document.body.style.fontFamily = `${customFont}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

  const heroTitleNode = document.querySelector(".hero-title");
  if (heroTitleNode) heroTitleNode.style.textShadow = "none";
}

function mapToCapabilities(config) {
  return {
    recolorables: [
      { get: () => config.background_color || defaultConfig.background_color, set: (v) => window.elementSdk?.setConfig?.({ background_color: (config.background_color = v) }) },
      { get: () => config.surface_color || defaultConfig.surface_color, set: (v) => window.elementSdk?.setConfig?.({ surface_color: (config.surface_color = v) }) },
      { get: () => config.text_color || defaultConfig.text_color, set: (v) => window.elementSdk?.setConfig?.({ text_color: (config.text_color = v) }) },
      { get: () => config.primary_accent || defaultConfig.primary_accent, set: (v) => window.elementSdk?.setConfig?.({ primary_accent: (config.primary_accent = v) }) },
      { get: () => config.secondary_accent || defaultConfig.secondary_accent, set: (v) => window.elementSdk?.setConfig?.({ secondary_accent: (config.secondary_accent = v) }) },
    ],
    borderables: [],
    fontEditable: {
      get: () => config.font_family || defaultConfig.font_family,
      set: (v) => window.elementSdk?.setConfig?.({ font_family: (config.font_family = v) }),
    },
    fontSizeable: {
      get: () => config.font_size || defaultConfig.font_size,
      set: (v) => window.elementSdk?.setConfig?.({ font_size: (config.font_size = v) }),
    },
  };
}

function mapToEditPanelValues(config) {
  return new Map([
    ["brand_name", config.brand_name || defaultConfig.brand_name],
    ["hero_title", config.hero_title || defaultConfig.hero_title],
    ["hero_description", config.hero_description || defaultConfig.hero_description],
    ["about_headline", config.about_headline || defaultConfig.about_headline],
    ["about_description", config.about_description || defaultConfig.about_description],
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
    img.onload = () => {
      clearTimeout(t);
      finish(true);
    };
    img.onerror = () => {
      clearTimeout(t);
      finish(false);
    };
    img.src = src;
  });
}

const CART_STORAGE_KEY = "faide_cart_v1";
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

const WHATSAPP_NUMBER = "27695603929";
let cart = [];

function showCartToast(message) {
  const toast = document.getElementById("cartToast");
  const messageEl = document.getElementById("cartMessage");
  if (!toast || !messageEl) return;
  messageEl.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function checkoutOnWhatsApp() {
  if (!cart || cart.length === 0) return showCartToast("Your cart is empty.");
  const lines = ["Hi FAIDE, I want to place an order:", ""];
  let total = 0;

  cart.forEach((item, i) => {
    const lineTotal = item.price * item.quantity;
    total += lineTotal;
    lines.push(`${i + 1}) ${item.name} | Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity} | R${lineTotal.toFixed(2)}`);
  });

  lines.push("", `TOTAL: R${total.toFixed(2)}`, "", "Name:", "(Type here)", "", "Delivery address:", "(Type here)");
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener,noreferrer");
}

const policyModal = document.getElementById("policy-modal");
const modalTitle = document.getElementById("modal-title");
const modalContent = document.getElementById("modal-content");
const closeModal = document.getElementById("close-modal");

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
        <li>Orders are confirmed via WhatsApp after you submit your cart.</li>
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
      <p style="margin-bottom:14px;">Orders are typically processed within 1–3 business days after confirmation.</p>
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

function onClick(id, fn) {
  const el = document.getElementById(id);
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
closeModal?.addEventListener("click", hidePolicy);
policyModal?.addEventListener("click", (e) => {
  if (e.target === policyModal) hidePolicy();
});

function getNavOffsetPx() {
  const nav = document.querySelector(".navbar");
  const navH =
    nav?.getBoundingClientRect?.().height ||
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) ||
    86;
  return Math.round(navH + 18);
}
function scrollToSectionId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.pageYOffset - getNavOffsetPx();
  window.scrollTo({ top, behavior: "smooth" });
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
  const site = document.getElementById("site-content");
  const rlb = document.getElementById("route-lookbook");
  const rpp = document.getElementById("route-product");

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

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("shop-now-btn")?.addEventListener("click", () => scrollToSectionId("shop"));

  const navbar = document.querySelector(".navbar");
  const navLinks = document.querySelectorAll('[data-nav-link="main"]');

  const searchBtn = document.getElementById("mobile-search-btn");
  const menuBtn = document.getElementById("mobile-menu-btn");
  const searchPanel = document.getElementById("mobile-search-panel");
  const menuPanel = document.getElementById("mobile-menu-panel");
  const searchInput = document.getElementById("mobile-search-input");

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

  function handleShrink() {
    if (!navbar) return;
    navbar.classList.toggle("shrink", window.scrollY > 20);
  }
  handleShrink();
  window.addEventListener("scroll", handleShrink, { passive: true });

  const products = document.querySelectorAll(".product");
  const floatingCart = document.getElementById("floating-cart");
  const cartSidebar = document.getElementById("cart-sidebar");
  const cartOverlay = document.getElementById("cart-overlay");
  const closeCart = document.getElementById("close-cart");
  const cartItemsEl = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  const cartCountEl = document.getElementById("cart-count");
  const checkoutBtn = document.getElementById("checkout-btn");

  cart = loadCartFromStorage();

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

  checkoutBtn?.addEventListener("click", (e) => {
    if (checkoutBtn.disabled) {
      e.preventDefault();
      return showCartToast("Add items to checkout.");
    }
    checkoutOnWhatsApp();
  });

  function setCheckoutState() {
    const empty = cart.length === 0;
    if (!checkoutBtn) return;
    checkoutBtn.disabled = empty;
    checkoutBtn.title = empty ? "Add items to checkout" : "Proceed to WhatsApp checkout";
  }

  function updateCartUI() {
    if (!cartItemsEl || !cartTotalEl || !cartCountEl) return;
    saveCartToStorage(cart);

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

  products.forEach((p, i) => p.setAttribute("data-product-id", String(i + 1)));

  products.forEach((product) => {
    const stepperRoot = product.querySelector('.qty-stepper-ui[data-qty-root="card"]');
    const stepper = stepperRoot ? setupQtyStepper(stepperRoot) : null;

    const sizeButtons = product.querySelectorAll(".size-btn");
    const colorOptions = product.querySelectorAll(".color");
    const addToCartBtn = product.querySelector(".add-to-cart");

    const updateAddBtn = () => {
      if (!addToCartBtn) return;
      const selectedSize = product.querySelector(".size-btn.selected");
      const selectedColor = product.querySelector(".color.selected");
      addToCartBtn.disabled = !(selectedSize && selectedColor);
    };

    sizeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        sizeButtons.forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        product.classList.add("expanded");
        updateAddBtn();
      });
    });

    colorOptions.forEach((color) => {
      const select = (e) => {
        e?.stopPropagation?.();
        colorOptions.forEach((c) => c.classList.remove("selected"));
        color.classList.add("selected");
        product.classList.add("expanded");
        updateAddBtn();
      };
      color.addEventListener("click", select);
      clickOnEnterSpace(color, select);
    });

    updateAddBtn();

    addToCartBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const productName = product.getAttribute("data-name") || "Item";
      const price = parseFloat(product.getAttribute("data-price") || "0");

      const selectedSize = product.querySelector(".size-btn.selected");
      const selectedColor = product.querySelector(".color.selected");
      if (!selectedSize) return showCartToast("Select a size first.");
      if (!selectedColor) return showCartToast("Select a color first.");

      let quantity = stepper?.getQty?.() ?? 1;
      quantity = Math.max(1, Number.isFinite(quantity) ? quantity : 1);

      const size = selectedSize.textContent.trim();
      const colorName = selectedColor.getAttribute("data-color") || "Color";
      const image = product.querySelector(".product-img")?.getAttribute("src") || "";

      const itemKey = `${productName}-${size}-${colorName}`;
      const existing = cart.find((item) => item.key === itemKey);

      if (existing) existing.quantity += quantity;
      else cart.push({ key: itemKey, name: productName, price, size, color: colorName, quantity, image });

      updateCartUI();
      showCartToast(`Added ${quantity}x ${productName} (${size}) in ${colorName}`);
      stepper?.setQty?.(1);
    });
  });

  updateCartUI();

  Array.from(document.querySelectorAll(".lookbook-card")).forEach((card) => {
    const go = () => gotoLookbook(card.getAttribute("data-look") || "1");
    card.addEventListener("click", go);
    clickOnEnterSpace(card, go);
  });

  products.forEach((productEl) => {
    productEl.addEventListener("click", (e) => {
      const interactive = e.target.closest("button, input, .color, a, .sizes, .colors, .options, .thumb-row");
      if (interactive) return;
      gotoProduct(productEl.getAttribute("data-product-id") || "1");
    });
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

  const rlbImg = document.getElementById("rlb-img");
  const rlbCounter = document.getElementById("rlb-counter");

  const rpp = {
    img: document.getElementById("rpp-img"),
    thumbs: document.getElementById("rpp-thumbs"),
    subtitle: document.getElementById("rpp-subtitle"),
    label: document.getElementById("rpp-label"),
    name: document.getElementById("rpp-name"),
    category: document.getElementById("rpp-category"),
    colorsCount: document.getElementById("rpp-colors"),
    price: document.getElementById("rpp-price"),
    sizes: document.getElementById("rpp-sizes"),
    colorsRow: document.getElementById("rpp-colors-row"),
    add: document.getElementById("rpp-add"),
  };

  const rppStepperRoot = document.querySelector('.qty-stepper-ui[data-qty-root="rpp"]');
  const rppStepper = rppStepperRoot ? setupQtyStepper(rppStepperRoot) : null;

  function getProductElById(idStr) {
    const id = parseInt(idStr || "1", 10);
    const all = Array.from(products);
    return all.find((p) => parseInt(p.getAttribute("data-product-id") || "1", 10) === id) || all[0] || null;
  }

  async function buildImagesFromProduct(productEl) {
    const base = productEl.querySelector(".product-img")?.getAttribute("src") || "";
    if (!base) return [""];
    const candidates = [base, buildVariantSrc(base, 2), buildVariantSrc(base, 3), buildVariantSrc(base, 4)];
    const checks = await Promise.all(candidates.map((s, i) => (i === 0 ? true : imageExists(s))));
    return candidates.filter((_, i) => checks[i]).slice(0, 4);
  }

  function renderSizesFromProduct(productEl) {
    const original = Array.from(productEl.querySelectorAll(".size-btn")).map((b) => b.textContent.trim());
    const sizes = original.length ? original : ["S", "M", "L", "XL"];
    rpp.sizes.innerHTML = "";
    sizes.forEach((s) => {
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

  function renderColorsFromProduct(productEl) {
    const original = Array.from(productEl.querySelectorAll(".color")).map((c) => ({
      className: c.className,
      colorName: c.getAttribute("data-color") || "Color",
    }));

    const colors = original.length
      ? original
      : [
          { className: "color black", colorName: "Black" },
          { className: "color white", colorName: "White" },
        ];

    rpp.colorsRow.innerHTML = "";
    colors.forEach((c) => {
      const div = document.createElement("div");
      div.className = c.className;
      div.setAttribute("role", "button");
      div.setAttribute("tabindex", "0");
      div.setAttribute("aria-label", c.colorName);
      div.setAttribute("data-color", c.colorName);

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

  function fillMeta(productEl) {
    rpp.label.textContent = productEl.querySelector(".product-label")?.textContent?.trim() || "";
    rpp.name.textContent = productEl.getAttribute("data-name") || "Item";
    rpp.category.textContent = productEl.querySelector(".product-category")?.textContent?.trim() || "";
    rpp.colorsCount.textContent = productEl.querySelector(".product-colors-count")?.textContent?.trim() || "";
    rpp.price.textContent = productEl.querySelector(".price")?.textContent?.trim() || "";
    rppStepper?.setQty?.(1);
    rpp.add.disabled = true;
  }

  function updateRppAddState() {
    const selectedSize = rpp.sizes.querySelector(".size-btn.selected");
    const selectedColor = rpp.colorsRow.querySelector(".color.selected");
    rpp.add.disabled = !(selectedSize && selectedColor);
  }

  let rppSources = [];
  let rppIndex = 0;
  let rppActiveProductEl = null;

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

    if (rpp.img.getAttribute("src") === nextSrc) {
      rpp.subtitle.textContent = `${rppIndex + 1} / ${rppSources.length}`;
      renderRppThumbs();
      return;
    }

    rpp.img.style.opacity = "0.25";
    requestAnimationFrame(() => {
      if (token !== __rppSwapToken) return;
      rpp.img.src = nextSrc;
      rpp.subtitle.textContent = `${rppIndex + 1} / ${rppSources.length}`;
      renderRppThumbs();
      setTimeout(() => {
        if (token !== __rppSwapToken) return;
        rpp.img.style.opacity = "1";
      }, 60);
    });
  }

  async function renderProductRoute(id) {
    const productEl = getProductElById(id);
    if (!productEl) return;

    rppActiveProductEl = productEl;
    fillMeta(productEl);
    renderSizesFromProduct(productEl);
    renderColorsFromProduct(productEl);

    rppSources = await buildImagesFromProduct(productEl);
    setRppImage(0);
  }

  function renderLookbookRoute(i) {
    const idx = Math.max(1, parseInt(i || "1", 10));
    const cards = Array.from(document.querySelectorAll(".lookbook-card"));
    const total = cards.length || 1;
    const safeIdx = Math.min(idx, total);

    const card = cards[safeIdx - 1] || cards[0];
    const src = card?.querySelector("img")?.getAttribute("src") || "";

    if (rlbImg) rlbImg.src = src;
    if (rlbCounter) rlbCounter.textContent = `${safeIdx} / ${total}`;
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

  rpp.add?.addEventListener("click", () => {
    if (!rppActiveProductEl) return;

    const productName = rppActiveProductEl.getAttribute("data-name") || "Item";
    const price = parseFloat(rppActiveProductEl.getAttribute("data-price") || "0");

    const selectedSize = rpp.sizes.querySelector(".size-btn.selected");
    const selectedColor = rpp.colorsRow.querySelector(".color.selected");
    if (!selectedSize) return showCartToast("Select a size first.");
    if (!selectedColor) return showCartToast("Select a color first.");

    let quantity = rppStepper?.getQty?.() ?? 1;
    quantity = Math.max(1, Number.isFinite(quantity) ? quantity : 1);

    const size = selectedSize.textContent.trim();
    const colorName = selectedColor.getAttribute("data-color") || "Color";
    const image = rppSources[rppIndex] || (rppActiveProductEl.querySelector(".product-img")?.getAttribute("src") || "");

    const itemKey = `${productName}-${size}-${colorName}`;
    const existing = cart.find((item) => item.key === itemKey);

    if (existing) existing.quantity += quantity;
    else cart.push({ key: itemKey, name: productName, price, size, color: colorName, quantity, image });

    updateCartUI();
    showCartToast(`Added ${quantity}x ${productName} (${size}) in ${colorName}`);
  });

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