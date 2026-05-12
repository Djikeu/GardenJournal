// PlantDetail.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import ExportButton from '../Export/ExportButton';
import { escHtml } from '../../utils/exportReport';
import { formatDateDMY } from '../../utils/dateFormat';
import '../../detail.css';

const PlantDetail = ({ showNotification, user, plantId, onClose, onBack }) => {
    const [plant, setPlant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedPlants, setRelatedPlants] = useState([]);
    const [addingToCollection, setAddingToCollection] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [isInCollection, setIsInCollection] = useState(false);

    useEffect(() => {
        if (plantId) {
            loadPlantDetails();
        }
    }, [plantId]);

    useEffect(() => {
        if (plant && user) {
            checkIfInCollection();
        }
    }, [plant, user]);

    const loadPlantDetails = async () => {
        try {
            setLoading(true);
            console.log('🌱 Loading plant details for ID:', plantId);

            const response = await apiService.getPlantsEncyclopedia();
            if (response.success) {
                const foundPlant = response.data.find(p => p.id == plantId);
                if (foundPlant) {
                    setPlant(foundPlant);
                    loadRelatedPlants(foundPlant.type);
                    return;
                }
            }

            const userResponse = await apiService.getPlants();
            if (userResponse.success) {
                const userPlant = userResponse.data.find(p => p.id == plantId);
                if (userPlant) {
                    setPlant(userPlant);
                    setIsInCollection(true);
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

    const checkIfInCollection = async () => {
        if (!user || !plant) return;

        try {
            const userResponse = await apiService.getPlants();
            if (userResponse.success) {
                const found = userResponse.data.some(p =>
                    p.id == plantId ||
                    p.encyclopedia_id == plantId
                );
                setIsInCollection(found);
            }
        } catch (error) {
            console.error('Error checking collection:', error);
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
                temperature_range: plant.temperature_range || '',
                humidity_requirements: plant.humidity_requirements || '',
                growth_rate: plant.growth_rate || '',
                difficulty: plant.difficulty || '',
                care_instructions: plant.care_instructions || '',
                image_url: plant.image_url || plant.image || '',
                status: 'healthy',
                is_favorite: false,
                encyclopedia_id: plant.id
            };

            const response = await apiService.createPlant(plantData);

            if (response.success) {
                showNotification('Success', `${plant.name} added to your collection!`, 'success');
                setIsInCollection(true);
            }
        } catch (error) {
            console.error('❌ Add to collection error:', error);
            showNotification('Error', `Failed to add plant: ${error.message}`, 'error');
        } finally {
            setAddingToCollection(false);
        }
    };

    const removeFromCollection = async () => {
        if (!plant) return;

        if (!window.confirm(`Are you sure you want to remove "${plant.name}" from your collection?`)) {
            return;
        }

        try {
            const response = await apiService.deletePlant(plantId);
            if (response.success) {
                showNotification('Success', 'Plant removed from collection!', 'success');
                setIsInCollection(false);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Remove plant error:', error);
            showNotification('Error', error.message, 'error');
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

    // UPDATED: Use database difficulty if available
    const getCareLevel = (plant) => {
        // Use database difficulty first
        if (plant.difficulty) {
            const levelMap = {
                'Easy': { level: 'Easy', color: '#10b981', bgColor: '#d1fae5' },
                'Moderate': { level: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7' },
                'Advanced': { level: 'Advanced', color: '#ef4444', bgColor: '#fee2e2' }
            };
            return levelMap[plant.difficulty] || { level: plant.difficulty, color: '#7db36e', bgColor: '#f3f4f6' };
        }

        // Fallback to type-based logic
        const levels = {
            'succulent': { level: 'Easy', color: '#10b981', bgColor: '#d1fae5' },
            'indoor': { level: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7' },
            'herb': { level: 'Easy', color: '#10b981', bgColor: '#d1fae5' },
            'outdoor': { level: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7' },
            'vegetable': { level: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7' },
            'flowering': { level: 'Advanced', color: '#ef4444', bgColor: '#fee2e2' },
            'tropical': { level: 'Advanced', color: '#ef4444', bgColor: '#fee2e2' }
        };
        return levels[plant.type] || { level: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7' };
    };

    const getWateringFrequency = (schedule) => {
        const frequencies = {
            'daily': 'Every day',
            'weekly': 'Once a week',
            'bi-weekly': 'Every 2 weeks',
            'monthly': 'Once a month',
            'rarely': 'Very rarely',
            'Every 2-3 weeks': 'Every 2-3 weeks',
            'Every 3-4 weeks': 'Every 3-4 weeks',
            'Twice weekly': 'Twice weekly',
            'Every 2-3 days': 'Every 2-3 days',
            'Weekly (soak & drain)': 'Weekly (soak & drain)',
            'Weekly (allow to dry)': 'Weekly (allow to dry)'
        };
        return frequencies[schedule] || schedule || 'Once a week';
    };

    // Helper to get light meter percentage
    const getLightPercentage = (lightReq) => {
        if (!lightReq) return 70;
        const light = lightReq.toLowerCase();
        if (light.includes('low')) return 33;
        if (light.includes('medium') || light.includes('indirect')) return 66;
        if (light.includes('high') || light.includes('full') || light.includes('bright')) return 100;
        return 70;
    };

    // Helper to get soil type recommendation
    const getSoilType = (plant) => {
        if (plant.type === 'succulent') return 'Cactus/Succulent mix';
        if (plant.type === 'tropical') return 'Rich, organic potting mix';
        if (plant.care_instructions) {
            if (plant.care_instructions.toLowerCase().includes('well-draining')) return 'Well-draining potting mix';
        }
        return 'Standard potting mix';
    };

    // Helper to get toxicity info
    const getToxicity = (plant) => {
        // Check care instructions for toxicity info
        if (plant.care_instructions && plant.care_instructions.toLowerCase().includes('toxic')) {
            return { safe: false, text: 'Toxic to pets', icon: 'fa-exclamation-triangle', color: '#ef4444' };
        }
        // Most succulents and common houseplants are pet-safe
        if (plant.type === 'succulent' || plant.name === 'Spider Plant' || plant.name === 'Jade Plant') {
            return { safe: true, text: 'Pet Safe', icon: 'fa-paw', color: '#10b981' };
        }
        return { safe: true, text: 'Pet Safe', icon: 'fa-paw', color: '#10b981' };
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

    const careInfo = getCareLevel(plant);
    const toxicity = getToxicity(plant);

    // ── Build a printable / downloadable report for this plant ─────────
    const buildPlantReport = (p) => {
        if (!p) return { title: 'Plant Report', bodyHtml: '<p>No data.</p>' };
        const ci = getCareLevel(p);
        const tox = getToxicity(p);
        const safe = (v) => escHtml(v ?? '—');
        const img = p.image_url || p.image || '';
        return {
            title: `${p.name} — Plant Report`,
            bodyHtml: `
                ${img ? `<img src="${escHtml(img)}" alt="${safe(p.name)}" class="plant-image" />` : ''}

                <p><strong style="font-size: 16px;">${safe(p.name)}</strong>
                ${p.species ? `<br/><em style="color:#6b7280;">${safe(p.species)}</em>` : ''}</p>

                <p>
                    <span class="badge">${safe(p.type || 'plant')}</span>
                    <span class="badge" style="background:#fef3c7;color:#78350f;">${safe(ci.level)} care</span>
                    <span class="badge" style="background:${tox.safe ? '#d1fae5' : '#fee2e2'};color:${tox.safe ? '#166534' : '#991b1b'};">${safe(tox.text)}</span>
                </p>

                <h2>Quick Stats</h2>
                <div class="stat-row">
                    <div class="stat-card"><div class="num">${safe(p.light_requirements || 'Medium')}</div><div class="lbl">Light</div></div>
                    <div class="stat-card"><div class="num">${safe(getWateringFrequency(p.watering_schedule))}</div><div class="lbl">Watering</div></div>
                    <div class="stat-card"><div class="num">${safe(p.temperature_range || '18–26°C')}</div><div class="lbl">Temperature</div></div>
                </div>

                <h2>Plant Profile</h2>
                <table>
                    <tbody>
                        <tr><th>Common name</th><td>${safe(p.name)}</td></tr>
                        <tr><th>Species</th><td>${safe(p.species)}</td></tr>
                        <tr><th>Type</th><td>${safe(p.type)}</td></tr>
                        <tr><th>Care difficulty</th><td>${safe(ci.level)}</td></tr>
                        <tr><th>Light requirements</th><td>${safe(p.light_requirements)}</td></tr>
                        <tr><th>Watering schedule</th><td>${safe(getWateringFrequency(p.watering_schedule))}</td></tr>
                        <tr><th>Temperature range</th><td>${safe(p.temperature_range || '18–26°C')}</td></tr>
                        <tr><th>Humidity</th><td>${safe(p.humidity_requirements || '40–60%')}</td></tr>
                        <tr><th>Growth rate</th><td>${safe(p.growth_rate || 'Moderate')}</td></tr>
                        <tr><th>Toxicity</th><td>${safe(tox.text)}</td></tr>
                        <tr><th>Soil</th><td>${safe(getSoilType(p))}</td></tr>
                        <tr><th>Added</th><td>${p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td></tr>
                    </tbody>
                </table>

                ${p.description ? `
                    <h2>About ${safe(p.name)}</h2>
                    <p>${safe(p.description)}</p>
                ` : ''}

                ${p.care_instructions ? `
                    <h2>Care Instructions</h2>
                    <ul>
                        ${p.care_instructions.split('. ').filter(s => s.trim()).map(t => `<li>${safe(t.trim().replace(/\.$/, ''))}.</li>`).join('')}
                    </ul>
                ` : ''}
            `
        };
    };

    return (
        <div className="plant-detail-wrapper">
            <div className="plant-detail-container">
                {/* Header with Back Button */}
                <div className="plant-detail-header">
                    <button className="back-button" onClick={onBack}>
                        <i className="fas fa-arrow-left"></i>
                        <span>Back</span>
                    </button>
                    <ExportButton
                        label="Export Report"
                        getReport={() => buildPlantReport(plant)}
                    />
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
                                {plant.growth_rate && (
                                    <span className="plant-tag growth-tag" style={{ backgroundColor: '#6b7280', color: 'white' }}>
                                        <i className="fas fa-chart-line"></i>
                                        {plant.growth_rate} Growth
                                    </span>
                                )}
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
                                        {plant.temperature_range || '18-26°C'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="plant-description-preview">
                            <p>{plant.description || 'A beautiful plant that adds life to any space. Perfect for both beginners and experienced plant enthusiasts.'}</p>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="plant-action-buttons">
                            {isInCollection ? (
                                <button
                                    className="btn-warning"
                                    onClick={removeFromCollection}
                                >
                                    <i className="fas fa-times"></i>
                                    Remove from My Plants
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
                            <button
                                className="btn-outline"
                                onClick={() => { window.location.hash = 'community'; }}
                            >
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
                                            {plant.care_instructions
                                                ? plant.care_instructions.split('.')[0] + '.'
                                                : (plant.type === 'indoor'
                                                    ? 'Thrives in bright, indirect light. Avoid direct sunlight which can scorch leaves.'
                                                    : 'Prefers full sun to partial shade depending on the season.')
                                            }
                                        </p>
                                        <div className="light-meter">
                                            <div className="meter-bar">
                                                <div className="meter-fill" style={{ width: `${getLightPercentage(plant.light_requirements)}%` }}></div>
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
                                            {plant.care_instructions
                                                ? plant.care_instructions.split('.')[1] || plant.care_instructions.split('.')[0]
                                                : (plant.type === 'succulent'
                                                    ? 'Water thoroughly when soil is completely dry. Allow soil to completely dry between waterings.'
                                                    : 'Water when top inch of soil feels dry. Maintain consistent moisture.')
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
                                        <p className="requirement-level">{getSoilType(plant)}</p>
                                        <p className="requirement-desc">
                                            Use {getSoilType(plant).toLowerCase()} with good drainage.
                                            {plant.type === 'vegetable'
                                                ? ' Fertilize every 2 weeks during fruiting season.'
                                                : ' Fertilize monthly during growing season with balanced fertilizer.'}
                                        </p>
                                        <div className="fertilizer-schedule">
                                            <div className={`schedule-item ${['Spring', 'Summer'].includes(activeTab) ? 'active' : 'active'}`}>
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
                                                    {plant.temperature_range || '18-26°C'}
                                                </span>
                                            </div>
                                            <div className="env-stat">
                                                <span className="stat-label">Humidity</span>
                                                <span className="stat-value">
                                                    {plant.humidity_requirements || '40-60%'}
                                                </span>
                                            </div>
                                            <div className="env-stat">
                                                <span className="stat-label">Growth Rate</span>
                                                <span className="stat-value">
                                                    {plant.growth_rate || 'Moderate'}
                                                </span>
                                            </div>
                                            <div className="env-stat">
                                                <span className="stat-label">Toxicity</span>
                                                <span className={`stat-value ${toxicity.safe ? 'safe' : 'toxic'}`} style={{ color: toxicity.color }}>
                                                    <i className={`fas ${toxicity.icon}`}></i>
                                                    {toxicity.text}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="environment-tip">
                                            Keep away from drafts and heating vents.
                                            {plant.humidity_requirements && plant.humidity_requirements.includes('High') && ' Mist leaves regularly to maintain humidity.'}
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
                                                <span>{plant.difficulty === 'Easy' ? 'Beginner friendly' : 'Requires attention'}</span>
                                            </div>
                                            <div className="feature">
                                                <i className="fas fa-star"></i>
                                                <span>{plant.type === 'succulent' ? 'Drought tolerant' : 'Regular watering needed'}</span>
                                            </div>
                                            <div className="feature">
                                                <i className="fas fa-star"></i>
                                                <span>{toxicity.safe ? 'Safe for pets' : 'Keep away from pets'}</span>
                                            </div>
                                            <div className="feature">
                                                <i className="fas fa-star"></i>
                                                <span>Great for {plant.type === 'indoor' ? 'indoor spaces' : 'outdoor gardens'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'care' && (
                        <div className="care-guide-content">
                            {/* Display full care instructions from database */}
                            {plant.care_instructions && (
                                <div className="care-quick-tips">
                                    <h3><i className="fas fa-star"></i> Quick Tips</h3>
                                    <div className="care-tips-grid">
                                        {plant.care_instructions.split('. ')
                                            .filter(s => s.trim())
                                            .map((tip, idx) => (
                                                <div key={idx} className="care-tip-chip">
                                                    <div className="tip-chip-icon">
                                                        <i className="fas fa-check"></i>
                                                    </div>
                                                    <span>{tip.trim().replace(/\.$/, '')}</span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}

                            <div className="care-timeline">
                                <div className="timeline-item">
                                    <div className="timeline-marker">
                                        <i className="fas fa-water"></i>
                                    </div>
                                    <div className="timeline-content">
                                        <h4>Watering Schedule</h4>
                                        <p>{getWateringFrequency(plant.watering_schedule)}</p>
                                        {plant.watering_schedule && (
                                            <div className="timeline-tip">
                                                <strong>Schedule:</strong> {plant.watering_schedule}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {plant.growth_rate && (
                                    <div className="timeline-item">
                                        <div className="timeline-marker">
                                            <i className="fas fa-chart-line"></i>
                                        </div>
                                        <div className="timeline-content">
                                            <h4>Growth Rate</h4>
                                            <p>{plant.growth_rate} growing plant</p>
                                            <div className="timeline-tip">
                                                <strong>Tip:</strong> {plant.growth_rate === 'Fast' ? 'May need repotting annually' : plant.growth_rate === 'Slow' ? 'Be patient with growth' : 'Regular pruning encourages bushiness'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="timeline-item">
                                    <div className="timeline-marker">
                                        <i className="fas fa-cut"></i>
                                    </div>
                                    <div className="timeline-content">
                                        <h4>Pruning & Maintenance</h4>
                                        <p>Remove dead or yellow leaves regularly to promote new growth.</p>
                                        {plant.type === 'flowering' && <p>Deadhead spent blooms to encourage more flowers.</p>}
                                        {plant.type === 'vegetable' && <p>Harvest regularly to promote continued production.</p>}
                                    </div>
                                </div>

                                <div className="timeline-item">
                                    <div className="timeline-marker">
                                        <i className="fas fa-bug"></i>
                                    </div>
                                    <div className="timeline-content">
                                        <h4>Pest Control</h4>
                                        <p>Check for pests weekly. Common issues include aphids, spider mites, and mealybugs.</p>
                                        <div className="timeline-tip">
                                            <strong>Treatment:</strong> Use neem oil or insecticidal soap for organic pest control.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tips' && plant.care_instructions && (
                        <div className="tips-content">
                            <h3><i className="fas fa-lightbulb"></i> Expert Tips & Tricks</h3>
                            <div className="care-tips-grid">
                                {plant.care_instructions.split('. ')
                                    .filter(s => s.trim())
                                    .map((tip, idx) => (
                                        <div key={idx} className="care-tip-chip tips-variant">
                                            <div className="tip-chip-icon tips-icon">
                                                <i className="fas fa-lightbulb"></i>
                                            </div>
                                            <span>{tip.trim().replace(/\.$/, '')}</span>
                                        </div>
                                    ))
                                }
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
                                            {relatedPlant.difficulty && (
                                                <span className="meta-item">
                                                    <i className="fas fa-seedling"></i>
                                                    {relatedPlant.difficulty}
                                                </span>
                                            )}
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