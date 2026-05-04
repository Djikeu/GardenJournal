// components/MyPlantRequests.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import '../../MyPlantRequests.css';

const IMAGE_BASE = 'http://localhost/botanic-journal/botanic-journal/backend';

const MyPlantRequests = ({ showNotification }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => { loadMyRequests(); }, [filter]);

  const loadMyRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyPlantRequests(filter);
      if (response.success) setRequests(response.data);
      else throw new Error(response.message || 'Failed to load requests');
    } catch (error) {
      showNotification('Error', error.message || 'Failed to load your requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Prefix relative image paths with the backend base URL
  const resolveImage = (src) => {
    if (!src) return null;
    if (src.startsWith('http')) return src;
    return `${IMAGE_BASE}${src.startsWith('/') ? '' : '/'}${src}`;
  };

  const getStatusBadge = (status) => ({
    pending:  { cls: 'status-pending',  icon: 'fa-clock',        text: 'Pending Review' },
    approved: { cls: 'status-approved', icon: 'fa-check-circle', text: 'Approved' },
    rejected: { cls: 'status-rejected', icon: 'fa-times-circle', text: 'Rejected' },
  }[status] || { cls: 'status-pending', icon: 'fa-clock', text: 'Pending Review' });

  const getDifficultyBadge = (level) => ({
    beginner:     { cls: 'difficulty-beginner',     text: 'Beginner' },
    intermediate: { cls: 'difficulty-intermediate', text: 'Intermediate' },
    advanced:     { cls: 'difficulty-advanced',     text: 'Advanced' },
  }[level] || { cls: 'difficulty-beginner', text: 'Beginner' });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const diffDays = Math.ceil(Math.abs(new Date() - date) / 86400000);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)  return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="my-requests-container">

      {/* Header */}
      <div className="requests-header">
        <div className="header-title">
          <h2><i className="fas fa-clipboard-list"></i> My Plant Suggestions</h2>
          <p>Track the status of your plant suggestions</p>
        </div>
        <div className="filter-buttons">
          {[
            { key: 'all',      icon: 'fa-list' },
            { key: 'pending',  icon: 'fa-clock' },
            { key: 'approved', icon: 'fa-check-circle' },
            { key: 'rejected', icon: 'fa-times-circle' },
          ].map(({ key, icon }) => (
            <button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              <i className={`fas ${icon}`}></i>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"><i className="fas fa-spinner fa-spin"></i></div>
          <p>Loading your suggestions...</p>
        </div>

      /* Empty */
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="fas fa-leaf"></i></div>
          <h3>No Suggestions Yet</h3>
          <p>You haven't submitted any plant suggestions yet.</p>
          <button className="btn-submit-request" onClick={() => window.location.href = '/suggest-plant'}>
            <i className="fas fa-plus-circle"></i> Suggest a Plant
          </button>
        </div>

      ) : (
        <>
          {/* Stats */}
          <div className="requests-stats">
            {[
              { label: 'Total',    value: requests.length,                                    cls: '' },
              { label: 'Pending',  value: requests.filter(r => r.status === 'pending').length,  cls: 'pending' },
              { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, cls: 'approved' },
              { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, cls: 'rejected' },
            ].map(({ label, value, cls }) => (
              <div className="stat-item" key={label}>
                <span className="stat-label">{label}</span>
                <span className={`stat-value ${cls}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Cards grid — 3 per row */}
          <div className="requests-grid">
            {requests.map(request => {
              const sb = getStatusBadge(request.status);
              const db = getDifficultyBadge(request.difficulty_level);
              const thumb = request.images?.[0] ? resolveImage(request.images[0]) : null;

              return (
                <div
                  key={request.id}
                  className="request-card"
                  onClick={() => setSelectedRequest(request)}
                >
                  {/* Image */}
                  <div className="request-image">
                    {thumb
                      ? <img src={thumb} alt={request.common_name} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                      : null
                    }
                    <div className="no-image" style={{ display: thumb ? 'none' : 'flex' }}>
                      <i className="fas fa-seedling"></i>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="request-body">
                    <div className="request-top">
                      <h3 className="request-name">{request.common_name}</h3>
                      <span className={`difficulty-badge ${db.cls}`}>{db.text}</span>
                    </div>

                    <p className="scientific-name">
                      <i className="fas fa-microscope"></i> {request.scientific_name}
                    </p>

                    {request.description && (
                      <p className="description-preview">{request.description}</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="request-footer">
                    <span className={`status-badge ${sb.cls}`}>
                      <i className={`fas ${sb.icon}`}></i> {sb.text}
                    </span>
                    <span className="request-date">
                      <i className="fas fa-calendar-alt"></i> {formatDate(request.created_at)}
                    </span>
                    <button className="view-details-btn" onClick={e => { e.stopPropagation(); setSelectedRequest(request); }}>
                      Details <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>

                  {request.admin_notes && request.status === 'rejected' && (
                    <div className="admin-feedback">
                      <i className="fas fa-comment-dots"></i> {request.admin_notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-seedling"></i> {selectedRequest.common_name}</h3>
              <button className="modal-close" onClick={() => setSelectedRequest(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Status Bar */}
              <div className="status-bar">
                <div className={`status-step ${selectedRequest.status === 'pending' ? 'active' : 'completed'}`}>
                  <div className="step-icon"><i className="fas fa-paper-plane"></i></div>
                  <span>Submitted</span>
                </div>
                <div className={`status-line ${selectedRequest.status !== 'pending' ? 'active' : ''}`}></div>
                <div className={`status-step ${selectedRequest.status === 'approved' ? 'active completed' : selectedRequest.status === 'rejected' ? 'rejected' : ''}`}>
                  <div className="step-icon">
                    <i className={`fas ${selectedRequest.status === 'approved' ? 'fa-check' : selectedRequest.status === 'rejected' ? 'fa-times' : 'fa-clock'}`}></i>
                  </div>
                  <span>{selectedRequest.status === 'approved' ? 'Approved' : selectedRequest.status === 'rejected' ? 'Rejected' : 'Under Review'}</span>
                </div>
              </div>

              {/* Basic Info */}
              <div className="detail-section">
                <h4>Basic Information</h4>
                <div className="detail-grid">
                  <div className="detail-item"><strong>Scientific Name</strong><span>{selectedRequest.scientific_name}</span></div>
                  {selectedRequest.family    && <div className="detail-item"><strong>Family</strong><span>{selectedRequest.family}</span></div>}
                  {selectedRequest.genus     && <div className="detail-item"><strong>Genus</strong><span>{selectedRequest.genus}</span></div>}
                  <div className="detail-item">
                    <strong>Difficulty</strong>
                    <span className={`difficulty-badge ${getDifficultyBadge(selectedRequest.difficulty_level).cls}`}>
                      {getDifficultyBadge(selectedRequest.difficulty_level).text}
                    </span>
                  </div>
                  {selectedRequest.growth_rate && <div className="detail-item"><strong>Growth Rate</strong><span>{selectedRequest.growth_rate}</span></div>}
                  {selectedRequest.max_height  && <div className="detail-item"><strong>Max Height</strong><span>{selectedRequest.max_height}</span></div>}
                </div>
              </div>

              {/* Care */}
              {selectedRequest.care_instructions && (
                <div className="detail-section">
                  <h4>Care Instructions</h4>
                  <div className="care-instructions">
                    {['watering','sunlight','temperature','humidity'].map(key =>
                      selectedRequest.care_instructions[key] && (
                        <div className="care-item" key={key}>
                          <i className={`fas fa-${key === 'watering' ? 'tint' : key === 'sunlight' ? 'sun' : key === 'temperature' ? 'thermometer-half' : 'tachometer-alt'}`}></i>
                          <div><strong>{key.charAt(0).toUpperCase()+key.slice(1)}</strong><p>{selectedRequest.care_instructions[key]}</p></div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedRequest.description && (
                <div className="detail-section">
                  <h4>Description</h4>
                  <p className="description-text">{selectedRequest.description}</p>
                </div>
              )}

              {/* Images */}
              {selectedRequest.images?.length > 0 && (
                <div className="detail-section">
                  <h4>Images</h4>
                  <div className="detail-images">
                    {selectedRequest.images.map((img, i) => (
                      <img key={i} src={resolveImage(img)} alt={`${selectedRequest.common_name} ${i+1}`} onClick={() => window.open(resolveImage(img), '_blank')} />
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Feedback */}
              {selectedRequest.admin_notes && (
                <div className={`detail-section admin-feedback-detail ${selectedRequest.status}`}>
                  <h4><i className="fas fa-comment-dots"></i> Admin Feedback</h4>
                  <p>{selectedRequest.admin_notes}</p>
                </div>
              )}

              {/* Meta */}
              <div className="detail-section metadata">
                <div className="meta-item"><i className="fas fa-calendar-plus"></i><span>Submitted: {new Date(selectedRequest.created_at).toLocaleString()}</span></div>
                {selectedRequest.updated_at !== selectedRequest.created_at && (
                  <div className="meta-item"><i className="fas fa-calendar-check"></i><span>Last Updated: {new Date(selectedRequest.updated_at).toLocaleString()}</span></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPlantRequests;
