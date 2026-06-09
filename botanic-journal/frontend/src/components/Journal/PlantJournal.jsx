import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { formatDateDMY } from '../../utils/dateFormat';
import '../../css/journal.css';

const PlantJournal = ({ showNotification, user }) => {
    const [journals, setJournals] = useState([]);
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newEntry, setNewEntry] = useState({ title: '', content: '', plant_id: '', image_path: '' });
    const [uploadingImage, setUploadingImage] = useState(false);
    const newImageInputRef = React.useRef(null);
    const editImageInputRef = React.useRef(null);
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

    const handleImageUpload = async (file, target) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            showNotification('Too large', 'Max 10 MB per image.', 'error');
            return;
        }
        try {
            setUploadingImage(true);
            const path = await apiService.uploadJournalImage(file);
            if (target === 'new') {
                setNewEntry(prev => ({ ...prev, image_path: path }));
            } else {
                setEditingJournal(prev => ({ ...prev, image_path: path }));
            }
        } catch (err) {
            showNotification('Upload failed', err.message || 'Try again', 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const journalImageUrl = (path) => path ? `http://localhost/botanic-journal/botanic-journal${path}` : null;

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
                plant_id: newEntry.plant_id || null,
                image_path: newEntry.image_path || null,
            };

            console.log('➕ Creating journal entry:', journalData);

            const response = await apiService.createJournal(journalData);
            if (response.success) {
                console.log('✅ Journal created:', response.data);
                showNotification('Success', 'Journal entry created successfully', 'success');
                setNewEntry({ title: '', content: '', plant_id: '', image_path: '' });
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
                plant_id: editingJournal.plant_id || null,
                image_path: editingJournal.image_path || null,
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

    const countWords = (text) => {
        if (!text || text.trim() === '') return 0;
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
                </div>
            </div>

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

            <div className="journal-content">
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

                        <div className="form-group">
                            <label>Photo (optional)</label>
                            <input
                                ref={newImageInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    e.target.value = '';
                                    handleImageUpload(f, 'new');
                                }}
                            />
                            {newEntry.image_path ? (
                                <div className="journal-photo-preview">
                                    <img src={journalImageUrl(newEntry.image_path)} alt="entry preview" />
                                    <button
                                        type="button"
                                        className="journal-photo-remove"
                                        onClick={() => setNewEntry(prev => ({ ...prev, image_path: '' }))}
                                        title="Remove photo"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="journal-photo-picker"
                                    onClick={() => newImageInputRef.current?.click()}
                                    disabled={uploadingImage}
                                >
                                    {uploadingImage ? (
                                        <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                                    ) : (
                                        <><i className="fas fa-camera"></i> Attach a photo</>
                                    )}
                                </button>
                            )}
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
                                onClick={() => setNewEntry({ title: '', content: '', plant_id: '', image_path: '' })}
                            >
                                <i className="fas fa-times"></i>
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

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
                                                <div className="journal-card-header">
                                                    <div className="journal-title-section">
                                                        <h4 className="journal-title">{journal.title || 'Plant Update'}</h4>
                                                        <div className="journal-meta">
                                                            <span className="journal-date">
                                                                <i className="fas fa-calendar"></i>
                                                                {formatDateDMY(journal.created_at || new Date())}
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

                                                {journal.image_path && (
                                                    <div className="journal-card-photo">
                                                        <img
                                                            src={journalImageUrl(journal.image_path)}
                                                            alt={journal.title || 'Journal photo'}
                                                            onClick={() => handleReadMore(journal)}
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                        />
                                                        <div className="img-fallback" style={{ display: 'none' }} onClick={() => handleReadMore(journal)}>
                                                            <i className="fas fa-seedling"></i>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="journal-content-preview">
                                                    <p className="journal-text">
                                                        {preview || 'No content available...'}
                                                    </p>
                                                </div>

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

                                                <div className="journal-actions">
                                                    <button
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => handleEditJournal(journal)}
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                        Edit
                                                    </button>
                                                    <button
                                                        className={`btn btn-sm ${journal.is_public == 1 ? 'btn-success' : 'btn-outline'}`}
                                                        onClick={async () => {
                                                            const next = journal.is_public == 1 ? 0 : 1;
                                                            try {
                                                                const res = await apiService.setJournalVisibility(journal.id, next);
                                                                if (res.success) {
                                                                    setJournals(prev => prev.map(j =>
                                                                        j.id === journal.id ? { ...j, is_public: next } : j
                                                                    ));
                                                                    showNotification('Updated', next ? 'Entry is now public' : 'Entry is now private', 'success');
                                                                }
                                                            } catch (e) {
                                                                showNotification('Error', e.message || 'Could not change visibility', 'error');
                                                            }
                                                        }}
                                                        title={journal.is_public == 1 ? 'Public — anyone can see this on your profile' : 'Private — only you can see this'}
                                                    >
                                                        <i className={`fas ${journal.is_public == 1 ? 'fa-globe' : 'fa-lock'}`}></i>
                                                        {journal.is_public == 1 ? 'Public' : 'Private'}
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

                                    <div className="form-group">
                                        <label>Photo</label>
                                        <input
                                            ref={editImageInputRef}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                e.target.value = '';
                                                handleImageUpload(f, 'edit');
                                            }}
                                        />
                                        {editingJournal.image_path ? (
                                            <div className="journal-photo-preview">
                                                <img src={journalImageUrl(editingJournal.image_path)} alt="entry" />
                                                <button
                                                    type="button"
                                                    className="journal-photo-remove"
                                                    onClick={() => setEditingJournal(prev => ({ ...prev, image_path: '' }))}
                                                    title="Remove photo"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                className="journal-photo-picker"
                                                onClick={() => editImageInputRef.current?.click()}
                                                disabled={uploadingImage}
                                            >
                                                {uploadingImage ? (
                                                    <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                                                ) : (
                                                    <><i className="fas fa-camera"></i> Attach a photo</>
                                                )}
                                            </button>
                                        )}
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

                                        {selectedJournal.image_path && (
                                            <div className="journal-detail-photo">
                                                <img
                                                    src={journalImageUrl(selectedJournal.image_path)}
                                                    alt={selectedJournal.title || 'Journal photo'}
                                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                />
                                                <div className="img-fallback" style={{ display: 'none' }}>
                                                    <i className="fas fa-seedling"></i>
                                                </div>
                                            </div>
                                        )}

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
                                                    {formatDateDMY(selectedJournal.created_at || new Date())}
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