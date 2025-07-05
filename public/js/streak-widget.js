/**
 * Streak Widget - Display and manage daily learning streaks
 * Integrates with the OnluyenVatLy streak system
 */

class StreakWidget {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      compact: false,
      showLeaderboard: true,
      showHistory: false,
      showMilestones: true,
      ...options
    };
    
    this.streakData = null;
    this.milestones = [];
    
    if (!this.container) {
      console.warn('Streak widget container not found:', containerId);
      return;
    }
    
    this.init();
  }
  
  async init() {
    try {
      await this.loadStreakData();
      await this.loadMilestones();
      this.render();
      this.attachEventListeners();
      
      // Auto-refresh every 5 minutes
      setInterval(() => {
        this.loadStreakData();
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error('Error initializing streak widget:', error);
      this.renderError();
    }
  }
  
  async loadStreakData() {
    try {
      const response = await fetch('/api/streaks/stats');
      if (response.ok) {
        const data = await response.json();
        this.streakData = data.data;
      } else {
        // Handle unauthenticated users gracefully
        this.streakData = {
          currentStreak: 0,
          longestStreak: 0,
          streakFreezesAvailable: 3,
          streakStatus: 'inactive',
          lastActivityDate: null
        };
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
      this.streakData = null;
    }
  }
  
  async loadMilestones() {
    try {
      const response = await fetch('/api/streaks/milestones');
      if (response.ok) {
        const data = await response.json();
        this.milestones = data.data.milestones;
      }
    } catch (error) {
      console.error('Error loading milestones:', error);
      this.milestones = [];
    }
  }
  
  render() {
    if (!this.streakData) {
      this.renderError();
      return;
    }
    
    if (this.options.compact) {
      this.renderCompact();
    } else {
      this.renderFull();
    }
  }
  
  renderCompact() {
    const { currentStreak, streakStatus, streakFreezesAvailable } = this.streakData;
    const statusClass = this.getStatusClass(streakStatus);
    
    this.container.innerHTML = `
      <div class="streak-widget compact ${statusClass}">
        <div class="streak-display">
          <div class="streak-flame">🔥</div>
          <div class="streak-counter">
            <span class="streak-number">${currentStreak}</span>
            <span class="streak-label">Day Streak</span>
          </div>
          <div class="streak-freezes">
            ${Array.from({length: streakFreezesAvailable}, () => '🛡️').join('')}
          </div>
        </div>
        ${this.renderStatusMessage()}
      </div>
    `;
  }
  
  renderFull() {
    const { 
      currentStreak, 
      longestStreak, 
      streakStatus, 
      streakFreezesAvailable,
      lastActivityDate,
      canUseFreeze 
    } = this.streakData;
    
    const statusClass = this.getStatusClass(streakStatus);
    const nextMilestone = this.getNextMilestone();
    
    this.container.innerHTML = `
      <div class="streak-widget full ${statusClass}">
        <div class="streak-header">
          <h3 class="streak-title">
            <span class="streak-icon">🔥</span>
            Learning Streak
          </h3>
          ${this.renderStatusBadge()}
        </div>
        
        <div class="streak-stats">
          <div class="streak-stat">
            <div class="stat-value">${currentStreak}</div>
            <div class="stat-label">Current Streak</div>
          </div>
          <div class="streak-stat">
            <div class="stat-value">${longestStreak}</div>
            <div class="stat-label">Best Streak</div>
          </div>
          <div class="streak-stat">
            <div class="stat-value">${streakFreezesAvailable}</div>
            <div class="stat-label">Freezes Left</div>
          </div>
        </div>
        
        ${this.renderProgressBar(nextMilestone)}
        ${this.renderStatusMessage()}
        ${this.renderActions()}
        
        ${this.options.showMilestones ? this.renderMilestones() : ''}
      </div>
    `;
  }
  
  renderError() {
    this.container.innerHTML = `
      <div class="streak-widget error">
        <div class="error-message">
          <span class="error-icon">⚠️</span>
          <span>Unable to load streak data</span>
          <button class="retry-btn" onclick="window.streakWidget?.init()">Retry</button>
        </div>
      </div>
    `;
  }
  
  renderStatusBadge() {
    const { streakStatus } = this.streakData;
    const badges = {
      active_today: { text: 'Active Today', class: 'success', icon: '✅' },
      active: { text: 'Active', class: 'success', icon: '🔥' },
      at_risk: { text: 'At Risk', class: 'warning', icon: '⚠️' },
      broken: { text: 'Broken', class: 'danger', icon: '💔' },
      inactive: { text: 'Inactive', class: 'neutral', icon: '😴' }
    };
    
    const badge = badges[streakStatus] || badges.inactive;
    
    return `
      <div class="streak-status-badge ${badge.class}">
        <span class="badge-icon">${badge.icon}</span>
        <span class="badge-text">${badge.text}</span>
      </div>
    `;
  }
  
  renderProgressBar(nextMilestone) {
    if (!nextMilestone) return '';
    
    const { currentStreak } = this.streakData;
    const progress = Math.min((currentStreak / nextMilestone.days) * 100, 100);
    
    return `
      <div class="streak-progress">
        <div class="progress-header">
          <span class="progress-label">Next: ${nextMilestone.title}</span>
          <span class="progress-value">${currentStreak}/${nextMilestone.days}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-reward">+${nextMilestone.xpReward} XP</div>
      </div>
    `;
  }
  
  renderStatusMessage() {
    const { streakStatus, daysUntilStreakLoss } = this.streakData;
    
    const messages = {
      active_today: '🎉 Great job! You\'ve studied today.',
      active: `⭐ Keep it up! Study today to maintain your streak.`,
      at_risk: `⚠️ Your streak expires in ${daysUntilStreakLoss} day${daysUntilStreakLoss !== 1 ? 's' : ''}!`,
      broken: '💔 Your streak was broken. Start a new one today!',
      inactive: '🌟 Start your learning streak today!'
    };
    
    return `
      <div class="streak-message ${streakStatus}">
        ${messages[streakStatus] || messages.inactive}
      </div>
    `;
  }
  
  renderActions() {
    const { streakStatus, canUseFreeze } = this.streakData;
    
    let actions = '';
    
    if (canUseFreeze && streakStatus === 'at_risk') {
      actions += `
        <button class="streak-freeze-btn" onclick="window.streakWidget?.useStreakFreeze()">
          🛡️ Use Streak Freeze
        </button>
      `;
    }
    
    if (actions) {
      return `<div class="streak-actions">${actions}</div>`;
    }
    
    return '';
  }
  
  renderMilestones() {
    const { currentStreak } = this.streakData;
    const visibleMilestones = this.milestones.slice(0, 5); // Show first 5 milestones
    
    return `
      <div class="streak-milestones">
        <h4 class="milestones-title">Streak Milestones</h4>
        <div class="milestones-list">
          ${visibleMilestones.map(milestone => {
            const achieved = currentStreak >= milestone.days;
            const current = currentStreak < milestone.days && 
              (!this.getNextMilestone() || milestone.days === this.getNextMilestone().days);
            
            return `
              <div class="milestone-item ${achieved ? 'achieved' : ''} ${current ? 'current' : ''}">
                <div class="milestone-icon">${milestone.badge}</div>
                <div class="milestone-info">
                  <div class="milestone-title">${milestone.title}</div>
                  <div class="milestone-desc">${milestone.days} days</div>
                </div>
                <div class="milestone-reward">+${milestone.xpReward} XP</div>
                ${achieved ? '<div class="milestone-check">✅</div>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  getStatusClass(status) {
    const classes = {
      active_today: 'streak-success',
      active: 'streak-success',
      at_risk: 'streak-warning',
      broken: 'streak-danger',
      inactive: 'streak-neutral'
    };
    return classes[status] || 'streak-neutral';
  }
  
  getNextMilestone() {
    const { currentStreak } = this.streakData;
    return this.milestones.find(milestone => milestone.days > currentStreak);
  }
  
  async useStreakFreeze() {
    try {
      const response = await fetch('/api/streaks/freeze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.showNotification('Streak freeze used successfully! 🛡️', 'success');
        await this.loadStreakData();
        this.render();
      } else {
        this.showNotification(data.message || 'Failed to use streak freeze', 'error');
      }
    } catch (error) {
      console.error('Error using streak freeze:', error);
      this.showNotification('Error using streak freeze', 'error');
    }
  }
  
  attachEventListeners() {
    // Add any additional event listeners here
    const widget = this.container.querySelector('.streak-widget');
    if (widget && !this.options.compact) {
      // Add click handler for compact toggle
      const title = widget.querySelector('.streak-title');
      if (title) {
        title.style.cursor = 'pointer';
        title.addEventListener('click', () => {
          widget.classList.toggle('collapsed');
        });
      }
    }
  }
  
  showNotification(message, type = 'info') {
    // Create or update notification
    let notification = document.querySelector('.streak-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'streak-notification';
      document.body.appendChild(notification);
    }
    
    notification.className = `streak-notification ${type}`;
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      notification.style.display = 'none';
    }, 5000);
  }
  
  // Public method to update streak after lesson completion
  async updateAfterLessonCompletion() {
    await this.loadStreakData();
    this.render();
    
    // Show congratulations if streak increased
    const newStreak = this.streakData?.currentStreak || 0;
    if (newStreak > 0) {
      this.showNotification(`🔥 Streak updated! ${newStreak} days`, 'success');
    }
  }
}

// CSS Styles for the streak widget
const streakWidgetStyles = `
<style>
.streak-widget {
  background: var(--bg-secondary, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 1rem;
  margin: 1rem 0;
  font-family: system-ui, -apple-system, sans-serif;
}

.streak-widget.compact {
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.streak-widget.full {
  padding: 1.5rem;
}

.streak-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.streak-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #1a202c);
}

.streak-icon {
  font-size: 1.5rem;
}

.streak-status-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.streak-status-badge.success {
  background: #dcfce7;
  color: #166534;
}

.streak-status-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.streak-status-badge.danger {
  background: #fee2e2;
  color: #dc2626;
}

.streak-status-badge.neutral {
  background: #f1f5f9;
  color: #475569;
}

.streak-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.streak-stat {
  text-align: center;
  padding: 1rem;
  background: var(--bg-card, white);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e2e8f0);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-primary, #6366f1);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
  margin-top: 0.25rem;
}

.streak-progress {
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--bg-card, white);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e2e8f0);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-weight: 500;
  color: var(--text-primary, #1a202c);
}

.progress-value {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-reward {
  text-align: center;
  font-size: 0.875rem;
  color: var(--accent-primary, #6366f1);
  font-weight: 500;
}

.streak-message {
  padding: 1rem;
  border-radius: 8px;
  font-weight: 500;
  text-align: center;
  margin-bottom: 1rem;
}

.streak-message.active_today,
.streak-message.active {
  background: #dcfce7;
  color: #166534;
}

.streak-message.at_risk {
  background: #fef3c7;
  color: #92400e;
}

.streak-message.broken,
.streak-message.inactive {
  background: #f1f5f9;
  color: #475569;
}

.streak-actions {
  text-align: center;
  margin-bottom: 1rem;
}

.streak-freeze-btn {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.streak-freeze-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.streak-milestones {
  border-top: 1px solid var(--border-color, #e2e8f0);
  padding-top: 1rem;
}

.milestones-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #1a202c);
}

.milestones-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.milestone-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: var(--bg-card, white);
  border: 1px solid var(--border-color, #e2e8f0);
  transition: all 0.2s;
}

.milestone-item.achieved {
  background: #dcfce7;
  border-color: #16a34a;
}

.milestone-item.current {
  background: #ddd6fe;
  border-color: #8b5cf6;
}

.milestone-icon {
  font-size: 1.5rem;
  width: 2rem;
  text-align: center;
}

.milestone-info {
  flex: 1;
}

.milestone-title {
  font-weight: 500;
  color: var(--text-primary, #1a202c);
}

.milestone-desc {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
}

.milestone-reward {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--accent-primary, #6366f1);
}

.milestone-check {
  font-size: 1.25rem;
}

.streak-display {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.streak-flame {
  font-size: 2rem;
}

.streak-counter {
  text-align: center;
}

.streak-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-primary, #6366f1);
  line-height: 1;
}

.streak-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
}

.streak-freezes {
  font-size: 1.25rem;
}

.streak-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #6366f1;
  z-index: 1000;
  display: none;
  font-weight: 500;
}

.streak-notification.success {
  border-left-color: #16a34a;
  background: #dcfce7;
  color: #166534;
}

.streak-notification.error {
  border-left-color: #dc2626;
  background: #fee2e2;
  color: #dc2626;
}

.error-message {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary, #64748b);
}

.error-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.retry-btn {
  background: var(--accent-primary, #6366f1);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .streak-stats {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .streak-stat {
    padding: 0.75rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .streak-widget.compact .streak-display {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .milestone-item {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
}
</style>
`;

// Inject styles into the page
if (!document.querySelector('#streak-widget-styles')) {
  const styleElement = document.createElement('div');
  styleElement.id = 'streak-widget-styles';
  styleElement.innerHTML = streakWidgetStyles;
  document.head.appendChild(styleElement);
}

// Make StreakWidget globally available
window.StreakWidget = StreakWidget;