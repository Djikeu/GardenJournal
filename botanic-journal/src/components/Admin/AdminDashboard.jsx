import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import '../../admin.css';

const AdminDashboard = ({ showNotification }) => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      // These would be your admin API endpoints
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
        <h1>Admin Dashboard</h1>
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
          className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <i className="fas fa-cog"></i>
          System Settings
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="stat-card admin-stat">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalUsers || 0}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>

            <div className="stat-card admin-stat">
              <div className="stat-icon">
                <i className="fas fa-seedling"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalPlants || 0}</div>
                <div className="stat-label">Total Plants</div>
              </div>
            </div>

            <div className="stat-card admin-stat">
              <div className="stat-icon">
                <i className="fas fa-tasks"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.activeTasks || 0}</div>
                <div className="stat-label">Active Tasks</div>
              </div>
            </div>

            <div className="stat-card admin-stat">
              <div className="stat-icon">
                <i className="fas fa-user-shield"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.adminUsers || 0}</div>
                <div className="stat-label">Admin Users</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-table-container">
            <div className="table-header">
              <h3>User Management</h3>
              <div className="table-actions">
                <button className="btn btn-primary">
                  <i className="fas fa-download"></i>
                  Export Users
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Level</th>
                    <th>Status</th>
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
                            src={user.avatar || '/default-avatar.png'} 
                            alt={user.name}
                            className="user-avatar-small"
                          />
                          <span>{user.name}</span>
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
                        <span className="level-badge">Level {user.level}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-sm btn-warning"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                          >
                            <i className={`fas ${user.is_active ? 'fa-ban' : 'fa-check'}`}></i>
                            {user.is_active ? 'Deactivate' : 'Activate'}
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

        {activeTab === 'system' && (
          <div className="system-settings">
            <h3>System Settings</h3>
            <div className="settings-grid">
              <div className="setting-card">
                <h4>Application Settings</h4>
                <div className="setting-item">
                  <label>Site Name</label>
                  <input type="text" defaultValue="Botanic Journal" />
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
                <h4>User Settings</h4>
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;