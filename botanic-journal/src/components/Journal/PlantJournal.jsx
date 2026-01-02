import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import '../../journal.css';

const PlantJournal = ({ showNotification, user }) => {
    const [journals, setJournals] = useState([]);
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newEntry, setNewEntry] = useState({ title: '', content: '', plant_id: '' });
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJournal, setSelectedJournal] = useState(null);
    const [isExpandedView, setIsExpandedView] = useState(false);
    const [editingJournal, setEditingJournal] = useState(null);

    useEffect(() => {
        loadJournals();
        loadPlants();
    }, []);

    const loadJournals = async () => {
        try {
            setLoading(true);
            const response = await apiService.getJournals();
            console.log('📚 Journals loaded:', response.data);
            setJournals(response.data || []);
        } catch (error) {
            console.error('Failed to load journals:', error);
            showNotification('Error', 'Failed to load journal entries', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadPlants = async () => {
        try {
            const response = await apiService.getPlants();
            console.log('🌿 Plants loaded for journal:', response.data);
            setPlants(response.data || []);
        } catch (error) {
            console.error('Failed to load plants:', error);
        }
    };

    const handleCreateJournal = async () => {
        if (!newEntry.title.trim()) {
            showNotification('Error', 'Please enter a title', 'error');
            return;
        }

        if (!newEntry.content.trim()) {
            showNotification('Error', 'Please write some content', 'error');
            return;
        }

        try {
            const journalData = {
                title: newEntry.title.trim(),
                content: newEntry.content.trim(),
                plant_id: newEntry.plant_id || null
            };

            console.log('➕ Creating journal entry:', journalData);
            
            const response = await apiService.createJournal(journalData);
            if (response.success) {
                console.log('✅ Journal created:', response.data);
                showNotification('Success', 'Journal entry created successfully', 'success');
                setNewEntry({ title: '', content: '', plant_id: '' });
                setJournals(prev => [response.data, ...prev]);
            } else {
                throw new Error(response.message || 'Failed to create journal entry');
            }
        } catch (error) {
            console.error('❌ Create journal error:', error);
            showNotification('Error', error.message || 'Failed to create journal entry', 'error');
        }
    };

    const handleReadMore = (journal) => {
        console.log('📖 Reading journal:', journal);
        setSelectedJournal(journal);
        setIsExpandedView(true);
    };

    const handleCloseExpandedView = () => {
        setIsExpandedView(false);
        setSelectedJournal(null);
        setEditingJournal(null);
    };

    const handleEditJournal = (journal) => {
        console.log('✏️ Editing journal:', journal);
        setEditingJournal({ ...journal });
        setSelectedJournal(journal);
        setIsExpandedView(true);
    };

    const handleUpdateJournal = async () => {
        if (!editingJournal.title.trim()) {
            showNotification('Error', 'Please enter a title', 'error');
            return;
        }

        if (!editingJournal.content.trim()) {
            showNotification('Error', 'Please write some content', 'error');
            return;
        }

        try {
            console.log('📝 Updating journal:', editingJournal);
            
            const response = await apiService.updateJournal(editingJournal.id, {
                title: editingJournal.title.trim(),
                content: editingJournal.content.trim(),
                plant_id: editingJournal.plant_id || null
            });
            
            if (response.success) {
                console.log('✅ Journal updated:', response.data);
                showNotification('Success', 'Journal entry updated successfully', 'success');
                setJournals(prev => prev.map(j => 
                    j.id === editingJournal.id ? { ...j, ...editingJournal } : j
                ));
                setEditingJournal(null);
                handleCloseExpandedView();
            } else {
                throw new Error(response.message || 'Failed to update journal entry');
            }
        } catch (error) {
            console.error('❌ Update journal error:', error);
            showNotification('Error', error.message || 'Failed to update journal entry', 'error');
        }
    };

    const handleDeleteJournal = async (journalId) => {
        if (!window.confirm('Are you sure you want to delete this journal entry?')) {
            return;
        }

        try {
            console.log('🗑️ Deleting journal:', journalId);
            
            const response = await apiService.deleteJournal(journalId);
            if (response.success) {
                console.log('✅ Journal deleted');
                showNotification('Success', 'Journal entry deleted successfully', 'success');
                setJournals(prev => prev.filter(j => j.id !== journalId));
                if (isExpandedView) {
                    handleCloseExpandedView();
                }
            } else {
                throw new Error(response.message || 'Failed to delete journal entry');
            }
        } catch (error) {
            console.error('❌ Delete journal error:', error);
            showNotification('Error', error.message || 'Failed to delete journal entry', 'error');
        }
    };

    const getPlantName = (plantId) => {
        if (!plantId) return null;
        const plant = plants.find(p => p.id == plantId);
        return plant ? plant.name : null;
    };

    const getPlantImage = (plantId) => {
        if (!plantId) return null;
        const plant = plants.find(p => p.id == plantId);
        return plant ? (plant.image_url || plant.image) : null;
    };

    // Working word count function
    const countWords = (text) => {
        if (!text || text.trim() === '') return 0;
        // Remove extra spaces and split by spaces
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const countCharacters = (text) => {
        return text ? text.length : 0;
    };

    const filteredJournals = journals.filter(journal => {
        const plantName = getPlantName(journal.plant_id);
        return journal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               journal.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (plantName && plantName.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    const stats = {
        totalEntries: journals.length,
        wordsCount: journals.reduce((sum, journal) => sum + countWords(journal.content), 0),
        plantsCount: new Set(journals.filter(j => j.plant_id).map(j => j.plant_id)).size,
        averageWords: journals.length > 0 
            ? Math.round(journals.reduce((sum, journal) => sum + countWords(journal.content), 0) / journals.length)
            : 0
    };

    if (loading) {
        return (
            <div className="plant-journal-container">
                <div className="loading-container">
                    <div className="loading-spinner">
                        <i className="fas fa-book"></i>
                    </div>
                    <h3>Loading Plant Journal</h3>
                    <p>Reading your plant stories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="plant-journal-container">
            {/* Hero Section */}
            <div className="journal-hero">
                <div className="hero-content">
                    <h1>
                        <i className="fas fa-book"></i>
                        Plant Journal
                    </h1>
                    <p className="hero-subtitle">
                        Document your plant care journey, track progress, and cherish every growth moment.
                    </p>
                </div>
                <div className="hero-stats">
                    <div className="stat-item">
                        <div className="stat-number">{stats.totalEntries}</div>
                        <div className="stat-label">Total Entries</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{stats.plantsCount}</div>
                        <div className="stat-label">Plants Tracked</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{stats.averageWords}</div>
                        <div className="stat-label">Avg Words</div>
                    </div>
                    <div 
                        className="stat-item clickable" 
                        onClick={() => document.querySelector('.journal-form-card')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        <div className="stat-number">+</div>
                        <div className="stat-label">New Entry</div>
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="journal-controls">
                <div className="controls-row">
                    <div className="search-container">
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search journal entries..."
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
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon">
                        <i className="fas fa-file-alt"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalEntries}</div>
                        <div className="stat-label">Journal Entries</div>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon">
                        <i className="fas fa-font"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.wordsCount.toLocaleString()}</div>
                        <div className="stat-label">Total Words</div>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon">
                        <i className="fas fa-seedling"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.plantsCount}</div>
                        <div className="stat-label">Plants Tracked</div>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon">
                        <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.averageWords}</div>
                        <div className="stat-label">Avg Words/Entry</div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="journal-content">
                {/* New Entry Form */}
                <div className="journal-form-card">
                    <div className="card-header">
                        <h3>
                            <i className="fas fa-plus"></i>
                            New Journal Entry
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label htmlFor="journal-title">Title *</label>
                            <input
                                type="text"
                                id="journal-title"
                                value={newEntry.title}
                                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                                placeholder="What's on your mind?"
                                className="form-input"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="journal-plant">Connect to Plant (Optional)</label>
                            <select
                                id="journal-plant"
                                value={newEntry.plant_id}
                                onChange={(e) => setNewEntry({ ...newEntry, plant_id: e.target.value })}
                                className="form-select"
                            >
                                <option value="">No plant selected</option>
                                {plants.map(plant => (
                                    <option key={plant.id} value={plant.id}>
                                        {plant.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="journal-content">Content *</label>
                            <textarea
                                id="journal-content"
                                value={newEntry.content}
                                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                                placeholder="Write about your plant care experiences, observations, or tips..."
                                rows="6"
                                className="form-textarea"
                            />
                            <div className="text-counter">
                                <span>Words: {countWords(newEntry.content)}</span>
                                <span>Characters: {countCharacters(newEntry.content)}</span>
                            </div>
                        </div>
                        
                        <div className="form-actions">
                            <button 
                                className="btn btn-primary"
                                onClick={handleCreateJournal}
                                disabled={!newEntry.title.trim() || !newEntry.content.trim()}
                            >
                                <i className="fas fa-save"></i>
                                Save Entry
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setNewEntry({ title: '', content: '', plant_id: '' })}
                            >
                                <i className="fas fa-times"></i>
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Journal Entries */}
                <div className="journal-entries-card">
                    <div className="card-header">
                        <h3>
                            <i className="fas fa-book-open"></i>
                            My Journal Entries ({filteredJournals.length})
                        </h3>
                        <div className="card-actions">
                            <button 
                                className="btn-icon"
                                onClick={loadJournals}
                                title="Refresh"
                            >
                                <i className="fas fa-sync-alt"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div className="card-body">
                        {filteredJournals.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <i className="fas fa-book"></i>
                                </div>
                                <h3>No journal entries found</h3>
                                <p>
                                    {searchTerm ? 
                                        "No entries match your search. Try different keywords." :
                                        "Start documenting your plant care journey by writing your first entry."
                                    }
                                </p>
                                {searchTerm && (
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => setSearchTerm('')}
                                    >
                                        <i className="fas fa-undo"></i>
                                        Clear Search
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className={`entries-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                                {filteredJournals.map(journal => {
                                    const plantName = getPlantName(journal.plant_id);
                                    const plantImage = getPlantImage(journal.plant_id);
                                    const wordCount = countWords(journal.content);
                                    const charCount = countCharacters(journal.content);
                                    const preview = journal.content?.substring(0, 120) + (journal.content?.length > 120 ? '...' : '');

                                    return (
                                        <div key={journal.id} className="journal-card">
                                            <div className="journal-card-inner">
                                                {/* Header */}
                                                <div className="journal-card-header">
                                                    <div className="journal-title-section">
                                                        <h4 className="journal-title">{journal.title || 'Plant Update'}</h4>
                                                        <div className="journal-meta">
                                                            <span className="journal-date">
                                                                <i className="fas fa-calendar"></i>
                                                                {new Date(journal.created_at || new Date()).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {plantName && (
                                                        <div className="journal-plant-tag">
                                                            {plantImage && (
                                                                <img 
                                                                    src={plantImage} 
                                                                    alt={plantName}
                                                                    className="plant-avatar"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                    }}
                                                                />
                                                            )}
                                                            <span className="plant-name">{plantName}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content Preview */}
                                                <div className="journal-content-preview">
                                                    <p className="journal-text">
                                                        {preview || 'No content available...'}
                                                    </p>
                                                </div>

                                                {/* Stats - Only word count now */}
                                                <div className="journal-stats">
                                                    <div className="stat-item">
                                                        <i className="fas fa-font"></i>
                                                        <span>{wordCount} words</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <i className="fas fa-keyboard"></i>
                                                        <span>{charCount} chars</span>
                                                    </div>
                                                </div>

                                                {/* Actions - Added bottom padding */}
                                                <div className="journal-actions">
                                                    <button 
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => handleEditJournal(journal)}
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => handleDeleteJournal(journal.id)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                        Delete
                                                    </button>
                                                    <button 
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => handleReadMore(journal)}
                                                    >
                                                        <i className="fas fa-expand"></i>
                                                        Read More
                                                    </button>
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

            {/* Expanded View Modal */}
            {isExpandedView && (
                <div className="modal-overlay" onClick={handleCloseExpandedView}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <i className="fas fa-book-open"></i>
                                {editingJournal ? 'Edit Journal Entry' : 'Journal Entry Details'}
                            </h3>
                            <button className="modal-close" onClick={handleCloseExpandedView}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body">
                            {editingJournal ? (
                                // Edit Form
                                <div className="edit-form">
                                    <div className="form-group">
                                        <label htmlFor="edit-title">Title *</label>
                                        <input
                                            type="text"
                                            id="edit-title"
                                            value={editingJournal.title}
                                            onChange={(e) => setEditingJournal({ ...editingJournal, title: e.target.value })}
                                            className="form-input"
                                            placeholder="Enter journal title"
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="edit-plant">Connect to Plant (Optional)</label>
                                        <select
                                            id="edit-plant"
                                            value={editingJournal.plant_id || ''}
                                            onChange={(e) => setEditingJournal({ ...editingJournal, plant_id: e.target.value })}
                                            className="form-select"
                                        >
                                            <option value="">No plant selected</option>
                                            {plants.map(plant => (
                                                <option key={plant.id} value={plant.id}>
                                                    {plant.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="edit-content">Content *</label>
                                        <textarea
                                            id="edit-content"
                                            value={editingJournal.content}
                                            onChange={(e) => setEditingJournal({ ...editingJournal, content: e.target.value })}
                                            rows="12"
                                            className="form-textarea"
                                            placeholder="Write your journal entry..."
                                        />
                                        <div className="text-counter">
                                            <span>Words: {countWords(editingJournal.content)}</span>
                                            <span>Characters: {countCharacters(editingJournal.content)}</span>
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button 
                                            className="btn btn-primary"
                                            onClick={handleUpdateJournal}
                                            disabled={!editingJournal.title.trim() || !editingJournal.content.trim()}
                                        >
                                            <i className="fas fa-save"></i>
                                            Save Changes
                                        </button>
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={() => setEditingJournal(null)}
                                        >
                                            <i className="fas fa-times"></i>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Read View
                                selectedJournal && (
                                    <div className="journal-detail">
                                        <div className="detail-header">
                                            <h1>{selectedJournal.title || 'Plant Update'}</h1>
                                            <div className="detail-meta">
                                                <span className="detail-date">
                                                    <i className="fas fa-calendar"></i>
                                                    {new Date(selectedJournal.created_at || new Date()).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {selectedJournal.plant_id && (
                                                    <span className="detail-plant">
                                                        <i className="fas fa-seedling"></i>
                                                        Related to: {getPlantName(selectedJournal.plant_id)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="detail-content">
                                            <div className="content-text">
                                                {selectedJournal.content || 'No content available...'}
                                            </div>
                                        </div>

                                        <div className="detail-stats">
                                            <div className="stat">
                                                <div className="stat-value">
                                                    {countWords(selectedJournal.content)}
                                                </div>
                                                <div className="stat-label">Words</div>
                                            </div>
                                            <div className="stat">
                                                <div className="stat-value">
                                                    {countCharacters(selectedJournal.content)}
                                                </div>
                                                <div className="stat-label">Characters</div>
                                            </div>
                                            <div className="stat">
                                                <div className="stat-value">
                                                    {new Date(selectedJournal.created_at || new Date()).toLocaleDateString()}
                                                </div>
                                                <div className="stat-label">Date</div>
                                            </div>
                                        </div>

                                        <div className="detail-actions">
                                            <button 
                                                className="btn btn-outline"
                                                onClick={() => handleEditJournal(selectedJournal)}
                                            >
                                                <i className="fas fa-edit"></i>
                                                Edit Entry
                                            </button>
                                            <button 
                                                className="btn btn-warning"
                                                onClick={() => handleDeleteJournal(selectedJournal.id)}
                                            >
                                                <i className="fas fa-trash"></i>
                                                Delete Entry
                                            </button>
                                            <button 
                                                className="btn btn-secondary"
                                                onClick={handleCloseExpandedView}
                                            >
                                                <i className="fas fa-times"></i>
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlantJournal;