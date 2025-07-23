// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Landing Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the landing page successfully', async ({ page }) => {
    await expect(page).toHaveTitle('Ôn luyện Vật lí 12 - Next Gen Learning');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display the header navigation', async ({ page }) => {
    const header = page.locator('header, nav, .navbar, .header');
    await expect(header).toBeVisible();
    
    // Check for logo or brand name
    const logo = page.locator('.nav-logo').first();
    await expect(logo).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    // Check for lessons link
    const lessonsLink = page.locator('a[href="/lessons"]').first();
    await expect(lessonsLink).toBeVisible();
    
    // Check for leaderboard link
    const leaderboardLink = page.locator('a[href="/leaderboard"]').first();
    await expect(leaderboardLink).toBeVisible();
    
    // Check for profile link
    const profileLink = page.locator('a[href="/profile"]').first();
    await expect(profileLink).toBeVisible();
  });

  test('should display main content sections', async ({ page }) => {
    // Check for hero/banner section
    const heroSection = page.locator('.hero, .banner, section').first();
    await expect(heroSection).toBeVisible();
    
    // Check for main heading
    const mainHeading = page.locator('h1.hero-title').first();
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Khám phá Vật lý 12');
  });

  test('should have feature or benefit sections', async ({ page }) => {
    // Check for features/benefits section
    const features = page.locator('.features, .benefits, .services, section:has(h2)');
    const featureCount = await features.count();
    expect(featureCount).toBeGreaterThan(0);
  });

  test('should have main sections', async ({ page }) => {
    // Check for features section instead of footer
    const featuresSection = page.locator('.features-section');
    await expect(featuresSection).toBeVisible();
    
    // Check for showcase section
    const showcaseSection = page.locator('.showcase-section');
    const showcaseSectionExists = await showcaseSection.count() > 0;
    expect(showcaseSectionExists).toBeTruthy();
  });

  test('should navigate to lessons page when clicking CTA button', async ({ page }) => {
    const ctaButton = page.locator('a.cta-button[href="/lessons"]').first();
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toContainText('Bắt đầu học ngay');
    
    // Click should redirect to login since user is not authenticated
    await ctaButton.click();
    
    // Should be redirected to login page
    await page.waitForURL('**/login**');
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login when accessing protected routes', async ({ page }) => {
    // Try to access profile page
    const profileLink = page.locator('a[href="/profile"]').first();
    await profileLink.click();
    
    // Should be redirected to login page
    await page.waitForURL('**/login**');
    await expect(page).toHaveURL(/login/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if navigation is still accessible (might be in hamburger menu)
    const navToggle = page.locator('.menu-toggle, .hamburger, button[aria-label*="menu"], .navbar-toggler');
    const isNavToggleVisible = await navToggle.isVisible().catch(() => false);
    
    if (isNavToggleVisible) {
      await navToggle.click();
      // Check if menu opens
      const mobileMenu = page.locator('.mobile-menu, .nav-menu, .navbar-collapse');
      await expect(mobileMenu).toBeVisible();
    }
    
    // Content should still be visible
    const mainContent = page.locator('main, .main-content, .container').first();
    await expect(mainContent).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    // Check for viewport meta tag (meta description doesn't exist)
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
    
    // Check for charset
    const charset = page.locator('meta[charset]');
    await expect(charset).toHaveAttribute('charset', 'UTF-8');
  });

  test('should load without critical console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Allow for some common non-critical errors including stats fetch
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('Failed to load resource') &&
      !error.includes('net::ERR_') &&
      !error.includes('Error loading stats') && // Stats API might not be available
      !error.includes('Failed to fetch')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should have accessible elements', async ({ page }) => {
    // Check for alt text on images (if any)
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const altText = await img.getAttribute('alt');
        // Icons might not have alt text, that's ok
        const src = await img.getAttribute('src');
        if (!src?.includes('icon') && !src?.includes('fa-')) {
          expect(altText).toBeTruthy();
        }
      }
    }
    
    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    expect(h1Count).toBeLessThanOrEqual(1); // Should have only one h1
    
    // Check for form labels (modal inputs might appear dynamically)
    const visibleInputs = page.locator('input:visible:not([type="hidden"]), select:visible, textarea:visible');
    const inputCount = await visibleInputs.count();
    
    if (inputCount > 0) {
      for (let i = 0; i < inputCount; i++) {
        const input = visibleInputs.nth(i);
        const id = await input.getAttribute('id');
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const labelExists = await label.count() > 0;
          const ariaLabel = await input.getAttribute('aria-label');
          const placeholder = await input.getAttribute('placeholder');
          const type = await input.getAttribute('type');
          
          // Skip validation for certain input types
          if (type !== 'submit' && type !== 'button') {
            // Input should have either a label, aria-label, or placeholder
            expect(labelExists || ariaLabel || placeholder).toBeTruthy();
          }
        }
      }
    }
  });

  test('should load page resources successfully', async ({ page }) => {
    const responses = [];
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status()
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check critical resources loaded successfully
    const criticalResources = responses.filter(r => 
      (r.url.includes('.js') || r.url.includes('.css')) && 
      !r.url.includes('analytics') &&
      !r.url.includes('tracking')
    );
    
    const failedResources = criticalResources.filter(r => r.status >= 400);
    expect(failedResources).toHaveLength(0);
  });

  test('should have working internal links', async ({ page }) => {
    // Get all internal links
    const links = page.locator('a[href^="/"], a[href^="#"]');
    const linkCount = await links.count();
    
    // Test a sample of links (max 5 to keep test fast)
    const linksToTest = Math.min(linkCount, 5);
    
    for (let i = 0; i < linksToTest; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      
      if (href && href !== '#' && !href.includes('logout')) {
        const isVisible = await link.isVisible();
        if (isVisible) {
          // Click and verify navigation
          await link.click();
          await page.waitForLoadState('domcontentloaded');
          
          // Verify page loaded without 404
          const pageTitle = await page.title();
          expect(pageTitle).not.toContain('404');
          expect(pageTitle).not.toContain('Not Found');
          
          // Go back to landing page for next test
          await page.goto('/');
        }
      }
    }
  });
});