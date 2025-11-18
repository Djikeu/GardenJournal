import React, { useState, useEffect } from 'react';
import StatsGrid from './StatsGrid';
import WeatherWidget from './WeatherWidget';
import AnalyticsChart from './AnalyticsChart';
import QuickActions from './QuickActions';
import PlantGrid from '../Plants/PlantGrid';
import { apiService } from '../../services/api';

const Dashboard = ({ showNotification }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await apiService.getTasks();
      // Get only urgent tasks (high priority, not completed)
      const urgentTasks = response.data.filter(task => 
        task.priority === 'high' && !task.completed
      ).slice(0, 3); // Show only 3 most urgent
      setTasks(urgentTasks);
    } catch (error) {
      showNotification('Error', 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId) => {
    try {
      await apiService.completeTask(taskId);
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: true, progress: 100 } : task
      ));
      showNotification('Task Completed!', 'Great job! Your plant will thank you.', 'success');
    } catch (error) {
      showNotification('Error', 'Failed to complete task', 'error');
    }
  };

  const getTaskTypeIcon = (type) => {
    switch (type) {
      case 'watering': return 'fas fa-tint';
      case 'fertilizing': return 'fas fa-flask';
      case 'pruning': return 'fas fa-cut';
      case 'repotting': return 'fas fa-seedling';
      case 'pest_control': return 'fas fa-bug';
      default: return 'fas fa-tasks';
    }
  };

  return (
    <>
      <StatsGrid showNotification={showNotification} />
      
      <div className="dashboard-grid">
        <WeatherWidget showNotification={showNotification} />
        
        {/* Tasks Card for Dashboard */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-exclamation-circle"></i>
              Urgent Care Needed
            </h3>
            <div className="card-actions">
              <button className="card-btn" title="View All">
                <i className="fas fa-eye"></i>
              </button>
            </div>
          </div>
          <div className="task-list">
            {loading ? (
              <div className="loading-message">Loading urgent tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-check-circle"></i>
                <h4>No urgent tasks</h4>
                <p>All caught up with urgent care!</p>
              </div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="task-item">
                  <input 
                    type="checkbox" 
                    className="task-checkbox" 
                    checked={task.completed}
                    onChange={() => completeTask(task.id)}
                  />
                  <div className="task-content">
                    <div className="task-title">
                      <span className="task-priority priority-high"></span>
                      <i className={getTaskTypeIcon(task.type)}></i>
                      {task.title}
                      {task.plant_name && (
                        <span className="task-plant">for {task.plant_name}</span>
                      )}
                    </div>
                    
                    <div className="task-meta">
                      <span className="task-meta-item">
                        <i className="far fa-calendar"></i>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Due soon'}
                      </span>
                      
                      {task.description && (
                        <span className="task-meta-item">
                          <i className="fas fa-info-circle"></i>
                          {task.description}
                        </span>
                      )}
                    </div>
                    
                    <div className="task-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="task-actions">
                    <button 
                      className="task-btn btn-primary" 
                      onClick={() => completeTask(task.id)}
                    >
                      <i className="fas fa-check"></i>
                      Done
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <AnalyticsChart showNotification={showNotification} />
        <QuickActions showNotification={showNotification} />
        
        {/* Companion Planting Tips */}
        <div style={{ gridColumn: 'span 6' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="fas fa-handshake"></i>
                Companion Planting
              </h3>
              <div className="card-actions">
                <button className="card-btn" title="Learn More">
                  <i className="fas fa-graduation-cap"></i>
                </button>
              </div>
            </div>
            <div className="task-list">
              <div className="task-item" style={{ border: 'none', background: 'none', padding: '16px 0' }}>
                <div className="task-content">
                  <div className="task-title">
                    <i className="fas fa-check-circle" style={{ color: 'var(--forest-600)', marginRight: '8px' }}></i>
                    Tomatoes love basil
                  </div>
                  <div className="task-meta">Plant together to improve flavor and repel pests</div>
                </div>
              </div>
              <div className="task-item" style={{ border: 'none', background: 'none', padding: '16px 0' }}>
                <div className="task-content">
                  <div className="task-title">
                    <i className="fas fa-times-circle" style={{ color: '#ff6b6b', marginRight: '8px' }}></i>
                    Avoid beans near onions
                  </div>
                  <div className="task-meta">Onions can inhibit bean growth</div>
                </div>
              </div>
              <div className="task-item" style={{ border: 'none', background: 'none', padding: '16px 0' }}>
                <div className="task-content">
                  <div className="task-title">
                    <i className="fas fa-check-circle" style={{ color: 'var(--forest-600)', marginRight: '8px' }}></i>
                    Marigolds protect vegetables
                  </div>
                  <div className="task-meta">Plant throughout garden to deter pests</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Plants Gallery */}
        <div style={{ gridColumn: 'span 12' }}>
          <div className="card">
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
            <PlantGrid showNotification={showNotification} limit={4} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;