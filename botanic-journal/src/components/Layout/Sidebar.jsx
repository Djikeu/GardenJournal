import React from 'react';

const Sidebar = ({ activeView, setActiveView, onLogout }) => {
  const navItems = {
    main: [
      { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard' },
      { id: 'plants', icon: 'fas fa-leaf', label: 'My Plants',},
      { id: 'tasks', icon: 'fas fa-tasks', label: 'Care Tasks', },
      { id: 'journal', icon: 'fas fa-book', label: 'Plant Journal' },
      { id: 'encyclopedia', icon: 'fas fa-book-open', label: 'Plant Encyclopedia' }
    ],
    analytics: [
      { id: 'analytics', icon: 'fas fa-chart-line', label: 'Analytics' },
      { id: 'planner', icon: 'fas fa-calendar-alt', label: 'Garden Planner' },
      { id: 'library', icon: 'fas fa-seedling', label: 'Seed Library' }
    ],
    community: [
      { id: 'community', icon: 'fas fa-users', label: 'Community' },
      { id: 'help', icon: 'fas fa-question-circle', label: 'Help Center' },
      { id: 'settings', icon: 'fas fa-cog', label: 'Settings' }
    ]
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="sidebar">
      <div className="logo-container">
        <div className="logo">
          <div className="logo-icon">
            <i className="fas fa-seedling"></i>
          </div>
          <div className="logo-text">
            <h1>Botanic Journal</h1>
            <p>Cultivate Your Green Space</p>
          </div>
        </div>
      </div>

      <nav className="nav-section">
        <div className="nav-title">Main Menu</div>
        <ul className="nav-links">
          {navItems.main.map(item => (
            <li key={item.id}>
              <a 
                href="#" 
                className={activeView === item.id ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveView(item.id);
                }}
              >
                <div className="nav-link-content">
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </div>
            
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <nav className="nav-section">
        <div className="nav-title">Analytics & Planning</div>
        <ul className="nav-links">
          {navItems.analytics.map(item => (
            <li key={item.id}>
              <a 
                href="#" 
                className={activeView === item.id ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveView(item.id);
                }}
              >
                <div className="nav-link-content">
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <nav className="nav-section">
        <div className="nav-title">Community</div>
        <ul className="nav-links">
          {navItems.community.map(item => (
            <li key={item.id}>
              <a 
                href="#" 
                className={activeView === item.id ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveView(item.id);
                }}
              >
                <div className="nav-link-content">
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Section */}
      <div className="sidebar-footer">
        <div className="nav-section">
          <ul className="nav-links">
            <li>
              <a 
                href="#" 
                className="logout-btn"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
              >
                <div className="nav-link-content">
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </div>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;