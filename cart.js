const cart = [];

const cartSidebar = document.getElementById("cart-sidebar");
const closeCartBtn = document.getElementById("close-cart");
const cartItemsList = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");
const cartPreview = document.getElementById("cart-preview");
const viewCartBtn = document.querySelector(".view-cart");

viewCartBtn.onclick = () => cartSidebar.classList.add("active");
closeCartBtn.onclick = () => cartSidebar.classList.remove("active");

/* PRODUCT LOGIC */
document.querySelectorAll(".product").forEach(product => {
  let size = null;
  let color = null;

  product.querySelectorAll(".sizes button").forEach(btn => {
    btn.onclick = () => {
      product.querySelectorAll(".sizes button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      size = btn.dataset.size;
    };
  });

  product.querySelectorAll(".color").forEach(c => {
    c.onclick = () => {
      product.querySelectorAll(".color").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
      color = c.dataset.color;
    };
  });

  product.querySelector(".add-to-cart").onclick = () => {
    if (!size || !color) {
      alert("Select size and color");
      return;
    }

    cart.push({
      name: product.dataset.name,
      price: parseInt(product.dataset.price),
      size,
      color,
      quantity: parseInt(product.querySelector(".quantity").value)
    });

    updateCart();
  };
});

function updateCart() {
  cartItemsList.innerHTML = "";
  cartPreview.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;

    const li = document.createElement("li");
    li.innerHTML = `
      <p><strong>${item.name}</strong></p>
      <p>${item.size} / ${item.color} × ${item.quantity}</p>
    `;
    cartItemsList.appendChild(li);

    const preview = li.cloneNode(true);
    cartPreview.appendChild(preview);
  });

  cartTotal.textContent = total;
  cartCount.textContent = cart.length;
}
