import React from 'react';
import { statsData } from '../../data';

const StatsGrid = ({ showNotification }) => {
  const stats = [
    {
      icon: 'fas fa-leaf',
      value: statsData.totalPlants,
      label: 'Total Plants',
      trend: 'up',
      trendText: '3 new this month',
      className: 'plants'
    },
    {
      icon: 'fas fa-tint',
      value: statsData.needWatering,
      label: 'Need Watering',
      trend: 'down',
      trendText: '2 urgent',
      className: 'water'
    },
    {
      icon: 'fas fa-clipboard-list',
      value: statsData.pendingTasks,
      label: 'Pending Tasks',
      trend: 'up',
      trendText: '4 due today',
      className: 'tasks'
    }
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className={`stat-icon ${stat.className}`}>
            <i className={stat.icon}></i>
          </div>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
          <div className={`stat-trend ${stat.trend}`}>
            <i className={`fas fa-arrow-${stat.trend === 'up' ? 'up' : 'exclamation-circle'}`}></i>
            <span>{stat.trendText}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;