/**
 * League Widget - Display weekly leagues and competitive rankings
 * Integrates with the OnluyenVatLy league system
 */

class LeagueWidget {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      view: 'overview', // 'overview', 'standings', 'progress', 'leaderboard'
      showCurrentUser: true,
      showProgressBar: true,
      autoRefresh: true,
      refreshInterval: 60000, // 1 minute
      limit: 10,
      ...options
    };
    
    this.leagueData = null;
    this.userParticipation = null;
    this.refreshTimer = null;
    
    if (!this.container) {
      console.warn('League widget container not found:', containerId);
      return;
    }
    
    this.init();
  }
  
  async init() {
    try {
      await this.loadLeagueData();
      this.render();
      this.attachEventListeners();
      
      if (this.options.autoRefresh) {
        this.startAutoRefresh();
      }
    } catch (error) {
      console.error('Error initializing league widget:', error);
      this.renderError();
    }
  }
  
  async loadLeagueData() {
    try {
      // Load league data based on view type
      switch (this.options.view) {
        case 'overview':
          await this.loadOverviewData();
          break;
        case 'standings':
          await this.loadStandingsData();
          break;
        case 'progress':
          await this.loadProgressData();
          break;
        case 'leaderboard':
          await this.loadLeaderboardData();
          break;
        default:
          await this.loadOverviewData();
      }
    } catch (error) {
      console.error('Error loading league data:', error);
      this.leagueData = null;
    }
  }
  
  async loadOverviewData() {
    try {
      const [statsResponse, participationResponse] = await Promise.all([
        fetch('/api/leagues/stats'),
        fetch('/api/leagues/my-participation')
      ]);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        this.leagueData = statsData.data.statistics;
      }
      
      if (participationResponse.ok) {
        const participationData = await participationResponse.json();
        this.userParticipation = participationData.data.participation;
      }
    } catch (error) {
      console.error('Error loading overview data:', error);
    }
  }
  
  async loadStandingsData() {
    try {
      let endpoint = '/api/leagues/standings';
      
      if (this.options.showCurrentUser) {
        endpoint = '/api/leagues/my-division-standings';
      }
      
      const response = await fetch(`${endpoint}?limit=${this.options.limit}`);
      if (response.ok) {
        const data = await response.json();
        this.leagueData = data.data;
      }
    } catch (error) {
      console.error('Error loading standings data:', error);
    }
  }
  
  async loadProgressData() {
    try {
      const response = await fetch('/api/leagues/weekly-xp-progress');
      if (response.ok) {
        const data = await response.json();
        this.leagueData = data.data;
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  }
  
  async loadLeaderboardData() {
    try {
      const response = await fetch(`/api/leagues/leaderboard?limit=${this.options.limit}`);
      if (response.ok) {
        const data = await response.json();
        this.leagueData = data.data;
      }
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    }
  }
  
  render() {
    if (!this.leagueData) {
      this.renderError();
      return;
    }
    
    const viewClass = this.options.view;
    
    this.container.innerHTML = `
      <div class="league-widget ${viewClass}">
        ${this.renderHeader()}
        ${this.renderContent()}
        ${this.renderFooter()}
      </div>
    `;
  }
  
  renderHeader() {
    const titles = {
      overview: '🏆 Weekly Leagues',
      standings: '📊 Division Standings',
      progress: '📈 Your Progress',
      leaderboard: '👑 Global Leaderboard'
    };
    
    const title = titles[this.options.view] || 'League System';
    
    return `
      <div class="league-header">
        <h3 class="league-title">${title}</h3>
        <div class="league-controls">
          ${this.renderViewSelector()}
          <button class="refresh-btn" onclick="window.leagueWidget?.refresh()">🔄</button>
        </div>
      </div>
    `;
  }
  
  renderViewSelector() {
    return `
      <select class="view-selector" onchange="window.leagueWidget?.changeView(this.value)">
        <option value="overview" ${this.options.view === 'overview' ? 'selected' : ''}>Overview</option>
        <option value="standings" ${this.options.view === 'standings' ? 'selected' : ''}>Standings</option>
        <option value="progress" ${this.options.view === 'progress' ? 'selected' : ''}>Progress</option>
        <option value="leaderboard" ${this.options.view === 'leaderboard' ? 'selected' : ''}>Leaderboard</option>
      </select>
    `;
  }
  
  renderContent() {
    switch (this.options.view) {
      case 'overview':
        return this.renderOverview();
      case 'standings':
        return this.renderStandings();
      case 'progress':
        return this.renderProgress();
      case 'leaderboard':
        return this.renderLeaderboard();
      default:
        return this.renderOverview();
    }
  }
  
  renderOverview() {
    const { currentSeason, totalParticipants, divisionCounts, divisions } = this.leagueData;
    
    return `
      <div class="league-overview">
        <div class="season-info">
          <div class="season-card">
            <div class="season-header">
              <span class="season-name">${currentSeason?.season_name || 'No Active Season'}</span>
              <span class="season-status">Active</span>
            </div>
            <div class="season-stats">
              <div class="stat">
                <span class="stat-value">${totalParticipants}</span>
                <span class="stat-label">Participants</span>
              </div>
              <div class="stat">
                <span class="stat-value">${divisions?.length || 0}</span>
                <span class="stat-label">Divisions</span>
              </div>
            </div>
          </div>
          
          ${this.userParticipation ? this.renderUserParticipation() : this.renderJoinPrompt()}
        </div>
        
        <div class="divisions-overview">
          <h4>Divisions</h4>
          <div class="divisions-grid">
            ${divisions?.map(division => this.renderDivisionCard(division, divisionCounts)).join('') || ''}
          </div>
        </div>
      </div>
    `;
  }
  
  renderUserParticipation() {
    const { league_divisions, weekly_xp } = this.userParticipation;
    
    return `
      <div class="user-participation">
        <div class="current-division">
          <div class="division-badge">
            <span class="division-icon">${league_divisions.icon}</span>
            <span class="division-name">${league_divisions.name}</span>
          </div>
          <div class="weekly-xp">
            <span class="xp-value">${weekly_xp}</span>
            <span class="xp-label">Weekly XP</span>
          </div>
        </div>
      </div>
    `;
  }
  
  renderJoinPrompt() {
    return `
      <div class="join-prompt">
        <div class="join-message">
          <span class="join-icon">🚀</span>
          <span class="join-text">Join weekly leagues to compete with other students!</span>
        </div>
        <button class="join-btn" onclick="window.leagueWidget?.joinLeague()">
          Join League
        </button>
      </div>
    `;
  }
  
  renderDivisionCard(division, divisionCounts) {
    const participantCount = divisionCounts[division.name] || 0;
    
    return `
      <div class="division-card" style="border-color: ${division.color}">
        <div class="division-header">
          <span class="division-icon">${division.icon}</span>
          <span class="division-name">${division.name}</span>
        </div>
        <div class="division-info">
          <div class="xp-range">
            ${division.min_xp_per_week}${division.max_xp_per_week ? ` - ${division.max_xp_per_week}` : '+'} XP/week
          </div>
          <div class="participant-count">${participantCount} students</div>
        </div>
      </div>
    `;
  }
  
  renderStandings() {
    const { standings, division, studentRank } = this.leagueData;
    
    return `
      <div class="league-standings">
        ${division ? `
          <div class="standings-header">
            <div class="division-info">
              <span class="division-icon">${division.icon}</span>
              <span class="division-name">${division.name}</span>
            </div>
            ${studentRank ? `<div class="user-rank">Your rank: #${studentRank}</div>` : ''}
          </div>
        ` : ''}
        
        <div class="standings-list">
          ${standings?.map(entry => this.renderStandingEntry(entry)).join('') || '<div class="empty-standings">No standings available</div>'}
        </div>
      </div>
    `;
  }
  
  renderStandingEntry(entry) {
    const isCurrentUser = this.options.showCurrentUser && entry.students.id === this.getCurrentUserId();
    
    return `
      <div class="standing-entry ${isCurrentUser ? 'current-user' : ''}" data-rank="${entry.rank}">
        <div class="rank-display">
          <span class="rank-number">${this.getRankDisplay(entry.rank)}</span>
        </div>
        <div class="student-info">
          <div class="student-name">${entry.students.full_name}</div>
          ${entry.promoted ? '<span class="promotion-badge">↗️ Promoted</span>' : ''}
          ${entry.demoted ? '<span class="demotion-badge">↘️ Demoted</span>' : ''}
        </div>
        <div class="student-stats">
          <div class="weekly-xp">${entry.weekly_xp} XP</div>
        </div>
      </div>
    `;
  }
  
  renderProgress() {
    const { weeklyXP, currentDivision, progressToNext, allDivisions } = this.leagueData;
    
    return `
      <div class="league-progress">
        <div class="current-progress">
          <div class="progress-header">
            <div class="current-division">
              <span class="division-icon">${currentDivision.icon}</span>
              <span class="division-name">${currentDivision.name}</span>
            </div>
            <div class="weekly-xp">
              <span class="xp-value">${weeklyXP}</span>
              <span class="xp-label">Weekly XP</span>
            </div>
          </div>
          
          ${progressToNext ? this.renderProgressBar(progressToNext) : this.renderMaxDivision()}
        </div>
        
        <div class="divisions-ladder">
          <h4>All Divisions</h4>
          <div class="ladder-list">
            ${allDivisions.map(division => this.renderLadderDivision(division, currentDivision, weeklyXP)).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  renderProgressBar(progressToNext) {
    const { nextDivision, xpNeeded, progressPercentage, canPromote } = progressToNext;
    
    return `
      <div class="promotion-progress">
        <div class="progress-info">
          <span class="next-division">Next: ${nextDivision.icon} ${nextDivision.name}</span>
          <span class="xp-needed">${canPromote ? 'Ready to promote!' : `${xpNeeded} XP needed`}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${canPromote ? 'complete' : ''}" style="width: ${Math.min(progressPercentage, 100)}%"></div>
        </div>
      </div>
    `;
  }
  
  renderMaxDivision() {
    return `
      <div class="max-division">
        <div class="max-message">🏆 You're in the highest division!</div>
        <div class="max-encouragement">Keep earning XP to maintain your position!</div>
      </div>
    `;
  }
  
  renderLadderDivision(division, currentDivision, weeklyXP) {
    const isCurrent = division.id === currentDivision.id;
    const isUnlocked = weeklyXP >= division.min_xp_per_week;
    
    return `
      <div class="ladder-division ${isCurrent ? 'current' : ''} ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="division-icon">${division.icon}</div>
        <div class="division-details">
          <div class="division-name">${division.name}</div>
          <div class="division-requirement">
            ${division.min_xp_per_week}${division.max_xp_per_week ? ` - ${division.max_xp_per_week}` : '+'} XP/week
          </div>
        </div>
        <div class="division-status">
          ${isCurrent ? '📍 Current' : isUnlocked ? '✅ Unlocked' : '🔒 Locked'}
        </div>
      </div>
    `;
  }
  
  renderLeaderboard() {
    const { leaderboard, season } = this.leagueData;
    
    return `
      <div class="league-leaderboard">
        <div class="leaderboard-header">
          <div class="season-name">${season?.season_name || 'Current Season'}</div>
          <div class="leaderboard-subtitle">Top performers across all divisions</div>
        </div>
        
        <div class="leaderboard-list">
          ${leaderboard?.map(entry => this.renderLeaderboardEntry(entry)).join('') || '<div class="empty-leaderboard">No data available</div>'}
        </div>
      </div>
    `;
  }
  
  renderLeaderboardEntry(entry) {
    return `
      <div class="leaderboard-entry" data-rank="${entry.globalRank}">
        <div class="rank-display">
          <span class="rank-number">${this.getRankDisplay(entry.globalRank)}</span>
        </div>
        <div class="student-info">
          <div class="student-name">${entry.students.full_name}</div>
          <div class="division-badge">
            <span class="division-icon">${entry.league_divisions.icon}</span>
            <span class="division-name">${entry.league_divisions.name}</span>
          </div>
        </div>
        <div class="student-stats">
          <div class="weekly-xp">${entry.weekly_xp} XP</div>
        </div>
      </div>
    `;
  }
  
  renderFooter() {
    return `
      <div class="league-footer">
        <div class="footer-note">
          Leagues reset weekly. Keep learning to climb the rankings! 
        </div>
      </div>
    `;
  }
  
  renderError() {
    this.container.innerHTML = `
      <div class="league-widget error">
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <div class="error-message">Unable to load league data</div>
          <button class="retry-btn" onclick="window.leagueWidget?.init()">Try Again</button>
        </div>
      </div>
    `;
  }
  
  getRankDisplay(rank) {
    const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
    return medals[rank] || `#${rank}`;
  }
  
  getCurrentUserId() {
    // This would need to be implemented based on your auth system
    return null; // Placeholder
  }
  
  attachEventListeners() {
    // Add any additional event listeners here
  }
  
  async changeView(newView) {
    this.options.view = newView;
    await this.refresh();
  }
  
  async joinLeague() {
    try {
      const response = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.showNotification(`🎉 ${data.message}`, 'success');
        await this.refresh();
      } else {
        this.showNotification(data.message || 'Failed to join league', 'error');
      }
    } catch (error) {
      console.error('Error joining league:', error);
      this.showNotification('Error joining league', 'error');
    }
  }
  
  async refresh() {
    await this.loadLeagueData();
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
  
  showNotification(message, type = 'info') {
    // Create or update notification
    let notification = document.querySelector('.league-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'league-notification';
      document.body.appendChild(notification);
    }
    
    notification.className = `league-notification ${type}`;
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      notification.style.display = 'none';
    }, 5000);
  }
  
  destroy() {
    this.stopAutoRefresh();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// CSS Styles for the league widget
const leagueWidgetStyles = `
<style>
.league-widget {
  background: var(--bg-secondary, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
  font-family: system-ui, -apple-system, sans-serif;
}

.league-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.league-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #1a202c);
}

.league-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.view-selector {
  background: var(--bg-card, white);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
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

/* Overview Styles */
.season-info {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.season-card {
  background: var(--bg-card, white);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  padding: 1.5rem;
}

.season-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.season-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1a202c);
}

.season-status {
  background: #dcfce7;
  color: #166534;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.season-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-primary, #6366f1);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
}

.user-participation {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border: 1px solid #a5b4fc;
  border-radius: 8px;
  padding: 1rem;
}

.current-division {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.division-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-primary, #1a202c);
}

.division-icon {
  font-size: 1.5rem;
}

.weekly-xp {
  text-align: center;
}

.xp-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-primary, #6366f1);
}

.xp-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
}

.join-prompt {
  background: var(--bg-card, white);
  border: 2px dashed var(--border-color, #e2e8f0);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.join-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.join-icon {
  font-size: 2rem;
}

.join-text {
  color: var(--text-secondary, #64748b);
}

.join-btn {
  background: var(--accent-primary, #6366f1);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.join-btn:hover {
  background: var(--accent-hover, #5b5bd6);
  transform: translateY(-1px);
}

.divisions-overview h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #1a202c);
}

.divisions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.division-card {
  background: var(--bg-card, white);
  border: 2px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.division-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.division-name {
  font-weight: 600;
  color: var(--text-primary, #1a202c);
}

.division-info {
  font-size: 0.875rem;
}

.xp-range {
  color: var(--text-secondary, #64748b);
  margin-bottom: 0.25rem;
}

.participant-count {
  color: var(--accent-primary, #6366f1);
  font-weight: 500;
}

/* Standings Styles */
.standings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--bg-card, white);
  border-radius: 8px;
}

.division-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.user-rank {
  color: var(--accent-primary, #6366f1);
  font-weight: 600;
}

.standings-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.standing-entry {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-card, white);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;
}

.standing-entry:hover {
  border-color: var(--accent-primary, #6366f1);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.standing-entry.current-user {
  border-color: var(--accent-primary, #6366f1);
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
}

.rank-display {
  min-width: 3rem;
  text-align: center;
}

.rank-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-primary, #6366f1);
}

.student-info {
  flex: 1;
}

.student-name {
  font-weight: 500;
  color: var(--text-primary, #1a202c);
  margin-bottom: 0.25rem;
}

.promotion-badge {
  background: #dcfce7;
  color: #166534;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.demotion-badge {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.student-stats {
  text-align: right;
}

.weekly-xp {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--accent-primary, #6366f1);
}

/* Progress Styles */
.current-progress {
  background: var(--bg-card, white);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.promotion-progress {
  margin-top: 1rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.next-division {
  font-weight: 500;
  color: var(--text-primary, #1a202c);
}

.xp-needed {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.complete {
  background: linear-gradient(90deg, #16a34a, #22c55e);
}

.max-division {
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
  border-radius: 8px;
  margin-top: 1rem;
}

.max-message {
  font-size: 1.125rem;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.5rem;
}

.max-encouragement {
  font-size: 0.875rem;
  color: #92400e;
}

.divisions-ladder h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #1a202c);
}

.ladder-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ladder-division {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-card, white);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  transition: all 0.2s;
}

.ladder-division.current {
  border-color: var(--accent-primary, #6366f1);
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
}

.ladder-division.locked {
  opacity: 0.6;
  background: #f8fafc;
}

.ladder-division .division-icon {
  font-size: 1.5rem;
}

.division-details {
  flex: 1;
}

.ladder-division .division-name {
  font-weight: 500;
  color: var(--text-primary, #1a202c);
  margin-bottom: 0.25rem;
}

.division-requirement {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
}

.division-status {
  font-size: 0.875rem;
  font-weight: 500;
}

/* Leaderboard Styles */
.leaderboard-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-card, white);
  border-radius: 8px;
}

.leaderboard-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
  margin-top: 0.5rem;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.leaderboard-entry {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-card, white);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;
}

.leaderboard-entry:hover {
  border-color: var(--accent-primary, #6366f1);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

/* Top 3 special styling */
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

/* Footer */
.league-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, #e2e8f0);
  text-align: center;
}

.footer-note {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
  font-style: italic;
}

/* Error state */
.league-widget.error {
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

/* Notification */
.league-notification {
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

.league-notification.success {
  border-left-color: #16a34a;
  background: #dcfce7;
  color: #166534;
}

.league-notification.error {
  border-left-color: #dc2626;
  background: #fee2e2;
  color: #dc2626;
}

/* Responsive design */
@media (max-width: 768px) {
  .league-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .league-controls {
    align-self: flex-end;
  }
  
  .season-info {
    grid-template-columns: 1fr;
  }
  
  .season-stats {
    justify-content: center;
  }
  
  .divisions-grid {
    grid-template-columns: 1fr;
  }
  
  .standings-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .progress-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .standing-entry,
  .leaderboard-entry {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .rank-display {
    min-width: auto;
  }
}
</style>
`;

// Inject styles into the page
if (!document.querySelector('#league-widget-styles')) {
  const styleElement = document.createElement('div');
  styleElement.id = 'league-widget-styles';
  styleElement.innerHTML = leagueWidgetStyles;
  document.head.appendChild(styleElement);
}

// Make LeagueWidget globally available
window.LeagueWidget = LeagueWidget;