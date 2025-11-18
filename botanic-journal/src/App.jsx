import React, { useState } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import MyPlants from './components/Plants/MyPlants';
import CareTasks from './components/Tasks/CareTasks';
import PlantJournal from './components/Journal/PlantJournal';
import PlantEncyclopedia from './components/Encyclopedia/PlantEncylopedia';
import Analytics from './components/Analytics/Analytics';
import GardenPlanner from './components/Planner/GardenPlanner';
import SeedLibrary from './components/Library/SeedLibrary';
import Notification from './components/UI/Notification';
import './index.css';
import './App.css'

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);

  const showNotification = (title, message, type = 'info') => {
    const id = Date.now();
    const newNotification = { id, title, message, type };
    setNotifications(prev => [...prev, newNotification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard showNotification={showNotification} />;
      case 'plants':
        return <MyPlants showNotification={showNotification} />;
      case 'tasks':
        return <CareTasks showNotification={showNotification} />;
      case 'journal':
        return <PlantJournal showNotification={showNotification} />;
      case 'encyclopedia':
        return <PlantEncyclopedia showNotification={showNotification} />;
      case 'analytics':
        return <Analytics showNotification={showNotification} />;
      case 'planner':
        return <GardenPlanner showNotification={showNotification} />;
      case 'library':
        return <SeedLibrary showNotification={showNotification} />;
      default:
        return <Dashboard showNotification={showNotification} />;
    }
  };

  return (
    <div className="container">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="main-content">
        <Header />
        {renderContent()}
      </div>

      {/* Notification Container */}
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