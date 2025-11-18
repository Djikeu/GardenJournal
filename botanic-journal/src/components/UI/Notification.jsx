import React, { useEffect, useState } from 'react';

const Notification = ({ title, message, type = 'info' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const icons = {
    success: 'fas fa-check-circle',
    info: 'fas fa-info-circle',
    warning: 'fas fa-exclamation-circle',
    error: 'fas fa-times-circle'
  };

  const colors = {
    success: '#7db36e',
    info: '#a6d8ff',
    warning: '#ffd8a6',
    error: '#ff6b6b'
  };

  return (
    <div className={`notification ${isVisible ? 'show' : ''}`}>
      <div className="notification-header">
        <div className="notification-icon" style={{ background: colors[type] }}>
          <i className={icons[type]}></i>
        </div>
        <div>
          <div className="notification-title">{title}</div>
          <div className="notification-message">{message}</div>
        </div>
      </div>
    </div>
  );
};

export default Notification;