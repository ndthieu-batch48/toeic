import React from 'react';

const TestInfo = ({ title, duration, questions, commentCount }) => (
  <div className="test-info" style={{ marginBottom: '20px' }}>
    <h2>{title}</h2>
    <p>⏱ Time: {duration} minutes </p>
  </div>
);

export default TestInfo;
