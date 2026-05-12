import React, { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import MyPlants from './components/Plants/MyPlants';
import CareTasks from './components/Tasks/CareTasks';
import PlantJournal from './components/Journal/PlantJournal';
import PlantEncyclopedia from './components/Encyclopedia/PlantEncylopedia'
import PlantDetail from './components/Plants/PlantDetail';
import Analytics from './components/Analytics/Analytics';
import GardenPlanner from './components/Planner/GardenPlanner';
import WeatherForecast from './components/Weather/WeatherForecast'
import Notification from './components/UI/Notification';
import Profile from './components/Profile/Profile';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import CommunityForum from './components/Community/CommunityForum';
import DiscussionDetail from './components/Community/DiscussionDetail';
import AdminDashboard from './components/Admin/AdminDashboard';
import PlantRequestForm from './components/PlantRequest/PlantRequestForm';
import MyPlantRequests from './components/PlantRequest/MyPlantRequests';
import PlantRequestManager from './components/Admin/PlantRequestManager';
import PlantDoctor from './components/PlantDoctor/PlantDoctor';
import PlantChat from './components/PlantChat/PlantChat';
import GardenMapDesigner from './components/GardenMap/GardenMapDesigner';
import Gardeners from './components/Social/Gardeners';
import PublicProfile from './components/Social/PublicProfile';
import Messages from './components/Social/Messages';
import CarbonOffset from './components/EcoImpact/CarbonOffset';
import PlantAnatomy from './components/EcoImpact/PlantAnatomy';
import { apiService } from './services/api';
import './index.css';
import './App.css';
import './dark-mode.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [authView, setAuthView] = useState('login');
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [selectedPlantId, setSelectedPlantId] = useState(null);
  const [showPlantDetailModal, setShowPlantDetailModal] = useState(false);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [chatWithUserId, setChatWithUserId] = useState(null);

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

      // Handle discussion detail routes
      if (hash.startsWith('discussion/')) {
        const discussionId = hash.split('/')[1];
        setSelectedDiscussionId(discussionId);
        setActiveView('discussion-detail');
        return;
      }

      const validViews = [
        'dashboard', 'plants', 'tasks', 'journal', 'encyclopedia',
        'analytics', 'planner', 'profile', 'plant-detail', 'community',
        'discussion-detail', 'suggest-plant', 'my-requests', 'plant-requests', 'admin',
        'plant-doctor', 'plant-chat', 'garden-map',
        'gardeners', 'messages', 'public-profile',
        'carbon', 'anatomy'
      ];

      if (hash && validViews.includes(hash)) {
        setActiveView(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
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
      } else if (activeView === 'discussion-detail' && selectedDiscussionId) {
        window.location.hash = `discussion/${selectedDiscussionId}`;
      } else if (activeView !== 'plant-detail' && activeView !== 'discussion-detail') {
        window.location.hash = activeView;
      }
    } else if (isAuthenticated && activeView === 'dashboard') {
      window.history.replaceState(null, null, ' ');
    }
  }, [activeView, isAuthenticated, selectedPlantId, selectedDiscussionId]);

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

  const showPlantDetails = (plantId) => {
    console.log('🌱 Showing plant details for ID:', plantId);
    setSelectedPlantId(plantId);
    setActiveView('plant-detail');
  };

  const hidePlantDetails = () => {
    console.log('🔙 Going back from plant details');
    setActiveView('encyclopedia');
    setSelectedPlantId(null);
    window.history.back();
  };

  const handleLogin = async (loginData) => {
    try {
      const response = await apiService.login(loginData);

      if (response.success) {
        setIsAuthenticated(true);
        setCurrentUser(response.user);

        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(response.user));
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
    setSelectedDiscussionId(null);

    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user'); 
    localStorage.removeItem('user_id');

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

  const handleSetActiveView = (view) => {
    console.log('Setting active view to:', view);
    setActiveView(view);
    if (view !== 'dashboard' && view !== 'plant-detail' && view !== 'discussion-detail') {
      window.location.hash = view;
    } else if (view === 'dashboard') {
      window.history.replaceState(null, null, ' ');
    }
  };

  const showDiscussionDetail = (discussionId) => {
    setSelectedDiscussionId(discussionId);
    setActiveView('discussion-detail');
  };

  const hideDiscussionDetail = () => {
    setActiveView('community');
    setSelectedDiscussionId(null);
    window.history.back();
  };

  const showPublicProfile = (userId) => {
    setSelectedProfileId(userId);
    setActiveView('public-profile');
  };

  const openChatWith = (userId) => {
    setChatWithUserId(userId);
    setActiveView('messages');
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

    switch (activeView) {
      case 'dashboard':
        return <Dashboard showNotification={showNotification} user={currentUser} onNavigate={handleSetActiveView} />;
      case 'plants':
        return <MyPlants
          showNotification={showNotification}
          user={currentUser}
          setActiveView={setActiveView}
          onShowPlantDetails={showPlantDetails}
        />;
      case 'admin':
        if (currentUser?.role === 'admin') {
          return <AdminDashboard showNotification={showNotification} user={currentUser} />;
        } else {
          showNotification('Access Denied', 'Admin access required', 'error');
          return <Dashboard showNotification={showNotification} user={currentUser} onNavigate={handleSetActiveView} />;
        }
      case 'tasks':
        return <CareTasks showNotification={showNotification} user={currentUser} />;
      case 'journal':
        return <PlantJournal showNotification={showNotification} user={currentUser} />;
      case 'plant-doctor':
        return <PlantDoctor showNotification={showNotification} user={currentUser} />;
      case 'plant-chat':
        return <PlantChat showNotification={showNotification} user={currentUser} />;
      case 'garden-map':
        return <GardenMapDesigner showNotification={showNotification} user={currentUser} />;
      case 'gardeners':
        return <Gardeners
          showNotification={showNotification}
          onShowProfile={showPublicProfile}
          onOpenChat={openChatWith}
        />;
      case 'public-profile':
        return <PublicProfile
          showNotification={showNotification}
          targetUserId={selectedProfileId}
          onBack={() => { setSelectedProfileId(null); setActiveView('gardeners'); }}
          onOpenChat={openChatWith}
        />;
      case 'messages':
        return <Messages
          showNotification={showNotification}
          user={currentUser}
          initialUserId={chatWithUserId}
        />;
      case 'carbon':
        return <CarbonOffset showNotification={showNotification} />;
      case 'anatomy':
        return <PlantAnatomy />;
      case 'encyclopedia':
        return <PlantEncyclopedia
          showNotification={showNotification}
          user={currentUser}
          onShowPlantDetails={showPlantDetails}
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
      case 'suggest-plant':
        return <PlantRequestForm
          showNotification={showNotification}
          user={currentUser}
          onSuccess={() => {
            setActiveView('my-requests');
            showNotification('Success', 'Plant suggestion submitted!', 'success');
          }}
        />;
      case 'my-requests':
        return <MyPlantRequests
          showNotification={showNotification}
          user={currentUser}
        />;
      case 'plant-requests':
        if (currentUser?.role === 'admin') {
          return <PlantRequestManager
            showNotification={showNotification}
            user={currentUser}
          />;
        } else {
          showNotification('Access Denied', 'Admin access required', 'error');
          return <Dashboard showNotification={showNotification} user={currentUser} onNavigate={handleSetActiveView} />;
        }
      default:
        return <Dashboard showNotification={showNotification} user={currentUser} onNavigate={handleSetActiveView} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app">
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