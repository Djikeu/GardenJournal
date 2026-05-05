import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import '../../Header.css'; // We'll create a new CSS file for the redesigned header

const Header = ({ onProfileClick, user }) => {
  const [headerUser, setHeaderUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState({
    temperature: '--',
    condition: 'loading',
    humidity: '--',
    recommendation: ''
  });
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [plantsCount, setPlantsCount] = useState(0);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);

  const WEATHERAPI_KEY = '768f43eeeb0d4627ace203556261004';

  useEffect(() => {
    loadUserData();
    loadPlantsAndTasks();
    getWeatherData();

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Refresh weather every 30 minutes
    const weatherTimer = setInterval(() => {
      getWeatherData();
    }, 1800000);

    return () => {
      clearInterval(timer);
      clearInterval(weatherTimer);
    };
  }, []);

  const loadUserData = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success) {
        setHeaderUser(response.data);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadPlantsAndTasks = async () => {
    try {
      // Load plants
      const plantsResponse = await apiService.getPlants();
      if (plantsResponse.success) {
        setPlantsCount(plantsResponse.data?.length || 0);
      }

      // Load tasks
      const tasksResponse = await apiService.getTasks();
      if (tasksResponse.success) {
        const pendingTasks = tasksResponse.data?.filter(task => !task.completed).length || 0;
        setPendingTasksCount(pendingTasks);
      }
    } catch (error) {
      console.error('Failed to load plants/tasks:', error);
    }
  };

  const getWeatherRecommendation = (temp, humidity, condition) => {
    if (condition.toLowerCase().includes('rain')) {
      return "🌧️ Rain detected - Skip watering";
    }
    if (temp > 30) {
      return "🔥 Hot day - Water your plants more";
    }
    if (temp < 5) {
      return "❄️ Cold - Protect plants from frost";
    }
    if (humidity > 80) {
      return "💧 High humidity - Skip watering";
    }
    if (humidity < 30) {
      return "🏜️ Very dry - Extra water needed";
    }
    return "🌱 Perfect conditions for plant care";
  };

  const getWeatherIcon = (condition) => {
    const cond = condition.toLowerCase();
    if (cond.includes('rain')) return '🌧️';
    if (cond.includes('cloud')) return '☁️';
    if (cond.includes('clear') || cond.includes('sun')) return '☀️';
    if (cond.includes('snow')) return '❄️';
    return '🌤️';
  };

  // Add this function inside the Header component to determine weather class
  const getWeatherClass = (condition, hour) => {
    const isNight = hour < 6 || hour > 18;
    const cond = condition.toLowerCase();

    if (cond.includes('rain') || cond.includes('drizzle')) return 'rainy';
    if (cond.includes('thunder') || cond.includes('storm') || cond.includes('lightning')) return 'storm';
    if (cond.includes('snow') || cond.includes('sleet') || cond.includes('ice')) return 'snow';
    if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze') || cond.includes('smoke')) return 'fog';
    if (cond.includes('cloud') || cond.includes('overcast')) {
      return isNight ? 'cloudy-night' : 'cloudy';
    }
    if (cond.includes('clear') || cond.includes('sun') || cond.includes('fair')) {
      return isNight ? 'sunny-night' : 'sunny';
    }

    // Default fallback
    return isNight ? 'sunny-night' : 'sunny';
  };


  // Add this helper near the top of the component
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return 'https://i.pravatar.cc/150?img=12';
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost${avatarPath}`;
  };


  const getWeatherData = () => {
    if (!navigator.geolocation) {
      setWeather({
        temperature: '22°C',
        condition: 'clear',
        humidity: '54',
        recommendation: getWeatherRecommendation(22, 54, 'clear')
      });
      setWeatherLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${position.coords.latitude},${position.coords.longitude}`
          );

          if (!response.ok) throw new Error('Weather API failed');

          const data = await response.json();
          const temp = Math.round(data.current.temp_c);
          const humidity = data.current.humidity;
          const condition = data.current.condition.text;

          setWeather({
            temperature: `${temp}°C`,
            condition: condition,
            humidity: humidity,
            recommendation: getWeatherRecommendation(temp, humidity, condition)
          });
          setWeatherLoading(false);
        } catch (error) {
          console.error('Weather fetch error:', error);
          setWeather({
            temperature: '22°C',
            condition: 'clear',
            humidity: '54',
            recommendation: getWeatherRecommendation(22, 54, 'clear')
          });
          setWeatherLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setWeather({
          temperature: '22°C',
          condition: 'clear',
          humidity: '54',
          recommendation: getWeatherRecommendation(22, 54, 'clear')
        });
        setWeatherLoading(false);
      }
    );
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Profile clicked');
    if (onProfileClick) {
      onProfileClick();
    }
  };

  const getLevelTitle = (level) => {
    if (level >= 10) return 'Expert Gardener';
    if (level >= 5) return 'Green Guardian';
    if (level >= 3) return 'Growing Enthusiast';
    return 'Budding Grower';
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getSeasonalEmoji = () => {
    const month = currentTime.getMonth();
    if (month >= 2 && month <= 4) return '🌸'; // Spring
    if (month >= 5 && month <= 7) return '☀️'; // Summer
    if (month >= 8 && month <= 10) return '🍂'; // Fall
    return '❄️'; // Winter
  };

  // Use prop user first, fallback to locally loaded user
  const displayUser = user || headerUser;

  // Calculate plants needing water (mock for now - can be enhanced)
  const plantsNeedingWater = Math.min(plantsCount, 3);

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <div className="header-greeting">
          <span className="greeting-emoji">{getSeasonalEmoji()}</span>
          <div className="greeting-text-wrapper">
            <h1 className="greeting-title">
              {getGreeting()}, {displayUser?.username?.split(' ')[0] || displayUser?.name?.split(' ')[0] || 'Gardener'}!
            </h1>
            <div className="greeting-details">
              <span className="date-info">
                <i className="far fa-calendar-alt"></i>
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span className="time-info">
                <i className="far fa-clock"></i>
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Plant Quick Stats - Dynamically Updated */}
        <div className="header-quick-stats">
          <div className="quick-stat">
            <i className="fas fa-leaf"></i>
            <span>{plantsCount} plants</span>
          </div>
          <div className="quick-stat">
            <i className="fas fa-tint"></i>
            <span>{plantsNeedingWater} need water</span>
          </div>
          <div className="quick-stat">
            <i className="fas fa-tasks"></i>
            <span>{pendingTasksCount} tasks due</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Working Weather Mini Card */}
        <div className={`weather-mini-card ${weatherLoading ? 'loading' : getWeatherClass(weather.condition, currentTime.getHours())}`}>
          {weatherLoading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              <div className="weather-info">
                <strong>Loading weather...</strong>
                <span>Fetching latest data</span>
              </div>
            </>
          ) : (
            <>
              <div className="weather-icon-large">
                {getWeatherIcon(weather.condition)}
              </div>
              <div className="weather-info">
                <strong>{weather.temperature}</strong>
                <span>{weather.recommendation}</span>
              </div>
              <div className="humidity-info">
                <i className="fas fa-tint"></i>
                <span>{weather.humidity}%</span>
              </div>
            </>
          )}
        </div>

        {/* User Profile Card - Enhanced */}
        <div
          className="user-profile-card clickable"
          onClick={handleProfileClick}
          title="Click to view profile"
        >
          <div className="user-avatar-container">
            <div className="user-avatar-wrapper">
              <img
                src={getAvatarUrl(displayUser?.avatar)}
                alt={displayUser?.name || "User"}
                className="user-avatar-image"
              />
              <div className="user-status-dot online"></div>
            </div>
            {displayUser?.role === 'admin' && (
              <div className="avatar-crown">
                <i className="fas fa-crown"></i>
              </div>
            )}
          </div>

          <div className="user-info-details">
            <div className="user-name-section">
              <h3 className="user-fullname">{displayUser?.name || "User"}</h3>
              {displayUser?.role === 'admin' && (
                <span className="role-badge-header admin">
                  <i className="fas fa-shield-alt"></i>
                  Admin
                </span>
              )}
              {displayUser?.role === 'premium' && (
                <span className="role-badge-header premium">
                  <i className="fas fa-gem"></i>
                  Premium
                </span>
              )}
            </div>
            <div className="user-meta-info">
              <span className="user-join-date">
                <i className="far fa-calendar-plus"></i>
                Member since {displayUser?.created_at ? new Date(displayUser.created_at).getFullYear() : new Date().getFullYear()}
              </span>
              <span className="user-plants-count">
                <i className="fas fa-leaf"></i>
                {plantsCount} plants
              </span>
            </div>
            <div className="user-streak">
              <i className="fas fa-fire"></i>
              <span className="streak-days">7 day streak</span>
              <div className="streak-progress">
                <div className="streak-fill" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>

          <div className="profile-arrow-icon">
            <i className="fas fa-chevron-right"></i>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;