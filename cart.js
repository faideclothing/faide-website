const cart = [];
const cartSidebar = document.getElementById('cart-sidebar');
const floatingCart = document.getElementById('floating-cart');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsList = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');

floatingCart.addEventListener('click', () => {
  cartSidebar.classList.add('active');
});

closeCartBtn.addEventListener('click', () => {
  cartSidebar.classList.remove('active');
});

document.querySelectorAll('.add-to-cart').forEach(button => {
  button.addEventListener('click', () => {
    const productCard = button.parentElement;
    const name = productCard.dataset.name;
    const price = parseInt(productCard.dataset.price);

    // Check if item is already in cart
    const existing = cart.find(item => item.name === name);
    if (existing) {
      existing.quantity++;
    } else {
      cart.push({name, price, quantity:1});
    }
    updateCartUI();
  });
});

function updateCartUI() {
  cartItemsList.innerHTML = '';
  let total = 0;
  cart.forEach((item, index) => {
    total += item.price * item.quantity;
    const li = document.createElement('li');
    li.innerHTML = `${item.name} x${item.quantity} - R${item.price * item.quantity} <button onclick="removeItem(${index})">Remove</button>`;
    cartItemsList.appendChild(li);
  });
  cartTotal.textContent = total;
}

function removeItem(index) {
  cart.splice(index,1);
  updateCartUI();
}
