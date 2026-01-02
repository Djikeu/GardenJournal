import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import '../../planner.css';

const GardenPlanner = ({ showNotification }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month');
  const [selectedDate, setSelectedDate] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    overdue: 0,
    today: 0,
    completed: 0
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTasks();
      if (response.success) {
        setTasks(response.data);
        calculateStats(response.data);
      }
    } catch (error) {
      showNotification('Error', 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (taskList) => {
    const today = new Date().toISOString().split('T')[0];
    const pending = taskList.filter(t => !t.completed).length;
    const overdue = taskList.filter(t => 
      !t.completed && t.due_date && t.due_date < today
    ).length;
    const todayTasks = taskList.filter(t => 
      t.due_date === today
    ).length;
    const completed = taskList.filter(t => t.completed).length;

    setStats({ pending, overdue, today: todayTasks, completed });
  };

  // REUSE your existing helper functions
  const getTaskIcon = (type) => {
    switch (type) {
      case 'watering': return '💧';
      case 'fertilizing': return '🌿';
      case 'pruning': return '✂️';
      case 'repotting': return '🪴';
      case 'pest_control': return '🐛';
      default: return '📝';
    }
  };

  const getTaskColor = (type) => {
    switch (type) {
      case 'watering': return '#3B82F6';
      case 'fertilizing': return '#10B981';
      case 'pruning': return '#F59E0B';
      case 'repotting': return '#8B5CF6';
      case 'pest_control': return '#EC4899';
      default: return '#6B7280';
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

  const formatEvents = () => {
    return tasks.map(task => ({
      id: task.id,
      title: `${getTaskIcon(task.type)} ${task.title}`,
      start: task.due_date || new Date().toISOString().split('T')[0],
      allDay: true,
      color: task.completed ? '#D1D5DB' : getTaskColor(task.type),
      borderColor: getPriorityColor(task.priority),
      extendedProps: { ...task },
      className: task.completed ? 'task-completed' : 'task-pending'
    }));
  };

  const handleEventClick = (clickInfo) => {
    const task = clickInfo.event.extendedProps;
    
    // Show task details in a notification
    showNotification(
      task.title,
      `${task.plant_name ? `For: ${task.plant_name}\n` : ''}Type: ${task.type}\nDue: ${task.due_date}\nPriority: ${task.priority}`,
      task.completed ? 'info' : 'warning'
    );
  };

  const handleDateClick = (clickInfo) => {
    const clickedDate = clickInfo.dateStr;
    setSelectedDate(clickedDate);
    
    // Filter tasks for this date
    const tasksOnDate = tasks.filter(t => t.due_date === clickedDate);
    
    if (tasksOnDate.length > 0) {
      showNotification(
        `Tasks on ${clickedDate}`,
        `${tasksOnDate.length} task(s) scheduled:\n${tasksOnDate.map(t => `• ${t.title}`).join('\n')}`,
        'info'
      );
    } else {
      showNotification(
        `No tasks on ${clickedDate}`,
        'Click "Add Task" to create a task for this date',
        'info'
      );
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="garden-planner-container">
      {/* Header */}
      <div className="planner-header">
        <h1>📅 Garden Task Calendar</h1>
        <p className="subtitle">
          Visualize your plant care schedule. Click on dates to see tasks.
        </p>
      </div>

      {/* Stats */}
      <div className="calendar-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E3F2FD' }}>
            <i className="fas fa-clock" style={{ color: '#3B82F6' }}></i>
          </div>
          <div>
            <h3>{stats.pending}</h3>
            <p>Pending Tasks</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FFEBEE' }}>
            <i className="fas fa-exclamation-triangle" style={{ color: '#EF4444' }}></i>
          </div>
          <div>
            <h3>{stats.overdue}</h3>
            <p>Overdue</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E8F5E9' }}>
            <i className="fas fa-calendar-day" style={{ color: '#10B981' }}></i>
          </div>
          <div>
            <h3>{stats.today}</h3>
            <p>Today</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#F3E5F5' }}>
            <i className="fas fa-check-circle" style={{ color: '#8B5CF6' }}></i>
          </div>
          <div>
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="calendar-controls">
        <div className="view-buttons">
          <button
            className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            <i className="fas fa-calendar-alt"></i> Month
          </button>
          <button
            className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            <i className="fas fa-calendar-week"></i> Week
          </button>
          <button
            className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => setViewMode('day')}
          >
            <i className="fas fa-calendar-day"></i> Day
          </button>
        </div>
        
        <button className="refresh-btn" onClick={loadTasks}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {/* Calendar */}
      <div className="calendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={viewMode === 'month' ? 'dayGridMonth' : viewMode === 'week' ? 'timeGridWeek' : 'timeGridDay'}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          events={formatEvents()}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          height="70vh"
          dayMaxEvents={3}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
          }}
        />
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <h4><i className="fas fa-key"></i> Task Types</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#3B82F6' }}></span>
            <span>💧 Watering</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#10B981' }}></span>
            <span>🌿 Fertilizing</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#F59E0B' }}></span>
            <span>✂️ Pruning</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#8B5CF6' }}></span>
            <span>🪴 Repotting</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#EC4899' }}></span>
            <span>🐛 Pest Control</span>
          </div>
        </div>
        
        <div className="legend-note">
          <i className="fas fa-info-circle"></i>
          <span>Gray tasks = Completed | Border color = Priority level</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h4><i className="fas fa-bolt"></i> Quick Actions</h4>
        <div className="action-buttons">
          <button className="action-btn" onClick={() => window.location.href = '/tasks'}>
            <i className="fas fa-tasks"></i> Go to Tasks List
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/tasks?add=true'}>
            <i className="fas fa-plus"></i> Add New Task
          </button>
          <button className="action-btn" onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            showNotification('Today\'s Tasks', 
              `You have ${stats.today} task(s) due today.`, 'info');
          }}>
            <i className="fas fa-eye"></i> View Today's Tasks
          </button>
        </div>
      </div>
    </div>
  );
};

export default GardenPlanner;