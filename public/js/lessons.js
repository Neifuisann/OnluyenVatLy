// Global variables for lessons listing
let currentPage = 1;
let currentSearch = '';
let currentSort = 'newest';
let currentTags = [];
let allTags = [];
let availableTags = []; // Tags available for current selection
let isLoadingTags = false;
let completeTagsData = null; // Cache for complete tags data

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
        console.log('Loading complete tags data for lessons page...');
        const response = await fetch('/api/tags/complete?limit=8');
        if (!response.ok) throw new Error('Failed to fetch complete tags');

        const result = await response.json();
        if (result.success && result.tags && result.tagToLessons) {
            // Store complete tags data for client-side filtering
            completeTagsData = {
                tags: result.tags,
                tagToLessons: result.tagToLessons
            };
            allTags = result.tags;
            console.log('Loaded complete tags data for lessons:', allTags.length, 'tags');
            loadAvailableTags(); // Now uses client-side logic
            renderCategoryPills();
        } else {
            throw new Error('Invalid complete tags response format');
        }
    } catch (error) {
        console.error('Error loading complete tags:', error);
        console.log('Falling back to popular tags...');

        // Fallback to popular tags endpoint
        try {
            const fallbackResponse = await fetch('/api/tags/popular?limit=8');
            if (fallbackResponse.ok) {
                const popularResult = await fallbackResponse.json();
                if (popularResult.success && popularResult.tags) {
                    allTags = popularResult.tags;
                    // Without complete data, fall back to server-side intersection
                    completeTagsData = null;
                    console.log('Loaded fallback popular tags:', allTags);
                    await loadAvailableTagsServerSide();
                    renderCategoryPills();
                } else {
                    throw new Error('Popular tags fallback failed');
                }
            } else {
                throw new Error('Popular tags fallback also failed');
            }
        } catch (fallbackError) {
            console.error('Popular tags fallback failed:', fallbackError);
            // Final hardcoded fallback
            allTags = ['dao-dong', 'song-co', 'dien-xoay-chieu', 'dao-dong-dien-tu', 'song-anh-sang', 'luong-tu', 'hat-nhan']
                .map(tag => ({
                    tag,
                    lessonCount: 0,
                    totalViews: 0,
                    recentActivity: 0,
                    popularityScore: 0
                }));
            completeTagsData = null;
            console.log('Using hardcoded fallback tags');
            loadAvailableTags();
            renderCategoryPills();
        }
    } finally {
        isLoadingTags = false;
    }
}

// Client-side tag filtering using cached complete tags data
function loadAvailableTags() {
    if (!completeTagsData) {
        // Fallback to showing all tags if no complete data
        availableTags = allTags.slice();
        return;
    }

    if (currentTags.length === 0) {
        // No tags selected, show all popular tags
        availableTags = allTags.slice();
        return;
    }

    try {
        // Calculate intersection tags client-side
        const availableTagNames = calculateIntersectionTags(currentTags, completeTagsData);

        // Filter allTags to show only available ones
        availableTags = allTags.filter(tagData => {
            const tagName = typeof tagData === 'string' ? tagData : tagData.tag;
            return availableTagNames.has(tagName);
        });

        console.log('Calculated available tags client-side:', availableTags.map(t => typeof t === 'string' ? t : t.tag));
    } catch (error) {
        console.error('Error calculating available tags client-side:', error);
        availableTags = allTags.slice();
    }
}

// Server-side fallback for when complete tags data is not available
async function loadAvailableTagsServerSide() {
    if (currentTags.length === 0) {
        // No tags selected, show all popular tags
        availableTags = allTags.slice();
        return;
    }

    try {
        // Use the intersection endpoint for better performance
        const tagsParam = currentTags.join(',');
        const response = await fetch(`/api/tags/intersection?tags=${encodeURIComponent(tagsParam)}`);

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Combine selected tags with intersection tags
                const intersectionTagNames = data.intersectionTags.map(it => it.tag);
                const availableTagNames = new Set([...currentTags, ...intersectionTagNames]);

                // Filter allTags to show only available ones
                availableTags = allTags.filter(tagData => {
                    const tagName = typeof tagData === 'string' ? tagData : tagData.tag;
                    return availableTagNames.has(tagName);
                });

                console.log('Loaded available tags server-side:', availableTags.map(t => typeof t === 'string' ? t : t.tag));
                return;
            }
        }

        // Fallback to showing all tags if intersection API fails
        console.warn('Intersection tags API failed, showing all tags');
        availableTags = allTags.slice();
    } catch (error) {
        console.error('Error loading available tags server-side:', error);
        // Fallback to all tags
        availableTags = allTags.slice();
    }
}

// Client-side intersection calculation
function calculateIntersectionTags(selectedTags, tagData) {
    if (!selectedTags || selectedTags.length === 0) {
        return new Set(tagData.tags.map(t => typeof t === 'string' ? t : t.tag));
    }

    // Find lessons that contain ALL selected tags
    let commonLessons = null;
    selectedTags.forEach(tag => {
        const tagLessons = new Set(tagData.tagToLessons[tag] || []);
        if (commonLessons === null) {
            commonLessons = tagLessons;
        } else {
            // Intersection: keep only lessons that are in both sets
            commonLessons = new Set([...commonLessons].filter(x => tagLessons.has(x)));
        }
    });

    // Find all tags that appear in these common lessons
    const availableTagNames = new Set([...selectedTags]); // Always include selected tags

    if (commonLessons && commonLessons.size > 0) {
        Object.entries(tagData.tagToLessons).forEach(([tag, lessons]) => {
            // Check if this tag appears in any of the common lessons
            if (lessons.some(lessonId => commonLessons.has(lessonId))) {
                availableTagNames.add(tag);
            }
        });
    }

    return availableTagNames;
}

function renderCategoryPills() {
    const categoryPillsContainer = document.querySelector('.category-pills');
    if (!categoryPillsContainer) return;

    console.log('Rendering category pills with available tags:', availableTags);
    categoryPillsContainer.innerHTML = '';

    // Add "All" pill first
    const allPill = document.createElement('button');
    allPill.className = currentTags.length === 0 ? 'category-pill active' : 'category-pill';
    allPill.setAttribute('data-category', 'all');
    allPill.innerHTML = `
        <span class="tag-name">Tất cả</span>
    `;
    categoryPillsContainer.appendChild(allPill);

    // Show available tags (all tags when no selection, or related tags when something is selected)
    const tagsToShow = availableTags.slice(0, 12); // Show more tags to accommodate related ones
    tagsToShow.forEach(tagData => {
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
        pill.addEventListener('click', async (e) => {
            // Prevent context menu from interfering with normal clicks
            if (e.button !== 0) return;

            const category = pill.dataset.category;
            console.log('Category pill clicked:', category);

            // Update current tags
            if (category === 'all') {
                currentTags = [];
                console.log('Showing all lessons');
            } else {
                // Toggle tag selection
                const tagIndex = currentTags.indexOf(category);
                if (tagIndex > -1) {
                    // Tag is already selected, remove it
                    currentTags.splice(tagIndex, 1);
                    console.log('Removed tag:', category);
                } else {
                    // Tag is not selected, add it
                    currentTags.push(category);
                    console.log('Added tag:', category);
                }
            }

            // Load available tags based on current selection
            if (completeTagsData) {
                loadAvailableTags(); // Client-side, no await needed
            } else {
                await loadAvailableTagsServerSide(); // Fallback to server-side
            }

            // Re-render pills to show updated selection and available tags
            renderCategoryPills();

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

// --- Global Loading State Management ---
let globalLoadingTasks = {
    lessons: false,
    progress: false,
    stats: false
};

function updateGlobalLoader() {
    const allTasksComplete = Object.values(globalLoadingTasks).every(task => task === true);
    console.log('Global loading state:', globalLoadingTasks, 'All complete:', allTasksComplete);
    showLoader(!allTasksComplete);

    if (allTasksComplete) {
        console.log('🎉 All loading tasks completed - hiding global loader');
    }
}

function markTaskComplete(taskName) {
    globalLoadingTasks[taskName] = true;
    console.log(`Task '${taskName}' completed`);
    updateGlobalLoader();
}

// Expose function globally for HTML script access
window.markTaskComplete = markTaskComplete;

// --- Initialize Lessons Listing ---
async function initializeLessons() {
    // Check authentication (for potential future use)
    const isAuthenticated = await checkStudentAuthentication();

    // Reset global loading state
    globalLoadingTasks = {
        lessons: false,
        progress: !isAuthenticated, // Skip progress loading if not authenticated
        stats: false
    };

    console.log('🔄 Initializing lessons page with loading state:', globalLoadingTasks);
    showLoader(true);

    try {
        console.log('Loading lessons listing...');
        console.log('Initial sort value:', currentSort);

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

        await loadLessons(currentPage, currentSearch, currentSort, currentTags);
        markTaskComplete('lessons');

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
async function loadLessons(page = 1, search = '', sort = 'newest', tags = []) {
    try {
        // Show lesson grid loader
        showLessonGridLoader(true);

        console.log('🔍 Loading lessons with parameters:', { page, search, sort, tags });

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
        console.log('Data success:', data.success);
        console.log('Data lessons array:', data.lessons);
        console.log('Number of lessons:', data.lessons ? data.lessons.length : 'no lessons array');

        // Debug lesson images - ENHANCED DEBUGGING
        if (data.success && data.lessons && Array.isArray(data.lessons)) {
            console.log('=== ENHANCED LESSON IMAGE DEBUGGING ===');
            data.lessons.forEach((lesson, index) => {
                if (lesson.lessonImage) {
                    const imageLength = lesson.lessonImage.length;
                    const isDataURL = lesson.lessonImage.startsWith('data:');
                    const expectedSizeKB = Math.round(imageLength / 1024 * 100) / 100;
                    const isTruncated = isDataURL && imageLength < 1000; // Base64 images should be much larger

                    console.log(`🖼️ Lesson ${index + 1} (${lesson.title}):`, {
                        id: lesson.id,
                        lessonImageType: typeof lesson.lessonImage,
                        lessonImageLength: imageLength,
                        expectedSizeKB: expectedSizeKB,
                        startsWithData: isDataURL,
                        isTruncated: isTruncated,
                        firstChars: lesson.lessonImage.substring(0, 50) + '...',
                        lastChars: '...' + lesson.lessonImage.substring(lesson.lessonImage.length - 50),
                        endsCorrectly: lesson.lessonImage.endsWith('=') || lesson.lessonImage.endsWith('==')
                    });

                    if (isTruncated) {
                        console.warn(`⚠️ TRUNCATED IMAGE DETECTED for lesson ${lesson.title}! Only ${imageLength} chars (${expectedSizeKB}KB)`);
                    }
                } else {
                    console.log(`❌ Lesson ${index + 1} (${lesson.title}): NO IMAGE`);
                }
            });
            console.log('=== END LESSON IMAGE DEBUGGING ===');
        } else {
            console.log('No lessons data to debug');
        }

        if (data.success && data.lessons) {
            renderLessons(data.lessons);
            renderPagination(data.page, data.total, data.limit);
        } else {
            throw new Error('Invalid response format');
        }

    } catch (error) {
        console.error('Error loading lessons:', error);
        // Hide loader on error
        showLessonGridLoader(false);
        throw error;
    }
}

// --- Lesson Grid Loading Functions ---
function showLessonGridLoader(show = true) {
    const lessonsContainer = document.getElementById('lessons');
    if (!lessonsContainer) {
        console.error('Lessons container not found');
        return;
    }

    if (show) {
        // Add loading class and show loader
        lessonsContainer.classList.add('loading');
        lessonsContainer.innerHTML = `
            <div class="lesson-grid-loader">
                <div class="spinner"></div>
                <p class="loading-text">Đang tải bài học...</p>
            </div>
        `;
    } else {
        // Remove loading class
        lessonsContainer.classList.remove('loading');
    }
}

// --- Render Lessons Function ---
function renderLessons(lessons) {
    const lessonsContainer = document.getElementById('lessons');
    if (!lessonsContainer) {
        console.error('Lessons container not found');
        return;
    }

    // Hide loader and clear container
    showLessonGridLoader(false);
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
        // Don't truncate image data - base64 images can be very long
        const safeImage = String(lesson.lessonImage || '');

        console.log(`🔄 Passing image to confirmation modal for ${safeTitle}:`, {
            originalLength: lesson.lessonImage ? lesson.lessonImage.length : 0,
            safeImageLength: safeImage.length,
            isDataURL: safeImage.startsWith('data:'),
            lengthMatch: lesson.lessonImage ? (lesson.lessonImage.length === safeImage.length) : false,
            originalSizeKB: lesson.lessonImage ? Math.round(lesson.lessonImage.length / 1024 * 100) / 100 : 0,
            safeSizeKB: Math.round(safeImage.length / 1024 * 100) / 100,
            firstChars: safeImage.substring(0, 50) + '...',
            lastChars: '...' + safeImage.substring(safeImage.length - 50)
        });

        showLessonConfirmation(safeId, safeTitle, safeSubject, safeGrade, safeViews, safeImage);
    });
    
    // Create image section
    const imageDiv = document.createElement('div');
    imageDiv.className = 'lesson-card-image';
    
    if (lesson.lessonImage) {
        console.log(`Creating image for lesson ${lesson.title}:`, {
            originalImage: lesson.lessonImage.substring(0, 50) + '...',
            imageType: typeof lesson.lessonImage,
            imageLength: lesson.lessonImage.length,
            isDataURL: lesson.lessonImage.startsWith('data:'),
            firstChars: lesson.lessonImage.substring(0, 10)
        });

        // Check if this is a base64 data URL or a regular file path
        const isDataURL = lesson.lessonImage.startsWith('data:');
        console.log(`Is data URL check for ${lesson.title}: ${isDataURL}`);

        if (isDataURL) {
            // Handle base64 data URLs - use them directly without trying to create responsive versions
            const img = document.createElement('img');
            img.src = lesson.lessonImage;
            img.alt = lesson.title || 'Lesson image';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.style.width = '100%';
            img.style.height = 'auto';

            console.log('Using base64 data URL directly');

            img.onerror = function() {
                console.log('Base64 image failed to load');
                // Show placeholder if base64 fails
                this.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.className = 'lesson-image-placeholder';
                const placeholderIcon = document.createElement('i');
                placeholderIcon.className = 'fas fa-book';
                placeholder.appendChild(placeholderIcon);
                this.parentNode.appendChild(placeholder);
            };

            imageDiv.appendChild(img);
        } else {
            // Handle regular file paths with responsive images
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

            console.log('WebP srcset:', webpSource.srcset);

            // Fallback JPEG image
            const img = document.createElement('img');
            img.src = lesson.lessonImage;
            img.alt = lesson.title || 'Lesson image';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.style.width = '100%';
            img.style.height = 'auto';

            console.log('Fallback image src:', img.src);

            // Add error handling for missing optimized images
            img.onerror = function() {
                console.log('Image failed to load:', this.src);
                // Fallback to original image if optimized versions fail
                this.src = lesson.lessonImage;
                this.onerror = null; // Prevent infinite loop
            };

            picture.appendChild(webpSource);
            picture.appendChild(img);
            imageDiv.appendChild(picture);
        }
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
function renderPagination(current, total, limit) {
    const pageNumbersTop = document.getElementById('page-numbers-top');
    const pageNumbersBottom = document.getElementById('page-numbers-bottom');
    
    if (!pageNumbersTop || !pageNumbersBottom) return;
    
    const totalPages = Math.ceil(total / limit);
    
    // Clear existing page numbers
    pageNumbersTop.innerHTML = '';
    pageNumbersBottom.innerHTML = '';
    
    if (totalPages <= 1) {
        // Disable all navigation buttons
        document.getElementById('prev-page').disabled = true;
        document.getElementById('next-page').disabled = true;
        document.getElementById('prev-page-top').disabled = true;
        document.getElementById('next-page-top').disabled = true;
        return;
    }
    
    // Generate page numbers
    let pages = [];
    
    if (totalPages <= 7) {
        // Show all pages if total is 7 or less
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        // Always show first page
        pages.push(1);
        
        if (current > 3) {
            pages.push('...');
        }
        
        // Show pages around current
        let start = Math.max(2, current - 1);
        let end = Math.min(totalPages - 1, current + 1);
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        if (current < totalPages - 2) {
            pages.push('...');
        }
        
        // Always show last page
        pages.push(totalPages);
    }
    
    // Create buttons for both pagination controls
    pages.forEach(page => {
        // Top pagination
        const btnTop = document.createElement('button');
        if (page === '...') {
            btnTop.className = 'page-btn ellipsis';
            btnTop.textContent = '...';
            btnTop.disabled = true;
        } else {
            btnTop.className = page === current ? 'page-btn active' : 'page-btn';
            btnTop.textContent = page;
            btnTop.addEventListener('click', () => goToPage(page));
        }
        pageNumbersTop.appendChild(btnTop);
        
        // Bottom pagination (clone)
        const btnBottom = btnTop.cloneNode(true);
        if (page !== '...') {
            btnBottom.addEventListener('click', () => goToPage(page));
        }
        pageNumbersBottom.appendChild(btnBottom);
    });
    
    // Update navigation buttons state
    document.getElementById('prev-page').disabled = current === 1;
    document.getElementById('prev-page-top').disabled = current === 1;
    document.getElementById('next-page').disabled = current === totalPages;
    document.getElementById('next-page-top').disabled = current === totalPages;
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
    currentSort = sortSelect ? sortSelect.value : 'newest';
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
    
    // Set up pagination event listeners
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const prevPageTopBtn = document.getElementById('prev-page-top');
    const nextPageTopBtn = document.getElementById('next-page-top');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                goToPage(currentPage - 1);
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (!nextPageBtn.disabled) {
                goToPage(currentPage + 1);
            }
        });
    }
    
    if (prevPageTopBtn) {
        prevPageTopBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                goToPage(currentPage - 1);
            }
        });
    }
    
    if (nextPageTopBtn) {
        nextPageTopBtn.addEventListener('click', () => {
            if (!nextPageTopBtn.disabled) {
                goToPage(currentPage + 1);
            }
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
    return `/lesson_handout/${lessonId}.jpg`;
}

// --- Lesson Confirmation Functions ---
function showLessonConfirmation(lessonId, lessonTitle, subject, grade, views, lessonImageUrl) {
    const modal = document.getElementById('lesson-confirmation-modal');
    const titleEl = document.getElementById('confirmation-lesson-title');
    const subjectEl = document.getElementById('confirmation-lesson-subject');
    const gradeEl = document.getElementById('confirmation-lesson-grade');
    const viewsEl = document.getElementById('confirmation-lesson-views');
    const startBtn = document.getElementById('confirm-start-lesson');
    
    // Update modal content
    titleEl.textContent = lessonTitle;
    subjectEl.textContent = subject || 'Vật lý';
    gradeEl.textContent = grade || '12';
    viewsEl.textContent = views.toLocaleString();
    
    // Set lesson image using EXACTLY the same logic as lesson cards
    const imageContainer = modal.querySelector('.lesson-image-container');

    // Clear the container first (remove existing img and placeholder elements)
    console.log('Clearing image container for confirmation modal');
    imageContainer.innerHTML = '';

    if (lessonImageUrl && lessonImageUrl !== '') {
        console.log(`Creating confirmation modal image for ${lessonTitle}:`, {
            originalImage: lessonImageUrl.substring(0, 50) + '...',
            imageType: typeof lessonImageUrl,
            imageLength: lessonImageUrl.length,
            isDataURL: lessonImageUrl.startsWith('data:'),
            firstChars: lessonImageUrl.substring(0, 10),
            expectedSizeKB: Math.round(lessonImageUrl.length / 1024 * 100) / 100
        });

        // Check if this is a base64 data URL or a regular file path
        const isDataURL = lessonImageUrl.startsWith('data:');
        console.log(`Is data URL check for confirmation modal: ${isDataURL}`);

        if (isDataURL) {
            // Handle base64 data URLs - use them directly without trying to create responsive versions
            const img = document.createElement('img');
            img.src = lessonImageUrl;
            img.alt = lessonTitle || 'Lesson image';
            img.className = 'lesson-image';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.style.width = '100%';
            img.style.height = 'auto';

            console.log('Using base64 data URL directly for confirmation modal');

            img.onerror = function() {
                console.log('Base64 image failed to load in confirmation modal');
                // Show placeholder if base64 fails
                this.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.className = 'lesson-image-placeholder';
                const placeholderIcon = document.createElement('i');
                placeholderIcon.className = 'fas fa-book';
                placeholder.appendChild(placeholderIcon);
                this.parentNode.appendChild(placeholder);
            };

            imageContainer.appendChild(img);
            console.log('Base64 image appended to confirmation modal container');
        } else {
            // Handle regular file paths with responsive images
            const picture = document.createElement('picture');

            // WebP source with responsive sizes
            const webpSource = document.createElement('source');
            const imageBase = lessonImageUrl.replace('.jpg', '').replace('.jpeg', '').replace('.png', '');
            webpSource.type = 'image/webp';
            webpSource.srcset = `
                ${imageBase}-sm.webp 400w,
                ${imageBase}-md.webp 800w,
                ${imageBase}-lg.webp 1200w
            `;
            webpSource.sizes = '(max-width: 768px) 400px, (max-width: 1024px) 800px, 1200px';

            console.log('WebP srcset for confirmation modal:', webpSource.srcset);

            // Fallback JPEG image
            const img = document.createElement('img');
            img.src = lessonImageUrl;
            img.alt = lessonTitle || 'Lesson image';
            img.className = 'lesson-image';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.style.width = '100%';
            img.style.height = 'auto';

            console.log('Fallback image src for confirmation modal:', img.src);

            // Add error handling for missing optimized images
            img.onerror = function() {
                console.log('Image failed to load in confirmation modal:', this.src);
                // Fallback to original image if optimized versions fail
                this.src = lessonImageUrl;
                this.onerror = null; // Prevent infinite loop
            };

            picture.appendChild(webpSource);
            picture.appendChild(img);
            imageContainer.appendChild(picture);
            console.log('Picture element with responsive images appended to confirmation modal container');
        }
    } else {
        // No image URL provided, show placeholder
        console.log('No image URL provided for confirmation modal, showing placeholder');
        const placeholder = document.createElement('div');
        placeholder.className = 'lesson-image-placeholder';
        const placeholderIcon = document.createElement('i');
        placeholderIcon.className = 'fas fa-book';
        placeholder.appendChild(placeholderIcon);
        imageContainer.appendChild(placeholder);
        console.log('Placeholder appended to confirmation modal container');
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
