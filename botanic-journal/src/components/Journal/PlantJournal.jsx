import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const PlantJournal = ({ showNotification }) => {
    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newEntry, setNewEntry] = useState({ title: '', content: '', plant_id: '' });
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadJournals();
    }, []);

    const loadJournals = async () => {
        try {
            setLoading(true);
            const response = await apiService.getJournals();
            setJournals(response.data);
        } catch (error) {
            showNotification('Error', 'Failed to load journal entries', 'error');
        } finally {
            setLoading(false);
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

    const getMoodIcon = (content) => {
        const text = content.toLowerCase();
        if (text.includes('happy') || text.includes('thriving') || text.includes('bloom')) {
            return 'fa-smile-beam';
        } else if (text.includes('sad') || text.includes('wilting') || text.includes('problem')) {
            return 'fa-frown';
        } else if (text.includes('growth') || text.includes('new') || text.includes('sprout')) {
            return 'fa-seedling';
        }
        return 'fa-book';
    };

    const getMoodColor = (content) => {
        const text = content.toLowerCase();
        if (text.includes('happy') || text.includes('thriving') || text.includes('bloom')) {
            return '#10b981';
        } else if (text.includes('sad') || text.includes('wilting') || text.includes('problem')) {
            return '#ef4444';
        } else if (text.includes('growth') || text.includes('new') || text.includes('sprout')) {
            return '#3b82f6';
        }
        return '#7db36e';
    };

    // Filter journals based on search
    const filteredJournals = journals.filter(journal => {
        return journal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               journal.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (journal.plant_name && journal.plant_name.toLowerCase().includes(searchTerm.toLowerCase()));
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
            {/* Hero Header */}
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

            {/* Controls Section */}
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

            {/* Main Content Grid */}
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
                                        const moodIcon = getMoodIcon(journal.content);
                                        const moodColor = getMoodColor(journal.content);
                                        
                                        return (
                                            <div key={journal.id} className="journal-entry-card">
                                                <div className="entry-card-inner">
                                                    {/* Entry Header */}
                                                    <div className="entry-header">
                                                        <div className="entry-mood" style={{ color: moodColor }}>
                                                            <i className={`fas ${moodIcon}`}></i>
                                                        </div>
                                                        <div className="entry-title-section">
                                                            <h4 className="entry-title">{journal.title}</h4>
                                                            <span className="entry-date">
                                                                {new Date(journal.created_at).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Plant Association */}
                                                    {journal.plant_name && (
                                                        <div className="entry-plant-tag">
                                                            <i className="fas fa-seedling"></i>
                                                            Related to: {journal.plant_name}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Content Preview */}
                                                    <div className="entry-content-preview">
                                                        {journal.content.length > 150 ? 
                                                            `${journal.content.substring(0, 150)}...` : 
                                                            journal.content
                                                        }
                                                    </div>
                                                    
                                                    {/* Quick Stats */}
                                                    <div className="entry-stats">
                                                        <div className="entry-stat">
                                                            <div className="stat-value">
                                                                {journal.content.split(' ').length}
                                                            </div>
                                                            <div className="stat-label">Words</div>
                                                        </div>
                                                        <div className="entry-stat">
                                                            <div className="stat-value">
                                                                {Math.ceil(journal.content.length / 5)}
                                                            </div>
                                                            <div className="stat-label">Characters</div>
                                                        </div>
                                                        <div className="entry-stat">
                                                            <div className="stat-value">
                                                                {new Date(journal.created_at).toLocaleDateString('en-US', { month: 'short' })}
                                                            </div>
                                                            <div className="stat-label">Month</div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Action Buttons */}
                                                    <div className="entry-actions">
                                                        <button className="btn-outline">
                                                            <i className="fas fa-edit"></i>
                                                            Edit
                                                        </button>
                                                        <button className="btn-outline">
                                                            <i className="fas fa-trash"></i>
                                                            Delete
                                                        </button>
                                                        <button className="btn-primary">
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