// src/components/TestCard.js
import React from 'react';
import './TestCard.css';
import { useNavigate } from 'react-router-dom';

const TestCard = ({ title, duration, questions, tags, onClick }) => {
  const navigate = useNavigate();
  return (
    <div className="test-card" onClick={onClick}>
      <h3>{title}</h3>
      <p>{duration} mins</p>
      <div className="tags">
        <span className="tag">TOEIC</span>
      </div>
      <button onClick={onClick}>Details</button>
    </div>
  );
};

export default TestCard;
