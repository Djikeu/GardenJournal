import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import '../../profile.css'

const Profile = ({ showNotification, user }) => {
  const [profileUser, setProfileUser] = useState(user);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    user_id: ''
  });
  const [uploading, setUploading] = useState(false);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileUser(user);
      setFormData({
        name: user.name || user.username || '',
        email: user.email || '',
        avatar: user.avatar || '',
        user_id: user.id || user.user_id || ''
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

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return '/default-avatar.png';
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost${avatarPath}`;
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

      const uploadFormData = new FormData();
      uploadFormData.append('avatar', file);
      uploadFormData.append('user_id', user?.id || user?.user_id || formData.user_id);

      const response = await apiService.uploadAvatar(uploadFormData);

      if (response.success) {
        const imageUrl = response.avatarUrl || response.data?.avatar_url;
        setFormData(prev => ({ ...prev, avatar: imageUrl }));
        setProfileUser(prev => ({ ...prev, avatar: imageUrl }));
        showNotification('Success', 'Avatar uploaded successfully', 'success');
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      showNotification('Error', error.message || 'Failed to upload avatar', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      const updateData = {
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar,
        user_id: formData.user_id
      };

      const response = await apiService.updateProfile(formData.user_id, updateData);

      if (response.success) {
        setProfileUser(prev => ({
          ...prev,
          name: formData.name,
          email: formData.email,
          avatar: formData.avatar
        }));

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          name: formData.name,
          email: formData.email,
          avatar: formData.avatar
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
      name: profileUser.name || profileUser.username || '',
      email: profileUser.email || '',
      avatar: profileUser.avatar || '',
      user_id: profileUser.id || profileUser.user_id || ''
    });
    setEditing(false);
  };

  if (!profileUser) {
    return (
      <div className="profile-container-modern">
        <div className="loading-modern">
          <div className="loading-spinner-modern">
            <i className="fas fa-leaf"></i>
          </div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const displayName = profileUser.name || profileUser.username || 'User';

  return (
    <div className="profile-container-modern">
      {/* Hero Section */}
      <div className="profile-hero">
        <div className="hero-content-modern">
          <h1>
            <i className="fas fa-user-circle"></i>
            My Profile
          </h1>
          <p>Manage your account settings and track your gardening journey</p>
        </div>
        {!editing && (
          <button
            className="btn-edit-profile"
            onClick={() => setEditing(true)}
          >
            <i className="fas fa-edit"></i>
            Edit Profile
          </button>
        )}
      </div>

      <div className="profile-content-modern">
        {/* Main Profile Card */}
        <div className="profile-card-modern">
          <div className="profile-avatar-modern">
            <div className="avatar-wrapper-modern">
              {editing ? (
                <>
                  <div className="avatar-upload-modern">
                    <img
                      src={getAvatarUrl(formData.avatar)}
                      alt="Avatar"
                      className="avatar-image-modern editable"
                    />
                    <div className="avatar-overlay-modern">
                      <i className="fas fa-camera"></i>
                      <span>Change Photo</span>
                    </div>
                    <input
                      type="file"
                      className="avatar-input-modern"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </div>
                  {uploading && (
                    <div className="upload-status-modern">
                      <i className="fas fa-spinner fa-spin"></i>
                      Uploading...
                    </div>
                  )}
                </>
              ) : (
                <img
                  src={getAvatarUrl(profileUser.avatar)}
                  alt="Avatar"
                  className="avatar-image-modern"
                />
              )}
            </div>

            <div className="profile-info-modern">
              <h2>{displayName}</h2>
              <div className="user-meta-modern">
                {profileUser.role === 'admin' && (
                  <span className="admin-badge-modern">
                    <i className="fas fa-shield-alt"></i>
                    Administrator
                  </span>
                )}
              </div>
              <div className="user-join-info">
                <i className="fas fa-calendar-alt"></i>
                Member since {profileUser.created_at ? new Date(profileUser.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                }) : 'Recently'}
              </div>
            </div>
          </div>

          <div className="profile-details-modern">
            {editing ? (
              <div className="edit-form-modern">
                <div className="form-group-modern">
                  <label>
                    <i className="fas fa-user"></i>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="form-input-modern"
                  />
                </div>

                <div className="form-group-modern">
                  <label>
                    <i className="fas fa-envelope"></i>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="form-input-modern"
                  />
                </div>

                <div className="form-actions-modern">
                  <button
                    className="btn-cancel-modern"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-save-modern"
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
              <div className="info-grid-modern">
                <div className="info-item-modern">
                  <div className="info-icon">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Email Address</span>
                    <span className="info-value">{profileUser.email}</span>
                  </div>
                </div>

                <div className="info-item-modern">
                  <div className="info-icon">
                    <i className="fas fa-user-tag"></i>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Role</span>
                    <span className="info-value">
                      <span className={`role-badge-modern ${profileUser.role}`}>
                        {profileUser.role === 'admin' ? 'Administrator' : 'User'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="info-item-modern">
                  <div className="info-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Last Login</span>
                    <span className="info-value">
                      {profileUser.last_login ? new Date(profileUser.last_login).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid-modern">
          <div className="stat-card-modern">
            <div className="stat-header-modern">
              <div className="stat-icon-modern plants">
                <i className="fas fa-seedling"></i>
              </div>
              <div className="stat-number-modern">{userStats?.totalPlants || 0}</div>
            </div>
            <div className="stat-footer-modern">
              <span className="stat-label-modern">Total Plants</span>
              <span className="stat-trend-modern">
                <i className="fas fa-leaf"></i> Growing
              </span>
            </div>
          </div>

          <div className="stat-card-modern">
            <div className="stat-header-modern">
              <div className="stat-icon-modern tasks">
                <i className="fas fa-tasks"></i>
              </div>
              <div className="stat-number-modern">{userStats?.pendingTasks || 0}</div>
            </div>
            <div className="stat-footer-modern">
              <span className="stat-label-modern">Pending Tasks</span>
              <span className="stat-trend-modern">
                <i className="fas fa-clock"></i> Need attention
              </span>
            </div>
          </div>

          <div className="stat-card-modern">
            <div className="stat-header-modern">
              <div className="stat-icon-modern completion">
                <i className="fas fa-calendar-check"></i>
              </div>
              <div className="stat-number-modern">{userStats?.completionRate || '0%'}</div>
            </div>
            <div className="stat-footer-modern">
              <span className="stat-label-modern">Task Completion</span>
              <span className="stat-trend-modern">
                <i className="fas fa-chart-line"></i> Overall rate
              </span>
            </div>
          </div>

          <div className="stat-card-modern">
            <div className="stat-header-modern">
              <div
                className="stat-icon-modern streak"
                style={{ background: (userStats?.currentStreak || 0) > 0 ? '#fff7ed' : '#f3f4f6', color: (userStats?.currentStreak || 0) > 0 ? '#f97316' : '#9ca3af' }}
              >
                <i className="fas fa-fire"></i>
              </div>
              <div className="stat-number-modern">{userStats?.currentStreak ?? 0}</div>
            </div>
            <div className="stat-footer-modern">
              <span className="stat-label-modern">Current Streak</span>
              <span className="stat-trend-modern">
                <i className="fas fa-trophy"></i>
                {userStats?.longestStreak > 0
                  ? `Best: ${userStats.longestStreak} day${userStats.longestStreak === 1 ? '' : 's'}`
                  : 'Start today!'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="activity-card-modern">
          <div className="activity-header-modern">
            <h3>
              <i className="fas fa-history"></i>
              Recent Activity
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {userStats?.recentActivity?.length > 0 && (
                <span className="activity-count">{userStats.recentActivity.length} activities</span>
              )}
              <button
                className="btn-icon"
                onClick={loadUserStats}
                title="Refresh activity"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>
          <div className="activity-list-modern">
            {userStats?.recentActivity?.length > 0 ? (
              userStats.recentActivity.map((activity, index) => (
                <div key={index} className="activity-item-modern">
                  <div className={`activity-icon-modern ${activity.type}`}>
                    <i className={activity.icon}></i>
                  </div>
                  <div className="activity-details-modern">
                    <div className="activity-title-modern">{activity.title}</div>
                    <div className="activity-time-modern">
                      <i className="fas fa-clock"></i>
                      {activity.time}
                    </div>
                  </div>
                  <div className="activity-status-modern">
                    <i className="fas fa-check-circle"></i>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-activity-modern">
                <div className="empty-icon">
                  <i className="fas fa-inbox"></i>
                </div>
                <h4>No Recent Activity</h4>
                <p>Start taking care of your plants to see activity here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;