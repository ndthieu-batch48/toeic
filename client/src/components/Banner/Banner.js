import React from 'react';
import './Banner.css';

const Banner = () => {
  return (
    <div className="banner">
      <div className="banner-content">
        <h2>TMA Solutions</h2>
        <p>Explore more exciting things about company.</p>
        <button onClick={() => (window.location.href = 'https://www.tmasolutions.vn/')}>
          Explore
        </button>
      </div>
    </div>
  );
};

export default Banner;
