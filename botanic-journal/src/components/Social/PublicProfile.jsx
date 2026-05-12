import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { getAvatarUrl } from '../../utils/avatar';
import '../../social.css';

const FALLBACK_PLANT  = 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400';

const PublicProfile = ({ targetUserId, onBack, onOpenChat, showNotification }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, [targetUserId]);

  const load = async () => {
    if (!targetUserId) return;
    try {
      setLoading(true);
      const res = await apiService.getPublicProfile(targetUserId);
      if (res.success) {
        setProfile(res.data);
        setFollowing(!!res.data.is_following);
      }
    } catch (e) {
      showNotification?.('Error', e.message || 'Could not load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    try {
      setBusy(true);
      const res = following
        ? await apiService.unfollowUserById(targetUserId)
        : await apiService.followUserById(targetUserId);
      if (res.success) {
        setFollowing(!following);
        setProfile(p => p ? {
          ...p,
          followers_count: (p.followers_count || 0) + (following ? -1 : 1)
        } : p);
      }
    } catch (e) {
      showNotification?.('Error', e.message || 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const buildUrl = (path, fallback) => {
    if (!path) return fallback;
    if (path.startsWith('http')) return path;
    return `http://localhost${path}`;
  };

  const userAvatar = (u) => getAvatarUrl({ avatar: u?.avatar, name: u?.username });

  if (loading) {
    return (
      <div className="social-container">
        <button className="profile-back" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <div className="social-loading">
          <div className="social-spinner"><i className="fas fa-leaf"></i></div>
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="social-container">
        <button className="profile-back" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <div className="social-empty">
          <i className="fas fa-circle-question"></i>
          <h3>Profile not available</h3>
          <p>This user may not exist or has restricted their profile.</p>
        </div>
      </div>
    );
  }

  const u = profile.user;
  const truncate = (text, n = 220) => {
    if (!text) return '';
    return text.length > n ? text.slice(0, n) + '…' : text;
  };

  return (
    <div className="social-container">
      <button className="profile-back" onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back
      </button>

      {/* Banner */}
      <div className="profile-banner">
        <img src={userAvatar(u)} alt={u.username} className="profile-banner-avatar" />
        <div className="profile-banner-info">
          <h2>{u.username}</h2>
          <span className="joined">
            <i className="far fa-calendar-alt"></i> Joined {u.created_at
              ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : '—'}
          </span>
          <div className="profile-banner-actions">
            <button
              className={`social-btn ${following ? 'social-btn-following' : 'social-btn-primary'}`}
              onClick={toggleFollow}
              disabled={busy}
            >
              {busy
                ? <i className="fas fa-spinner fa-spin"></i>
                : following
                  ? <span className="following-text"></span>
                  : <><i className="fas fa-user-plus"></i> Follow</>}
            </button>
            <button className="social-btn social-btn-outline" onClick={() => onOpenChat?.(u.id)}>
              <i className="fas fa-comment"></i> Send message
            </button>
          </div>
        </div>
        <div className="profile-banner-stats">
          <div className="profile-banner-stat">
            <strong>{profile.plants_count}</strong>
            <span>Plants</span>
          </div>
          <div className="profile-banner-stat">
            <strong>{profile.journals_count}</strong>
            <span>Public</span>
          </div>
          <div className="profile-banner-stat">
            <strong>{profile.followers_count}</strong>
            <span>Followers</span>
          </div>
          <div className="profile-banner-stat">
            <strong>{profile.following_count}</strong>
            <span>Following</span>
          </div>
        </div>
      </div>

      {/* Plants */}
      <div className="profile-section">
        <h3><i className="fas fa-leaf"></i> Their Plants</h3>
        {profile.plants?.length === 0 ? (
          <p style={{ color: '#6b7280', margin: 0 }}>No plants in their collection yet.</p>
        ) : (
          <div className="profile-plant-grid">
            {profile.plants.map(p => (
              <div key={p.id} className="profile-plant-tile">
                <img src={buildUrl(p.image_url, FALLBACK_PLANT)} alt={p.name} />
                <div className="profile-plant-tile-info">
                  <strong>{p.name}</strong>
                  {p.species && <small>{p.species}</small>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Public journals */}
      <div className="profile-section">
        <h3><i className="fas fa-book-open"></i> Public Journal Entries</h3>
        {profile.journals?.length === 0 ? (
          <p style={{ color: '#6b7280', margin: 0 }}>No public entries yet.</p>
        ) : (
          <div className="profile-journal-list">
            {profile.journals.map(j => (
              <div key={j.id} className="profile-journal-item">
                <h4>{j.title || 'Plant update'}</h4>
                <div className="meta">
                  <span><i className="far fa-calendar"></i> {new Date(j.created_at).toLocaleDateString()}</span>
                  {j.plant_name && <span><i className="fas fa-seedling"></i> {j.plant_name}</span>}
                </div>
                <p className="body">{truncate(j.content)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
