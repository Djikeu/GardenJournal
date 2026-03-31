import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { apiService } from '../../services/api';
import '../../community.css';

const CommunityDiscussionCard = ({ discussion, user, onUpdate }) => {
  const [isLiked, setIsLiked] = useState(discussion.user_has_liked || false);
  const [likesCount, setLikesCount] = useState(discussion.likes || 0);
  const [liking, setLiking] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation(); // Prevent card click when clicking like button
    if (liking) return;
    setLiking(true);
    
    try {
      if (isLiked) {
        // UNLIKE - remove the like
        console.log('Removing like for discussion:', discussion.id);
        const response = await apiService.unlikeDiscussion(discussion.id);
        if (response.success) {
          setIsLiked(false);
          setLikesCount(prev => prev - 1);
          console.log('Like removed successfully');
        } else {
          console.log('Unlike failed:', response.message);
        }
      } else {
        // LIKE - add a like
        console.log('Adding like for discussion:', discussion.id);
        const response = await apiService.likeDiscussion(discussion.id);
        if (response.success) {
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
          console.log('Like added successfully');
        } else {
          console.log('Like failed:', response.message);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLiking(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'General': 'fas fa-leaf',
      'Plant Care': 'fas fa-heart',
      'Troubleshooting': 'fas fa-bug',
      'Plant Identification': 'fas fa-search',
      'Propagation': 'fas fa-seedling',
      'Garden Design': 'fas fa-palette',
      'Seasonal Tips': 'fas fa-calendar-alt',
      'Tools & Equipment': 'fas fa-tools',
      'Success Stories': 'fas fa-trophy',
      'Beginner Questions': 'fas fa-question-circle'
    };
    return icons[category] || 'fas fa-leaf';
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const handleViewDiscussion = () => {
    window.location.hash = `discussion/${discussion.id}`;
  };

  return (
    <div 
      className={`discussion-card ${discussion.is_pinned ? 'pinned' : ''}`}
      onClick={handleViewDiscussion}
      style={{ cursor: 'pointer' }}
    >
      {discussion.is_pinned && (
        <div className="pinned-badge">
          <i className="fas fa-thumbtack"></i> Pinned
        </div>
      )}
      
      <div className="discussion-content">
        <div className="category-tag">
          <i className={getCategoryIcon(discussion.category)}></i>
          <span>{discussion.category}</span>
        </div>
        
        <h3 className="discussion-title">
          {discussion.title}
        </h3>
        
        <p className="discussion-excerpt">
          {discussion.content.substring(0, 150)}...
        </p>
        
        <div className="discussion-meta">
          <div className="author-info">
            <img 
              src={discussion.author_avatar || `https://i.pravatar.cc/150?u=${discussion.user_id}`} 
              alt={discussion.author_name}
              className="author-avatar"
            />
            <div>
              <span className="author-name">{discussion.author_name}</span>
              <span className="post-time">
                {formatDate(discussion.created_at)}
              </span>
            </div>
          </div>
          
          <div className="discussion-stats">
            <span className="stat-item">
              <i className="fas fa-eye"></i>
              {discussion.views || 0}
            </span>
            <span className="stat-item">
              <i className="fas fa-comment"></i>
              {discussion.reply_count || 0}
            </span>
            <button 
              className={`stat-item like-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={liking}
            >
              <i className="fas fa-heart"></i>
              {likesCount}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDiscussionCard;