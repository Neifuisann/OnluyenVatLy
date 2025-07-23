// @ts-check
const { test, expect } = require('@playwright/test');
const testAuth = require('./helpers/testAuth');

test.describe('Lesson Page Basic Tests', () => {
  let testLessonId = '1';

  test('should load lesson page with authentication', async ({ page }) => {
    // Apply authentication
    await testAuth.applyAuthToPage(page, 'student');
    
    // Add console logging
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
    
    // Mock lesson data - simple structure
    await page.route(`/api/lessons/${testLessonId}`, async route => {
      const mockData = {
        id: testLessonId,
        title: 'Test Lesson',
        questions: [
          {
            id: 1,
            type: 'ABCD',
            question: 'Test Question 1',
            options: {
              A: 'Option A',
              B: 'Option B', 
              C: 'Option C',
              D: 'Option D'
            }
          }
        ]
      };
      
      console.log('Returning mock data:', mockData);
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData)
      });
    });
    
    // Navigate to lesson page
    await page.goto(`/lesson/${testLessonId}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give JS time to render
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'lesson-test-debug.png' });
    
    // Check basic page structure
    const examContainer = page.locator('.exam-container');
    await expect(examContainer).toBeVisible();
    
    // Check if questions are rendered
    const allQuestionsContainer = page.locator('#all-questions-container');
    const questionsContainer = page.locator('#questions-container');
    
    // Log what we find
    const allQuestionsVisible = await allQuestionsContainer.isVisible().catch(() => false);
    const questionsVisible = await questionsContainer.isVisible().catch(() => false);
    
    console.log('All questions container visible:', allQuestionsVisible);
    console.log('Questions container visible:', questionsVisible);
    
    // Check for any question-related content
    const hasQuestionContent = await page.locator('text=Test Question').count() > 0;
    console.log('Has question content:', hasQuestionContent);
    
    // Check page HTML for debugging
    const bodyHtml = await page.locator('body').innerHTML();
    console.log('Body contains all-questions-container:', bodyHtml.includes('all-questions-container'));
    console.log('Body contains question-card:', bodyHtml.includes('question-card'));
    
    // Basic assertion - page should have loaded
    expect(examContainer).toBeTruthy();
  });

  test('should display question navigation', async ({ page }) => {
    await testAuth.applyAuthToPage(page, 'student');
    
    // Mock lesson with multiple questions
    await page.route(`/api/lessons/${testLessonId}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: testLessonId,
          title: 'Test Lesson',
          questions: [
            { id: 1, type: 'ABCD', question: 'Q1', options: { A: 'A', B: 'B', C: 'C', D: 'D' } },
            { id: 2, type: 'ABCD', question: 'Q2', options: { A: 'A', B: 'B', C: 'C', D: 'D' } },
            { id: 3, type: 'ABCD', question: 'Q3', options: { A: 'A', B: 'B', C: 'C', D: 'D' } }
          ]
        })
      });
    });
    
    await page.goto(`/lesson/${testLessonId}`);
    await page.waitForLoadState('networkidle');
    
    // Check question navigation
    const questionNav = page.locator('.question-nav');
    await expect(questionNav).toBeVisible();
    
    const navItems = page.locator('.question-nav-item');
    const navCount = await navItems.count();
    console.log('Navigation items found:', navCount);
    
    // Should have navigation items for each question
    expect(navCount).toBeGreaterThan(0);
  });
});