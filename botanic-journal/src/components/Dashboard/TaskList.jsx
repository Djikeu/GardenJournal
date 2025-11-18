import React, { useState } from 'react';
import { tasksData } from '../../data';

const TaskList = ({ showNotification }) => {
  const [tasks, setTasks] = useState(tasksData);

  const completeTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    ));
    showNotification('Task Completed!', 'Great job! Your plant will thank you.', 'success');
  };

  const snoozeTask = (taskId) => {
    showNotification('Task Snoozed', 'This task has been postponed until tomorrow.', 'info');
  };

  return (
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
        {tasks.map(task => (
          <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
            <input 
              type="checkbox" 
              className="task-checkbox" 
              checked={task.completed}
              onChange={() => completeTask(task.id)}
            />
            <div className="task-content">
              <div className="task-title">
                <span className={`task-priority priority-${task.priority}`}></span>
                {task.title}
              </div>
              <div className="task-meta">
                {task.lastWatered && (
                  <span className="task-meta-item">
                    <i className="far fa-clock"></i>
                    {task.lastWatered}
                  </span>
                )}
                {task.soilCondition && (
                  <span className="task-meta-item">
                    <i className="fas fa-temperature-high"></i>
                    {task.soilCondition}
                  </span>
                )}
                {task.issue && (
                  <span className="task-meta-item">
                    <i className="fas fa-bug"></i>
                    {task.issue}
                  </span>
                )}
                {task.urgency && (
                  <span className="task-meta-item">
                    <i className="fas fa-exclamation-triangle"></i>
                    {task.urgency}
                  </span>
                )}
              </div>
              <div className="task-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${task.progress}%` }}></div>
                </div>
              </div>
            </div>
            <div className="task-actions">
              <button 
                className="task-btn btn-primary" 
                onClick={() => completeTask(task.id)}
                disabled={task.completed}
              >
                <i className="fas fa-check"></i>
                Done
              </button>
              <button 
                className="task-btn btn-secondary" 
                onClick={() => snoozeTask(task.id)}
                disabled={task.completed}
              >
                <i className="fas fa-clock"></i>
                Later
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;