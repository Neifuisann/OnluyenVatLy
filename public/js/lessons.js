// Global variables for lessons listing
let currentPage = 1;
let currentSearch = '';
let currentSort = 'order';

// --- Student Authentication Functions ---
async function checkStudentAuthentication() {
    try {
        const response = await fetch('/api/check-student-auth');
        if (!response.ok) {
            console.log('Auth check failed, user not authenticated');
            return false;
        }
        const authData = await response.json();

        if (authData.isAuthenticated && authData.student) {
            console.log('Student authenticated:', authData.student.name);
            return true;
        } else {
            console.log('Student not authenticated');
            return false;
        }
    } catch (error) {
        console.error('Error checking student authentication:', error);
        return false;
    }
}

function promptForLogin() {
    const currentUrl = window.location.pathname + window.location.search;
    if (confirm('Bạn cần đăng nhập để làm bài tập. Chuyển đến trang đăng nhập?')) {
        window.location.href = '/student/login?redirect=' + encodeURIComponent(currentUrl);
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/api/student/logout', { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            console.log('Logout successful');
            window.location.href = '/student/login';
        } else {
            alert('Đăng xuất thất bại: ' + (result.message || 'Lỗi không xác định'));
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Đã xảy ra lỗi trong quá trình đăng xuất.');
    }
}

// Timer functions removed - not needed for lessons listing

// --- Utility Functions ---
function showLoader(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Functions for lessons listing page - individual lesson functions removed

// This file is for lessons listing page, not individual lesson rendering
// Individual lesson functionality is handled in lesson.html directly

// --- Initialize Lessons Listing ---
async function initializeLessons() {
    // Check authentication (for potential future use)
    await checkStudentAuthentication();

    showLoader(true);

    try {
        console.log('Loading lessons listing...');
        await loadLessons();
        showLoader(false);

    } catch (error) {
        console.error('Error loading lessons:', error);
        console.error('Error stack:', error.stack);
        document.body.innerHTML = `
            <div class="error-container">
                <h1>Error loading lessons</h1>
                <p><strong>Error details:</strong> ${error.message}</p>
                <a href="/" class="btn btn-primary">Back to Home</a>
                <button onclick="window.location.reload()" class="btn btn-secondary">Retry</button>
            </div>
        `;
        showLoader(false);
    }
}

// --- Load Lessons Function ---
async function loadLessons(page = 1, search = '', sort = 'order') {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '12',
            search: search,
            sort: sort
        });

        const response = await fetch(`/api/lessons?${params}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch lessons: ${response.status}`);
        }

        const data = await response.json();
        console.log('Lessons data:', data);

        if (data.success && data.lessons) {
            renderLessons(data.lessons);
            renderPagination(data.page, data.total, data.limit);
        } else {
            throw new Error('Invalid response format');
        }

    } catch (error) {
        console.error('Error loading lessons:', error);
        throw error;
    }
}

// --- Render Lessons Function ---
function renderLessons(lessons) {
    const lessonsContainer = document.getElementById('lessons');
    if (!lessonsContainer) {
        console.error('Lessons container not found');
        return;
    }

    if (!lessons || lessons.length === 0) {
        lessonsContainer.innerHTML = `
            <div class="no-lessons">
                <i class="fas fa-book-open"></i>
                <h3>Không có bài học nào</h3>
                <p>Hiện tại chưa có bài học nào được tạo.</p>
            </div>
        `;
        return;
    }

    lessonsContainer.innerHTML = lessons.map(lesson => `
        <div class="lesson-card" onclick="window.location.href='/lesson/${lesson.id}'">
            <div class="lesson-card-image">
                ${lesson.lessonImage ?
                    `<img src="${lesson.lessonImage}" alt="${lesson.title}" loading="lazy">` :
                    `<div class="lesson-image-placeholder"><i class="fas fa-book"></i></div>`
                }
                ${lesson.completed ? '<div class="completion-badge"><i class="fas fa-check"></i></div>' : ''}
            </div>
            <div class="lesson-card-content">
                <div class="lesson-card-header">
                    <h3 class="lesson-card-title">${lesson.title}</h3>
                    <div class="lesson-card-meta">
                        ${lesson.subject ? `<span class="lesson-meta-item"><i class="fas fa-book-open"></i>${lesson.subject}</span>` : ''}
                        ${lesson.grade ? `<span class="lesson-meta-item"><i class="fas fa-graduation-cap"></i>Lớp ${lesson.grade}</span>` : ''}
                        <span class="lesson-meta-item">
                            <i class="fas fa-eye"></i>
                            ${lesson.views || 0} lượt xem
                        </span>
                    </div>
                </div>
                ${lesson.completed ?
                    `<div class="lesson-progress">
                        <span class="progress-text">Đã hoàn thành</span>
                        ${lesson.lastScore ? `<span class="progress-score">${lesson.lastScore}/${lesson.lastTotalPoints}</span>` : ''}
                    </div>` :
                    '<div class="lesson-action">Bắt đầu học</div>'
                }
            </div>
        </div>
    `).join('');
}

// --- Render Pagination Function ---
function renderPagination(currentPage, total, limit) {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="loadLessons(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;
    }

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}"
                          onclick="loadLessons(${i})">${i}</button>`;
    }

    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="loadLessons(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;
    }

    paginationContainer.innerHTML = paginationHTML;
}

// --- Filter and Render Lessons Function ---
async function filterAndRenderLessons() {
    const searchInput = document.getElementById('search-input');
    const search = searchInput ? searchInput.value : '';

    try {
        await loadLessons(1, search);
    } catch (error) {
        console.error('Error filtering lessons:', error);
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    showLoader(true);

    // Initialize lessons listing
    initializeLessons();

    // Set up search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterAndRenderLessons, 300));
    }
});

// --- Utility Functions ---
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}