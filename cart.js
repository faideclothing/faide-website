const cartIcon = document.getElementById("cart-icon");
const cartPanel = document.getElementById("cart-panel");
const cartItemsEl = document.getElementById("cart-items");
const cartCountEl = document.getElementById("cart-count");
const cartTotalEl = document.getElementById("cart-total");

let cart = [];

cartIcon.addEventListener("click", () => {
  cartPanel.classList.toggle("open");
});

document.querySelectorAll(".add-to-cart").forEach(btn => {
  btn.addEventListener("click", e => {
    const product = e.target.closest(".product");
    const name = product.dataset.name;
    const price = Number(product.dataset.price);
    const img = product.dataset.img;
    const qty = Number(product.querySelector(".quantity").value);

    cart.push({ name, price, img, qty });
    renderCart();
  });
});

function renderCart() {
  cartItemsEl.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.qty;
    cartItemsEl.innerHTML += `
      <div class="cart-item">
        <img src="${item.img}">
        <div>
          <p>${item.name}</p>
          <p>Qty: ${item.qty}</p>
        </div>
      </div>
    `;
  });

  cartCountEl.textContent = cart.length;
  cartTotalEl.textContent = total;
}
