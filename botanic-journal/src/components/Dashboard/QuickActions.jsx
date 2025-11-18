import React from 'react';

const QuickActions = ({ showNotification }) => {
  const actions = [
    {
      icon: 'fas fa-plus-circle',
      title: 'Add New Plant',
      description: 'Record a new addition to your garden',
      action: () => showNotification('Add Plant', 'Plant addition form opened', 'info')
    },
    {
      icon: 'fas fa-camera',
      title: 'Take Garden Photo',
      description: 'Document your garden\'s progress',
      action: () => showNotification('Camera', 'Camera functionality activated', 'info')
    },
    {
      icon: 'fas fa-calendar-plus',
      title: 'Schedule Watering',
      description: 'Set up automated reminders',
      action: () => showNotification('Schedule', 'Watering scheduler opened', 'info')
    }
  ];

  return (
    <div className="card" style={{ gridColumn: 'span 4' }}>
      <div className="card-header">
        <h3 className="card-title">
          <i className="fas fa-bolt"></i>
          Quick Actions
        </h3>
      </div>
      <div className="task-list">
        {actions.map((action, index) => (
          <button 
            key={index}
            className="task-item" 
            style={{ textAlign: 'left', border: 'none', background: 'none', padding: '16px 0' }}
            onClick={action.action}
          >
            <div className="task-content">
              <div className="task-title">
                <i className={action.icon} style={{ color: 'var(--forest-600)', marginRight: '8px' }}></i>
                {action.title}
              </div>
              <div className="task-meta">{action.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;