import React from 'react';
import PlantGrid from './PlantGrid';

const MyPlants = ({ showNotification }) => {
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <i className="fas fa-leaf"></i>
            My Plant Collection
          </h3>
        </div>
        <PlantGrid showNotification={showNotification} />
      </div>
    </div>
  );
};

export default MyPlants;