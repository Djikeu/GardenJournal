import React from 'react';

const PlantJournal = ({ showNotification }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <i className="fas fa-book"></i>
          Plant Journal
        </h3>
      </div>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Your plant journal entries will appear here.</p>
      </div>
    </div>
  );
};

export default PlantJournal;