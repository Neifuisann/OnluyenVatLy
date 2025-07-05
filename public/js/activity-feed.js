/**
 * Activity Feed Widget - Display social proof and recent activities
 * Integrates with the OnluyenVatLy activity system
 */

class ActivityFeed {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      feedType: 'public', // 'public', 'personal', 'trending', 'leaderboard'
      limit: 10,
      autoRefresh: true,
      refreshInterval: 30000, // 30 seconds
      showTimeAgo: true,
      showIcons: true,
      compact: false,
      ...options
    };
    
    this.activities = [];
    this.isLoading = false;
    this.lastUpdated = null;
    this.refreshTimer = null;
    
    if (!this.container) {
      console.warn('Activity feed container not found:', containerId);
      return;
    }
    
    this.init();
  }
  
  async init() {
    try {
      this.renderLoading();
      await this.loadActivities();
      this.render();
      this.attachEventListeners();
      
      if (this.options.autoRefresh) {
        this.startAutoRefresh();
      }
    } catch (error) {
      console.error('Error initializing activity feed:', error);
      this.renderError();
    }
  }
  
  async loadActivities() {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      let endpoint = '/api/activity/feed';
      
      switch (this.options.feedType) {
        case 'personal':
          endpoint = '/api/activity/my-feed';
          break;
        case 'trending':
          endpoint = '/api/activity/trending';
          break;
        case 'leaderboard':
          endpoint = '/api/activity/leaderboard';
          break;
        default:
          endpoint = '/api/activity/feed';
      }
      
      const params = new URLSearchParams({
        limit: this.options.limit
      });
      
      const response = await fetch(`${endpoint}?${params}`);
      if (response.ok) {
        const data = await response.json();
        this.activities = data.data.activities || [];
        this.lastUpdated = new Date();
      } else {
        throw new Error(`Failed to load activities: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      this.activities = [];
    } finally {
      this.isLoading = false;
    }
  }
  
  render() {
    if (this.isLoading) {
      this.renderLoading();
      return;
    }
    
    if (this.activities.length === 0) {
      this.renderEmpty();
      return;
    }
    
    const feedClass = this.options.compact ? 'compact' : 'full';
    const feedTypeClass = this.options.feedType;
    
    this.container.innerHTML = `
      <div class="activity-feed ${feedClass} ${feedTypeClass}">
        ${this.renderHeader()}
        <div class="activity-list">
          ${this.activities.map(activity => this.renderActivity(activity)).join('')}
        </div>
        ${this.renderFooter()}
      </div>
    `;
  }
  
  renderHeader() {
    const titles = {
      public: '🌟 Recent Activity',
      personal: '📚 Your Activity',
      trending: '🔥 Trending Now',
      leaderboard: '🏆 Top Performers'
    };
    
    const title = titles[this.options.feedType] || 'Activity Feed';
    
    return `
      <div class="activity-header">
        <h3 class="activity-title">${title}</h3>
        <div class="activity-controls">
          ${this.lastUpdated ? `<span class="last-updated">Updated ${this.formatTimeAgo(this.lastUpdated)}</span>` : ''}
          <button class="refresh-btn" onclick="window.activityFeed?.refresh()">🔄</button>
        </div>
      </div>
    `;
  }
  
  renderActivity(activity) {
    const timeAgo = this.options.showTimeAgo ? this.formatTimeAgo(new Date(activity.created_at)) : '';
    const studentName = activity.students?.full_name || 'Student';
    const icon = this.getActivityIcon(activity.activity_type);
    
    return `
      <div class="activity-item ${activity.activity_type}" data-activity-id="${activity.id}">
        <div class="activity-content">
          <div class="activity-main">
            <div class="activity-icon">${icon}</div>
            <div class="activity-details">
              <div class="activity-title">${activity.title}</div>
              ${activity.description ? `<div class="activity-description">${activity.description}</div>` : ''}
              <div class="activity-meta">
                <span class="student-name">${studentName}</span>
                ${timeAgo ? `<span class="activity-time">${timeAgo}</span>` : ''}
              </div>
            </div>
          </div>
          ${this.renderActivityExtras(activity)}
        </div>
      </div>
    `;
  }
  
  renderActivityExtras(activity) {
    const metadata = activity.metadata || {};
    let extras = '';
    
    switch (activity.activity_type) {
      case 'achievement_earned':
        if (metadata.xpReward) {
          extras += `<div class="activity-reward">+${metadata.xpReward} XP</div>`;
        }
        break;
        
      case 'level_up':
        if (metadata.totalXP) {
          extras += `<div class="activity-reward">${metadata.totalXP.toLocaleString()} Total XP</div>`;
        }
        break;
        
      case 'lesson_completed':
        if (metadata.accuracy !== undefined) {
          const accuracyClass = metadata.accuracy >= 90 ? 'excellent' : metadata.accuracy >= 70 ? 'good' : 'average';
          extras += `<div class="activity-accuracy ${accuracyClass}">${metadata.accuracy}% accuracy</div>`;
        }
        break;
        
      case 'streak_milestone':
        if (metadata.xpReward) {
          extras += `<div class="activity-reward">+${metadata.xpReward} XP</div>`;
        }
        break;
        
      case 'quest_completed':
        if (metadata.xpReward) {
          extras += `<div class="activity-reward">+${metadata.xpReward} XP</div>`;
        }
        break;
    }
    
    return extras ? `<div class="activity-extras">${extras}</div>` : '';
  }
  
  renderFooter() {
    if (this.options.feedType === 'leaderboard') {
      return `
        <div class="activity-footer">
          <div class="leaderboard-note">🎯 Keep learning to join the leaderboard!</div>
        </div>
      `;
    }
    
    return `
      <div class="activity-footer">
        <button class="load-more-btn" onclick="window.activityFeed?.loadMore()">
          Load More Activities
        </button>
      </div>
    `;
  }
  
  renderLoading() {
    this.container.innerHTML = `
      <div class="activity-feed loading">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span>Loading activities...</span>
        </div>
      </div>
    `;
  }
  
  renderEmpty() {
    const messages = {
      public: 'No recent activity. Be the first to learn something!',
      personal: 'No activity yet. Start learning to see your progress here!',
      trending: 'No trending activities right now.',
      leaderboard: 'No top performers yet. Start learning to make the leaderboard!'
    };
    
    const message = messages[this.options.feedType] || 'No activities found.';
    
    this.container.innerHTML = `
      <div class="activity-feed empty">
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <div class="empty-message">${message}</div>
        </div>
      </div>
    `;
  }
  
  renderError() {
    this.container.innerHTML = `
      <div class="activity-feed error">
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <div class="error-message">Unable to load activities</div>
          <button class="retry-btn" onclick="window.activityFeed?.init()">Try Again</button>
        </div>
      </div>
    `;
  }
  
  getActivityIcon(activityType) {
    const icons = {
      lesson_completed: '📚',
      achievement_earned: '🏆',
      streak_milestone: '🔥',
      level_up: '⭐',
      quest_completed: '✅',
      perfect_score: '🌟',
      study_session: '📖'
    };
    
    return icons[activityType] || '📝';
  }
  
  formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
  
  attachEventListeners() {
    // Add click handlers for activity items if needed
    const activityItems = this.container.querySelectorAll('.activity-item');
    activityItems.forEach(item => {
      item.addEventListener('click', () => {
        const activityId = item.dataset.activityId;
        this.onActivityClick(activityId);
      });
    });
  }
  
  onActivityClick(activityId) {
    // Handle activity item clicks (e.g., navigate to lesson, show achievement details)
    const activity = this.activities.find(a => a.id == activityId);
    if (activity && activity.metadata) {
      switch (activity.activity_type) {
        case 'lesson_completed':
          if (activity.metadata.lessonId) {
            // Navigate to lesson page
            window.location.href = `/lesson?id=${activity.metadata.lessonId}`;
          }
          break;
        case 'achievement_earned':
          // Could show achievement details modal
          console.log('Achievement details:', activity.metadata);
          break;
      }
    }
  }
  
  async refresh() {
    await this.loadActivities();
    this.render();
    this.attachEventListeners();
  }
  
  async loadMore() {
    // Implement pagination if needed
    const currentLimit = this.options.limit;
    this.options.limit += 10;
    await this.loadActivities();
    this.render();
    this.attachEventListeners();
  }
  
  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      this.refresh();
    }, this.options.refreshInterval);
  }
  
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
  
  destroy() {
    this.stopAutoRefresh();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// CSS Styles for the activity feed
const activityFeedStyles = `
<style>
.activity-feed {
  background: var(--bg-secondary, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 1rem;
  margin: 1rem 0;
  font-family: system-ui, -apple-system, sans-serif;
}

.activity-feed.compact {
  padding: 0.75rem;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.activity-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1a202c);
}

.activity-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.last-updated {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
}

.refresh-btn {
  background: none;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  padding: 0.375rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: var(--bg-hover, #f1f5f9);
  transform: rotate(90deg);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  background: var(--bg-card, white);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;
  cursor: pointer;
}

.activity-item:hover {
  border-color: var(--accent-primary, #6366f1);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.activity-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.activity-main {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.activity-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.activity-details {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-weight: 500;
  color: var(--text-primary, #1a202c);
  margin-bottom: 0.25rem;
  line-height: 1.4;
}

.activity-description {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.student-name {
  font-weight: 500;
  color: var(--accent-primary, #6366f1);
}

.activity-time {
  color: var(--text-secondary, #64748b);
}

.activity-extras {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.activity-reward {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.activity-accuracy {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.activity-accuracy.excellent {
  background: #dcfce7;
  color: #166534;
}

.activity-accuracy.good {
  background: #ddd6fe;
  color: #7c3aed;
}

.activity-accuracy.average {
  background: #f1f5f9;
  color: #475569;
}

/* Activity type specific styling */
.activity-item.achievement_earned {
  border-left: 4px solid #f59e0b;
}

.activity-item.level_up {
  border-left: 4px solid #8b5cf6;
}

.activity-item.streak_milestone {
  border-left: 4px solid #ef4444;
}

.activity-item.lesson_completed {
  border-left: 4px solid #10b981;
}

.activity-item.quest_completed {
  border-left: 4px solid #06b6d4;
}

.activity-footer {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color, #e2e8f0);
  text-align: center;
}

.load-more-btn {
  background: var(--accent-primary, #6366f1);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover {
  background: var(--accent-hover, #5b5bd6);
  transform: translateY(-1px);
}

.leaderboard-note {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
  font-style: italic;
}

/* Loading state */
.activity-feed.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--text-secondary, #64748b);
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--border-color, #e2e8f0);
  border-top: 3px solid var(--accent-primary, #6366f1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty state */
.activity-feed.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary, #64748b);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-message {
  font-size: 1rem;
}

/* Error state */
.activity-feed.error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.error-state {
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-message {
  color: var(--text-secondary, #64748b);
  margin-bottom: 1rem;
}

.retry-btn {
  background: var(--accent-primary, #6366f1);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

/* Responsive design */
@media (max-width: 768px) {
  .activity-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .activity-controls {
    align-self: flex-end;
  }
  
  .activity-main {
    flex-direction: column;
    text-align: center;
  }
  
  .activity-extras {
    justify-content: center;
  }
  
  .activity-meta {
    justify-content: center;
  }
}
</style>
`;

// Inject styles into the page
if (!document.querySelector('#activity-feed-styles')) {
  const styleElement = document.createElement('div');
  styleElement.id = 'activity-feed-styles';
  styleElement.innerHTML = activityFeedStyles;
  document.head.appendChild(styleElement);
}

// Make ActivityFeed globally available
window.ActivityFeed = ActivityFeed;