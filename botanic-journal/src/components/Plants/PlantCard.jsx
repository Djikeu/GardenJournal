import React from 'react';

const PlantCard = ({ plant, onToggleFavorite }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'healthy': return 'status-healthy';
      case 'warning': return 'status-warning';
      case 'danger': return 'status-danger';
      default: return 'status-healthy';
    }
  };

  return (
    <div className="plant-card">
      <div className="plant-image-container">
        <img src={plant.image} alt={plant.name} className="plant-image" />
        <div className="plant-overlay">
          <button 
            className={`plant-favorite ${plant.isFavorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(plant.id)}
          >
            <i className={plant.isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
          </button>
        </div>
      </div>
      <div className="plant-info">
        <div className="plant-header">
          <div>
            <div className="plant-name">{plant.name}</div>
            <div className="plant-type">
              <i className="fas fa-home"></i>
              {plant.type}
            </div>
          </div>
        </div>
        <div className="plant-status">
          <span className={`status-badge ${getStatusClass(plant.status)}`}>
            {plant.status.charAt(0).toUpperCase() + plant.status.slice(1)}
          </span>
          <div className="plant-metric">
            <i className="fas fa-tint"></i>
            <span>{plant.lastWatered}</span>
          </div>
        </div>
        <div className="plant-metrics">
          <div className="plant-metric">
            <i className="fas fa-thermometer-half"></i>
            <span>{plant.temperature}</span>
          </div>
          <div className="plant-metric">
            <i className="fas fa-sun"></i>
            <span>{plant.light}</span>
          </div>
          <div className="plant-metric">
            <i className="fas fa-tint"></i>
            <span>{plant.humidity}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantCard;