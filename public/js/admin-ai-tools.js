/**
 * Admin AI Tools JavaScript
 * Bulk operations and management for AI features
 */

'use strict';

class AIToolsManager {
    constructor() {
        this.isProcessing = false;
        this.setupEventListeners();
        this.initializeStats();
    }

    setupEventListeners() {
        // Auto-refresh stats on page load
        document.addEventListener('DOMContentLoaded', () => {
            this.refreshAllStats();
        });
    }

    async initializeStats() {
        try {
            await this.refreshAllStats();
        } catch (error) {
            console.error('Error initializing stats:', error);
        }
    }

    async refreshAllStats() {
        await Promise.all([
            this.checkSummaryStats(),
            this.getCacheStats(),
            this.getUsageStats(),
            this.checkImageStats()
        ]);
    }

    showNotification(type, title, message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        const container = document.getElementById('notification-container');
        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    showLoading(show = true) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    async makeRequest(url, options = {}) {
        try {
            // Use secure API request from CSRF utils
            const response = await window.CSRFUtils.secureApiRequest(url, options);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `Request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Request error:', error);
            throw error;
        }
    }

    // Summary Generation Functions
    async checkSummaryStats() {
        try {
            const result = await this.makeRequest('/api/lessons/bulk-generate-summaries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dryRun: true, limit: 100 })
            });

            document.getElementById('lessons-without-desc').textContent = result.lessons?.length || 0;
        } catch (error) {
            document.getElementById('lessons-without-desc').textContent = 'Error';
            console.error('Error checking summary stats:', error);
        }
    }

    async generateBulkSummaries() {
        if (this.isProcessing) return;

        const limit = parseInt(document.getElementById('summary-limit').value) || 10;
        
        if (!confirm(`Bạn có chắc muốn tạo mô tả cho ${limit} bài học? Quá trình này có thể mất vài phút.`)) {
            return;
        }

        this.isProcessing = true;
        this.showLoading(true);

        try {
            const result = await this.makeRequest('/api/lessons/bulk-generate-summaries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: limit, dryRun: false })
            });

            this.displaySummaryResults(result.results || []);
            this.showNotification('success', 'Thành công', result.message || 'Đã tạo mô tả thành công');
            
            // Refresh stats
            await this.checkSummaryStats();

        } catch (error) {
            this.showNotification('error', 'Lỗi', error.message || 'Không thể tạo mô tả');
        } finally {
            this.isProcessing = false;
            this.showLoading(false);
        }
    }

    displaySummaryResults(results) {
        const resultsContainer = document.getElementById('summary-results');
        const resultsList = document.getElementById('summary-results-list');
        
        resultsList.innerHTML = '';
        
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = `result-item ${result.success ? 'success' : 'error'}`;
            
            resultItem.innerHTML = `
                <div class="result-header">
                    <span class="result-title">${result.title}</span>
                    <span class="result-status">
                        <i class="fas ${result.success ? 'fa-check' : 'fa-times'}"></i>
                        ${result.success ? 'Thành công' : 'Lỗi'}
                    </span>
                </div>
                ${result.success ? 
                    `<div class="result-content">${result.summary}</div>` : 
                    `<div class="result-error">${result.error}</div>`
                }
            `;
            
            resultsList.appendChild(resultItem);
        });
        
        resultsContainer.style.display = 'block';
    }

    // Cache Management Functions
    async getCacheStats() {
        try {
            const result = await this.makeRequest('/api/ai/cache/stats');
            
            document.getElementById('cache-items').textContent = result.memory?.size || 0;
            document.getElementById('cache-usage').textContent = 
                result.memory?.usage ? `${result.memory.usage.toFixed(1)}%` : '0%';
                
        } catch (error) {
            document.getElementById('cache-items').textContent = 'Error';
            document.getElementById('cache-usage').textContent = 'Error';
            console.error('Error getting cache stats:', error);
        }
    }

    async clearCache(type = null) {
        const message = type ? 
            `Bạn có chắc muốn xóa cache ${type}?` : 
            'Bạn có chắc muốn xóa toàn bộ cache AI?';
            
        if (!confirm(message)) return;

        try {
            await this.makeRequest('/api/ai/cache/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });

            this.showNotification('success', 'Thành công', 'Đã xóa cache');
            await this.getCacheStats();
            
        } catch (error) {
            this.showNotification('error', 'Lỗi', error.message || 'Không thể xóa cache');
        }
    }

    // Usage Statistics Functions
    async getUsageStats() {
        try {
            const result = await this.makeRequest('/api/ai/usage/stats');
            
            document.getElementById('daily-requests').textContent = result.dailyRequests || 0;
            document.getElementById('cache-hit-rate').textContent = 
                result.cacheHitRate ? `${(result.cacheHitRate * 100).toFixed(1)}%` : '0%';
            document.getElementById('estimated-cost').textContent = 
                result.estimatedCost ? `$${result.estimatedCost.toFixed(4)}` : '$0.00';
                
        } catch (error) {
            document.getElementById('daily-requests').textContent = 'Error';
            document.getElementById('cache-hit-rate').textContent = 'Error';
            document.getElementById('estimated-cost').textContent = 'Error';
            console.error('Error getting usage stats:', error);
        }
    }

    // Image Generation Functions
    async checkImageStats() {
        try {
            // This would need a new endpoint to check lessons without images
            const result = await this.makeRequest('/api/lessons/without-images?dry-run=true');
            
            document.getElementById('lessons-without-images').textContent = result.count || 0;
        } catch (error) {
            document.getElementById('lessons-without-images').textContent = 'Error';
            console.error('Error checking image stats:', error);
        }
    }

    async generateBulkImages() {
        if (this.isProcessing) return;

        const limit = parseInt(document.getElementById('image-limit').value) || 5;
        
        if (!confirm(`Bạn có chắc muốn tạo ảnh cho ${limit} bài học? Quá trình này có thể mất rất lâu.`)) {
            return;
        }

        this.isProcessing = true;
        this.showLoading(true);

        try {
            const result = await this.makeRequest('/api/lessons/bulk-generate-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: limit })
            });

            this.displayImageResults(result.results || []);
            this.showNotification('success', 'Thành công', result.message || 'Đã tạo ảnh thành công');
            
            // Refresh stats
            await this.checkImageStats();

        } catch (error) {
            this.showNotification('error', 'Lỗi', error.message || 'Không thể tạo ảnh');
        } finally {
            this.isProcessing = false;
            this.showLoading(false);
        }
    }

    displayImageResults(results) {
        const resultsContainer = document.getElementById('image-results');
        const resultsList = document.getElementById('image-results-list');
        
        resultsList.innerHTML = '';
        
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = `result-item ${result.success ? 'success' : 'error'}`;
            
            resultItem.innerHTML = `
                <div class="result-header">
                    <span class="result-title">${result.title}</span>
                    <span class="result-status">
                        <i class="fas ${result.success ? 'fa-check' : 'fa-times'}"></i>
                        ${result.success ? 'Thành công' : 'Lỗi'}
                    </span>
                </div>
                ${result.success ? 
                    `<div class="result-content">
                        <img src="${result.imageUrl}" alt="Generated image" style="max-width: 200px; border-radius: 4px;">
                        <p>Prompt: ${result.prompt}</p>
                     </div>` : 
                    `<div class="result-error">${result.error}</div>`
                }
            `;
            
            resultsList.appendChild(resultItem);
        });
        
        resultsContainer.style.display = 'block';
    }
}

// Global functions for button onclick handlers
let aiToolsManager;

function checkSummaryStats() {
    aiToolsManager.checkSummaryStats();
}

function generateBulkSummaries() {
    aiToolsManager.generateBulkSummaries();
}

function getCacheStats() {
    aiToolsManager.getCacheStats();
}

function clearCache(type) {
    aiToolsManager.clearCache(type);
}

function getUsageStats() {
    aiToolsManager.getUsageStats();
}

function checkImageStats() {
    aiToolsManager.checkImageStats();
}

function generateBulkImages() {
    aiToolsManager.generateBulkImages();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    aiToolsManager = new AIToolsManager();
});