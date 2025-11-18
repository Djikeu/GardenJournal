import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-title">
        <h2>My Botanical Dashboard</h2>
        <p className="header-subtitle">Track your garden's progress and care for your plants</p>
      </div>
      <div className="user-profile">
        <div className="user-avatar">
          <img src="https://i.pravatar.cc/150?img=12" alt="Alex Morgan" />
        </div>
        <div className="user-info">
          <h3>User 123</h3>
          <p>Master Gardener • Level 12</p>
        </div>
      </div>
    </header>
  );
};

export default Header;