// PlantDetail.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import '../../detail.css';

const PlantDetail = ({ showNotification, user, plantId, onClose, onBack }) => {
    const [plant, setPlant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedPlants, setRelatedPlants] = useState([]);
    const [addingToCollection, setAddingToCollection] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (plantId) {
            loadPlantDetails();
        }
    }, [plantId]);

    const loadPlantDetails = async () => {
        try {
            setLoading(true);
            console.log('🌱 Loading plant details for ID:', plantId);
            
            // First try to get from encyclopedia
            const response = await apiService.getPlantsEncyclopedia();
            if (response.success) {
                const foundPlant = response.data.find(p => p.id == plantId);
                if (foundPlant) {
                    setPlant(foundPlant);
                    loadRelatedPlants(foundPlant.type);
                    return;
                }
            }
            
            // If not found in encyclopedia, try user plants
            const userResponse = await apiService.getPlants();
            if (userResponse.success) {
                const userPlant = userResponse.data.find(p => p.id == plantId);
                if (userPlant) {
                    setPlant(userPlant);
                    loadRelatedPlants(userPlant.type);
                    return;
                }
            }
            
            throw new Error('Plant not found');
            
        } catch (error) {
            console.error('❌ Load plant details error:', error);
            showNotification('Error', 'Failed to load plant details', 'error');
            onBack();
        } finally {
            setLoading(false);
        }
    };

    const loadRelatedPlants = async (type) => {
        try {
            const response = await apiService.getPlantsEncyclopedia();
            if (response.success) {
                const related = response.data
                    .filter(p => p.type === type && p.id != plantId)
                    .slice(0, 3);
                setRelatedPlants(related);
            }
        } catch (error) {
            console.error('Failed to load related plants:', error);
        }
    };

    const addToCollection = async () => {
        if (!plant) return;
        
        try {
            setAddingToCollection(true);
            
            const plantData = {
                name: plant.name,
                species: plant.species || '',
                type: plant.type || 'indoor',
                description: plant.description || '',
                light_requirements: plant.light_requirements || 'medium',
                watering_schedule: plant.watering_schedule || 'weekly',
                image_url: plant.image_url || plant.image || '',
                status: 'healthy',
                is_favorite: false,
                encyclopedia_id: plant.id
            };

            const response = await apiService.createPlant(plantData);
            
            if (response.success) {
                showNotification('Success', `${plant.name} added to your collection!`, 'success');
                // Update UI to show it's been added
                setPlant(prev => ({ ...prev, inCollection: true }));
            }
        } catch (error) {
            console.error('❌ Add to collection error:', error);
            showNotification('Error', `Failed to add plant: ${error.message}`, 'error');
        } finally {
            setAddingToCollection(false);
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
            'succulent': { level: 'Easy', color: '#10b981', bgColor: '#d1fae5' },
            'indoor': { level: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7' },
            'herb': { level: 'Easy', color: '#10b981', bgColor: '#d1fae5' },
            'outdoor': { level: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7' },
            'vegetable': { level: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7' },
            'flowering': { level: 'Advanced', color: '#ef4444', bgColor: '#fee2e2' },
            'tropical': { level: 'Advanced', color: '#ef4444', bgColor: '#fee2e2' }
        };
        return levels[type] || { level: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7' };
    };

    const getWateringFrequency = (schedule) => {
        const frequencies = {
            'daily': 'Every day',
            'weekly': 'Once a week',
            'bi-weekly': 'Every 2 weeks',
            'monthly': 'Once a month',
            'rarely': 'Very rarely'
        };
        return frequencies[schedule?.toLowerCase()] || schedule || 'Once a week';
    };

    if (loading) {
        return (
            <div className="plant-detail-loading">
                <div className="loading-spinner">
                    <div className="spinner-circle"></div>
                    <i className="fas fa-seedling"></i>
                </div>
                <h3>Loading Plant Details</h3>
                <p>Discovering amazing details...</p>
            </div>
        );
    }

    if (!plant) {
        return (
            <div className="plant-detail-not-found">
                <div className="not-found-icon">
                    <i className="fas fa-exclamation-circle"></i>
                </div>
                <h3>Plant Not Found</h3>
                <p>The plant you're looking for doesn't exist or has been removed.</p>
                <button className="btn-primary" onClick={onBack}>
                    <i className="fas fa-arrow-left"></i>
                    Back to Encyclopedia
                </button>
            </div>
        );
    }

    const careInfo = getCareLevel(plant.type);
    const isInCollection = plant.inCollection || plant.is_added;

    return (
        <div className="plant-detail-wrapper">
            <div className="plant-detail-container">
                {/* Header with Back Button */}
                <div className="plant-detail-header">
                    <button className="back-button" onClick={onBack}>
                        <i className="fas fa-arrow-left"></i>
                        <span>Back</span>
                    </button>
                    <div className="header-actions">
                        <button className="btn-icon" title="Share">
                            <i className="fas fa-share-alt"></i>
                        </button>
                        <button className="btn-icon" title="Print">
                            <i className="fas fa-print"></i>
                        </button>
                        <button className="btn-icon" title="Bookmark">
                            <i className="fas fa-bookmark"></i>
                        </button>
                    </div>
                </div>

                {/* Plant Header Section */}
                <div className="plant-header-section">
                    <div className="plant-image-container">
                        <img
                            src={plant.image_url || plant.image || 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800'}
                            alt={plant.name}
                            className="plant-main-image"
                        />
                        <div className="image-overlay">
                            <div className="plant-tags">
                                <span 
                                    className="plant-tag type-tag" 
                                    style={{ 
                                        backgroundColor: getTypeColor(plant.type),
                                        color: 'white'
                                    }}
                                >
                                    <i className={`fas ${getTypeIcon(plant.type)}`}></i>
                                    {plant.type.charAt(0).toUpperCase() + plant.type.slice(1)}
                                </span>
                                <span 
                                    className="plant-tag care-tag"
                                    style={{ 
                                        backgroundColor: careInfo.bgColor,
                                        color: careInfo.color,
                                        border: `1px solid ${careInfo.color}20`
                                    }}
                                >
                                    <i className="fas fa-seedling"></i>
                                    {careInfo.level} Care
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="plant-info-section">
                        <div className="plant-title-section">
                            <h1 className="plant-name">{plant.name}</h1>
                            {plant.species && (
                                <h2 className="plant-species">
                                    <i className="fas fa-leaf"></i>
                                    {plant.species}
                                </h2>
                            )}
                            <div className="plant-meta">
                                <span className="meta-item">
                                    <i className="fas fa-calendar-alt"></i>
                                    Added {new Date(plant.created_at).toLocaleDateString()}
                                </span>
                                <span className="meta-item">
                                    <i className="fas fa-eye"></i>
                                    1.2k views
                                </span>
                            </div>
                        </div>

                        <div className="plant-quick-stats">
                            <div className="quick-stat">
                                <div className="stat-icon light">
                                    <i className="fas fa-sun"></i>
                                </div>
                                <div className="stat-content">
                                    <span className="stat-label">Light</span>
                                    <span className="stat-value">{plant.light_requirements || 'Medium'}</span>
                                </div>
                            </div>
                            <div className="quick-stat">
                                <div className="stat-icon water">
                                    <i className="fas fa-tint"></i>
                                </div>
                                <div className="stat-content">
                                    <span className="stat-label">Water</span>
                                    <span className="stat-value">{getWateringFrequency(plant.watering_schedule)}</span>
                                </div>
                            </div>
                            <div className="quick-stat">
                                <div className="stat-icon temperature">
                                    <i className="fas fa-thermometer-half"></i>
                                </div>
                                <div className="stat-content">
                                    <span className="stat-label">Temp</span>
                                    <span className="stat-value">
                                        {plant.temperature_range || (plant.type === 'tropical' ? '18-27°C' : '15-24°C')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="plant-description-preview">
                            <p>{plant.description || 'A beautiful plant that adds life to any space. Perfect for both beginners and experienced plant enthusiasts.'}</p>
                        </div>

                        <div className="plant-action-buttons">
                            {isInCollection ? (
                                <button className="btn-success" disabled>
                                    <i className="fas fa-check"></i>
                                    In Your Collection
                                </button>
                            ) : (
                                <button 
                                    className="btn-primary"
                                    onClick={addToCollection}
                                    disabled={addingToCollection}
                                >
                                    {addingToCollection ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-plus"></i>
                                            Add to My Plants
                                        </>
                                    )}
                                </button>
                            )}
                            <button className="btn-secondary">
                                <i className="fas fa-heart"></i>
                                Favorite
                            </button>
                            <button className="btn-outline">
                                <i className="fas fa-question-circle"></i>
                                Ask Expert
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="plant-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <i className="fas fa-info-circle"></i>
                        Overview
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'care' ? 'active' : ''}`}
                        onClick={() => setActiveTab('care')}
                    >
                        <i className="fas fa-hand-holding-water"></i>
                        Care Guide
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
                        onClick={() => setActiveTab('gallery')}
                    >
                        <i className="fas fa-images"></i>
                        Gallery
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'tips' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tips')}
                    >
                        <i className="fas fa-lightbulb"></i>
                        Tips & Tricks
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="overview-content">
                            <div className="detail-cards-grid">
                                <div className="detail-card">
                                    <div className="card-header">
                                        <div className="card-icon sun">
                                            <i className="fas fa-sun"></i>
                                        </div>
                                        <h3>Light Requirements</h3>
                                    </div>
                                    <div className="card-body">
                                        <p className="requirement-level">{plant.light_requirements || 'Medium'} Light</p>
                                        <p className="requirement-desc">
                                            {plant.type === 'indoor' 
                                                ? 'Thrives in bright, indirect light. Avoid direct sunlight which can scorch leaves.'
                                                : 'Prefers full sun to partial shade depending on the season.'
                                            }
                                        </p>
                                        <div className="light-meter">
                                            <div className="meter-bar">
                                                <div className="meter-fill" style={{ width: '70%' }}></div>
                                            </div>
                                            <div className="meter-labels">
                                                <span>Low</span>
                                                <span>Medium</span>
                                                <span>High</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="card-header">
                                        <div className="card-icon water">
                                            <i className="fas fa-tint"></i>
                                        </div>
                                        <h3>Watering Guide</h3>
                                    </div>
                                    <div className="card-body">
                                        <p className="requirement-level">{getWateringFrequency(plant.watering_schedule)}</p>
                                        <p className="requirement-desc">
                                            Water thoroughly when the top inch of soil feels dry. 
                                            {plant.type === 'succulent' 
                                                ? ' Allow soil to completely dry between waterings.'
                                                : ' Maintain consistent moisture.'
                                            }
                                        </p>
                                        <div className="watering-tips">
                                            <div className="tip">
                                                <i className="fas fa-check-circle"></i>
                                                <span>Use room temperature water</span>
                                            </div>
                                            <div className="tip">
                                                <i className="fas fa-check-circle"></i>
                                                <span>Water in the morning</span>
                                            </div>
                                            <div className="tip">
                                                <i className="fas fa-check-circle"></i>
                                                <span>Avoid overwatering</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="card-header">
                                        <div className="card-icon soil">
                                            <i className="fas fa-seedling"></i>
                                        </div>
                                        <h3>Soil & Fertilizer</h3>
                                    </div>
                                    <div className="card-body">
                                        <p className="requirement-level">
                                            {plant.type === 'succulent' ? 'Well-draining mix' : 
                                             plant.type === 'tropical' ? 'Rich, moist soil' : 
                                             'Standard potting mix'}
                                        </p>
                                        <p className="requirement-desc">
                                            Use {plant.type === 'succulent' ? 'cactus/succulent mix' : 'quality potting soil'} with good drainage.
                                            Fertilize monthly during growing season with balanced fertilizer.
                                        </p>
                                        <div className="fertilizer-schedule">
                                            <div className="schedule-item active">
                                                <span>Spring</span>
                                                <i className="fas fa-check"></i>
                                            </div>
                                            <div className="schedule-item active">
                                                <span>Summer</span>
                                                <i className="fas fa-check"></i>
                                            </div>
                                            <div className="schedule-item">
                                                <span>Fall</span>
                                                <i className="fas fa-pause"></i>
                                            </div>
                                            <div className="schedule-item">
                                                <span>Winter</span>
                                                <i className="fas fa-pause"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-card">
                                    <div className="card-header">
                                        <div className="card-icon environment">
                                            <i className="fas fa-wind"></i>
                                        </div>
                                        <h3>Environment</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="environment-stats">
                                            <div className="env-stat">
                                                <span className="stat-label">Temperature</span>
                                                <span className="stat-value">
                                                    {plant.temperature_range || (plant.type === 'tropical' ? '18-27°C' : '15-24°C')}
                                                </span>
                                            </div>
                                            <div className="env-stat">
                                                <span className="stat-label">Humidity</span>
                                                <span className="stat-value">
                                                    {plant.humidity_requirements || (plant.type === 'tropical' ? '60-80%' : '40-60%')}
                                                </span>
                                            </div>
                                            <div className="env-stat">
                                                <span className="stat-label">Toxicity</span>
                                                <span className="stat-value safe">
                                                    <i className="fas fa-paw"></i>
                                                    Pet Safe
                                                </span>
                                            </div>
                                        </div>
                                        <p className="environment-tip">
                                            Keep away from drafts and heating vents. 
                                            {plant.type === 'tropical' && ' Mist leaves regularly to maintain humidity.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Full Description */}
                            {plant.description && (
                                <div className="full-description">
                                    <h3>About {plant.name}</h3>
                                    <div className="description-content">
                                        <p>{plant.description}</p>
                                        <div className="description-features">
                                            <div className="feature">
                                                <i className="fas fa-star"></i>
                                                <span>Purifies air quality</span>
                                            </div>
                                            <div className="feature">
                                                <i className="fas fa-star"></i>
                                                <span>Low maintenance</span>
                                            </div>
                                            <div className="feature">
                                                <i className="fas fa-star"></i>
                                                <span>Non-toxic to pets</span>
                                            </div>
                                            <div className="feature">
                                                <i className="fas fa-star"></i>
                                                <span>Great for beginners</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'care' && (
                        <div className="care-guide-content">
                            <div className="care-timeline">
                                <div className="timeline-item">
                                    <div className="timeline-marker">
                                        <i className="fas fa-water"></i>
                                    </div>
                                    <div className="timeline-content">
                                        <h4>Watering Schedule</h4>
                                        <p>Check soil moisture weekly. Water when top 1-2 inches are dry.</p>
                                        <div className="timeline-tip">
                                            <strong>Tip:</strong> Use your finger to test soil moisture.
                                        </div>
                                    </div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-marker">
                                        <i className="fas fa-cut"></i>
                                    </div>
                                    <div className="timeline-content">
                                        <h4>Pruning & Maintenance</h4>
                                        <p>Remove dead or yellow leaves regularly to promote new growth.</p>
                                    </div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-marker">
                                        <i className="fas fa-bug"></i>
                                    </div>
                                    <div className="timeline-content">
                                        <h4>Pest Control</h4>
                                        <p>Check for pests weekly. Treat with neem oil if needed.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Related Plants */}
                {relatedPlants.length > 0 && (
                    <div className="related-plants-section">
                        <div className="section-header">
                            <h3>Similar Plants</h3>
                            <p>You might also like these plants</p>
                        </div>
                        <div className="related-plants-grid">
                            {relatedPlants.map(relatedPlant => (
                                <div key={relatedPlant.id} className="related-plant-card" onClick={() => window.location.hash = `plant/${relatedPlant.id}`}>
                                    <div className="related-plant-image">
                                        <img
                                            src={relatedPlant.image_url || relatedPlant.image || 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400'}
                                            alt={relatedPlant.name}
                                        />
                                        <div className="related-plant-overlay">
                                            <span className="related-plant-type">
                                                {relatedPlant.type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="related-plant-info">
                                        <h4>{relatedPlant.name}</h4>
                                        <div className="related-plant-meta">
                                            <span className="meta-item">
                                                <i className="fas fa-sun"></i>
                                                {relatedPlant.light_requirements || 'Medium'}
                                            </span>
                                            <span className="meta-item">
                                                <i className="fas fa-tint"></i>
                                                {getWateringFrequency(relatedPlant.watering_schedule)}
                                            </span>
                                        </div>
                                        <button className="btn-view">
                                            View Details
                                            <i className="fas fa-arrow-right"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlantDetail;