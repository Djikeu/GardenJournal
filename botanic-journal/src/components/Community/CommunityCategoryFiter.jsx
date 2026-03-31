import React from 'react';
import '../../community.css';
const CommunityCategoryFilter = ({ categories, activeCategory, onCategorySelect }) => {
  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'All': 'fas fa-layer-group',
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
    return iconMap[categoryName] || 'fas fa-leaf';
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="categories-section">
      <div className="section-title">
        <h2>
          <i className="fas fa-tags"></i>
          Browse Categories
        </h2>
      </div>
      
      <div className="categories-grid">
        {categories.map((category) => (
          <div
            key={category.name || category}
            className={`category-card ${activeCategory === (category.name || category) ? 'active' : ''}`}
            onClick={() => onCategorySelect(category.name || category)}
            style={{ cursor: 'pointer' }}
          >
            <div className="category-icon">
              <i className={getCategoryIcon(category.name || category)}></i>
            </div>
            <div>
              <h3>{category.name || category}</h3>
              {category.description && (
                <p>{category.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityCategoryFilter;