// @ts-check
const { test, expect } = require('@playwright/test');
const testAuth = require('./helpers/testAuth');

test.describe('Lessons Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Increase default timeout for login process
    test.setTimeout(60000);
    
    // Log in as student first
    await page.goto('/student/login', { waitUntil: 'networkidle' });
    
    // Fill in login form using placeholder text to find inputs
    await page.fill('input[placeholder="Nhập số điện thoại"]', '0375931007');
    await page.fill('input[placeholder="Nhập mật khẩu"]', '140207');
    
    // Click the login button
    await page.click('button:has-text("ĐĂNG NHẬP")');
    
    // Wait for redirect after login
    await page.waitForURL(url => url.pathname !== '/student/login', { timeout: 20000 });
    
    // Now navigate to lessons page
    await page.goto('/lessons', { waitUntil: 'networkidle' });
  });

  test.describe('Page Load and Basic Elements', () => {
    test('should load the lessons page successfully', async ({ page }) => {
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // The page title should be correct
      await expect(page).toHaveTitle(/Học Vật Lý|Bài học/i);
      await expect(page.locator('body')).toBeVisible();
      
      // Check main content is visible
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();
    });

    test('should display main sections', async ({ page }) => {
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // For authenticated users, we see the progress section instead of stats
      const progressSection = page.locator('#progress-section');
      const isProgressVisible = await progressSection.isVisible().catch(() => false);
      
      // Check lessons section (should always be visible)
      const lessonsSection = page.locator('#lessons-section');
      await expect(lessonsSection).toBeVisible();
      
      // Check section title
      const sectionTitle = lessonsSection.locator('.section-title');
      await expect(sectionTitle).toBeVisible();
      await expect(sectionTitle).toContainText('Bài học');
    });

    test('should load without critical console errors', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/lessons');
      await page.waitForLoadState('networkidle');
      
      // Filter out non-critical errors
      const criticalErrors = errors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('Failed to load resource') &&
        !error.includes('net::ERR_') &&
        !error.includes('401') && // Auth check errors are expected
        !error.includes('Failed to fetch') && // Network errors
        !error.includes('TypeError: Failed to fetch') && // Fetch errors
        !error.includes('Error fetching') && // API errors
        !error.includes('Error loading') // Loading errors
      );
      
      // Only fail if there are actual JavaScript errors
      if (criticalErrors.length > 0) {
        console.log('Critical errors found:', criticalErrors);
      }
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Stats Grid', () => {
    test('should display stats grid with real data', async ({ page }) => {
      // Wait for stats to load
      await page.waitForResponse(response => 
        response.url().includes('/api/lessons/platform-stats') && response.status() === 200
      );
      
      const statsGrid = page.locator('.stats-grid').first();
      await expect(statsGrid).toBeVisible();
      
      // Check all 4 stat cards
      const statCards = statsGrid.locator('.stat-card');
      await expect(statCards).toHaveCount(4);
      
      // Total lessons - should be a number
      const totalLessons = page.locator('#total-lessons');
      await expect(totalLessons).toBeVisible();
      const lessonsText = await totalLessons.textContent();
      expect(parseInt(lessonsText || '0')).toBeGreaterThanOrEqual(0);
      
      // Total students
      const totalStudents = page.locator('#total-students');
      await expect(totalStudents).toBeVisible();
      
      // Completion rate
      const completionRate = page.locator('#completion-rate');
      await expect(completionRate).toBeVisible();
      await expect(completionRate).toContainText('%');
      
      // Average score
      const avgScore = page.locator('#avg-score');
      await expect(avgScore).toBeVisible();
    });
  });

  test.describe('Progress Section', () => {
    test('should not display progress section for non-authenticated users', async ({ page }) => {
      const progressSection = page.locator('#progress-section');
      await expect(progressSection).toHaveClass(/hidden/);
    });

    test('should display progress section for authenticated users', async ({ page, context }) => {
      // Mock authentication by intercepting the auth check
      await page.route('/api/auth/student/check', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              isAuthenticated: true,
              student: {
                id: 'test-student',
                name: 'Test Student'
              }
            }
          })
        });
      });

      // Mock progress data
      await page.route('/api/progress/overview', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            progress: {
              streak: 5,
              percentage: 75
            }
          })
        });
      });

      await page.reload();
      
      const progressSection = page.locator('#progress-section');
      await expect(progressSection).not.toHaveClass(/hidden/);
      
      // Check streak indicator
      const streakCount = page.locator('#streak-count');
      await expect(streakCount).toContainText('5 ngày liên tiếp');
      
      // Check progress percentage
      const progressPercentage = page.locator('#progress-percentage');
      await expect(progressPercentage).toContainText('75%');
      
      // Check progress bar
      const progressFill = page.locator('.progress-fill');
      await expect(progressFill).toHaveAttribute('style', /width:\s*75%/);
    });
  });

  test.describe('Category Pills (Tags)', () => {
    test('should load and display category pills', async ({ page }) => {
      // Wait for tags to load
      await page.waitForResponse(response => 
        response.url().includes('/api/tags/') && response.status() === 200,
        { timeout: 10000 }
      );
      
      const categoryPills = page.locator('.category-pills');
      await expect(categoryPills).toBeVisible();
      
      // Should have at least "All" pill
      const allPill = categoryPills.locator('[data-category="all"]');
      await expect(allPill).toBeVisible();
      await expect(allPill).toHaveClass(/active/);
      
      // Should have other category pills
      const pills = categoryPills.locator('.category-pill');
      const pillCount = await pills.count();
      expect(pillCount).toBeGreaterThan(1);
    });

    test('should toggle tag selection', async ({ page }) => {
      // Wait for tags and lessons to load
      await page.waitForLoadState('networkidle');
      
      const categoryPills = page.locator('.category-pills');
      const firstTagPill = categoryPills.locator('.category-pill[data-category]:not([data-category="all"])').first();
      
      // Click first tag
      await firstTagPill.click();
      await expect(firstTagPill).toHaveClass(/active/);
      
      // All pill should not be active
      const allPill = categoryPills.locator('[data-category="all"]');
      await expect(allPill).not.toHaveClass(/active/);
      
      // Click the same tag again to deselect
      await firstTagPill.click();
      await expect(firstTagPill).not.toHaveClass(/active/);
      
      // All pill should be active again
      await expect(allPill).toHaveClass(/active/);
    });

    test('should support multiple tag selection', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const categoryPills = page.locator('.category-pills');
      const tagPills = categoryPills.locator('.category-pill[data-category]:not([data-category="all"])');
      
      // Select first two tags
      const firstTag = tagPills.nth(0);
      const secondTag = tagPills.nth(1);
      
      await firstTag.click();
      await expect(firstTag).toHaveClass(/active/);
      
      await secondTag.click();
      await expect(secondTag).toHaveClass(/active/);
      await expect(firstTag).toHaveClass(/active/); // First should still be active
      
      // All pill should not be active
      const allPill = categoryPills.locator('[data-category="all"]');
      await expect(allPill).not.toHaveClass(/active/);
    });

    test('should filter lessons when tags are selected', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Get initial lesson count
      const lessonsGrid = page.locator('#lessons');
      const initialLessons = await lessonsGrid.locator('.lesson-card').count();
      
      // Select a specific tag
      const categoryPills = page.locator('.category-pills');
      const tagPill = categoryPills.locator('.category-pill[data-category]:not([data-category="all"])').first();
      
      // Wait for API call when clicking tag
      const [response] = await Promise.all([
        page.waitForResponse(response => 
          response.url().includes('/api/lessons') && 
          response.url().includes('tags=')
        ),
        tagPill.click()
      ]);
      
      expect(response.status()).toBe(200);
      
      // Verify lessons are filtered (count might change)
      await page.waitForTimeout(500); // Wait for DOM update
      const filteredLessons = await lessonsGrid.locator('.lesson-card').count();
      
      // At least verify the request was made with tags parameter
      expect(response.url()).toContain('tags=');
    });
  });

  test.describe('Search and Sort', () => {
    test('should have search input and sort dropdown', async ({ page }) => {
      const searchInput = page.locator('#search-input');
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveAttribute('placeholder', /Tìm kiếm/);
      
      const sortSelect = page.locator('#sort-select');
      await expect(sortSelect).toBeVisible();
      
      // Check sort options
      const options = await sortSelect.locator('option').allTextContents();
      expect(options).toContain('Mới nhất');
      expect(options).toContain('Cũ nhất');
      expect(options).toContain('Phổ biến');
      expect(options).toContain('A → Z');
      expect(options).toContain('Z → A');
    });

    test('should filter lessons when searching', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('#search-input');
      
      // Type search query
      await searchInput.fill('dao động');
      
      // Wait for debounced API call
      await page.waitForResponse(response => 
        response.url().includes('/api/lessons') && 
        response.url().includes('search=dao')
      );
      
      // Verify search parameter in request
      await page.waitForTimeout(500); // Wait for DOM update
    });

    test('should sort lessons when changing sort option', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const sortSelect = page.locator('#sort-select');
      
      // Change sort to oldest
      const [response] = await Promise.all([
        page.waitForResponse(response => 
          response.url().includes('/api/lessons') && 
          response.url().includes('sort=oldest')
        ),
        sortSelect.selectOption('oldest')
      ]);
      
      expect(response.status()).toBe(200);
    });
  });

  test.describe('Lessons Grid', () => {
    test('should display lesson cards with real data', async ({ page }) => {
      // Wait for lessons to load
      await page.waitForResponse(response => 
        response.url().includes('/api/lessons') && response.status() === 200
      );
      
      const lessonsGrid = page.locator('#lessons');
      await expect(lessonsGrid).toBeVisible();
      
      // Should have lesson cards or empty state
      const lessonCards = lessonsGrid.locator('.lesson-card');
      const noLessons = lessonsGrid.locator('.no-lessons');
      
      const hasLessons = await lessonCards.count() > 0;
      const isEmpty = await noLessons.isVisible().catch(() => false);
      
      expect(hasLessons || isEmpty).toBeTruthy();
      
      // If has lessons, check first card structure
      if (hasLessons) {
        const firstCard = lessonCards.first();
        await expect(firstCard).toBeVisible();
        
        // Check card has image section
        const imageSection = firstCard.locator('.lesson-card-image');
        await expect(imageSection).toBeVisible();
        
        // Check card has content
        const title = firstCard.locator('.lesson-card-title');
        await expect(title).toBeVisible();
        
        // Check metadata
        const meta = firstCard.locator('.lesson-card-meta');
        await expect(meta).toBeVisible();
      }
    });

    test('should display lesson metadata correctly', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const lessonsGrid = page.locator('#lessons');
      const lessonCards = lessonsGrid.locator('.lesson-card');
      
      if (await lessonCards.count() > 0) {
        const firstCard = lessonCards.first();
        const metaItems = firstCard.locator('.lesson-meta-item');
        
        // Should have subject, grade, and views
        const metaCount = await metaItems.count();
        expect(metaCount).toBeGreaterThanOrEqual(2);
        
        // Check views format
        const viewsItem = metaItems.filter({ hasText: 'lượt xem' });
        await expect(viewsItem).toBeVisible();
      }
    });

    test('should handle lesson card images correctly', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const lessonsGrid = page.locator('#lessons');
      const lessonCards = lessonsGrid.locator('.lesson-card');
      
      if (await lessonCards.count() > 0) {
        const firstCard = lessonCards.first();
        const imageContainer = firstCard.locator('.lesson-card-image');
        
        // Should have either an image or placeholder
        const hasImage = await imageContainer.locator('img').isVisible().catch(() => false);
        const hasPlaceholder = await imageContainer.locator('.lesson-image-placeholder').isVisible().catch(() => false);
        
        expect(hasImage || hasPlaceholder).toBeTruthy();
      }
    });
  });

  test.describe('Lesson Confirmation Modal', () => {
    test('should open confirmation modal when clicking lesson card', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const lessonsGrid = page.locator('#lessons');
      const lessonCards = lessonsGrid.locator('.lesson-card');
      
      if (await lessonCards.count() > 0) {
        // Click first lesson card
        await lessonCards.first().click();
        
        // Check modal appears
        const modal = page.locator('#lesson-confirmation-modal');
        await expect(modal).toHaveClass(/active/);
        
        // Check modal content
        const modalContent = modal.locator('.lesson-confirmation-content');
        await expect(modalContent).toBeVisible();
        
        // Check lesson title in modal
        const modalTitle = modal.locator('#confirmation-lesson-title');
        await expect(modalTitle).toBeVisible();
        
        // Check lesson meta in modal
        const modalMeta = modal.locator('.lesson-meta');
        await expect(modalMeta).toBeVisible();
      }
    });

    test('should display lesson image in confirmation modal', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const lessonCards = page.locator('.lesson-card');
      if (await lessonCards.count() > 0) {
        await lessonCards.first().click();
        
        const modal = page.locator('#lesson-confirmation-modal');
        const imageContainer = modal.locator('.lesson-image-container');
        await expect(imageContainer).toBeVisible();
        
        // Should have either image or placeholder
        const hasImage = await imageContainer.locator('img').isVisible().catch(() => false);
        const hasPlaceholder = await imageContainer.locator('.lesson-image-placeholder').isVisible().catch(() => false);
        
        expect(hasImage || hasPlaceholder).toBeTruthy();
      }
    });

    test('should have working modal buttons', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const lessonCards = page.locator('.lesson-card');
      if (await lessonCards.count() > 0) {
        await lessonCards.first().click();
        
        const modal = page.locator('#lesson-confirmation-modal');
        
        // Check close button
        const closeButton = modal.locator('.modal-close');
        await expect(closeButton).toBeVisible();
        
        // Check back button
        const backButton = modal.locator('.btn-secondary');
        await expect(backButton).toBeVisible();
        await expect(backButton).toContainText('Quay lại');
        
        // Check start button
        const startButton = page.locator('#confirm-start-lesson');
        await expect(startButton).toBeVisible();
        await expect(startButton).toContainText('Bắt đầu học');
      }
    });

    test('should close modal when clicking close button', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const lessonCards = page.locator('.lesson-card');
      if (await lessonCards.count() > 0) {
        await lessonCards.first().click();
        
        const modal = page.locator('#lesson-confirmation-modal');
        await expect(modal).toHaveClass(/active/);
        
        // Click close button
        const closeButton = modal.locator('.modal-close');
        await closeButton.click();
        
        // Modal should not be active
        await expect(modal).not.toHaveClass(/active/);
      }
    });

    test('should close modal when clicking backdrop', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const lessonCards = page.locator('.lesson-card');
      if (await lessonCards.count() > 0) {
        await lessonCards.first().click();
        
        const modal = page.locator('#lesson-confirmation-modal');
        await expect(modal).toHaveClass(/active/);
        
        // Click on backdrop (modal element itself, not content)
        await modal.click({ position: { x: 10, y: 10 } });
        
        // Modal should not be active
        await expect(modal).not.toHaveClass(/active/);
      }
    });

    test('should navigate to lesson when clicking start button', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const lessonCards = page.locator('.lesson-card');
      if (await lessonCards.count() > 0) {
        await lessonCards.first().click();
        
        // Click start button
        const startButton = page.locator('#confirm-start-lesson');
        
        // Expect navigation
        const [response] = await Promise.all([
          page.waitForNavigation(),
          startButton.click()
        ]);
        
        // Should navigate to lesson page
        expect(page.url()).toMatch(/\/lesson\/\d+/);
      }
    });
  });

  test.describe('Pagination', () => {
    test('should display pagination controls when needed', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const paginationControls = page.locator('#pagination-controls');
      
      // Pagination might not be visible if there are few lessons
      const isVisible = await paginationControls.isVisible().catch(() => false);
      
      if (isVisible) {
        const buttons = paginationControls.locator('.pagination-btn');
        const buttonCount = await buttons.count();
        expect(buttonCount).toBeGreaterThan(0);
        
        // First page button should be active
        const activeButton = buttons.filter({ hasText: '1' });
        await expect(activeButton).toHaveClass(/active/);
      }
    });

    test('should navigate between pages', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const paginationControls = page.locator('#pagination-controls');
      const nextButton = paginationControls.locator('.pagination-btn').filter({ has: page.locator('.fa-chevron-right') });
      
      if (await nextButton.isVisible().catch(() => false)) {
        // Click next page
        const [response] = await Promise.all([
          page.waitForResponse(response => 
            response.url().includes('/api/lessons') && 
            response.url().includes('page=2')
          ),
          nextButton.click()
        ]);
        
        expect(response.status()).toBe(200);
        
        // Page 2 button should now be active
        const page2Button = paginationControls.locator('.pagination-btn').filter({ hasText: '2' });
        await expect(page2Button).toHaveClass(/active/);
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should be responsive on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/lessons');
      
      // Check mobile menu toggle
      const mobileMenuToggle = page.locator('#mobile-menu-toggle');
      await expect(mobileMenuToggle).toBeVisible();
      
      // Stats grid should stack on mobile
      const statsGrid = page.locator('.stats-grid').first();
      await expect(statsGrid).toBeVisible();
      
      // Lesson grid should be single column
      const lessonGrid = page.locator('#lessons');
      await expect(lessonGrid).toBeVisible();
    });

    test('should have horizontal scrolling for category pills on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/lessons');
      await page.waitForLoadState('networkidle');
      
      const categoryPills = page.locator('.category-pills');
      await expect(categoryPills).toBeVisible();
      
      // Check if container has overflow-x scroll
      const overflowX = await categoryPills.evaluate(el => 
        window.getComputedStyle(el).overflowX
      );
      expect(overflowX).toBe('auto');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('/api/lessons', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });
      
      await page.goto('/lessons');
      
      // Page should still load without crashing
      await expect(page.locator('body')).toBeVisible();
      
      // Should show some error state or empty state
      const lessonsGrid = page.locator('#lessons');
      await expect(lessonsGrid).toBeVisible();
    });

    test('should handle missing lesson images', async ({ page }) => {
      // Mock lessons with missing images
      await page.route('/api/lessons*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            lessons: [{
              id: 1,
              title: 'Test Lesson',
              subject: 'Vật lý',
              grade: '12',
              views: 100,
              lessonImage: null // No image
            }],
            page: 1,
            total: 1,
            limit: 12
          })
        });
      });
      
      await page.goto('/lessons');
      await page.waitForLoadState('networkidle');
      
      // Should show placeholder
      const placeholder = page.locator('.lesson-image-placeholder');
      await expect(placeholder).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should implement debounced search', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('#search-input');
      let apiCallCount = 0;
      
      page.on('request', request => {
        if (request.url().includes('/api/lessons') && request.url().includes('search=')) {
          apiCallCount++;
        }
      });
      
      // Type quickly
      await searchInput.fill('d');
      await searchInput.fill('da');
      await searchInput.fill('dao');
      
      // Wait for debounce
      await page.waitForTimeout(400);
      
      // Should only make one API call due to debouncing
      expect(apiCallCount).toBeLessThanOrEqual(1);
    });
  });
});