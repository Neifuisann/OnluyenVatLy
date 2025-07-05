/**
 * Social Leaderboard Widget - Display top performers and rankings
 * Creates friendly competition among students
 */

class SocialLeaderboard {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      type: 'xp', // 'xp', 'streaks', 'achievements'
      period: 'weekly', // 'weekly', 'monthly', 'all_time'
      limit: 10,
      showCurrentUser: true,
      compact: false,
      ...options
    };
    
    this.leaderboardData = null;
    this.currentUserRank = null;
    
    if (!this.container) {
      console.warn('Social leaderboard container not found:', containerId);
      return;
    }
    
    this.init();
  }
  
  async init() {
    try {
      await this.loadLeaderboardData();
      this.render();
      this.attachEventListeners();
    } catch (error) {
      console.error('Error initializing social leaderboard:', error);
      this.renderError();
    }
  }
  
  async loadLeaderboardData() {
    try {
      let endpoint = '/api/xp/leaderboard';
      
      switch (this.options.type) {
        case 'streaks':
          endpoint = '/api/streaks/leaderboard';
          break;
        case 'achievements':
          endpoint = '/api/achievements/leaderboard';
          break;
        default:
          endpoint = '/api/xp/leaderboard';
      }
      
      const params = new URLSearchParams({
        period: this.options.period,
        limit: this.options.limit
      });
      
      const response = await fetch(`${endpoint}?${params}`);
      if (response.ok) {
        const data = await response.json();
        this.leaderboardData = data.data;
        this.currentUserRank = data.data.currentUserRank || null;
      } else {
        throw new Error(`Failed to load leaderboard: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
      this.leaderboardData = { rankings: [] };
    }
  }
  
  render() {
    if (!this.leaderboardData || this.leaderboardData.rankings.length === 0) {
      this.renderEmpty();
      return;
    }
    
    const leaderboardClass = this.options.compact ? 'compact' : 'full';
    const typeClass = this.options.type;
    
    this.container.innerHTML = `
      <div class="social-leaderboard ${leaderboardClass} ${typeClass}">
        ${this.renderHeader()}
        <div class="leaderboard-list">
          ${this.leaderboardData.rankings.map((entry, index) => 
            this.renderLeaderboardEntry(entry, index + 1)
          ).join('')}
        </div>
        ${this.renderCurrentUser()}
        ${this.renderFooter()}
      </div>
    `;
  }
  
  renderHeader() {
    const titles = {
      xp: '🏆 XP Leaderboard',
      streaks: '🔥 Streak Champions',
      achievements: '🎖️ Achievement Leaders'
    };
    
    const periods = {
      weekly: 'This Week',
      monthly: 'This Month',
      all_time: 'All Time'
    };
    
    const title = titles[this.options.type] || 'Leaderboard';
    const period = periods[this.options.period] || '';
    
    return `
      <div class="leaderboard-header">
        <div class="leaderboard-title">
          <h3>${title}</h3>
          ${period ? `<span class="period-label">${period}</span>` : ''}
        </div>
        <div class="leaderboard-controls">
          <select class="period-selector" onchange="window.socialLeaderboard?.changePeriod(this.value)">
            <option value="weekly" ${this.options.period === 'weekly' ? 'selected' : ''}>This Week</option>
            <option value="monthly" ${this.options.period === 'monthly' ? 'selected' : ''}>This Month</option>
            <option value="all_time" ${this.options.period === 'all_time' ? 'selected' : ''}>All Time</option>
          </select>
        </div>
      </div>
    `;
  }
  
  renderLeaderboardEntry(entry, rank) {
    const isCurrentUser = this.currentUserRank && this.currentUserRank.rank === rank;
    const medal = this.getMedalForRank(rank);
    const value = this.getDisplayValue(entry);
    const change = this.getRankChange(entry);
    
    return `
      <div class="leaderboard-entry ${isCurrentUser ? 'current-user' : ''}" data-rank="${rank}">
        <div class="entry-main">
          <div class="rank-display">
            <span class="rank-number">${medal || rank}</span>
            ${change ? `<span class="rank-change ${change.direction}">${change.text}</span>` : ''}
          </div>
          <div class="user-info">
            <div class="user-name">${entry.full_name || 'Student'}</div>
            ${entry.level ? `<div class="user-level">Level ${entry.level}</div>` : ''}
          </div>
          <div class="user-stats">
            <div class="primary-stat">${value}</div>
            ${this.renderSecondaryStats(entry)}
          </div>
        </div>
        ${isCurrentUser ? '<div class="current-user-badge">You</div>' : ''}
      </div>
    `;
  }
  
  renderSecondaryStats(entry) {
    switch (this.options.type) {
      case 'xp':
        return entry.level ? `<div class="secondary-stat">Level ${entry.level}</div>` : '';
      case 'streaks':
        return entry.longest_streak ? `<div class="secondary-stat">Best: ${entry.longest_streak}</div>` : '';
      case 'achievements':
        return entry.total_xp ? `<div class="secondary-stat">${entry.total_xp.toLocaleString()} XP</div>` : '';
      default:
        return '';
    }
  }
  
  renderCurrentUser() {
    if (!this.options.showCurrentUser || !this.currentUserRank) {
      return '';
    }
    
    const { rank, total, value } = this.currentUserRank;
    
    if (rank <= this.options.limit) {
      return ''; // Already shown in main list
    }
    
    return `
      <div class="current-user-section">
        <div class="section-divider">
          <span>Your Ranking</span>
        </div>
        <div class="leaderboard-entry current-user">
          <div class="entry-main">
            <div class="rank-display">
              <span class="rank-number">#${rank}</span>
              <span class="rank-total">of ${total}</span>
            </div>
            <div class="user-info">
              <div class="user-name">You</div>
            </div>
            <div class="user-stats">
              <div class="primary-stat">${this.formatValue(value)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  renderFooter() {
    const encouragement = this.getEncouragementMessage();
    
    return `
      <div class="leaderboard-footer">
        <div class="encouragement-message">${encouragement}</div>
        <button class="refresh-btn" onclick="window.socialLeaderboard?.refresh()">
          🔄 Refresh Rankings
        </button>
      </div>
    `;
  }
  
  renderEmpty() {
    this.container.innerHTML = `
      <div class="social-leaderboard empty">
        <div class="empty-state">
          <div class="empty-icon">🏆</div>
          <div class="empty-title">No Rankings Yet</div>
          <div class="empty-message">Start learning to join the leaderboard!</div>
        </div>
      </div>
    `;
  }
  
  renderError() {
    this.container.innerHTML = `
      <div class="social-leaderboard error">
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <div class="error-message">Unable to load leaderboard</div>
          <button class="retry-btn" onclick="window.socialLeaderboard?.init()">Try Again</button>
        </div>
      </div>
    `;
  }
  
  getMedalForRank(rank) {
    const medals = {
      1: '🥇',
      2: '🥈',
      3: '🥉'
    };
    return medals[rank];
  }
  
  getDisplayValue(entry) {
    switch (this.options.type) {
      case 'xp':
        return this.formatValue(entry.total_xp || 0);
      case 'streaks':
        return `${entry.current_streak || 0} days`;
      case 'achievements':
        return `${entry.achievement_count || 0} badges`;
      default:
        return '0';
    }
  }
  
  getRankChange(entry) {
    if (!entry.rank_change) return null;
    
    const change = entry.rank_change;
    if (change > 0) {
      return { direction: 'up', text: `↑${change}` };
    } else if (change < 0) {
      return { direction: 'down', text: `↓${Math.abs(change)}` };
    }
    return null;
  }
  
  getEncouragementMessage() {
    const messages = {
      xp: {
        weekly: "🎯 Keep learning to climb the weekly rankings!",
        monthly: "📈 Great progress this month - keep it up!",
        all_time: "🌟 Every lesson brings you closer to the top!"
      },
      streaks: {
        weekly: "🔥 Consistency is key - maintain your streak!",
        monthly: "💪 Strong dedication this month!",
        all_time: "⚡ Build the longest streak in physics!"
      },
      achievements: {
        weekly: "🏆 Earn more achievements this week!",
        monthly: "🎖️ Amazing achievement progress this month!",
        all_time: "👑 Collect all the physics achievements!"
      }
    };
    
    const typeMessages = messages[this.options.type] || messages.xp;
    return typeMessages[this.options.period] || typeMessages.weekly;
  }
  
  formatValue(value) {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toLocaleString();
  }
  
  attachEventListeners() {
    // Add any additional event listeners here
  }
  
  async changePeriod(newPeriod) {
    this.options.period = newPeriod;
    await this.refresh();
  }
  
  async refresh() {
    await this.loadLeaderboardData();
    this.render();
    this.attachEventListeners();
  }
}

// CSS Styles for the social leaderboard
const socialLeaderboardStyles = `
<style>
.social-leaderboard {
  background: var(--bg-secondary, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
  font-family: system-ui, -apple-system, sans-serif;
}

.social-leaderboard.compact {
  padding: 1rem;
}

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.leaderboard-title h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #1a202c);
}

.period-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
  font-weight: normal;
}

.period-selector {
  background: var(--bg-card, white);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.leaderboard-entry {
  background: var(--bg-card, white);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  padding: 1rem;
  position: relative;
  transition: all 0.2s;
}

.leaderboard-entry:hover {
  border-color: var(--accent-primary, #6366f1);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.leaderboard-entry.current-user {
  border-color: var(--accent-primary, #6366f1);
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
}

.entry-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rank-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 3rem;
}

.rank-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-primary, #6366f1);
}

.rank-change {
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.25rem;
}

.rank-change.up {
  color: #16a34a;
}

.rank-change.down {
  color: #dc2626;
}

.rank-total {
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
  margin-top: 0.25rem;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  color: var(--text-primary, #1a202c);
  margin-bottom: 0.25rem;
}

.user-level {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
}

.user-stats {
  text-align: right;
}

.primary-stat {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--accent-primary, #6366f1);
  margin-bottom: 0.25rem;
}

.secondary-stat {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
}

.current-user-badge {
  position: absolute;
  top: -0.5rem;
  right: 1rem;
  background: var(--accent-primary, #6366f1);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.current-user-section {
  margin-top: 1.5rem;
}

.section-divider {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
}

.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color, #e2e8f0);
}

.section-divider span {
  padding: 0 1rem;
  background: var(--bg-secondary, #f8fafc);
}

.leaderboard-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, #e2e8f0);
  text-align: center;
}

.encouragement-message {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
  margin-bottom: 1rem;
  font-style: italic;
}

.refresh-btn {
  background: var(--accent-primary, #6366f1);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: var(--accent-hover, #5b5bd6);
  transform: translateY(-1px);
}

/* Special styling for top 3 */
.leaderboard-entry[data-rank="1"] {
  background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
  border-color: #f59e0b;
}

.leaderboard-entry[data-rank="2"] {
  background: linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%);
  border-color: #9ca3af;
}

.leaderboard-entry[data-rank="3"] {
  background: linear-gradient(135deg, #fed7aa 0%, #fb923c 100%);
  border-color: #ea580c;
}

/* Empty and error states */
.social-leaderboard.empty,
.social-leaderboard.error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.empty-state,
.error-state {
  text-align: center;
}

.empty-icon,
.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1a202c);
  margin-bottom: 0.5rem;
}

.empty-message,
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
  .leaderboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .entry-main {
    gap: 0.75rem;
  }
  
  .rank-display {
    min-width: 2.5rem;
  }
  
  .rank-number {
    font-size: 1.25rem;
  }
  
  .primary-stat {
    font-size: 1rem;
  }
}
</style>
`;

// Inject styles into the page
if (!document.querySelector('#social-leaderboard-styles')) {
  const styleElement = document.createElement('div');
  styleElement.id = 'social-leaderboard-styles';
  styleElement.innerHTML = socialLeaderboardStyles;
  document.head.appendChild(styleElement);
}

// Make SocialLeaderboard globally available
window.SocialLeaderboard = SocialLeaderboard;