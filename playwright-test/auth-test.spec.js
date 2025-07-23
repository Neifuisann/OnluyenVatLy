// @ts-check
const { test, expect } = require('@playwright/test');
const testAuth = require('./helpers/testAuth');

test.describe('Authenticated Tests Example', () => {
  test.describe('Student Authentication', () => {
    test('should access student-only pages without login', async ({ page }) => {
      // Apply student authentication to the page
      await testAuth.applyAuthToPage(page, 'student');
      
      // Now navigate - should bypass login
      const response = await page.goto('/lessons');
      
      // Verify we got a successful response
      expect(response.status()).toBe(200);
      
      // Verify we're on the lessons page (not redirected to login)
      await expect(page).toHaveURL(/\/lessons/);
      
      // Check that we're not on login or error page
      await expect(page).not.toHaveURL(/login/);
      await expect(page).not.toHaveURL(/\?error=/);
    });

    test('should access quiz without authentication prompt', async ({ page }) => {
      // Apply student authentication
      await testAuth.applyAuthToPage(page, 'student');
      
      // Navigate to a lesson
      await page.goto('/lesson/1');
      
      // Should not be redirected to login
      await expect(page).not.toHaveURL(/login/);
      await expect(page).not.toHaveURL(/\?error=no_student_info/);
    });
  });

  test.describe('Admin Authentication', () => {
    test('should access admin pages without login', async ({ page }) => {
      // Apply admin authentication
      await testAuth.applyAuthToPage(page, 'admin');
      
      // Navigate to admin dashboard
      await page.goto('/admin');
      
      // Should not be redirected to login
      await expect(page).toHaveURL(/\/admin/);
      
      // Verify admin content is visible
      const adminContent = page.locator('.admin-dashboard');
      await expect(adminContent).toBeVisible();
    });

    test('should access admin API endpoints', async ({ page, context }) => {
      // Apply admin authentication
      const headers = await testAuth.applyAuthToPage(page, 'admin');
      
      // Navigate to an admin page first to establish session
      await page.goto('/admin');
      await expect(page).toHaveURL(/\/admin/);
      
      // Get cookies from the page context
      const cookies = await context.cookies();
      
      // Make an admin API request with proper headers and cookies
      const response = await context.request.get('/api/admin/dashboard-stats', {
        headers: {
          ...headers,
          'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; ')
        }
      });
      
      // Log response details for debugging
      if (!response.ok()) {
        console.log('Response status:', response.status());
        console.log('Response headers:', response.headers());
        const body = await response.text();
        console.log('Response body:', body);
      }
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
    });
  });

  test.describe('Authenticated Context Example', () => {
    test('should maintain authentication across multiple pages', async ({ browser }) => {
      // Create a pre-authenticated context
      const context = await testAuth.createAuthenticatedContext(browser, 'student');
      const page = await context.newPage();
      
      // Navigate to multiple protected pages
      await page.goto('/lessons');
      await expect(page).toHaveURL(/\/lessons/);
      
      // Check if lesson exists first
      const lessonResponse = await page.goto('/lesson/1');
      if (!lessonResponse.ok()) {
        // If lesson doesn't exist, just verify we're not redirected to login
        await expect(page).not.toHaveURL(/login/);
      } else {
        await expect(page).not.toHaveURL(/login/);
      }
      
      await page.goto('/progress');
      await expect(page).not.toHaveURL(/login/);
      
      // Cleanup
      await context.close();
    });
  });

  test.describe('Using authenticatedGoto helper', () => {
    test('should navigate with authentication in one step', async ({ page }) => {
      // Navigate with authentication applied
      const response = await testAuth.authenticatedGoto(page, '/lessons', 'student');
      
      // Verify successful navigation
      expect(response.ok()).toBeTruthy();
      await expect(page).toHaveURL(/\/lessons/);
      
      // Verify content loaded by checking we're not on error page
      await expect(page).not.toHaveTitle(/Error/);
      await expect(page).not.toHaveURL(/error/);
    });
  });
});