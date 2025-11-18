import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsChart = ({ showNotification }) => {
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Plant Health Score',
        data: [75, 78, 82, 80, 85, 88],
        borderColor: '#7db36e',
        backgroundColor: 'rgba(125, 179, 110, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#7db36e',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: 'Growth Rate',
        data: [65, 70, 75, 78, 82, 85],
        borderColor: '#ffd8a6',
        backgroundColor: 'rgba(255, 216, 166, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ffd8a6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 60,
        max: 100,
        grid: {
          color: 'rgba(125, 179, 110, 0.1)'
        }
      },
      x: {
        grid: {
          color: 'rgba(125, 179, 110, 0.1)'
        }
      }
    }
  };

  return (
    <div className="card" style={{ gridColumn: 'span 8' }}>
      <div className="card-header">
        <h3 className="card-title">
          <i className="fas fa-chart-line"></i>
          Plant Health Analytics
        </h3>
        <div className="card-actions">
          <button className="card-btn" title="Export">
            <i className="fas fa-download"></i>
          </button>
          <button className="card-btn" title="Fullscreen">
            <i className="fas fa-expand"></i>
          </button>
        </div>
      </div>
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default AnalyticsChart;