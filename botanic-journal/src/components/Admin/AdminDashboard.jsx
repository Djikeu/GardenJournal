import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import '../../admin.css';
import '../../PlantRequestForm.css';

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
  const [currentStep, setCurrentStep] = useState(1);
  
  // Comprehensive plant form data matching PlantRequestForm structure
  const [plantFormData, setPlantFormData] = useState({
    common_name: '',
    scientific_name: '',
    family: '',
    genus: '',
    description: '',
    care_instructions: {
      watering: '',
      sunlight: '',
      temperature: '',
      humidity: '',
      soil: '',
      fertilizer: ''
    },
    difficulty_level: 'beginner',
    growth_rate: 'medium',
    max_height: '',
    bloom_time: '',
    is_indoor: true,
    is_outdoor: false,
    poisonous: false,
    additional_info: ''
  });

  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner', color: '#2ecc71' },
    { value: 'intermediate', label: 'Intermediate', color: '#f39c12' },
    { value: 'advanced', label: 'Advanced', color: '#e74c3c' }
  ];

  const growthRates = [
    { value: 'slow', label: 'Slow' },
    { value: 'medium', label: 'Medium' },
    { value: 'fast', label: 'Fast' }
  ];

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setPlantFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setPlantFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 5;

    if (images.length + files.length > maxFiles) {
      showNotification('Error', `Maximum ${maxFiles} images allowed`, 'error');
      return;
    }

    for (const file of files) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        showNotification('Error', `${file.name} is not a valid image type`, 'error');
        return;
      }

      if (file.size > maxSize) {
        showNotification('Error', `${file.name} is too large (max 5MB)`, 'error');
        return;
      }
    }

    setImages(prev => [...prev, ...files]);
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Plant management functions
  const handleUpdatePlant = async () => {
    try {
      setFormLoading(true);
      
      const submitFormData = new FormData();
      submitFormData.append('common_name', plantFormData.common_name);
      submitFormData.append('scientific_name', plantFormData.scientific_name);
      submitFormData.append('family', plantFormData.family);
      submitFormData.append('genus', plantFormData.genus);
      submitFormData.append('description', plantFormData.description);
      submitFormData.append('care_instructions', JSON.stringify(plantFormData.care_instructions));
      submitFormData.append('difficulty_level', plantFormData.difficulty_level);
      submitFormData.append('growth_rate', plantFormData.growth_rate);
      submitFormData.append('max_height', plantFormData.max_height);
      submitFormData.append('bloom_time', plantFormData.bloom_time);
      submitFormData.append('is_indoor', plantFormData.is_indoor ? '1' : '0');
      submitFormData.append('is_outdoor', plantFormData.is_outdoor ? '1' : '0');
      submitFormData.append('poisonous', plantFormData.poisonous ? '1' : '0');
      submitFormData.append('additional_info', plantFormData.additional_info);
      
      // Add new images if any
      images.forEach((image, index) => {
        submitFormData.append(`images[]`, image);
      });
      
      const response = await apiService.updateAdminPlant(editingPlant.id, submitFormData);
      
      if (response.success) {
        showNotification('Success', 'Plant updated successfully', 'success');
        setShowPlantModal(false);
        resetForm();
        loadPlants(plantsPagination.page);
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update plant error:', error);
      showNotification('Error', error.message || 'Failed to update plant', 'error');
    } finally {
      setFormLoading(false);
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
    if (!plantFormData.common_name.trim()) {
      showNotification('Error', 'Plant common name is required', 'error');
      return;
    }

    if (!plantFormData.scientific_name.trim()) {
      showNotification('Error', 'Plant scientific name is required', 'error');
      return;
    }

    if (images.length === 0) {
      showNotification('Error', 'Please upload at least one image', 'error');
      return;
    }

    try {
      setFormLoading(true);
      
      const submitFormData = new FormData();
      submitFormData.append('common_name', plantFormData.common_name);
      submitFormData.append('scientific_name', plantFormData.scientific_name);
      submitFormData.append('family', plantFormData.family);
      submitFormData.append('genus', plantFormData.genus);
      submitFormData.append('description', plantFormData.description);
      submitFormData.append('care_instructions', JSON.stringify(plantFormData.care_instructions));
      submitFormData.append('difficulty_level', plantFormData.difficulty_level);
      submitFormData.append('growth_rate', plantFormData.growth_rate);
      submitFormData.append('max_height', plantFormData.max_height);
      submitFormData.append('bloom_time', plantFormData.bloom_time);
      submitFormData.append('is_indoor', plantFormData.is_indoor ? '1' : '0');
      submitFormData.append('is_outdoor', plantFormData.is_outdoor ? '1' : '0');
      submitFormData.append('poisonous', plantFormData.poisonous ? '1' : '0');
      submitFormData.append('additional_info', plantFormData.additional_info);
      submitFormData.append('status', 'approved');
      submitFormData.append('admin_created', 'true');

      images.forEach((image, index) => {
        submitFormData.append(`images[]`, image);
      });

      const response = await apiService.createAdminPlant(submitFormData);

      if (response.success) {
        showNotification('Success', 'Plant created successfully!', 'success');
        setShowPlantModal(false);
        resetForm();
        loadPlants(plantsPagination.page);
      } else {
        throw new Error(response.message || 'Creation failed');
      }
    } catch (error) {
      console.error('Create plant error:', error);
      showNotification('Error', error.message || 'Failed to create plant', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setPlantFormData({
      common_name: '',
      scientific_name: '',
      family: '',
      genus: '',
      description: '',
      care_instructions: {
        watering: '',
        sunlight: '',
        temperature: '',
        humidity: '',
        soil: '',
        fertilizer: ''
      },
      difficulty_level: 'beginner',
      growth_rate: 'medium',
      max_height: '',
      bloom_time: '',
      is_indoor: true,
      is_outdoor: false,
      poisonous: false,
      additional_info: ''
    });
    setImages([]);
    setPreviewUrls([]);
    setCurrentStep(1);
    setEditingPlant(null);
  };

  const openEditModal = (plant) => {
    setEditingPlant(plant);
    setPlantFormData({
      common_name: plant.common_name || plant.name || '',
      scientific_name: plant.scientific_name || plant.species || '',
      family: plant.family || '',
      genus: plant.genus || '',
      description: plant.description || '',
      care_instructions: plant.care_instructions ? 
        (typeof plant.care_instructions === 'string' ? JSON.parse(plant.care_instructions) : plant.care_instructions) : {
          watering: '',
          sunlight: '',
          temperature: '',
          humidity: '',
          soil: '',
          fertilizer: ''
        },
      difficulty_level: plant.difficulty_level || plant.difficulty?.toLowerCase() || 'beginner',
      growth_rate: plant.growth_rate || 'medium',
      max_height: plant.max_height || '',
      bloom_time: plant.bloom_time || '',
      is_indoor: plant.is_indoor !== undefined ? plant.is_indoor : true,
      is_outdoor: plant.is_outdoor || false,
      poisonous: plant.poisonous || false,
      additional_info: plant.additional_info || ''
    });
    setImages([]);
    setPreviewUrls([]);
    setCurrentStep(1);
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
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=fff`}
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
                        <span className="level-badge">Lv {user.level || 1}</span>
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
                    resetForm();
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
                        <th>Scientific Name</th>
                        <th>Difficulty</th>
                        <th>Growth Rate</th>
                        <th>Indoor/Outdoor</th>
                        <th>Status</th>
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
                                resetForm();
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
                                  alt={plant.common_name || plant.name}
                                  className="plant-thumbnail"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E";
                                  }}
                                />
                              ) : (
                                <div className="plant-thumbnail placeholder">
                                  <i className="fas fa-seedling"></i>
                                </div>
                              )}
                            </td>
                            <td>
                              <strong>{plant.common_name || plant.name}</strong>
                            </td>
                            <td>{plant.scientific_name || plant.species || '-'}</td>
                            <td>
                              <span className={`difficulty-badge ${(plant.difficulty_level || plant.difficulty || 'beginner').toLowerCase()}`}>
                                {plant.difficulty_level || plant.difficulty || 'Beginner'}
                              </span>
                            </td>
                            <td>{plant.growth_rate || 'Medium'}</td>
                            <td>
                              {(plant.is_indoor || plant.type === 'indoor') && <span className="type-badge indoor">Indoor</span>}
                              {(plant.is_outdoor || plant.type === 'outdoor') && <span className="type-badge outdoor">Outdoor</span>}
                              {!plant.is_indoor && !plant.is_outdoor && plant.type !== 'indoor' && plant.type !== 'outdoor' && <span>-</span>}
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
                                  onClick={() => handleDeletePlant(plant.id, plant.common_name || plant.name)}
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
      </div>

      {/* Plant Create/Edit Modal with Multi-step Form */}
      {showPlantModal && (
        <div className="modal-overlay" onClick={() => setShowPlantModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className={`fas ${editingPlant ? 'fa-edit' : 'fa-plus-circle'}`}></i>
                {editingPlant ? 'Edit Plant' : 'Add New Plant'}
              </h3>
              <button className="close-btn" onClick={() => setShowPlantModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {/* Progress Steps */}
              <div className="progress-steps">
                <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                  <div className="step-number">1</div>
                  <div className="step-label">Basic Info</div>
                </div>
                <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                  <div className="step-number">2</div>
                  <div className="step-label">Care Instructions</div>
                </div>
                <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                  <div className="step-number">3</div>
                  <div className="step-label">Images & Submit</div>
                </div>
              </div>

              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="form-section">
                  <div className="form-group">
                    <label>
                      <i className="fas fa-leaf"></i>
                      Common Name *
                    </label>
                    <input
                      type="text"
                      name="common_name"
                      value={plantFormData.common_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Monstera Deliciosa"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="fas fa-microscope"></i>
                      Scientific Name *
                    </label>
                    <input
                      type="text"
                      name="scientific_name"
                      value={plantFormData.scientific_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Monstera deliciosa"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Family</label>
                      <input
                        type="text"
                        name="family"
                        value={plantFormData.family}
                        onChange={handleInputChange}
                        placeholder="e.g., Araceae"
                      />
                    </div>

                    <div className="form-group">
                      <label>Genus</label>
                      <input
                        type="text"
                        name="genus"
                        value={plantFormData.genus}
                        onChange={handleInputChange}
                        placeholder="e.g., Monstera"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={plantFormData.description}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Describe the plant's appearance, characteristics, and any interesting facts..."
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Difficulty Level</label>
                      <select
                        name="difficulty_level"
                        value={plantFormData.difficulty_level}
                        onChange={handleInputChange}
                      >
                        {difficultyLevels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Growth Rate</label>
                      <select
                        name="growth_rate"
                        value={plantFormData.growth_rate}
                        onChange={handleInputChange}
                      >
                        {growthRates.map(rate => (
                          <option key={rate.value} value={rate.value}>
                            {rate.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Max Height</label>
                      <input
                        type="text"
                        name="max_height"
                        value={plantFormData.max_height}
                        onChange={handleInputChange}
                        placeholder="e.g., 3-6 feet"
                      />
                    </div>

                    <div className="form-group">
                      <label>Bloom Time</label>
                      <input
                        type="text"
                        name="bloom_time"
                        value={plantFormData.bloom_time}
                        onChange={handleInputChange}
                        placeholder="e.g., Spring, Summer"
                      />
                    </div>
                  </div>

                  <div className="form-row checkboxes">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_indoor"
                        checked={plantFormData.is_indoor}
                        onChange={(e) => setPlantFormData(prev => ({ ...prev, is_indoor: e.target.checked }))}
                      />
                      <span>Indoor Plant</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_outdoor"
                        checked={plantFormData.is_outdoor}
                        onChange={(e) => setPlantFormData(prev => ({ ...prev, is_outdoor: e.target.checked }))}
                      />
                      <span>Outdoor Plant</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="poisonous"
                        checked={plantFormData.poisonous}
                        onChange={(e) => setPlantFormData(prev => ({ ...prev, poisonous: e.target.checked }))}
                      />
                      <span>Toxic/Poisonous</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: Care Instructions */}
              {currentStep === 2 && (
                <div className="form-section">
                  <div className="form-group">
                    <label>
                      <i className="fas fa-tint"></i>
                      Watering Needs
                    </label>
                    <textarea
                      name="care_instructions.watering"
                      value={plantFormData.care_instructions.watering}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="How often should it be watered? Any special watering requirements?"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="fas fa-sun"></i>
                      Sunlight Requirements
                    </label>
                    <textarea
                      name="care_instructions.sunlight"
                      value={plantFormData.care_instructions.sunlight}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Direct sunlight, indirect, shade? How many hours?"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="fas fa-thermometer-half"></i>
                        Temperature Range
                      </label>
                      <input
                        type="text"
                        name="care_instructions.temperature"
                        value={plantFormData.care_instructions.temperature}
                        onChange={handleInputChange}
                        placeholder="e.g., 65-75°F (18-24°C)"
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="fas fa-tachometer-alt"></i>
                        Humidity
                      </label>
                      <input
                        type="text"
                        name="care_instructions.humidity"
                        value={plantFormData.care_instructions.humidity}
                        onChange={handleInputChange}
                        placeholder="e.g., High humidity (60-80%)"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="fas fa-mountain"></i>
                      Soil Type
                    </label>
                    <textarea
                      name="care_instructions.soil"
                      value={plantFormData.care_instructions.soil}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Preferred soil type, pH level, drainage requirements..."
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="fas fa-flask"></i>
                      Fertilizer Needs
                    </label>
                    <textarea
                      name="care_instructions.fertilizer"
                      value={plantFormData.care_instructions.fertilizer}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Type, frequency, and season of fertilization..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Additional Information</label>
                    <textarea
                      name="additional_info"
                      value={plantFormData.additional_info}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Any other important information about this plant..."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Images & Submit */}
              {currentStep === 3 && (
                <div className="form-section">
                  <div className="form-group">
                    <label>
                      <i className="fas fa-images"></i>
                      Plant Images *
                    </label>
                    <div className="image-upload-area">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="image-input"
                        id="admin-plant-images"
                      />
                      <label htmlFor="admin-plant-images" className="upload-label">
                        <i className="fas fa-cloud-upload-alt"></i>
                        <span>Click to upload images</span>
                        <small>Max 5 images, up to 5MB each</small>
                      </label>
                    </div>

                    {previewUrls.length > 0 && (
                      <div className="image-preview-grid">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="image-preview-item">
                            <img src={url} alt={`Preview ${index + 1}`} />
                            <button
                              type="button"
                              className="remove-image"
                              onClick={() => removeImage(index)}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="summary-box">
                    <h4>Plant Summary</h4>
                    <p><strong>Plant Name:</strong> {plantFormData.common_name || 'Not provided'}</p>
                    <p><strong>Scientific Name:</strong> {plantFormData.scientific_name || 'Not provided'}</p>
                    <p><strong>Difficulty:</strong> {difficultyLevels.find(l => l.value === plantFormData.difficulty_level)?.label || 'Beginner'}</p>
                    <p><strong>Growth Rate:</strong> {plantFormData.growth_rate || 'Medium'}</p>
                    <p><strong>Images:</strong> {images.length} image(s) selected</p>
                    <p className="info-text">
                      <i className="fas fa-info-circle"></i>
                      As admin, this plant will be immediately available in the encyclopedia.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  <i className="fas fa-arrow-left"></i>
                  Previous
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                >
                  Next
                  <i className="fas fa-arrow-right"></i>
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={editingPlant ? handleUpdatePlant : handleCreatePlant}
                  disabled={formLoading || !plantFormData.common_name || !plantFormData.scientific_name || images.length === 0}
                >
                  {formLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      {editingPlant ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      {editingPlant ? 'Update Plant' : 'Create Plant'}
                    </>
                  )}
                </button>
              )}
              
              <button className="btn-secondary" onClick={() => setShowPlantModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;