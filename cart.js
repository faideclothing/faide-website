const floatingCart = document.getElementById("floating-cart");
const cartSidebar = document.getElementById("cart-sidebar");
const closeCart = const floatingCart = document.getElementById("floating-cart");
const cartSidebar = document.getElementById("cart-sidebar");
const closeCart = document.getElementById("close-cart");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");

let cart = [];

floatingCart.addEventListener("click", () => cartSidebar.classList.add("active"));
closeCart.addEventListener("click", () => cartSidebar.classList.remove("active"));

document.querySelectorAll(".add-to-cart").forEach(btn => {
  btn.addEventListener("click", e => {
    const productEl = e.target.closest(".product");
    const name = productEl.dataset.name;
    const price = parseFloat(productEl.dataset.price);
    const quantity = parseInt(productEl.querySelector(".quantity").value);

    const existing = cart.find(item => item.name === name);
    if(existing){ existing.quantity += quantity; }
    else{ cart.push({name, price, quantity}); }

    updateCartUI();
  });
});

function updateCartUI(){
  cartItemsEl.innerHTML = "";
  let total = 0;
  cart.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.name} x ${item.quantity} - R${(item.price*item.quantity).toFixed(2)}`;
    cartItemsEl.appendChild(li);
    total += item.price*item.quantity;
  });
  cartTotalEl.textContent = total.toFixed(2);
}
;
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");

let cart = [];

floatingCart.addEventListener("click", () => cartSidebar.classList.add("active"));
closeCart.addEventListener("click", () => cartSidebar.classList.remove("active"));

document.querySelectorAll(".add-to-cart").forEach(btn => {
  btn.addEventListener("click", e => {
    const productEl = e.target.closest(".product");
    const name = productEl.dataset.name;
    const price = parseFloat(productEl.dataset.price);
    const quantity = parseInt(productEl.querySelector(".quantity").value);

    const existing = cart.find(item => item.name === name);
    if(existing){ existing.quantity += quantity; }
    else{ cart.push({name, price, quantity}); }

    updateCartUI();
  });
});

function updateCartUI(){
  cartItemsEl.innerHTML = "";
  let total = 0;
  cart.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.name} x ${item.quantity} - R${(item.price*item.quantity).toFixed(2)}`;
    cartItemsEl.appendChild(li);
    total += item.price*item.quantity;
  });
  cartTotalEl.textContent = total.toFixed(2);
}
