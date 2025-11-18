import React, { useState } from 'react';
import { plantsData } from '../../data';
import PlantCard from './PlantCard';

const PlantGrid = ({ showNotification }) => {
  const [plants, setPlants] = useState(plantsData);

  const toggleFavorite = (plantId) => {
    setPlants(plants.map(plant => 
      plant.id === plantId 
        ? { ...plant, isFavorite: !plant.isFavorite }
        : plant
    ));
    
    const plant = plants.find(p => p.id === plantId);
    if (plant.isFavorite) {
      showNotification('Removed from Favorites', `${plant.name} removed from favorites`, 'info');
    } else {
      showNotification('Added to Favorites', `${plant.name} added to favorites!`, 'success');
    }
  };

  return (
    <div className="plants-grid">
      {plants.map(plant => (
        <PlantCard 
          key={plant.id} 
          plant={plant} 
          onToggleFavorite={toggleFavorite}
        />
      ))}
    </div>
  );
};

export default PlantGrid;