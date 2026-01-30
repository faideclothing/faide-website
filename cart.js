const cart = document.getElementById("cart");
const openCart = document.getElementById("openCart");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

let total = 0;

openCart.onclick = () => cart.classList.add("active");
closeCart.onclick = () => cart.classList.remove("active");

document.querySelectorAll(".add-cart").forEach(btn => {
  btn.addEventListener("click", () => {
    openCart.classList.add("pulse");

    const name = btn.dataset.name;
    const price = Number(btn.dataset.price);

    const item = document.createElement("div");
    item.style.marginBottom = "15px";
    item.innerHTML = `<strong>${name}</strong> — R${price}`;
    cartItems.innerHTML = "";
    cartItems.appendChild(item);

    total += price;
    cartTotal.textContent = total;
  });
});
