// =====================
//   CART LOGIC
// =====================
const cart = [];

const cartSidebar = document.getElementById('cart-sidebar');
const floatingCart = document.getElementById('floating-cart');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsList = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');

// ===== Open / Close Sidebar =====
floatingCart.addEventListener('click', () => cartSidebar.classList.add('active'));
closeCartBtn.addEventListener('click', () => cartSidebar.classList.remove('active'));

// ===== Add to Cart =====
document.querySelectorAll('.add-to-cart').forEach(button => {
  button.addEventListener('click', () => {
    const productCard = button.parentElement;
    const name = productCard.dataset.name;
    const price = parseInt(productCard.dataset.price);
    const imgSrc = productCard.querySelector('img').src;

    const existing = cart.find(item => item.name === name);
    if (existing) {
      existing.quantity++;
    } else {
      cart.push({ name, price, imgSrc, quantity: 1, selected: true });
    }

    updateCartUI();
  });
});

// ===== Update Cart UI =====
function updateCartUI() {
  cartItemsList.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    if (item.selected) total += item.price * item.quantity;

    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.gap = '8px';

    li.innerHTML = `
      <input type="checkbox" ${item.selected ? 'checked' : ''} data-index="${index}" class="cart-checkbox">
      <img src="${item.imgSrc}" alt="${item.name}" style="width:50px; height:50px; object-fit:cover; border-radius:6px;">
      <div style="flex:1;">
        <p style="margin:0; font-weight:bold;">${item.name}</p>
        <p style="margin:0; color:#a855f7;">R${item.price}</p>
        <input type="number" min="1" value="${item.quantity}" data-index="${index}" class="cart-qty" style="width:50px; margin-top:4px;">
      </div>
      <button data-index="${index}" class="remove-item">Remove</button>
    `;

    cartItemsList.appendChild(li);
  });

  cartTotal.textContent = total;

  // ===== Event Delegation for Dynamic Elements =====
  cartItemsList.querySelectorAll('.cart-checkbox').forEach(cb => {
    cb.addEventListener('change', e => {
      const idx = e.target.dataset.index;
      cart[idx].selected = e.target.checked;
      updateCartUI();
    });
  });

  cartItemsList.querySelectorAll('.cart-qty').forEach(input => {
    input.addEventListener('change', e => {
      const idx = e.target.dataset.index;
      let val = parseInt(e.target.value);
      if (val < 1) val = 1;
      cart[idx].quantity = val;
      updateCartUI();
    });
  });

  cartItemsList.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = e.target.dataset.index;
      cart.splice(idx, 1);
      updateCartUI();
    });
  });
}
