import React, { useState } from 'react';

function CartSidebar() {
  const [cart, setCart] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <div className="floating-cart" onClick={toggleSidebar}>🛒</div>
      <div className={`cart-sidebar ${isOpen ? 'active' : ''}`}>
        <h3>Your Cart</h3>
        <ul>
          {cart.map((item, i) => (
            <li key={i}>
              {item.name} x {item.quantity} - R{item.price * item.quantity}
            </li>
          ))}
        </ul>
        <button onClick={toggleSidebar}>Close</button>
      </div>
    </>
  );
}

export default CartSidebar;
