import React from 'react';
import StatsGrid from './StatsGrid';
import WeatherWidget from './WeatherWidget';
import TaskList from './TaskList';
import PlantGrid from '../Plants/PlantGrid';
import AnalyticsChart from './AnalyticsChart';
import QuickActions from './QuickActions';

const Dashboard = ({ showNotification }) => {
  return (
    <>
      <StatsGrid showNotification={showNotification} />
      
      <div className="dashboard-grid">
        <WeatherWidget showNotification={showNotification} />
        <TaskList showNotification={showNotification} />
        <AnalyticsChart showNotification={showNotification} />
        <QuickActions showNotification={showNotification} />
        
        <div className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-seedling"></i>
              My Plant Collection
            </h3>
            <div className="card-actions">
              <button className="card-btn" title="Add Plant">
                <i className="fas fa-plus"></i>
              </button>
              <button className="card-btn" title="Filter">
                <i className="fas fa-filter"></i>
              </button>
            </div>
          </div>
          <PlantGrid showNotification={showNotification} />
        </div>
      </div>
    </>
  );
};

export default Dashboard;