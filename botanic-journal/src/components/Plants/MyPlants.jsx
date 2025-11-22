import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const MyPlants = ({ showNotification, user }) => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (user) {
      loadUserPlants();
    }
  }, [user, refreshTrigger]);

  // Auto-refresh when coming from encyclopedia
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#plants') {
        console.log('📍 Hash changed to plants, refreshing...');
        setRefreshTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const loadUserPlants = async () => {
    try {
      setLoading(true);
      console.log('🚀 Loading user plants...');
      const response = await apiService.getPlants();
      console.log('✅ User plants response:', response);

      if (response.success) {
        setPlants(response.data);
        console.log(`📊 Loaded ${response.data.length} plants for user`);

        // Log each plant for debugging
        response.data.forEach((plant, index) => {
          console.log(`🌿 Plant ${index + 1}:`, plant);
        });
      } else {
        throw new Error(response.message || 'Failed to load plants');
      }
    } catch (error) {
      console.error('❌ Load plants error:', error);
      showNotification('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Force refresh function
  const forceRefresh = () => {
    console.log('🔄 Manually refreshing plants...');
    setRefreshTrigger(prev => prev + 1);
  };

  const toggleFavorite = async (plantId, isCurrentlyFavorite) => {
    try {
      const response = await apiService.toggleFavorite(plantId, !isCurrentlyFavorite);
      if (response.success) {
        setPlants(plants.map(plant =>
          plant.id === plantId ? { ...plant, is_favorite: !isCurrentlyFavorite } : plant
        ));
        showNotification('Success', 'Plant updated!', 'success');
      }
    } catch (error) {
      showNotification('Error', 'Failed to update plant', 'error');
    }
  };

  const removePlant = async (plantId) => {
    if (window.confirm('Are you sure you want to remove this plant from your collection?')) {
      try {
        const response = await apiService.deletePlant(plantId);
        if (response.success) {
          setPlants(plants.filter(plant => plant.id !== plantId));
          showNotification('Success', 'Plant removed from collection!', 'success');
        }
      } catch (error) {
        showNotification('Error', error.message, 'error');
      }
    }
  };

  // Filter user's plants
  const filteredPlants = plants.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plant.species?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || plant.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const plantTypes = ['all', 'indoor', 'outdoor', 'succulent', 'tropical', 'vegetable', 'flowering'];

  // Debug current state
  console.log('🔍 Current plants state:', {
    plantsCount: plants.length,
    filteredCount: filteredPlants.length,
    loading: loading,
    searchTerm: searchTerm,
    filterType: filterType
  });

  if (loading) {
    return (
      <div className="plants-container">
        <div className="loading-spinner">Loading your plants...</div>
      </div>
    );
  }

  return (
    <div className="plants-container">
      {/* Enhanced debug info */}
      <div className="plants-header">
        <div className="header-content">
          <h1>My Plant Collection</h1>
          <p>Plants you've added to your personal collection</p>
        </div>
      </div>

      {/* Stats Summary - Modern Design */}
      {plants.length > 0 && (
        <div className="stats-summary">
          <div className="stats-grid-my-collection">
            <div className="stat-card">
              <div className="stat-icon primary">
                <i className="fas fa-seedling"></i>
              </div>
              <div className="stat-content">
                <h3>{plants.length}</h3>
                <p>Total Plants</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon accent">
                <i className="fas fa-heart"></i>
              </div>
              <div className="stat-content">
                <h3>{plants.filter(p => p.is_favorite).length}</h3>
                <p>Favorites</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon success">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-content">
                <h3>{plants.filter(p => p.status === 'healthy').length}</h3>
                <p>Healthy</p>
              </div>
            </div>

            <div className="stat-card clickable" onClick={() => window.location.hash = '#encyclopedia'}>
    <div className="stat-icon action" style={{background: 'linear-gradient(135deg, #10b981, #059669)'}}>
        <i className="fas fa-plus"></i>
    </div>
    <div className="stat-content">
        <h3>Add</h3>
        <p>New Plant</p>
    </div>
</div>
          </div>
        </div>
      )}

      {/* User's Plants Section */}
      {plants.length === 0 ? (
        <div className="empty-state comprehensive">
          <div className="empty-state-icon">
            <i className="fas fa-seedling"></i>
          </div>
          <h2>Your plant collection is empty</h2>
          <p>Start building your collection by adding plants from the encyclopedia</p>
          <div className="empty-state-actions">
            <button
              className="btn btn-primary btn-large"
              onClick={() => window.location.hash = '#encyclopedia'}
            >
              <i className="fas fa-book"></i>
              Browse Plant Encyclopedia
            </button>
            <button
              className="btn btn-secondary btn-large"
              onClick={forceRefresh}
              style={{ marginLeft: '10px' }}
            >
              <i className="fas fa-sync"></i>
              Refresh
            </button>
          </div>
          <div className="empty-state-features">
            <div className="feature">
              <i className="fas fa-book"></i>
              <span>Browse 100+ plant species</span>
            </div>
            <div className="feature">
              <i className="fas fa-tint"></i>
              <span>Get care instructions</span>
            </div>
            <div className="feature">
              <i className="fas fa-bell"></i>
              <span>Track watering schedules</span>
            </div>
            <div className="feature">
              <i className="fas fa-heart"></i>
              <span>Mark favorites</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search and Filter Section */}
          <div className="plants-controls">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search your plants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-buttons">
              {plantTypes.map(type => (
                <button
                  key={type}
                  className={`filter-btn ${filterType === type ? 'active' : ''}`}
                  onClick={() => setFilterType(type)}
                >
                  {type === 'all' ? 'All Plants' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Plants Grid */}
          {filteredPlants.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-search"></i>
              <h3>No plants found</h3>
              <p>Try adjusting your search or filter criteria</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="plants-grid">
              {filteredPlants.map(plant => (
                <div key={plant.id} className="plant-card">
                  <div className="plant-image">
                    <img
                      src={plant.image_url || plant.image || '/default-plant.png'}
                      alt={plant.name}
                    />
                    <button
                      className={`favorite-btn ${plant.is_favorite ? 'active' : ''}`}
                      onClick={() => toggleFavorite(plant.id, plant.is_favorite)}
                    >
                      <i className="fas fa-heart"></i>
                    </button>
                    <div className="plant-status">
                      <span className={`status-badge ${plant.status}`}>
                        {plant.status}
                      </span>
                    </div>
                  </div>

                  <div className="plant-info">
                    <h3>{plant.name}</h3>
                    <p className="plant-species">{plant.species}</p>
                    <div className="plant-details">
                      <div className="detail-item">
                        <i className="fas fa-sun"></i>
                        <span>{plant.type}</span>
                      </div>
                      {plant.watering_schedule && (
                        <div className="detail-item">
                          <i className="fas fa-tint"></i>
                          <span>{plant.watering_schedule}</span>
                        </div>
                      )}
                      {plant.light_requirements && (
                        <div className="detail-item">
                          <i className="fas fa-lightbulb"></i>
                          <span>{plant.light_requirements}</span>
                        </div>
                      )}
                    </div>

                    {plant.description && (
                      <p className="plant-description">{plant.description}</p>
                    )}
                  </div>

                  <div className="plant-actions">
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => removePlant(plant.id)}
                      title="Remove from collection"
                    >
                      <i className="fas fa-times"></i>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyPlants;