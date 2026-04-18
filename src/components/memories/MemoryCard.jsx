import React from 'react';

const MemoryCard = () => {
  return (
    <div style={{
      width: '200px',
      height: '300px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9f9f9',
      margin: '10px'
    }}>
      <p>Memory Card Content</p>
    </div>
  );
};

export default MemoryCard;