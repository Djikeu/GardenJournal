import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const CareTasks = ({ showNotification }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTasks();
      setTasks(response.data);
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

  const snoozeTask = (taskId) => {
    showNotification('Task Snoozed', 'This task has been postponed until tomorrow.', 'info');
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Medium';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
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

  const getTaskTypeColor = (type) => {
    switch (type) {
      case 'watering': return '#3b82f6';
      case 'fertilizing': return '#8b5cf6';
      case 'pruning': return '#f59e0b';
      case 'repotting': return '#10b981';
      case 'pest_control': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getUrgencyLevel = (task) => {
    if (task.completed) return 'completed';
    if (task.priority === 'high') return 'urgent';
    if (task.due_date && new Date(task.due_date) < new Date()) return 'overdue';
    if (task.priority === 'medium') return 'soon';
    return 'normal';
  };

  // Filter tasks based on search and filter
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.plant_name && task.plant_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'pending' ? !task.completed :
      filter === 'completed' ? task.completed : true;
    
    return matchesSearch && matchesFilter;
  });

  const pendingTasks = tasks.filter(task => !task.completed);
  const urgentTasks = pendingTasks.filter(task => getUrgencyLevel(task) === 'urgent' || getUrgencyLevel(task) === 'overdue');

  if (loading) {
    return (
      <div className="tasks-loading">
        <div className="loading-spinner">
          <i className="fas fa-tasks"></i>
        </div>
        <h3>Loading Care Tasks</h3>
        <p>Getting your plant care schedule ready...</p>
      </div>
    );
  }

  return (
    <div className="care-tasks">
      {/* Hero Header */}
      <div className="tasks-hero">
        <div className="hero-content">
          <h1>
            <i className="fas fa-tasks"></i>
            Care Tasks
          </h1>
          <p className="hero-subtitle">
            Stay on top of your plant care routine. Track, complete, and manage all your gardening tasks in one place.
          </p>
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">{pendingTasks.length}</div>
            <div className="stat-label">Pending Tasks</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{urgentTasks.length}</div>
            <div className="stat-label">Urgent</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
            </div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="tasks-controls">
        <div className="controls-main">
          <div className="search-container">
            <div className="search-box-enhanced">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search tasks by title, plant name, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-enhanced"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <i className="fas fa-th"></i>
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <i className="fas fa-list"></i>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="filter-section">
          <div className="filter-header">
            <h4>Filter Tasks</h4>
            {filter !== 'all' && (
              <button 
                className="clear-filters"
                onClick={() => setFilter('all')}
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="filter-chips">
            {['all', 'pending', 'completed'].map(filterType => (
              <button
                key={filterType}
                className={`filter-chip ${filter === filterType ? 'active' : ''}`}
                onClick={() => setFilter(filterType)}
              >
                <i className={`fas ${
                  filterType === 'all' ? 'fa-tasks' :
                  filterType === 'pending' ? 'fa-clock' : 'fa-check-circle'
                }`}></i>
                {filterType === 'all' ? 'All Tasks' : 
                 filterType === 'pending' ? 'Pending' : 'Completed'}
                <span className="chip-count">
                  {filterType === 'all' ? tasks.length :
                   filterType === 'pending' ? pendingTasks.length :
                   tasks.filter(t => t.completed).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="stats-grid-enhanced">
        <div className="stat-card-enhanced primary">
          <div className="stat-icon">
            <i className="fas fa-tasks"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{pendingTasks.length}</div>
            <div className="stat-label">Pending Tasks</div>
            <div className="stat-trend">
              <i className="fas fa-exclamation-circle"></i>
              <span>{urgentTasks.length} urgent</span>
            </div>
          </div>
        </div>

        <div className="stat-card-enhanced warning">
          <div className="stat-icon">
            <i className="fas fa-tint"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {tasks.filter(task => task.type === 'watering' && !task.completed).length}
            </div>
            <div className="stat-label">Watering Tasks</div>
            <div className="stat-trend">
              <i className="fas fa-clock"></i>
              <span>Due soon</span>
            </div>
          </div>
        </div>

        <div className="stat-card-enhanced success">
          <div className="stat-icon">
            <i className="fas fa-leaf"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {[...new Set(tasks.filter(task => !task.completed).map(task => task.plant_id))].length}
            </div>
            <div className="stat-label">Plants Needing Care</div>
            <div className="stat-trend">
              <i className="fas fa-seedling"></i>
              <span>Active plants</span>
            </div>
          </div>
        </div>

        <div className="stat-card-enhanced info">
          <div className="stat-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
            </div>
            <div className="stat-label">Completion Rate</div>
            <div className="stat-trend">
              <i className="fas fa-trend-up"></i>
              <span>This week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="tasks-section">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-exclamation-circle"></i>
              Care Tasks ({filteredTasks.length})
            </h3>
            <div className="card-actions">
              <button className="card-btn" title="Refresh" onClick={loadTasks}>
                <i className="fas fa-sync-alt"></i>
              </button>
              <button className="card-btn" title="Add Task">
                <i className="fas fa-plus"></i>
              </button>
              <button className="card-btn" title="Filter">
                <i className="fas fa-filter"></i>
              </button>
            </div>
          </div>
          
          <div className="tasks-content">
            {filteredTasks.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3>No tasks found</h3>
                <p>
                  {searchTerm || filter !== 'all' ? 
                    "No tasks match your criteria. Try adjusting your search or filters." :
                    "All caught up! Your plants are happy and healthy."
                  }
                </p>
                {(searchTerm || filter !== 'all') && (
                  <button 
                    className="btn-primary" 
                    onClick={() => { setSearchTerm(''); setFilter('all'); }}
                  >
                    <i className="fas fa-undo"></i>
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className={`tasks-container ${viewMode}-view`}>
                {filteredTasks.map(task => {
                  const urgencyLevel = getUrgencyLevel(task);
                  const priorityColor = getPriorityColor(task.priority);
                  const typeColor = getTaskTypeColor(task.type);
                  
                  return (
                    <div key={task.id} className={`task-card ${urgencyLevel} ${task.completed ? 'completed' : ''}`}>
                      <div className="task-card-inner">
                        {/* Task Header */}
                        <div className="task-header">
                          <div className="task-type-badge" style={{ backgroundColor: typeColor }}>
                            <i className={getTaskTypeIcon(task.type)}></i>
                            {task.type.replace('_', ' ')}
                          </div>
                          <div className="task-priority-badge" style={{ backgroundColor: priorityColor }}>
                            {getPriorityText(task.priority)}
                          </div>
                        </div>

                        {/* Task Content */}
                        <div className="task-content">
                          <h4 className="task-title">{task.title}</h4>
                          
                          {task.plant_name && (
                            <div className="task-plant">
                              <i className="fas fa-seedling"></i>
                              For {task.plant_name}
                            </div>
                          )}

                          {task.description && (
                            <p className="task-description">{task.description}</p>
                          )}

                          {/* Task Meta */}
                          <div className="task-meta-grid">
                            {task.due_date && (
                              <div className="meta-item">
                                <i className="far fa-calendar"></i>
                                <div>
                                  <span className="meta-label">Due Date</span>
                                  <span className="meta-value">
                                    {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            <div className="meta-item">
                              <i className="fas fa-flag"></i>
                              <div>
                                <span className="meta-label">Priority</span>
                                <span className="meta-value">{getPriorityText(task.priority)}</span>
                              </div>
                            </div>

                            <div className="meta-item">
                              <i className="fas fa-chart-bar"></i>
                              <div>
                                <span className="meta-label">Progress</span>
                                <span className="meta-value">{task.progress}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="task-progress-enhanced">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ 
                                  width: `${task.progress}%`,
                                  backgroundColor: task.completed ? '#10b981' : priorityColor
                                }}
                              ></div>
                            </div>
                            <div className="progress-text">{task.progress}% complete</div>
                          </div>
                        </div>

                        {/* Task Actions */}
                        <div className="task-actions">
                          {!task.completed && (
                            <>
                              <button 
                                className="btn-primary task-action-btn"
                                onClick={() => completeTask(task.id)}
                              >
                                <i className="fas fa-check"></i>
                                Complete
                              </button>
                              <button 
                                className="btn-outline task-action-btn"
                                onClick={() => snoozeTask(task.id)}
                              >
                                <i className="fas fa-clock"></i>
                                Snooze
                              </button>
                            </>
                          )}
                          {task.completed && (
                            <div className="completed-badge">
                              <i className="fas fa-check-circle"></i>
                              Completed
                            </div>
                          )}
                        </div>

                        {/* Urgency Indicator */}
                        {urgencyLevel === 'overdue' && (
                          <div className="urgency-indicator overdue">
                            <i className="fas fa-exclamation-triangle"></i>
                            Overdue
                          </div>
                        )}
                        {urgencyLevel === 'urgent' && (
                          <div className="urgency-indicator urgent">
                            <i className="fas fa-exclamation-circle"></i>
                            Urgent
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareTasks;