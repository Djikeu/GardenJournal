import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import '../../plants.css';

const MyPlants = ({ showNotification, user, onShowPlantDetails }) => {  // Add onShowPlantDetails prop
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
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

  // Helper functions for UI
  const getTypeColor = (type) => {
    const colors = {
      'indoor': '#3b82f6',
      'outdoor': '#f59e0b',
      'succulent': '#10b981',
      'tropical': '#059669',
      'vegetable': '#ea580c',
      'flowering': '#8b5cf6',
      'herb': '#16a34a'
    };
    return colors[type] || '#7db36e';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'outdoor': 'fa-sun',
      'indoor': 'fa-home',
      'succulent': 'fa-leaf',
      'tropical': 'fa-pagelines',
      'vegetable': 'fa-carrot',
      'flowering': 'fa-spa',
      'herb': 'fa-leaf'
    };
    return icons[type] || 'fa-seedling';
  };

  const getStatusColor = (status) => {
    const colors = {
      'healthy': '#10b981',
      'warning': '#f59e0b',
      'danger': '#ef4444',
      'needs-water': '#3b82f6',
      'needs-light': '#8b5cf6'
    };
    return colors[status] || '#10b981';
  };

  // Handle plant details click
  const handleShowPlantDetails = (plantId) => {
    if (onShowPlantDetails) {
      onShowPlantDetails(plantId);
    } else {
      // Fallback: show a notification or use hash routing
      console.log('Show plant details for:', plantId);
      showNotification('Info', 'Plant details feature requires onShowPlantDetails prop', 'info');
      // Alternative: Use hash routing
      window.location.hash = `#plant-details/${plantId}`;
    }
  };

  if (loading) {
    return (
      <div className="my-plants-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your plants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-plants-container">
      {/* Hero Header */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>
            <i className="fas fa-seedling"></i>
            My Plant Collection
          </h1>
          <p className="hero-subtitle">
            All plants you've added to your personal collection. Manage, track, and care for your plants here.
          </p>
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">{plants.length}</div>
            <div className="stat-label">Total Plants</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{plants.filter(p => p.is_favorite).length}</div>
            <div className="stat-label">Favorites</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{plants.filter(p => p.status === 'healthy').length}</div>
            <div className="stat-label">Healthy</div>
          </div>
          <div 
            className="stat-item clickable" 
            onClick={() => window.location.hash = '#encyclopedia'}
          >
            <div className="stat-number">+</div>
            <div className="stat-label">Add New</div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <div className="controls-row">
          <div className="search-container">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search your plants by name, species, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <i className="fas fa-th"></i>
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <i className="fas fa-list"></i>
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-header">
            <h4>Filter by Category</h4>
            {filterType !== 'all' && (
              <button
                className="clear-filters-btn"
                onClick={() => setFilterType('all')}
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="filter-chips">
            {plantTypes.map(type => (
              <button
                key={type}
                className={`filter-chip ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}
                style={filterType === type ? {
                  backgroundColor: getTypeColor(type),
                  borderColor: getTypeColor(type),
                  color: 'white'
                } : {}}
              >
                <i className={`fas ${getTypeIcon(type)}`}></i>
                {type === 'all' ? 'All Plants' : type.charAt(0).toUpperCase() + type.slice(1)}
                {type !== 'all' && (
                  <span className="chip-count">
                    {plants.filter(p => p.type === type).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="results-section">
        {plants.length === 0 ? (
          <div className="empty-state">
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
              >
                <i className="fas fa-sync"></i>
                Refresh
              </button>
            </div>
          </div>
        ) : filteredPlants.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">
              <i className="fas fa-search"></i>
            </div>
            <h3>No plants found</h3>
            <p>Try adjusting your search or filter criteria</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
            >
              Clear Search & Filters
            </button>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="results-header">
              <div className="results-info">
                <h3>Showing {filteredPlants.length} {filteredPlants.length === 1 ? 'plant' : 'plants'}</h3>
                <p>Manage your plant collection below</p>
              </div>
              <div className="sort-control">
                <select className="sort-select">
                  <option>Name (A-Z)</option>
                  <option>Recently Added</option>
                  <option>Favorites First</option>
                  <option>Type</option>
                </select>
              </div>
            </div>

            {/* Plants Grid/List */}
            <div className={`plants-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
              {filteredPlants.map(plant => (
                <div key={plant.id} className="plant-card">
                  {/* Plant Image */}
                  <div className="plant-card-image">
                    <img
                      src={plant.image_url || plant.image || '/default-plant.png'}
                      alt={plant.name}
                      onError={(e) => {
                        e.target.src = '/default-plant.png';
                      }}
                    />
                    <div className="plant-card-badges">
                      <span 
                        className="type-badge"
                        style={{ backgroundColor: getTypeColor(plant.type) }}
                      >
                        <i className={`fas ${getTypeIcon(plant.type)}`}></i>
                        {plant.type || 'plant'}
                      </span>
                      <button
                        className={`favorite-btn ${plant.is_favorite ? 'active' : ''}`}
                        onClick={() => toggleFavorite(plant.id, plant.is_favorite)}
                        title={plant.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <i className="fas fa-heart"></i>
                      </button>
                    </div>
                    <div 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(plant.status) }}
                    >
                      {plant.status || 'Healthy'}
                    </div>
                  </div>

                  {/* Plant Info */}
                  <div className="plant-card-content">
                    <div className="plant-card-header">
                      <h3>{plant.name}</h3>
                      {plant.species && (
                        <p className="plant-species">{plant.species}</p>
                      )}
                    </div>

                    <div className="plant-details">
                      {plant.light_requirements && (
                        <div className="plant-detail">
                          <i className="fas fa-sun"></i>
                          <span>{plant.light_requirements}</span>
                        </div>
                      )}
                      {plant.watering_schedule && (
                        <div className="plant-detail">
                          <i className="fas fa-tint"></i>
                          <span>{plant.watering_schedule}</span>
                        </div>
                      )}
                      {plant.description && (
                        <p className="plant-description">
                          {plant.description.length > 100
                            ? `${plant.description.substring(0, 100)}...`
                            : plant.description
                          }
                        </p>
                      )}
                    </div>

                    {/* Action Buttons - Updated Details button */}
                    <div className="plant-card-actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleShowPlantDetails(plant.id)}
                      >
                        <i className="fas fa-info-circle"></i>
                        Details
                      </button>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => removePlant(plant.id)}
                      >
                        <i className="fas fa-times"></i>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyPlants;