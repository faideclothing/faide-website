import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Lookbook from './components/Lookbook';
import Shop from './components/Shop';
import Policies from './components/Policies';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';

function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <Lookbook />
      <Shop />
      <Policies />
      <Footer />
      <CartSidebar />
    </>
  );
}

export default App;
