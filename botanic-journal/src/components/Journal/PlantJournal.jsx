import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const PlantJournal = ({ showNotification }) => {
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
            setJournals(response.data || []);
        } catch (error) {
            showNotification('Error', 'Failed to load journal entries', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadPlants = async () => {
        try {
            const response = await apiService.getPlants();
            setPlants(response.data || []);
        } catch (error) {
            console.error('Failed to load plants:', error);
        }
    };

    const handleCreateJournal = async () => {
        if (!newEntry.title || !newEntry.content) {
            showNotification('Error', 'Please fill in title and content', 'error');
            return;
        }

        try {
            await apiService.createJournal(newEntry);
            showNotification('Success', 'Journal entry created successfully', 'success');
            setNewEntry({ title: '', content: '', plant_id: '' });
            loadJournals();
        } catch (error) {
            showNotification('Error', 'Failed to create journal entry', 'error');
        }
    };

    const handleReadMore = (journal) => {
        setSelectedJournal(journal);
        setIsExpandedView(true);
    };

    const handleCloseExpandedView = () => {
        setIsExpandedView(false);
        setSelectedJournal(null);
        setEditingJournal(null);
    };

    const handleEditJournal = (journal) => {
        setEditingJournal({ ...journal });
        setIsExpandedView(true);
    };

    const handleUpdateJournal = async () => {
        if (!editingJournal.title || !editingJournal.content) {
            showNotification('Error', 'Please fill in title and content', 'error');
            return;
        }

        try {
            await apiService.updateJournal(editingJournal.id, editingJournal);
            showNotification('Success', 'Journal entry updated successfully', 'success');
            setEditingJournal(null);
            loadJournals();
            handleCloseExpandedView();
        } catch (error) {
            showNotification('Error', 'Failed to update journal entry', 'error');
        }
    };

    const handleDeleteJournal = async (journalId) => {
        if (window.confirm('Are you sure you want to delete this journal entry?')) {
            try {
                await apiService.deleteJournal(journalId);
                showNotification('Success', 'Journal entry deleted successfully', 'success');
                loadJournals();
                if (isExpandedView) {
                    handleCloseExpandedView();
                }
            } catch (error) {
                showNotification('Error', 'Failed to delete journal entry', 'error');
            }
        }
    };

    const getPlantName = (plantId) => {
        const plant = plants.find(p => p.id == plantId);
        return plant ? plant.name : null;
    };

    // Filter journals based on search
    const filteredJournals = journals.filter(journal => {
        const plantName = getPlantName(journal.plant_id);
        return journal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               journal.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (plantName && plantName.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    if (loading) {
        return (
            <div className="journal-loading">
                <div className="loading-spinner">
                    <i className="fas fa-book"></i>
                </div>
                <h3>Loading Plant Journal</h3>
                <p>Reading your plant stories...</p>
            </div>
        );
    }

    return (
        <div className="plant-journal">
            {/* Expanded View Modal - FIXED */}
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
                                <div className="journal-edit-form">
                                    <div className="form-group">
                                        <label>Title</label>
                                        <input
                                            type="text"
                                            value={editingJournal.title}
                                            onChange={(e) => setEditingJournal({ ...editingJournal, title: e.target.value })}
                                            className="form-input"
                                            placeholder="Enter journal title"
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Connect to Plant (Optional)</label>
                                        <select
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
                                        <label>Content</label>
                                        <textarea
                                            value={editingJournal.content}
                                            onChange={(e) => setEditingJournal({ ...editingJournal, content: e.target.value })}
                                            rows="12"
                                            className="form-textarea"
                                            placeholder="Write your journal entry..."
                                        />
                                    </div>

                                    <div className="form-actions">
                                        <button className="btn-primary" onClick={handleUpdateJournal}>
                                            <i className="fas fa-save"></i>
                                            Save Changes
                                        </button>
                                        <button 
                                            className="btn-outline" 
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
                                    <div className="journal-detail-view">
                                        <div className="journal-header">
                                            <div className="journal-title-section">
                                                <h1>{selectedJournal.title || 'Plant Update'}</h1>
                                                <div className="journal-meta">
                                                    <span className="journal-date">
                                                        <i className="fas fa-calendar"></i>
                                                        {new Date(selectedJournal.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                    {selectedJournal.plant_id && (
                                                        <span className="journal-plant">
                                                            <i className="fas fa-seedling"></i>
                                                            Related to: {getPlantName(selectedJournal.plant_id)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="journal-content-full">
                                            <div className="content-text">
                                                {selectedJournal.content}
                                            </div>
                                        </div>

                                        <div className="journal-stats-detailed">
                                            <div className="stat-item">
                                                <div className="stat-value">
                                                    {selectedJournal.content.split(' ').length}
                                                </div>
                                                <div className="stat-label">Words</div>
                                            </div>
                                            <div className="stat-item">
                                                <div className="stat-value">
                                                    {selectedJournal.content.length}
                                                </div>
                                                <div className="stat-label">Characters</div>
                                            </div>
                                            <div className="stat-item">
                                                <div className="stat-value">
                                                    {Math.ceil(selectedJournal.content.split(' ').length / 200)}
                                                </div>
                                                <div className="stat-label">Minutes to Read</div>
                                            </div>
                                        </div>

                                        <div className="journal-actions-detailed">
                                            <button 
                                                className="btn-outline"
                                                onClick={() => handleEditJournal(selectedJournal)}
                                            >
                                                <i className="fas fa-edit"></i>
                                                Edit Entry
                                            </button>
                                            <button 
                                                className="btn-danger"
                                                onClick={() => handleDeleteJournal(selectedJournal.id)}
                                            >
                                                <i className="fas fa-trash"></i>
                                                Delete Entry
                                            </button>
                                            <button 
                                                className="btn-secondary"
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

            {/* Rest of the component */}
            <div className="journal-hero">
                <div className="hero-content">
                    <h1>
                        <i className="fas fa-book"></i>
                        Plant Journal
                    </h1>
                    <p className="hero-subtitle">
                        Document your plant care journey, track progress, and cherish every growth moment. 
                        Your personal garden diary awaits.
                    </p>
                </div>
                <div className="hero-stats">
                    <div className="stat-item">
                        <div className="stat-number">{journals.length}</div>
                        <div className="stat-label">Total Entries</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{filteredJournals.length}</div>
                        <div className="stat-label">Filtered Results</div>
                    </div>
                </div>
            </div>

            <div className="journal-controls">
                <div className="controls-main">
                    <div className="search-container">
                        <div className="search-box-enhanced">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search journal entries by title, content, or plant name..."
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
            </div>

            <div className="journal-content-grid">
                {/* New Entry Form */}
                <div className="journal-form-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <i className="fas fa-plus"></i>
                            New Journal Entry
                        </h3>
                    </div>
                    <div className="journal-form">
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                value={newEntry.title}
                                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                                placeholder="What's on your mind?"
                                className="form-input"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Connect to Plant (Optional)</label>
                            <select
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
                            <label>Content</label>
                            <textarea
                                value={newEntry.content}
                                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                                placeholder="Write about your plant care experiences, observations, or tips..."
                                rows="6"
                                className="form-textarea"
                            />
                        </div>
                        <div className="form-actions">
                            <button className="btn-primary" onClick={handleCreateJournal}>
                                <i className="fas fa-save"></i>
                                Save Entry
                            </button>
                            <button 
                                className="btn-secondary" 
                                onClick={() => setNewEntry({ title: '', content: '', plant_id: '' })}
                            >
                                <i className="fas fa-times"></i>
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Journal Entries */}
                <div className="journal-entries-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                <i className="fas fa-book-open"></i>
                                My Journal Entries ({filteredJournals.length})
                            </h3>
                            <div className="card-actions">
                                <button className="card-btn" title="Refresh" onClick={loadJournals}>
                                    <i className="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div className="journal-entries">
                            {filteredJournals.length === 0 ? (
                                <div className="no-results">
                                    <div className="no-results-icon">
                                        <i className="fas fa-book"></i>
                                    </div>
                                    <h3>No journal entries found</h3>
                                    <p>
                                        {searchTerm ? 
                                            "No entries match your search. Try different keywords or clear the search." :
                                            "Start documenting your plant care journey by writing your first entry."
                                        }
                                    </p>
                                    {searchTerm && (
                                        <button 
                                            className="btn-primary" 
                                            onClick={() => setSearchTerm('')}
                                        >
                                            <i className="fas fa-undo"></i>
                                            Clear Search
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className={`entries-container ${viewMode}-view`}>
                                    {filteredJournals.map(journal => {
                                        const plantName = getPlantName(journal.plant_id);
                                        return (
                                            <div key={journal.id} className="journal-entry-card">
                                                <div className="entry-card-inner">
                                                    <div className="entry-header">
                                                        <div className="entry-title-section">
                                                            <h4 className="entry-title">{journal.title || 'Plant Update'}</h4>
                                                            <span className="entry-date">
                                                                <i className="fas fa-calendar"></i>
                                                                {new Date(journal.created_at).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    {plantName && (
                                                        <div className="entry-plant-tag">
                                                            <i className="fas fa-seedling"></i>
                                                            Related to: {plantName}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="entry-content-preview">
                                                        <div className="text-container">
                                                            <div className="text-content">
                                                                {journal.content}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="entry-stats">
                                                        <div className="entry-stat">
                                                            <div className="stat-value">
                                                                {journal.content.split(' ').length}
                                                            </div>
                                                            <div className="stat-label">Words</div>
                                                        </div>
                                                        <div className="entry-stat">
                                                            <div className="stat-value">
                                                                {journal.content.length}
                                                            </div>
                                                            <div className="stat-label">Chars</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="entry-actions">
                                                        <button 
                                                            className="btn-outline"
                                                            onClick={() => handleEditJournal(journal)}
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                            Edit
                                                        </button>
                                                        <button 
                                                            className="btn-outline"
                                                            onClick={() => handleDeleteJournal(journal.id)}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                            Delete
                                                        </button>
                                                        <button 
                                                            className="btn-primary"
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
            </div>
        </div>
    );
};

export default PlantJournal;