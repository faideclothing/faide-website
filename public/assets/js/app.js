// ===== CONFIG =====
const PRODUCTS_URL = "/assets/js/products.json";
const CART_KEY = "faide_cart";

// ===== STATE =====
let PRODUCTS = [];
let CART = JSON.parse(localStorage.getItem(CART_KEY)) || [];

// ===== HELPERS =====
function formatPriceZAR(price) {
  return `R${price.toFixed(2)}`;
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(CART));
}

function openCart() {
  document.querySelector("#cart").classList.add("open");
}

function closeCart() {
  document.querySelector("#cart").classList.remove("open");
}

// ===== FETCH PRODUCTS =====
async function loadProducts() {
  const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
  const data = await res.json();
  PRODUCTS = data.products;
  renderProducts(PRODUCTS);
}

// ===== RENDER PRODUCTS =====
function renderProducts(products) {
  const container = document.querySelector("#products-grid");
  container.innerHTML = "";

  products.forEach((p) => {
    const productEl = document.createElement("div");
    productEl.className = "product-card";

    const colorsHtml = (p.colors || [])
      .map(
        (c) =>
          `<div class="color ${c.className}" data-color="${c.name}"></div>`
      )
      .join("");

    const sizesHtml = (p.sizes || [])
      .map((s) => `<button class="size">${s}</button>`)
      .join("");

    productEl.innerHTML = `
      <img src="${p.images[0] || "/images/placeholder.png"}" />
      <h3>${p.name}</h3>
      <p>${formatPriceZAR(p.price)}</p>

      <div class="colors">${colorsHtml}</div>
      <div class="sizes">${sizesHtml}</div>

      <button class="add-to-cart" disabled>Add to Cart</button>
    `;

    let selectedColor = null;
    let selectedSize = null;

    const addBtn = productEl.querySelector(".add-to-cart");

    productEl.querySelectorAll(".color").forEach((el) => {
      el.addEventListener("click", () => {
        selectedColor = el.dataset.color;
        productEl.querySelectorAll(".color").forEach(c => c.classList.remove("active"));
        el.classList.add("active");
        if (selectedSize) addBtn.disabled = false;
      });
    });

    productEl.querySelectorAll(".size").forEach((el) => {
      el.addEventListener("click", () => {
        selectedSize = el.textContent;
        productEl.querySelectorAll(".size").forEach(s => s.classList.remove("active"));
        el.classList.add("active");
        if (selectedColor) addBtn.disabled = false;
      });
    });

    addBtn.addEventListener("click", () => {
      CART.push({
        id: p.id,
        name: p.name,
        price: p.price,
        color: selectedColor,
        size: selectedSize,
        qty: 1
      });
      saveCart();
      renderCart();
      openCart();
    });

    container.appendChild(productEl);
  });
}

// ===== RENDER CART =====
function renderCart() {
  const container = document.querySelector("#cart-items");
  const totalEl = document.querySelector("#cart-total");

  container.innerHTML = "";
  let total = 0;

  CART.forEach((item, index) => {
    const itemEl = document.createElement("div");
    const lineTotal = item.price * item.qty;
    total += lineTotal;

    itemEl.innerHTML = `
      <div>${item.name} (${item.size}, ${item.color})</div>
      <div>${formatPriceZAR(lineTotal)}</div>
      <button data-index="${index}">Remove</button>
    `;

    itemEl.querySelector("button").addEventListener("click", () => {
      CART.splice(index, 1);
      saveCart();
      renderCart();
    });

    container.appendChild(itemEl);
  });

  totalEl.textContent = formatPriceZAR(total);
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  renderCart();

  document.querySelector("#cart-open").onclick = openCart;
  document.querySelector("#cart-close").onclick = closeCart;
});