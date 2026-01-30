// CART LOGIC
const floatingCart = document.getElementById('floating-cart');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCart = document.getElementById('close-cart');
const cartItemsList = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');

let cart = [];

floatingCart.addEventListener('click', () => {
  cartSidebar.style.right = '0';
});

closeCart.addEventListener('click', () => {
  cartSidebar.style.right = '-400px';
});

const addToCartButtons = document.querySelectorAll('.add-to-cart');

addToCartButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const productEl = e.target.closest('.product');
    const name = productEl.dataset.name;
    const price = parseFloat(productEl.dataset.price);
    const qty = parseInt(productEl.querySelector('.quantity').value);

    const existing = cart.find(item => item.name === name);
    if(existing) {
      existing.qty += qty;
    } else {
      cart.push({name, price, qty});
    }
    renderCart();
  });
});

function renderCart() {
  cartItemsList.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name} x${item.qty} - R${(item.price*item.qty).toFixed(2)}`;
    cartItemsList.appendChild(li);
    total += item.price*item.qty;
  });
  cartTotal.textContent = total.toFixed(2);
}
