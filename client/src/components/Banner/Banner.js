import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Banner.css';

const Banner = () => {
  const navigate = useNavigate();
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
