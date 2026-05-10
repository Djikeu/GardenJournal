import React, { useState, useEffect } from 'react';

const Sidebar = ({ activeView, setActiveView, onLogout, user }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [activeView]);

  const navItems = {
    main: [
      { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard' },
      { id: 'plants', icon: 'fas fa-leaf', label: 'My Plants' },
      { id: 'tasks', icon: 'fas fa-tasks', label: 'Care Tasks' },
      { id: 'journal', icon: 'fas fa-book', label: 'Plant Journal' },
      { id: 'encyclopedia', icon: 'fas fa-book-open', label: 'Encyclopedia' },
      { id: 'plant-doctor', icon: 'fas fa-stethoscope', label: 'Plant Doctor' },
    ],
    analytics: [
      { id: 'analytics', icon: 'fas fa-chart-line', label: 'Analytics' },
      { id: 'planner', icon: 'fas fa-calendar-alt', label: 'Garden Planner' },
      { id: 'forecast', icon: 'fas fa-cloud-sun-rain', label: 'Weather Forecast' },
    ],
    community: [
      { id: 'community', icon: 'fas fa-users', label: 'Community Forum' },
    ],
  };

  const suggestionItems = [
    { id: 'suggest-plant', icon: 'fas fa-plus-circle', label: 'Suggest New Plant' },
    { id: 'my-requests', icon: 'fas fa-clipboard-list', label: 'My Requests' },
  ];

  const isAdmin = user?.role === 'admin';

  const bottomTabs = [
    { id: 'dashboard', icon: 'fas fa-home', label: 'Home' },
    { id: 'plants', icon: 'fas fa-leaf', label: 'Plants' },
    { id: 'tasks', icon: 'fas fa-tasks', label: 'Tasks' },
    { id: 'community', icon: 'fas fa-users', label: 'Community' },
  ];

  const NavLink = ({ item }) => (
    <li>
      <a
        href="#"
        className={`nav-links-item${activeView === item.id ? ' active' : ''}`}
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
  );

  const SidebarContent = () => (
    <>
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

      <div className="sidebar-scroll">
        <nav className="nav-section">
          <div className="nav-title">Main Menu</div>
          <ul className="nav-links">
            {navItems.main.map(item => <NavLink key={item.id} item={item} />)}
          </ul>
        </nav>

        <nav className="nav-section">
          <div className="nav-title">Analytics & Planning</div>
          <ul className="nav-links">
            {navItems.analytics.map(item => <NavLink key={item.id} item={item} />)}
          </ul>
        </nav>

        <nav className="nav-section">
          <div className="nav-title">Community</div>
          <ul className="nav-links">
            {navItems.community.map(item => <NavLink key={item.id} item={item} />)}
          </ul>
        </nav>

        {!isAdmin && (
          <nav className="nav-section">
            <div className="nav-title">Plant Suggestions</div>
            <ul className="nav-links">
              {suggestionItems.map(item => <NavLink key={item.id} item={item} />)}
            </ul>
          </nav>
        )}

        {isAdmin && (
          <nav className="nav-section">
            <div className="nav-title">Administration</div>
            <ul className="nav-links">
              <NavLink item={{ id: 'admin', icon: 'fas fa-shield-alt', label: 'Admin Panel' }} />
              <NavLink item={{ id: 'plant-requests', icon: 'fas fa-clipboard-list', label: 'Plant Requests' }} />
            </ul>
          </nav>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="nav-section">
          <ul className="nav-links">
            <li>
              <a
                href="#"
                className="nav-links-item logout-link"
                onClick={(e) => { e.preventDefault(); onLogout?.(); }}
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
    </>
  );

  return (
    <>
      {/* DESKTOP sidebar - sakriven na mobilnom via CSS */}
      <div className="sidebar">
        <SidebarContent />
      </div>

      {/* MOBILE wrapper - sakriven na desktopu via CSS */}
      <div className="mobile-nav-wrapper">
        <div
          className={`drawer-overlay${drawerOpen ? ' visible' : ''}`}
          onClick={() => setDrawerOpen(false)}
        />

        <div className={`mobile-drawer${drawerOpen ? ' open' : ''}`}>
          <div className="drawer-handle-bar" onClick={() => setDrawerOpen(false)}>
            <div className="drawer-handle"></div>
          </div>
          <SidebarContent />
        </div>

        <nav className="bottom-nav">
          {bottomTabs.map(tab => (
            <button
              key={tab.id}
              className={`bottom-tab${activeView === tab.id ? ' active' : ''}`}
              onClick={() => setActiveView(tab.id)}
            >
              <i className={tab.icon}></i>
              <span>{tab.label}</span>
            </button>
          ))}
          <button
            className={`bottom-tab${drawerOpen ? ' active' : ''}`}
            onClick={() => setDrawerOpen(prev => !prev)}
          >
            <i className="fas fa-bars"></i>
            <span>More</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
