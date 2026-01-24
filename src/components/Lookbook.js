import React from 'react';

const lookbookItems = [
  { title: 'Street Style 1', img: '/images/look1.jpg' },
  { title: 'Street Style 2', img: '/images/look2.jpg' },
  { title: 'Street Style 3', img: '/images/look3.jpg' }
];

function Lookbook() {
  return (
    <section className="lookbook" id="lookbook">
      <h2 className="section-title purple-title">Lookbook</h2>
      <div className="horizontal-scroll">
        {lookbookItems.map((item, i) => (
          <div className="card" key={i}>
            <img src={item.img} alt={item.title} />
            <h3>{item.title}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Lookbook;
