const cart = [];
const cartIcon = document.getElementById('cart-icon');
const cartBox = document.getElementById('cart');
const closeCart = document.getElementById('close-cart');
const cartItems = document.getElementById('cart-items');
const totalEl = document.getElementById('total');

cartIcon.addEventListener('click', () => {
  cartBox.classList.add('active');
});

document.getElementById('close-cart').addEventListener('click', () => {
  cartBox.classList.remove('active');
});

document.querySelectorAll('.add').forEach(btn => {
  btn.addEventListener('click', () => {
    const product = btn.parentElement;
    const name = product.dataset.name;
    const price = parseInt(product.dataset.price);

    const existing = cart.find(i => i.name === name);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ name, price, qty: 1 });
    }
    render();
  });
});

function render() {
  cartItems.innerHTML = '';
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.qty;
    const li = document.createElement('li');
    li.textContent = `${item.name} x${item.qty}`;
    cartItems.appendChild(li);
  });

  totalEl.textContent = total;
}
