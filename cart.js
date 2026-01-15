// FLOATING CART LOGIC
const cartIcon = document.querySelector('.cart-icon');
const cartDropdown = document.querySelector('.cart-dropdown');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');

let cart = [];

// Toggle cart dropdown
cartIcon.addEventListener('click', () => {
  document.getElementById('cart').classList.toggle('active');
});

// Add products to cart
const products = document.querySelectorAll('.product');
products.forEach(product => {
  product.querySelector('.secondary-btn').addEventListener('click', () => {
    const title = product.querySelector('h3').innerText;
    const price = 1000; // Set your product price here
    const existing = cart.find(item => item.title === title);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ title, price, qty: 1 });
    }
    updateCart();
  });
});

function updateCart() {
  cartItems.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.title} x ${item.qty} <span>R${item.price * item.qty}</span>
      <button class="remove-btn" data-index="${index}">❌</button>
    `;
    cartItems.appendChild(li);
    total += item.price * item.qty;
  });

  cartCount.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
  cartTotal.innerText = total.toFixed(2);

  // Remove item from cart
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = e.target.dataset.index;
      cart.splice(index, 1);
      updateCart();
    });
  });

  // Render PayPal buttons
  paypal.Buttons({
    createOrder: (data, actions) => {
      return actions.order.create({
        purchase_units: [{ amount: { value: total.toFixed(2) } }]
      });
    },
    onApprove: (data, actions) => {
      return actions.order.capture().then(details => {
        alert('Transaction completed by ' + details.payer.name.given_name);
        cart = [];
        updateCart();
        document.getElementById('cart').classList.remove('active');
      });
    }
  }).render('#paypal-button-container');
}
