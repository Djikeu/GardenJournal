import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const MyPlants = ({ showNotification }) => {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'healthy', 'warning', 'danger'

    useEffect(() => {
        loadMyPlants();
    }, []);

    const loadMyPlants = async () => {
        try {
            setLoading(true);
            const response = await apiService.getPlants();
            setPlants(response.data);
        } catch (error) {
            showNotification('Error', 'Failed to load your plants', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'danger': return '#ef4444';
            default: return '#10b981';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'healthy': return 'Healthy';
            case 'warning': return 'Needs Care';
            case 'danger': return 'Critical';
            default: return 'Healthy';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'outdoor': return 'fa-sun';
            case 'indoor': return 'fa-home';
            case 'succulent': return 'fa-leaf';
            case 'tropical': return 'fa-pagelines';
            case 'vegetable': return 'fa-carrot';
            case 'flowering': return 'fa-spa';
            case 'herb': return 'fa-leaf';
            default: return 'fa-seedling';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'indoor': return '#3b82f6';
            case 'outdoor': return '#f59e0b';
            case 'succulent': return '#10b981';
            case 'tropical': return '#059669';
            case 'vegetable': return '#ea580c';
            case 'flowering': return '#8b5cf6';
            case 'herb': return '#16a34a';
            default: return '#7db36e';
        }
    };

    const getCareLevel = (type) => {
        switch (type) {
            case 'succulent': return { level: 'Easy', color: '#10b981' };
            case 'indoor': return { level: 'Moderate', color: '#f59e0b' };
            case 'herb': return { level: 'Easy', color: '#10b981' };
            case 'outdoor': return { level: 'Moderate', color: '#f59e0b' };
            case 'vegetable': return { level: 'Moderate', color: '#f59e0b' };
            case 'flowering': return { level: 'Advanced', color: '#ef4444' };
            case 'tropical': return { level: 'Advanced', color: '#ef4444' };
            default: return { level: 'Moderate', color: '#f59e0b' };
        }
    };

    // Filter plants based on search and status
    const filteredPlants = plants.filter(plant => {
        const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (plant.species && plant.species.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'all' || plant.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const healthyPlants = plants.filter(plant => plant.status === 'healthy').length;
    const warningPlants = plants.filter(plant => plant.status === 'warning').length;
    const criticalPlants = plants.filter(plant => plant.status === 'danger').length;

    if (loading) {
        return (
            <div className="plants-loading">
                <div className="loading-spinner">
                    <i className="fas fa-leaf"></i>
                </div>
                <h3>Loading Your Plants</h3>
                <p>Growing your plant collection...</p>
            </div>
        );
    }

    return (
        <div className="my-plants">
            {/* Hero Header */}
            <div className="plants-hero">
                <div className="hero-content">
                    <h1>
                        <i className="fas fa-leaf"></i>
                        My Plants
                    </h1>
                    <p className="hero-subtitle">
                        Manage and monitor your plant collection. Track growth, health, and care needs all in one place.
                    </p>
                </div>
                <div className="hero-stats">
                    <div className="stat-item">
                        <div className="stat-number">{plants.length}</div>
                        <div className="stat-label">Total Plants</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{healthyPlants}</div>
                        <div className="stat-label">Healthy</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{warningPlants}</div>
                        <div className="stat-label">Needs Care</div>
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="plants-controls">
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
                        <h4>Filter by Health Status</h4>
                        {filterStatus !== 'all' && (
                            <button 
                                className="clear-filters"
                                onClick={() => setFilterStatus('all')}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                    <div className="filter-chips">
                        {['all', 'healthy', 'warning', 'danger'].map(status => (
                            <button
                                key={status}
                                className={`filter-chip ${filterStatus === status ? 'active' : ''}`}
                                onClick={() => setFilterStatus(status)}
                                style={filterStatus === status ? { 
                                    backgroundColor: getStatusColor(status),
                                    borderColor: getStatusColor(status)
                                } : {}}
                            >
                                <i className={`fas ${
                                    status === 'all' ? 'fa-seedling' :
                                    status === 'healthy' ? 'fa-heart' :
                                    status === 'warning' ? 'fa-exclamation-triangle' : 'fa-skull-crossbones'
                                }`}></i>
                                {status === 'all' ? 'All Plants' : 
                                 status === 'healthy' ? 'Healthy' :
                                 status === 'warning' ? 'Needs Care' : 'Critical'}
                                <span className="chip-count">
                                    {status === 'all' ? plants.length :
                                     status === 'healthy' ? healthyPlants :
                                     status === 'warning' ? warningPlants : criticalPlants}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Health Overview */}
            <div className="health-overview">
                <div className="stat-card-enhanced primary">
                    <div className="stat-icon">
                        <i className="fas fa-heart"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{healthyPlants}</div>
                        <div className="stat-label">Healthy Plants</div>
                        <div className="stat-trend">
                            <i className="fas fa-smile"></i>
                            <span>Thriving well</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card-enhanced warning">
                    <div className="stat-icon">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{warningPlants}</div>
                        <div className="stat-label">Need Attention</div>
                        <div className="stat-trend">
                            <i className="fas fa-clock"></i>
                            <span>Check soon</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card-enhanced danger">
                    <div className="stat-icon">
                        <i className="fas fa-skull-crossbones"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{criticalPlants}</div>
                        <div className="stat-label">Critical Condition</div>
                        <div className="stat-trend">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>Immediate care needed</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card-enhanced success">
                    <div className="stat-icon">
                        <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">
                            {plants.length > 0 ? Math.round((healthyPlants / plants.length) * 100) : 0}%
                        </div>
                        <div className="stat-label">Health Rate</div>
                        <div className="stat-trend">
                            <i className="fas fa-trend-up"></i>
                            <span>Overall wellness</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plants Grid */}
            <div className="plants-section">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <i className="fas fa-seedling"></i>
                            My Plant Collection ({filteredPlants.length})
                        </h3>
                        <div className="card-actions">
                            <button className="card-btn" title="Refresh" onClick={loadMyPlants}>
                                <i className="fas fa-sync-alt"></i>
                            </button>
                            <button className="card-btn" title="Add Plant">
                                <i className="fas fa-plus"></i>
                            </button>
                            <button className="card-btn" title="Filter">
                                <i className="fas fa-filter"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div className="plants-content">
                        {filteredPlants.length === 0 ? (
                            <div className="no-results">
                                <div className="no-results-icon">
                                    <i className="fas fa-seedling"></i>
                                </div>
                                <h3>No plants found</h3>
                                <p>
                                    {searchTerm || filterStatus !== 'all' ? 
                                        "No plants match your criteria. Try adjusting your search or filters." :
                                        "Start by adding your first plant to your collection"
                                    }
                                </p>
                                <div className="no-results-actions">
                                    {(searchTerm || filterStatus !== 'all') ? (
                                        <button 
                                            className="btn-primary" 
                                            onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                                        >
                                            <i className="fas fa-undo"></i>
                                            Reset Filters
                                        </button>
                                    ) : (
                                        <button className="btn-primary">
                                            <i className="fas fa-plus"></i>
                                            Add Your First Plant
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className={`plants-container ${viewMode}-view`}>
                                {filteredPlants.map(plant => {
                                    const statusColor = getStatusColor(plant.status);
                                    const typeColor = getTypeColor(plant.type);
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
                                                            <div className="plant-status-tag" style={{ backgroundColor: statusColor }}>
                                                                <i className={`fas ${
                                                                    plant.status === 'healthy' ? 'fa-heart' :
                                                                    plant.status === 'warning' ? 'fa-exclamation-triangle' : 'fa-skull-crossbones'
                                                                }`}></i>
                                                                {getStatusText(plant.status)}
                                                            </div>
                                                            <div className="plant-type-tag" style={{ backgroundColor: typeColor }}>
                                                                <i className={`fas ${getTypeIcon(plant.type)}`}></i>
                                                                {plant.type}
                                                            </div>
                                                            <div className="plant-actions-overlay">
                                                                <button className={`icon-btn favorite-btn ${plant.is_favorite ? 'active' : ''}`} 
                                                                        title={plant.is_favorite ? 'Remove from favorites' : 'Add to favorites'}>
                                                                    <i className={`${plant.is_favorite ? 'fas' : 'far'} fa-heart`}></i>
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

                                                    {/* Last Watered */}
                                                    {plant.last_watered && (
                                                        <div className="watering-info">
                                                            <i className="fas fa-clock" style={{ color: '#6b7280' }}></i>
                                                            <span>Last watered: {new Date(plant.last_watered).toLocaleDateString()}</span>
                                                        </div>
                                                    )}

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
                                                            <i className="fas fa-edit"></i>
                                                            Edit
                                                        </button>
                                                        <button className="btn-outline">
                                                            <i className="fas fa-book"></i>
                                                            Journal
                                                        </button>
                                                        <button className="btn-primary">
                                                            <i className="fas fa-tasks"></i>
                                                            Care Tasks
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyPlants;