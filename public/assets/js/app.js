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

// ✅ FIXED
function formatPriceZAR(price) {
  const n = Number(price || 0);
  return `R${n.toFixed(2)}`;
}

// ---------- Lookbook FIX ----------
function renderLookbook(listEl, lookbookItems) {
  if (!listEl) return;
  listEl.innerHTML = "";

  lookbookItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = "lookbook-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    // ✅ FIXED
    card.setAttribute("aria-label", `Open Lookbook ${item.id}`);

    // ✅ FIXED
    card.innerHTML = `
      <img src="${item.image}" alt="${item.alt || "Lookbook"}" class="lookbook-img" />
    `;

    const go = () => window.location.href = `?page=lookbook&i=${item.id}`;
    card.addEventListener("click", go);
    clickOnEnterSpace(card, go);

    listEl.appendChild(card);
  });
}

// ---------- EVERYTHING ELSE (UNCHANGED BUT SAFE WRAPPED) ----------
document.addEventListener("DOMContentLoaded", () => {

  // NAV MENU
  const menuBtn = $("mobile-menu-btn");
  const drawer = $("mobile-menu-panel");
  const overlay = $("mobile-drawer-overlay");
  const closeBtn = $("drawer-close");

  menuBtn?.addEventListener("click", () => {
    drawer?.classList.toggle("open");
    overlay?.classList.toggle("active");
  });

  closeBtn?.addEventListener("click", () => {
    drawer?.classList.remove("open");
    overlay?.classList.remove("active");
  });

  overlay?.addEventListener("click", () => {
    drawer?.classList.remove("open");
    overlay?.classList.remove("active");
  });

  // POLICY MODAL
  const modal = $("policy-modal");
  const closeModal = $("close-modal");

  ["privacy-link","shipping-link","terms-link","returns-link"].forEach(id => {
    const el = $(id);
    el?.addEventListener("click", (e) => {
      e.preventDefault();
      modal.style.display = "block";
    });
  });

  closeModal?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // CART
  const cartBtn = $("floating-cart");
  const cart = $("cart-sidebar");
  const closeCart = $("close-cart");
  const cartOverlay = $("cart-overlay");

  cartBtn?.addEventListener("click", () => {
    cart?.classList.add("active");
    cartOverlay?.classList.add("active");
  });

  closeCart?.addEventListener("click", () => {
    cart?.classList.remove("active");
    cartOverlay?.classList.remove("active");
  });

  cartOverlay?.addEventListener("click", () => {
    cart?.classList.remove("active");
    cartOverlay?.classList.remove("active");
  });

});

})();