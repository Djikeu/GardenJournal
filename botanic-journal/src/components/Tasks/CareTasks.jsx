import React, { useState, useEffect } from 'react'; 
import { apiService } from '../../services/api';
import '../../tasks.css' 
const CareTasks = ({ showNotification }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [plants, setPlants] = useState([]);
  const [loadingPlants, setLoadingPlants] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    plant_id: '',
    type: 'watering',
    priority: 'medium',
    due_date: new Date().toISOString().split('T')[0],
    progress: 0,
    completed: false
  });

  useEffect(() => {
    loadTasks();
    loadPlants();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTasks();
      if (response.success && response.data) {
        setTasks(response.data);
      } else {
        showNotification('Info', 'No tasks found. Create your first task!', 'info');
        setTasks([]);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      showNotification('Error', 'Failed to load tasks. Please try again.', 'error');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPlants = async () => {
    try {
      setLoadingPlants(true);
      const response = await apiService.getPlants();
      if (response.success) {
        setPlants(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load plants:', error);
      showNotification('Error', 'Failed to load plants', 'error');
    } finally {
      setLoadingPlants(false);
    }
  };

  const completeTask = async (taskId) => {
    try {
      const response = await apiService.completeTask(taskId);
      if (response.success) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, completed: true, progress: 100 } : task
        ));
        showNotification('Task Completed!', 'Great job! Your plant will thank you.', 'success');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
      showNotification('Error', 'Failed to complete task. Please try again.', 'error');
    }
  };

 const snoozeTask = async (taskId) => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];
        
        console.log('Snoozing task:', taskId, 'New due date:', tomorrowString);
        
        // Use PATCH method to update only the due_date field
        const response = await apiService.updateTask(taskId, { 
            due_date: tomorrowString 
        });
        
        console.log('Snooze response:', response);
        
        if (response.success) {
            setTasks(tasks.map(task => 
                task.id === taskId ? { ...task, due_date: tomorrowString } : task
            ));
            showNotification('Task Snoozed', 'This task has been postponed until tomorrow.', 'info');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Failed to snooze task:', error);
        showNotification('Error', 'Failed to snooze task. Please try again.', 'error');
    }
};

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      if (!newTask.title.trim()) {
        showNotification('Error', 'Task title is required', 'error');
        return;
      }

      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description || '',
        plant_id: newTask.plant_id || null,
        type: newTask.type,
        priority: newTask.priority,
        due_date: newTask.due_date,
        progress: parseInt(newTask.progress) || 0,
        completed: false
      };

      console.log('Creating task:', taskData);
      const response = await apiService.createTask(taskData);
      
      if (response.success) {
        setTasks(prevTasks => [response.data, ...prevTasks]);
        setShowCreateModal(false);
        setNewTask({
          title: '',
          description: '',
          plant_id: '',
          type: 'watering',
          priority: 'medium',
          due_date: new Date().toISOString().split('T')[0],
          progress: 0,
          completed: false
        });
        showNotification('Success', 'Task created successfully!', 'success');
      } else {
        throw new Error(response.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      showNotification('Error', error.message || 'Failed to create task', 'error');
    }
  };

  const handleInputChange = (field, value) => {
    setNewTask(prev => ({
      ...prev,
      [field]: value
    }));
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

  const taskTypes = [
    { value: 'watering', label: 'Watering', icon: 'fas fa-tint' },
    { value: 'fertilizing', label: 'Fertilizing', icon: 'fas fa-flask' },
    { value: 'pruning', label: 'Pruning', icon: 'fas fa-cut' },
    { value: 'repotting', label: 'Repotting', icon: 'fas fa-seedling' },
    { value: 'pest_control', label: 'Pest Control', icon: 'fas fa-bug' },
    { value: 'other', label: 'Other', icon: 'fas fa-tasks' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#10b981' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' }
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.plant_name && task.plant_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filter === 'all' ? true :
      filter === 'pending' ? !task.completed :
      filter === 'completed' ? task.completed : true;
    return matchesSearch && matchesFilter;
  });

  const pendingTasks = tasks.filter(task => !task.completed);
  const urgentTasks = pendingTasks.filter(task => 
    getUrgencyLevel(task) === 'urgent' || getUrgencyLevel(task) === 'overdue'
  );

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
                  filterType === 'pending' ? 'fa-clock' :
                  'fa-check-circle'
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
              {[...new Set(tasks.filter(task => !task.completed && task.plant_id).map(task => task.plant_id))].length}
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
              <button 
                className="card-btn" 
                title="Refresh" 
                onClick={loadTasks}
                style={{ marginRight: '8px' }}
              >
                <i className="fas fa-sync-alt"></i>
              </button>
              <button
                className="card-btn primary"
                title="Add Task"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="fas fa-plus"></i>
                Add Task
              </button>
            </div>
          </div>
          <div className="tasks-content">
            {filteredTasks.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">
                  <i className="fas fa-tasks"></i>
                </div>
                <h3>No tasks found</h3>
                <p>
                  {searchTerm || filter !== 'all' ?
                    "No tasks match your criteria. Try adjusting your search or filters." :
                    "All caught up! Your plants are happy and healthy. Create a new task to get started."
                  }
                </p>
                {(searchTerm || filter !== 'all') ? (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setSearchTerm('');
                      setFilter('all');
                    }}
                  >
                    <i className="fas fa-undo"></i>
                    Reset Filters
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <i className="fas fa-plus"></i>
                    Create Your First Task
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
                    <div
                      key={task.id}
                      className={`task-card ${urgencyLevel} ${task.completed ? 'completed' : ''}`}
                    >
                      <div className="task-card-inner">
                        {/* Task Header */}
                        <div className="task-header">
                          <div
                            className="task-type-badge"
                            style={{ backgroundColor: typeColor }}
                          >
                            <i className={getTaskTypeIcon(task.type)}></i>
                            {task.type.replace('_', ' ')}
                          </div>
                          <div
                            className="task-priority-badge"
                            style={{ backgroundColor: priorityColor }}
                          >
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

                          {/* Task Meta - Fixed Layout */}
                          <div className="task-meta-grid">
                            <div className="meta-row">
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
                            </div>
                            <div className="meta-row">
                              <div className="meta-item">
                                <i className="fas fa-chart-bar"></i>
                                <div>
                                  <span className="meta-label">Progress</span>
                                  <span className="meta-value">{task.progress}%</span>
                                </div>
                              </div>
                              <div className="meta-item">
                                <i className="far fa-clock"></i>
                                <div>
                                  <span className="meta-label">Status</span>
                                  <span className="meta-value">
                                    {task.completed ? 'Completed' : 'In Progress'}
                                  </span>
                                </div>
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

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Task</h3>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="task-form">
              <div className="form-group">
                <label htmlFor="task-title">Task Title *</label>
                <input
                  type="text"
                  id="task-title"
                  placeholder="e.g., Water the plants, Check for pests..."
                  value={newTask.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-description">Description</label>
                <textarea
                  id="task-description"
                  placeholder="Add details about this task..."
                  value={newTask.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task-plant">Associated Plant (Optional)</label>
                  <select
                    id="task-plant"
                    value={newTask.plant_id}
                    onChange={(e) => handleInputChange('plant_id', e.target.value)}
                  >
                    <option value="">No specific plant</option>
                    {plants.map(plant => (
                      <option key={plant.id} value={plant.id}>
                        {plant.name} {plant.species ? `(${plant.species})` : ''}
                      </option>
                    ))}
                  </select>
                  {loadingPlants && (
                    <div className="loading-text">Loading plants...</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="task-type">Task Type</label>
                  <select
                    id="task-type"
                    value={newTask.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  >
                    {taskTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task-priority">Priority</label>
                  <select
                    id="task-priority"
                    value={newTask.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="task-due-date">Due Date</label>
                  <input
                    type="date"
                    id="task-due-date"
                    value={newTask.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="task-progress">
                  Initial Progress: {newTask.progress}%
                </label>
                <input
                  type="range"
                  id="task-progress"
                  min="0"
                  max="100"
                  step="5"
                  value={newTask.progress}
                  onChange={(e) => handleInputChange('progress', e.target.value)}
                />
                <div className="progress-labels">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  <i className="fas fa-plus"></i>
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareTasks;