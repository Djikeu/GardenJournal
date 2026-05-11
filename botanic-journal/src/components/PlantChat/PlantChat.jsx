import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import '../../plantChat.css';

const SUGGESTED_PROMPTS = [
  { icon: 'fa-tint',         text: 'How often should I water my plants?' },
  { icon: 'fa-sun',          text: 'Which of my plants needs the most light?' },
  { icon: 'fa-bug',          text: 'How do I treat spider mites organically?' },
  { icon: 'fa-leaf',         text: 'What does yellowing on lower leaves mean?' },
  { icon: 'fa-seedling',     text: "What's a good beginner plant for me?" },
  { icon: 'fa-temperature-half', text: 'Are my plants safe in winter?' },
];

const PlantChat = ({ showNotification, user }) => {
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [sending, setSending]       = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef                   = useRef(null);
  const inputRef                    = useRef(null);

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { scrollToBottom(); }, [messages, sending]);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await apiService.getChatHistory();
      if (res.success) setMessages(res.data || []);
    } catch (e) {
      showNotification('Error', 'Could not load chat history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;

    // Optimistic user message
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: text, created_at: new Date().toISOString() }]);
    setInput('');
    setSending(true);

    try {
      const res = await apiService.sendChatMessage(text);
      if (res.success && res.data?.messages) {
        // Replace optimistic with real (latest 2 messages from server)
        setMessages(prev => {
          const withoutTemp = prev.filter(m => m.id !== tempId);
          return [...withoutTemp, ...res.data.messages];
        });
      }
    } catch (e) {
      // Roll back optimistic message
      setMessages(prev => prev.filter(m => m.id !== tempId));
      showNotification('Error', e.message || 'The assistant is unavailable right now.', 'error');
    } finally {
      setSending(false);
      // Re-focus input so user can keep typing
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Clear your entire chat history?')) return;
    try {
      const res = await apiService.clearChatHistory();
      if (res.success) {
        setMessages([]);
        showNotification('Done', 'Chat history cleared.', 'success');
      }
    } catch (e) {
      showNotification('Error', e.message || 'Could not clear history.', 'error');
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="pc-container">
      {/* Hero */}
      <div className="pc-hero">
        <div className="pc-hero-content">
          <h1>
            <i className="fas fa-comments"></i>
            Plant Assistant
          </h1>
          <p>Ask anything about your plants — care tips, problem-solving, what to grow next. The assistant knows your collection.</p>
        </div>
        {messages.length > 0 && (
          <button className="pc-clear-btn" onClick={clearHistory} title="Clear history">
            <i className="fas fa-eraser"></i>
            <span>Clear chat</span>
          </button>
        )}
      </div>

      {/* Chat panel */}
      <div className="pc-panel">
        <div className="pc-messages" ref={scrollRef}>
          {loadingHistory ? (
            <div className="pc-loading">
              <div className="pc-spinner"><i className="fas fa-leaf"></i></div>
              <p>Loading your conversation…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="pc-empty">
              <div className="pc-empty-icon"><i className="fas fa-seedling"></i></div>
              <h3>Hi {user?.name?.split(' ')[0] || 'there'}! What can I help you with?</h3>
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

        {/* Input */}
        <div className="pc-input-row">
          <textarea
            ref={inputRef}
            className="pc-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about your plants…  (Shift+Enter for newline)"
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

      <p className="pc-disclaimer">
        <i className="fas fa-circle-info"></i>
        Replies are generated by AI and may occasionally be inaccurate. For valuable plants, double-check with a professional.
      </p>
    </div>
  );
};

export default PlantChat;
