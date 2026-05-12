import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import { getAvatarUrl } from '../../utils/avatar';
import './notifications.css';

const TYPE_META = {
  follow:  { icon: 'fa-user-plus',     color: '#2e7d32', bg: '#d1fae5' },
  message: { icon: 'fa-envelope',      color: '#0369a1', bg: '#dbeafe' },
  default: { icon: 'fa-bell',          color: '#6b7280', bg: '#f3f4f6' },
};

const POLL_INTERVAL = 30000; // 30 seconds

const NotificationBell = ({ onOpenChat, onShowProfile, setActiveView }) => {
  const [open, setOpen]               = useState(false);
  const [items, setItems]             = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading]         = useState(false);
  const ref     = useRef(null);
  const pollRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Initial fetch + poll
  useEffect(() => {
    pollUnread();
    pollRef.current = setInterval(pollUnread, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, []);

  const pollUnread = async () => {
    try {
      const res = await apiService.getUnreadCount();
      if (res.success) setUnreadCount(res.data?.unread_count || 0);
    } catch (e) { /* silent */ }
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await apiService.getUserNotifications();
      if (res.success) {
        setItems(res.data?.items || []);
        setUnreadCount(res.data?.unread_count || 0);
      }
    } catch (e) { /* silent */ }
    finally { setLoading(false); }
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) loadItems();
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch (e) { /* silent */ }
  };

  const handleClick = (n) => {
    // Navigate based on type
    if (n.type === 'message' && onOpenChat) {
      onOpenChat(n.related_id);
    } else if (n.type === 'follow' && onShowProfile) {
      onShowProfile(n.actor_id);
    }
    // Mark this one read locally
    if (!n.read_at) {
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setOpen(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await apiService.deleteNotification(id);
      setItems(prev => prev.filter(n => n.id !== id));
    } catch (e2) { /* silent */ }
  };

  const formatRelative = (iso) => {
    if (!iso) return '';
    const then = new Date(iso);
    const diff = Date.now() - then.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        className="notif-bell"
        onClick={toggleOpen}
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <i className={`fas fa-bell ${unreadCount > 0 ? 'has-unread' : ''}`}></i>
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-head">
            <strong>Notifications</strong>
            {items.some(n => !n.read_at) && (
              <button className="notif-mark-read" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {loading ? (
              <div className="notif-empty">
                <i className="fas fa-spinner fa-spin"></i>
              </div>
            ) : items.length === 0 ? (
              <div className="notif-empty">
                <i className="fas fa-bell-slash"></i>
                <p>No notifications yet</p>
                <small>You'll see follows and messages here.</small>
              </div>
            ) : (
              items.map(n => {
                const meta = TYPE_META[n.type] || TYPE_META.default;
                return (
                  <div
                    key={n.id}
                    className={`notif-item ${!n.read_at ? 'unread' : ''}`}
                    onClick={() => handleClick(n)}
                  >
                    {n.actor_id ? (
                      <img
                        src={getAvatarUrl({ avatar: n.actor_avatar, name: n.actor_name })}
                        alt=""
                        className="notif-actor-avatar"
                      />
                    ) : (
                      <div className="notif-type-icon" style={{ background: meta.bg, color: meta.color }}>
                        <i className={`fas ${meta.icon}`}></i>
                      </div>
                    )}
                    <div className="notif-text">
                      <div className="notif-title">
                        <span className="notif-type-pill" style={{ color: meta.color, background: meta.bg }}>
                          <i className={`fas ${meta.icon}`}></i>
                          {n.type}
                        </span>
                        {n.title}
                      </div>
                      {n.body && <div className="notif-body">{n.body}</div>}
                      <div className="notif-time">{formatRelative(n.created_at)}</div>
                    </div>
                    <button
                      className="notif-delete"
                      onClick={(e) => handleDelete(e, n.id)}
                      title="Dismiss"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
