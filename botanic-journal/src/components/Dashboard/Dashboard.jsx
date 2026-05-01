import React, { useState, useEffect } from 'react';
import '../../dashboard.css'; // We'll create separate CSS or you can keep in same file

const Dashboard = ({ showNotification, user }) => {
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    totalPlants: 24,
    wateringCount: 162,
    growthRate: '+18%',
    communityMembers: 342
  });

  // Upcoming tasks data (dashboard specific)
  const [upcomingTasks, setUpcomingTasks] = useState([
    {
      id: 1,
      plantName: 'Ficus elastica (Rubber Plant)',
      action: 'Morning watering',
      dueDate: '2026-05-02',
      priority: 'medium',
      icon: 'fas fa-tint'
    },
    {
      id: 2,
      plantName: 'Basil & Mint duo',
      action: 'Prune old leaves',
      dueDate: '2026-05-03',
      priority: 'high',
      icon: 'fas fa-cut'
    },
    {
      id: 3,
      plantName: 'Snake plant (Sansevieria)',
      action: 'Fertilize (weak solution)',
      dueDate: '2026-05-04',
      priority: 'low',
      icon: 'fas fa-seedling'
    },
    {
      id: 4,
      plantName: 'Pothos Golden',
      action: 'Mist & check trailing vines',
      dueDate: '2026-05-02',
      priority: 'medium',
      icon: 'fas fa-spray-can-sparkles'
    }
  ]);

  const [healthMetrics, setHealthMetrics] = useState({
    soilMoisture: 68,
    lightExposure: 82,
    temperature: 71,
    vitality: 89
  });

  const [communityPosts, setCommunityPosts] = useState([
    {
      id: 1,
      username: 'PlantMom_Jasmine',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      content: 'My orchid rebloomed after 6 months! 🌸',
      timeAgo: '5 min ago'
    },
    {
      id: 2,
      username: 'GreenThumbTom',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      content: 'Best organic fertilizer for leafy greens?',
      timeAgo: '12 min ago'
    }
  ]);

  const getLevelTitle = (level) => {
    if (level >= 10) return 'Expert Gardener';
    if (level >= 5) return 'Green Guardian';
    return 'Budding Grower';
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return { bg: '#ffe4e2', color: '#b91c1c' };
      case 'medium': return { bg: '#fff1e0', color: '#c2410c' };
      default: return { bg: '#e6f4ea', color: '#2e7d32' };
    }
  };

  const handleTaskClick = (task) => {
    showNotification('Task Reminder', `${task.plantName}: ${task.action}`, 'info');
  };

  const handleJoinDiscussion = () => {
    showNotification('Community', 'Redirecting to discussions...', 'info');
  };

  const handleSpotlightTip = () => {
    showNotification('Plant Care Tip', 'Monstera care: keep away from drafts, water when top 2" dry.', 'success');
  };

  return (
    <>
      {/* Stats Insight Cards - Brand new dashboard metrics */}
      <div className="insight-grid">
        <div className="insight-card">
          <div className="insight-icon plants">
            <i className="fas fa-sprout"></i>
          </div>
          <div className="insight-stats">
            <h3>{userStats.totalPlants}</h3>
            <p>Plants thriving</p>
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-icon water">
            <i className="fas fa-water"></i>
          </div>
          <div className="insight-stats">
            <h3>{userStats.wateringCount}</h3>
            <p>Total waterings this month</p>
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-icon growth">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="insight-stats">
            <h3>{userStats.growthRate}</h3>
            <p>Growth rate vs last month</p>
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-icon community">
            <i className="fas fa-users"></i>
          </div>
          <div className="insight-stats">
            <h3>{userStats.communityMembers}</h3>
            <p>Community helpers</p>
          </div>
        </div>
      </div>

      {/* Two-Column Dashboard Layout */}
      <div className="dashboard-two-columns">
        {/* LEFT COLUMN */}
        <div className="dashboard-left">
          {/* Seasonal Spotlight - New Feature */}
          <div className="spotlight-card">
            <div className="spotlight-badge">
              <i className="fas fa-star"></i> Seasonal Spotlight
            </div>
            <h3 className="spotlight-plant">🌿 Monstera Deliciosa</h3>
            <p className="spotlight-description">
              Also known as "Swiss Cheese Plant" — now entering peak growing season. 
              Increase humidity and wipe leaves for glossy shine.
            </p>
            <button className="spotlight-tip" onClick={handleSpotlightTip}>
              <i className="fas fa-lightbulb"></i> Tip: rotate pot every week for even growth.
            </button>
          </div>

          {/* Upcoming Care Tasks - Redesigned */}
          <div className="tasks-card">
            <div className="card-header">
              <h3><i className="fas fa-tasks"></i> Upcoming Plant Care</h3>
              <span className="date-range">next 3 days</span>
            </div>
            <div className="tasks-list">
              {upcomingTasks.map(task => {
                const priorityStyle = getPriorityColor(task.priority);
                return (
                  <div key={task.id} className="task-item" onClick={() => handleTaskClick(task)}>
                    <div className="task-icon">
                      <i className={task.icon}></i>
                    </div>
                    <div className="task-details">
                      <div className="task-name">{task.plantName}</div>
                      <div className="task-action">{task.action}</div>
                      <div className="task-date">
                        <i className="far fa-calendar"></i> 
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="task-priority" style={{ background: priorityStyle.bg, color: priorityStyle.color }}>
                      {task.priority}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Growth Summary - Text-based insight instead of chart */}
          <div className="growth-summary-card">
            <div className="summary-icon">
              <i className="fas fa-leaf"></i>
            </div>
            <div className="summary-content">
              <h4>Growth Summary for April</h4>
              <p>Average leaf production +22% compared to March. Your Monstera put out 3 new leaves! 🌱 Keep up the light management.</p>
              <div className="top-performer">
                <i className="fas fa-chart-simple"></i> 
                <strong>Top performer:</strong> Spider Plant — 12 new pups ready for propagation.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="dashboard-right">
          {/* Plant Health Monitor - Visual bars */}
          <div className="health-monitor-card">
            <div className="card-header">
              <h3><i className="fas fa-heartbeat"></i> Plant Health Monitor</h3>
            </div>
            <div className="health-metrics">
              <div className="metric-item">
                <div className="metric-label">
                  <i className="fas fa-tint"></i> Soil Moisture (avg)
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${healthMetrics.soilMoisture}%` }}></div>
                </div>
                <span className="metric-value">{healthMetrics.soilMoisture}%</span>
              </div>
              <div className="metric-item">
                <div className="metric-label">
                  <i className="fas fa-sun"></i> Light Exposure
                </div>
                <div className="progress-bar">
                  <div className="progress-fill light-fill" style={{ width: `${healthMetrics.lightExposure}%` }}></div>
                </div>
                <span className="metric-value">good</span>
              </div>
              <div className="metric-item">
                <div className="metric-label">
                  <i className="fas fa-temperature-low"></i> Temperature
                </div>
                <div className="progress-bar">
                  <div className="progress-fill temp-fill" style={{ width: `${healthMetrics.temperature - 32}%` }}></div>
                </div>
                <span className="metric-value">{healthMetrics.temperature}°F</span>
              </div>
              <div className="metric-item">
                <div className="metric-label">
                  <i className="fas fa-seedling"></i> Overall Vitality
                </div>
                <div className="progress-bar">
                  <div className="progress-fill vitality-fill" style={{ width: `${healthMetrics.vitality}%` }}></div>
                </div>
                <span className="metric-value">Excellent</span>
              </div>
            </div>
            <p className="health-note">
              <i className="fas fa-info-circle"></i> 4 plants need attention: check Calathea for curling leaves.
            </p>
          </div>

          {/* Gardening Wisdom Quote */}
          <div className="wisdom-card">
            <i className="fas fa-quote-left quote-icon"></i>
            <p className="quote-text">"The love of gardening is a seed once sown that never dies."</p>
            <p className="quote-author">— Gertrude Jekyll</p>
            <hr className="divider" />
            <div className="daily-tip">
              <i className="fas fa-pencil-alt"></i>
              <strong>Today's Gardening Tip:</strong> Use crushed eggshells as natural calcium boost for tomatoes and peppers.
            </div>
          </div>

          {/* Community Pulse Widget */}
          <div className="community-pulse">
            <div className="card-header">
              <h3><i className="fas fa-comments"></i> Community Buzz</h3>
              <span className="active-badge">active now</span>
            </div>
            <div className="community-posts">
              {communityPosts.map(post => (
                <div key={post.id} className="post-item">
                  <img src={post.avatar} alt={post.username} className="post-avatar" />
                  <div className="post-content">
                    <div className="post-user">{post.username}</div>
                    <div className="post-message">{post.content}</div>
                    <div className="post-time">{post.timeAgo}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="join-btn" onClick={handleJoinDiscussion}>
              <i className="fas fa-tree"></i> Join Discussion
            </button>
          </div>
        </div>
      </div>

      {/* Eco Footer */}
      <div className="dashboard-footer">
        <i className="fas fa-feather-alt"></i>
        <span>Every leaf speaks bliss to me — let's grow together. <strong>Your garden, your story.</strong></span>
        <i className="fas fa-recycle"></i>
        <span>Eco-friendly tips saved 3.2kg of waste this month.</span>
      </div>
    </>
  );
};

export default Dashboard;