let cart = [];

const cartBtn = document.getElementById('floating-cart');
const cartSidebar = document.getElementById('cart-sidebar');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartCount = document.getElementById('cart-count');

cartBtn.addEventListener('click', () => {
  cartSidebar.classList.toggle('active');
});

document.querySelectorAll('.add-to-cart').forEach(btn => {
  btn.addEventListener('click', () => {
    const product = btn.closest('.product');
    const name = product.dataset.name;
    const price = parseFloat(product.dataset.price);

    cart.push({ name, price });
    updateCart();
  });
});

function updateCart() {
  cartItems.innerHTML = '';
  let total = 0;

  cart.forEach(item => {
    total += item.price;
    const li = document.createElement('li');
    li.textContent = item.name + ' - R' + item.price;
    cartItems.appendChild(li);
  });

  cartTotal.textContent = total.toFixed(2);
  cartCount.textContent = cart.length;
}

