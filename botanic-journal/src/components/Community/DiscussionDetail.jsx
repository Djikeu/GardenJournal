import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import '../../community.css';

const DiscussionDetail = ({ showNotification, user, discussionId, onBack }) => {
  const [discussion, setDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [likingDiscussion, setLikingDiscussion] = useState(false);
  const [likingReplies, setLikingReplies] = useState({});

  useEffect(() => {
    if (discussionId) {
      fetchDiscussion();
      fetchReplies();
    }
  }, [discussionId]);

  const fetchDiscussion = async () => {
    try {
      const response = await apiService.getDiscussion(discussionId);
      if (response.success) {
        setDiscussion(response.discussion);
      }
    } catch (error) {
      showNotification('Error', 'Failed to load discussion', 'error');
      console.error('Error fetching discussion:', error);
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await apiService.getReplies(discussionId);
      if (response.success) {
        setReplies(response.replies);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      showNotification('Error', 'Please enter a reply', 'error');
      return;
    }

    setSubmittingReply(true);
    
    try {
      const response = await apiService.createReply({
        discussion_id: parseInt(discussionId),
        content: replyContent.trim()
      });
      
      if (response.success) {
        setReplies([...replies, response.reply]);
        setReplyContent('');
        fetchDiscussion();
        showNotification('Success', 'Reply posted successfully!', 'success');
      }
    } catch (error) {
      showNotification('Error', 'Failed to post reply', 'error');
      console.error('Error posting reply:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleLikeDiscussion = async () => {
    if (likingDiscussion) return;
    setLikingDiscussion(true);
    
    try {
      if (discussion.user_has_liked) {
        await apiService.unlikeDiscussion(discussionId);
        setDiscussion({
          ...discussion,
          likes: (discussion.likes || 0) - 1,
          user_has_liked: false
        });
      } else {
        await apiService.likeDiscussion(discussionId);
        setDiscussion({
          ...discussion,
          likes: (discussion.likes || 0) + 1,
          user_has_liked: true
        });
      }
    } catch (error) {
      console.error('Error liking discussion:', error);
      showNotification('Error', 'Failed to like discussion', 'error');
    } finally {
      setLikingDiscussion(false);
    }
  };

  const handleLikeReply = async (replyId, currentLikes, userHasLiked) => {
    if (likingReplies[replyId]) return;
    
    setLikingReplies(prev => ({ ...prev, [replyId]: true }));
    
    try {
      if (userHasLiked) {
        await apiService.unlikeReply(replyId);
        setReplies(replies.map(reply => 
          reply.id === replyId 
            ? { ...reply, likes: (reply.likes || 0) - 1, user_has_liked: false }
            : reply
        ));
      } else {
        await apiService.likeReply(replyId);
        setReplies(replies.map(reply => 
          reply.id === replyId 
            ? { ...reply, likes: (reply.likes || 0) + 1, user_has_liked: true }
            : reply
        ));
      }
    } catch (error) {
      console.error('Error liking reply:', error);
      showNotification('Error', 'Failed to like reply', 'error');
    } finally {
      setLikingReplies(prev => ({ ...prev, [replyId]: false }));
    }
  };

  if (loading && !discussion) {
    return (
      <div className="loading-container">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading discussion...</p>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="error-container">
        <i className="fas fa-exclamation-triangle"></i>
        <h3>Discussion not found</h3>
        <p>The discussion you're looking for doesn't exist or has been removed.</p>
        <button onClick={onBack} className="btn btn-primary">
          Back to Community
        </button>
      </div>
    );
  }

  return (
    <div className="discussion-detail">
      <div className="back-nav">
        <button onClick={onBack} className="btn btn-outline">
          <i className="fas fa-arrow-left"></i> Back to Community
        </button>
      </div>

      <div className="discussion-main">
        <div className="discussion-header">
          <div className="category-badge">
            <i className="fas fa-tag"></i>
            {discussion.category}
          </div>
          {discussion.is_pinned && (
            <div className="pinned-badge">
              <i className="fas fa-thumbtack"></i> Pinned
            </div>
          )}
        </div>

        <h1 className="discussion-title">{discussion.title}</h1>

        <div className="discussion-meta">
          <div className="author-info">
            <img 
              src={discussion.author_avatar || `https://i.pravatar.cc/150?u=${discussion.user_id}`} 
              alt={discussion.author_name}
              className="author-avatar-large"
            />
            <div>
              <span className="author-name">{discussion.author_name}</span>
              <span className="post-time">
                {format(new Date(discussion.created_at), 'MMM d, yyyy • h:mm a')}
              </span>
            </div>
          </div>

          <div className="discussion-stats">
            <span className="stat">
              <i className="fas fa-eye"></i> {discussion.views || 0} views
            </span>
            <span className="stat">
              <i className="fas fa-comment"></i> {discussion.reply_count || 0} replies
            </span>
            <button 
              className={`stat like-btn ${discussion.user_has_liked ? 'liked' : ''}`}
              onClick={handleLikeDiscussion}
              disabled={likingDiscussion}
            >
              <i className="fas fa-heart"></i> {discussion.likes || 0} likes
            </button>
          </div>
        </div>

        <div className="discussion-content">
          <div className="content-body">
            {discussion.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="replies-section">
        <h2 className="replies-title">
          <i className="fas fa-comments"></i> 
          Replies ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <div className="no-replies">
            <i className="fas fa-comment-slash"></i>
            <h3>No replies yet</h3>
            <p>Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="replies-list">
            {replies.map((reply) => (
              <div key={reply.id} className="reply-item">
                <div className="reply-author">
                  <img 
                    src={reply.author_avatar || `https://i.pravatar.cc/150?u=${reply.user_id}`}
                    alt={reply.author_name}
                    className="reply-avatar"
                  />
                  <div className="author-details">
                    <span className="author-name">{reply.author_name}</span>
                    <span className="reply-time">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                <div className="reply-content">
                  <p>{reply.content}</p>
                </div>
                
                <div className="reply-actions">
                  <button 
                    onClick={() => handleLikeReply(reply.id, reply.likes, reply.user_has_liked)}
                    className={`like-btn ${reply.user_has_liked ? 'liked' : ''}`}
                    disabled={likingReplies[reply.id]}
                  >
                    <i className="fas fa-heart"></i> {reply.likes || 0}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="reply-form-section">
        <h3>Post a Reply</h3>
        <div className="reply-form">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Share your thoughts, advice, or experience..."
            rows={4}
            disabled={submittingReply}
          />
          <div className="form-actions">
            <small className="format-tips">
              <i className="fas fa-info-circle"></i> Be respectful and helpful
            </small>
            <button
              onClick={handleSubmitReply}
              disabled={submittingReply || !replyContent.trim()}
              className="btn btn-primary"
            >
              {submittingReply ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Posting...
                </>
              ) : 'Post Reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetail;