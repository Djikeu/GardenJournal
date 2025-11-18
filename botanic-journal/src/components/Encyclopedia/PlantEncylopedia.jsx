import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const PlantEncyclopedia = ({ showNotification }) => {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [selectedPlant, setSelectedPlant] = useState(null);

    useEffect(() => {
        loadPlants();
    }, []);

    const loadPlants = async () => {
        try {
            setLoading(true);
            const response = await apiService.getPlantsEncyclopedia();
            setPlants(response.data);
        } catch (error) {
            showNotification('Error', 'Failed to load plant encyclopedia', 'error');
        } finally {
            setLoading(false);
        }
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

    const getCareLevel = (type) => {
        const levels = {
            'succulent': { level: 'Easy', color: '#10b981' },
            'indoor': { level: 'Moderate', color: '#f59e0b' },
            'herb': { level: 'Easy', color: '#10b981' },
            'outdoor': { level: 'Moderate', color: '#f59e0b' },
            'vegetable': { level: 'Moderate', color: '#f59e0b' },
            'flowering': { level: 'Advanced', color: '#ef4444' },
            'tropical': { level: 'Advanced', color: '#ef4444' }
        };
        return levels[type] || { level: 'Moderate', color: '#f59e0b' };
    };

    // Filter plants based on search and type
    const filteredPlants = plants.filter(plant => {
        const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (plant.species && plant.species.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'all' || plant.type === filterType;
        return matchesSearch && matchesType;
    });

    const plantTypes = ['all', 'indoor', 'outdoor', 'succulent', 'tropical', 'vegetable', 'flowering', 'herb'];

    if (loading) {
        return (
            <div className="encyclopedia-loading">
                <div className="loading-spinner">
                    <i className="fas fa-seedling"></i>
                </div>
                <h3>Loading Plant Encyclopedia</h3>
                <p>Discovering amazing plants for you...</p>
            </div>
        );
    }

    return (
        <div className="plant-encyclopedia">
            {/* Hero Header */}
            <div className="encyclopedia-hero">
                <div className="hero-content">
                    <h1>
                        <i className="fas fa-book-open"></i>
                        Plant Encyclopedia
                    </h1>
                    <p className="hero-subtitle">
                        Discover, learn, and explore our extensive collection of plants. 
                        Find the perfect additions for your garden.
                    </p>
                </div>
                <div className="hero-stats">
                    <div className="stat-item">
                        <div className="stat-number">{plants.length}</div>
                        <div className="stat-label">Total Plants</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{filteredPlants.length}</div>
                        <div className="stat-label">Filtered Results</div>
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="encyclopedia-controls">
                <div className="controls-main">
                    <div className="search-container">
                        <div className="search-box-enhanced">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search plants by name, species, or type..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input-enhanced"
                            />
                            {searchTerm && (
                                <button 
                                    className="clear-search"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="view-controls">
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

                {/* Filter Chips */}
                <div className="filter-section">
                    <div className="filter-header">
                        <h4>Filter by Category</h4>
                        {filterType !== 'all' && (
                            <button 
                                className="clear-filters"
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
                                    borderColor: getTypeColor(type)
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
            <div className="encyclopedia-results">
                {filteredPlants.length === 0 ? (
                    <div className="no-results">
                        <div className="no-results-icon">
                            <i className="fas fa-search"></i>
                        </div>
                        <h3>No plants found</h3>
                        <p>We couldn't find any plants matching your criteria. Try adjusting your search or filters.</p>
                        <button 
                            className="btn-primary" 
                            onClick={() => { setSearchTerm(''); setFilterType('all'); }}
                        >
                            <i className="fas fa-undo"></i>
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Results Header */}
                        <div className="results-header">
                            <div className="results-info">
                                <h3>Showing {filteredPlants.length} {filteredPlants.length === 1 ? 'plant' : 'plants'}</h3>
                                <p>Explore our plant collection below</p>
                            </div>
                            <div className="results-sort">
                                <span>Sort by:</span>
                                <select className="sort-select">
                                    <option>Name (A-Z)</option>
                                    <option>Care Level</option>
                                    <option>Type</option>
                                </select>
                            </div>
                        </div>

                        {/* Plants Grid/List */}
                        <div className={`plants-container ${viewMode}-view`}>
                            {filteredPlants.map(plant => {
                                const careInfo = getCareLevel(plant.type);
                                
                                return (
                                    <div key={plant.id} className="plant-card-enhanced">
                                        <div className="plant-card-inner">
                                            {/* Plant Image */}
                                            <div className="plant-image-section">
                                                <div className="plant-image-container">
                                                    <img 
                                                        src={plant.image || 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'} 
                                                        alt={plant.name}
                                                        className="plant-image"
                                                        onError={(e) => {
                                                            e.target.src = 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                                                        }}
                                                    />
                                                    <div className="plant-image-overlay">
                                                        <div className="plant-type-tag" style={{ backgroundColor: getTypeColor(plant.type) }}>
                                                            <i className={`fas ${getTypeIcon(plant.type)}`}></i>
                                                            {plant.type}
                                                        </div>
                                                        <div className="plant-actions-overlay">
                                                            <button className="icon-btn favorite-btn" title="Add to favorites">
                                                                <i className="far fa-heart"></i>
                                                            </button>
                                                            <button className="icon-btn share-btn" title="Share plant">
                                                                <i className="fas fa-share"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Plant Info */}
                                            <div className="plant-info-section">
                                                <div className="plant-header">
                                                    <h4 className="plant-name">{plant.name}</h4>
                                                    {plant.species && (
                                                        <div className="plant-species">{plant.species}</div>
                                                    )}
                                                </div>

                                                {/* Care Level Badge */}
                                                <div className="care-level-badge" style={{ backgroundColor: careInfo.color }}>
                                                    <i className="fas fa-seedling"></i>
                                                    {careInfo.level} Care
                                                </div>

                                                {/* Plant Details */}
                                                <div className="plant-details-grid">
                                                    <div className="detail-item">
                                                        <i className="fas fa-sun" style={{ color: '#f59e0b' }}></i>
                                                        <div>
                                                            <span className="detail-label">Light</span>
                                                            <span className="detail-value">{plant.light || 'Varies'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="detail-item">
                                                        <i className="fas fa-tint" style={{ color: '#3b82f6' }}></i>
                                                        <div>
                                                            <span className="detail-label">Humidity</span>
                                                            <span className="detail-value">{plant.humidity || 'Varies'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="detail-item">
                                                        <i className="fas fa-thermometer-half" style={{ color: '#ef4444' }}></i>
                                                        <div>
                                                            <span className="detail-label">Temperature</span>
                                                            <span className="detail-value">{plant.temperature || 'Varies'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Quick Stats */}
                                                <div className="quick-stats">
                                                    <div className="stat">
                                                        <div className="stat-value">
                                                            {plant.type === 'succulent' ? 'Low' : 
                                                             plant.type === 'tropical' ? 'High' : 'Moderate'}
                                                        </div>
                                                        <div className="stat-label">Water</div>
                                                    </div>
                                                    <div className="stat">
                                                        <div className="stat-value">
                                                            {plant.type === 'succulent' ? 'Slow' : 'Moderate'}
                                                        </div>
                                                        <div className="stat-label">Growth</div>
                                                    </div>
                                                    <div className="stat">
                                                        <div className="stat-value">
                                                            {plant.type === 'flowering' ? 'Seasonal' : 'Year-round'}
                                                        </div>
                                                        <div className="stat-label">Blooms</div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="plant-actions">
                                                    <button className="btn-outline">
                                                        <i className="fas fa-info-circle"></i>
                                                        Details
                                                    </button>
                                                    <button className="btn-primary">
                                                        <i className="fas fa-plus"></i>
                                                        Add to My Plants
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PlantEncyclopedia;