import React from 'react';

const SeedLibrary = ({ showNotification }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <i className="fas fa-seedling"></i>
          Seed Library
        </h3>
      </div>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Your seed library will appear here.</p>
      </div>
    </div>
  );
};

export default SeedLibrary;