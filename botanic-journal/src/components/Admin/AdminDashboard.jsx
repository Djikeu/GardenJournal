import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import '../../admin.css';

const AdminDashboard = ({ showNotification, user }) => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Plants state
  const [plants, setPlants] = useState([]);
  const [plantsLoading, setPlantsLoading] = useState(false);
  const [plantsPagination, setPlantsPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPlant, setEditingPlant] = useState(null);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [plantFormData, setPlantFormData] = useState({
    name: '',
    species: '',
    type: 'indoor',
    description: '',
    light_requirements: '',
    watering_schedule: '',
    difficulty: 'Easy',
    status: 'healthy'
  });

  // Load plants function
  const loadPlants = async (page = 1) => {
    try {
      setPlantsLoading(true);
      const response = await apiService.getAdminPlants(page, 20, searchTerm);
      if (response.success) {
        setPlants(response.data);
        setPlantsPagination(response.pagination);
      }
    } catch (error) {
      showNotification('Error', 'Failed to load plants', 'error');
    } finally {
      setPlantsLoading(false);
    }
  };

  // Plant management functions
  const handleUpdatePlant = async () => {
    try {
      const response = await apiService.updateAdminPlant(editingPlant.id, plantFormData);
      if (response.success) {
        showNotification('Success', 'Plant updated successfully', 'success');
        setShowPlantModal(false);
        setEditingPlant(null);
        loadPlants(plantsPagination.page);
      }
    } catch (error) {
      showNotification('Error', 'Failed to update plant', 'error');
    }
  };

  const handleDeletePlant = async (plantId, plantName) => {
    if (window.confirm(`Are you sure you want to delete "${plantName}"? This action cannot be undone.`)) {
      try {
        const response = await apiService.deleteAdminPlant(plantId);
        if (response.success) {
          showNotification('Success', response.message, 'success');
          loadPlants(plantsPagination.page);
        }
      } catch (error) {
        showNotification('Error', 'Failed to delete plant', 'error');
      }
    }
  };

  const handleCreatePlant = async () => {
    try {
      const response = await apiService.createAdminPlant(plantFormData);
      if (response.success) {
        showNotification('Success', 'Plant created successfully', 'success');
        setShowPlantModal(false);
        setPlantFormData({
          name: '',
          species: '',
          type: 'indoor',
          description: '',
          light_requirements: '',
          watering_schedule: '',
          difficulty: 'Easy',
          status: 'healthy'
        });
        loadPlants(plantsPagination.page);
      }
    } catch (error) {
      showNotification('Error', 'Failed to create plant', 'error');
    }
  };

  const openEditModal = (plant) => {
    setEditingPlant(plant);
    setPlantFormData({
      name: plant.name,
      species: plant.species || '',
      type: plant.type,
      description: plant.description || '',
      light_requirements: plant.light_requirements || '',
      watering_schedule: plant.watering_schedule || '',
      difficulty: plant.difficulty || 'Easy',
      status: plant.status || 'healthy'
    });
    setShowPlantModal(true);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersResponse, statsResponse] = await Promise.all([
        apiService.getAdminUsers(),
        apiService.getAdminStats()
      ]);

      if (usersResponse.success) setUsers(usersResponse.data);
      if (statsResponse.success) setStats(statsResponse.data);
    } catch (error) {
      showNotification('Error', 'Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await apiService.toggleUserStatus(userId, !currentStatus);
      if (response.success) {
        setUsers(users.map(user =>
          user.id === userId ? { ...user, is_active: !currentStatus } : user
        ));
        showNotification('Success', 'User status updated', 'success');
      }
    } catch (error) {
      showNotification('Error', 'Failed to update user status', 'error');
    }
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      const response = await apiService.updateUserRole(userId, newRole);
      if (response.success) {
        setUsers(users.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        ));
        showNotification('Success', 'User role updated', 'success');
      }
    } catch (error) {
      showNotification('Error', 'Failed to update user role', 'error');
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>
          <i className="fas fa-shield-alt"></i>
          Admin Dashboard
        </h1>
        <p>Manage your botanical journal application</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-chart-bar"></i>
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <i className="fas fa-users"></i>
          User Management
        </button>
        <button
          className={`tab-btn ${activeTab === 'plants' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('plants');
            loadPlants();
          }}
        >
          <i className="fas fa-seedling"></i>
          Plant Management
        </button>
        <button
          className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <i className="fas fa-cog"></i>
          System Settings
        </button>
      </div>

      <div className="admin-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="stat-card">
              <div className="stat-icon users">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalUsers || 0}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon plants">
                <i className="fas fa-seedling"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalPlants || 0}</div>
                <div className="stat-label">Total Plants</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon tasks">
                <i className="fas fa-tasks"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.activeTasks || 0}</div>
                <div className="stat-label">Active Tasks</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon journals">
                <i className="fas fa-book"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalJournals || 0}</div>
                <div className="stat-label">Journal Entries</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon discussions">
                <i className="fas fa-comments"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalDiscussions || 0}</div>
                <div className="stat-label">Forum Discussions</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon admins">
                <i className="fas fa-user-shield"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.adminUsers || 0}</div>
                <div className="stat-label">Admin Users</div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-management">
            <div className="table-header">
              <h3>User Management</h3>
              <div className="table-actions">
                <button className="btn btn-secondary">
                  <i className="fas fa-download"></i>
                  Export Users
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th>Member Since</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <img
                            src={user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=10b981&color=fff'}
                            alt={user.name}
                            className="user-avatar"
                          />
                          <span className="user-name">{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(e) => changeUserRole(user.id, e.target.value)}
                          className="role-select"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className="level-badge">Lv {user.level}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon warning"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            title={user.is_active ? 'Deactivate User' : 'Activate User'}
                          >
                            <i className={`fas ${user.is_active ? 'fa-ban' : 'fa-check'}`}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Plants Tab */}
        {activeTab === 'plants' && (
          <div className="plants-management">
            <div className="table-header">
              <h3>Plant Management</h3>
              <div className="table-actions">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search plants by name or species..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && loadPlants(1)}
                  />
                  <button onClick={() => loadPlants(1)}>
                    <i className="fas fa-search"></i>
                  </button>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingPlant(null);
                    setPlantFormData({
                      name: '',
                      species: '',
                      type: 'indoor',
                      description: '',
                      light_requirements: '',
                      watering_schedule: '',
                      difficulty: 'Easy',
                      status: 'healthy'
                    });
                    setShowPlantModal(true);
                  }}
                >
                  <i className="fas fa-plus"></i>
                  Add New Plant
                </button>
              </div>
            </div>

            {plantsLoading ? (
              <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading plants...</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="data-table plants-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Species</th>
                        <th>Type</th>
                        <th>Owner</th>
                        <th>Status</th>
                        <th>Difficulty</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plants.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="no-data">
                            <i className="fas fa-seedling"></i>
                            <p>No plants found</p>
                            <button 
                              className="btn btn-primary"
                              onClick={() => {
                                setEditingPlant(null);
                                setPlantFormData({
                                  name: '',
                                  species: '',
                                  type: 'indoor',
                                  description: '',
                                  light_requirements: '',
                                  watering_schedule: '',
                                  difficulty: 'Easy',
                                  status: 'healthy'
                                });
                                setShowPlantModal(true);
                              }}
                            >
                              Add Your First Plant
                            </button>
                          </td>
                        </tr>
                      ) : (
                        plants.map(plant => (
                          <tr key={plant.id}>
                            <td>
                              {plant.image_url ? (
                                <img 
                                  src={plant.image_url} 
                                  alt={plant.name}
                                  className="plant-thumbnail"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/50x50?text=No+Image';
                                  }}
                                />
                              ) : (
                                <div className="plant-thumbnail placeholder">
                                  <i className="fas fa-seedling"></i>
                                </div>
                              )}
                            </td>
                            <td>
                              <strong>{plant.name}</strong>
                            </td>
                            <td>{plant.species || '-'}</td>
                            <td>
                              <span className={`type-badge ${plant.type}`}>
                                {plant.type}
                              </span>
                            </td>
                            <td>
                              <div className="owner-info">
                                <span>{plant.owner_name || `User #${plant.user_id}`}</span>
                                {plant.owner_email && (
                                  <small>{plant.owner_email}</small>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge ${plant.status}`}>
                                {plant.status}
                              </span>
                            </td>
                            <td>
                              <span className={`difficulty-badge ${plant.difficulty?.toLowerCase()}`}>
                                {plant.difficulty || 'Easy'}
                              </span>
                            </td>
                            <td>
                              {new Date(plant.created_at).toLocaleDateString()}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-icon edit"
                                  onClick={() => openEditModal(plant)}
                                  title="Edit Plant"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  className="btn-icon delete"
                                  onClick={() => handleDeletePlant(plant.id, plant.name)}
                                  title="Delete Plant"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {plantsPagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => loadPlants(plantsPagination.page - 1)}
                      disabled={plantsPagination.page === 1}
                    >
                      <i className="fas fa-chevron-left"></i> Previous
                    </button>
                    <span className="page-info">
                      Page {plantsPagination.page} of {plantsPagination.pages}
                    </span>
                    <button
                      onClick={() => loadPlants(plantsPagination.page + 1)}
                      disabled={plantsPagination.page === plantsPagination.pages}
                    >
                      Next <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* System Settings Tab */}
        {activeTab === 'system' && (
          <div className="system-settings">
            <div className="settings-header">
              <h3>System Settings</h3>
              <p>Configure application settings and preferences</p>
            </div>
            
            <div className="settings-grid">
              <div className="setting-card">
                <h4>
                  <i className="fas fa-globe"></i>
                  Application Settings
                </h4>
                <div className="setting-item">
                  <label>Site Name</label>
                  <input type="text" defaultValue="Botanic Journal" />
                </div>
                <div className="setting-item">
                  <label>Site Description</label>
                  <textarea rows="2" defaultValue="Cultivate Your Green Space" />
                </div>
                <div className="setting-item">
                  <label>Maintenance Mode</label>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-card">
                <h4>
                  <i className="fas fa-users"></i>
                  User Settings
                </h4>
                <div className="setting-item">
                  <label>Allow New Registrations</label>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <label>Default User Level</label>
                  <input type="number" defaultValue="1" min="1" max="10" />
                </div>
                <div className="setting-item">
                  <label>Require Email Verification</label>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-card">
                <h4>
                  <i className="fas fa-palette"></i>
                  Appearance
                </h4>
                <div className="setting-item">
                  <label>Theme</label>
                  <select defaultValue="light">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Primary Color</label>
                  <input type="color" defaultValue="#10b981" />
                </div>
              </div>

              <div className="setting-card">
                <h4>
                  <i className="fas fa-database"></i>
                  Data Management
                </h4>
                <div className="setting-item">
                  <button className="btn btn-secondary">
                    <i className="fas fa-download"></i>
                    Export All Data
                  </button>
                </div>
                <div className="setting-item">
                  <button className="btn btn-danger">
                    <i className="fas fa-trash"></i>
                    Clear Cache
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plant Edit/Create Modal */}
      {showPlantModal && (
        <div className="modal-overlay" onClick={() => setShowPlantModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className={`fas ${editingPlant ? 'fa-edit' : 'fa-plus-circle'}`}></i>
                {editingPlant ? 'Edit Plant' : 'Create New Plant'}
              </h3>
              <button className="close-btn" onClick={() => setShowPlantModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Plant Name *</label>
                <input
                  type="text"
                  value={plantFormData.name}
                  onChange={(e) => setPlantFormData({...plantFormData, name: e.target.value})}
                  placeholder="e.g., Monstera Deliciosa"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Species</label>
                <input
                  type="text"
                  value={plantFormData.species}
                  onChange={(e) => setPlantFormData({...plantFormData, species: e.target.value})}
                  placeholder="e.g., Monstera deliciosa"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={plantFormData.type}
                    onChange={(e) => setPlantFormData({...plantFormData, type: e.target.value})}
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="succulent">Succulent</option>
                    <option value="tropical">Tropical</option>
                    <option value="vegetable">Vegetable</option>
                    <option value="flowering">Flowering</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Difficulty</label>
                  <select
                    value={plantFormData.difficulty}
                    onChange={(e) => setPlantFormData({...plantFormData, difficulty: e.target.value})}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={plantFormData.status}
                    onChange={(e) => setPlantFormData({...plantFormData, status: e.target.value})}
                  >
                    <option value="healthy">Healthy</option>
                    <option value="warning">Warning</option>
                    <option value="danger">Danger</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={plantFormData.description}
                  onChange={(e) => setPlantFormData({...plantFormData, description: e.target.value})}
                  placeholder="Describe the plant, its characteristics, and care tips..."
                />
              </div>
              
              <div className="form-group">
                <label>Light Requirements</label>
                <input
                  type="text"
                  value={plantFormData.light_requirements}
                  onChange={(e) => setPlantFormData({...plantFormData, light_requirements: e.target.value})}
                  placeholder="e.g., Bright indirect light, Full sun, Low light"
                />
              </div>
              
              <div className="form-group">
                <label>Watering Schedule</label>
                <input
                  type="text"
                  value={plantFormData.watering_schedule}
                  onChange={(e) => setPlantFormData({...plantFormData, watering_schedule: e.target.value})}
                  placeholder="e.g., Every 2-3 weeks, Weekly, Twice weekly"
                />
              </div>
              
              <div className="form-group">
                <label>Image URL (optional)</label>
                <input
                  type="text"
                  value={plantFormData.image_url || ''}
                  onChange={(e) => setPlantFormData({...plantFormData, image_url: e.target.value})}
                  placeholder="https://example.com/plant-image.jpg"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPlantModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={editingPlant ? handleUpdatePlant : handleCreatePlant}
                disabled={!plantFormData.name}
              >
                {editingPlant ? 'Update Plant' : 'Create Plant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;