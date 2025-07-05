// Global variables for lessons listing
let currentPage = 1;
let currentSearch = '';
let currentSort = 'order';
let currentTags = [];
let allTags = [];
let isLoadingTags = false;

// --- Authentication Functions (supports both students and admins) ---
async function checkStudentAuthentication() {
    try {
        const response = await fetch('/api/auth/student/check');
        if (!response.ok) {
            console.log('Auth check failed, user not authenticated');
            return false;
        }
        const authData = await response.json();

        // Handle nested response structure
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

// --- Tag Management Functions ---
async function loadTags() {
    if (isLoadingTags) return;

    isLoadingTags = true;
    try {
        console.log('Loading popular tags for lessons page...');
        const response = await fetch('/api/tags/popular?limit=8');
        if (!response.ok) throw new Error('Failed to fetch popular tags');

        const result = await response.json();
        if (result.success && result.tags) {
            allTags = result.tags; // Now contains tag objects with statistics
            console.log('Loaded popular tags for lessons:', allTags);
            renderCategoryPills();
        } else {
            throw new Error('Invalid popular tags response format');
        }
    } catch (error) {
        console.error('Error loading popular tags:', error);
        console.log('Falling back to basic tags...');

        // Fallback to basic tags endpoint
        try {
            const fallbackResponse = await fetch('/api/tags');
            if (fallbackResponse.ok) {
                const basicTags = await fallbackResponse.json();
                // Convert basic tags to tag objects format
                allTags = basicTags.slice(0, 8).map(tag => ({
                    tag,
                    lessonCount: 0,
                    totalViews: 0,
                    recentActivity: 0,
                    popularityScore: 0
                }));
                console.log('Loaded fallback tags:', allTags);
                renderCategoryPills();
            } else {
                throw new Error('Fallback tags also failed');
            }
        } catch (fallbackError) {
            console.error('Fallback tags failed:', fallbackError);
            // Final hardcoded fallback
            allTags = ['dao-dong', 'song-co', 'dien-xoay-chieu', 'dao-dong-dien-tu', 'song-anh-sang', 'luong-tu', 'hat-nhan']
                .map(tag => ({
                    tag,
                    lessonCount: 0,
                    totalViews: 0,
                    recentActivity: 0,
                    popularityScore: 0
                }));
            console.log('Using hardcoded fallback tags');
            renderCategoryPills();
        }
    } finally {
        isLoadingTags = false;
    }
}

function renderCategoryPills() {
    const categoryPillsContainer = document.querySelector('.category-pills');
    if (!categoryPillsContainer) return;

    console.log('Rendering category pills with data:', allTags);
    categoryPillsContainer.innerHTML = '';

    // Add "All" pill first
    const allPill = document.createElement('button');
    allPill.className = currentTags.length === 0 ? 'category-pill active' : 'category-pill';
    allPill.setAttribute('data-category', 'all');
    allPill.innerHTML = `
        <span class="tag-name">Tất cả</span>
    `;
    categoryPillsContainer.appendChild(allPill);

    // Show top 8 popular tags
    const topTags = allTags.slice(0, 8);
    topTags.forEach(tagData => {
        const pill = document.createElement('button');

        // Handle both old format (string) and new format (object)
        const tagName = typeof tagData === 'string' ? tagData : tagData.tag;
        const lessonCount = typeof tagData === 'object' ? tagData.lessonCount : 0;
        const totalViews = typeof tagData === 'object' ? tagData.totalViews : 0;

        // Set active state based on currentTags
        const isActive = currentTags.includes(tagName);
        pill.className = isActive ? 'category-pill active' : 'category-pill';

        pill.setAttribute('data-category', tagName);
        pill.title = `${lessonCount} bài học • ${totalViews} lượt xem`;

        pill.innerHTML = `
            <span class="tag-name">${formatTagName(tagName)}</span>
            ${lessonCount > 0 ? `<span class="tag-count">${lessonCount}</span>` : ''}
        `;

        categoryPillsContainer.appendChild(pill);
    });

    // Add event listeners to all pills
    setupCategoryPillListeners();
}

function formatTagName(tag) {
    // Convert tag names to display format
    const tagMap = {
        'dao-dong': 'Dao động cơ',
        'song-co': 'Sóng cơ',
        'dien-xoay-chieu': 'Điện xoay chiều',
        'dao-dong-dien-tu': 'Dao động điện từ',
        'song-anh-sang': 'Sóng ánh sáng',
        'luong-tu': 'Lượng tử ánh sáng',
        'hat-nhan': 'Vật lý hạt nhân'
    };

    return tagMap[tag] || tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ');
}

function setupCategoryPillListeners() {
    const categoryPills = document.querySelectorAll('.category-pill');
    categoryPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            // Prevent context menu from interfering with normal clicks
            if (e.button !== 0) return;

            // Remove active class from all pills
            categoryPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const category = pill.dataset.category;

            console.log('Category pill clicked:', category);

            // Update current tags
            if (category === 'all') {
                currentTags = [];
                console.log('Showing all lessons');
            } else {
                currentTags = [category];
                console.log('Filtering by category:', category);
            }

            // Reset page and filter lessons
            currentPage = 1;
            filterAndRenderLessons();
        });

        // Disable right-click context menu for lessons page
        pill.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            // Context menu disabled for lessons page
        });
    });
}

// --- Tag Context Menu Functions ---
function showTagContextMenu(event, tag) {
    // Remove any existing context menu
    const existingMenu = document.querySelector('.tag-context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'tag-context-menu';
    menu.style.position = 'fixed';
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';
    menu.style.zIndex = '10000';

    menu.innerHTML = `
        <div class="context-menu-item" onclick="openAdminPageWithTag('${tag}')">
            <i class="fas fa-cog"></i>
            Xem trong quản lý
        </div>
        <div class="context-menu-item" onclick="showTagStatistics('${tag}')">
            <i class="fas fa-chart-bar"></i>
            Xem thống kê tag
        </div>
        <div class="context-menu-item" onclick="copyTagName('${tag}')">
            <i class="fas fa-copy"></i>
            Sao chép tên tag
        </div>
    `;

    document.body.appendChild(menu);

    // Remove menu when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', function removeMenu() {
            menu.remove();
            document.removeEventListener('click', removeMenu);
        });
    }, 100);
}

function openAdminPageWithTag(tag) {
    const adminUrl = `/admin?tags=${encodeURIComponent(tag)}`;
    window.open(adminUrl, '_blank');
}

function showTagStatistics(tag) {
    const tagData = allTags.find(t => (typeof t === 'string' ? t : t.tag) === tag);
    if (tagData && typeof tagData === 'object') {
        // Create a more sophisticated modal instead of alert
        showTagStatisticsModal(tagData);
    } else {
        alert(`Không có thống kê cho tag "${formatTagName(tag)}"`);
    }
}

function showTagStatisticsModal(tagData) {
    // Remove any existing modal
    const existingModal = document.querySelector('.tag-stats-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'tag-stats-modal';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-chart-bar"></i> Thống kê Tag: ${formatTagName(tagData.tag)}</h3>
                <button class="modal-close" onclick="this.closest('.tag-stats-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-icon"><i class="fas fa-book"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${tagData.lessonCount}</div>
                            <div class="stat-label">Bài học</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon"><i class="fas fa-eye"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${tagData.totalViews.toLocaleString()}</div>
                            <div class="stat-label">Lượt xem</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon"><i class="fas fa-clock"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${tagData.recentActivity}</div>
                            <div class="stat-label">Hoạt động gần đây</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon"><i class="fas fa-star"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${tagData.popularityScore.toFixed(2)}</div>
                            <div class="stat-label">Điểm phổ biến</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal when clicking backdrop
    modal.querySelector('.modal-backdrop').addEventListener('click', () => {
        modal.remove();
    });
}

function copyTagName(tag) {
    navigator.clipboard.writeText(tag).then(() => {
        // Show a brief success message
        const message = document.createElement('div');
        message.className = 'copy-success-message';
        message.textContent = 'Đã sao chép tên tag!';
        message.style.position = 'fixed';
        message.style.top = '20px';
        message.style.right = '20px';
        message.style.zIndex = '10001';
        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy tag name:', err);
        alert(`Tag name: ${tag}`);
    });
}

// --- Continue Learning Banner ---
function showContinueLearningBanner(lesson) {
    const lessonsContainer = document.querySelector('.lessons-container');
    if (!lessonsContainer) return;
    
    const banner = document.createElement('div');
    banner.className = 'continue-learning-banner';
    banner.style.cssText = `
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        color: white;
        padding: 1.5rem;
        border-radius: 16px;
        margin-bottom: 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        flex-wrap: wrap;
        gap: 1rem;
    `;
    
    banner.innerHTML = `
        <div style="flex: 1;">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem;">
                <i class="fas fa-book-open" style="margin-right: 0.5rem;"></i>
                Tiếp tục học tập
            </h3>
            <p style="margin: 0; opacity: 0.9;">
                Bạn đang làm dở: <strong>${lesson.title}</strong>
            </p>
        </div>
        <a href="/lesson/last-incomplete" class="continue-btn" style="
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: background 0.2s;
            backdrop-filter: blur(10px);
        " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" 
           onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
            <i class="fas fa-play-circle"></i>
            Tiếp tục
        </a>
    `;
    
    // Insert banner at the top of lessons container
    lessonsContainer.insertBefore(banner, lessonsContainer.firstChild);
}

// --- Initialize Lessons Listing ---
async function initializeLessons() {
    // Check authentication (for potential future use)
    const isAuthenticated = await checkStudentAuthentication();

    showLoader(true);

    try {
        console.log('Loading lessons listing...');
        
        // Check for last incomplete lesson if authenticated
        if (isAuthenticated) {
            try {
                const progressResponse = await fetch('/api/progress/overview');
                if (progressResponse.ok) {
                    const progressData = await progressResponse.json();
                    if (progressData.progress && progressData.progress.lastIncompleteLesson) {
                        const lesson = progressData.progress.lastIncompleteLesson;
                        showContinueLearningBanner(lesson);
                    }
                }
            } catch (error) {
                console.error('Error fetching progress:', error);
            }
        }
        
        await loadLessons();
        showLoader(false);

    } catch (error) {
        console.error('Error loading lessons:', error);
        console.error('Error stack:', error.stack);
        // Create error container safely
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        
        const title = document.createElement('h1');
        title.textContent = 'Error loading lessons';
        
        const errorPara = document.createElement('p');
        const errorStrong = document.createElement('strong');
        errorStrong.textContent = 'Error details: ';
        const errorText = document.createTextNode(error.message);
        errorPara.appendChild(errorStrong);
        errorPara.appendChild(errorText);
        
        const backLink = document.createElement('a');
        backLink.href = '/';
        backLink.className = 'btn btn-primary';
        backLink.textContent = 'Back to Home';
        
        const retryButton = document.createElement('button');
        retryButton.onclick = () => window.location.reload();
        retryButton.className = 'btn btn-secondary';
        retryButton.textContent = 'Retry';
        
        errorContainer.appendChild(title);
        errorContainer.appendChild(errorPara);
        errorContainer.appendChild(backLink);
        errorContainer.appendChild(retryButton);
        
        document.body.innerHTML = '';
        document.body.appendChild(errorContainer);
        showLoader(false);
    }
}

// --- Load Lessons Function ---
async function loadLessons(page = 1, search = '', sort = 'order', tags = []) {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '12',
            search: search,
            sort: sort
        });

        // Add tags parameter if tags are specified
        if (tags && tags.length > 0) {
            params.append('tags', tags.join(','));
        }

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

    // Clear container
    lessonsContainer.innerHTML = '';

    if (!lessons || lessons.length === 0) {
        const noLessonsDiv = document.createElement('div');
        noLessonsDiv.className = 'no-lessons';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-book-open';
        
        const title = document.createElement('h3');
        title.textContent = 'Không có bài học nào';
        
        const description = document.createElement('p');
        description.textContent = 'Hiện tại chưa có bài học nào được tạo.';
        
        noLessonsDiv.appendChild(icon);
        noLessonsDiv.appendChild(title);
        noLessonsDiv.appendChild(description);
        lessonsContainer.appendChild(noLessonsDiv);
        return;
    }

    // Create lesson cards safely
    lessons.forEach(lesson => {
        const lessonCard = createLessonCard(lesson);
        lessonsContainer.appendChild(lessonCard);
    });
}

// Helper function to create a safe lesson card
function createLessonCard(lesson) {
    const card = document.createElement('div');
    card.className = 'lesson-card';
    
    // Add click handler safely
    card.addEventListener('click', () => {
        // Sanitize parameters before passing to function
        const safeId = parseInt(lesson.id) || 0;
        const safeTitle = String(lesson.title || '').slice(0, 100); // Limit length
        const safeSubject = String(lesson.subject || '').slice(0, 50);
        const safeGrade = String(lesson.grade || '').slice(0, 20);
        const safeViews = parseInt(lesson.views) || 0;
        const safeImage = String(lesson.lessonImage || '').slice(0, 200);
        
        showLessonConfirmation(safeId, safeTitle, safeSubject, safeGrade, safeViews, safeImage);
    });
    
    // Create image section
    const imageDiv = document.createElement('div');
    imageDiv.className = 'lesson-card-image';
    
    if (lesson.lessonImage) {
        // Create responsive image with WebP support and fallbacks
        const picture = document.createElement('picture');
        
        // WebP source with responsive sizes
        const webpSource = document.createElement('source');
        const imageBase = lesson.lessonImage.replace('.jpg', '').replace('.jpeg', '').replace('.png', '');
        webpSource.type = 'image/webp';
        webpSource.srcset = `
            ${imageBase}-sm.webp 400w,
            ${imageBase}-md.webp 800w,
            ${imageBase}-lg.webp 1200w
        `;
        webpSource.sizes = '(max-width: 768px) 400px, (max-width: 1024px) 800px, 1200px';
        
        // Fallback JPEG image
        const img = document.createElement('img');
        img.src = lesson.lessonImage;
        img.alt = lesson.title || 'Lesson image';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.style.width = '100%';
        img.style.height = 'auto';
        
        // Add error handling for missing optimized images
        img.onerror = function() {
            // Fallback to original image if optimized versions fail
            this.src = lesson.lessonImage;
            this.onerror = null; // Prevent infinite loop
        };
        
        picture.appendChild(webpSource);
        picture.appendChild(img);
        imageDiv.appendChild(picture);
    } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'lesson-image-placeholder';
        const placeholderIcon = document.createElement('i');
        placeholderIcon.className = 'fas fa-book';
        placeholder.appendChild(placeholderIcon);
        imageDiv.appendChild(placeholder);
    }
    
    if (lesson.completed) {
        const completionBadge = document.createElement('div');
        completionBadge.className = 'completion-badge';
        const checkIcon = document.createElement('i');
        checkIcon.className = 'fas fa-check';
        completionBadge.appendChild(checkIcon);
        imageDiv.appendChild(completionBadge);
    }
    
    // Create content section
    const contentDiv = document.createElement('div');
    contentDiv.className = 'lesson-card-content';
    
    // Header section
    const headerDiv = document.createElement('div');
    headerDiv.className = 'lesson-card-header';
    
    const titleH3 = document.createElement('h3');
    titleH3.className = 'lesson-card-title';
    titleH3.textContent = lesson.title || 'Untitled Lesson';
    
    // Meta section
    const metaDiv = document.createElement('div');
    metaDiv.className = 'lesson-card-meta';
    
    if (lesson.subject) {
        const subjectSpan = document.createElement('span');
        subjectSpan.className = 'lesson-meta-item';
        const subjectIcon = document.createElement('i');
        subjectIcon.className = 'fas fa-book-open';
        subjectSpan.appendChild(subjectIcon);
        subjectSpan.appendChild(document.createTextNode(lesson.subject));
        metaDiv.appendChild(subjectSpan);
    }
    
    if (lesson.grade) {
        const gradeSpan = document.createElement('span');
        gradeSpan.className = 'lesson-meta-item';
        const gradeIcon = document.createElement('i');
        gradeIcon.className = 'fas fa-graduation-cap';
        gradeSpan.appendChild(gradeIcon);
        gradeSpan.appendChild(document.createTextNode('Lớp ' + lesson.grade));
        metaDiv.appendChild(gradeSpan);
    }
    
    const viewsSpan = document.createElement('span');
    viewsSpan.className = 'lesson-meta-item';
    const viewsIcon = document.createElement('i');
    viewsIcon.className = 'fas fa-eye';
    viewsSpan.appendChild(viewsIcon);
    viewsSpan.appendChild(document.createTextNode((lesson.views || 0) + ' lượt xem'));
    metaDiv.appendChild(viewsSpan);
    
    headerDiv.appendChild(titleH3);
    headerDiv.appendChild(metaDiv);
    
    // Progress or action section
    if (lesson.completed) {
        const progressDiv = document.createElement('div');
        progressDiv.className = 'lesson-progress';
        
        const progressText = document.createElement('span');
        progressText.className = 'progress-text';
        progressText.textContent = 'Đã hoàn thành';
        progressDiv.appendChild(progressText);
        
        if (lesson.lastScore) {
            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'progress-score';
            scoreSpan.textContent = `${lesson.lastScore}/${lesson.lastTotalPoints}`;
            progressDiv.appendChild(scoreSpan);
        }
        
        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(progressDiv);
    } else {
        const actionDiv = document.createElement('div');
        actionDiv.className = 'lesson-action';
        actionDiv.textContent = 'Bắt đầu học';
        
        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(actionDiv);
    }
    
    card.appendChild(imageDiv);
    card.appendChild(contentDiv);
    
    return card;
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
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;
    }

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}"
                          onclick="goToPage(${i})">${i}</button>`;
    }

    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;
    }

    paginationContainer.innerHTML = paginationHTML;
}

// --- Pagination Helper Function ---
async function goToPage(page) {
    currentPage = page;
    try {
        await loadLessons(currentPage, currentSearch, currentSort, currentTags);
    } catch (error) {
        console.error('Error loading page:', error);
    }
}

// --- Filter and Render Lessons Function ---
async function filterAndRenderLessons() {
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');

    // Update global state
    currentSearch = searchInput ? searchInput.value : '';
    currentSort = sortSelect ? sortSelect.value : 'order';
    currentPage = 1; // Reset to first page when filtering

    try {
        await loadLessons(currentPage, currentSearch, currentSort, currentTags);
    } catch (error) {
        console.error('Error filtering lessons:', error);
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    showLoader(true);

    // Parse URL parameters for initial tag filtering
    const urlParams = new URLSearchParams(window.location.search);
    const tagsParam = urlParams.get('tags');
    if (tagsParam) {
        currentTags = tagsParam.split(',').map(tag => tag.trim()).filter(tag => tag);
        console.log('Initial tags from URL:', currentTags);
    }

    // Initialize lessons listing
    initializeLessons();

    // Load dynamic tags
    loadTags();

    // Set up search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterAndRenderLessons, 300));
    }

    // Set up sort functionality
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            currentPage = 1; // Reset to first page when sorting
            filterAndRenderLessons();
        });
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

// --- Get lesson image URL function ---
function getLessonImageUrl(lessonId) {
    return `/lesson_images/${lessonId}.jpg`;
}

// --- Lesson Confirmation Functions ---
function showLessonConfirmation(lessonId, lessonTitle, subject, grade, views, lessonImageUrl) {
    const modal = document.getElementById('lesson-confirmation-modal');
    const titleEl = document.getElementById('confirmation-lesson-title');
    const subjectEl = document.getElementById('confirmation-lesson-subject');
    const gradeEl = document.getElementById('confirmation-lesson-grade');
    const viewsEl = document.getElementById('confirmation-lesson-views');
    const imageEl = document.getElementById('confirmation-lesson-image');
    const imagePlaceholderEl = document.getElementById('confirmation-lesson-image-placeholder');
    const startBtn = document.getElementById('confirm-start-lesson');
    
    // Update modal content
    titleEl.textContent = lessonTitle;
    subjectEl.textContent = subject || 'Vật lý';
    gradeEl.textContent = grade || '12';
    viewsEl.textContent = views.toLocaleString();
    
    // Set lesson image using the actual image URL from the API response
    if (lessonImageUrl && lessonImageUrl !== '') {
        // We have an image URL from the API
        const tempImg = new Image();
        tempImg.onload = function() {
            // Image loaded successfully, show it and hide placeholder
            imageEl.src = lessonImageUrl;
            imageEl.alt = lessonTitle;
            imageEl.style.display = 'block';
            if (imagePlaceholderEl) {
                imagePlaceholderEl.style.display = 'none';
            }
        };
        tempImg.onerror = function() {
            // Image failed to load, show placeholder and hide image
            imageEl.style.display = 'none';
            if (imagePlaceholderEl) {
                imagePlaceholderEl.style.display = 'flex';
            }
        };
        tempImg.src = lessonImageUrl;
    } else {
        // No image URL provided, show placeholder
        imageEl.style.display = 'none';
        if (imagePlaceholderEl) {
            imagePlaceholderEl.style.display = 'flex';
        }
    }
    
    // Set up start button
    startBtn.onclick = () => {
        closeLessonConfirmation();
        window.location.href = `/lesson/${lessonId}`;
    };
    
    // Show modal
    modal.classList.add('active');
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeLessonConfirmation();
        }
    });
    
    // Close on escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeLessonConfirmation();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

function closeLessonConfirmation() {
    const modal = document.getElementById('lesson-confirmation-modal');
    modal.classList.remove('active');
}
