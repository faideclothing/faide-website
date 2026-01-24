import React, { useState } from 'react';

const products = [
  { name: 'FAIDE Hoodie', price: 550, imgSrc: '/images/hoodie.jpg' },
  { name: 'FAIDE T-shirt', price: 350, imgSrc: '/images/tshirt.jpg' },
  { name: 'FAIDE Puffer', price: 800, imgSrc: '/images/puffer.jpg' }
];

function Shop() {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    const existing = cart.find(p => p.name === product.name);
    if (existing) {
      existing.quantity += 1;
      setCart([...cart]);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    alert(`${product.name} added to cart`);
  };

  return (
    <section className="shop" id="shop">
      <h2 className="section-title purple-title">Shop</h2>
      <div className="horizontal-scroll">
        {products.map((p, i) => (
          <div className="product" key={i}>
            <img src={p.imgSrc} alt={p.name} className="product-img" />
            <p className="price">R{p.price}</p>
            <button className="secondary-btn" onClick={() => addToCart(p)}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Shop;
