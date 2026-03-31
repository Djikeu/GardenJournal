import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import CommunityDiscussionCard from './CommunityDiscussionCard';
import CommunityCategoryFilter from './CommunityCategoryFiter';
import NewDiscussionModal from './NewDiscussionModal';
import DiscussionDetail from './DiscussionDetail';
import '../../community.css';

const CommunityForum = ({ showNotification, user }) => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);
  const [stats, setStats] = useState({
    totalDiscussions: 0,
    activeUsers: 0,
    totalReplies: 0,
    todayDiscussions: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    category: 'All',
    sortBy: 'recent',
    search: ''
  });
  const [categories, setCategories] = useState([]);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);

  // Check URL hash for discussion ID
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/discussion\/(\d+)/);
      if (match) {
        setSelectedDiscussionId(parseInt(match[1]));
      } else {
        setSelectedDiscussionId(null);
      }
    };
    
    checkHash();
    window.addEventListener('hashchange', checkHash);
    
    return () => {
      window.removeEventListener('hashchange', checkHash);
    };
  }, []);

  useEffect(() => {
    // Only fetch discussions if no discussion is selected
    if (!selectedDiscussionId) {
      fetchCategories();
      fetchDiscussions();
      fetchCommunityStats();
    }
  }, [filters.category, filters.sortBy, pagination.page, selectedDiscussionId]);

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCommunityCategories();
      if (response.success) {
        setCategories([{ name: 'All', description: 'All categories' }, ...response.categories]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const response = await apiService.getDiscussions({
        page: pagination.page,
        limit: pagination.limit,
        category: filters.category !== 'All' ? filters.category : null,
        sort: filters.sortBy,
        search: filters.search
      });
      
      if (response.success) {
        setDiscussions(response.discussions);
        setPagination(response.pagination);
      }
    } catch (error) {
      showNotification('Error', 'Failed to load discussions', 'error');
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityStats = async () => {
    try {
      const response = await apiService.getCommunityStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDiscussions();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const refreshDiscussions = () => {
    fetchDiscussions();
    fetchCommunityStats();
  };

  const handleDiscussionCreated = () => {
    setShowNewDiscussion(false);
    refreshDiscussions();
    showNotification('Success', 'Discussion created successfully!', 'success');
  };

  const handleBackToForum = () => {
    setSelectedDiscussionId(null);
    window.location.hash = '';
  };

  // If a discussion is selected, show the detail view
  if (selectedDiscussionId) {
    return (
      <DiscussionDetail
        discussionId={selectedDiscussionId}
        user={user}
        showNotification={showNotification}
        onBack={handleBackToForum}
      />
    );
  }

  return (
    <div className="community-forum">
      {/* Header */}
      <div className="forum-header">
        <div className="header-content">
          <h1><i className="fas fa-users"></i> Garden Community</h1>
          <p>Connect with fellow gardeners, share tips, and grow together!</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowNewDiscussion(true)}
        >
          <i className="fas fa-plus"></i> New Discussion
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-comments"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalDiscussions}</h3>
            <p>Total Discussions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.activeUsers}</h3>
            <p>Active Gardeners</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-reply"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalReplies}</h3>
            <p>Total Replies</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.todayDiscussions}</h3>
            <p>Today's Discussions</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <form onSubmit={handleSearch}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search discussions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            <button type="submit" className="btn btn-outline">
              Search
            </button>
          </form>
        </div>
        
        <div className="filter-controls">
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="category-select"
          >
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
            className="sort-select"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="replies">Most Replies</option>
            <option value="views">Most Views</option>
          </select>
          
          <button 
            onClick={refreshDiscussions}
            className="btn btn-outline"
            disabled={loading}
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <CommunityCategoryFilter 
        categories={categories}
        activeCategory={filters.category}
        onCategorySelect={(category) => setFilters(prev => ({ ...prev, category }))}
      />

      {/* Discussions List */}
      <div className="discussions-list">
        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading discussions...</p>
          </div>
        ) : discussions.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-comments"></i>
            <h3>No discussions found</h3>
            <p>Be the first to start a discussion!</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowNewDiscussion(true)}
            >
              <i className="fas fa-plus"></i> Start Discussion
            </button>
          </div>
        ) : (
          <>
            {discussions.map((discussion) => (
              <CommunityDiscussionCard 
                key={discussion.id}
                discussion={discussion}
                user={user}
                onUpdate={refreshDiscussions}
              />
            ))}
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="pagination-btn"
                >
                  <i className="fas fa-chevron-left"></i> Previous
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`page-btn ${pagination.page === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="pagination-btn"
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* New Discussion Modal */}
      {showNewDiscussion && (
        <NewDiscussionModal
          user={user}
          categories={categories.filter(c => c.name !== 'All')}
          onClose={() => setShowNewDiscussion(false)}
          onSuccess={handleDiscussionCreated}
          showNotification={showNotification}
        />
      )}
    </div>
  );
};

export default CommunityForum;