import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const Header = ({ onProfileClick, user }) => {
  const [headerUser, setHeaderUser] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success) {
        setHeaderUser(response.data);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Profile clicked');
    if (onProfileClick) {
      onProfileClick();
    }
  };

  const getLevelTitle = (level) => {
    if (level >= 10) return 'Expert Gardener';
    if (level >= 5) return 'Intermediate Gardener';
    return 'Beginner Gardener';
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="header-role-badge admin">
          <i className="fas fa-shield-alt"></i>
          Admin
        </span>
      );
    }
    return null;
  };

  // Use prop user first, fallback to locally loaded user
  const displayUser = user || headerUser;

  return (
    <header className="header">
      <div className="header-title">
        <h2>My Botanical Dashboard</h2>
        <p className="header-subtitle">
          Welcome back, {displayUser?.name || 'Gardener'}! 
          {displayUser?.level && ` You're a ${getLevelTitle(displayUser.level)}`}
        </p>
      </div>
      <div 
        className="user-profile clickable"
        onClick={handleProfileClick}
        title="Click to view profile"
      >
        <div className="user-avatar">
          <img 
            src={displayUser?.avatar || "https://i.pravatar.cc/150?img=12"} 
            alt={displayUser?.name || "User"} 
          />
          {displayUser?.role === 'admin' && (
            <div className="avatar-admin-badge">
              <i className="fas fa-crown"></i>
            </div>
          )}
        </div>
        <div className="user-info">
          <div className="user-info-main">
            <h3>{displayUser?.name || "User"}</h3>
            {getRoleBadge(displayUser?.role)}
          </div>
          <p>
            {getLevelTitle(displayUser?.level || 1)} • Level {displayUser?.level || 1}
          </p>
        </div>
        <div className="profile-arrow">
          <i className="fas fa-chevron-right"></i>
        </div>
      </div>
    </header>
  );
};

export default Header;