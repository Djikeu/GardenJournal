import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import '../../social.css';

const TABS = [
  { id: 'discover',  label: 'Discover',  icon: 'fa-compass' },
  { id: 'following', label: 'Following', icon: 'fa-user-check' },
  { id: 'followers', label: 'Followers', icon: 'fa-users' },
];

const FALLBACK_AVATAR = 'https://i.pravatar.cc/150?img=12';

const Gardeners = ({ showNotification, onShowProfile, onOpenChat }) => {
  const [tab, setTab] = useState('discover');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => { load(); }, [tab]);

  // Debounced search reload (discover only)
  useEffect(() => {
    if (tab !== 'discover') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(load, 300);
  }, [search]);

  const load = async () => {
    try {
      setLoading(true);
      let res;
      if (tab === 'discover')       res = await apiService.discoverGardeners(search);
      else if (tab === 'following') res = await apiService.getFollowing();
      else                          res = await apiService.getFollowers();
      if (res.success) setUsers(res.data || []);
    } catch (e) {
      showNotification('Error', e.message || 'Could not load gardeners.', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (u) => {
    try {
      const isFollowing = !!u.is_following || tab === 'following';
      const res = isFollowing
        ? await apiService.unfollowUserById(u.id)
        : await apiService.followUserById(u.id);
      if (res.success) {
        if (tab === 'following') {
          // remove from following list when unfollowed
          setUsers(prev => prev.filter(x => x.id !== u.id));
        } else {
          setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_following: !isFollowing } : x));
        }
      }
    } catch (e) {
      showNotification('Error', e.message || 'Action failed', 'error');
    }
  };

  const buildAvatarUrl = (path) => {
    if (!path) return FALLBACK_AVATAR;
    if (path.startsWith('http')) return path;
    return `http://localhost${path}`;
  };

  return (
    <div className="social-container">
      <div className="social-hero">
        <div>
          <h1><i className="fas fa-users"></i> Gardeners</h1>
          <p>Find and follow other plant lovers. See their public journals, exchange messages, share growth tips.</p>
        </div>
        <div className="social-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`social-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <i className={`fas ${t.icon}`}></i>{t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'discover' && (
        <div className="social-search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by username or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div className="social-loading">
          <div className="social-spinner"><i className="fas fa-leaf"></i></div>
          <p>Loading gardeners…</p>
        </div>
      ) : users.length === 0 ? (
        <div className="social-empty">
          <i className="fas fa-seedling"></i>
          <h3>{tab === 'discover' ? 'No gardeners found' : tab === 'following' ? 'You\'re not following anyone yet' : 'No followers yet'}</h3>
          <p>
            {tab === 'discover'
              ? 'Try a different search.'
              : tab === 'following'
                ? 'Discover gardeners and follow them to see their journals here.'
                : 'Share your public journals — others may follow you back.'}
          </p>
        </div>
      ) : (
        <div className="gardener-grid">
          {users.map(u => (
            <div key={u.id} className="gardener-card">
              <div className="gardener-head" onClick={() => onShowProfile?.(u.id)}>
                <img src={buildAvatarUrl(u.avatar)} alt={u.username} className="gardener-avatar" />
                <div className="gardener-info">
                  <strong>{u.username}</strong>
                  <small>
                    Member since {u.created_at
                      ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : '—'}
                  </small>
                </div>
              </div>

              <div className="gardener-stats">
                <span><i className="fas fa-leaf"></i> {u.plants_count ?? 0} plants</span>
                {u.public_journals_count != null && (
                  <span><i className="fas fa-book"></i> {u.public_journals_count} public</span>
                )}
                {u.followers_count != null && (
                  <span><i className="fas fa-user-friends"></i> {u.followers_count}</span>
                )}
              </div>

              <div className="gardener-actions">
                {tab === 'followers' ? (
                  <button
                    className={`social-btn ${u.i_follow_back ? 'social-btn-following' : 'social-btn-primary'}`}
                    onClick={() => handleFollow({ ...u, is_following: !!u.i_follow_back })}
                  >
                    {u.i_follow_back
                      ? <span className="following-text"></span>
                      : <><i className="fas fa-user-plus"></i> Follow back</>}
                  </button>
                ) : (
                  <button
                    className={`social-btn ${u.is_following || tab === 'following' ? 'social-btn-following' : 'social-btn-primary'}`}
                    onClick={() => handleFollow(u)}
                  >
                    {(u.is_following || tab === 'following')
                      ? <span className="following-text"></span>
                      : <><i className="fas fa-user-plus"></i> Follow</>}
                  </button>
                )}
                <button className="social-btn social-btn-outline" onClick={() => onOpenChat?.(u.id)}>
                  <i className="fas fa-comment"></i> Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gardeners;
