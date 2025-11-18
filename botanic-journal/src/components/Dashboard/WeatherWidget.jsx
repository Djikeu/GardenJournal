import React, { useState, useEffect } from 'react';

const WeatherWidget = ({ showNotification }) => {
  const [weather, setWeather] = useState({
    location: 'Portland, OR',
    temperature: '68°F',
    description: 'Partly Cloudy • Humidity: 65%',
    recommendation: 'Perfect day for transplanting seedlings and light pruning'
  });

  const refreshWeather = () => {
    showNotification('Weather Updated', 'Latest weather data loaded', 'info');
  };

  return (
    <div className="card" style={{ gridColumn: 'span 6' }}>
      <div className="card-header">
        <h3 className="card-title">
          <i className="fas fa-cloud-sun"></i>
          Weather & Recommendations
        </h3>
        <div className="card-actions">
          <button className="card-btn" title="Refresh" onClick={refreshWeather}>
            <i className="fas fa-sync-alt"></i>
          </button>
          <button className="card-btn" title="Settings">
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </div>
      <div className="weather-widget">
        <div className="weather-info">
          <h3>{weather.location}</h3>
          <div className="weather-temp">{weather.temperature}</div>
          <div className="weather-desc">{weather.description}</div>
          <div className="weather-recommendation">
            <i className="fas fa-lightbulb"></i>
            {weather.recommendation}
          </div>
        </div>
        <div className="weather-icon">
          <i className="fas fa-cloud-sun"></i>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;