// Review Mistakes JavaScript
let currentPage = 1;
let currentFilters = {
    subject: '',
    reviewed: '',
    limit: 20
};
let mistakesData = [];
let selectedMistakes = new Set();

// Authentication functions (supports both students and admins)
async function checkStudentAuthentication() {
    try {
        const response = await fetch('/api/auth/student/check');
        if (!response.ok) {
            console.log('Auth check failed, user not authenticated');
            return false;
        }
        const authData = await response.json();

        if (authData.success && authData.data) {
            if (authData.data.isAuthenticated && authData.data.student) {
                console.log('User authenticated:', authData.data.student.name,
                    authData.data.student.id === 'admin' ? '(Admin)' : '(Student)');
                return true;
            }
        }

        console.log('User not authenticated');
        return false;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

function promptForLogin() {
    const currentUrl = window.location.pathname + window.location.search;
    if (confirm('Bạn cần đăng nhập để xem lỗi sai. Chuyển đến trang đăng nhập?')) {
        window.location.href = '/student/login?redirect=' + encodeURIComponent(currentUrl);
    }
}

// Utility functions
function showLoader(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatAnswerText(text) {
    if (!text) return 'Không có đáp án';
    if (typeof text === 'object') {
        return JSON.stringify(text);
    }
    return text.toString();
}

// Get reviewed mistakes from localStorage
function getReviewedMistakes() {
    try {
        const reviewed = localStorage.getItem('reviewedMistakes');
        return reviewed ? JSON.parse(reviewed) : [];
    } catch (error) {
        console.error('Error getting reviewed mistakes:', error);
        return [];
    }
}

// Save reviewed mistakes to localStorage
function saveReviewedMistakes(reviewedIds) {
    try {
        localStorage.setItem('reviewedMistakes', JSON.stringify(reviewedIds));
    } catch (error) {
        console.error('Error saving reviewed mistakes:', error);
    }
}

// Mark mistake as reviewed locally
function markMistakeReviewed(mistakeId) {
    const reviewed = getReviewedMistakes();
    if (!reviewed.includes(mistakeId)) {
        reviewed.push(mistakeId);
        saveReviewedMistakes(reviewed);
    }
}

// Check if mistake is reviewed
function isMistakeReviewed(mistakeId) {
    const reviewed = getReviewedMistakes();
    return reviewed.includes(mistakeId);
}

// Load mistakes data
async function loadMistakes(page = 1, filters = {}) {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: filters.limit || 20,
            ...filters
        });

        const response = await fetch(`/api/progress/mistakes?${params}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch mistakes: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
            mistakesData = data.mistakes || [];
            
            // Apply local reviewed status
            const reviewedIds = getReviewedMistakes();
            mistakesData = mistakesData.map(mistake => ({
                ...mistake,
                reviewed: reviewedIds.includes(mistake.id)
            }));
            
            renderMistakes(mistakesData);
            renderPagination(data.pagination);
            updateStats();
        } else {
            throw new Error(data.message || 'Failed to load mistakes');
        }
    } catch (error) {
        console.error('Error loading mistakes:', error);
        showErrorState('Không thể tải danh sách lỗi sai. Vui lòng thử lại.');
    }
}

// Render mistakes list
function renderMistakes(mistakes) {
    const mistakesList = document.getElementById('mistakes-list');
    
    if (!mistakes || mistakes.length === 0) {
        mistakesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Tuyệt vời! Không có lỗi sai nào</h3>
                <p>Bạn đã làm rất tốt hoặc chưa có bài thi nào được thực hiện.</p>
                <a href="/lessons" class="bulk-btn" style="margin-top: 1rem;">
                    <i class="fas fa-book"></i>
                    Làm bài thi mới
                </a>
            </div>
        `;
        return;
    }
    
    mistakesList.innerHTML = mistakes.map(mistake => `
        <div class="mistake-card ${mistake.reviewed ? 'reviewed' : ''}" data-mistake-id="${mistake.id}">
            <div class="mistake-header">
                <div class="mistake-lesson-info">
                    <div class="lesson-title">${mistake.lessonTitle}</div>
                    <div class="lesson-meta">
                        <span><i class="fas fa-bookmark"></i> ${mistake.subject}</span>
                        <span><i class="fas fa-clock"></i> ${formatDate(mistake.timestamp)}</span>
                        <span><i class="fas fa-question-circle"></i> ${mistake.type}</span>
                    </div>
                </div>
                <div class="mistake-actions">
                    <input type="checkbox" class="mistake-checkbox" value="${mistake.id}" 
                           ${selectedMistakes.has(mistake.id) ? 'checked' : ''}>
                    <button class="mark-reviewed-btn" 
                            onclick="markSingleMistakeReviewed('${mistake.id}')"
                            ${mistake.reviewed ? 'disabled' : ''}>
                        <i class="fas fa-${mistake.reviewed ? 'check' : 'eye'}"></i>
                        ${mistake.reviewed ? 'Đã xong' : 'Xong'}
                    </button>
                </div>
            </div>
            
            <div class="question-content">
                <div class="question-text">${mistake.question}</div>
                
                <div class="answers-comparison">
                    <div class="answer-section your-answer">
                        <div class="answer-label">Câu trả lời của bạn</div>
                        <div class="answer-text">${formatAnswerText(mistake.userAnswer)}</div>
                    </div>
                    
                    <div class="answer-section correct-answer">
                        <div class="answer-label">Đáp án đúng</div>
                        <div class="answer-text">${formatAnswerText(mistake.correctAnswer)}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add event listeners for checkboxes
    document.querySelectorAll('.mistake-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const mistakeId = e.target.value;
            if (e.target.checked) {
                selectedMistakes.add(mistakeId);
            } else {
                selectedMistakes.delete(mistakeId);
            }
            updateSelectAllState();
        });
    });
    
    // Render math with KaTeX
    if (window.renderMathInElement) {
        renderMathInElement(document.getElementById('mistakes-list'), {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ]
        });
    }
}

// Render pagination
function renderPagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    
    if (!pagination || pagination.totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    const { page, totalPages } = pagination;
    let html = '';
    
    // Previous button
    html += `
        <button class="pagination-btn" ${page <= 1 ? 'disabled' : ''} 
                onclick="changePage(${page - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    
    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span>...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === page ? 'active' : ''}" 
                    onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span>...</span>`;
        }
        html += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    html += `
        <button class="pagination-btn" ${page >= totalPages ? 'disabled' : ''} 
                onclick="changePage(${page + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = html;
}

// Change page
function changePage(page) {
    currentPage = page;
    loadMistakes(currentPage, currentFilters);
}

// Update stats overview
function updateStats() {
    const totalMistakes = mistakesData.length;
    const reviewedCount = mistakesData.filter(m => m.reviewed).length;
    const unreviewed = totalMistakes - reviewedCount;
    const subjects = [...new Set(mistakesData.map(m => m.subject))];
    
    document.getElementById('stats-overview').innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${totalMistakes}</div>
            <div class="stat-label">Tổng lỗi sai</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${unreviewed}</div>
            <div class="stat-label">Chưa ôn tập</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${reviewedCount}</div>
            <div class="stat-label">Đã ôn tập</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${subjects.length}</div>
            <div class="stat-label">Môn học</div>
        </div>
    `;
}

// Mark single mistake as reviewed
async function markSingleMistakeReviewed(mistakeId) {
    try {
        markMistakeReviewed(mistakeId);
        
        // Update UI
        const mistakeCard = document.querySelector(`[data-mistake-id="${mistakeId}"]`);
        if (mistakeCard) {
            mistakeCard.classList.add('reviewed');
            const button = mistakeCard.querySelector('.mark-reviewed-btn');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-check"></i> Đã ôn tập';
        }
        
        // Update stats
        const mistake = mistakesData.find(m => m.id === mistakeId);
        if (mistake) {
            mistake.reviewed = true;
        }
        updateStats();
        
    } catch (error) {
        console.error('Error marking mistake as reviewed:', error);
        alert('Có lỗi khi đánh dấu. Vui lòng thử lại.');
    }
}

// Mark selected mistakes as reviewed
async function markSelectedMistakesReviewed() {
    if (selectedMistakes.size === 0) {
        alert('Vui lòng chọn ít nhất một lỗi sai để đánh dấu.');
        return;
    }
    
    try {
        const mistakeIds = Array.from(selectedMistakes);
        
        // Mark locally
        mistakeIds.forEach(id => markMistakeReviewed(id));
        
        // Update UI
        mistakeIds.forEach(id => {
            const mistakeCard = document.querySelector(`[data-mistake-id="${id}"]`);
            if (mistakeCard) {
                mistakeCard.classList.add('reviewed');
                const button = mistakeCard.querySelector('.mark-reviewed-btn');
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-check"></i> Đã ôn tập';
                
                const checkbox = mistakeCard.querySelector('.mistake-checkbox');
                checkbox.checked = false;
            }
            
            // Update data
            const mistake = mistakesData.find(m => m.id === id);
            if (mistake) {
                mistake.reviewed = true;
            }
        });
        
        selectedMistakes.clear();
        updateSelectAllState();
        updateStats();
        
        alert(`Đã đánh dấu ${mistakeIds.length} lỗi sai là đã ôn tập.`);
        
    } catch (error) {
        console.error('Error marking mistakes as reviewed:', error);
        alert('Có lỗi khi đánh dấu. Vui lòng thử lại.');
    }
}

// Practice selected mistakes
function practiceSelectedMistakes() {
    if (selectedMistakes.size === 0) {
        alert('Vui lòng chọn ít nhất một lỗi sai để luyện tập.');
        return;
    }
    
    // Store selected mistakes in sessionStorage for practice page
    const mistakeIds = Array.from(selectedMistakes);
    sessionStorage.setItem('practiceMistakes', JSON.stringify({
        mistakeIds: mistakeIds,
        timestamp: new Date().toISOString()
    }));
    
    // Navigate to practice page
    window.location.href = '/practice';
}

// Update select all state
function updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('select-all');
    const checkboxes = document.querySelectorAll('.mistake-checkbox');
    const checkedCount = document.querySelectorAll('.mistake-checkbox:checked').length;
    
    selectAllCheckbox.checked = checkedCount > 0 && checkedCount === checkboxes.length;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

// Apply filters
function applyFilters() {
    currentFilters = {
        subject: document.getElementById('subject-filter').value,
        reviewed: document.getElementById('reviewed-filter').value,
        limit: parseInt(document.getElementById('limit-filter').value)
    };
    
    currentPage = 1;
    selectedMistakes.clear();
    loadMistakes(currentPage, currentFilters);
}

// Show error state
function showErrorState(message) {
    const mistakesList = document.getElementById('mistakes-list');
    mistakesList.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Có lỗi xảy ra</h3>
            <p>${message}</p>
            <button onclick="loadMistakes()" class="bulk-btn" style="margin-top: 1rem;">
                <i class="fas fa-refresh"></i>
                Thử lại
            </button>
        </div>
    `;
}

// Initialize the page
async function initializeReviewMistakes() {
    const isAuthenticated = await checkStudentAuthentication();
    
    if (!isAuthenticated) {
        promptForLogin();
        return;
    }
    
    showLoader(true);
    
    try {
        // Set up event listeners
        document.getElementById('apply-filters').addEventListener('click', applyFilters);
        
        document.getElementById('select-all').addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.mistake-checkbox');
            selectedMistakes.clear();
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
                if (e.target.checked) {
                    selectedMistakes.add(checkbox.value);
                }
            });
        });
        
        document.getElementById('mark-selected-reviewed').addEventListener('click', markSelectedMistakesReviewed);
        document.getElementById('practice-selected').addEventListener('click', practiceSelectedMistakes);
        
        // Load initial data
        await loadMistakes(currentPage, currentFilters);
        showLoader(false);
        
    } catch (error) {
        console.error('Error initializing review mistakes:', error);
        showErrorState('Không thể khởi tạo trang. Vui lòng thử lại.');
        showLoader(false);
    }
}

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeReviewMistakes);