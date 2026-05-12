import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import '../../plantChat.css';

const SUGGESTED_PROMPTS = [
  { icon: 'fa-tint',             text: 'How often should I water my plants?' },
  { icon: 'fa-sun',              text: 'Which of my plants needs the most light?' },
  { icon: 'fa-bug',              text: 'How do I treat spider mites organically?' },
  { icon: 'fa-leaf',             text: 'What does yellowing on lower leaves mean?' },
  { icon: 'fa-seedling',         text: "What's a good beginner plant for me?" },
  { icon: 'fa-temperature-half', text: 'Are my plants safe in winter?' },
];

const PlantChat = ({ showNotification, user }) => {
  // Conversations
  const [conversations, setConversations]       = useState([]);
  const [activeConvId, setActiveConvId]         = useState(null);
  const [loadingConvs, setLoadingConvs]         = useState(true);
  const [renamingId, setRenamingId]             = useState(null);
  const [renameDraft, setRenameDraft]           = useState('');

  // Messages of the active conversation
  const [messages, setMessages]                 = useState([]);
  const [loadingMessages, setLoadingMessages]   = useState(false);

  // Composer
  const [input, setInput]                       = useState('');
  const [sending, setSending]                   = useState(false);

  const scrollRef = useRef(null);
  const inputRef  = useRef(null);

  // Initial: load conversations, auto-select the most recent (or none → empty state)
  useEffect(() => { loadConversations(true); }, []);
  useEffect(() => { scrollToBottom(); }, [messages, sending]);
  useEffect(() => {
    if (activeConvId == null) {
      setMessages([]);
      return;
    }
    loadMessages(activeConvId);
  }, [activeConvId]);

  const loadConversations = async (autoSelectFirst = false) => {
    try {
      setLoadingConvs(true);
      const res = await apiService.getChatConversations();
      if (res.success) {
        const list = res.data || [];
        setConversations(list);
        if (autoSelectFirst && list.length > 0 && !activeConvId) {
          setActiveConvId(list[0].id);
        }
      }
    } catch (e) {
      showNotification('Error', 'Could not load conversations', 'error');
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadMessages = async (convId) => {
    try {
      setLoadingMessages(true);
      const res = await apiService.getChatMessages(convId);
      if (res.success) setMessages(res.data || []);
    } catch (e) {
      showNotification('Error', 'Could not load conversation', 'error');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  // ── Composer ────────────────────────────────────────────────
  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: text, created_at: new Date().toISOString() }]);
    setInput('');
    setSending(true);

    try {
      const res = await apiService.sendChatMessage(text, activeConvId);
      if (res.success) {
        const newConvId = res.data?.conversation_id;
        if (newConvId && newConvId !== activeConvId) {
          // Just created a new conversation — switch to it
          setActiveConvId(newConvId);
        }
        // Replace optimistic message with the real pair
        setMessages(prev => {
          const withoutTemp = prev.filter(m => m.id !== tempId);
          return [...withoutTemp, ...(res.data?.messages || [])];
        });
        // Refresh the sidebar (so titles, last-message, ordering update)
        loadConversations(false);
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      showNotification('Error', e.message || 'The assistant is unavailable right now.', 'error');
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // ── Sidebar actions ────────────────────────────────────────
  const newChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const startRename = (c) => {
    setRenamingId(c.id);
    setRenameDraft(c.title || '');
  };

  const commitRename = async () => {
    if (!renamingId) return;
    const newTitle = renameDraft.trim();
    if (!newTitle) { setRenamingId(null); return; }
    try {
      await apiService.renameChatConversation(renamingId, newTitle);
      setConversations(prev => prev.map(c => c.id === renamingId ? { ...c, title: newTitle } : c));
    } catch (e) {
      showNotification('Error', e.message || 'Could not rename', 'error');
    } finally {
      setRenamingId(null);
      setRenameDraft('');
    }
  };

  const deleteConv = async (c) => {
    if (!window.confirm(`Delete the chat "${c.title}"? This cannot be undone.`)) return;
    try {
      await apiService.deleteChatConversation(c.id);
      setConversations(prev => prev.filter(x => x.id !== c.id));
      if (activeConvId === c.id) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch (e) {
      showNotification('Error', e.message || 'Could not delete', 'error');
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const day = 86400000;
    if (diffMs < day && d.getDate() === now.getDate()) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (diffMs < 2 * day) return 'Yesterday';
    if (diffMs < 7 * day) return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <div className="pc-container">
      <div className="pc-hero">
        <div className="pc-hero-content">
          <h1>
            <i className="fas fa-comments"></i>
            Plant Assistant
          </h1>
          <p>Ask anything about your plants. Past conversations are saved on the left.</p>
        </div>
      </div>

      <div className="pc-layout">
        {/* ─── Conversations sidebar ─────────────────────── */}
        <aside className="pc-sidebar">
          <button className="pc-new-chat" onClick={newChat}>
            <i className="fas fa-plus"></i>
            New chat
          </button>

          <div className="pc-conv-list">
            {loadingConvs ? (
              <div className="pc-conv-empty">
                <i className="fas fa-spinner fa-spin"></i>
              </div>
            ) : conversations.length === 0 ? (
              <div className="pc-conv-empty">
                <i className="fas fa-comment-dots"></i>
                <p>No chats yet</p>
                <small>Start one below.</small>
              </div>
            ) : (
              conversations.map(c => (
                <div
                  key={c.id}
                  className={`pc-conv-item ${activeConvId === c.id ? 'active' : ''}`}
                  onClick={() => setActiveConvId(c.id)}
                >
                  <div className="pc-conv-info">
                    {renamingId === c.id ? (
                      <input
                        autoFocus
                        className="pc-conv-rename"
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename();
                          if (e.key === 'Escape') { setRenamingId(null); setRenameDraft(''); }
                        }}
                        onBlur={commitRename}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="pc-conv-title">{c.title || 'New chat'}</div>
                    )}
                    <div className="pc-conv-preview">
                      {c.last_message ? c.last_message.replace(/\s+/g, ' ').slice(0, 60) : '—'}
                    </div>
                  </div>
                  <div className="pc-conv-meta">
                    <span className="pc-conv-time">{formatRelDate(c.updated_at)}</span>
                    <div className="pc-conv-actions">
                      <button
                        className="pc-conv-act"
                        title="Rename"
                        onClick={(e) => { e.stopPropagation(); startRename(c); }}
                      >
                        <i className="fas fa-pen"></i>
                      </button>
                      <button
                        className="pc-conv-act danger"
                        title="Delete"
                        onClick={(e) => { e.stopPropagation(); deleteConv(c); }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ─── Chat panel ────────────────────────────────── */}
        <div className="pc-panel">
          {activeConv && (
            <div className="pc-panel-head">
              <i className="fas fa-comment-dots"></i>
              <strong>{activeConv.title}</strong>
            </div>
          )}

          <div className="pc-messages" ref={scrollRef}>
            {loadingMessages ? (
              <div className="pc-loading">
                <div className="pc-spinner"><i className="fas fa-leaf"></i></div>
                <p>Loading conversation…</p>
              </div>
            ) : messages.length === 0 && !sending ? (
              <div className="pc-empty">
                <div className="pc-empty-icon"><i className="fas fa-seedling"></i></div>
                <h3>
                  {activeConvId
                    ? `Hi ${user?.name?.split(' ')[0] || 'there'}!`
                    : `New chat — say hi, ${user?.name?.split(' ')[0] || 'gardener'}!`}
                </h3>
                <p>Ask about watering, light, pests, propagation, or anything else.</p>
                <div className="pc-suggestions">
                  {SUGGESTED_PROMPTS.map((s, i) => (
                    <button
                      key={i}
                      className="pc-suggestion"
                      onClick={() => send(s.text)}
                    >
                      <i className={`fas ${s.icon}`}></i>
                      <span>{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map(m => (
                  <div key={m.id} className={`pc-message pc-${m.role}`}>
                    <div className="pc-avatar">
                      <i className={`fas ${m.role === 'user' ? 'fa-user' : 'fa-seedling'}`}></i>
                    </div>
                    <div className="pc-bubble-wrap">
                      <div className="pc-bubble">
                        {m.content.split('\n').map((line, idx) => (
                          <p key={idx}>{line}</p>
                        ))}
                      </div>
                      <div className="pc-meta">{formatTime(m.created_at)}</div>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="pc-message pc-assistant">
                    <div className="pc-avatar"><i className="fas fa-seedling"></i></div>
                    <div className="pc-bubble-wrap">
                      <div className="pc-bubble pc-typing">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="pc-input-row">
            <textarea
              ref={inputRef}
              className="pc-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={activeConvId ? 'Continue the conversation…  (Shift+Enter for newline)' : 'Start a new chat about your plants…'}
              rows={1}
              disabled={sending}
            />
            <button
              className="pc-send"
              onClick={() => send()}
              disabled={!input.trim() || sending}
              title="Send"
            >
              {sending
                ? <i className="fas fa-spinner fa-spin"></i>
                : <i className="fas fa-paper-plane"></i>}
            </button>
          </div>
        </div>
      </div>

      <p className="pc-disclaimer">
        <i className="fas fa-circle-info"></i>
        Replies are generated by AI and may occasionally be inaccurate. For valuable plants, double-check with a professional.
      </p>
    </div>
  );
};

export default PlantChat;
