import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import '../../PlantRequestManager.css';

const IMAGE_BASE = 'http://localhost/botanic-journal/botanic-journal/backend';

const PlantRequestManager = ({ showNotification }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPlantRequests(filter);
      if (response.success) {
        setRequests(response.data);
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
      showNotification('Error', 'Failed to load plant requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fix image URL resolution
  const resolveImage = (src) => {
    if (!src) return null;
    if (src.startsWith('http')) return src;
    let cleanSrc = src.replace('/backend/backend/', '/backend/');
    return `${IMAGE_BASE}${cleanSrc.startsWith('/') ? '' : '/'}${cleanSrc}`;
  };

  const handleApprove = async (requestId, notes = '') => {
    try {
      setProcessingId(requestId);
      const response = await apiService.approvePlantRequest(requestId, {
        status: 'approved',
        admin_notes: notes
      });
      
      if (response.success) {
        showNotification('Success', 'Plant request approved and added to encyclopedia', 'success');
        loadRequests();
        setSelectedRequest(null);
      } else {
        throw new Error(response.message || 'Approval failed');
      }
    } catch (error) {
      showNotification('Error', error.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId, reason) => {
    if (!reason.trim()) {
      showNotification('Error', 'Please provide a reason for rejection', 'error');
      return;
    }

    try {
      setProcessingId(requestId);
      const response = await apiService.rejectPlantRequest(requestId, {
        status: 'rejected',
        admin_notes: reason
      });
      
      if (response.success) {
        showNotification('Success', 'Plant request rejected', 'success');
        loadRequests();
        setSelectedRequest(null);
        setShowRejectModal(false);
        setRejectReason('');
        setRejectId(null);
      } else {
        throw new Error(response.message || 'Rejection failed');
      }
    } catch (error) {
      showNotification('Error', error.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (requestId) => {
    setRejectId(requestId);
    setShowRejectModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'status-pending', icon: 'fa-clock', text: 'Pending Review' },
      approved: { class: 'status-approved', icon: 'fa-check-circle', text: 'Approved' },
      rejected: { class: 'status-rejected', icon: 'fa-times-circle', text: 'Rejected' }
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="plant-request-manager">
      <div className="manager-header">
        <h2>
          <i className="fas fa-clipboard-list"></i>
          Plant Encyclopedia Requests
        </h2>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            <i className="fas fa-clock"></i>
            Pending
            <span className="count">
              {requests.filter(r => r.status === 'pending').length}
            </span>
          </button>
          <button
            className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            <i className="fas fa-check-circle"></i>
            Approved
          </button>
          <button
            className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            <i className="fas fa-times-circle"></i>
            Rejected
          </button>
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <i className="fas fa-list"></i>
            All
          </button>
        </div>
      </div>

      <div className="requests-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
            <p>Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>No Requests Found</h3>
            <p>There are no plant requests to review at this time.</p>
          </div>
        ) : (
          <div className="requests-grid">
            {requests.map(request => {
              const statusBadge = getStatusBadge(request.status);
              const thumb = request.images?.[0] ? resolveImage(request.images[0]) : null;
              
              return (
                <div key={request.id} className="request-card">
                  <div className="request-header-info">
                    <div className="request-images">
                      {thumb ? (
                        <img 
                          src={thumb} 
                          alt={request.common_name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="no-image" style={{ display: thumb ? 'none' : 'flex' }}>
                        <i className="fas fa-seedling"></i>
                      </div>
                    </div>
                    {/* Only status badge - no difficulty badge */}
                    <div className="request-badges">
                      <span className={`status-badge ${statusBadge.class}`}>
                        <i className={`fas ${statusBadge.icon}`}></i>
                        {statusBadge.text}
                      </span>
                    </div>
                  </div>

                  <div className="request-content">
                    <h3>{request.common_name}</h3>
                    <p className="scientific-name">
                      <i className="fas fa-microscope"></i>
                      {request.scientific_name}
                    </p>
                    
                    <div className="request-meta">
                      <span>
                        <i className="fas fa-user"></i>
                        Submitted by: {request.submitter_name || 'Unknown'}
                      </span>
                      <span>
                        <i className="fas fa-calendar"></i>
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {request.description && (
                      <p className="description">{request.description}</p>
                    )}

                    {request.status === 'pending' && (
                      <div className="request-actions">
                        <button
                          className="btn-view"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <i className="fas fa-eye"></i>
                          Review Details
                        </button>
                        <button
                          className="btn-approve"
                          onClick={() => handleApprove(request.id)}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-check"></i>
                          )}
                          Approve & Add
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => openRejectModal(request.id)}
                          disabled={processingId === request.id}
                        >
                          <i className="fas fa-times"></i>
                          Reject
                        </button>
                      </div>
                    )}

                    {request.admin_notes && request.status === 'rejected' && (
                      <div className="admin-notes">
                        <strong><i className="fas fa-comment-dots"></i> Admin Notes:</strong>
                        <p>{request.admin_notes}</p>
                      </div>
                    )}
                    
                    {request.status === 'approved' && request.approved_at && (
                      <div className="admin-notes approved">
                        <strong><i className="fas fa-check-circle"></i> Approved:</strong>
                        <p>This plant has been added to the encyclopedia on {new Date(request.approved_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fas fa-seedling"></i>
                {selectedRequest.common_name}
              </h3>
              <button className="modal-close" onClick={() => setSelectedRequest(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {/* Status Bar */}
              <div className="status-bar">
                <div className={`status-step ${selectedRequest.status !== 'pending' ? 'completed' : 'active'}`}>
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

              <div className="detail-section">
                <h4><i className="fas fa-info-circle"></i> Basic Information</h4>
                <div className="detail-grid">
                  <div><strong>Common Name:</strong> <span>{selectedRequest.common_name}</span></div>
                  <div><strong>Scientific Name:</strong> <span>{selectedRequest.scientific_name}</span></div>
                  {selectedRequest.family && <div><strong>Family:</strong> <span>{selectedRequest.family}</span></div>}
                  {selectedRequest.genus && <div><strong>Genus:</strong> <span>{selectedRequest.genus}</span></div>}
                  <div><strong>Difficulty:</strong> <span className="capitalize">{selectedRequest.difficulty_level}</span></div>
                  {selectedRequest.growth_rate && <div><strong>Growth Rate:</strong> <span>{selectedRequest.growth_rate}</span></div>}
                  {selectedRequest.max_height && <div><strong>Max Height:</strong> <span>{selectedRequest.max_height}</span></div>}
                  {selectedRequest.bloom_time && <div><strong>Bloom Time:</strong> <span>{selectedRequest.bloom_time}</span></div>}
                </div>
              </div>

              {selectedRequest.care_instructions && (
                <div className="detail-section">
                  <h4><i className="fas fa-heartbeat"></i> Care Instructions</h4>
                  <div className="detail-grid">
                    {selectedRequest.care_instructions.watering && (
                      <div><strong>Watering:</strong> <span>{selectedRequest.care_instructions.watering}</span></div>
                    )}
                    {selectedRequest.care_instructions.sunlight && (
                      <div><strong>Sunlight:</strong> <span>{selectedRequest.care_instructions.sunlight}</span></div>
                    )}
                    {selectedRequest.care_instructions.temperature && (
                      <div><strong>Temperature:</strong> <span>{selectedRequest.care_instructions.temperature}</span></div>
                    )}
                    {selectedRequest.care_instructions.humidity && (
                      <div><strong>Humidity:</strong> <span>{selectedRequest.care_instructions.humidity}</span></div>
                    )}
                    {selectedRequest.care_instructions.soil && (
                      <div><strong>Soil:</strong> <span>{selectedRequest.care_instructions.soil}</span></div>
                    )}
                    {selectedRequest.care_instructions.fertilizer && (
                      <div><strong>Fertilizer:</strong> <span>{selectedRequest.care_instructions.fertilizer}</span></div>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.description && (
                <div className="detail-section">
                  <h4><i className="fas fa-align-left"></i> Description</h4>
                  <p className="description-text">{selectedRequest.description}</p>
                </div>
              )}

              {selectedRequest.images && selectedRequest.images.length > 0 && (
                <div className="detail-section">
                  <h4><i className="fas fa-images"></i> Images</h4>
                  <div className="detail-images">
                    {selectedRequest.images.map((image, index) => (
                      <img 
                        key={index} 
                        src={resolveImage(image)} 
                        alt={`${selectedRequest.common_name} ${index + 1}`}
                        onClick={() => window.open(resolveImage(image), '_blank')}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.additional_info && (
                <div className="detail-section">
                  <h4><i className="fas fa-sticky-note"></i> Additional Information</h4>
                  <p>{selectedRequest.additional_info}</p>
                </div>
              )}

              {selectedRequest.admin_notes && (
                <div className={`detail-section admin-feedback-detail ${selectedRequest.status}`}>
                  <h4><i className="fas fa-comment-dots"></i> Admin Feedback</h4>
                  <p>{selectedRequest.admin_notes}</p>
                </div>
              )}

              <div className="detail-section metadata">
                <div className="meta-item">
                  <i className="fas fa-calendar-plus"></i>
                  <span>Submitted: {new Date(selectedRequest.created_at).toLocaleString()}</span>
                </div>
                {selectedRequest.updated_at !== selectedRequest.created_at && (
                  <div className="meta-item">
                    <i className="fas fa-calendar-check"></i>
                    <span>Last Updated: {new Date(selectedRequest.updated_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="modal-footer">
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(selectedRequest.id)}
                  disabled={processingId === selectedRequest.id}
                >
                  {processingId === selectedRequest.id ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-check"></i>
                  )}
                  Approve & Add to Encyclopedia
                </button>
                <button
                  className="btn-reject"
                  onClick={() => openRejectModal(selectedRequest.id)}
                  disabled={processingId === selectedRequest.id}
                >
                  <i className="fas fa-times"></i>
                  Reject Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content reject-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fas fa-comment-dots"></i>
                Provide Rejection Reason
              </h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p className="reject-instruction">
                Please provide a reason for rejecting this plant request. This feedback will be shared with the submitter.
              </p>
              <textarea
                className="reject-reason-input"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason here..."
                rows="4"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => {
                setShowRejectModal(false);
                setRejectReason('');
                setRejectId(null);
              }}>
                Cancel
              </button>
              <button 
                className="btn-reject" 
                onClick={() => handleReject(rejectId, rejectReason)}
                disabled={!rejectReason.trim() || processingId === rejectId}
              >
                {processingId === rejectId ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-times"></i>
                )}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantRequestManager;