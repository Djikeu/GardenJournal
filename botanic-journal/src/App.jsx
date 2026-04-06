import React, { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import MyPlants from './components/Plants/MyPlants';
import CareTasks from './components/Tasks/CareTasks';
import PlantJournal from './components/Journal/PlantJournal';
import PlantEncyclopedia from './components/Encyclopedia/PlantEncylopedia'
import PlantDetail from './components/Plants/PlantDetail'; // Add this import
import Analytics from './components/Analytics/Analytics';
import GardenPlanner from './components/Planner/GardenPlanner';
import WeatherForecast from './components/Weather/WeatherForecast'
import Notification from './components/UI/Notification';
import Profile from './components/Profile/profile';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import CommunityForum from './components/Community/CommunityForum';
import DiscussionDetail from './components/Community/DiscussionDetail';
import AdminDashboard from './components/Admin/AdminDashboard';
import { apiService } from './services/api';
import './index.css';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [authView, setAuthView] = useState('login');
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [selectedPlantId, setSelectedPlantId] = useState(null); // For plant details
  const [showPlantDetailModal, setShowPlantDetailModal] = useState(false); // For modal approach
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null); // ADD THIS LINE

  // Handle hash-based navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');

      // Handle plant detail routes like #plant/123
      if (hash.startsWith('plant/')) {
        const plantId = hash.split('/')[1];
        setSelectedPlantId(plantId);
        setActiveView('plant-detail');
        return;
      }
      

      if (hash && ['dashboard', 'plants', 'tasks', 'journal', 'encyclopedia', 'analytics', 'planner', 'profile', 'plant-detail','community', 'my-discussions', 'discussion-detail'].includes(hash)) {
        setActiveView(hash);
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Check initial hash
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Update URL hash when activeView changes
  useEffect(() => {
    if (isAuthenticated && activeView !== 'dashboard') {
      if (activeView === 'plant-detail' && selectedPlantId) {
        window.location.hash = `plant/${selectedPlantId}`;
      } else if (activeView !== 'plant-detail') {
        window.location.hash = activeView;
      }
    } else if (isAuthenticated && activeView === 'dashboard') {
      // Remove hash for dashboard (clean URL)
      window.history.replaceState(null, null, ' ');
    }
  }, [activeView, isAuthenticated, selectedPlantId]);

  // Generate unique IDs for notifications
  const generateUniqueId = () => {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const showNotification = (title, message, type = 'info') => {
    const id = generateUniqueId();
    const newNotification = { id, title, message, type };
    setNotifications(prev => [...prev, newNotification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  };

  // Function to show plant details (can be called from any component)
  const showPlantDetails = (plantId) => {
    console.log('🌱 Showing plant details for ID:', plantId);
    setSelectedPlantId(plantId);
    setActiveView('plant-detail');
  };

  // Function to hide plant details and go back
  const hidePlantDetails = () => {
    console.log('🔙 Going back from plant details');
    setActiveView('encyclopedia'); // Or go back to previous view
    setSelectedPlantId(null);
    window.history.back(); // Or navigate to encyclopedia
  };

  const handleLogin = async (loginData) => {
    try {
      const response = await apiService.login(loginData);

      if (response.success) {
        setIsAuthenticated(true);
        setCurrentUser(response.user);

        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('user_id', response.user.id);

        showNotification('Welcome back!', 'Successfully signed in', 'success');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      showNotification('Login Failed', error.message, 'error');
      throw error;
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveView('dashboard');
    setSelectedPlantId(null);

    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user_id');

    // Clear hash on logout
    window.history.replaceState(null, null, ' ');

    showNotification('Goodbye!', 'You have been logged out', 'info');
  };

  const handleRegister = async (registerData) => {
    try {
      const response = await apiService.register(registerData);

      if (response.success) {
        showNotification('Welcome!', 'Account created successfully', 'success');
        setAuthView('login');
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      showNotification('Registration Failed', error.message, 'error');
      throw error;
    }
  };

  const handleProfileClick = () => {
    console.log('Profile clicked - setting view to profile');
    setActiveView('profile');
  };

  // Enhanced setActiveView that also updates URL
  const handleSetActiveView = (view) => {
    console.log('Setting active view to:', view);
    setActiveView(view);
    if (view !== 'dashboard' && view !== 'plant-detail') {
      window.location.hash = view;
    } else if (view === 'dashboard') {
      window.history.replaceState(null, null, ' ');
    }
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return authView === 'login' ? (
        <Login
          onSwitchToRegister={() => setAuthView('register')}
          onLogin={handleLogin}
        />
      ) : (
        <Register
          onSwitchToLogin={() => setAuthView('login')}
          onRegister={handleRegister}
        />
      );
    }

    // Add after your showPlantDetails function
    const showDiscussionDetail = (discussionId) => {
      setSelectedDiscussionId(discussionId);
      setActiveView('discussion-detail');
    };

    const hideDiscussionDetail = () => {
      setActiveView('community');
      setSelectedDiscussionId(null);
      window.history.back();
    };

    switch (activeView) {
      case 'dashboard':
        return <Dashboard showNotification={showNotification} user={currentUser} />;
      case 'plants':
        return <MyPlants
          showNotification={showNotification}
          user={currentUser}
          setActiveView={setActiveView}
          onShowPlantDetails={showPlantDetails} // Pass the function
        />;
        case 'admin':
      // Only show admin dashboard if user is admin
      if (currentUser?.role === 'admin') {
        return <AdminDashboard showNotification={showNotification} user={currentUser} />;
      } else {
        showNotification('Access Denied', 'Admin access required', 'error');
        return <Dashboard showNotification={showNotification} user={currentUser} />;
      }
      case 'tasks':
        return <CareTasks showNotification={showNotification} user={currentUser} />;
      case 'journal':
        return <PlantJournal showNotification={showNotification} user={currentUser} />;
      case 'encyclopedia':
        return <PlantEncyclopedia
          showNotification={showNotification}
          user={currentUser}
          onShowPlantDetails={showPlantDetails} // Pass the function
        />;
      case 'plant-detail':
        return <PlantDetail
          showNotification={showNotification}
          user={currentUser}
          plantId={selectedPlantId}
          onClose={hidePlantDetails}
          onBack={hidePlantDetails}
        />;
      case 'analytics':
        return <Analytics showNotification={showNotification} user={currentUser} />;
      case 'planner':
        return <GardenPlanner showNotification={showNotification} user={currentUser} />;
      case 'forecast':
        return <WeatherForecast showNotification={showNotification} user={currentUser} />;
      case 'profile':
        return <Profile showNotification={showNotification} user={currentUser} />;
      case 'community':
    return <CommunityForum 
      showNotification={showNotification} 
      user={currentUser}
      onShowDiscussionDetail={showDiscussionDetail}
    />;
  case 'discussion-detail':
    return <DiscussionDetail 
      showNotification={showNotification} 
      user={currentUser}
      discussionId={selectedDiscussionId}
      onBack={hideDiscussionDetail}
    />;
  default:
        return <Dashboard showNotification={showNotification} user={currentUser} />;
    }
  };

  // For development - skip auth temporarily
  const skipAuth = () => {
    setIsAuthenticated(true);
    setCurrentUser({
      id: 1,
      name: "Demo User",
      email: "demo@example.com",
      level: 5,
      avatar: "https://i.pravatar.cc/150?img=12"
    });
    showNotification('Welcome!', 'Development mode activated', 'success');
  };

  if (!isAuthenticated) {
    return (
      <div className="app">
        <button
          onClick={skipAuth}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            padding: '10px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Skip Auth (Dev)
        </button>

        {renderContent()}

        <div className="notification-container">
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              title={notification.title}
              message={notification.message}
              type={notification.type}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Sidebar
        activeView={activeView}
        setActiveView={handleSetActiveView}
        onLogout={handleLogout}
        user={currentUser}
      />
      <div className="main-content">
        <Header onProfileClick={handleProfileClick} user={currentUser} />
        {renderContent()}
      </div>

      <div className="notification-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            title={notification.title}
            message={notification.message}
            type={notification.type}
          />
        ))}
      </div>
    </div>
  );
}

export default App;