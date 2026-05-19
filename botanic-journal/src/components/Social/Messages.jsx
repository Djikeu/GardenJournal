import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../../services/api';
import { getAvatarUrl } from '../../utils/avatar';
import '../../social.css';

const EMOJI_CATEGORIES = {
    'Smileys':   ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔'],
    'Plants':    ['🌱','🌿','☘️','🍀','🎍','🪴','🌳','🌲','🌴','🌵','🌾','🌷','🌹','🥀','🌺','🌻','🌼','🌸','💐','🍃','🍂','🍁','🌰','🥬','🥒','🌽','🥕','🫛','🍄','🌶️'],
    'Weather':   ['☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄','🌬️','💨','🌪️','🌫️','🌈','☔','💧','🌊','🌞','🌝','🌚','🌙','⭐','✨','💫','☄️','🔥'],
    'Hearts':    ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','💌','💋','😻','💑','💏','💐','🌹','💍','💎','💌'],
    'Hands':     ['👍','👎','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👋','🤚','🖐️','✋','🖖','👏','🙌','👐','🤲','🤝','🙏','✍️','💅'],
    'Food':      ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫛','🧄','🧅','🥔'],
    'Activity':  ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🎱','🪀','🏓','🏸','🥊','🥋','🥅','⛳','⛸️','🎣','🤿','🎽','🛷','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','🤺'],
};

const Messages = ({ showNotification, initialUserId, user }) => {
    const [conversations, setConversations] = useState([]);
    const [activeUserId, setActiveUserId]   = useState(initialUserId || null);
    const [activeOther, setActiveOther]     = useState(null);
    const [messages, setMessages]           = useState([]);
    const [input, setInput]                 = useState('');
    const [loadingList, setLoadingList]     = useState(true);
    const [loadingConv, setLoadingConv]     = useState(false);
    const [sending, setSending]             = useState(false);
    const [showEmoji, setShowEmoji]         = useState(false);
    const [emojiCat, setEmojiCat]           = useState('Smileys');
    const [uploading, setUploading]         = useState(false);
    const [pendingAttachment, setPendingAttachment] = useState(null);
    const [editingId, setEditingId]         = useState(null);
    const [editingText, setEditingText]     = useState('');
    const [menuFor, setMenuFor]             = useState(null);

    const scrollRef     = useRef(null);
    const pollRef       = useRef(null);
    const fileInputRef  = useRef(null);
    const textareaRef   = useRef(null);
    const emojiPickerRef= useRef(null);
    const menuRef       = useRef(null);

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
                loadList();
            }
        } catch (e) {
            showNotification?.('Error', e.message || 'Could not load conversation', 'error');
        } finally {
            setLoadingConv(false);
        }
    }, [loadList, showNotification]);

    useEffect(() => { loadList(); }, [loadList]);
    useEffect(() => { loadConversation(activeUserId); }, [activeUserId, loadConversation]);

    useEffect(() => {
        if (initialUserId && !activeUserId) setActiveUserId(initialUserId);
    }, [initialUserId, activeUserId]);

    useEffect(() => {
        if (!activeUserId) return;
        pollRef.current = setInterval(() => loadConversation(activeUserId), 8000);
        return () => clearInterval(pollRef.current);
    }, [activeUserId, loadConversation]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, sending]);

    // Close emoji picker / context menu on outside click
    useEffect(() => {
        const onDoc = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target) &&
                !e.target.closest('.chat-emoji-btn')) {
                setShowEmoji(false);
            }
            if (menuRef.current && !menuRef.current.contains(e.target) &&
                !e.target.closest('.dm-menu-trigger')) {
                setMenuFor(null);
            }
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const insertEmoji = (emoji) => {
        const el = textareaRef.current;
        if (el) {
            const start = el.selectionStart;
            const end   = el.selectionEnd;
            const newVal = input.substring(0, start) + emoji + input.substring(end);
            setInput(newVal);
            // Restore cursor right after the emoji
            setTimeout(() => {
                el.focus();
                el.selectionStart = el.selectionEnd = start + emoji.length;
            }, 0);
        } else {
            setInput(prev => prev + emoji);
        }
    };

    const onPickFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // reset so picking same file again works
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            showNotification?.('Too large', 'Max 10 MB per file.', 'error');
            return;
        }
        try {
            setUploading(true);
            const res = await apiService.uploadMessageAttachment(file);
            setPendingAttachment({
                path:     res.data.path,
                type:     res.data.type,
                mime:     res.data.mime,
                original: res.data.original,
                size:     res.data.size,
            });
        } catch (err) {
            showNotification?.('Upload failed', err.message || 'Try again', 'error');
        } finally {
            setUploading(false);
        }
    };

    const send = async () => {
        const text = input.trim();
        if ((!text && !pendingAttachment) || !activeUserId || sending) return;
        setSending(true);

        const tempId = `temp-${Date.now()}`;
        const optimistic = {
            id: tempId,
            sender_id: user?.id,
            recipient_id: activeUserId,
            content: text || (pendingAttachment ? '' : ''),
            attachment_path: pendingAttachment?.path || null,
            attachment_type: pendingAttachment?.type || null,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);
        setInput('');
        const attached = pendingAttachment;
        setPendingAttachment(null);

        try {
            const res = await apiService.sendDirectMessage(activeUserId, text, attached);
            if (res.success && res.data) {
                setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
                loadList();
            }
        } catch (e) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            showNotification?.('Error', e.message || 'Could not send message', 'error');
        } finally {
            setSending(false);
        }
    };

    const startEdit = (msg) => {
        setEditingId(msg.id);
        setEditingText(msg.content);
        setMenuFor(null);
    };
    const cancelEdit = () => { setEditingId(null); setEditingText(''); };
    const saveEdit = async () => {
        const text = editingText.trim();
        if (!text || !editingId) return;
        try {
            const res = await apiService.editDirectMessage(editingId, text);
            if (res.success && res.data) {
                setMessages(prev => prev.map(m => m.id === editingId ? res.data : m));
                cancelEdit();
            }
        } catch (e) {
            showNotification?.('Edit failed', e.message || 'Try again', 'error');
        }
    };

    const doDelete = async (msg) => {
        setMenuFor(null);
        if (!window.confirm('Delete this message?')) return;
        try {
            const res = await apiService.deleteDirectMessage(msg.id);
            if (res.success) {
                setMessages(prev => prev.map(m => m.id === msg.id
                    ? { ...m, deleted_at: new Date().toISOString(), content: '[deleted]', attachment_path: null }
                    : m
                ));
                loadList();
            }
        } catch (e) {
            showNotification?.('Delete failed', e.message || 'Try again', 'error');
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const onEditKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
        if (e.key === 'Escape') cancelEdit();
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
    const isImage = (m) => m.attachment_type === 'image';
    const attachmentUrl = (path) => path ? `http://localhost/botanic-journal/botanic-journal${path}` : null;

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
                                    messages.map(m => {
                                        const mine = isMine(m);
                                        const isDeleted = !!m.deleted_at;
                                        const isEditing = editingId === m.id;
                                        return (
                                            <div key={m.id} className={`dm-row ${mine ? 'dm-mine' : 'dm-theirs'}`}>
                                                <div className={`dm-bubble ${isDeleted ? 'dm-deleted' : ''}`}>
                                                    {isEditing ? (
                                                        <div className="dm-edit">
                                                            <textarea
                                                                rows={2}
                                                                value={editingText}
                                                                onChange={(e) => setEditingText(e.target.value)}
                                                                onKeyDown={onEditKeyDown}
                                                                autoFocus
                                                            />
                                                            <div className="dm-edit-actions">
                                                                <button onClick={cancelEdit} className="dm-edit-cancel">Cancel</button>
                                                                <button onClick={saveEdit} className="dm-edit-save">Save</button>
                                                            </div>
                                                        </div>
                                                    ) : isDeleted ? (
                                                        <em>This message was deleted</em>
                                                    ) : (
                                                        <>
                                                            {m.attachment_path && isImage(m) && (
                                                                <a href={attachmentUrl(m.attachment_path)} target="_blank" rel="noopener noreferrer">
                                                                    <img
                                                                        src={attachmentUrl(m.attachment_path)}
                                                                        alt="attachment"
                                                                        className="dm-attachment-img"
                                                                    />
                                                                </a>
                                                            )}
                                                            {m.attachment_path && !isImage(m) && (
                                                                <a href={attachmentUrl(m.attachment_path)}
                                                                   target="_blank" rel="noopener noreferrer"
                                                                   className="dm-attachment-file">
                                                                    <i className="fas fa-file"></i>
                                                                    <span>Attachment</span>
                                                                </a>
                                                            )}
                                                            {m.content && <div className="dm-text">{m.content}</div>}
                                                            {m.edited_at && <span className="dm-edited">(edited)</span>}
                                                        </>
                                                    )}

                                                    {mine && !isEditing && !isDeleted && (
                                                        <button
                                                            className="dm-menu-trigger"
                                                            onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === m.id ? null : m.id); }}
                                                            title="Message actions"
                                                        >
                                                            <i className="fas fa-ellipsis-h"></i>
                                                        </button>
                                                    )}
                                                    {menuFor === m.id && (
                                                        <div className="dm-menu" ref={menuRef}>
                                                            <button onClick={() => startEdit(m)}>
                                                                <i className="fas fa-pen"></i> Edit
                                                            </button>
                                                            <button onClick={() => doDelete(m)} className="dm-menu-danger">
                                                                <i className="fas fa-trash"></i> Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="dm-time">{formatTime(m.created_at)}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Pending attachment preview */}
                            {pendingAttachment && (
                                <div className="chat-pending-row">
                                    {pendingAttachment.type === 'image' ? (
                                        <img src={attachmentUrl(pendingAttachment.path)} alt={pendingAttachment.original} />
                                    ) : (
                                        <div className="chat-pending-file">
                                            <i className="fas fa-file"></i>
                                            <span>{pendingAttachment.original}</span>
                                        </div>
                                    )}
                                    <button
                                        className="chat-pending-remove"
                                        onClick={() => setPendingAttachment(null)}
                                        title="Remove attachment"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            )}

                            <div className="chat-input-row">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*,application/pdf"
                                    onChange={onPickFile}
                                />
                                <button
                                    className="chat-attach-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading || sending}
                                    title="Attach a file"
                                >
                                    {uploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paperclip"></i>}
                                </button>

                                <button
                                    className="chat-emoji-btn"
                                    onClick={() => setShowEmoji(v => !v)}
                                    title="Insert emoji"
                                >
                                    <i className="far fa-smile"></i>
                                </button>

                                <textarea
                                    ref={textareaRef}
                                    rows={1}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={onKeyDown}
                                    placeholder="Write a message…  (Shift+Enter for newline)"
                                    disabled={sending}
                                />

                                <button onClick={send} disabled={(!input.trim() && !pendingAttachment) || sending} title="Send">
                                    {sending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                                </button>

                                {showEmoji && (
                                    <div className="emoji-picker" ref={emojiPickerRef}>
                                        <div className="emoji-tabs">
                                            {Object.keys(EMOJI_CATEGORIES).map(cat => (
                                                <button
                                                    key={cat}
                                                    className={`emoji-tab ${emojiCat === cat ? 'on' : ''}`}
                                                    onClick={() => setEmojiCat(cat)}
                                                >{cat}</button>
                                            ))}
                                        </div>
                                        <div className="emoji-grid">
                                            {EMOJI_CATEGORIES[emojiCat].map((e, i) => (
                                                <button key={i} className="emoji-btn" onClick={() => insertEmoji(e)}>{e}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
