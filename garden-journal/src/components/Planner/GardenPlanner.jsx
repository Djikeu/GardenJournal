import React from 'react';

const GardenPlanner = ({ showNotification }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <i className="fas fa-calendar-alt"></i>
          Garden Planner
        </h3>
      </div>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Your garden planning tools will appear here.</p>
      </div>
    </div>
  );
};

export default GardenPlanner;