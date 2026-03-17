// ===== DATA =====
const lookbook = [
  { id: 1, image: "/images/lookbook1.png", alt: "FAIDE Lookbook 1" },
  { id: 2, image: "/images/lookbook2.png", alt: "FAIDE Lookbook 2" }
];

const products = [
  {
    id: "tank",
    name: "FAIDE Essentials Tank",
    label: "Just In",
    category: "UNISEX Tank Top",
    price: 199.99,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White"],
    images: ["/images/tank-top.png", "/images/tank-top1.png", "/images/tank-top2.png", "/images/tank-top3.png"]
  },
  {
    id: "tee",
    name: "FAIDE Signature Tee",
    label: "Bestseller",
    category: "UNISEX Short-Sleeve Top",
    price: 349.99,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White", "Grey"],
    images: ["/images/tshirt.png", "/images/tshirt1.png", "/images/tshirt2.png", "/images/tshirt3.png"]
  },
  {
    id: "longsleeve",
    name: "FAIDE Long Sleeve",
    label: "Member Exclusive",
    category: "UNISEX Long Sleeve",
    price: 549.99,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White"],
    images: ["/images/longsleeve.png", "/images/longsleeve1.png", "/images/longsleeve2.png", "/images/longsleeve3.png"]
  },
  {
    id: "hoodie",
    name: "FAIDE Luxury Hoodie",
    label: "Premium",
    category: "UNISEX Pullover Hoodie",
    price: 699.99,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White"],
    images: ["/images/hoodie.png", "/images/hoodie1.png", "/images/hoodie2.png", "/images/hoodie3.png"]
  },
  {
    id: "beanie",
    name: "FAIDE Beanie",
    label: "Best seller",
    category: "UNISEX Hat",
    price: 119.99,
    sizes: ["One Size"],
    colors: ["Black", "White"],
    images: ["/images/beanie.jpg", "/images/beanie1.png", "/images/beanie2.png", "/images/beanie3.png"]
  }
];

// ===== LOOKBOOK =====
const lookbookList = document.getElementById("lookbook-list");
lookbook.forEach(lb => {
  const img = document.createElement("img");
  img.src = lb.image;
  img.alt = lb.alt;
  img.classList.add("lookbook-item");
  lookbookList.appendChild(img);
});

// ===== SHOP =====
const shopProducts = document.getElementById("shop-products");
products.forEach(product => {
  const card = document.createElement("div");
  card.classList.add("shop-card");
  card.innerHTML = `
    <img src="${product.images[0]}" alt="${product.name}" />
    <h3>${product.name}</h3>
    <p>R${product.price.toFixed(2)}</p>
    <button class="view-product-btn" data-id="${product.id}">View</button>
  `;
  shopProducts.appendChild(card);
});

// ===== PRODUCT ROUTE =====
const routeProduct = document.getElementById("route-product");
const rppImg = document.getElementById("rpp-img");
const rppThumbs = document.getElementById("rpp-thumbs");
const rppName = document.getElementById("rpp-name");
const rppLabel = document.getElementById("rpp-label");
const rppCategory = document.getElementById("rpp-category");
const rppColorsRow = document.getElementById("rpp-colors-row");
const rppSizes = document.getElementById("rpp-sizes");
const rppPrice = document.getElementById("rpp-price");
const rppAddBtn = document.getElementById("rpp-add");

let selectedProduct = null;
let selectedSize = null;
let selectedColor = null;

document.querySelectorAll(".view-product-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.id;
    selectedProduct = products.find(p => p.id === id);
    showProduct(selectedProduct);
    routeProduct.style.display = "block";
    document.getElementById("site-content").style.display = "none";
  });
});

function showProduct(product) {
  rppImg.src = product.images[0];
  rppName.textContent = product.name;
  rppLabel.textContent = product.label;
  rppCategory.textContent = product.category;
  rppPrice.textContent = "R" + product.price.toFixed(2);

  // Thumbnails
  rppThumbs.innerHTML = "";
  product.images.forEach(imgUrl => {
    const thumb = document.createElement("img");
    thumb.src = imgUrl;
    thumb.addEventListener("click", () => rppImg.src = imgUrl);
    rppThumbs.appendChild(thumb);
  });

  // Sizes
  rppSizes.innerHTML = "";
  product.sizes.forEach(size => {
    const btn = document.createElement("button");
    btn.textContent = size;
    btn.addEventListener("click", () => {
      selectedSize = size;
      checkAddBtn();
      Array.from(rppSizes.children).forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
    });
    rppSizes.appendChild(btn);
  });

  // Colors
  rppColorsRow.innerHTML = "";
  product.colors.forEach(color => {
    const btn = document.createElement("button");
    btn.textContent = color;
    btn.addEventListener("click", () => {
      selectedColor = color;
      checkAddBtn();
      Array.from(rppColorsRow.children).forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
    });
    rppColorsRow.appendChild(btn);
  });

  selectedSize = null;
  selectedColor = null;
  rppAddBtn.disabled = true;
}

function checkAddBtn() {
  rppAddBtn.disabled = !(selectedSize && selectedColor);
}

// ===== CART =====
let cart = [];
const cartSidebar = document.getElementById("cart-sidebar");
const cartCount = document.getElementById("cart-count");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartToast = document.getElementById("cartToast");
const cartMessage = document.getElementById("cartMessage");

rppAddBtn.addEventListener("click", () => {
  const item = { product: selectedProduct, size: selectedSize, color: selectedColor, quantity: 1 };
  cart.push(item);
  updateCartUI();
  showCartToast(`${selectedProduct.name} added to cart!`);
});

function updateCartUI() {
  cartItems.innerHTML = "";
  let total = 0;
  cart.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.product.name} (${item.size}, ${item.color}) - R${item.product.price.toFixed(2)}`;
    cartItems.appendChild(li);
    total += item.product.price * item.quantity;
  });
  cartCount.textContent = cart.length;
  cartTotal.textContent = total.toFixed(2);
}

// ===== CART TOAST =====
function showCartToast(message) {
  cartMessage.textContent = message;
  cartToast.classList.add("show");
  setTimeout(() => cartToast.classList.remove("show"), 2000);
}

// ===== SHOP NOW =====
document.getElementById("shop-now-btn").addEventListener("click", () => {
  document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
});

// ===== PRODUCT BACK =====
document.querySelector(".route-back").addEventListener("click", () => {
  routeProduct.style.display = "none";
  document.getElementById("site-content").style.display = "block";
});

// ===== MODALS =====
const signupModal = document.getElementById("signup-modal");
const suSubmit = document.getElementById("su-submit");
const suClose = document.getElementById("signup-close");

// Show signup modal when shop scroll into view
const shopSection = document.getElementById("shop");
window.addEventListener("scroll", () => {
  if (window.scrollY + window.innerHeight > shopSection.offsetTop + 50) {
    signupModal.style.display = "block";
  }
});

suClose.addEventListener("click", () => (signupModal.style.display = "none"));
suSubmit.addEventListener("click", () => {
  const email = document.getElementById("su-email").value;
  if (email) {
    alert(`Thanks! We'll notify you at ${email}`);
    signupModal.style.display = "none";
  }
});

// ===== CART SIDEBAR =====
const floatingCart = document.getElementById("floating-cart");
const closeCartBtn = document.getElementById("close-cart");

floatingCart.addEventListener("click", () => cartSidebar.style.display = "block");
closeCartBtn.addEventListener("click", () => cartSidebar.style.display = "none");