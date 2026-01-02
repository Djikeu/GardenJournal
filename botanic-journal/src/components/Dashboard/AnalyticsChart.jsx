import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Radar } from 'react-chartjs-2';
import { apiService } from '../../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Color palette
const COLORS = {
  primary: {
    main: '#10B981',     // Emerald green
    light: 'rgba(16, 185, 129, 0.1)',
    dark: '#059669'
  },
  secondary: {
    main: '#F59E0B',     // Amber
    light: 'rgba(245, 158, 11, 0.1)',
    dark: '#D97706'
  },
  accent: {
    main: '#3B82F6',     // Blue
    light: 'rgba(59, 130, 246, 0.1)',
    dark: '#2563EB'
  },
  neutral: {
    100: '#F9FAFB',
    200: '#E5E7EB',
    300: '#D1D5DB',
    700: '#374151',
    900: '#111827'
  }
};

const AnalyticsChart = ({ showNotification, user }) => {
  const [loading, setLoading] = useState(true);
  const [plantsData, setPlantsData] = useState([]);
  const [timeRange, setTimeRange] = useState('month');

  // Load user plants data
  useEffect(() => {
    loadPlantsData();
  }, [user]);

  const loadPlantsData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPlants();
      if (response.success) {
        setPlantsData(response.data);
        console.log('📊 Analytics: Loaded', response.data.length, 'plants');
      } else {
        throw new Error(response.message || 'Failed to load plant data');
      }
    } catch (error) {
      console.error('❌ Analytics error:', error);
      showNotification('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics from plant data
  const calculateHealthScore = (plant) => {
    // Calculate health score based on plant properties
    let score = 75; // Base score
    
    // Status-based adjustments
    if (plant.status === 'healthy') score += 20;
    else if (plant.status === 'warning') score += 5;
    // else danger: keep base score
    
    // Type-based adjustments
    if (plant.type === 'succulent') score += 5; // Succulents are hardy
    if (plant.is_favorite) score += 3; // Favorite plants are probably well-cared for
    
    // Add random variation for demo (in real app, use actual health metrics)
    score += Math.floor(Math.random() * 10) - 5;
    
    return Math.min(Math.max(score, 60), 100); // Keep between 60-100
  };

  // Generate time series data based on plant creation dates
  const generateTimeSeriesData = () => {
    const last6Months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    // Count plants created per month
    const plantsPerMonth = last6Months.map(() => 0);
    
    // For demo: simulate plant growth over time
    // In real app, you'd track actual plant health measurements over time
    const healthData = [75, 78, 82, 80, 85, 88];
    const growthData = [65, 70, 75, 78, 82, 85];
    
    return {
      labels: last6Months,
      healthScores: healthData,
      growthRates: growthData,
      plantCounts: plantsPerMonth
    };
  };

  // 1. MAIN TREND CHART
  const trendData = (() => {
    const timeSeries = generateTimeSeriesData();
    return {
      labels: timeSeries.labels,
      datasets: [
        {
          label: 'Avg. Plant Health',
          data: timeSeries.healthScores,
          borderColor: COLORS.primary.main,
          backgroundColor: COLORS.primary.light,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: COLORS.primary.main,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 10
        },
        {
          label: 'Collection Growth',
          data: timeSeries.growthData || [0, 1, 3, 5, 8, plantsData.length],
          borderColor: COLORS.secondary.main,
          backgroundColor: COLORS.secondary.light,
          tension: 0.4,
          fill: false,
          borderDash: [5, 5],
          pointBackgroundColor: COLORS.secondary.main,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 10
        }
      ]
    };
  })();

  // 2. PLANT TYPE DISTRIBUTION
  const plantTypeData = (() => {
    const typeCounts = {};
    plantsData.forEach(plant => {
      typeCounts[plant.type] = (typeCounts[plant.type] || 0) + 1;
    });

    const types = Object.keys(typeCounts);
    return {
      labels: types.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
      datasets: [{
        label: 'Number of Plants',
        data: types.map(t => typeCounts[t]),
        backgroundColor: types.map((_, i) => {
          const colors = [
            COLORS.primary.main,
            COLORS.accent.main,
            COLORS.secondary.main,
            '#8B5CF6', // Purple
            '#EC4899', // Pink
            '#06B6D4'  // Cyan
          ];
          return colors[i % colors.length];
        }),
        borderRadius: 8,
        borderSkipped: false
      }]
    };
  })();

  // 3. HEALTH STATUS DISTRIBUTION
  const healthStatusData = (() => {
    const statusCounts = { healthy: 0, warning: 0, danger: 0 };
    plantsData.forEach(plant => {
      if (statusCounts[plant.status] !== undefined) {
        statusCounts[plant.status]++;
      }
    });

    return {
      labels: ['Healthy', 'Warning', 'Needs Attention'],
      datasets: [{
        data: [statusCounts.healthy, statusCounts.warning, statusCounts.danger],
        backgroundColor: [
          COLORS.primary.main,  // Healthy - green
          COLORS.secondary.main, // Warning - yellow
          '#EF4444'              // Danger - red
        ],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 15
      }]
    };
  })();

  // 4. CARE REQUIREMENTS ANALYSIS
  const careRequirementsData = (() => {
    const lightLevels = {};
    const waterSchedules = {};
    
    plantsData.forEach(plant => {
      if (plant.light_requirements) {
        lightLevels[plant.light_requirements] = (lightLevels[plant.light_requirements] || 0) + 1;
      }
      if (plant.watering_schedule) {
        waterSchedules[plant.watering_schedule] = (waterSchedules[plant.watering_schedule] || 0) + 1;
      }
    });

    return {
      lightLevels,
      waterSchedules
    };
  })();

  // Chart options
  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12, weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: COLORS.neutral[200] }
      },
      y: {
        beginAtZero: false,
        min: 50,
        max: 100,
        grid: { color: COLORS.neutral[200] },
        ticks: {
          callback: (value) => `${value}%`
        }
      }
    }
  };

  const barOptions = {
    ...trendOptions,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: COLORS.neutral[200] } }
    }
  };

  const pieOptions = {
    ...trendOptions,
    plugins: {
      ...trendOptions.plugins,
      tooltip: {
        ...trendOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} plants (${percentage}%)`;
          }
        }
      }
    }
  };

  // Quick stats
  const stats = [
    { 
      label: 'Total Plants', 
      value: plantsData.length, 
      change: '+2', 
      icon: '🌿', 
      color: COLORS.primary.main 
    },
    { 
      label: 'Avg. Health Score', 
      value: plantsData.length > 0 
        ? Math.round(plantsData.reduce((sum, plant) => sum + calculateHealthScore(plant), 0) / plantsData.length) + '%'
        : '0%', 
      change: '+5%', 
      icon: '📈', 
      color: COLORS.accent.main 
    },
    { 
      label: 'Favorites', 
      value: plantsData.filter(p => p.is_favorite).length, 
      change: '+1', 
      icon: '⭐', 
      color: COLORS.secondary.main 
    },
    { 
      label: 'Plant Types', 
      value: new Set(plantsData.map(p => p.type)).size, 
      change: '+1', 
      icon: '🌱', 
      color: '#8B5CF6' 
    }
  ];

  const careStats = [
    { 
      label: 'Most Common Light', 
      value: Object.keys(careRequirementsData.lightLevels).length > 0
        ? Object.entries(careRequirementsData.lightLevels)
            .sort(([,a], [,b]) => b - a)[0][0]
        : 'N/A',
      icon: '☀️'
    },
    { 
      label: 'Watering Frequency', 
      value: Object.keys(careRequirementsData.waterSchedules).length > 0
        ? Object.entries(careRequirementsData.waterSchedules)
            .sort(([,a], [,b]) => b - a)[0][0]
        : 'N/A',
      icon: '💧'
    }
  ];

  if (loading) {
    return (
      <div className="card" style={{ gridColumn: 'span 8' }}>
        <div className="card-header">
          <h3 className="card-title">
            <i className="fas fa-chart-line"></i>
            Plant Health Analytics
          </h3>
        </div>
        <div className="chart-container" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading-spinner">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ gridColumn: 'span 8' }}>
      <div className="card-header">
        <h3 className="card-title">
          <i className="fas fa-chart-line"></i>
          Plant Health Analytics
          <span className="subtitle">Based on your {plantsData.length} plants</span>
        </h3>
        <div className="card-actions">
          <button className="card-btn" onClick={loadPlantsData} title="Refresh">
            <i className="fas fa-sync-alt"></i>
          </button>
          <button className="card-btn" title="Export">
            <i className="fas fa-download"></i>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary-analytics">
        {stats.map((stat, index) => (
          <div key={index} className="stat-item">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}15` }}>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-change positive">
                <i className="fas fa-arrow-up"></i>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="chart-container" style={{ height: '300px', marginTop: '20px' }}>
        <Line data={trendData} options={trendOptions} />
      </div>

      {/* Additional Charts Row */}
      <div className="charts-row" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {/* Plant Types Distribution */}
        <div className="chart-mini" style={{ flex: 1 }}>
          <div className="chart-header">
            <h4>Plant Types</h4>
          </div>
          <div className="chart-container" style={{ height: '200px' }}>
            <Bar data={plantTypeData} options={barOptions} />
          </div>
        </div>

        {/* Health Status */}
        <div className="chart-mini" style={{ flex: 1 }}>
          <div className="chart-header">
            <h4>Health Status</h4>
          </div>
          <div className="chart-container" style={{ height: '200px' }}>
            <Pie data={healthStatusData} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Care Requirements */}
      {plantsData.length > 0 && (
        <div className="care-insights" style={{ marginTop: '20px', padding: '15px', background: COLORS.neutral[100], borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '10px' }}>📋 Care Insights</h4>
          <div style={{ display: 'flex', gap: '20px' }}>
            {careStats.map((stat, index) => (
              <div key={index} className="care-stat">
                <span className="care-icon">{stat.icon}</span>
                <div>
                  <div className="care-label">{stat.label}</div>
                  <div className="care-value">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.neutral[700], marginTop: '10px' }}>
            <i className="fas fa-lightbulb"></i>
            <span>Tip: {plantsData.length === 1 
              ? 'Add more plants to see detailed analytics' 
              : plantsData.filter(p => p.status === 'healthy').length === plantsData.length
                ? 'All your plants are healthy! Keep up the great work.'
                : 'Check plants marked as "warning" or "danger" for special care needs.'}
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        .subtitle {
          font-size: 12px;
          color: ${COLORS.neutral[700]};
          margin-left: 10px;
          font-weight: normal;
        }

        .stats-summary-analytics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin: 20px 0;
          padding: 15px;
          background: ${COLORS.neutral[100]};
          border-radius: 8px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: ${COLORS.neutral[900]};
          margin-bottom: 2px;
        }

        .stat-label {
          font-size: 12px;
          color: ${COLORS.neutral[700]};
          margin-bottom: 4px;
        }

        .stat-change {
          font-size: 11px;
          font-weight: 500;
        }

        .stat-change.positive {
          color: ${COLORS.primary.main};
        }

        .chart-mini {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .chart-mini .chart-header h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: ${COLORS.neutral[900]};
        }

        .care-insights {
          border-left: 4px solid ${COLORS.primary.main};
        }

        .care-stat {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: white;
          border-radius: 6px;
          min-width: 180px;
        }

        .care-icon {
          font-size: 20px;
          background: ${COLORS.primary.light};
          color: ${COLORS.primary.main};
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .care-label {
          font-size: 12px;
          color: ${COLORS.neutral[700]};
        }

        .care-value {
          font-size: 16px;
          font-weight: 600;
          color: ${COLORS.neutral[900]};
        }

        .loading-spinner {
          color: ${COLORS.neutral[700]};
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .stats-summary-analytics {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .charts-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsChart;