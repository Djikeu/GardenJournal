import React, { useState } from 'react';
import { apiService } from '../../services/api';
import '../../community.css';
const NewDiscussionModal = ({ user, categories, onClose, onSuccess, showNotification }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'General');
  const [submitting, setSubmitting] = useState(false);

  // If categories is empty, use default categories
  const displayCategories = categories.length > 0 ? categories : [
    { name: 'General', description: 'General plant discussions' },
    { name: 'Plant Care', description: 'Questions about plant care' },
    { name: 'Troubleshooting', description: 'Help with plant problems' },
    { name: 'Plant Identification', description: 'Help identifying plants' },
    { name: 'Propagation', description: 'Plant propagation discussions' },
    { name: 'Garden Design', description: 'Landscaping and design' },
    { name: 'Seasonal Tips', description: 'Seasonal gardening advice' },
    { name: 'Tools & Equipment', description: 'Gardening tools reviews' },
    { name: 'Success Stories', description: 'Share your successes' },
    { name: 'Beginner Questions', description: 'Questions for new gardeners' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
        showNotification('Error', 'Title and content are required', 'error');
        return;
    }

    setSubmitting(true);
    
    try {
        // UNCOMMENT THIS - use the actual API
        const response = await apiService.createDiscussion({
            title: title.trim(),
            content: content.trim(),
            category: category
        });
        
        console.log('API Response:', response); // Check what the API returns
        
        if (response.success) {
            onSuccess(); // This will close the modal and refresh discussions
            showNotification('Success', 'Discussion created successfully!', 'success');
        } else {
            showNotification('Error', response.message || 'Failed to create discussion', 'error');
        }
        
    } catch (error) {
        console.error('Error creating discussion:', error);
        showNotification('Error', 'Failed to create discussion: ' + (error.message || 'Unknown error'), 'error');
    } finally {
        setSubmitting(false);
    }
};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Start New Discussion</h2>
          <button onClick={onClose} className="close-btn">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="discussion-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to discuss?"
              maxLength={200}
              required
            />
            <small className="char-count">{title.length}/200 characters</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {displayCategories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions, or experiences..."
              rows={8}
              required
            />
            <div className="format-tips">
              <small>
                <i className="fas fa-info-circle"></i> Be respectful and follow community guidelines
              </small>
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Creating...
                </>
              ) : 'Create Discussion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewDiscussionModal;