import React from 'react';
import TaskList from '../Dashboard/TaskList';

const CareTasks = ({ showNotification }) => {
  return (
    <div>
      <TaskList showNotification={showNotification} />
    </div>
  );
};

export default CareTasks;