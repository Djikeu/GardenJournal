import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../../services/api';
import { getAvatarUrl } from '../../utils/avatar';
import '../../social.css';

const Messages = ({ showNotification, initialUserId, user }) => {
  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId]   = useState(initialUserId || null);
  const [activeOther, setActiveOther]     = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [loadingList, setLoadingList]     = useState(true);
  const [loadingConv, setLoadingConv]     = useState(false);
  const [sending, setSending]             = useState(false);
  const scrollRef = useRef(null);
  const pollRef   = useRef(null);

  const buildAvatar = (u) => getAvatarUrl(u);

  const loadList = useCallback(async () => {
    try {
      const res = await apiService.getConversations();
      if (res.success) setConversations(res.data || []);
    } catch (e) { /* silent */ }
    finally { setLoadingList(false); }
  }, []);

  const loadConversation = useCallback(async (otherId) => {
    if (!otherId) return;
    try {
      setLoadingConv(true);
      const res = await apiService.getConversation(otherId);
      if (res.success) {
        setMessages(res.data.messages || []);
        setActiveOther(res.data.other);
        // Refresh list (unread counts probably changed since this convo got read)
        loadList();
      }
    } catch (e) {
      showNotification('Error', e.message || 'Could not load conversation', 'error');
    } finally {
      setLoadingConv(false);
    }
  }, [loadList, showNotification]);

  // Initial load
  useEffect(() => { loadList(); }, [loadList]);

  // Open conversation when activeUserId changes
  useEffect(() => { loadConversation(activeUserId); }, [activeUserId, loadConversation]);

  // Auto-open if launched with a target
  useEffect(() => {
    if (initialUserId && !activeUserId) setActiveUserId(initialUserId);
  }, [initialUserId, activeUserId]);

  // Lightweight polling — refresh active conv every 8s while page is open
  useEffect(() => {
    if (!activeUserId) return;
    pollRef.current = setInterval(() => loadConversation(activeUserId), 8000);
    return () => clearInterval(pollRef.current);
  }, [activeUserId, loadConversation]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || !activeUserId || sending) return;
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      sender_id: user?.id,
      recipient_id: activeUserId,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    try {
      const res = await apiService.sendDirectMessage(activeUserId, text);
      if (res.success && res.data) {
        setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
        loadList();
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      showNotification('Error', e.message || 'Could not send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    return sameDay
      ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isMine = (m) => m.sender_id === user?.id || m.sender_id === Number(user?.id);

  return (
    <div className="social-container">
      <div className="social-hero">
        <div>
          <h1><i className="fas fa-envelope"></i> Messages</h1>
          <p>Chat with other gardeners. Trade tips, swap propagations, share what's blooming.</p>
        </div>
      </div>

      <div className="messages-layout">
        {/* Conversations list */}
        <div className="conv-list">
          <div className="conv-list-header">
            <span>Conversations</span>
            <button className="social-btn social-btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={loadList} title="Refresh">
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>

          {loadingList ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
              No conversations yet. Send a message from a gardener's profile to start one.
            </div>
          ) : (
            conversations.map(c => (
              <button
                key={c.user_id}
                className={`conv-item ${activeUserId === c.user_id ? 'active' : ''}`}
                onClick={() => setActiveUserId(c.user_id)}
              >
                <img src={buildAvatar({ avatar: c.avatar, name: c.username })} alt={c.username} />
                <div className="conv-info">
                  <div className="conv-name">{c.username}</div>
                  <div className="conv-preview">
                    {c.last_sender == user?.id && 'You: '}
                    {c.last_message}
                  </div>
                </div>
                <div className="conv-meta">
                  <span className="conv-time">{formatTime(c.last_at)}</span>
                  {c.unread_count > 0 && (
                    <span className="unread-pill">{c.unread_count}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chat panel */}
        <div className="chat-panel">
          {!activeUserId ? (
            <div className="chat-panel-empty">
              <i className="fas fa-comments"></i>
              <p>Pick a conversation on the left to start chatting.</p>
            </div>
          ) : (
            <>
              <div className="chat-panel-header">
                <img src={buildAvatar({ avatar: activeOther?.avatar, name: activeOther?.username })} alt={activeOther?.username || 'User'} />
                <div>
                  <strong>{activeOther?.username || 'Loading…'}</strong>
                </div>
              </div>

              <div className="chat-messages" ref={scrollRef}>
                {loadingConv && messages.length === 0 ? (
                  <div className="social-loading" style={{ margin: 'auto' }}>
                    <div className="social-spinner"><i className="fas fa-leaf"></i></div>
                    <p>Loading messages…</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-panel-empty">
                    <i className="fas fa-leaf"></i>
                    <p>Say hi!</p>
                  </div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`dm-row ${isMine(m) ? 'dm-mine' : 'dm-theirs'}`}>
                      <div className="dm-bubble">{m.content}</div>
                      <span className="dm-time">{formatTime(m.created_at)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="chat-input-row">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Write a message…  (Shift+Enter for newline)"
                  disabled={sending}
                />
                <button onClick={send} disabled={!input.trim() || sending} title="Send">
                  {sending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
