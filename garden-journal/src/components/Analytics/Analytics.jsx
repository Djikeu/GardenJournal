import React from 'react';
import AnalyticsChart from '../Dashboard/AnalyticsChart';

const Analytics = ({ showNotification }) => {
  return (
    <div>
      <AnalyticsChart showNotification={showNotification} />
    </div>
  );
};

export default Analytics;