import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const Profile = ({ showNotification, user }) => {
  const [profileUser, setProfileUser] = useState(user);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: ''
  });
  const [uploading, setUploading] = useState(false);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        avatar: user.avatar || ''
      });
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      const response = await apiService.getUserStats();
      if (response.success) {
        setUserStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      showNotification('Error', 'Please select a valid image file (JPEG, PNG, GIF)', 'error');
      return;
    }

    if (file.size > maxSize) {
      showNotification('Error', 'Image size must be less than 5MB', 'error');
      return;
    }

    try {
      setUploading(true);
      // For now, we'll create a local URL - in production, upload to server
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        avatar: imageUrl
      }));
      showNotification('Success', 'Avatar uploaded successfully', 'success');
    } catch (error) {
      showNotification('Error', 'Failed to upload avatar', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.updateProfile(formData);
      
      if (response.success) {
        setProfileUser(prev => ({
          ...prev,
          ...formData
        }));
        setEditing(false);
        showNotification('Success', 'Profile updated successfully', 'success');
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      showNotification('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: profileUser.name,
      email: profileUser.email,
      avatar: profileUser.avatar || ''
    });
    setEditing(false);
  };

  const getLevelBadge = (level) => {
    if (level >= 10) return { text: 'Expert Gardener', color: '#e74c3c' };
    if (level >= 5) return { text: 'Intermediate Gardener', color: '#3498db' };
    return { text: 'Beginner Gardener', color: '#2ecc71' };
  };

  if (!profileUser) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    );
  }

  const levelBadge = getLevelBadge(profileUser.level);

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-title">
          <i className="fas fa-user"></i>
          My Profile
        </h1>
        {!editing && (
          <button 
            className="btn btn-primary"
            onClick={() => setEditing(true)}
          >
            <i className="fas fa-edit"></i>
            Edit Profile
          </button>
        )}
      </div>

      <div className="profile-content">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="avatar-container">
              {editing ? (
                <>
                  <div className="avatar-upload">
                    <img 
                      src={formData.avatar || '/default-avatar.png'} 
                      alt="Avatar" 
                      className="avatar-image editable"
                    />
                    <div className="avatar-overlay">
                      <i className="fas fa-camera"></i>
                      <span>Change Photo</span>
                    </div>
                    <input 
                      type="file" 
                      className="avatar-input"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </div>
                  {uploading && (
                    <div className="upload-progress">
                      <i className="fas fa-spinner fa-spin"></i>
                      Uploading...
                    </div>
                  )}
                </>
              ) : (
                <img 
                  src={profileUser.avatar || '/default-avatar.png'} 
                  alt="Avatar" 
                  className="avatar-image"
                />
              )}
            </div>
            
            <div className="level-badge" style={{ backgroundColor: levelBadge.color }}>
              Level {profileUser.level} • {levelBadge.text}
            </div>

            {profileUser.role === 'admin' && (
              <div className="admin-badge">
                <i className="fas fa-shield-alt"></i>
                Administrator
              </div>
            )}
          </div>

          <div className="profile-details">
            {editing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    <i className="fas fa-user"></i>
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    <i className="fas fa-envelope"></i>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-mode">
                <div className="profile-field">
                  <label className="field-label">
                    <i className="fas fa-user"></i>
                    Full Name
                  </label>
                  <div className="field-value">{profileUser.name}</div>
                </div>

                <div className="profile-field">
                  <label className="field-label">
                    <i className="fas fa-envelope"></i>
                    Email Address
                  </label>
                  <div className="field-value">{profileUser.email}</div>
                </div>

                <div className="profile-field">
                  <label className="field-label">
                    <i className="fas fa-user-tag"></i>
                    Role
                  </label>
                  <div className="field-value">
                    <span className={`role-badge ${profileUser.role}`}>
                      {profileUser.role === 'admin' ? 'Administrator' : 'User'}
                    </span>
                  </div>
                </div>

                <div className="profile-field">
                  <label className="field-label">
                    <i className="fas fa-calendar"></i>
                    Member Since
                  </label>
                  <div className="field-value">
                    {new Date(profileUser.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                <div className="profile-field">
                  <label className="field-label">
                    <i className="fas fa-clock"></i>
                    Last Login
                  </label>
                  <div className="field-value">
                    {profileUser.last_login ? new Date(profileUser.last_login).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Never'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Card with Real Data */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-seedling"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{userStats?.totalPlants || 0}</div>
              <div className="stat-label">Total Plants</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-tasks"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{userStats?.pendingTasks || 0}</div>
              <div className="stat-label">Pending Tasks</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-trophy"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{profileUser.level}</div>
              <div className="stat-label">Gardener Level</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{userStats?.completionRate || '0%'}</div>
              <div className="stat-label">Task Completion</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-card">
          <h3 className="card-title">
            <i className="fas fa-history"></i>
            Recent Activity
          </h3>
          <div className="activity-list">
            {userStats?.recentActivity?.length > 0 ? (
              userStats.recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-icon ${activity.type}`}>
                    <i className={activity.icon}></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.title}</div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-activity">
                <i className="fas fa-inbox"></i>
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;