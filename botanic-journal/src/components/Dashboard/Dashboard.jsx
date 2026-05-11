import React, { useMemo, useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import '../../dashboard.css';

// ─── DAILY ROTATING CONTENT ──────────────────────────────────────────────────
const getDayIndex = (arr) => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return dayOfYear % arr.length;
};

const QUOTES = [
  { text: "The love of gardening is a seed once sown that never dies.", author: "Gertrude Jekyll" },
  { text: "To plant a garden is to believe in tomorrow.", author: "Audrey Hepburn" },
  { text: "A garden requires patient labor and attention. Plants do not grow merely to satisfy ambitions.", author: "Liberty Hyde Bailey" },
  { text: "The glory of gardening: hands in the dirt, head in the sun, heart with nature.", author: "Alfred Austin" },
  { text: "In every gardener there is a child who believes in The Seed Fairy.", author: "Robert Brault" },
  { text: "Gardens are not made by singing 'Oh, how beautiful,' and sitting in the shade.", author: "Rudyard Kipling" },
  { text: "I grow plants for many reasons: to please my eye, to comfort my soul.", author: "Wayne Winterrowd" },
  { text: "Gardening is the art that uses flowers and plants as paint, and the soil as canvas.", author: "Elizabeth Murray" },
  { text: "A weed is but an unloved flower.", author: "Ella Wheeler Wilcox" },
  { text: "Though I do not believe that a plant will spring up where no seed has been, I have great faith in a seed.", author: "Henry David Thoreau" },
  { text: "The garden is a love song, a duet between a human being and Mother Nature.", author: "Jeff Cox" },
  { text: "Plants give us oxygen for the lungs and for the soul.", author: "Linda Solegato" },
  { text: "To forget how to dig the earth and to tend the soil is to forget ourselves.", author: "Gandhi" },
  { text: "If you have a garden and a library, you have everything you need.", author: "Marcus Tullius Cicero" },
];

const TIPS = [
  { tip: "Crushed eggshells add natural calcium to soil — great for tomatoes and peppers." },
  { tip: "Water deeply and less often to encourage roots to grow downward, building stronger plants." },
  { tip: "Coffee grounds make excellent mulch for acid-loving plants like blueberries and azaleas." },
  { tip: "Pinch off the growing tips of basil to prevent flowering and keep the leaves coming." },
  { tip: "Group humidity-loving plants together — they create a microclimate that benefits all of them." },
  { tip: "The best time to water is early morning — it reduces evaporation and fungal disease risk." },
  { tip: "Rotate pot-bound plants a quarter turn each week for even, balanced growth." },
  { tip: "A layer of pebbles at the bottom of a pot does not improve drainage — it actually raises the water table." },
  { tip: "Wipe dusty leaves with a damp cloth so plants can absorb more light." },
  { tip: "Banana peels buried near rose roots slowly release potassium as they decompose." },
  { tip: "Yellow lower leaves often mean overwatering; yellow upper leaves can signal a nutrient deficiency." },
  { tip: "Use a toothpick to check soil moisture at depth — no need for expensive gadgets." },
  { tip: "Succulents planted together in one pot will compete for water — it's better to pot them individually." },
  { tip: "Mist orchid roots that are exposed and silvery-grey — they are thirsty; green means they are hydrated." },
];

// ─── CARE TYPE DATA ───────────────────────────────────────────────────────────
const CARE_TYPES = [
  {
    icon: 'fas fa-tint',
    label: 'Watering',
    color: '#3b82f6',
    bg: '#eff6ff',
    description: 'Hydrate your plants based on their individual needs — from weekly deep soaks to quick daily misting.',
  },
  {
    icon: 'fas fa-seedling',
    label: 'Fertilizing',
    color: '#16a34a',
    bg: '#f0fdf4',
    description: 'Feed plants with the right nutrients during growing season to boost leaf production and flowering.',
  },
  {
    icon: 'fas fa-cut',
    label: 'Pruning',
    color: '#7c3aed',
    bg: '#f5f3ff',
    description: 'Remove dead or overgrown stems to encourage bushier growth and prevent disease spread.',
  },
  {
    icon: 'fas fa-circle-plus',
    label: 'Repotting',
    color: '#b45309',
    bg: '#fffbeb',
    description: 'Give root-bound plants more room to grow by moving them to a slightly larger container.',
  },
  {
    icon: 'fas fa-bug',
    label: 'Pest Control',
    color: '#dc2626',
    bg: '#fef2f2',
    description: 'Monitor leaves for pests and treat early with neem oil or insecticidal soap before infestations spread.',
  },
  {
    icon: 'fas fa-wheat-awn',
    label: 'Harvest',
    color: '#ca8a04',
    bg: '#fefce8',
    description: 'Collect herbs, vegetables, and fruits at peak ripeness to encourage continuous production.',
  },
];

// ─── HEALTH REFERENCE VALUES ─────────────────────────────────────────────────
const HEALTH_BARS = [
  { label: 'Soil Moisture',    icon: 'fas fa-tint',            value: 60, display: '40–70%',         cls: '' },
  { label: 'Light Exposure',   icon: 'fas fa-sun',             value: 75, display: 'Bright indirect', cls: 'light-fill' },
  { label: 'Temperature',      icon: 'fas fa-temperature-low', value: 65, display: '65–80°F',         cls: 'temp-fill' },
  { label: 'Overall Vitality', icon: 'fas fa-seedling',        value: 85, display: 'Excellent',       cls: 'vitality-fill' },
];

// ─── COMMUNITY POSTS (static preview) ────────────────────────────────────────
const PREVIEW_POSTS = [
  { id: 1, username: 'PlantMom_Jasmine', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', title: 'My orchid rebloomed after 6 months! 🌸', timeAgo: '5 min ago' },
  { id: 2, username: 'GreenThumbTom',    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',   title: 'Best organic fertilizer for leafy greens?', timeAgo: '12 min ago' },
  { id: 3, username: 'UrbanJungle_Sara', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', title: 'Monstera finally putting out a new fenestrated leaf!', timeAgo: '34 min ago' },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────
// Props:
//   showNotification(title, message, type) — your existing notification helper
//   onNavigate(path)                       — optional: pass your router's navigate fn
//                                            if omitted, falls back to window.location.href
const Dashboard = ({ showNotification, onNavigate }) => {
  const todayQuote = useMemo(() => QUOTES[getDayIndex(QUOTES)], []);
  const todayTip   = useMemo(() => TIPS[getDayIndex(TIPS)], []);

  // ── AI Daily Care Note ─────────────────────────────────
  const [dailyNote, setDailyNote] = useState(null);
  const [noteLoading, setNoteLoading] = useState(true);
  const [noteRefreshing, setNoteRefreshing] = useState(false);

  useEffect(() => { loadDailyNote(false); }, []);

  const loadDailyNote = async (force) => {
    try {
      if (force) setNoteRefreshing(true);
      else setNoteLoading(true);
      const res = await apiService.getDailyCareNote({ force });
      if (res.success && res.data) setDailyNote(res.data);
    } catch (e) {
      // Silent fail — widget shows fallback
      console.error('Daily note error:', e);
    } finally {
      setNoteLoading(false);
      setNoteRefreshing(false);
    }
  };

  const goToCommunity = () => {
    if (onNavigate) onNavigate('community');
  };

  return (
    <>
      <div className="dashboard-two-columns">

        {/* LEFT COLUMN */}
        <div className="dashboard-left">

          {/* Seasonal Spotlight */}
          <div className="spotlight-card">
            <div className="spotlight-badge">
              <i className="fas fa-star"></i> Seasonal Spotlight
            </div>
            <h3 className="spotlight-plant">🌿 Monstera Deliciosa</h3>
            <p className="spotlight-description">
              Also known as "Swiss Cheese Plant" — now entering peak growing season.
              Increase humidity and wipe leaves for glossy shine.
            </p>
            <button
              className="spotlight-tip"
              onClick={() => showNotification('Plant Care Tip', 'Monstera: keep away from drafts, water when top 2″ dry.', 'success')}
            >
              <i className="fas fa-lightbulb"></i> Tip: rotate pot every week for even growth.
            </button>
          </div>

          {/* Care Types Overview */}
          <div className="tasks-card">
            <div className="card-header">
              <h3><i className="fas fa-tasks"></i> Types of Plant Care</h3>
              <span className="date-range">what to do & when</span>
            </div>
            <div className="tasks-list">
              {CARE_TYPES.map(care => (
                <div key={care.label} className="task-item care-type-item">
                  <div className="task-icon" style={{ color: care.color, background: care.bg }}>
                    <i className={care.icon}></i>
                  </div>
                  <div className="task-details">
                    <div className="task-name">{care.label}</div>
                    <div className="task-action care-description">{care.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Growth Summary */}
          <div className="growth-summary-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('journal')}>
            <div className="summary-icon">
              <i className="fas fa-leaf"></i>
            </div>
            <div className="summary-content">
              <h4>Why Keep a Growth Journal?</h4>
              <p>
                Tracking your plants over time reveals patterns you'd never notice day-to-day —
                which conditions make them thrive, how fast they actually grow, and early signs of trouble
                before they become serious problems.
              </p>
              <div className="top-performer">
                <i className="fas fa-book-open"></i>{' '}
                <strong>Start journaling today</strong> — document waterings, new leaves, repots, and observations.
              </div>
            </div>
            <div style={{ alignSelf: 'center', marginLeft: '0.5rem', color: '#2e7d32', fontSize: '1.1rem', flexShrink: 0 }}>
              <i className="fas fa-arrow-right"></i>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="dashboard-right">

          {/* AI Daily Care Note */}
          <div className="ai-note-card">
            <div className="ai-note-header">
              <div className="ai-note-title">
                <div className="ai-note-icon">
                  <i className="fas fa-wand-magic-sparkles"></i>
                </div>
                <div>
                  <h3>Today's Note</h3>
                  <p className="ai-note-sub">Personalized for your collection</p>
                </div>
              </div>
              <button
                className="ai-note-refresh"
                onClick={() => loadDailyNote(true)}
                disabled={noteRefreshing}
                title="Generate a fresh note"
              >
                <i className={`fas fa-arrows-rotate ${noteRefreshing ? 'fa-spin' : ''}`}></i>
              </button>
            </div>
            <div className="ai-note-body">
              {noteLoading ? (
                <div className="ai-note-skeleton">
                  <div className="ai-skeleton-line" style={{ width: '95%' }}></div>
                  <div className="ai-skeleton-line" style={{ width: '88%' }}></div>
                  <div className="ai-skeleton-line" style={{ width: '70%' }}></div>
                </div>
              ) : dailyNote?.note ? (
                <p className="ai-note-text">{dailyNote.note}</p>
              ) : (
                <p className="ai-note-fallback">
                  Take a moment with your plants today — even a quiet check-in counts.
                </p>
              )}
              {dailyNote?.weather_summary && (
                <div className="ai-note-meta">
                  <i className="fas fa-cloud-sun"></i>
                  {dailyNote.weather_summary}
                </div>
              )}
            </div>
          </div>

          {/* Plant Health Monitor — reference values */}
          <div className="health-monitor-card">
            <div className="card-header">
              <h3><i className="fas fa-heartbeat"></i> Plant Health Monitor</h3>
            </div>
            <div className="health-metrics">
              {HEALTH_BARS.map(m => (
                <div key={m.label} className="metric-item">
                  <div className="metric-label">
                    <i className={m.icon}></i> {m.label}
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${m.cls}`} style={{ width: `${m.value}%` }}></div>
                  </div>
                  <span className="metric-value">{m.display}</span>
                </div>
              ))}
            </div>
            <p className="health-note">
              <i className="fas fa-info-circle"></i> These are average good measurements for most houseplants.
            </p>
          </div>

          {/* Daily Quote + Tip */}
          <div className="wisdom-card">
            <i className="fas fa-quote-left quote-icon"></i>
            <p className="quote-text">"{todayQuote.text}"</p>
            <p className="quote-author">— {todayQuote.author}</p>
            <hr className="divider" />
            <div className="daily-tip">
              <i className="fas fa-pencil-alt"></i>{' '}
              <strong>Today's Gardening Tip:</strong> {todayTip.tip}
            </div>
          </div>

          {/* Community Buzz */}
          <div className="community-pulse">
            <div className="card-header">
              <h3><i className="fas fa-comments"></i> Community Buzz</h3>
              <span className="active-badge">active now</span>
            </div>
            <div className="community-posts">
              {PREVIEW_POSTS.map(post => (
                <div key={post.id} className="post-item">
                  <img src={post.avatar} alt={post.username} className="post-avatar" />
                  <div className="post-content">
                    <div className="post-user">{post.username}</div>
                    <div className="post-message">{post.title}</div>
                    <div className="post-time">{post.timeAgo}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="join-btn" onClick={goToCommunity}>
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
        <span>Track your plants, build your garden journal.</span>
      </div>
    </>
  );
};

export default Dashboard;